import { ThemedText as Text } from '../../components/themed-text';
import { ThemedView as View } from '../../components/themed-view';
import { ThemedCard } from '../../components/themed-card';
import { ThemedInput } from '../../components/themed-input';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { SymbolView } from 'expo-symbols';

export default function StudentDetailScreen() {
  const { studentId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [profile, setProfile] = useState({
    total_fees: '0',
    paid_fees: '0',
    remarks: '',
  });

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch basic student info
      const { data: studentData } = await supabase.from('students').select('*').eq('id', studentId).single();
      // 2. Fetch or create the academic/fee profile
      const { data: profileData } = await supabase.from('student_profiles').select('*').eq('student_id', studentId).maybeSingle();

      if (studentData) setStudent(studentData);
      if (profileData) {
        setProfile({
          total_fees: profileData.total_fees.toString(),
          paid_fees: profileData.paid_fees.toString(),
          remarks: profileData.remarks || '',
        });
      }
    } catch (err) {
      console.error("Error fetching student details:", err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetchStudentData(); }, [fetchStudentData]);

  async function handleSave() {
    const { error } = await supabase.from('student_profiles').upsert({
      student_id: studentId,
      total_fees: parseFloat(profile.total_fees) || 0,
      paid_fees: parseFloat(profile.paid_fees) || 0,
      remarks: profile.remarks,
    });

    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Success", "Student record updated!");
  }

  const pendingAmount = parseFloat(profile.total_fees) - parseFloat(profile.paid_fees);

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" /></View>;

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
          <View style={styles.header}>
            <View style={{ backgroundColor: 'transparent' }}>
              <Text style={styles.name}>{student?.full_name}</Text>
              <Text style={styles.roll}>Roll No: {student?.student_roll_no}</Text>
            </View>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarText}>{student?.full_name?.charAt(0)}</Text>
            </View>
          </View>

          {pendingAmount > 0 && (
            <View style={styles.alertBanner}>
              <SymbolView name="exclamationmark.triangle.fill" size={20} tintColor="#fff" />
              <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                <Text style={styles.alertTitle}>Fee Dues Detected</Text>
                <Text style={styles.alertSub}>Student has a pending balance of ₹{pendingAmount}</Text>
              </View>
            </View>
          )}

          <ThemedCard style={styles.card}>
            <View style={styles.cardHeader}>
              <SymbolView name="creditcard.fill" size={18} tintColor="#2e7d32" />
              <Text style={styles.sectionTitle}>Fee Management</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Total College Fees</Text>
              <ThemedInput 
                keyboardType="numeric"
                value={profile.total_fees}
                onChangeText={(t) => setProfile({...profile, total_fees: t})}
                placeholder="0.00"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount Paid</Text>
              <ThemedInput 
                keyboardType="numeric"
                value={profile.paid_fees}
                onChangeText={(t) => setProfile({...profile, paid_fees: t})}
                placeholder="0.00"
              />
            </View>

            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Outstanding Balance:</Text>
              <Text style={[styles.balanceValue, pendingAmount > 0 ? { color: '#d32f2f' } : { color: '#2e7d32' }]}>
                ₹{pendingAmount}
              </Text>
            </View>
          </ThemedCard>

          <ThemedCard style={styles.card}>
            <View style={styles.cardHeader}>
              <SymbolView name="square.and.pencil" size={18} tintColor="#2e7d32" />
              <Text style={styles.sectionTitle}>Mentor Remarks</Text>
            </View>
            <ThemedInput 
              style={{height: 120, textAlignVertical: 'top'}} 
              multiline
              placeholder="Enter conduct or academic remarks..."
              value={profile.remarks}
              onChangeText={(t) => setProfile({...profile, remarks: t})}
            />
          </ThemedCard>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <SymbolView name="tray.and.arrow.down.fill" size={18} tintColor="#fff" />
            <Text style={styles.saveText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, backgroundColor: 'transparent' },
  name: { fontSize: 26, fontWeight: 'bold' },
  roll: { fontSize: 16, opacity: 0.6, marginTop: 4 },
  avatarMini: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#2e7d32' },
  avatarText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 20 },
  
  alertBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#d32f2f', 
    padding: 15, 
    borderRadius: 15, 
    gap: 12, 
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#d32f2f',
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  alertTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  alertSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },

  card: { 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 20,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, backgroundColor: 'transparent' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  inputGroup: { marginBottom: 15, backgroundColor: 'transparent' },
  label: { fontSize: 13, opacity: 0.5, marginBottom: 8, fontWeight: '500' },
  
  balanceContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 10, 
    paddingTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#f0f0f0',
    backgroundColor: 'transparent'
  },
  balanceLabel: { fontSize: 14, fontWeight: '600', opacity: 0.7 },
  balanceValue: { fontSize: 18, fontWeight: 'bold' },

  saveBtn: { 
    backgroundColor: '#2e7d32', 
    padding: 20, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12,
    elevation: 4,
    shadowColor: '#2e7d32',
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
