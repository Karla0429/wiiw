import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../config/supabase';
import { Search, BookOpen, Copy } from 'lucide-react-native';
import { centeredWebContent } from '../config/layout';
import { useAppStyles, useAppTheme } from '../context/AppThemeContext';

const CATEGORIES = [
  { label: 'Romance', value: 'ROMANCE' },
  { label: 'Fantasía', value: 'FANTASIA' },
  { label: 'Ciencia ficción', value: 'CIENCIA_FICCION' },
  { label: 'Terror', value: 'TERROR' },
  { label: 'Misterio', value: 'MISTERIO' },
  { label: 'Histórico', value: 'HISTORICO' },
];

export default function SearchScreen({ navigation }) {
  const { colors } = useAppTheme();
  const styles = useAppStyles(createStyles);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const text = query.trim();

    const run = async () => {
      let request = supabase.from('stories').select('*, profiles(username, avatar_url)').eq('status', 'published');

      if (text) {
        request = request.ilike('title', `%${text}%`);
      } else if (activeCategory) {
        request = request.ilike('genre', `%${activeCategory}%`);
      }

      if (!text && !activeCategory) request = request.order('views_count', { ascending: false }).limit(20);
      const { data, error } = await request;
      if (!active) return;
      if (error) {
        Alert.alert('Error', `No se pudieron buscar historias: ${error.message}`);
        setResults([]);
        setLoading(false);
        return;
      }
      setResults(data || []);
      setLoading(false);
    };

    const timeout = setTimeout(run, text ? 300 : 0);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query, activeCategory]);

  const onChangeQuery = (text) => {
    setLoading(true);
    setQuery(text);
    setActiveCategory(null);
  };

  const filterByCategory = (category) => {
    setLoading(true);
    setQuery('');
    setActiveCategory((current) => (current === category ? null : category));
  };

  const sectionTitle = query.trim()
    ? 'Resultados'
    : activeCategory
      ? `Categoría: ${CATEGORIES.find((category) => category.value === activeCategory)?.label || activeCategory}`
      : 'Historias destacadas';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Explorar</Text>
        <View style={styles.searchBox}>
          <Search color={colors.muted} size={18} />
          <TextInput style={styles.input} placeholder="Buscar por título..." placeholderTextColor={colors.muted} value={query} onChangeText={onChangeQuery} />
        </View>
        <Text style={styles.section}>Categorías</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.value}
              style={[styles.chip, activeCategory === category.value && styles.chipActive]}
              onPress={() => filterByCategory(category.value)}
            >
              <Text style={styles.chipText}>{category.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.section}>{sectionTitle}</Text>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.title || 'Sin título'}</Text>
                <Text style={styles.cardSub}>{item.genre}</Text>
                {item.description ? <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text> : null}
                {item.status !== 'published' ? <Text style={styles.cardStatus}>Tu borrador</Text> : null}
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate(item.status === 'published' ? 'ReadStory' : 'ChapterEdit', { storyId: item.id })}>
                    <BookOpen color={colors.accent} size={16} />
                    <Text style={styles.actionText}>{item.status === 'published' ? 'Leer' : 'Capítulos'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('StoryForm', { template: item })}>
                    <Copy color={colors.accent} size={16} />
                    <Text style={styles.actionText}>Recrear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No se encontraron historias.</Text>}
            contentContainerStyle={{ padding: 16 }}
          />
        )}
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, ...centeredWebContent(1050) },
  title: { color: colors.text, fontSize: 24, fontWeight: 'bold', padding: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 8, paddingHorizontal: 10, gap: 8 },
  input: { flex: 1, color: colors.text, padding: 10 },
  section: { color: colors.text, fontSize: 16, fontWeight: 'bold', paddingHorizontal: 16, marginTop: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 8 },
  chip: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  chipActive: { backgroundColor: colors.accentSoft },
  chipText: { color: colors.text },
  card: { backgroundColor: colors.surface, padding: 14, borderRadius: 8, marginBottom: 10 },
  cardTitle: { color: colors.text, fontWeight: 'bold' },
  cardSub: { color: colors.accent, marginTop: 4 },
  cardDescription: { color: colors.text, marginTop: 6, fontSize: 12 },
  cardStatus: { color: colors.muted, fontSize: 12, marginTop: 6 },
  cardActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  actionText: { color: colors.accent, fontWeight: '600', fontSize: 12 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 20 },
});
