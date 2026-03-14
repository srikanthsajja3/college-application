import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type UserRole = 'student' | 'faculty' | 'proctor' | 'hod';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setUserProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(uid: string) {
    setLoading(true);
    try {
      // Check students table first
      const { data: student } = await supabase
        .from('students')
        .select('*, classes(*)')
        .eq('id', uid)
        .maybeSingle();

      if (student) {
        setUserProfile(student);
        setRole('student');
      } else {
        // If not a student, check faculty table
        const { data: faculty } = await supabase
          .from('faculty')
          .select('*')
          .eq('id', uid)
          .maybeSingle();
        
        if (faculty) {
          setUserProfile(faculty);
          // Assume faculty table has a 'role' column (faculty, proctor, hod)
          setRole(faculty.role as UserRole || 'faculty');
        } else {
          setRole(null);
          setUserProfile(null);
        }
      }
    } catch (err) {
      console.error("Auth Profile Fetch Error:", err);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }

  return { session, userProfile, role, loading };
}
