import { createTRPCReact, httpLink as httpLinkReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import { getSecureItem } from "@/utils/secureStorage";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    console.log('🌐 API Base URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  console.log('📡 tRPC Request:', typeof input === 'string' ? input : input.toString());
  console.log('📡 Request method:', init?.method);
  
  const response = await fetch(input, init);
  console.log('📡 Response status:', response.status, response.statusText);
  
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
      }),
    ],
  };
}