import { createTRPCReact, httpLink as httpLinkReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import Constants from "expo-constants";
import { Platform } from "react-native";
import type { AppRouter } from "../backend/trpc/app-router";
import { getSecureItem } from "../utils/secureStorage";

type ExpoConfigShape = {
  hostUri?: string;
  debuggerHost?: string;
  extra?: Record<string, unknown>;
};

type ExpoGoConfigShape = {
  debuggerHost?: string;
  hostUri?: string;
};

export const trpc = createTRPCReact<AppRouter>();

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

const collectPotentialHosts = (): string[] => {
  const hosts: string[] = [];
  const expoConfig = getExpoConfig();
  if (expoConfig?.hostUri) {
    hosts.push(expoConfig.hostUri);
  }
  if (expoConfig?.debuggerHost) {
    hosts.push(expoConfig.debuggerHost);
  }
  const extra = expoConfig?.extra;
  if (extra) {
    const apiBaseUrl = typeof extra.apiBaseUrl === "string" ? extra.apiBaseUrl : undefined;
    if (apiBaseUrl) {
      hosts.push(apiBaseUrl);
    }
    const rorkExtra = extra.rork as Record<string, unknown> | undefined;
    if (rorkExtra) {
      const rorkApi = typeof rorkExtra.apiBaseUrl === "string" ? rorkExtra.apiBaseUrl : undefined;
      if (rorkApi) {
        hosts.push(rorkApi);
      }
      const backendUrl = typeof rorkExtra.backendUrl === "string" ? rorkExtra.backendUrl : undefined;
      if (backendUrl) {
        hosts.push(backendUrl);
      }
    }
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
  const potentialHosts = collectPotentialHosts();
  for (const candidate of potentialHosts) {
    const normalized = normalizeHostCandidate(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return null;
};

const resolveBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return sanitizeUrl(envUrl.trim());
  }
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    return sanitizeUrl(window.location.origin);
  }
  const devHost = resolveDevHost();
  if (devHost) {
    return devHost;
  }
  throw new Error("No base url found. Set EXPO_PUBLIC_RORK_API_BASE_URL or configure an API base URL in Expo config.");
};

const BASE_URL = resolveBaseUrl();

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
    headers: init?.headers,
  });

  const response = await fetch(input, {
    ...init,
    headers: {
      ...init?.headers,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  console.log("📡 tRPC Response:", {
    url,
    status: response.status,
    contentType: response.headers.get("content-type"),
  });

  try {
    const previewClone = response.clone();
    const previewText = await previewClone.text();
    console.log("📝 Response body (first 200 chars):", previewText.substring(0, 200));
    if (!response.headers.get("content-type")?.includes("application/json")) {
      console.error("❌ Unexpected content-type from API:", previewText.substring(0, 200));
    }
  } catch (error) {
    console.error("❌ Could not read response body:", error);
  }

  return response;
};

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: `${BASE_URL}/api/trpc`,
      fetch: customFetch,
      async headers() {
        const token = await getSecureItem("mikel_auth_token");
        if (token) {
          return {
            authorization: `Bearer ${token}`,
          };
        }
        return {};
      },
      transformer: undefined,
    }),
  ],
});

export function getTRPCClientOptions() {
  return {
    links: [
      httpLinkReact({
        url: `${BASE_URL}/api/trpc`,
        fetch: customFetch,
        async headers() {
          const token = await getSecureItem("mikel_auth_token");
          if (token) {
            return {
              authorization: `Bearer ${token}`,
            };
          }
          return {};
        },
        transformer: undefined,
      }),
    ],
  };
}
