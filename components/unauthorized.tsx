import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText as Text } from './themed-text';
import { ThemedView as View } from './themed-view';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';

export function Unauthorized() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SymbolView name="lock.shield.fill" size={80} tintColor="#d32f2f" />
      <Text style={styles.title}>Access Restricted</Text>
      <Text style={styles.subtitle}>
        You don&apos;t have the necessary permissions to view this page.
      </Text>
      <TouchableOpacity 
        style={styles.btn} 
        onPress={() => router.replace('/(tabs)')}
      >
        <Text style={styles.btnText}>Return Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
  subtitle: { fontSize: 16, opacity: 0.6, marginTop: 10, textAlign: 'center', marginBottom: 30 },
  btn: { backgroundColor: '#2e7d32', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
