import { ThemedText as Text } from '../../../components/themed-text';
import { ThemedView as View } from '../../../components/themed-view';
import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { SymbolView } from 'expo-symbols';

export default function HodLeavesScreen() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<any[]>([]);

  const fetchLeaves = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, students(full_name, roll_number)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLeaves(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (role === 'hod') {
      fetchLeaves();
    }
  }, [role]);

  const handleAction = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      Alert.alert("Success", `Request ${status}`);
      fetchLeaves();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  if (role !== 'hod') {
    return <View style={styles.centered}><Text>Access Denied</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Leave Management</Text>
      
      {loading ? (
        <ActivityIndicator color="#2e7d32" />
      ) : (
        leaves.map((leave) => (
          <View key={leave.id} style={styles.leaveCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>{leave.students?.full_name || 'Unknown Student'}</Text>
              <Text style={styles.studentDetail}>{leave.students?.roll_number} | {leave.date}</Text>
              <Text style={styles.reasonText}>"{leave.reason}"</Text>
            </View>

            {leave.status === 'Pending' ? (
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.approveBtn]} 
                  onPress={() => handleAction(leave.id, 'Approved')}
                >
                  <SymbolView name="checkmark.circle.fill" tintColor="#fff" size={20} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.rejectBtn]} 
                  onPress={() => handleAction(leave.id, 'Rejected')}
                >
                  <SymbolView name="xmark.circle.fill" tintColor="#fff" size={20} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.statusBadge, 
                leave.status === 'Approved' ? styles.approved : styles.rejected]}>
                <Text style={styles.statusText}>{leave.status}</Text>
              </View>
            )}
          </View>
        ))
      )}

      {leaves.length === 0 && !loading && <Text style={styles.emptyText}>No leave requests found.</Text>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  leaveCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderLeftWidth: 5, borderLeftColor: '#2e7d32' },
  studentName: { fontSize: 16, fontWeight: 'bold' },
  studentDetail: { fontSize: 12, color: '#666', marginBottom: 8 },
  reasonText: { fontSize: 14, fontStyle: 'italic', color: '#444' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  approveBtn: { backgroundColor: '#2e7d32' },
  rejectBtn: { backgroundColor: '#d32f2f' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  approved: { backgroundColor: '#2e7d32' },
  rejected: { backgroundColor: '#d32f2f' },
  emptyText: { textAlign: 'center', marginTop: 20, opacity: 0.5 }
});
