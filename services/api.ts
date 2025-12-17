import { User, Patient, ReportRequest, Specialty } from '../types';
import { supabase } from './supabase';

// Helper para gerar IDs compatíveis com o tipo TEXT do banco
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

export const api = {
  auth: {
    login: async (email: string, password?: string): Promise<User | null> => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .maybeSingle(); // maybeSingle evita erro se não encontrar

        if (error) {
            console.error('Login error:', error);
            return null;
        }
        return data as User;
      } catch (e) {
        console.error("Auth Exception:", e);
        return null;
      }
    }
  },

  users: {
    getAll: async (): Promise<User[]> => {
      const { data } = await supabase.from('users').select('*');
      return (data as User[]) || [];
    },
    create: async (data: Omit<User, 'id'>): Promise<User> => {
      // 1. Verifica duplicidade de forma segura
      const { data: existing, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email)
        .maybeSingle();

      if (checkError) {
        console.error("Erro ao verificar usuário:", checkError);
        throw new Error("Erro de conexão ao verificar e-mail.");
      }

      if (existing) {
          throw new Error("Este e-mail já está cadastrado.");
      }

      // 2. Prepara dados
      const newUser = { ...data, id: generateId() };
      
      // 3. Insere
      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();
      
      if (insertError) {
          console.error("Erro ao criar usuário no Supabase:", insertError);
          // Retorna mensagem amigável se a tabela não existir
          if (insertError.code === '42P01') throw new Error("Erro interno: Tabelas do banco de dados não encontradas. Execute o script SQL.");
          throw new Error(`Erro ao salvar dados: ${insertError.message}`);
      }
      return inserted as User;
    },
    update: async (id: string, data: Partial<User>): Promise<User | null> => {
      const { data: updated, error } = await supabase
        .from('users')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
          console.error("Update User Error:", error);
          return null;
      }
      return updated as User;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) {
          console.error("Delete User Error:", error);
          return false;
      }
      return true;
    },
    updateSignature: async (userId: string, signatureUrl: string): Promise<User | null> => {
      const { data, error } = await supabase
        .from('users')
        .update({ signatureUrl })
        .eq('id', userId)
        .select()
        .single();
        
      if (error) return null;
      return data as User;
    },
    getById: async (id: string): Promise<User | undefined> => {
        const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
        return data as User || undefined;
    }
  },

  patients: {
    getAll: async (): Promise<Patient[]> => {
      const { data } = await supabase.from('patients').select('*');
      return (data as Patient[]) || [];
    },
    create: async (data: Omit<Patient, 'id'>): Promise<Patient> => {
      const newPatient = { ...data, id: generateId() };
      const { data: inserted, error } = await supabase
        .from('patients')
        .insert(newPatient)
        .select()
        .single();

      if (error) throw error;
      return inserted as Patient;
    }
  },

  specialties: {
    getAll: async (): Promise<Specialty[]> => {
        const { data } = await supabase.from('specialties').select('*');
        return (data as Specialty[]) || [];
    },
    create: async (name: string): Promise<Specialty> => {
        const newSpec = { id: generateId(), name };
        const { data, error } = await supabase
            .from('specialties')
            .insert(newSpec)
            .select()
            .single();
            
        if (error) throw error;
        return data as Specialty;
    },
    update: async (id: string, name: string): Promise<Specialty | null> => {
        const { data, error } = await supabase
            .from('specialties')
            .update({ name })
            .eq('id', id)
            .select()
            .single();
        
        if (error) return null;
        return data as Specialty;
    },
    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('specialties').delete().eq('id', id);
        return !error;
    }
  },

  requests: {
    getAll: async (): Promise<ReportRequest[]> => {
      const { data } = await supabase.from('requests').select('*');
      return (data as ReportRequest[]) || [];
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

      if (error) {
          console.error("Erro ao criar request", error);
          throw error;
      }
      return inserted as ReportRequest;
    },
    update: async (id: string, updates: Partial<ReportRequest>): Promise<ReportRequest | null> => {
      const { data, error } = await supabase
        .from('requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return null;
      return data as ReportRequest;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from('requests').delete().eq('id', id);
      return !error;
    }
  }
};