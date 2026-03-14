import { ThemedText as Text } from '../../components/themed-text';
import { ThemedView as View } from '../../components/themed-view';
import { ThemedCard } from '../../components/themed-card';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols'; 
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAnnouncements();
  }, []);
  
  async function fetchAnnouncements() {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setNotices(data || []);
    setLoading(false);
  }

  // New Delete Function
  async function deleteNotice(id: string) {
    Alert.alert(
      "Delete Notice",
      "Are you sure you want to remove this announcement?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            const { error } = await supabase
              .from('announcements')
              .delete()
              .eq('id', id);

            if (error) {
              Alert.alert("Error", error.message);
            } else {
              // Optimistic update: remove from local state immediately
              setNotices(prev => prev.filter(item => item.id !== id));
            }
          } 
        }
      ]
    );
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={{ backgroundColor: 'transparent' }}>
          <Text type="title">Notice Board</Text>
          <Text style={styles.subtitle}>Recent Updates</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.createButton} 
          onPress={() => router.push('/create-announcement')}
        >
          <Text style={styles.createButtonText}>+ Post</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={notices}
        keyExtractor={(item) => item.id}
        onRefresh={fetchAnnouncements}
        refreshing={loading}
        renderItem={({ item }) => (
          <ThemedCard style={styles.card}>
            <View style={styles.cardHeader}>
               <Text style={styles.cardTitle}>{item.title}</Text>
               <TouchableOpacity onPress={() => deleteNotice(item.id)} style={styles.deleteBtn}>
                  <SymbolView name="trash.fill" size={20} tintColor="#ff4444" />
               </TouchableOpacity>
            </View>

            {item.image_url && <Image source={{ uri: item.image_url }} style={styles.cardImage} />}
            <Text style={styles.cardContent}>{item.content}</Text>
            
            <View style={styles.cardFooter}>
              <Text style={styles.author}>By: {item.author_name || 'Admin'}</Text>
              <Text style={styles.tag}>{item.target_year}</Text>
            </View>
          </ThemedCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: 'transparent'
  },
  subtitle: { fontSize: 14, opacity: 0.6 },
  createButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  createButtonText: { color: '#fff', fontWeight: 'bold' },
  card: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    marginBottom: 5,
  },
  deleteBtn: {
    padding: 5,
  },
  cardImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', flex: 1 },
  cardContent: { fontSize: 14, opacity: 0.8, marginBottom: 10 },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(150,150,150,0.2)', 
    paddingTop: 10, 
    backgroundColor: 'transparent' 
  },
  author: { fontSize: 12, fontWeight: '600' },
  tag: { fontSize: 12, color: '#2e7d32', fontWeight: 'bold' }
});
