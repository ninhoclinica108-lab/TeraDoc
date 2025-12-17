
import { User, Patient, ReportRequest, Specialty } from '../types';
import { supabase } from './supabase';

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const handleSupabaseError = (error: any) => {
    if (error) {
        console.error("Supabase Error Details:", error);
        
        // PGRST116: maybeSingle() didn't find a record
        if (error.code === 'PGRST116') return null;

        // Erro comum de projeto pausado ou tabelas não criadas
        if (error.message?.includes('fetch') || error.code === '42P01') {
            const msg = "O banco de dados está inacessível. O projeto Supabase pode estar pausado ou as tabelas não foram criadas via SQL Editor.";
            alert(msg);
            throw new Error(msg);
        }
        
        throw error;
    }
    return null;
};

export const api = {
  auth: {
    login: async (email: string, password?: string): Promise<User | null> => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .maybeSingle();

        handleSupabaseError(error);
        return data as User;
      } catch (e) {
        return null;
      }
    }
  },

  users: {
    getAll: async (): Promise<User[]> => {
      try {
        const { data, error } = await supabase.from('users').select('*');
        handleSupabaseError(error);
        return (data as User[]) || [];
      } catch (e) {
        return [];
      }
    },
    create: async (data: Omit<User, 'id'>): Promise<User> => {
      const newUser = { ...data, id: generateId() };
      const { data: inserted, error } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();
      
      handleSupabaseError(error);
      return inserted as User;
    },
    update: async (id: string, data: Partial<User>): Promise<User | null> => {
      const { data: updated, error } = await supabase
        .from('users')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      handleSupabaseError(error);
      return updated as User;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      handleSupabaseError(error);
      return !error;
    },
    updateSignature: async (userId: string, signatureUrl: string): Promise<User | null> => {
      const { data, error } = await supabase
        .from('users')
        .update({ signatureUrl })
        .eq('id', userId)
        .select()
        .single();
        
      handleSupabaseError(error);
      return data as User;
    }
  },

  patients: {
    getAll: async (): Promise<Patient[]> => {
      try {
        const { data, error } = await supabase.from('patients').select('*');
        handleSupabaseError(error);
        return (data as Patient[]) || [];
      } catch (e) { return []; }
    },
    create: async (data: Omit<Patient, 'id'>): Promise<Patient> => {
      const newPatient = { ...data, id: generateId() };
      const { data: inserted, error } = await supabase
        .from('patients')
        .insert(newPatient)
        .select()
        .single();

      handleSupabaseError(error);
      return inserted as Patient;
    }
  },

  specialties: {
    getAll: async (): Promise<Specialty[]> => {
        try {
            const { data, error } = await supabase.from('specialties').select('*');
            handleSupabaseError(error);
            return (data as Specialty[]) || [];
        } catch (e) { return []; }
    },
    create: async (name: string): Promise<Specialty> => {
        const newSpec = { id: generateId(), name };
        const { data, error } = await supabase
            .from('specialties')
            .insert(newSpec)
            .select()
            .single();
            
        handleSupabaseError(error);
        return data as Specialty;
    },
    update: async (id: string, name: string): Promise<Specialty | null> => {
        const { data, error } = await supabase
            .from('specialties')
            .update({ name })
            .eq('id', id)
            .select()
            .single();
        
        handleSupabaseError(error);
        return data as Specialty;
    },
    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('specialties').delete().eq('id', id);
        handleSupabaseError(error);
        return !error;
    }
  },

  requests: {
    getAll: async (): Promise<ReportRequest[]> => {
      try {
        const { data, error } = await supabase.from('requests').select('*');
        handleSupabaseError(error);
        return (data as ReportRequest[]) || [];
      } catch (e) { return []; }
    },
    create: async (data: Partial<ReportRequest>): Promise<ReportRequest> => {
      const newRequest = {
        id: generateId(),
        requestDate: new Date().toISOString(),
        isSigned: false,
        status: 'PENDING',
        ...data
      };
      
      const { data: inserted, error } = await supabase
        .from('requests')
        .insert(newRequest)
        .select()
        .single();

      handleSupabaseError(error);
      return inserted as ReportRequest;
    },
    update: async (id: string, updates: Partial<ReportRequest>): Promise<ReportRequest | null> => {
      const { data, error } = await supabase
        .from('requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      handleSupabaseError(error);
      return data as ReportRequest;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from('requests').delete().eq('id', id);
      handleSupabaseError(error);
      return !error;
    }
  }
};
