import { ThemedText as Text } from '../../components/themed-text';
import { ThemedView as View } from '../../components/themed-view';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, RefreshControl, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const { role, userProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  
  // Notification States (Simulated)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [feeReminders, setFeeReminders] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSignOut = async () => {
    const performSignOut = async () => {
      try {
        await supabase.auth.signOut();
        router.replace('/login');
      } catch {
        Alert.alert("Error", "Failed to sign out. Please try again.");
      }
    };

    if (Platform.OS === 'web') {
      if (confirm("Are you sure you want to log out?")) {
        performSignOut();
      }
    } else {
      Alert.alert(
        "Sign Out",
        "Are you sure you want to log out?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log Out", style: "destructive", onPress: performSignOut }
        ]
      );
    }
  };

  if (loading && !refreshing) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" /></View>;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2e7d32" />}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userProfile?.full_name?.charAt(0) || '?'}</Text>
            </View>
            <TouchableOpacity style={styles.editAvatarBtn}>
              <SymbolView name="camera.fill" size={14} tintColor="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userProfile?.full_name || 'User Name'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{role?.toUpperCase() || 'NO ROLE FOUND'}</Text>
          </View>
        </View>

        {/* Debug Info Card - Extremely helpful for checking role issues */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={[styles.card, { borderColor: '#ffd54f', backgroundColor: '#fff9c4' }]}>
             <View style={styles.infoRow}>
                <SymbolView name="shield.fill" size={16} tintColor="#f57f17" />
                <View style={styles.infoContent}>
                   <Text style={[styles.infoLabel, { color: '#f57f17' }]}>Detected Role</Text>
                   <Text style={[styles.infoValue, { color: '#333' }]}>{role || 'Undefined (Check Database)'}</Text>
                </View>
             </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <SymbolView name="envelope.fill" size={16} tintColor="#2e7d32" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{userProfile?.email || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            {role === 'student' ? (
              <>
                <View style={styles.infoRow}>
                  <View style={styles.iconCircle}>
                    <SymbolView name="number" size={16} tintColor="#2e7d32" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Roll Number</Text>
                    <Text style={styles.infoValue}>{userProfile?.student_roll_no || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.iconCircle}>
                    <SymbolView name="graduationcap.fill" size={16} tintColor="#2e7d32" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Class</Text>
                    <Text style={styles.infoValue}>
                      {userProfile?.classes?.department} - Year {userProfile?.classes?.year} ({userProfile?.classes?.section})
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <SymbolView name="briefcase.fill" size={16} tintColor="#2e7d32" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Designation</Text>
                  <Text style={styles.infoValue}>{role?.toUpperCase()} Faculty</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingSub}>Receive push alerts</Text>
              </View>
              <Switch 
                value={notificationsEnabled} 
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#eee', true: '#2e7d32' }}
              />
            </View>
            {role === 'student' && (
              <>
                <View style={styles.divider} />
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Fee Reminders</Text>
                    <Text style={styles.settingSub}>Get notified about dues</Text>
                  </View>
                  <Switch 
                    value={feeReminders} 
                    onValueChange={setFeeReminders}
                    disabled={!notificationsEnabled}
                    trackColor={{ false: '#eee', true: '#2e7d32' }}
                  />
                </View>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <SymbolView name="rectangle.portrait.and.arrow.right" size={18} tintColor="#d32f2f" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Version 1.2.0 • Build 2026</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15, backgroundColor: 'transparent' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#2e7d32', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1a1a1a', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 24, fontWeight: 'bold' },
  roleBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  roleText: { color: '#2e7d32', fontSize: 12, fontWeight: 'bold' },
  section: { paddingHorizontal: 20, marginTop: 25, backgroundColor: 'transparent' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#2e7d32', textTransform: 'uppercase', marginBottom: 12, marginLeft: 5 },
  card: { borderRadius: 20, padding: 5, borderWidth: 1, borderColor: '#f0f0f0', elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 15, backgroundColor: 'transparent' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f7f0', justifyContent: 'center', alignItems: 'center' },
  infoContent: { flex: 1, backgroundColor: 'transparent' },
  infoLabel: { fontSize: 12, opacity: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f5f5f5', marginHorizontal: 15 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'transparent' },
  settingInfo: { flex: 1, backgroundColor: 'transparent' },
  settingLabel: { fontSize: 16, fontWeight: '600' },
  settingSub: { fontSize: 12, opacity: 0.5, marginTop: 2 },
  logoutBtn: { margin: 20, marginTop: 30, padding: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: '#ffebee' },
  logoutText: { color: '#d32f2f', fontWeight: 'bold', fontSize: 16 },
  versionText: { textAlign: 'center', opacity: 0.3, fontSize: 12, marginBottom: 40 }
});
