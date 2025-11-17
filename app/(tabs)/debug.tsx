import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import colors from '@/constants/colors';
import { Stack } from 'expo-router';

export default function DebugScreen() {
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const testEndpoint = async (name: string, url: string, options?: RequestInit) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    try {
      const response = await fetch(url, options);
      const text = await response.text();
      
      let parsedBody: unknown = text;
      try {
        parsedBody = JSON.parse(text);
      } catch {
        parsedBody = text;
      }

      setResults(prev => ({
        ...prev,
        [name]: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: parsedBody,
        },
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [name]: {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      }));
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  const getBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return 'http://localhost';
  };

  const baseUrl = getBaseUrl();

  const tests = [
    {
      name: 'Root',
      url: `${baseUrl}/`,
    },
    {
      name: 'API Root',
      url: `${baseUrl}/api`,
    },
    {
      name: 'Health Check',
      url: `${baseUrl}/api/health`,
    },
    {
      name: 'Test POST',
      url: `${baseUrl}/api/test`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      },
    },
    {
      name: 'tRPC Example.Hi',
      url: `${baseUrl}/api/trpc/example.hi`,
      options: {
        method: 'GET',
      },
    },
    {
      name: 'tRPC Login (Admin)',
      url: `${baseUrl}/api/trpc/auth.login`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'admin@tr.mikelcoffee.com', 
          password: 'Admin123' 
        }),
      },
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Debug API',
        }} 
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>API Debug Tools</Text>
          <Text style={styles.subtitle}>Base URL: {baseUrl}</Text>
        </View>

        <View style={styles.testsContainer}>
          {tests.map(test => (
            <View key={test.name} style={styles.testCard}>
              <View style={styles.testHeader}>
                <Text style={styles.testName}>{test.name}</Text>
                <TouchableOpacity
                  style={[styles.testButton, loading[test.name] && styles.testButtonDisabled]}
                  onPress={() => testEndpoint(test.name, test.url, test.options)}
                  disabled={loading[test.name]}
                >
                  {loading[test.name] ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.testButtonText}>Test</Text>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.testUrl}>{test.url}</Text>
              {results[test.name] && (
                <View style={styles.resultContainer}>
                  <Text style={styles.resultText}>
                    {JSON.stringify(results[test.name], null, 2)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Test Login Credentials:</Text>
          <Text style={styles.infoText}>Email: admin@tr.mikelcoffee.com</Text>
          <Text style={styles.infoText}>Password: Admin123</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[600],
  },
  testsContainer: {
    padding: 16,
    gap: 16,
  },
  testCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    flex: 1,
  },
  testButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  testUrl: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: 12,
    fontFamily: 'monospace' as const,
  },
  resultContainer: {
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  resultText: {
    fontSize: 12,
    color: colors.gray[800],
    fontFamily: 'monospace' as const,
  },
  infoBox: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.blue[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.blue[200],
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.blue[900],
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.blue[800],
    marginBottom: 4,
    fontFamily: 'monospace' as const,
  },
});
