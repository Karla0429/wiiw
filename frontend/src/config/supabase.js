import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

// Adaptador para que Supabase use Expo SecureStore en lugar de AsyncStorage
const ExpoSecureStoreAdapter = {
  getItem: (key) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key, value) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const SUPABASE_URL = 'https://bghizbdpddqqlqzdenbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnaGl6YmRwZGRxcWxxemRlbmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMDg0NzMsImV4cCI6MjEwNzY4NDQ3M30.HEOGvtp1mtHXkaalXSA1jdXWVpfpoZcI8CtSf5VzyCU'; // AsegÃºrate de tener tu clave real aquÃ­

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
