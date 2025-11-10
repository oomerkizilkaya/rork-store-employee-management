import { createTRPCReact, httpLink as httpLinkReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import { getSecureItem } from "@/utils/secureStorage";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  console.log('🚀 tRPC Request:', {
    url: input.toString(),
    method: init?.method,
    headers: init?.headers,
  });

  const response = await fetch(input, {
    ...init,
    headers: {
      ...init?.headers,
      'Content-Type': 'application/json',
    },
  });

  console.log('📡 tRPC Response:', {
    url: input.toString(),
    status: response.status,
    contentType: response.headers.get('content-type'),
  });

  const clonedResponse = response.clone();
  try {
    const text = await clonedResponse.text();
    console.log('📝 Response body (first 200 chars):', text.substring(0, 200));
  } catch (e) {
    console.error('❌ Could not read response body:', e);
  }

  return response;
};

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      fetch: customFetch,
      async headers() {
        const token = await getSecureItem('mikel_auth_token');
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
        url: `${getBaseUrl()}/api/trpc`,
        fetch: customFetch,
        async headers() {
          const token = await getSecureItem('mikel_auth_token');
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