import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../config/supabase';
import { centeredWebContent } from '../config/layout';
import { useAppStyles, useAppTheme } from '../context/AppThemeContext';
import BackButton from '../components/BackButton';

export default function ChapterEditScreen({ navigation, route }) {
  const { colors } = useAppTheme();
  const styles = useAppStyles(createStyles);
  const storyId = route?.params?.storyId || route?.params?.story_id;
  const [chapterNumber, setChapterNumber] = useState('1');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [chapters, setChapters] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshChapters = useCallback(async () => {
    if (!storyId) return;
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('story_id', storyId)
      .order('chapter_number', { ascending: true });
    const list = data || [];
    setChapters(list);
    setChapterNumber(String(list.reduce((max, chapter) => Math.max(max, chapter.chapter_number || 0), 0) + 1));
  }, [storyId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      refreshChapters();
    }, 0);
    return () => clearTimeout(timeout);
  }, [refreshChapters]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setAllowComments(true);
    refreshChapters();
  };

  const loadChapter = (chapter) => {
    setEditingId(chapter.id);
    setChapterNumber(String(chapter.chapter_number || 1));
    setTitle(chapter.title || '');
    setContent(chapter.content || '');
    setAllowComments(chapter.allow_comments !== false);
  };

  const save = async () => {
    if (!content) {
      Alert.alert('Error', 'El contenido es obligatorio');
      return;
    }

    const number = parseInt(chapterNumber, 10);
    if (Number.isNaN(number)) {
      Alert.alert('Error', 'El número de capítulo no es válido');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        story_id: storyId,
        chapter_number: number,
        title,
        content,
        allow_comments: allowComments,
      };

      if (editingId) {
        const { error } = await supabase.from('chapters').update(payload).eq('id', editingId);
        if (error) throw error;
        Alert.alert('Guardado', 'Capítulo actualizado');
      } else {
        const { error } = await supabase.from('chapters').insert(payload);
        if (error) throw error;
        Alert.alert('Guardado', 'Capítulo guardado');
      }

      resetForm();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.title}>Editor de Capítulos</Text>

      {chapters.length ? (
        <View style={styles.chaptersList}>
          {chapters.map((chapter) => (
            <TouchableOpacity
              key={chapter.id}
              style={[styles.chapterItem, editingId === chapter.id && styles.chapterItemActive]}
              onPress={() => loadChapter(chapter)}
            >
              <Text style={styles.chapterTitle}>Capítulo {chapter.chapter_number}</Text>
              <Text style={styles.chapterSubtitle}>{chapter.title || 'Sin título'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      <TouchableOpacity style={styles.newChapterButton} onPress={resetForm}>
        <Text style={styles.newChapterText}>+ Agregar capítulo</Text>
      </TouchableOpacity>

      <TextInput style={styles.input} placeholder="N° Capítulo" placeholderTextColor={colors.muted} value={chapterNumber} onChangeText={setChapterNumber} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Título del capítulo" placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} />
      <TextInput style={[styles.input, { minHeight: 220, textAlignVertical: 'top' }]} placeholder="Contenido..." placeholderTextColor={colors.muted} value={content} onChangeText={setContent} multiline />
      <View style={styles.row}>
        <Text style={styles.label}>Permitir comentarios</Text>
        <Switch value={allowComments} onValueChange={setAllowComments} thumbColor={colors.white} trackColor={{ false: colors.border, true: colors.accent }} />
      </View>
      <TouchableOpacity style={styles.btn} onPress={save} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>{editingId ? 'Guardar cambios' : 'Guardar capítulo'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, flexGrow: 1, ...centeredWebContent(900) },
  title: { color: colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  chaptersList: { gap: 8, marginBottom: 12 },
  chapterItem: { backgroundColor: colors.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  chapterItemActive: { borderColor: colors.accent },
  chapterTitle: { color: colors.accent, fontWeight: 'bold' },
  chapterSubtitle: { color: colors.text, marginTop: 3 },
  newChapterButton: { backgroundColor: colors.accentSoft, padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  newChapterText: { color: colors.accent, fontWeight: '600' },
  input: { backgroundColor: colors.surface, color: colors.text, borderRadius: 8, padding: 12, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  label: { color: colors.text },
  btn: { backgroundColor: colors.accent, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: colors.white, fontWeight: 'bold' },
});
