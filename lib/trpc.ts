import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
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

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
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
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
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