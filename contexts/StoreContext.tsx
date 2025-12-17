
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Patient, ReportRequest, AppState, Specialty, ThemeMode } from '../types';
import { playSound } from '../services/utils';
import { api } from '../services/api';
import { supabase } from '../services/supabase';

interface StoreContextType extends AppState {
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  toggleTheme: () => void;
  addPatient: (patient: Omit<Patient, 'id'>) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  createRequest: (data: Partial<ReportRequest>) => Promise<void>;
  assignTherapist: (requestId: string, therapistId: string) => Promise<void>;
  saveReportDraft: (requestId: string, content: string) => Promise<void>;
  submitDraft: (requestId: string) => Promise<void>; 
  approveContent: (requestId: string) => Promise<void>;
  uploadPdf: (requestId: string, pdfUrl: string, signer: 'THERAPIST' | 'ADMIN') => Promise<void>;
  signReport: (requestId: string) => Promise<void>;
  approveFinal: (requestId: string) => Promise<void>;
  requestRevision: (requestId: string, notes?: string) => Promise<void>;
  deleteRequest: (requestId: string) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  getPatientById: (id: string) => Patient | undefined;
  // Fix: Added missing method definitions used in AdminDashboard and TherapistDashboard
  adminApplyStoredSignature: (requestId: string) => Promise<void>;
  addSpecialty: (specialty: Omit<Specialty, 'id'>) => Promise<void>;
  updateSpecialty: (id: string, data: Partial<Specialty>) => Promise<void>;
  deleteSpecialty: (id: string) => Promise<void>;
  updateUserSignature: (userId: string, signatureUrl: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children?: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [requests, setRequests] = useState<ReportRequest[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const loadAppData = async () => {
    try {
      const [u, p, r, s] = await Promise.all([
        api.users.getAll(),
        api.patients.getAll(),
        api.requests.getAll(),
        api.specialties.getAll()
      ]);
      setUsers(u);
      setPatients(p);
      setRequests(r);
      setSpecialties(s || []);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    }
  };

  const refreshCurrentUser = async () => {
    const user = await api.auth.getSessionUser();
    setCurrentUser(user);
    if (user) loadAppData();
    setIsLoading(false);
  };

  useEffect(() => {
    refreshCurrentUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        refreshCurrentUser();
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setUsers([]);
        setPatients([]);
        setRequests([]);
        setSpecialties([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (themeMode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', themeMode);
  }, [themeMode]);

  const toggleTheme = () => setThemeMode(prev => prev === 'light' ? 'dark' : 'light');

  const login = async (email: string, password?: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || ''
      });
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Login error:", e);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, password?: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || '',
        options: { data: { name, role: 'PARENT' } }
      });
      if (error) throw error;
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await api.auth.signOut();
    setCurrentUser(null);
  };

  const addPatient = async (data: Omit<Patient, 'id'>) => {
    if (!currentUser) return;
    const newP = await api.patients.create({ ...data, parentId: currentUser.id });
    setPatients(prev => [...prev, newP]);
  };

  const createRequest = async (data: Partial<ReportRequest>) => {
    if (!currentUser) return;
    const newReq = await api.requests.create({ ...data, parentId: currentUser.id });
    setRequests(prev => [newReq, ...prev]);
    if (currentUser.role === 'PARENT') playSound('NEW_REQUEST');
  };

  const assignTherapist = async (requestId: string, therapistId: string) => {
    const updated = await api.requests.update(requestId, { status: 'ASSIGNED', therapistId });
    if (updated) {
      setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
      playSound('ASSIGNED');
    }
  };

  const saveReportDraft = async (requestId: string, content: string) => {
    const updated = await api.requests.update(requestId, { therapistContent: content });
    if (updated) setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
  };

  const submitDraft = async (requestId: string) => {
    const updated = await api.requests.update(requestId, { status: 'WAITING_APPROVAL' });
    if (updated) setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
  };

  const approveContent = async (requestId: string) => {
    const updated = await api.requests.update(requestId, { status: 'WAITING_PDF_UPLOAD' });
    if (updated) setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
  };

  const uploadPdf = async (requestId: string, pdfUrl: string, signer: 'THERAPIST' | 'ADMIN') => {
    const updateData: Partial<ReportRequest> = signer === 'ADMIN' 
      ? { pdfUrl, status: 'APPROVED_BY_ADMIN', isSigned: true, completionDate: new Date().toISOString() }
      : { pdfUrl, status: 'WAITING_SIGNATURE' };
    const updated = await api.requests.update(requestId, updateData);
    if (updated) setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
  };

  const signReport = async (requestId: string) => {
    const updated = await api.requests.update(requestId, { status: 'SIGNED_BY_THERAPIST', isSigned: true });
    if (updated) setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
  };

  const approveFinal = async (requestId: string) => {
    const updated = await api.requests.update(requestId, { status: 'APPROVED_BY_ADMIN', completionDate: new Date().toISOString() });
    if (updated) setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
  };

  const requestRevision = async (requestId: string, notes?: string) => {
    const updated = await api.requests.update(requestId, { status: 'NEEDS_REVISION', adminNotes: notes });
    if (updated) setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
  };

  const deleteRequest = async (requestId: string) => {
    const success = await api.requests.delete(requestId);
    if (success) setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const addUser = async (data: Omit<User, 'id'>) => {
    const inserted = await api.users.create(data);
    if (inserted) setUsers(prev => [...prev, inserted]);
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    const updated = await api.users.update(id, data);
    if (updated) setUsers(prev => prev.map(u => u.id === id ? updated : u));
  };

  const deleteUser = async (id: string) => {
    const success = await api.users.delete(id);
    if (success) setUsers(prev => prev.filter(u => u.id !== id));
  };

  const getUserById = (id: string) => users.find(u => u.id === id);
  const getPatientById = (id: string) => patients.find(p => p.id === id);

  // Implement missing methods for dashboard operations
  const adminApplyStoredSignature = async (requestId: string) => {
    const updated = await api.requests.update(requestId, { 
      status: 'APPROVED_BY_ADMIN', 
      isSigned: true, 
      completionDate: new Date().toISOString() 
    });
    if (updated) setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
  };

  const addSpecialty = async (data: Omit<Specialty, 'id'>) => {
    const newS = await api.specialties.create(data);
    if (newS) setSpecialties(prev => [...prev, newS]);
  };

  const updateSpecialty = async (id: string, data: Partial<Specialty>) => {
    const updated = await api.specialties.update(id, data);
    if (updated) setSpecialties(prev => prev.map(s => s.id === id ? updated : s));
  };

  const deleteSpecialty = async (id: string) => {
    const success = await api.specialties.delete(id);
    if (success) setSpecialties(prev => prev.filter(s => s.id !== id));
  };

  const updateUserSignature = async (userId: string, signatureUrl: string) => {
    await updateUser(userId, { signatureUrl });
  };

  return (
    <StoreContext.Provider value={{
      currentUser, users, patients, requests, specialties, themeMode, isLoading,
      login, register, logout, toggleTheme, addPatient, addUser, updateUser, deleteUser, createRequest, assignTherapist, saveReportDraft, 
      submitDraft, approveContent, uploadPdf, signReport, approveFinal, requestRevision, deleteRequest,
      getUserById, getPatientById, adminApplyStoredSignature, addSpecialty, updateSpecialty, deleteSpecialty, updateUserSignature
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
