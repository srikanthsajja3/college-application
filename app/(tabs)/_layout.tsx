import { ThemedView as View } from '../../components/themed-view';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useThemeColor } from '../../hooks/use-theme-color';

export default function TabLayout() {
  const { role, loading } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <Tabs 
      screenOptions={{ 
        tabBarActiveTintColor: '#2e7d32', 
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: borderColor,
          backgroundColor: backgroundColor,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        sceneStyle: { backgroundColor }
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home', 
          tabBarIcon: ({ color }) => <SymbolView name="house.fill" tintColor={color} /> 
        }} 
      />

      {/* Role-Based Tabs */}
      
      {/* HOD TAB: Visible only if role is hod */}
      <Tabs.Screen
        name="hod/dashboard"
        options={{
          title: 'HOD',
          href: role === 'hod' ? '/hod/dashboard' : null,
          tabBarIcon: ({ color }) => <SymbolView name="crown.fill" tintColor={color} />,
        }}
      />

      {/* PROCTOR TAB: Visible only if role is proctor */}
      <Tabs.Screen
        name="proctor/dashboard"
        options={{
          title: 'Proctor',
          href: role === 'proctor' ? '/proctor/dashboard' : null,
          tabBarIcon: ({ color }) => <SymbolView name="briefcase.fill" tintColor={color} />,
        }}
      />

      {/* FACULTY/HOD TAB: Mark Attendance */}
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Mark',
          href: (role === 'faculty' || role === 'hod') ? '/attendance' : null,
          tabBarIcon: ({ color }) => <SymbolView name="checkmark.seal.fill" tintColor={color} />,
        }}
      />

      {/* FACULTY/HOD/PROCTOR TAB: Statistics */}
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Stats',
          href: (role === 'faculty' || role === 'hod' || role === 'proctor') ? '/statistics' : null,
          tabBarIcon: ({ color }) => <SymbolView name="chart.bar.fill" tintColor={color} />,
        }}
      />

      {/* STUDENT TABS */}
      <Tabs.Screen
        name="my-attendance"
        options={{
          title: 'Attendance',
          href: role === 'student' ? '/my-attendance' : null,
          tabBarIcon: ({ color }) => <SymbolView name="person.text.rectangle.fill" tintColor={color} />,
        }}
      />

      <Tabs.Screen
        name="payments"
        options={{
          title: 'Fees',
          href: role === 'student' ? '/payments' : null,
          tabBarIcon: ({ color }) => <SymbolView name="creditcard.fill" tintColor={color} />,
        }}
      />

      <Tabs.Screen
        name="leave"
        options={{
          title: 'Leave',
          href: role === 'student' ? '/leave' : null,
          tabBarIcon: ({ color }) => <SymbolView name="calendar.badge.plus" tintColor={color} />,
        }}
      />

      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile', 
          tabBarIcon: ({ color }) => <SymbolView name="person.crop.circle.fill" tintColor={color} /> 
        }} 
      />

      {/* Hidden Screens (not showing in tab bar but accessible) */}
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
