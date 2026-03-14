import { ThemedText as Text } from '../../components/themed-text';
import { ThemedView as View } from '../../components/themed-view';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SymbolView } from 'expo-symbols';
import { useAuth } from '../../hooks/useAuth';
import { Unauthorized } from '../../components/unauthorized';

// Define types for better safety
interface Student {
  id: string;
  full_name: string;
  student_roll_no: string;
  class_id: number;
}

interface AttendanceState {
  [studentId: string]: 'Present' | 'Absent';
}

export default function AttendanceScreen() {
  const { role, loading: authLoading } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceState>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Date state
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formattedDate = date.toISOString().split('T')[0];

  const fetchClassDetails = useCallback(async (classId: number, targetDate: string) => {
    setLoading(true);
    try {
      // 1. Fetch Students and existing attendance records in parallel
      const [studentsRes, attendanceRes] = await Promise.all([
        supabase.from('students').select('*').eq('class_id', classId),
        supabase.from('attendance').select('student_uid, status').eq('date', targetDate)
      ]);

      if (studentsRes.error) throw studentsRes.error;

      const studentList = studentsRes.data as Student[];
      setStudents(studentList);

      // 2. Map existing attendance to a lookup object
      const existingRecords = (attendanceRes.data || []).reduce((acc: any, row: any) => {
        acc[row.student_uid] = row.status;
        return acc;
      }, {});

      // 3. Initialize UI: Use DB value if it exists, otherwise default to 'Absent'
      const initialAttendance = studentList.reduce((acc, s) => ({
        ...acc,
        [s.id]: existingRecords[s.id] || 'Absent'
      }), {});

      setAttendance(initialAttendance);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('classes').select('*');
    if (error) {
      Alert.alert("Error", "Could not fetch classes");
    } else if (data && data.length > 0) {
      setClasses(data);
      setSelectedClass(data[0]);
      await fetchClassDetails(data[0].id, formattedDate);
    }
    setLoading(false);
  }, [fetchClassDetails, formattedDate]);

  useEffect(() => {
    if (role === 'faculty' || role === 'hod') {
      fetchInitialData();
    }
  }, [role, fetchInitialData]);

  // Re-fetch when date changes
  useEffect(() => {
    if (selectedClass && (role === 'faculty' || role === 'hod')) {
      fetchClassDetails(selectedClass.id, formattedDate);
    }
  }, [formattedDate, selectedClass, fetchClassDetails, role]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const toggleAll = (status: 'Present' | 'Absent') => {
    const newState = students.reduce((acc, s) => ({ ...acc, [s.id]: status }), {});
    setAttendance(newState);
  };

  const saveAttendance = async () => {
    if (students.length === 0) return;
    setSyncing(true);
    try {
      const records = students.map(s => ({
        student_uid: s.id,
        student_name: s.full_name,
        status: attendance[s.id],
        date: formattedDate,
      }));

      // Perform UPSERT: Updates existing records for target date or inserts new ones
      const { error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'student_uid, date' });

      if (error) throw error;
      Alert.alert("Success", `Attendance synced for ${formattedDate}`);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSyncing(false);
    }
  };

  const renderStudent = useCallback(({ item }: { item: Student }) => (
    <View style={styles.studentRow}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.full_name}</Text>
        <Text style={styles.rollNo}>{item.student_roll_no}</Text>
      </View>
      <TouchableOpacity 
        onPress={() => setAttendance(prev => ({
          ...prev, 
          [item.id]: prev[item.id] === 'Present' ? 'Absent' : 'Present' 
        }))}
        style={[styles.statusBtn, attendance[item.id] === 'Present' ? styles.present : styles.absent]}
      >
        <Text style={styles.statusText}>{attendance[item.id]}</Text>
      </TouchableOpacity>
    </View>
  ), [attendance]);

  if (authLoading) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" /></View>;
  if (role !== 'faculty' && role !== 'hod') return <Unauthorized />;
  if (loading && classes.length === 0) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ backgroundColor: 'transparent' }}>
          <Text type="title">Attendance</Text>
          <TouchableOpacity 
            style={styles.datePickerTrigger} 
            onPress={() => setShowDatePicker(true)}
          >
            <SymbolView name="calendar" size={16} tintColor="#2e7d32" />
            <Text style={styles.dateText}>{date.toDateString()}</Text>
            <SymbolView name="chevron.down" size={12} tintColor="#999" />
          </TouchableOpacity>
        </View>
        
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>

      {/* Bulk Controls */}
      <View style={styles.bulkActions}>
        <TouchableOpacity style={styles.bulkBtn} onPress={() => toggleAll('Present')}>
          <SymbolView name="checkmark.circle.fill" size={16} tintColor="#2e7d32" />
          <Text style={styles.bulkTextGreen}>All Present</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bulkBtn} onPress={() => toggleAll('Absent')}>
          <SymbolView name="xmark.circle.fill" size={16} tintColor="#d32f2f" />
          <Text style={styles.bulkTextRed}>Reset All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selector}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={classes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({item}) => (
            <TouchableOpacity 
              onPress={() => setSelectedClass(item)}
              style={[styles.chip, selectedClass?.id === item.id && styles.activeChip]}
            >
              <Text style={[styles.chipText, selectedClass?.id === item.id && styles.activeText]}>
                {item.department} {item.year}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList 
        data={students} 
        keyExtractor={(item) => item.id} 
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={renderStudent}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyContainer}>
            <SymbolView name="person.3.fill" size={50} tintColor="#eee" />
            <Text style={styles.emptyText}>No students in this class.</Text>
          </View>
        ) : null}
      />

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitBtn, syncing && { opacity: 0.7 }]} 
          onPress={saveAttendance} 
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.submitContent}>
              <SymbolView name="icloud.and.arrow.up.fill" size={20} tintColor="#fff" />
              <Text style={styles.submitText}>Sync to Cloud</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: 'transparent' },
  datePickerTrigger: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(46, 125, 50, 0.3)', backgroundColor: 'transparent' },
  dateText: { fontSize: 14, fontWeight: '600', color: '#2e7d32' },
  bulkActions: { flexDirection: 'row', gap: 15, marginBottom: 20, backgroundColor: 'transparent' },
  bulkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'transparent', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#ccc' },
  bulkTextGreen: { color: '#2e7d32', fontWeight: '600', fontSize: 13 },
  bulkTextRed: { color: '#d32f2f', fontWeight: '600', fontSize: 13 },
  selector: { marginBottom: 20, backgroundColor: 'transparent' },
  chip: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, borderWidth: 1, borderColor: '#ccc', marginRight: 10, backgroundColor: 'transparent' },
  chipText: { color: '#666', fontSize: 14, fontWeight: '500' },
  activeChip: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  activeText: { color: '#fff' },
  studentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)', backgroundColor: 'transparent' },
  studentInfo: { backgroundColor: 'transparent' },
  studentName: { fontSize: 16, fontWeight: '600' },
  rollNo: { fontSize: 12, opacity: 0.5, marginTop: 2 },
  statusBtn: { paddingVertical: 10, borderRadius: 12, width: 90, alignItems: 'center' },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  present: { backgroundColor: '#2e7d32' },
  absent: { backgroundColor: '#d32f2f' },
  emptyContainer: { alignItems: 'center', marginTop: 60, opacity: 0.5, backgroundColor: 'transparent' },
  emptyText: { textAlign: 'center', marginTop: 15, fontSize: 16 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.2)', paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  submitBtn: { backgroundColor: '#2e7d32', padding: 18, borderRadius: 20, alignItems: 'center', elevation: 4, shadowColor: '#2e7d32', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  submitContent: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'transparent' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
