import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '../config/supabase';
import { READER_THEMES } from '../config/theme';
import { useReaderPreferences } from '../context/ReaderPreferencesContext';

export default function ReadStoryScreen({ navigation, route }) {
  const storyId = route?.params?.storyId;
  const startingChapterNumber = route?.params?.chapterNumber;
  const { width: screenWidth } = useWindowDimensions();
  const { preferences } = useReaderPreferences();
  const theme = READER_THEMES[preferences.theme] || READER_THEMES.paper;
  const [story, setStory] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadStory = async () => {
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .maybeSingle();
      if (storyError) {
        Alert.alert('Error', `No se pudo cargar la historia: ${storyError.message}`);
        setLoading(false);
        return;
      }
      if (!storyData) {
        Alert.alert('Error', 'No se encontró esta historia.');
        setLoading(false);
        return;
      }

      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .select('id, chapter_number, title, content')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: true });
      if (chapterError) {
        Alert.alert('Error', `No se pudieron cargar los capítulos: ${chapterError.message}`);
        setLoading(false);
        return;
      }
      if (!active) return;
      setStory(storyData);
      setChapters((chapterData || []).filter((chapter) => (
        startingChapterNumber == null || chapter.chapter_number >= startingChapterNumber
      )));
      setLoading(false);
    };

    loadStory();
    return () => {
      active = false;
    };
  }, [storyId, startingChapterNumber]);

  if (loading) {
    return <ActivityIndicator color={theme.accent} style={styles.loading} />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.content, { paddingHorizontal: screenWidth < 600 ? 18 : 32 }]}
    >
      <View style={styles.readerColumn}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.accent} size={20} />
          <Text style={{ color: theme.accent, fontWeight: '600' }}>Volver</Text>
        </TouchableOpacity>
        {story?.cover_url ? <Image source={{ uri: story.cover_url }} style={styles.cover} /> : null}
        <Text style={[styles.title, { color: theme.text, fontFamily: preferences.fontFamily }]}>{story?.title || 'Sin título'}</Text>
        {story?.description ? <Text style={[styles.description, { color: theme.muted, fontFamily: preferences.fontFamily }]}>{story.description}</Text> : null}
        {chapters.length ? chapters.map((chapter) => (
          <View key={chapter.id} style={[styles.chapter, { borderTopColor: theme.border }]}>
            <Text style={[styles.chapterHeading, { color: theme.accent, fontFamily: preferences.fontFamily }]}>
              Capítulo {chapter.chapter_number}{chapter.title ? ` · ${chapter.title}` : ''}
            </Text>
            <Text style={[styles.chapterText, {
              color: theme.text,
              fontFamily: preferences.fontFamily,
              fontSize: preferences.fontSize,
              lineHeight: preferences.fontSize * 1.75,
            }]}>
              {chapter.content}
            </Text>
          </View>
        )) : <Text style={[styles.empty, { color: theme.muted }]}>Esta historia todavía no tiene capítulos.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1 },
  container: { flex: 1 },
  content: { paddingTop: 20, paddingBottom: 48, alignItems: 'center' },
  readerColumn: { width: '100%', maxWidth: 760 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  cover: { width: 160, height: 240, borderRadius: 10, marginBottom: 22, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  description: { fontSize: 15, lineHeight: 24, marginTop: 12, textAlign: 'center' },
  chapter: { borderTopWidth: 1, marginTop: 32, paddingTop: 24 },
  chapterHeading: { fontSize: 18, fontWeight: 'bold', marginBottom: 18, textAlign: 'center' },
  chapterText: { textAlign: 'left' },
  empty: { marginTop: 24, textAlign: 'center' },
});
