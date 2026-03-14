import { ThemedText as Text } from '../../../components/themed-text';
import { ThemedView as View } from '../../../components/themed-view';
import { ThemedInput } from '../../../components/themed-input';
import { ThemedCard } from '../../../components/themed-card';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useThemeColor } from '../../../hooks/use-theme-color';

export default function AddBatchScreen() {
  const router = useRouter();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [form, setForm] = useState({
    batch_name: '',
    department: '',
    section: '',
    proctor_id: '',
    current_year: '1'
  });

  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    fetchFaculty();
  }, []);

  async function fetchFaculty() {
    const { data } = await supabase.from('faculty').select('id, full_name');
    if (data) setFaculty(data);
  }

  async function handleCreate() {
    if (!form.batch_name || !form.proctor_id) {
      return Alert.alert("Error", "Please fill name and assign a proctor.");
    }

    const { error } = await supabase.from('batches').insert([{
      ...form,
      current_year: parseInt(form.current_year)
    }]);

    if (error) Alert.alert("Error", error.message);
    else {
      Alert.alert("Success", "Batch created and Proctor assigned!");
      router.back();
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Batch Name (e.g. 2022-2026)</Text>
      <ThemedInput 
        style={styles.input} 
        placeholder="Enter batch name" 
        onChangeText={(t) => setForm({...form, batch_name: t})} 
      />

      <Text style={styles.label}>Department & Section</Text>
      <View style={styles.row}>
        <ThemedInput 
          style={[styles.input, {flex: 1, marginRight: 10}]} 
          placeholder="CSE" 
          onChangeText={(t) => setForm({...form, department: t})} 
        />
        <ThemedInput 
          style={[styles.input, {width: 60}]} 
          placeholder="A" 
          onChangeText={(t) => setForm({...form, section: t})} 
        />
      </View>

      <Text style={styles.label}>Assign Proctor</Text>
      <ThemedCard style={styles.pickerContainer}>
        <Picker
          selectedValue={form.proctor_id}
          onValueChange={(itemValue) => setForm({...form, proctor_id: itemValue})}
          style={{ color: textColor }}
          dropdownIconColor={textColor}
        >
          <Picker.Item label="Select a Faculty" value="" color={textColor} />
          {faculty.map(f => (
            <Picker.Item key={f.id} label={f.full_name} value={f.id} color={textColor} />
          ))}
        </Picker>
      </ThemedCard>

      <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
        <Text style={styles.submitText}>Create Batch</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 14, fontWeight: '600', opacity: 0.6, marginBottom: 8, marginTop: 15 },
  input: { padding: 12, borderRadius: 10, fontSize: 16, marginBottom: 5 },
  row: { flexDirection: 'row', backgroundColor: 'transparent' },
  pickerContainer: { borderRadius: 10, overflow: 'hidden', padding: 0 },
  submitBtn: { backgroundColor: '#2e7d32', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
