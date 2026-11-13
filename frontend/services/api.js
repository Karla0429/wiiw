// Importas la conexión que ya configuraste en config/supabase.js
import { supabase } from '../config/supabase';

// A partir de aquí usas las funciones normales (authService, storyService, etc.)
export const storyService = {
  getPublishedFeed: async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('*, profiles(username, avatar_url)')
      .eq('status', 'published');
    if (error) throw error;
    return data;
  }
};