import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const authStorage = Platform.OS === 'web'
  ? AsyncStorage
  : {
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    };

const SUPABASE_URL = 'https://bghizbdpddqqlqzdenbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnaGl6YmRwZGRxcWxxemRlbmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMDg0NzMsImV4cCI6MjEwNzY4NDQ3M30.HEOGvtp1mtHXkaalXSA1jdXWVpfpoZcI8CtSf5VzyCU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
    storageKey: 'supabase-auth-token',
  },
});