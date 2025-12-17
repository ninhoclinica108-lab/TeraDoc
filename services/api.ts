import { User, Patient, ReportRequest, Specialty, RequestStatus } from '../types';

// --- MOCK DATABASE (In-Memory) ---
// Quando conectar ao Backend real, remova essas variáveis e substitua as funções
// por chamadas fetch/axios reais.

let dbUsers: User[] = [
  { id: 'u1', name: 'Ana Silva (Mãe)', email: 'mae@teste.com', password: '123', role: 'PARENT', permissions: ['criar_solicitacao', 'visualizar_pacientes'] },
  { id: 'u2', name: 'Carlos Admin', email: 'admin@teste.com', password: '123', role: 'ADMIN', permissions: ['gerenciar_usuarios', 'aprovar_relatorios', 'gerenciar_acessos'] },
  { id: 'u3', name: 'Dra. Helena (Psico)', email: 'helena@teste.com', password: '123', role: 'THERAPIST', specialty: 'Psicologia', signatureUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Signature_sample.svg/1200px-Signature_sample.svg.png', permissions: ['assinar_documentos', 'criar_rascunho'] },
  { id: 'u4', name: 'Dr. Roberto (Fono)', email: 'roberto@teste.com', password: '123', role: 'THERAPIST', specialty: 'Fonoaudiologia', signatureUrl: '', permissions: ['assinar_documentos', 'criar_rascunho'] },
];

let dbPatients: Patient[] = [
  { id: 'p1', parentId: 'u1', name: 'Joãozinho Silva', birthDate: '2015-05-12', therapyType: 'Psicologia', shift: 'Manhã', observations: 'Dificuldade de concentração.' },
  { id: 'p2', parentId: 'u1', name: 'Mariazinha Silva', birthDate: '2018-09-20', therapyType: 'Fonoaudiologia', shift: 'Tarde', observations: 'Troca de fonemas.' },
];

let dbSpecialties: Specialty[] = [
    { id: 's1', name: 'Psicologia' },
    { id: 's2', name: 'Fonoaudiologia' },
    { id: 's3', name: 'Terapia Ocupacional' },
    { id: 's4', name: 'Psicopedagogia' },
    { id: 's5', name: 'Musicoterapia' }
];

let dbRequests: ReportRequest[] = [
  { 
    id: 'r1', 
    patientId: 'p1', 
    parentId: 'u1', 
    status: 'PENDING', 
    category: 'RELATORIO',
    reportPurpose: 'OUTROS',
    parentNotes: 'Preciso para a escola.', 
    requestDate: new Date(Date.now() - 86400000).toISOString(), 
    isSigned: false 
  },
  { 
    id: 'r2', 
    patientId: 'p2', 
    parentId: 'u1', 
    therapistId: 'u4', 
    status: 'APPROVED_BY_ADMIN',
    category: 'RELATORIO',
    reportPurpose: 'CONSULTA_MEDICA', 
    requestDate: new Date(Date.now() - 172800000).toISOString(), 
    completionDate: new Date(Date.now() - 40000000).toISOString(),
    parentNotes: 'Relatório semestral.', 
    therapistContent: 'Paciente apresenta evolução significativa...',
    isSigned: true,
    pdfUrl: 'mock_report.pdf'
  },
  { 
    id: 'r3', 
    patientId: 'p1', 
    parentId: 'u1', 
    therapistId: 'u3',
    status: 'WAITING_SIGNATURE', 
    category: 'DECLARACAO',
    declarationNotes: 'Declaração de comparecimento.',
    requestDate: new Date(Date.now() - 100000000).toISOString(), 
    parentNotes: '', 
    therapistContent: 'Texto aprovado pelo admin, aguardando assinatura.',
    isSigned: false,
    pdfUrl: 'temp_doc.pdf'
  }
];

// Helper para simular latência de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  auth: {
    login: async (email: string, password?: string): Promise<User | null> => {
      await delay(500);
      const user = dbUsers.find(u => u.email === email);
      if (user && (!user.password || user.password === password)) {
        return user;
      }
      return null;
    }
  },

  users: {
    getAll: async (): Promise<User[]> => {
      await delay(300);
      return [...dbUsers];
    },
    create: async (data: Omit<User, 'id'>): Promise<User> => {
      await delay(500);
      const newUser = { ...data, id: Math.random().toString(36).substr(2, 9) };
      dbUsers = [...dbUsers, newUser];
      return newUser;
    },
    updateSignature: async (userId: string, signatureUrl: string): Promise<User | null> => {
      await delay(500);
      const idx = dbUsers.findIndex(u => u.id === userId);
      if (idx !== -1) {
        dbUsers[idx] = { ...dbUsers[idx], signatureUrl };
        return dbUsers[idx];
      }
      return null;
    },
    getById: async (id: string): Promise<User | undefined> => {
        return dbUsers.find(u => u.id === id);
    }
  },

  patients: {
    getAll: async (): Promise<Patient[]> => {
      await delay(300);
      return [...dbPatients];
    },
    create: async (data: Omit<Patient, 'id'>): Promise<Patient> => {
      await delay(500);
      const newPatient = { ...data, id: Math.random().toString(36).substr(2, 9) };
      dbPatients = [...dbPatients, newPatient];
      return newPatient;
    }
  },

  specialties: {
    getAll: async (): Promise<Specialty[]> => {
        await delay(200);
        return [...dbSpecialties];
    },
    create: async (name: string): Promise<Specialty> => {
        await delay(300);
        const newSpec = { id: Math.random().toString(36).substr(2, 9), name };
        dbSpecialties = [...dbSpecialties, newSpec];
        return newSpec;
    },
    update: async (id: string, name: string): Promise<Specialty | null> => {
        await delay(300);
        const idx = dbSpecialties.findIndex(s => s.id === id);
        if (idx !== -1) {
            dbSpecialties[idx] = { ...dbSpecialties[idx], name };
            return dbSpecialties[idx];
        }
        return null;
    },
    delete: async (id: string): Promise<boolean> => {
        await delay(300);
        dbSpecialties = dbSpecialties.filter(s => s.id !== id);
        return true;
    }
  },

  requests: {
    getAll: async (): Promise<ReportRequest[]> => {
      await delay(300);
      return [...dbRequests];
    },
    create: async (data: Partial<ReportRequest>): Promise<ReportRequest> => {
      await delay(500);
      const newRequest = {
        id: Math.random().toString(36).substr(2, 9),
        requestDate: new Date().toISOString(),
        isSigned: false,
        status: 'PENDING',
        ...data
      } as ReportRequest;
      dbRequests = [newRequest, ...dbRequests];
      return newRequest;
    },
    update: async (id: string, updates: Partial<ReportRequest>): Promise<ReportRequest | null> => {
      await delay(400);
      const idx = dbRequests.findIndex(r => r.id === id);
      if (idx !== -1) {
        dbRequests[idx] = { ...dbRequests[idx], ...updates };
        return dbRequests[idx];
      }
      return null;
    },
    delete: async (id: string): Promise<boolean> => {
      await delay(300);
      dbRequests = dbRequests.filter(r => r.id !== id);
      return true;
    }
  }
};