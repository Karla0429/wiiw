import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { supabase } from '../config/supabase';
import { useAppStyles } from '../context/AppThemeContext';
import BackButton from '../components/BackButton';

export default function ActivityScreen({ navigation }) {
  const styles = useAppStyles(createStyles);
  const [tab, setTab] = useState('saved');
  const [data, setData] = useState([]);
  const [likesCount, setLikesCount] = useState(null);
  const [likesError, setLikesError] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      if (tab === 'saved') {
        const { data: saved } = await supabase.from('saved_items').select('*').eq('user_id', user.id);
        setData(saved || []);
      } else if (tab === 'likes') {
        setLikesCount(null);
        setLikesError(false);
        const { count, error } = await supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading likes count:', error);
          setLikesError(true);
          return;
        }

        setLikesCount(count);
      } else if (tab === 'comments') {
        const { data: comments } = await supabase.from('comments').select('*').eq('user_id', user.id);
        setData(comments || []);
      }
    };
    load();
  }, [tab, user]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
      </View>
      <Text style={styles.title}>Actividad</Text>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'saved' && styles.tabActive]} onPress={() => setTab('saved')}><Text style={styles.tabText}>Guardados</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'likes' && styles.tabActive]} onPress={() => setTab('likes')}><Text style={styles.tabText}>Likes</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'comments' && styles.tabActive]} onPress={() => setTab('comments')}><Text style={styles.tabText}>Comentarios</Text></TouchableOpacity>
      </View>
      {tab === 'likes' ? (
        <View style={[styles.item, styles.likesSummary]}>
          <Text style={styles.likesCount}>
            {likesError ? '—' : likesCount === null ? '…' : likesCount}
          </Text>
          <Text style={styles.itemText}>
            {likesError
              ? 'No se pudieron cargar tus likes'
              : `${likesCount === 1 ? 'like' : 'likes'} que has dado`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => item.id?.toString() || i.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemText}>{tab === 'comments' ? item.content : `ID: ${item.target_id || item.idea_id || item.story_id}`}</Text>
            </View>
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  title: { color: colors.text, fontSize: 24, fontWeight: 'bold', padding: 16 },
  tabs: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  tab: { backgroundColor: colors.surface, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.accentSoft },
  tabText: { color: colors.text },
  item: { backgroundColor: colors.surface, padding: 14, borderRadius: 8, marginBottom: 10 },
  itemText: { color: colors.text },
  likesSummary: { margin: 16, alignItems: 'center', paddingVertical: 24 },
  likesCount: { color: colors.text, fontSize: 40, fontWeight: 'bold' },
});
