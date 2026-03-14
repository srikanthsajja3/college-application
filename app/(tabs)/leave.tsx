import { ThemedText as Text } from '../../components/themed-text';
import { ThemedView as View } from '../../components/themed-view';
import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { SymbolView } from 'expo-symbols';

export default function LeaveRequestScreen() {
  const { role } = useAuth();
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);

  const fetchMyLeaves = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('student_uid', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMyLeaves(data);
    }
  };

  useEffect(() => {
    if (role === 'student') {
      fetchMyLeaves();
    }
  }, [role]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert("Error", "Please provide a reason for your leave.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('leave_requests').insert({
        student_uid: user.id,
        reason,
        date,
        status: 'Pending'
      });

      if (error) throw error;

      Alert.alert("Success", "Leave request submitted for approval.");
      setReason('');
      fetchMyLeaves();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (role !== 'student') {
    return (
      <View style={styles.centered}>
        <Text>Only students can apply for leaves here.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Request Leave</Text>
      
      <View style={styles.formCard}>
        <Text style={styles.label}>Date</Text>
        <TextInput 
          style={styles.input} 
          value={date} 
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>Reason / Purpose</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={reason} 
          onChangeText={setReason}
          placeholder="Explain why you need leave..."
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.subHeader}>My Previous Requests</Text>
      {myLeaves.map((leave) => (
        <View key={leave.id} style={styles.leaveCard}>
          <View>
            <Text style={styles.leaveDate}>{leave.date}</Text>
            <Text style={styles.leaveReason}>{leave.reason}</Text>
          </View>
          <View style={[styles.statusBadge, 
            leave.status === 'Approved' ? styles.approved : 
            leave.status === 'Rejected' ? styles.rejected : styles.pending]}>
            <Text style={styles.statusText}>{leave.status}</Text>
          </View>
        </View>
      ))}
      {myLeaves.length === 0 && <Text style={styles.emptyText}>No leave requests yet.</Text>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  formCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 30 },
  label: { fontSize: 14, color: '#666', marginBottom: 8, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginBottom: 20, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#1a237e', padding: 18, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  subHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  leaveCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#f0f0f0' },
  leaveDate: { fontWeight: 'bold', fontSize: 15 },
  leaveReason: { color: '#666', fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  pending: { backgroundColor: '#ffa000' },
  approved: { backgroundColor: '#2e7d32' },
  rejected: { backgroundColor: '#d32f2f' },
  emptyText: { textAlign: 'center', marginTop: 20, opacity: 0.5 }
});
