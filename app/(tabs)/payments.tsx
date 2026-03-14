import { ThemedText as Text } from '../../components/themed-text';
import { ThemedView as View } from '../../components/themed-view';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { SymbolView } from 'expo-symbols';
import { useAuth } from '../../hooks/useAuth';
import { Unauthorized } from '../../components/unauthorized';

export default function PaymentsScreen() {
  const { role, loading: authLoading } = useAuth();
  const [feeData, setFeeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('payments')
        .select('years')
        .eq('student_uid', user.id)
        .maybeSingle();

      if (!error && data) {
        setFeeData(data.years);
      } else {
        setFeeData(null);
      }
    } catch (err) {
      console.error("Payment fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (role === 'student') {
      fetchPayments();
    }
  }, [role, fetchPayments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  if (authLoading) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" /></View>;
  if (role !== 'student') return <Unauthorized />;
  if (loading && !refreshing) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" /></View>;

  const yearList = feeData ? Object.keys(feeData) : [];

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text type="title">Fee Dashboard</Text>
        <Text style={styles.subtitle}>Track your academic financial status</Text>
      </View>
      
      <FlatList
        data={yearList}
        keyExtractor={(item) => item}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2e7d32" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SymbolView name="creditcard.fill" size={60} tintColor="#ccc" />
            <Text style={styles.emptyTitle}>No Payment Records</Text>
            <Text style={styles.emptySubtitle}>Your fee details will appear here once updated by the administration.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const yearInfo = feeData[item];
          return (
            <View style={styles.paymentCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.yearTitle}>{item}</Text>
                <View style={[styles.statusBadge, yearInfo.remaining_amount === 0 ? styles.paidBadge : styles.pendingBadge]}>
                  <Text style={styles.statusText}>{yearInfo.remaining_amount === 0 ? 'Fully Paid' : 'Pending'}</Text>
                </View>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Total Due:</Text>
                <Text style={styles.amount}>₹{yearInfo.due_amount}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Paid:</Text>
                <Text style={[styles.amount, { color: '#2e7d32' }]}>₹{yearInfo.paid_amount}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.boldLabel}>Remaining Balance:</Text>
                <Text style={[styles.amount, { color: yearInfo.remaining_amount > 0 ? '#d32f2f' : '#2e7d32', fontWeight: 'bold' }]}>
                  ₹{yearInfo.remaining_amount}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSection: { marginBottom: 25, backgroundColor: 'transparent' },
  subtitle: { fontSize: 14, opacity: 0.6, marginTop: 4 },
  paymentCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: 'transparent' },
  yearTitle: { fontSize: 22, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  paidBadge: { backgroundColor: 'rgba(46, 125, 50, 0.1)' },
  pendingBadge: { backgroundColor: 'rgba(255, 152, 0, 0.1)' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#2e7d32' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, backgroundColor: 'transparent', alignItems: 'center' },
  label: { fontSize: 14, opacity: 0.6 },
  amount: { fontSize: 16, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(150,150,150,0.1)', marginVertical: 15 },
  boldLabel: { fontSize: 16, fontWeight: '700' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, backgroundColor: 'transparent' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  emptySubtitle: { fontSize: 14, opacity: 0.6, textAlign: 'center', marginTop: 10, paddingHorizontal: 40 },
});
