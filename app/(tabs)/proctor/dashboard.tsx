import { ThemedText as Text } from '../../../components/themed-text';
import { ThemedView as View } from '../../../components/themed-view';
import { ThemedCard } from '../../../components/themed-card';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { Unauthorized } from '../../../components/unauthorized';

export default function ProctorDashboard() {
  const { role, loading: authLoading } = useAuth();
  const [myBatches, setMyBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (role === 'proctor') {
      fetchProctorBatches();
    }
  }, [role]);

  async function fetchProctorBatches() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('proctor_id', user.id);

    if (error) Alert.alert("Error", error.message);
    else setMyBatches(data || []);
    setLoading(false);
  }

  if (authLoading) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" /></View>;
  if (role !== 'proctor') return <Unauthorized />;
  if (loading) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" /></View>;

  return (
    <View style={styles.container}>
      <Text type="title">Proctoring</Text>
      <Text style={styles.subHeader}>Assignments & Management</Text>

      <FlatList
        data={myBatches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => router.push({
              pathname: "/proctor/manage-batch",
              params: { batchId: item.id, batchName: `${item.department} ${item.section}` }
            })}
          >
            <ThemedCard style={styles.card}>
              <View style={{ backgroundColor: 'transparent', flex: 1 }}>
                <Text style={styles.cardTitle}>{item.department} - {item.section}</Text>
                <Text style={styles.cardDetail}>Batch: {item.batch_name} | Year: {item.current_year}</Text>
              </View>
              <SymbolView name="chevron.right" tintColor="#2e7d32" />
            </ThemedCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, opacity: 0.5 }}>No batches assigned yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subHeader: { fontSize: 14, opacity: 0.6, marginBottom: 25, marginTop: 5 },
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 15, 
    marginBottom: 12 
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardDetail: { fontSize: 13, opacity: 0.5, marginTop: 4 }
});
