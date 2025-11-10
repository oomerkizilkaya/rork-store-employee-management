import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { trpc, trpcClient } from "../lib/trpc";

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Geri" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState<QueryClient>(() => new QueryClient());

  useEffect(() => {
    let isMounted = true;

    const prepareSplash = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
        await new Promise((resolve) => setTimeout(resolve, 1200));
      } catch (error) {
        console.error("❌ Splash screen handling error:", error);
      } finally {
        if (isMounted) {
          try {
            await SplashScreen.hideAsync();
          } catch (hideError) {
            console.error("❌ Splash screen hide error:", hideError);
          }
        }
      }
    };

    prepareSplash();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}
