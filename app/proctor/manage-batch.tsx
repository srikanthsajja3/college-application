import { ThemedText as Text } from '../../components/themed-text';
import { ThemedView as View } from '../../components/themed-view';
import { ThemedCard } from '../../components/themed-card';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ManageBatchScreen() {
  const { batchId, batchName } = useLocalSearchParams();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStudents();
  }, [batchId]);

  async function fetchStudents() {
    setLoading(true);
    // Fetch students belonging to this batch/class
    // Note: Assuming batchId maps to class_id or similar in your schema
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', batchId)
      .order('student_roll_no', { ascending: true });

    if (error) Alert.alert("Error", error.message);
    else setStudents(data || []);
    setLoading(false);
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <SymbolView name="chevron.left" size={20} tintColor="#2e7d32" />
        </TouchableOpacity>
        <View style={{ backgroundColor: 'transparent' }}>
          <Text type="title">{batchName}</Text>
          <Text style={styles.subtitle}>Manage Students & Mentors</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{students.length}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Mentor Groups</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.actionBtn}>
        <SymbolView name="person.2.badge.key.fill" tintColor="#fff" size={20} />
        <Text style={styles.actionText}>Create Mentor Group</Text>
      </TouchableOpacity>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => router.push({
              pathname: "/mentor/student-detail",
              params: { studentId: item.id }
            })}
          >
            <ThemedCard style={styles.studentCard}>
              <View style={{ backgroundColor: 'transparent' }}>
                <Text style={styles.studentName}>{item.full_name}</Text>
                <Text style={styles.studentRoll}>{item.student_roll_no}</Text>
              </View>
              <View style={styles.mentorBadge}>
                <Text style={styles.mentorText}>No Mentor</Text>
              </View>
            </ThemedCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, opacity: 0.5 }}>No students found in this batch.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 25, backgroundColor: 'transparent' },
  backBtn: { padding: 5 },
  subtitle: { fontSize: 14, opacity: 0.6, marginTop: 2 },
  statsRow: { flexDirection: 'row', backgroundColor: '#f0f7f0', borderRadius: 20, padding: 20, marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center', backgroundColor: 'transparent' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#2e7d32' },
  statLabel: { fontSize: 12, opacity: 0.6, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: 'rgba(46, 125, 50, 0.1)', height: '100%' },
  actionBtn: { backgroundColor: '#2e7d32', flexDirection: 'row', padding: 15, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 },
  actionText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  studentCard: { padding: 15, borderRadius: 15, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  studentName: { fontSize: 16, fontWeight: 'bold' },
  studentRoll: { fontSize: 13, opacity: 0.5, marginTop: 2 },
  mentorBadge: { backgroundColor: '#f5f5f5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  mentorText: { fontSize: 11, color: '#999', fontWeight: '600' }
});
