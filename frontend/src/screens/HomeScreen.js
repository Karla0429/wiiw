import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Share, Image, Modal, ScrollView, ActivityIndicator, Alert, Platform, useWindowDimensions } from 'react-native';
import { supabase } from '../config/supabase';
import { Heart, MessageCircle, Share2, Eye, X, BookOpen } from 'lucide-react-native';
import { useAppStyles, useAppTheme } from '../context/AppThemeContext';

const IS_WEB = Platform.OS === 'web';
const COLUMNS_MOBILE = 2;
const COLUMNS_TABLET = 3;
const COLUMNS_DESKTOP = 4;
const COLUMNS_WIDE = 5;

export default function HomeScreen({ navigation }) {
  const { colors } = useAppTheme();
  const styles = useAppStyles(createStyles);
  const { width: screenWidth } = useWindowDimensions();
  const [stories, setStories] = useState([]);
  const [user, setUser] = useState(null);
  const [likes, setLikes] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [selectedStory, setSelectedStory] = useState(null);
  const [detailTab, setDetailTab] = useState('summary');
  const [storyChapters, setStoryChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const isWide = screenWidth >= 700;

  useEffect(() => {
    let active = true;
    if (!selectedStory) return () => { active = false; };

    const loadChapterList = async () => {
      const { data, error } = await supabase
        .from('chapters')
        .select('id, chapter_number, title')
        .eq('story_id', selectedStory.id)
        .order('chapter_number', { ascending: true });

      if (!active) return;
      if (error) {
        Alert.alert('Error', `No se pudieron cargar los capítulos: ${error.message}`);
        return;
      }
      setStoryChapters(data || []);
    };

    loadChapterList();
    return () => {
      active = false;
    };
  }, [selectedStory]);

  const loadLikes = useCallback(async (storyList, currentUser) => {
    const storyIds = storyList.map((story) => story.id);
    if (!storyIds.length) {
      setLikes({});
      return;
    }

    const { data, error } = await supabase.from('likes').select('story_id, user_id').in('story_id', storyIds);
    if (error) {
      Alert.alert('Error', `No se pudieron cargar los likes: ${error.message}`);
      return;
    }

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

    const { data, error } = await supabase.from('comments').select('story_id').in('story_id', storyIds);
    if (error) {
      Alert.alert('Error', `No se pudieron cargar los comentarios: ${error.message}`);
      return;
    }

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
    const { error } = await supabase.rpc('increment_story_views', { p_story_id: id });
    if (error) console.error('No se pudo registrar la vista de la historia:', error);
  };

  const openStory = (story) => {
    const viewIncrement = story.status === 'published' ? 1 : 0;
    setDetailTab('summary');
    setStoryChapters([]);
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

    try {
      const { data: existing, error: lookupError } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('story_id', storyId)
        .maybeSingle();
      if (lookupError) throw lookupError;

      const { error } = existing
        ? await supabase.from('likes').delete().eq('id', existing.id)
        : await supabase.from('likes').insert({ user_id: user.id, story_id: storyId });
      if (error) throw error;

      await loadLikes(stories, user);
    } catch (error) {
      setLikes((prev) => ({ ...prev, [storyId]: current }));
      Alert.alert('Error', `No se pudo actualizar el like: ${error.message}`);
    }
  };

  const shareStory = async (title) => {
    try {
      await Share.share({ message: `Mira esta historia en wiiw: ${title}` });
    } catch (error) {
      Alert.alert('Error', `No se pudo compartir la historia: ${error.message}`);
    }
  };

  const renderItem = ({ item }) => {
    const like = likes[item.id] || { count: 0, liked: false };
    return (
      <TouchableOpacity style={styles.card} onPress={() => openStory(item)} activeOpacity={0.85}>
        {item.cover_url ? (
          <Image source={{ uri: item.cover_url }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <BookOpen color={colors.accent} size={32} />
          </View>
        )}
        <View style={styles.cardOverlay}>
          <Text style={styles.title} numberOfLines={2}>{item.title || 'Sin título'}</Text>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Eye color={colors.white} size={14} />
              <Text style={styles.metaText}>{item.views_count || 0}</Text>
            </View>
            {item.status === 'published' ? <TouchableOpacity style={styles.metaItem} onPress={() => toggleLike(item.id)} hitSlop={8}>
              <Heart color={colors.white} fill={like.liked ? colors.white : 'transparent'} size={14} />
              <Text style={styles.metaText}>{like.count}</Text>
            </TouchableOpacity> : <Text style={styles.draftLabel}>Borrador</Text>}
            {item.status === 'published' ? <TouchableOpacity style={styles.metaItem} onPress={() => openStory(item)} hitSlop={8}>
              <MessageCircle color={colors.white} size={14} />
              <Text style={styles.metaText}>{commentCounts[item.id] || 0}</Text>
            </TouchableOpacity> : null}
            <TouchableOpacity style={styles.metaItem} onPress={() => shareStory(item.title)} hitSlop={8}>
              <Share2 color={colors.white} size={14} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const detailLike = selectedStory ? (likes[selectedStory.id] || { count: 0, liked: false }) : { count: 0, liked: false };

  const gridColumns = screenWidth < 600
    ? COLUMNS_MOBILE
    : screenWidth < 900
      ? COLUMNS_TABLET
      : screenWidth < 1200
        ? COLUMNS_DESKTOP
        : COLUMNS_WIDE;
  const columnGap = screenWidth < 600 ? 12 : screenWidth < 900 ? 16 : 20;
  const horizontalPadding = IS_WEB ? 24 : (screenWidth < 600 ? 16 : 24);

  return (
    <View style={styles.container}>
      {IS_WEB ? (
        <View style={styles.webGridContainer}>
          <FlatList
            key={`web-grid-${gridColumns}`}
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
          key={`story-grid-${gridColumns}`}
          data={stories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={gridColumns}
          columnWrapperStyle={{ gap: columnGap, paddingHorizontal: horizontalPadding }}
          contentContainerStyle={{ gap: columnGap, paddingBottom: 20 }}
        />
      )}
      {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : null}

      <Modal
        visible={!!selectedStory}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedStory(null)}
      >
        <View style={[styles.modalWrap, isWide && styles.modalWrapWide]}>
          <View style={[styles.modal, isWide && styles.modalWide]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vista previa</Text>
              <TouchableOpacity onPress={() => setSelectedStory(null)} hitSlop={10}>
                <X color={colors.text} size={22} />
              </TouchableOpacity>
            </View>
            {selectedStory ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.detailHero, isWide && styles.detailHeroWide]}>
                  {selectedStory.cover_url ? (
                    <Image source={{ uri: selectedStory.cover_url }} style={[styles.detailCover, isWide && styles.detailCoverWide]} />
                  ) : (
                    <View style={[styles.detailCover, isWide && styles.detailCoverWide]} />
                  )}
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailTitle}>{selectedStory.title || 'Sin título'}</Text>
                    <Text style={styles.detailAuthor}>
                      {selectedStory.profiles?.username ? `Por ${selectedStory.profiles.username}` : selectedStory.genre || 'Historia'}
                    </Text>
                    <View style={styles.detailMeta}>
                      <View style={styles.metaItem}>
                        <Eye color={colors.muted} size={16} />
                        <Text style={styles.metaText}>{selectedStory.views_count || 0}</Text>
                      </View>
                      {selectedStory.status === 'published' ? <TouchableOpacity style={styles.metaItem} onPress={() => toggleLike(selectedStory.id)}>
                        <Heart
                          color={detailLike.liked ? colors.accent : colors.muted}
                          fill={detailLike.liked ? colors.accent : 'transparent'}
                          size={16}
                        />
                        <Text style={styles.metaText}>{detailLike.count}</Text>
                      </TouchableOpacity> : null}
                      <View style={styles.metaItem}>
                        <BookOpen color={colors.muted} size={16} />
                        <Text style={styles.metaText}>{storyChapters.length} capítulos</Text>
                      </View>
                    </View>
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
                          <Text style={styles.primaryButtonText}>Empezar a leer</Text>
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
                  </View>
                </View>
                <View style={styles.detailTabs}>
                  <TouchableOpacity
                    style={[styles.detailTab, detailTab === 'summary' && styles.detailTabActive]}
                    onPress={() => setDetailTab('summary')}
                  >
                    <Text style={[styles.detailTabText, detailTab === 'summary' && styles.detailTabTextActive]}>Resumen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.detailTab, detailTab === 'chapters' && styles.detailTabActive]}
                    onPress={() => setDetailTab('chapters')}
                  >
                    <Text style={[styles.detailTabText, detailTab === 'chapters' && styles.detailTabTextActive]}>Capítulos ({storyChapters.length})</Text>
                  </TouchableOpacity>
                </View>
                {detailTab === 'summary' ? (
                  <View style={styles.detailSummary}>
                    <View style={styles.detailMetaLine}>
                      <Text style={styles.detailLabel}>Género</Text>
                      <Text style={styles.detailValue}>{selectedStory.genre || 'Sin género'}</Text>
                    </View>
                    {selectedStory.language ? (
                      <View style={styles.detailMetaLine}>
                        <Text style={styles.detailLabel}>Idioma</Text>
                        <Text style={styles.detailValue}>{selectedStory.language}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.detailDescription}>{selectedStory.description || 'Sin descripción'}</Text>
                    {selectedStory.characters ? <Text style={styles.detailTags}>Personajes: {selectedStory.characters}</Text> : null}
                    <View style={styles.detailFooter}>
                      <View style={styles.metaItem}>
                        <MessageCircle color={colors.muted} size={15} />
                        <Text style={styles.metaText}>{commentCounts[selectedStory.id] || 0}</Text>
                      </View>
                      <TouchableOpacity style={styles.metaItem} onPress={() => shareStory(selectedStory.title)}>
                        <Share2 color={colors.muted} size={15} />
                        <Text style={styles.metaText}>Compartir</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.chapterList}>
                    {storyChapters.length ? storyChapters.map((chapter) => (
                      <TouchableOpacity
                        key={chapter.id}
                        style={styles.chapterRow}
                        onPress={() => {
                          const storyId = selectedStory.id;
                          const chapterNumber = chapter.chapter_number;
                          setSelectedStory(null);
                          navigation.navigate('ReadStory', { storyId, chapterNumber });
                        }}
                      >
                        <Text style={styles.chapterRowNumber}>Capítulo {chapter.chapter_number}</Text>
                        <Text style={styles.chapterRowTitle}>{chapter.title || 'Sin título'}</Text>
                      </TouchableOpacity>
                    )) : <Text style={styles.detailDescription}>Esta historia todavía no tiene capítulos.</Text>}
                  </View>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 },
  header: { color: colors.text, fontSize: 28, fontWeight: 'bold', padding: 16 },
  card: { flex: 1, aspectRatio: 1, backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden' },
  cover: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  coverImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  coverPlaceholder: { backgroundColor: colors.accentSoft },
  cardOverlay: { position: 'absolute', right: 0, bottom: 0, left: 0, padding: 10, backgroundColor: 'rgba(25, 22, 19, 0.72)', gap: 6 },
  title: { color: colors.white, fontSize: 14, lineHeight: 18, fontWeight: '700' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: colors.white, fontSize: 11 },
  draftLabel: { color: colors.white, fontSize: 10, fontWeight: '600' },
  modalWrap: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end', alignItems: 'center' },
  modalWrapWide: { justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '90%', width: '100%' },
  modalWide: { maxWidth: 900, borderRadius: 12, padding: 32 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  detailHero: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  detailHeroWide: { gap: 24 },
  detailCover: { width: 112, height: 168, borderRadius: 8, backgroundColor: colors.accentSoft },
  detailCoverWide: { width: 180, height: 270 },
  detailInfo: { flex: 1, minWidth: 0, justifyContent: 'space-between', alignSelf: 'stretch' },
  detailTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  detailAuthor: { color: colors.muted, marginTop: 5, fontSize: 14 },
  detailMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 14 },
  detailActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  primaryButton: { flexGrow: 1, backgroundColor: colors.accent, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center' },
  primaryButtonText: { color: colors.white, fontWeight: '600' },
  secondaryButton: { backgroundColor: colors.accentSoft, borderRadius: 8, padding: 12, alignItems: 'center' },
  secondaryButtonText: { color: colors.accent, fontWeight: '600' },
  detailTabs: { flexDirection: 'row', gap: 28, borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: 26 },
  detailTab: { paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  detailTabActive: { borderBottomColor: colors.accent },
  detailTabText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  detailTabTextActive: { color: colors.text },
  detailSummary: { paddingTop: 18 },
  detailMetaLine: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 12 },
  detailLabel: { color: colors.muted, width: 70, fontSize: 13 },
  detailValue: { color: colors.text, flex: 1, fontSize: 13 },
  detailDescription: { color: colors.text, marginTop: 12, fontSize: 14, lineHeight: 22 },
  detailTags: { color: colors.muted, marginTop: 12, fontSize: 13, lineHeight: 20 },
  detailFooter: { flexDirection: 'row', gap: 20, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 18, paddingTop: 14 },
  chapterList: { paddingTop: 8 },
  chapterRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  chapterRowNumber: { color: colors.muted, fontSize: 12 },
  chapterRowTitle: { color: colors.text, fontSize: 15, fontWeight: '600', marginTop: 4 },
  webGridContainer: {
    maxWidth: 1280,
    alignSelf: 'center',
    width: '100%',
    padding: 20,
  },
});
