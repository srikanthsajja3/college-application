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

  // Define boolean flags for clarity
  const isStudent = role === 'student';
  const isHod = role === 'hod';
  const isProctor = role === 'proctor';
  const isFaculty = role === 'faculty'; // Mentor is usually faculty role

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
      {/* 1. HOME - Everyone sees this */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home', 
          tabBarIcon: ({ color }) => <SymbolView name="house.fill" tintColor={color} /> 
        }} 
      />

      {/* 2. HOD Dashboard - Only for HOD */}
      <Tabs.Screen
        name="hod/dashboard"
        options={{
          title: 'HOD',
          href: isHod ? '/hod/dashboard' : null,
          tabBarIcon: ({ color }) => <SymbolView name="crown.fill" tintColor={color} />,
        }}
      />

      {/* 3. Proctor Dashboard - Only for Proctor */}
      <Tabs.Screen
        name="proctor/dashboard"
        options={{
          title: 'Proctor',
          href: isProctor ? '/proctor/dashboard' : null,
          tabBarIcon: ({ color }) => <SymbolView name="briefcase.fill" tintColor={color} />,
        }}
      />

      {/* 4. Mark Attendance - Only for HOD and Faculty (Mentors) */}
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Mark',
          href: (isFaculty || isHod) ? '/attendance' : null,
          tabBarIcon: ({ color }) => <SymbolView name="checkmark.seal.fill" tintColor={color} />,
        }}
      />

      {/* 5. Statistics - For HOD, Proctor, and Faculty */}
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Stats',
          href: (isFaculty || isHod || isProctor) ? '/statistics' : null,
          tabBarIcon: ({ color }) => <SymbolView name="chart.bar.fill" tintColor={color} />,
        }}
      />

      {/* 6. My Attendance - Only for Students */}
      <Tabs.Screen
        name="my-attendance"
        options={{
          title: 'My Attendance',
          href: isStudent ? '/my-attendance' : null,
          tabBarIcon: ({ color }) => <SymbolView name="person.text.rectangle.fill" tintColor={color} />,
        }}
      />

      {/* 7. Payments - Only for Students */}
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Fees',
          href: isStudent ? '/payments' : null,
          tabBarIcon: ({ color }) => <SymbolView name="creditcard.fill" tintColor={color} />,
        }}
      />

      {/* 8. Leave - Only for Students (to apply) */}
      <Tabs.Screen
        name="leave"
        options={{
          title: 'Leave',
          href: isStudent ? '/leave' : null,
          tabBarIcon: ({ color }) => <SymbolView name="calendar.badge.plus" tintColor={color} />,
        }}
      />

      {/* 9. Profile - Everyone sees this */}
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile', 
          tabBarIcon: ({ color }) => <SymbolView name="person.crop.circle.fill" tintColor={color} /> 
        }} 
      />

      {/* 10. Hidden Screens - Explicitly hide ALL extra files in (tabs) folder */}
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="hod/leaves" options={{ href: null }} />
      <Tabs.Screen name="hod/add-batch" options={{ href: null }} />
      {/* Note: proctor/manage-batch is in app/ root, so it's not even a tab here, but keeping it safe */}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
