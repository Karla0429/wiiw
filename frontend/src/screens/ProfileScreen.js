import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, FlatList, Dimensions, Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { LogOut, Activity, Pencil, Camera, X, Settings } from 'lucide-react-native';
import { APP_THEME_OPTIONS } from '../config/theme';
import { useAppStyles, useAppTheme } from '../context/AppThemeContext';
import { selectImage, uploadImage } from '../services/imageUpload';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';
const AVATAR_SIZE = SCREEN_WIDTH < 600 ? 80 : 90;
const HEADER_HEIGHT = SCREEN_WIDTH < 600 ? 160 : 200;
const PADDING_SM = SCREEN_WIDTH < 600 ? 16 : 24;
const PADDING_MD = SCREEN_WIDTH < 600 ? 12 : 20;

export default function ProfileScreen({ navigation }) {
  const { colors, themeName, setTheme, isLoaded: isThemeLoaded, loadError: themeLoadError } = useAppTheme();
  const styles = useAppStyles(createStyles);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [stories, setStories] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (themeLoadError) Alert.alert('Error', `No se pudo cargar el tema de la aplicación: ${themeLoadError.message}`);
  }, [themeLoadError]);

  const changeTheme = async (nextTheme) => {
    try {
      await setTheme(nextTheme);
    } catch (error) {
      Alert.alert('Error', `No se pudo guardar el tema de la aplicación: ${error.message}`);
    }
  };

  const handlePublishStory = async (storyId) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { Alert.alert('Error', 'No hay sesión activa'); return; }
    const { error } = await supabase.from('stories').update({ 
      status: 'published',
      updated_at: new Date()
    }).eq('author_id', user.id).eq('id', storyId);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Publicado', 'Tu historia ahora es visible para todos.');
    loadProfile();
  };

  const loadProfile = useCallback(async () => {
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      Alert.alert('Error', `No se pudo cargar el perfil: ${authError.message}`);
      return;
    }
    setUser(currentUser);
    if (!currentUser) return;

    const [{ data: profileData, error: profileError }, { data: storyData, error: storyError }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle(),
      supabase.from('stories').select('*').eq('author_id', currentUser.id).order('created_at', { ascending: false }),
    ]);
    if (profileError) Alert.alert('Error', `No se pudo cargar el perfil: ${profileError.message}`);
    else setProfile(profileData);
    if (storyError) Alert.alert('Error', `No se pudieron cargar tus historias: ${storyError.message}`);
    else setStories(storyData || []);
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(loadProfile, 0);
    const unsubscribe = navigation.addListener('focus', loadProfile);
    return () => {
      clearTimeout(initialLoad);
      unsubscribe();
    };
  }, [loadProfile, navigation]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    navigation.replace('Auth');
  };

  const openEdit = () => {
    setBio(profile?.bio || '');
    setAvatarUrl(profile?.avatar_url || '');
    setEditModal(true);
  };

  const pickAvatar = async () => {
    try {
      const asset = await selectImage();
      if (!asset) return;
      if (!user) throw new Error('Debes iniciar sesión para cambiar tu foto.');
      setUploadingAvatar(true);
      const publicUrl = await uploadImage({
        bucket: 'avatars',
        path: `${user.id}/avatar_${Date.now()}`,
        asset,
      });
      setAvatarUrl(publicUrl);
    } catch (err) {
      Alert.alert('Error', `No se pudo subir la foto: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (profile) {
        const { error } = await supabase.from('profiles').update({ bio, avatar_url: avatarUrl }).eq('id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('profiles').insert({
          id: user.id,
          username: user.email?.split('@')[0] || 'lector',
          bio,
          avatar_url: avatarUrl,
        });
        if (error) throw error;
      }

      setProfile((prev) => ({ ...(prev || {}), id: user.id, bio, avatar_url: avatarUrl }));
      setEditModal(false);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={styles.banner} />
              <View style={styles.avatarWrap}>
                <Image source={{ uri: profile?.avatar_url || 'https://placehold.co/100x100' }} style={styles.avatar} />
              </View>
            </View>
            <View style={styles.info}>
              <Text style={styles.username}>@{profile?.username || user?.email?.split('@')[0]}</Text>
              <Text style={styles.bio}>{profile?.bio || 'Sin biografía'}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.btn} onPress={openEdit}>
                  <Pencil color={colors.accent} size={18} />
                  <Text style={styles.btnText}>Editar perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Activity')}>
                  <Activity color={colors.accent} size={18} />
                  <Text style={styles.btnText}>Actividad</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('ReaderSettings')}>
                  <Settings color={colors.accent} size={18} />
                  <Text style={styles.btnText}>Ajustes de lectura</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={handleLogout}>
                  <LogOut color={colors.accent} size={18} />
                  <Text style={styles.btnText}>Cerrar sesión</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.appearance}>
                <Text style={styles.appearanceTitle}>Apariencia de la aplicación</Text>
                <View style={styles.appearanceOptions}>
                  {APP_THEME_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: themeName === option.value }}
                      style={[styles.appearanceOption, themeName === option.value && styles.appearanceOptionActive]}
                      onPress={() => changeTheme(option.value)}
                      disabled={!isThemeLoaded}
                    >
                      <Text style={[styles.appearanceOptionText, themeName === option.value && styles.appearanceOptionTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <Text style={styles.storiesHeading}>Mis historias</Text>
            </View>
          </>
        }
        ListEmptyComponent={<Text style={styles.empty}>Todavía no has creado historias.</Text>}
        renderItem={({ item }) => (
          <View style={styles.storyCard}>
            {item.cover_url ? <Image source={{ uri: item.cover_url }} style={styles.storyCover} /> : null}
            <View style={styles.storyInfo}>
              <Text style={styles.storyTitle}>{item.title || 'Sin título'}</Text>
              <Text style={styles.storyStatus}>{item.status === 'published' ? 'Publicada' : 'Borrador'}</Text>
<View style={styles.storyActions}>
                {item.status === 'published' ? (
                  <TouchableOpacity style={styles.storyButton} onPress={() => navigation.navigate('ReadStory', { storyId: item.id })}>
                    <Text style={styles.storyButtonText}>Leer</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.storyButton} onPress={() => handlePublishStory(item.id)}>
                    <Text style={styles.storyButtonText}>Publicar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.storyButton} onPress={() => navigation.navigate('ChapterEdit', { storyId: item.id })}>
                  <Text style={styles.storyButtonText}>Capítulos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.storyButton} onPress={() => navigation.navigate('StoryForm', { template: item })}>
                  <Text style={styles.storyButtonText}>Recrear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      <Modal visible={editModal} animationType="slide" transparent onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar perfil</Text>
              <TouchableOpacity onPress={() => setEditModal(false)} hitSlop={10}>
                <X color={colors.text} size={22} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar} disabled={uploadingAvatar || saving}>
              <Image source={{ uri: avatarUrl || 'https://placehold.co/100x100' }} style={styles.avatarPreview} />
              <View style={styles.cameraBadge}>
                {uploadingAvatar ? <ActivityIndicator color={colors.accent} size="small" /> : <Camera color={colors.accent} size={16} />}
              </View>
            </TouchableOpacity>
            <Text style={styles.helper}>Toca la foto para cambiarla</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Escribe tu biografía..."
              placeholderTextColor={colors.muted}
              value={bio}
              onChangeText={setBio}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={() => setEditModal(false)}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { flex: 1, backgroundColor: colors.accentSoft }]}
                onPress={saveProfile}
                disabled={saving || uploadingAvatar}
              >
                {saving ? <ActivityIndicator color={colors.accent} /> : <Text style={styles.btnText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { height: HEADER_HEIGHT, width: IS_WEB ? '100%' : undefined },
  banner: { height: SCREEN_WIDTH < 600 ? 100 : 130, backgroundColor: colors.accentSoft },
  avatarWrap: {
    position: 'absolute',
    bottom: 0,
    left: IS_WEB ? '50%' : PADDING_SM,
    transform: IS_WEB ? [{ translateX: -AVATAR_SIZE / 2 }] : undefined,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.background,
  },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, backgroundColor: colors.surface },
  info: { padding: PADDING_MD, alignItems: IS_WEB ? 'center' : undefined },
  username: { color: colors.text, fontSize: SCREEN_WIDTH < 600 ? 18 : 20, fontWeight: 'bold', marginTop: 12 },
  bio: { color: colors.muted, marginTop: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: IS_WEB ? 'center' : undefined, gap: 12, marginTop: 20 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, padding: 8, borderRadius: 6 },
  btnText: { color: colors.accent, fontWeight: '600' },
  appearance: {
    width: IS_WEB ? '100%' : undefined,
    maxWidth: IS_WEB ? 560 : undefined,
    alignSelf: IS_WEB ? 'center' : undefined,
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
  },
  appearanceTitle: { color: colors.text, fontWeight: 'bold', marginBottom: 10, textAlign: IS_WEB ? 'center' : undefined },
  appearanceOptions: { flexDirection: 'row', justifyContent: IS_WEB ? 'center' : undefined, gap: 8 },
  appearanceOption: {
    flex: IS_WEB ? 0 : 1,
    width: IS_WEB ? 140 : undefined,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 8,
  },
  appearanceOptionActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  appearanceOptionText: { color: colors.text, fontWeight: '600' },
  appearanceOptionTextActive: { color: colors.accent },
  storiesHeading: { color: colors.text, fontSize: SCREEN_WIDTH < 600 ? 16 : 18, fontWeight: 'bold', marginTop: 20, alignSelf: IS_WEB ? 'center' : undefined },
  storyCard: {
    width: IS_WEB ? '100%' : undefined,
    maxWidth: IS_WEB ? 960 : undefined,
    alignSelf: IS_WEB ? 'center' : undefined,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginHorizontal: IS_WEB ? 0 : PADDING_SM,
    marginBottom: 12,
    padding: 10,
    gap: 10,
  },
  storyCover: { width: SCREEN_WIDTH < 600 ? 50 : 62, height: SCREEN_WIDTH < 600 ? 68 : 86, borderRadius: SCREEN_WIDTH < 600 ? 5 : 6 },
  storyInfo: { flex: 1 },
  storyTitle: { color: colors.text, fontWeight: 'bold', fontSize: SCREEN_WIDTH < 600 ? 14 : 16 },
  storyStatus: { color: colors.muted, marginTop: 4, fontSize: SCREEN_WIDTH < 600 ? 10 : 12 },
  storyActions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8 },
  storyButton: { backgroundColor: colors.accentSoft, paddingHorizontal: SCREEN_WIDTH < 600 ? 8 : 10, paddingVertical: SCREEN_WIDTH < 600 ? 4 : 6, borderRadius: SCREEN_WIDTH < 600 ? 5 : 6 },
  storyButtonText: { color: colors.accent, fontSize: SCREEN_WIDTH < 600 ? 10 : 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.muted, padding: SCREEN_WIDTH < 600 ? 16 : 20 },
  listContent: {
    width: IS_WEB ? '100%' : undefined,
    maxWidth: IS_WEB ? 1040 : undefined,
    alignSelf: IS_WEB ? 'center' : undefined,
    paddingHorizontal: IS_WEB ? 24 : 0,
    paddingBottom: 20,
  },
  modalWrap: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end', padding: PADDING_SM },
  modal: { backgroundColor: colors.background, borderRadius: 10, padding: PADDING_SM },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { color: colors.text, fontSize: SCREEN_WIDTH < 600 ? 16 : 18, fontWeight: 'bold' },
  avatarPicker: { alignSelf: 'center', marginBottom: 6 },
  avatarPreview: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: colors.surface },
  cameraBadge: { position: 'absolute', right: 0, bottom: 0, backgroundColor: colors.accentSoft, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  helper: { color: colors.muted, textAlign: 'center', fontSize: SCREEN_WIDTH < 600 ? 10 : 12, marginBottom: 10 },
  input: { backgroundColor: colors.surface, color: colors.text, borderRadius: 6, padding: 10, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
