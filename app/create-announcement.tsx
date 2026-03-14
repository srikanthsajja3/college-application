import { ThemedText as Text } from '../components/themed-text';
import { ThemedView as View } from '../components/themed-view';
import { ThemedInput } from '../components/themed-input';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';

export default function CreateAnnouncement() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [target, setTarget] = useState('All');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePost = async () => {
    if (!title || !content) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    // Fetch the actual current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        Alert.alert('Error', 'Not logged in');
        setLoading(false);
        return;
    }

    // Try to get the name of the user (e.g. from faculty table)
    let authorName = 'Faculty Admin';
    const { data: facultyData } = await supabase.from('faculty').select('full_name').eq('id', user.id).maybeSingle();
    if (facultyData) authorName = facultyData.full_name;

    const { error } = await supabase.from('announcements').insert([
      {
        title,
        content,
        target_year: target,
        author_name: authorName, 
      },
    ]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Announcement posted!');
      router.back(); 
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text type="title" style={styles.header}>New Announcement</Text>
      
      <Text style={styles.label}>Title</Text>
      <ThemedInput 
        style={styles.input} 
        value={title} 
        onChangeText={setTitle} 
        placeholder="e.g. Mid-term Results"
      />

      <Text style={styles.label}>Target Year</Text>
      <View style={styles.targetRow}>
        {['All', '1st Year', '2nd Year', '3rd Year'].map((year) => (
          <TouchableOpacity 
            key={year} 
            style={[styles.chip, target === year && styles.activeChip]} 
            onPress={() => setTarget(year)}
          >
            <Text style={target === year ? styles.activeChipText : styles.chipText}>{year}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Content</Text>
      <ThemedInput 
        style={[styles.input, styles.textArea]} 
        value={content} 
        onChangeText={setContent} 
        placeholder="Write your message here..."
        multiline
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handlePost} 
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Post to Board</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { marginBottom: 30 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 10, marginTop: 10 },
  input: { marginBottom: 15 },
  textArea: { height: 120, textAlignVertical: 'top' },
  targetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20, backgroundColor: 'transparent' },
  chip: { padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ccc' },
  chipText: { opacity: 0.7 },
  activeChip: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  activeChipText: { color: '#fff', fontWeight: 'bold' },
  button: { 
    backgroundColor: '#2e7d32', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 30 
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
