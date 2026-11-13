import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { supabase } from '../config/supabase';
import { COLORS } from '../config/theme';

export default function ActivityScreen() {
  const [tab, setTab] = useState('saved');
  const [data, setData] = useState([]);
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
        const { data: likes } = await supabase.from('likes').select('*').eq('user_id', user.id);
        setData(likes || []);
      } else if (tab === 'comments') {
        const { data: comments } = await supabase.from('comments').select('*').eq('user_id', user.id);
        setData(comments || []);
      }
    };
    load();
  }, [tab, user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Actividad</Text>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'saved' && styles.tabActive]} onPress={() => setTab('saved')}><Text style={styles.tabText}>Guardados</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'likes' && styles.tabActive]} onPress={() => setTab('likes')}><Text style={styles.tabText}>Likes</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'comments' && styles.tabActive]} onPress={() => setTab('comments')}><Text style={styles.tabText}>Comentarios</Text></TouchableOpacity>
      </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: { color: COLORS.text, fontSize: 24, fontWeight: 'bold', padding: 16 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  tab: { flex: 1, backgroundColor: COLORS.surface, padding: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: COLORS.accentSoft },
  tabText: { color: COLORS.text },
  item: { backgroundColor: COLORS.surface, padding: 14, borderRadius: 8, marginBottom: 10 },
  itemText: { color: COLORS.text },
});
