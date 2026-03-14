import { ThemedText as Text } from '../../components/themed-text';
import { ThemedView as View } from '../../components/themed-view';
import { ThemedCard } from '../../components/themed-card';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, Platform, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SymbolView } from 'expo-symbols';

export default function AttendanceHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Date filter state
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: false })
        .order('student_name', { ascending: true });

      if (date) {
        const formattedDate = date.toISOString().split('T')[0];
        query = query.eq('date', formattedDate);
      } else {
        // Limit to last 50 records if no date filter to keep it snappy
        query = query.limit(50);
      }

      const { data, error } = await query;

      if (!error && data) {
        setHistory(data);
      }
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const clearFilter = () => {
    setDate(null);
  };

  if (loading && !refreshing) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text type="title">History Log</Text>
        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterBtn, date && styles.activeFilter]} 
            onPress={() => setShowDatePicker(true)}
          >
            <SymbolView name="calendar" size={16} tintColor={date ? "#fff" : "#2e7d32"} />
            <Text style={[styles.filterText, date && styles.activeFilterText]}>
              {date ? date.toDateString() : 'Filter by Date'}
            </Text>
          </TouchableOpacity>
          
          {date && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilter}>
              <SymbolView name="xmark.circle.fill" size={20} tintColor="#999" />
            </TouchableOpacity>
          )}
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>
      
      <FlatList
        data={history}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2e7d32" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SymbolView name="doc.text.magnifyingglass" size={60} tintColor="#ccc" />
            <Text style={styles.emptyTitle}>No Records Found</Text>
            <Text style={styles.emptySubtitle}>
              {date 
                ? `No attendance marked for ${date.toDateString()}.` 
                : "No attendance records available in the system yet."}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ThemedCard style={styles.historyCard}>
            <View style={styles.cardInfo}>
              <Text style={styles.studentName}>{item.student_name}</Text>
              <View style={styles.metaRow}>
                <SymbolView name="calendar" size={12} tintColor="#999" />
                <Text style={styles.subText}>{item.date}</Text>
              </View>
            </View>
            <View style={[styles.tag, item.status === 'Present' ? styles.presentTag : styles.absentTag]}>
              <Text style={styles.tagText}>{item.status}</Text>
            </View>
          </ThemedCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSection: { marginBottom: 20, backgroundColor: 'transparent' },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 15, backgroundColor: 'transparent' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'transparent', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(150,150,150,0.2)' },
  activeFilter: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#2e7d32' },
  activeFilterText: { color: '#fff' },
  clearBtn: { padding: 5 },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardInfo: { backgroundColor: 'transparent' },
  studentName: { fontSize: 16, fontWeight: 'bold' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, backgroundColor: 'transparent' },
  subText: { fontSize: 12, opacity: 0.5 },
  tag: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  tagText: { fontSize: 11, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  presentTag: { backgroundColor: '#2e7d32' },
  absentTag: { backgroundColor: '#d32f2f' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, backgroundColor: 'transparent' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  emptySubtitle: { fontSize: 14, opacity: 0.6, textAlign: 'center', marginTop: 10, paddingHorizontal: 40 },
});
