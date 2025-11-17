import { createTRPCReact } from "@trpc/react-query";
import { httpLink, createTRPCClient } from "@trpc/client";
import Constants from "expo-constants";
import { Platform } from "react-native";
import type { AppRouter } from "../backend/trpc/app-router";
import { getSecureItem } from "../utils/secureStorage";
import superjson from "superjson";

type ExpoConfigShape = {
  hostUri?: string;
  debuggerHost?: string;
  extra?: Record<string, unknown>;
};

type ExpoGoConfigShape = {
  debuggerHost?: string;
  hostUri?: string;
};

const sanitizeUrl = (url: string) => url.replace(/\/+$/, "");

const getExpoConfig = (): ExpoConfigShape | undefined => {
  const expoConfig = (Constants as unknown as { expoConfig?: ExpoConfigShape }).expoConfig;
  if (expoConfig) {
    return expoConfig;
  }
  return (Constants as unknown as { manifest?: ExpoConfigShape }).manifest;
};

const getExpoGoConfig = (): ExpoGoConfigShape | undefined => {
  return (Constants as unknown as { expoGoConfig?: ExpoGoConfigShape }).expoGoConfig;
};

const collectDevHosts = (): string[] => {
  const hosts: string[] = [];
  const expoConfig = getExpoConfig();
  if (expoConfig?.debuggerHost) {
    hosts.push(expoConfig.debuggerHost);
  }
  if (expoConfig?.hostUri) {
    hosts.push(expoConfig.hostUri);
  }
  const expoGoConfig = getExpoGoConfig();
  if (expoGoConfig?.debuggerHost) {
    hosts.push(expoGoConfig.debuggerHost);
  }
  if (expoGoConfig?.hostUri) {
    hosts.push(expoGoConfig.hostUri);
  }
  return hosts;
};

const normalizeHostCandidate = (candidate: string): string | null => {
  const trimmed = candidate.trim();
  if (!trimmed) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return sanitizeUrl(trimmed);
  }
  const cleaned = trimmed.replace(/^exp:\/\//i, "");
  if (!cleaned) {
    return null;
  }
  if (cleaned.includes("exp.direct")) {
    const hostOnly = cleaned.split("?")[0];
    return sanitizeUrl(`https://${hostOnly}`);
  }
  const [host, port] = cleaned.split(":");
  if (!host) {
    return null;
  }
  const isLocal = host.includes("localhost") || host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.");
  const protocol = isLocal ? "http" : "https";
  if (port) {
    return sanitizeUrl(`${protocol}://${host}:${port}`);
  }
  return sanitizeUrl(`${protocol}://${host}`);
};

const resolveDevHost = (): string | null => {
  const potentialHosts = collectDevHosts();
  for (const candidate of potentialHosts) {
    const normalized = normalizeHostCandidate(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return null;
};

const resolveBaseUrl = (): string => {
  const normalizedCandidates: string[] = [];
  const seen = new Set<string>();

  const pushCandidate = (value: unknown) => {
    if (typeof value !== "string" || value.trim().length === 0) {
      return;
    }
    const normalized = normalizeHostCandidate(value);
    if (normalized && !seen.has(normalized)) {
      normalizedCandidates.push(normalized);
      seen.add(normalized);
    }
  };

  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL;
  pushCandidate(envUrl);

  const expoConfig = getExpoConfig();
  const extra = expoConfig?.extra as Record<string, unknown> | undefined;
  if (extra) {
    const rorkExtra = extra.rork as Record<string, unknown> | undefined;
    if (rorkExtra) {
      pushCandidate(rorkExtra.backendUrl);
      pushCandidate(rorkExtra.apiBaseUrl);
    }
    pushCandidate(extra.apiBaseUrl);
  }

  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    pushCandidate(window.location.origin);
  }

  pushCandidate(resolveDevHost());

  if (normalizedCandidates.length > 0) {
    console.log("🔗 tRPC Base URL resolved:", normalizedCandidates[0]);
    return normalizedCandidates[0];
  }

  throw new Error("No base url found. Set EXPO_PUBLIC_RORK_API_BASE_URL or configure an API base URL in Expo config.");
};

const BASE_URL = resolveBaseUrl();

const buildTrpcUrl = (baseUrl: string): string => {
  try {
    const parsed = new URL(baseUrl);
    const pathname = parsed.pathname.replace(/\/+$/, "");

    if (pathname.endsWith("/api/trpc")) {
      return `${parsed.origin}${pathname}`;
    }

    if (pathname.endsWith("/api")) {
      return `${parsed.origin}${pathname}/trpc`;
    }

    if (pathname.length === 0) {
      return `${parsed.origin}/api/trpc`;
    }

    return `${parsed.origin}${pathname}/api/trpc`;
  } catch (error) {
    console.error("❌ Failed to build tRPC URL from base", baseUrl, error);
    return `${baseUrl.replace(/\/+$/, "")}/api/trpc`;
  }
};

const TRPC_URL = buildTrpcUrl(BASE_URL);
console.log("🔗 tRPC Endpoint URL:", TRPC_URL);

const toRequestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return (input as Request).url;
};

const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = toRequestUrl(input);
  console.log("🚀 tRPC Request:", {
    url,
    method: init?.method,
  });

  try {
    const headers: Record<string, string> = {};
    
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, init.headers);
      }
    }
    
    headers["content-type"] = "application/json";

    const response = await fetch(input, {
      ...init,
      credentials: 'include',
      headers,
    });

    console.log("📡 tRPC Response:", {
      url,
      status: response.status,
      contentType: response.headers.get("content-type"),
    });

    if (!response.ok) {
      const text = await response.clone().text();
      console.error("❌ Response error:", {
        status: response.status,
        body: text.substring(0, 300),
      });
    }

    return response;
  } catch (error) {
    console.error("❌ Fetch error:", error);
    throw error;
  }
};

const createLinks = () => [
  httpLink({
    url: TRPC_URL,
    fetch: customFetch,
    transformer: superjson,
    async headers() {
      const token = await getSecureItem("mikel_auth_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers.authorization = `Bearer ${token}`;
      }
      return headers;
    },
  }),
];

export const trpc = createTRPCReact<AppRouter>({
  transformer: superjson,
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: createLinks(),
});

export function getTRPCClientOptions() {
  return {
    links: createLinks(),
  };
}
