import { ThemedText as Text } from '../components/themed-text';
import { ThemedView as View } from '../components/themed-view';
import { ThemedInput } from '../components/themed-input';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignUp() {
    if (!email || !password || !fullName || !rollNo) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);

    // 1. Create the Auth User in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      Alert.alert("Auth Error", authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Insert into students table using the new Auth UID
      const { error: dbError } = await supabase
        .from('students')
        .insert([
          {
            id: authData.user.id, // Linking Auth and Database
            full_name: fullName,
            student_roll_no: rollNo,
            email: email,
            class_id: 1, // Defaulting to your first class entry
          }
        ]);

      if (dbError) {
        Alert.alert("Database Error", dbError.message);
      } else {
        Alert.alert("Success", "Registration complete! You can now log in.");
        router.replace('/login');
      }
    }
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={{flexGrow: 1}}>
      <View style={styles.container}>
        <Text type="title" style={styles.title}>Create Account</Text>
        
        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <ThemedInput style={styles.input} placeholder="Enter your name" onChangeText={setFullName} value={fullName} />
          
          <Text style={styles.label}>Roll Number</Text>
          <ThemedInput style={styles.input} placeholder="e.g. 21CSE001" onChangeText={setRollNo} value={rollNo} />
          
          <Text style={styles.label}>Email</Text>
          <ThemedInput style={styles.input} placeholder="email@college.edu" onChangeText={setEmail} value={email} autoCapitalize="none" />
          
          <Text style={styles.label}>Password</Text>
          <ThemedInput style={styles.input} placeholder="••••••••" onChangeText={setPassword} value={password} secureTextEntry />

          <TouchableOpacity style={styles.btn} onPress={handleSignUp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register Student</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/login')} style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.boldGreen}>Login</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center' },
  title: { color: '#2e7d32', marginBottom: 30 },
  form: { width: '100%', backgroundColor: 'transparent' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { marginBottom: 15 },
  btn: { backgroundColor: '#2e7d32', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkContainer: { marginTop: 20, alignItems: 'center', backgroundColor: 'transparent' },
  linkText: { opacity: 0.6 },
  boldGreen: { color: '#2e7d32', fontWeight: 'bold' }
});
