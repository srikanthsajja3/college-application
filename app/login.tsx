import { ThemedText as Text } from '../components/themed-text';
import { ThemedView as View } from '../components/themed-view';
import { ThemedInput } from '../components/themed-input';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    // 1. Validation and Sanitation
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      // 2. Authenticate with trimmed email to prevent hidden space errors
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // Log status to help debug (e.g., 400 for invalid credentials)
        console.log("Login Status:", error.status);
        
        if (error.message.includes("Email not confirmed")) {
          Alert.alert("Verify Email", "Please confirm your email or disable confirmation in Supabase dashboard.");
        } else {
          Alert.alert("Login Failed", "Invalid email or password.");
        }
      } else if (data.session) {
        // 3. Navigate only if session is confirmed
        router.replace('/(tabs)');
      }
    } catch {
      Alert.alert("Network Error", "Check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text type="title" style={styles.title}>Login Portal</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email Address</Text>
        <ThemedInput
          style={styles.input}
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="yourname@college.edu"
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />

        <Text style={styles.label}>Password</Text>
        <ThemedInput
          style={styles.input}
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="••••••••"
          autoCapitalize="none"
        />

        <TouchableOpacity 
          style={[styles.loginBtn, loading && styles.disabledBtn]} 
          onPress={signInWithEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.registerLink} 
          onPress={() => router.push('/register')}
        >
          <Text style={styles.registerText}>
            Don&apos;t have an account? <Text style={styles.boldGreen}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center' },
  headerSection: { marginBottom: 40, backgroundColor: 'transparent' },
  title: { color: '#2e7d32' },
  subtitle: { opacity: 0.6, marginTop: 5 },
  form: { width: '100%', backgroundColor: 'transparent' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { marginBottom: 20 },
  loginBtn: { 
    backgroundColor: '#2e7d32', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 10,
    elevation: 5
  },
  disabledBtn: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  registerLink: { marginTop: 25, alignItems: 'center', backgroundColor: 'transparent' },
  registerText: { opacity: 0.6, fontSize: 14 },
  boldGreen: { color: '#2e7d32', fontWeight: 'bold' }
});
