import { Session } from '@supabase/supabase-js';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { ThemedView as View } from '../components/themed-view';
import { supabase } from '../lib/supabase';
import { useThemeColor } from '../hooks/use-theme-color';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false); 
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 1. Initial check with timeout protection
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(initialSession);
      } catch {
        console.warn("Initial auth check aborted, relying on listener...");
      } finally {
        setLoading(false);
        setIsReady(true);
      }
    };

    initializeAuth();

    // 2. Continuous listener for login/logout events
    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      
      // Reactive redirection during active use
      if (isReady) {
        if (event === 'SIGNED_OUT' || !currentSession) {
          router.replace('/login');
        } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          router.replace('/(tabs)');
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [isReady, router]);

  // 3. Handle initial redirection immediately after initialization
  useEffect(() => {
    if (isReady && !loading) {
      if (!session) {
        router.replace('/login');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isReady, loading, session, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
