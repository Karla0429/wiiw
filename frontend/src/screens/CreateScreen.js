import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { supabase } from '../config/supabase';
import { Plus, Pencil, BookOpen } from 'lucide-react-native';
import { COLORS } from '../config/theme';

export default function CreateScreen({ navigation }) {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('stories').select('*').eq('author_id', user.id).order('created_at', { ascending: false });
        setStories(data || []);
      }
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
      <Text style={styles.title}>Taller de Escritura</Text>
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity style={styles.cardMain} onPress={() => openChapters(item)} activeOpacity={0.8}>
              <View style={styles.cardIcon}>
                <BookOpen color={COLORS.accent} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title || 'Sin título'}</Text>
                <Text style={styles.cardStatus}>{item.status}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn} onPress={() => editMetadata(item)} hitSlop={8}>
              <Pencil color={COLORS.accent} size={18} />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('StoryForm')}>
        <Plus color={COLORS.white} size={28} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: { color: COLORS.text, fontSize: 24, fontWeight: 'bold', padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 8, marginBottom: 12 },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  cardStatus: { color: COLORS.muted, marginTop: 4 },
  editBtn: { padding: 8, marginLeft: 8 },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: COLORS.accent, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
