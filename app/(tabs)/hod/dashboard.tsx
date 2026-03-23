import { ThemedText as Text } from '../../../components/themed-text';
import { ThemedView as View } from '../../../components/themed-view';
import { ThemedCard } from '../../../components/themed-card';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { Unauthorized } from '../../../components/unauthorized';
import { useRouter } from 'expo-router';

export default function HODDashboard() {
  const { role, loading: authLoading } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (role === 'hod') {
      fetchBatches();
    }
  }, [role]);

  async function fetchBatches() {
    setLoading(true);
    // Fetch batches and join with faculty to see Proctor names
    const { data, error } = await supabase
      .from('batches')
      .select(`
        *,
        proctor:faculty(full_name)
      `);

    if (error) Alert.alert("Error", error.message);
    else setBatches(data || []);
    setLoading(false);
  }

  if (authLoading) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" /></View>;
  if (role !== 'hod') return <Unauthorized />;
  if (loading) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text type="title">HOD Panel</Text>
        <View style={styles.headerActions}>
           <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: '#1565c0', marginRight: 10 }]} 
            onPress={() => router.push('/hod/leaves')}
          >
            <SymbolView name="calendar.badge.exclamationmark" tintColor="#fff" size={20} />
            <Text style={styles.addText}>Leaves</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.addBtn} 
            onPress={() => router.push('/hod/add-batch')}
          >
            <SymbolView name="plus.circle.fill" tintColor="#fff" size={20} />
            <Text style={styles.addText}>Batch</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={batches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThemedCard style={styles.batchCard}>
            <View style={styles.cardInfo}>
              <Text style={styles.batchTitle}>{item.department} - {item.section}</Text>
              <Text style={styles.batchSub}>{item.batch_name} | {item.current_year} Year</Text>

              <View style={styles.proctorBadge}>
                <SymbolView name="person.badge.shield.checkmark.fill" size={14} tintColor="#2e7d32" />
                <Text style={styles.proctorName}> Proctor: {item.proctor?.full_name || 'Unassigned'}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.detailBtn}>
              <SymbolView name="chevron.right" tintColor="#2e7d32" />
            </TouchableOpacity>
          </ThemedCard>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, opacity: 0.5 }}>No batches found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, backgroundColor: 'transparent' },
  headerActions: { flexDirection: 'row', backgroundColor: 'transparent' },
  addBtn: { backgroundColor: '#2e7d32', flexDirection: 'row', padding: 10, borderRadius: 12, alignItems: 'center' },
  addText: { color: '#fff', marginLeft: 8, fontWeight: '600', fontSize: 13 },
  batchCard: { padding: 20, borderRadius: 15, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  cardInfo: { backgroundColor: 'transparent' },
  batchTitle: { fontSize: 18, fontWeight: 'bold' },
  batchSub: { fontSize: 14, opacity: 0.6, marginTop: 4 },
  proctorBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: 'rgba(46, 125, 50, 0.1)', padding: 6, borderRadius: 8, alignSelf: 'flex-start' },
  proctorName: { fontSize: 13, color: '#2e7d32', fontWeight: '500' },
  detailBtn: { padding: 10 }
});
