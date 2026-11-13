import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../config/supabase';
import { COLORS } from '../config/theme';
import { selectImage, uploadImage } from '../services/imageUpload';

export default function StoryFormScreen({ navigation, route }) {
  const storyId = route?.params?.storyId || route?.params?.story_id;
  const template = route?.params?.template;
  const isEditing = !!storyId;

  const [title, setTitle] = useState(template?.title || '');
  const [description, setDescription] = useState(template?.description || '');
  const [genre, setGenre] = useState(template?.genre || '');
  const [language, setLanguage] = useState(template?.language || '');
  const [characters, setCharacters] = useState(template?.characters || '');
  const [audience, setAudience] = useState(template?.audience || '');
  const [coverUrl, setCoverUrl] = useState(template?.cover_url || '');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (!storyId) return;

    const loadStory = async () => {
      const { data, error } = await supabase.from('stories').select('*').eq('id', storyId).maybeSingle();
      if (error) {
        Alert.alert('Error', `No se pudo cargar la historia: ${error.message}`);
        setFetching(false);
        return;
      }
      if (data) {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setGenre(data.genre || '');
        setLanguage(data.language || '');
        setCharacters(data.characters || '');
        setAudience(data.audience || '');
        setCoverUrl(data.cover_url || '');
      }
      setFetching(false);
    };

    loadStory();
  }, [storyId]);

  const pickImage = async () => {
    try {
      const asset = await selectImage();
      if (!asset) return;
      setUploadingCover(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) throw new Error('Debes iniciar sesión para subir una portada.');
      const publicUrl = await uploadImage({
        bucket: 'covers',
        path: `${user.id}/cover_${Date.now()}`,
        asset,
      });
      setCoverUrl(publicUrl);
    } catch (err) {
      Alert.alert('Error', `No se pudo subir la portada: ${err.message}`);
    } finally {
      setUploadingCover(false);
    }
  };

  const save = async () => {
    if (!title) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }
    setLoading(true);
    try {
      const metadata = {
        title,
        description,
        genre,
        language,
        characters,
        audience,
        cover_url: coverUrl,
      };

      if (isEditing) {
        const { error } = await supabase.from('stories').update(metadata).eq('id', storyId);
        if (error) throw error;
        Alert.alert('Guardado', 'Metadatos actualizados');
        navigation.goBack();
      } else {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) throw new Error('Debes iniciar sesión para crear una historia.');
        const { data, error } = await supabase.from('stories').insert({
          ...metadata,
          author_id: user.id,
          status: 'draft',
        }).select().single();
        if (error) throw error;
        navigation.navigate('ChapterEdit', { storyId: data.id, story_id: data.id });
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const publishStory = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Debes iniciar sesión.');
    const storyIdToPublish = storyId || (await supabase.from('stories').select('id').eq('author_id', user.id).order('created_at', { ascending: false }).maybeSingle()).data?.id;
    const { error } = await supabase.from('stories').update({ status: 'published' }).eq('id', storyIdToPublish);
    if (error) throw error;
    Alert.alert('Publicado', 'Tu historia ahora es visible para todos.');
    navigation.goBack();
  };

  if (fetching) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{isEditing ? 'Editar Metadatos' : 'Metadatos de la Historia'}</Text>
      <TextInput style={styles.input} placeholder="Título" placeholderTextColor={COLORS.muted} value={title} onChangeText={setTitle} />
      <TextInput style={[styles.input, { height: 80 }]} placeholder="Descripción" placeholderTextColor={COLORS.muted} value={description} onChangeText={setDescription} multiline />
      <TextInput style={styles.input} placeholder="Género" placeholderTextColor={COLORS.muted} value={genre} onChangeText={setGenre} />
      <TextInput style={styles.input} placeholder="Idioma" placeholderTextColor={COLORS.muted} value={language} onChangeText={setLanguage} />
      <TextInput style={styles.input} placeholder="Personajes" placeholderTextColor={COLORS.muted} value={characters} onChangeText={setCharacters} />
      <TextInput style={styles.input} placeholder="Audiencia Objetiva" placeholderTextColor={COLORS.muted} value={audience} onChangeText={setAudience} />
      <TouchableOpacity style={styles.btn} onPress={pickImage} disabled={uploadingCover || loading}>
        {uploadingCover ? (
          <ActivityIndicator color={COLORS.accent} />
        ) : (
          <Text style={styles.btnText}>{coverUrl ? 'Cambiar Portada' : 'Cargar Portada'}</Text>
        )}
      </TouchableOpacity>
      {coverUrl ? <Image source={{ uri: coverUrl }} style={styles.coverPreview} /> : null}
      <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.accent, marginTop: 12 }]} onPress={save} disabled={loading || uploadingCover}>
        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={[styles.btnText, { color: COLORS.white }]}>{isEditing ? 'Guardar cambios' : 'Guardar y agregar capítulos'}</Text>}
      </TouchableOpacity>
      {isEditing || !coverUrl ? null : (
        <TouchableOpacity style={styles.btn} onPress={publishStory} disabled={loading || uploadingCover}>
          <Text style={styles.btnText}>Publicar historia</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: { color: COLORS.text, fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: COLORS.surface, color: COLORS.text, borderRadius: 8, padding: 12, marginBottom: 12 },
  btn: { backgroundColor: COLORS.accentSoft, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: COLORS.accent },
  coverPreview: { width: '100%', height: 180, borderRadius: 8, marginTop: 12 },
});
