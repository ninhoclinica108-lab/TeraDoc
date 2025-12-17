
import { User, Patient, ReportRequest, Specialty } from '../types';
import { supabase } from './supabase';

const handleSupabaseError = (error: any) => {
    if (error) {
        console.error("Supabase Error Details:", error);
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return null;
};

export const api = {
  auth: {
    signUp: async (name: string, email: string, password?: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || '',
        options: {
          data: { name, role: 'PARENT' }
        }
      });
      if (error) throw error;
      return data.user;
    },
    signIn: async (email: string, password?: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || ''
      });
      if (error) throw error;
      return data.user;
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
    getSessionUser: async (): Promise<User | null> => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return null;
      
      // Tentar buscar o perfil na tabela pública
      let { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Se o perfil não existir ainda (delay do trigger), retorna um objeto temporário
      // para não deslogar o usuário imediatamente
      if (!profile) {
        console.warn("Perfil não encontrado na tabela pública. Usando metadados do Auth.");
        return {
          id: user.id,
          name: user.user_metadata?.name || 'Usuário',
          email: user.email || '',
          role: (user.user_metadata?.role as any) || 'PARENT',
          permissions: []
        };
      }
        
      return profile as User;
    }
  },

  users: {
    getAll: async (): Promise<User[]> => {
      const { data, error } = await supabase.from('users').select('*');
      handleSupabaseError(error);
      return (data as User[]) || [];
    },
    create: async (data: Omit<User, 'id'>): Promise<User> => {
       const { data: inserted, error } = await supabase.from('users').insert(data).select().single();
       handleSupabaseError(error);
       return inserted as User;
    },
    update: async (id: string, data: Partial<User>): Promise<User | null> => {
      const { data: updated, error } = await supabase.from('users').update(data).eq('id', id).select().single();
      handleSupabaseError(error);
      return updated as User;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      handleSupabaseError(error);
      return !error;
    }
  },

  patients: {
    getAll: async (): Promise<Patient[]> => {
      const { data, error } = await supabase.from('patients').select('*');
      handleSupabaseError(error);
      return (data as Patient[]) || [];
    },
    create: async (data: Omit<Patient, 'id'>): Promise<Patient> => {
      const { data: inserted, error } = await supabase.from('patients').insert(data).select().single();
      handleSupabaseError(error);
      return inserted as Patient;
    }
  },

  requests: {
    getAll: async (): Promise<ReportRequest[]> => {
      const { data, error } = await supabase.from('requests').select('*');
      handleSupabaseError(error);
      return (data as ReportRequest[]) || [];
    },
    create: async (data: Partial<ReportRequest>): Promise<ReportRequest> => {
      const { data: inserted, error } = await supabase.from('requests').insert(data).select().single();
      handleSupabaseError(error);
      return inserted as ReportRequest;
    },
    update: async (id: string, updates: Partial<ReportRequest>): Promise<ReportRequest | null> => {
      const { data, error } = await supabase.from('requests').update(updates).eq('id', id).select().single();
      handleSupabaseError(error);
      return data as ReportRequest;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from('requests').delete().eq('id', id);
      handleSupabaseError(error);
      return !error;
    }
  },

  specialties: {
    getAll: async (): Promise<Specialty[]> => {
      const { data, error } = await supabase.from('specialties').select('*');
      handleSupabaseError(error);
      return (data as Specialty[]) || [];
    },
    create: async (data: Omit<Specialty, 'id'>): Promise<Specialty> => {
      const { data: inserted, error } = await supabase.from('specialties').insert(data).select().single();
      handleSupabaseError(error);
      return inserted as Specialty;
    },
    update: async (id: string, data: Partial<Specialty>): Promise<Specialty | null> => {
      const { data: updated, error } = await supabase.from('specialties').update(data).eq('id', id).select().single();
      handleSupabaseError(error);
      return updated as Specialty;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from('specialties').delete().eq('id', id);
      handleSupabaseError(error);
      return !error;
    }
  }
};
