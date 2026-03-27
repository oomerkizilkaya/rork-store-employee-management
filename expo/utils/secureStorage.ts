import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USE_SECURE_STORE = Platform.OS !== 'web';

export async function setSecureItem(
  key: string,
  value: string
): Promise<void> {
  try {
    const sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (USE_SECURE_STORE) {
      await SecureStore.setItemAsync(sanitizedKey, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch (error) {
    console.error(`Error saving secure item ${key}:`, error);
    throw error;
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    const sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (USE_SECURE_STORE) {
      return await SecureStore.getItemAsync(sanitizedKey);
    } else {
      return await AsyncStorage.getItem(key);
    }
  } catch (error) {
    console.error(`Error getting secure item ${key}:`, error);
    return null;
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  try {
    const sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (USE_SECURE_STORE) {
      await SecureStore.deleteItemAsync(sanitizedKey);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.error(`Error deleting secure item ${key}:`, error);
    throw error;
  }
}

export async function setSecureObject(
  key: string,
  value: unknown
): Promise<void> {
  const jsonString = JSON.stringify(value);
  await setSecureItem(key, jsonString);
}

export async function getSecureObject<T>(key: string): Promise<T | null> {
  const jsonString = await getSecureItem(key);
  if (!jsonString) return null;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error(`Error parsing secure object ${key}:`, error);
    return null;
  }
}
