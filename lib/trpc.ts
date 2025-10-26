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
      transformer: undefined,
      async headers() {
        const token = await getSecureItem('mikel_auth_token');
        console.log('📡 tRPC Request - Token:', token ? 'Present' : 'None');
        console.log('📡 tRPC URL:', `${getBaseUrl()}/api/trpc`);
        if (token) {
          return {
            authorization: `Bearer ${token}`,
          };
        }
        return {};
      },
      fetch(url, options) {
        console.log('🔵 Making request to:', url);
        return fetch(url, options).then(async (res) => {
          console.log('📥 Response status:', res.status);
          console.log('📥 Response headers:', Object.fromEntries(res.headers.entries()));
          
          if (!res.ok && res.status !== 200) {
            const text = await res.text();
            console.error('❌ Response error:', text);
          }
          
          return res;
        }).catch(error => {
          console.error('❌ Fetch error:', error);
          throw error;
        });
      },
    }),
  ],
});

export function getTRPCClientOptions() {
  return {
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: undefined,
        async headers() {
          const token = await getSecureItem('mikel_auth_token');
          console.log('📡 tRPC Batch Request - Token:', token ? 'Present' : 'None');
          if (token) {
            return {
              authorization: `Bearer ${token}`,
            };
          }
          return {};
        },
        fetch(url, options) {
          console.log('🔵 Making batch request to:', url);
          return fetch(url, options).then(async (res) => {
            console.log('📥 Batch response status:', res.status);
            
            if (!res.ok && res.status !== 200) {
              const text = await res.text();
              console.error('❌ Batch response error:', text);
            }
            
            return res;
          }).catch(error => {
            console.error('❌ Batch fetch error:', error);
            throw error;
          });
        },
      }),
    ],
  };
}