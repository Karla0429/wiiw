import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Share, Image, Modal, ScrollView, ActivityIndicator, Alert, Dimensions, Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { Heart, MessageCircle, Share2, Eye, X } from 'lucide-react-native';
import { COLORS } from '../config/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';
const COLUMNS_MOBILE = 2;
const COLUMNS_TABLET = 3;
const COLUMNS_DESKTOP = 4;

export default function HomeScreen({ navigation }) {
  const [stories, setStories] = useState([]);
  const [user, setUser] = useState(null);
  const [likes, setLikes] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [selectedStory, setSelectedStory] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadLikes = useCallback(async (storyList, currentUser) => {
    const storyIds = storyList.map((story) => story.id);
    if (!storyIds.length) {
      setLikes({});
      return;
    }

    const { data } = await supabase.from('likes').select('story_id, user_id').in('story_id', storyIds);
    const map = {};
    storyIds.forEach((id) => {
      map[id] = { count: 0, liked: false };
    });

    (data || []).forEach((like) => {
      if (!map[like.story_id]) map[like.story_id] = { count: 0, liked: false };
      map[like.story_id].count += 1;
      if (currentUser && like.user_id === currentUser.id) map[like.story_id].liked = true;
    });

    setLikes(map);
  }, []);

  const loadCommentCounts = useCallback(async (storyList) => {
    const storyIds = storyList.map((story) => story.id);
    if (!storyIds.length) {
      setCommentCounts({});
      return;
    }

    const { data } = await supabase.from('comments').select('story_id').in('story_id', storyIds);
    const map = {};
    storyIds.forEach((id) => {
      map[id] = 0;
    });
    (data || []).forEach((comment) => {
      if (map[comment.story_id] !== undefined) map[comment.story_id] += 1;
    });
    setCommentCounts(map);
  }, []);

  const loadStories = useCallback(async () => {
    setLoading(true);
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      Alert.alert('Error', `No se pudieron cargar las historias: ${authError.message}`);
      setLoading(false);
      return;
    }

    setUser(currentUser);
    const { data, error } = await supabase.from('stories').select('*, profiles(username, avatar_url)').eq('status', 'published').order('created_at', { ascending: false });
    if (error) {
      Alert.alert('Error', `No se pudieron cargar las historias: ${error.message}`);
      setStories([]);
      setLoading(false);
      return;
    }

    const storyList = data || [];
    setStories(storyList);
    await loadLikes(storyList, currentUser);
    await loadCommentCounts(storyList);
    setLoading(false);
  }, [loadCommentCounts, loadLikes]);

  useEffect(() => {
    const initialLoad = setTimeout(loadStories, 0);
    const unsubscribe = navigation.addListener('focus', loadStories);
    return () => {
      clearTimeout(initialLoad);
      unsubscribe();
    };
  }, [loadStories, navigation]);

  const incrementViews = async (id) => {
    await supabase.rpc('increment_story_views', { p_story_id: id });
  };

  const openStory = (story) => {
    const viewIncrement = story.status === 'published' ? 1 : 0;
    setSelectedStory({ ...story, views_count: (story.views_count || 0) + viewIncrement });
    if (story.status === 'published') {
      setStories((prev) => prev.map((item) => (
        item.id === story.id ? { ...item, views_count: (item.views_count || 0) + 1 } : item
      )));
      incrementViews(story.id);
    }
  };

  const toggleLike = async (storyId) => {
    if (!user) return;

    const current = likes[storyId] || { count: 0, liked: false };
    const nextLiked = !current.liked;
    setLikes((prev) => ({
      ...prev,
      [storyId]: {
        count: Math.max(0, current.count + (nextLiked ? 1 : -1)),
        liked: nextLiked,
      },
    }));

    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('story_id', storyId)
      .maybeSingle();

    if (existing) {
      await supabase.from('likes').delete().eq('id', existing.id);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, story_id: storyId });
    }

    await loadLikes(stories, user);
  };

  const shareStory = async (title) => {
    try {
      await Share.share({ message: `Mira esta historia en wiiw: ${title}` });
    } catch {}
  };

  const renderItem = ({ item }) => {
    const like = likes[item.id] || { count: 0, liked: false };
    return (
      <TouchableOpacity style={styles.card} onPress={() => openStory(item)} activeOpacity={0.85}>
        {item.cover_url ? <Image source={{ uri: item.cover_url }} style={styles.cover} /> : <View style={styles.cover} />}
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Eye color={COLORS.muted} size={14} />
            <Text style={styles.metaText}>{item.views_count || 0}</Text>
          </View>
          {item.status === 'published' ? <TouchableOpacity style={styles.metaItem} onPress={() => toggleLike(item.id)} hitSlop={8}>
          <Heart color={like.liked ? COLORS.accent : COLORS.muted} fill={like.liked ? COLORS.accent : 'transparent'} size={14} />
            <Text style={styles.metaText}>{like.count}</Text>
          </TouchableOpacity> : <Text style={styles.draftLabel}>Borrador</Text>}
          {item.status === 'published' ? <TouchableOpacity style={styles.metaItem} onPress={() => openStory(item)} hitSlop={8}>
          <MessageCircle color={COLORS.muted} size={14} />
            <Text style={styles.metaText}>{commentCounts[item.id] || 0}</Text>
          </TouchableOpacity> : null}
          <TouchableOpacity style={styles.metaItem} onPress={() => shareStory(item.title)} hitSlop={8}>
            <Share2 color={COLORS.muted} size={14} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const detailLike = selectedStory ? (likes[selectedStory.id] || { count: 0, liked: false }) : { count: 0, liked: false };

const gridColumns = IS_WEB ? 4 : (SCREEN_WIDTH < 600 ? COLUMNS_MOBILE : SCREEN_WIDTH < 1024 ? COLUMNS_TABLET : COLUMNS_DESKTOP);
  const columnGap = IS_WEB ? 20 : (SCREEN_WIDTH < 600 ? 12 : SCREEN_WIDTH < 1024 ? 16 : 20);
  const horizontalPadding = IS_WEB ? 24 : (SCREEN_WIDTH < 600 ? 16 : 24);

  return (
    <View style={styles.container}>
      {IS_WEB && (
        <View style={styles.webHeader}>
          <View style={styles.webHeaderLeft}>
            <Text style={styles.webHeaderTitle}>wiiw</Text>
          </View>
          <View style={styles.webHeaderRight}>
            <Text style={styles.webHeaderLink} onPress={() => navigation.navigate('Inicio')}>Inicio</Text>
            <Text style={styles.webHeaderLink} onPress={() => navigation.navigate('Buscar')}>Buscar</Text>
            <Text style={styles.webHeaderLink} onPress={() => navigation.navigate('Crear')}>Crear</Text>
            <Text style={styles.webHeaderLink} onPress={() => navigation.navigate('Perfil')}>Perfil</Text>
          </View>
        </View>
      )}
      {IS_WEB ? (
        <View style={styles.webGridContainer}>
          <FlatList
            data={stories}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={gridColumns}
            columnWrapperStyle={{ gap: columnGap, paddingHorizontal: horizontalPadding }}
            contentContainerStyle={{ gap: columnGap, paddingBottom: 20 }}
          />
        </View>
      ) : (
        <FlatList
          data={stories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={SCREEN_WIDTH < 600 ? COLUMNS_MOBILE : SCREEN_WIDTH < 1024 ? COLUMNS_TABLET : COLUMNS_DESKTOP}
          columnWrapperStyle={{ gap: SCREEN_WIDTH < 600 ? 12 : SCREEN_WIDTH < 1024 ? 16 : 20, paddingHorizontal: SCREEN_WIDTH < 600 ? 16 : 24 }}
          contentContainerStyle={{ gap: SCREEN_WIDTH < 600 ? 12 : SCREEN_WIDTH < 1024 ? 16 : 20, paddingBottom: 20 }}
        />
      )}
      {loading && !IS_WEB && (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
      )}
      {IS_WEB ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
      ) : (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
      )}

      <Modal
        visible={!!selectedStory}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedStory(null)}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle de la historia</Text>
              <TouchableOpacity onPress={() => setSelectedStory(null)} hitSlop={10}>
                <X color={COLORS.text} size={22} />
              </TouchableOpacity>
            </View>
            {selectedStory ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedStory.cover_url ? (
                  <Image source={{ uri: selectedStory.cover_url }} style={styles.detailCover} />
                ) : (
                  <View style={styles.detailCover} />
                )}
                <Text style={styles.detailTitle}>{selectedStory.title}</Text>
                {selectedStory.genre ? <Text style={styles.detailGenre}>{selectedStory.genre}</Text> : null}
                <Text style={styles.detailDescription}>{selectedStory.description || 'Sin descripción'}</Text>
                <View style={styles.detailActions}>
                  {selectedStory.status === 'published' ? (
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => {
                        const storyId = selectedStory.id;
                        setSelectedStory(null);
                        navigation.navigate('ReadStory', { storyId });
                      }}
                    >
                      <Text style={styles.primaryButtonText}>Leer historia</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => {
                        const storyId = selectedStory.id;
                        setSelectedStory(null);
                        navigation.navigate('ChapterEdit', { storyId });
                      }}
                    >
                      <Text style={styles.primaryButtonText}>Editar capítulos</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => {
                      const template = selectedStory;
                      setSelectedStory(null);
                      navigation.navigate('StoryForm', { template });
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>Recrear</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.detailMeta}>
                  <View style={styles.metaItem}>
                    <Eye color={COLORS.muted} size={16} />
                    <Text style={styles.metaText}>{selectedStory.views_count || 0}</Text>
                  </View>
                  {selectedStory.status === 'published' ? <TouchableOpacity style={styles.metaItem} onPress={() => toggleLike(selectedStory.id)}>
                    <Heart
                      color={detailLike.liked ? COLORS.accent : COLORS.muted}
                      fill={detailLike.liked ? COLORS.accent : 'transparent'}
                      size={16}
                    />
                    <Text style={styles.metaText}>{detailLike.count}</Text>
                  </TouchableOpacity> : null}
                  <View style={styles.metaItem}>
                    <MessageCircle color={COLORS.muted} size={16} />
                    <Text style={styles.metaText}>{commentCounts[selectedStory.id] || 0}</Text>
                  </View>
                  <TouchableOpacity style={styles.metaItem} onPress={() => shareStory(selectedStory.title)}>
                    <Share2 color={COLORS.muted} size={16} />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 },
  header: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', padding: 16 },
  card: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 8, overflow: 'hidden' },
  cover: { height: 140, backgroundColor: COLORS.accentSoft },
  title: { color: COLORS.text, padding: 8, fontSize: 13, fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: COLORS.muted, fontSize: 11 },
  draftLabel: { color: COLORS.accent, fontSize: 10, fontWeight: '600' },
  modalWrap: { flex: 1, backgroundColor: COLORS.scrim, justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  detailCover: { width: '100%', height: 200, borderRadius: 10, backgroundColor: COLORS.accentSoft },
  detailTitle: { color: COLORS.text, fontSize: 22, fontWeight: 'bold', marginTop: 14 },
  detailGenre: { color: COLORS.accent, marginTop: 4, textTransform: 'uppercase', fontSize: 12 },
  detailDescription: { color: COLORS.text, marginTop: 12, lineHeight: 20 },
  detailMeta: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 18, paddingBottom: 8 },
  detailActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  primaryButton: { flex: 1, backgroundColor: COLORS.accent, borderRadius: 8, padding: 12, alignItems: 'center' },
  primaryButtonText: { color: COLORS.white, fontWeight: '600' },
  secondaryButton: { backgroundColor: COLORS.accentSoft, borderRadius: 8, padding: 12, alignItems: 'center' },
  secondaryButtonText: { color: COLORS.accent, fontWeight: '600' },
  webHeader: {
    backgroundColor: COLORS.surface,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  webHeaderTitle: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  webHeaderRight: { flexDirection: 'row', gap: 20 },
  webHeaderLink: { color: COLORS.muted, fontSize: 14 },
  webHeaderLinkActive: { color: COLORS.accent, fontSize: 14, fontWeight: '600' },
  webGridContainer: {
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
    padding: 20,
  },
});
