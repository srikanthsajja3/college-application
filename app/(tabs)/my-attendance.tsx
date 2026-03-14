import { ThemedText as Text } from '../../components/themed-text';
import { ThemedView as View } from '../../components/themed-view';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Unauthorized } from '../../components/unauthorized';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import { SymbolView } from 'expo-symbols';

// PVPSIT Campus Location (Vijayawada)
const CAMPUS_LOCATION = {
  latitude: 16.4875, 
  longitude: 80.6938,
  radius: 500, // 500 meters radius
};

export default function MyAttendanceScreen() {
  const { role, loading: authLoading } = useAuth();
  const [personalStats, setPersonalStats] = useState<any>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [hasMarkedToday, setHasMarkedToday] = useState(false);

  const fetchPersonalAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch student info
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (studentData) {
        setStudentInfo(studentData);
      }

      // Fetch attendance records
      const { data, error } = await supabase
        .from('attendance') 
        .select('status, date')
        .eq('student_uid', user.id); 

      if (!error && data) {
        const total = data.length;
        const present = data.filter((r: any) => r.status === 'Present').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        setPersonalStats({ total, present, percentage });

        // Check if marked today
        const today = new Date().toISOString().split('T')[0];
        setHasMarkedToday(data.some(r => r.date === today));
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

  const handleMarkAttendance = async () => {
    setMarkingAttendance(true);
    try {
      // 1. Check Biometrics
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const auth = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify your identity to mark attendance',
          fallbackLabel: 'Enter Passcode',
        });

        if (!auth.success) {
          Alert.alert("Failed", "Authentication failed");
          return;
        }
      }

      // 2. Check Location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission denied", "Location permission is required to mark attendance.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const distance = getDistance(
        location.coords.latitude,
        location.coords.longitude,
        CAMPUS_LOCATION.latitude,
        CAMPUS_LOCATION.longitude
      );

      if (distance > CAMPUS_LOCATION.radius) {
        Alert.alert("Out of Range", `You are ${Math.round(distance)}m away from campus. Please be on campus to mark attendance.`);
        return;
      }

      // 3. Submit Attendance
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('attendance').upsert({
        student_uid: studentInfo.id,
        student_name: studentInfo.full_name,
        status: 'Present',
        date: today,
      }, { onConflict: 'student_uid, date' });

      if (error) throw error;

      Alert.alert("Success", "Attendance marked successfully!");
      fetchPersonalAttendance();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setMarkingAttendance(false);
    }
  };

  // Helper function to calculate distance in meters
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
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

        {/* Mark Attendance Button */}
        <TouchableOpacity 
          style={[
            styles.markBtn, 
            (hasMarkedToday || markingAttendance) && styles.disabledBtn
          ]} 
          onPress={handleMarkAttendance}
          disabled={hasMarkedToday || markingAttendance}
        >
          {markingAttendance ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'transparent' }}>
              <SymbolView 
                name={hasMarkedToday ? "checkmark.circle.fill" : "location.fill"} 
                tintColor="#fff" 
                size={20} 
              />
              <Text style={styles.markBtnText}>
                {hasMarkedToday ? "Already Marked Today" : "Mark Presence (Check-in)"}
              </Text>
            </View>
          )}
        </TouchableOpacity>

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
  mainCard: { flexDirection: 'row', backgroundColor: '#2e7d32', padding: 25, borderRadius: 20, alignItems: 'center', marginBottom: 20 },
  circle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(0, 0, 0, 0.2)', justifyContent: 'center', alignItems: 'center' },
  percentageText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  summaryInfo: { marginLeft: 20, backgroundColor: 'transparent' },
  summaryLabel: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 },
  summaryDetail: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginTop: 5 },
  markBtn: { backgroundColor: '#1a237e', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 25, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  disabledBtn: { backgroundColor: '#9e9e9e', opacity: 0.8 },
  markBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  subHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  subjectCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: '#f0f0f0' },
  subjectName: { fontSize: 16, fontWeight: 'bold' },
  subjectDetail: { fontSize: 12, opacity: 0.5, marginTop: 2 },
  subjectPercent: { fontSize: 16, fontWeight: 'bold' },
  low: { color: '#d32f2f' },
  high: { color: '#2e7d32' },
  emptyText: { textAlign: 'center', marginTop: 20, opacity: 0.5 }
});

