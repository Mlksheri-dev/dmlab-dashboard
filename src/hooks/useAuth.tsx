import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: any; // Simplified user object
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persistent session
    const savedUser = localStorage.getItem('lab_guardian_admin');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Direct query to custom admin table
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        return { error: new Error('Access Denied: Invalid Email or Security Key') };
      }

      // Login success
      const adminUser = { id: data.id, email: data.email };
      setUser(adminUser);
      localStorage.setItem('lab_guardian_admin', JSON.stringify(adminUser));

      return { error: null };
    } catch (err) {
      return { error: new Error('System verification failed') };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('lab_guardian_admin');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

