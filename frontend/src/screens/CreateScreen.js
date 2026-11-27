import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { supabase } from '../config/supabase';
import { Plus, Pencil, BookOpen } from 'lucide-react-native';
import { centeredWebContent } from '../config/layout';
import { useAppStyles, useAppTheme } from '../context/AppThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FAB_RIGHT = SCREEN_WIDTH < 600 ? 16 : 20;
const FAB_BOTTOM = SCREEN_WIDTH < 600 ? 16 : 20;
const FAB_SIZE = SCREEN_WIDTH < 600 ? 48 : 56;
const FAB_SPEED = SCREEN_WIDTH < 600 ? 28 : 28;

export default function CreateScreen({ navigation }) {
  const { colors } = useAppTheme();
  const styles = useAppStyles(createStyles);
  const [stories, setStories] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        Alert.alert('Error', `No se pudieron cargar tus historias: ${authError.message}`);
        return;
      }
      if (!user) {
        setStories([]);
        return;
      }

      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        Alert.alert('Error', `No se pudieron cargar tus historias: ${error.message}`);
        return;
      }
      setStories(data || []);
    };
    load();
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  const openChapters = (story) => {
    navigation.navigate('ChapterEdit', { storyId: story.id, story_id: story.id });
  };

  const editMetadata = (story) => {
    navigation.navigate('StoryForm', { storyId: story.id, story_id: story.id });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Taller de Escritura</Text>
        </View>
        <FlatList
          data={stories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardMain} onPress={() => openChapters(item)} activeOpacity={0.8}>
                <View style={styles.cardIcon}>
                  <BookOpen color={colors.accent} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title || 'Sin título'}</Text>
                  <Text style={styles.cardStatus}>{item.status}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editBtn} onPress={() => editMetadata(item)} hitSlop={8}>
                <Pencil color={colors.accent} size={18} />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      </View>
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('StoryForm')}>
        <Plus color={colors.white} size={FAB_SPEED} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, ...centeredWebContent(1000) },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  title: { color: colors.text, fontSize: 24, fontWeight: 'bold', padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 8, marginBottom: 12 },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  cardStatus: { color: colors.muted, marginTop: 4 },
  editBtn: { padding: 8, marginLeft: 8 },
  fab: { position: 'absolute', right: FAB_RIGHT, bottom: FAB_BOTTOM, backgroundColor: colors.accent, width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2, alignItems: 'center', justifyContent: 'center' },
});
