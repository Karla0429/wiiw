import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

const ExpoSecureStoreAdapter = {
  getItem: async (key) => {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value || null;
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (error) {
      console.error('SecureStore setItem error:', error);
      return false;
    }
  },
  removeItem: async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error('SecureStore deleteItem error:', error);
      return false;
    }
  },
};

const SUPABASE_URL = 'https://bghizbdpddqqlqzdenbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnaGl6YmRwZGRxcWxxemRlbmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMDg0NzMsImV4cCI6MjEwNzY4NDQ3M30.HEOGvtp1mtHXkaalXSA1jdXWVpfpoZcI8CtSf5VzyCU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    type: 'pkce',
    storageKey: 'supabase-auth-token',
  },
});