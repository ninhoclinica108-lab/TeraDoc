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
  
  // Specialties CRUD
  addSpecialty: (name: string) => Promise<void>;
  updateSpecialty: (id: string, name: string) => Promise<void>;
  deleteSpecialty: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children?: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [requests, setRequests] = useState<ReportRequest[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Theme initialization
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
          console.error("Failed to load initial data", error);
      }
  };

  useEffect(() => {
    setIsLoading(true);
    loadData().finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

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
            role: 'PARENT', 
            permissions: ['criar_solicitacao', 'visualizar_pacientes']
        });
        
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
        return { success: true };
    } catch (error: any) {
        console.error("Registration error:", error);
        return { success: false, error: error.message || "Erro desconhecido ao registrar." };
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => setCurrentUser(null);

  const addPatient = async (data: Omit<Patient, 'id'>) => {
    setIsLoading(true);
    try {
      const newP = await api.patients.create(data);
      setPatients(prev => [...prev, newP]);
    } catch(e) { console.error(e); alert('Erro ao adicionar paciente'); }
    setIsLoading(false);
  };

  const addUser = async (data: Omit<User, 'id'>) => {
    setIsLoading(true);
    try {
      const newU = await api.users.create(data);
      setUsers(prev => [...prev, newU]);
    } catch(e) { console.error(e); alert('Erro ao adicionar usuário'); }
    setIsLoading(false);
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    setIsLoading(true);
    try {
      const updated = await api.users.update(id, data);
      if (updated) {
          setUsers(prev => prev.map(u => u.id === id ? updated : u));
          if (currentUser && currentUser.id === id) setCurrentUser(updated);
      }
    } catch(e) { console.error(e); alert('Erro ao atualizar usuário'); }
    setIsLoading(false);
  };

  const deleteUser = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Todas as informações vinculadas serão perdidas.')) {
        setIsLoading(true);
        const success = await api.users.delete(id);
        if (success) {
            setUsers(prev => prev.filter(u => u.id !== id));
        }
        setIsLoading(false);
    }
  };

  const addSpecialty = async (name: string) => {
    setIsLoading(true);
    const newS = await api.specialties.create(name);
    setSpecialties(prev => [...prev, newS]);
    setIsLoading(false);
  };

  const updateSpecialty = async (id: string, name: string) => {
    setIsLoading(true);
    const updated = await api.specialties.update(id, name);
    if (updated) {
        setSpecialties(prev => prev.map(s => s.id === id ? updated : s));
    }
    setIsLoading(false);
  };

  const deleteSpecialty = async (id: string) => {
    setIsLoading(true);
    const success = await api.specialties.delete(id);
    if (success) {
        setSpecialties(prev => prev.filter(s => s.id !== id));
    }
    setIsLoading(false);
  };

  const createRequest = async (data: Partial<ReportRequest>) => {
    if (!currentUser || !data.patientId) return;
    setIsLoading(true);
    
    const payload = {
      ...data,
      parentId: currentUser.id,
    };

    const newReq = await api.requests.create(payload);
    
    setRequests(prev => [newReq, ...prev]);
    
    if (currentUser.role === 'PARENT') {
      setTimeout(() => playSound('NEW_REQUEST'), 500); 
    }
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
    if (updated) {
        setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
    }
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
    if (updated) {
        setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
    }
  };

  const uploadPdf = async (requestId: string, pdfUrl: string, signer: 'THERAPIST' | 'ADMIN') => {
    let updateData: Partial<ReportRequest> = { pdfUrl };
    
    if (signer === 'ADMIN') {
        updateData = {
            ...updateData,
            status: 'APPROVED_BY_ADMIN',
            isSigned: true,
            completionDate: new Date().toISOString()
        };
    } else {
        updateData = {
            ...updateData,
            status: 'WAITING_SIGNATURE'
        };
    }

    const updated = await api.requests.update(requestId, updateData);
    if (updated) {
        setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
        playSound(signer === 'ADMIN' ? 'COMPLETED' : 'MESSAGE');
    }
  };

  const adminApplyStoredSignature = async (requestId: string) => {
    const updated = await api.requests.update(requestId, {
        status: 'APPROVED_BY_ADMIN',
        isSigned: true,
        completionDate: new Date().toISOString()
    });

    if (updated) {
        const finalPdfUrl = updated.pdfUrl || `relatorio_assinado_via_banco_${requestId}.pdf`;
        const finalObj = { ...updated, pdfUrl: finalPdfUrl };
        setRequests(prev => prev.map(r => r.id === requestId ? finalObj : r));
        playSound('COMPLETED');
    }
  };

  const signReport = async (requestId: string) => {
    const updated = await api.requests.update(requestId, { status: 'SIGNED_BY_THERAPIST', isSigned: true });
    if (updated) {
        setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
        playSound('MESSAGE');
    }
  };

  const approveFinal = async (requestId: string) => {
    const updated = await api.requests.update(requestId, { 
        status: 'APPROVED_BY_ADMIN', 
        completionDate: new Date().toISOString() 
    });
    if (updated) {
        setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
        playSound('COMPLETED');
    }
  };

  const requestRevision = async (requestId: string, notes?: string) => {
    const updated = await api.requests.update(requestId, { status: 'NEEDS_REVISION', adminNotes: notes });
    if (updated) {
        setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
        playSound('MESSAGE');
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta solicitação?')) {
      const success = await api.requests.delete(requestId);
      if (success) {
          setRequests(prev => prev.filter(r => r.id !== requestId));
      }
    }
  };

  const updateUserSignature = async (userId: string, signatureUrl: string) => {
    const updated = await api.users.updateSignature(userId, signatureUrl);
    if (updated) {
        setUsers(prev => prev.map(u => u.id === userId ? updated : u));
        if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
        }
    }
  };

  const getUserById = (id: string) => users.find(u => u.id === id);
  const getPatientById = (id: string) => patients.find(p => p.id === id);

  return (
    <StoreContext.Provider value={{
      currentUser, users, patients, requests, specialties, themeMode, isLoading,
      login, register, logout, toggleTheme, addPatient, addUser, updateUser, deleteUser, createRequest, assignTherapist, saveReportDraft, 
      submitDraft, approveContent, uploadPdf, adminApplyStoredSignature, signReport, approveFinal, requestRevision, deleteRequest,
      updateUserSignature, getUserById, getPatientById,
      addSpecialty, updateSpecialty, deleteSpecialty
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