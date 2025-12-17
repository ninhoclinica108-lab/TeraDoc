
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Patient, ReportRequest, AppState, Specialty, ThemeMode } from '../types';
import { playSound } from '../services/utils';
import { api } from '../services/api';

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
  adminApplyStoredSignature: (requestId: string) => Promise<void>;
  signReport: (requestId: string) => Promise<void>;
  approveFinal: (requestId: string) => Promise<void>;
  requestRevision: (requestId: string, notes?: string) => Promise<void>;
  deleteRequest: (requestId: string) => Promise<void>;
  updateUserSignature: (userId: string, signatureUrl: string) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  getPatientById: (id: string) => Patient | undefined;
  
  addSpecialty: (name: string) => Promise<void>;
  updateSpecialty: (id: string, name: string) => Promise<void>;
  deleteSpecialty: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children?: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [requests, setRequests] = useState<ReportRequest[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const loadData = async () => {
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
      setSpecialties(s);
    } catch (error) {
      console.error("Failed to load data", error);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadData().finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (themeMode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', themeMode);
  }, [themeMode]);

  const toggleTheme = () => setThemeMode(prev => prev === 'light' ? 'dark' : 'light');

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const user = await api.auth.login(email, password);
      if (user) {
        setCurrentUser(user);
        await loadData();
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password?: string) => {
    setIsLoading(true);
    try {
      const newUser = await api.users.create({
        name,
        email,
        password,
        role: 'PARENT', // Sempre responsável ao criar pelo site
        permissions: ['criar_solicitacao', 'visualizar_pacientes']
      });
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => setCurrentUser(null);

  // Fix: Added the missing addPatient implementation
  const addPatient = async (data: Omit<Patient, 'id'>) => {
    setIsLoading(true);
    try {
      const newP = await api.patients.create(data);
      setPatients(prev => [...prev, newP]);
    } catch (e) {
      console.error("Failed to add patient", e);
      alert('Erro ao adicionar paciente');
    } finally {
      setIsLoading(false);
    }
  };

  const addUser = async (data: Omit<User, 'id'>) => {
    if (currentUser?.role !== 'ADMIN') {
      alert('Acesso negado: apenas administradores podem criar usuários.');
      return;
    }
    setIsLoading(true);
    try {
      const newU = await api.users.create(data);
      setUsers(prev => [...prev, newU]);
    } catch(e) { alert('Erro ao adicionar usuário'); }
    setIsLoading(false);
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    setIsLoading(true);
    try {
      const updated = await api.users.update(id, data);
      if (updated) {
        setUsers(prev => prev.map(u => u.id === id ? updated : u));
        if (currentUser?.id === id) setCurrentUser(updated);
      }
    } finally { setIsLoading(false); }
  };

  const deleteUser = async (id: string) => {
    setIsLoading(true);
    const success = await api.users.delete(id);
    if (success) setUsers(prev => prev.filter(u => u.id !== id));
    setIsLoading(false);
  };

  const createRequest = async (data: Partial<ReportRequest>) => {
    if (!currentUser) return;
    setIsLoading(true);
    const newReq = await api.requests.create({ ...data, parentId: currentUser.id });
    setRequests(prev => [newReq, ...prev]);
    if (currentUser.role === 'PARENT') setTimeout(() => playSound('NEW_REQUEST'), 500);
    setIsLoading(false);
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
    if (updated) {
      setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
      playSound('MESSAGE');
    }
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

  const adminApplyStoredSignature = async (requestId: string) => {
    const updated = await api.requests.update(requestId, { status: 'APPROVED_BY_ADMIN', isSigned: true, completionDate: new Date().toISOString() });
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

  const addSpecialty = async (name: string) => {
    const newS = await api.specialties.create(name);
    setSpecialties(prev => [...prev, newS]);
  };

  const updateSpecialty = async (id: string, name: string) => {
    const updated = await api.specialties.update(id, name);
    if (updated) setSpecialties(prev => prev.map(s => s.id === id ? updated : s));
  };

  const deleteSpecialty = async (id: string) => {
    const success = await api.specialties.delete(id);
    if (success) setSpecialties(prev => prev.filter(s => s.id !== id));
  };

  const updateUserSignature = async (userId: string, signatureUrl: string) => {
    const updated = await api.users.updateSignature(userId, signatureUrl);
    if (updated) setUsers(prev => prev.map(u => u.id === userId ? updated : u));
  };

  const getUserById = (id: string) => users.find(u => u.id === id);
  const getPatientById = (id: string) => patients.find(p => p.id === id);

  return (
    <StoreContext.Provider value={{
      currentUser, users, patients, requests, specialties, themeMode, isLoading,
      login, register, logout, toggleTheme, addPatient, addUser, updateUser, deleteUser, createRequest, assignTherapist, saveReportDraft, 
      submitDraft, approveContent, uploadPdf, adminApplyStoredSignature, signReport, approveFinal, requestRevision, deleteRequest,
      updateUserSignature, getUserById, getPatientById, addSpecialty, updateSpecialty, deleteSpecialty
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
