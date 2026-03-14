import { ThemedText as Text } from '../../components/themed-text';
import { ThemedView as View } from '../../components/themed-view';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, Modal, ScrollView, RefreshControl, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { SymbolView } from 'expo-symbols';
import { useAuth } from '../../hooks/useAuth';
import { Unauthorized } from '../../components/unauthorized';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function StatisticsScreen() {
  const { role, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const calculateStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('student_uid, student_name, status, date');

      if (!error && data) {
        // Group by Student UID
        const grouped = data.reduce((acc: any, curr: any) => {
          const id = curr.student_uid;
          if (!acc[id]) acc[id] = { id, name: curr.student_name, total: 0, present: 0, absentDates: [] };
          
          acc[id].total += 1;
          if (curr.status === 'Present') {
            acc[id].present += 1;
          } else {
            acc[id].absentDates.push(curr.date);
          }
          
          return acc;
        }, {});

        // Convert to array and calculate percentage
        const finalStats = Object.values(grouped).map((s: any) => ({
          ...s,
          percentage: Math.round((s.present / s.total) * 100)
        }));

        setStats(finalStats.sort((a, b) => b.percentage - a.percentage));
      }
    } catch (err) {
      console.error("Stats calculation error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const generatePDF = async () => {
    setGeneratingPdf(true);
    try {
      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 20px; }
              h1 { color: #2e7d32; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { backgroundColor: #2e7d32; color: white; }
              tr:nth-child(even) { backgroundColor: #f9f9f9; }
              .low { color: #d32f2f; font-weight: bold; }
              .high { color: #2e7d32; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Student Attendance Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Total Classes</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${stats.map(s => `
                  <tr>
                    <td>${s.name}</td>
                    <td>${s.total}</td>
                    <td>${s.present}</td>
                    <td>${s.total - s.present}</td>
                    <td class="${s.percentage < 75 ? 'low' : 'high'}">${s.percentage}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error: any) {
      Alert.alert("Error", "Could not generate PDF: " + error.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  useEffect(() => {
    if (role === 'faculty' || role === 'hod' || role === 'proctor') {
      calculateStats();
    }
  }, [role, calculateStats]);

  const onRefresh = () => {
    setRefreshing(true);
    calculateStats();
  };

  const showStudentDetails = (student: any) => {
    setSelectedStudent(student);
  };

  if (authLoading) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" /></View>;
  if (role !== 'faculty' && role !== 'hod' && role !== 'proctor') return <Unauthorized />;
  if (loading && !refreshing) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" /></View>;

  const avgAttendance = stats.length > 0 
    ? Math.round(stats.reduce((acc, curr) => acc + curr.percentage, 0) / stats.length) 
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'transparent' }}>
          <View style={{ backgroundColor: 'transparent' }}>
            <Text type="title">Analytics</Text>
            <Text style={styles.subtitle}>Performance overview</Text>
          </View>
          <TouchableOpacity 
            style={[styles.pdfBtn, generatingPdf && { opacity: 0.5 }]} 
            onPress={generatePDF}
            disabled={generatingPdf}
          >
            {generatingPdf ? (
              <ActivityIndicator color="#2e7d32" size="small" />
            ) : (
              <SymbolView name="doc.text.fill" size={20} tintColor="#2e7d32" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{avgAttendance}%</Text>
          <Text style={styles.summaryLabel}>Avg. Attendance</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.length}</Text>
          <Text style={styles.summaryLabel}>Total Students</Text>
        </View>
      </View>
      
      <FlatList
        data={stats}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2e7d32" />}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => showStudentDetails(item)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={styles.studentName}>{item.name}</Text>
              <Text style={styles.subText}>{item.present} Present • {item.total - item.present} Absent</Text>
            </View>
            <View style={styles.progressSection}>
              <Text style={[
                styles.percentText, 
                item.percentage < 75 ? styles.low : styles.high
              ]}>
                {item.percentage}%
              </Text>
              <View style={styles.progressBarBg}>
                <View style={[
                  styles.progressBarFill, 
                  { width: `${item.percentage}%` },
                  item.percentage < 75 ? { backgroundColor: '#d32f2f' } : { backgroundColor: '#2e7d32' }
                ]} />
              </View>
            </View>
            <SymbolView name="chevron.right" size={14} tintColor="#ccc" />
          </TouchableOpacity>
        )}
      />

      {/* Student Detail Modal */}
      <Modal
        visible={!!selectedStudent}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedStudent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ backgroundColor: 'transparent' }}>
                <Text style={styles.modalTitle}>{selectedStudent?.name}</Text>
                <Text style={styles.modalSubtitle}>Absenteeism Record</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedStudent(null)} style={styles.closeBtn}>
                <SymbolView name="xmark" size={20} tintColor="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalStats}>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatValue}>{selectedStudent?.percentage}%</Text>
                <Text style={styles.modalStatLabel}>Attendance</Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={[styles.modalStatValue, { color: '#d32f2f' }]}>{selectedStudent?.absentDates.length}</Text>
                <Text style={styles.modalStatLabel}>Total Absents</Text>
              </View>
            </View>

            <Text style={styles.listHeader}>Dates of Absence</Text>
            {selectedStudent?.absentDates.length > 0 ? (
              <ScrollView style={styles.absentList}>
                {selectedStudent.absentDates.map((date: string, idx: number) => (
                  <View key={idx} style={styles.absentRow}>
                    <SymbolView name="calendar.badge.exclamationmark" size={16} tintColor="#d32f2f" />
                    <Text style={styles.absentDate}>{new Date(date).toDateString()}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.perfectRecord}>
                <SymbolView name="star.fill" size={40} tintColor="#ffb300" />
                <Text style={styles.perfectText}>Perfect Record! No absences found.</Text>
              </View>
            )}
            
            <TouchableOpacity style={styles.doneBtn} onPress={() => setSelectedStudent(null)}>
              <Text style={styles.doneBtnText}>Close Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSection: { marginBottom: 20, backgroundColor: 'transparent' },
  subtitle: { fontSize: 14, opacity: 0.6, marginTop: 4 },
  pdfBtn: { backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#2e7d32',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    elevation: 4,
    shadowColor: '#2e7d32',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  summaryItem: { flex: 1, alignItems: 'center', backgroundColor: 'transparent' },
  summaryValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  summaryLabel: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, marginTop: 4 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)', height: '70%' },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    gap: 15
  },
  studentName: { fontSize: 16, fontWeight: 'bold' },
  subText: { fontSize: 12, opacity: 0.5, marginTop: 2 },
  progressSection: { alignItems: 'flex-end', width: 80, backgroundColor: 'transparent' },
  percentText: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  low: { color: '#d32f2f' },
  high: { color: '#2e7d32' },
  progressBarBg: { width: '100%', height: 4, backgroundColor: '#eee', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: 'transparent' },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  modalSubtitle: { fontSize: 14, opacity: 0.6, marginTop: 2 },
  closeBtn: { padding: 5 },
  modalStats: { flexDirection: 'row', opacity: 0.8, borderRadius: 15, padding: 15, marginBottom: 25 },
  modalStatItem: { flex: 1, alignItems: 'center', backgroundColor: 'transparent' },
  modalStatValue: { fontSize: 20, fontWeight: 'bold', color: '#2e7d32' },
  modalStatLabel: { fontSize: 12, opacity: 0.6, marginTop: 4 },
  listHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  absentList: { maxHeight: 300, backgroundColor: 'transparent' },
  absentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)', backgroundColor: 'transparent' },
  absentDate: { fontSize: 15 },
  perfectRecord: { alignItems: 'center', padding: 40, backgroundColor: 'transparent' },
  perfectText: { fontSize: 14, opacity: 0.6, marginTop: 15, textAlign: 'center' },
  doneBtn: { backgroundColor: '#2e7d32', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
