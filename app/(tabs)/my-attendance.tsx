import { ThemedText as Text } from '../../components/themed-text';
import { ThemedView as View } from '../../components/themed-view';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Unauthorized } from '../../components/unauthorized';

export default function MyAttendanceScreen() {
  const { role, loading: authLoading } = useAuth();
  const [personalStats, setPersonalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPersonalAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('attendance') 
        .select('status')
        .eq('student_uid', user.id); 

      if (!error && data) {
        const total = data.length;
        const present = data.filter((r: any) => r.status === 'Present').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        setPersonalStats({ total, present, percentage });
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (role === 'student') {
      fetchPersonalAttendance();
    }
  }, [role, fetchPersonalAttendance]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPersonalAttendance();
  };

  if (authLoading) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" /></View>;
  if (role !== 'student') return <Unauthorized />;
  if (loading && !refreshing) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" /></View>;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2e7d32" />}
      >
        <Text style={styles.header}>My Dashboard</Text>

        {/* Main Percentage Card */}
        <View style={styles.mainCard}>
          <View style={styles.circle}>
            <Text style={styles.percentageText}>{personalStats?.percentage || 0}%</Text>
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Overall Attendance</Text>
            <Text style={styles.summaryDetail}>
              {personalStats?.present || 0} / {personalStats?.total || 0} Classes attended
            </Text>
          </View>
        </View>

        <Text style={styles.subHeader}>Summary Details</Text>
        
        {personalStats?.total === 0 ? (
          <Text style={styles.emptyText}>No attendance records found yet.</Text>
        ) : (
          <View style={styles.subjectCard}>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                <Text style={styles.subjectName}>Total Monthly Progress</Text>
                <Text style={styles.subjectDetail}>Based on all marked sessions</Text>
              </View>
              <Text style={[
                styles.subjectPercent, 
                (personalStats?.percentage || 0) < 75 ? styles.low : styles.high
              ]}>
                {personalStats?.percentage || 0}%
              </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  mainCard: { flexDirection: 'row', backgroundColor: '#2e7d32', padding: 25, borderRadius: 20, alignItems: 'center', marginBottom: 25 },
  circle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(0, 0, 0, 0.2)', justifyContent: 'center', alignItems: 'center' },
  percentageText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  summaryInfo: { marginLeft: 20, backgroundColor: 'transparent' },
  summaryLabel: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 },
  summaryDetail: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginTop: 5 },
  subHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  subjectCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: '#f0f0f0' },
  subjectName: { fontSize: 16, fontWeight: 'bold' },
  subjectDetail: { fontSize: 12, opacity: 0.5, marginTop: 2 },
  subjectPercent: { fontSize: 16, fontWeight: 'bold' },
  low: { color: '#d32f2f' },
  high: { color: '#2e7d32' },
  emptyText: { textAlign: 'center', marginTop: 20, opacity: 0.5 }
});
