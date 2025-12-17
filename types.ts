export type Role = 'PARENT' | 'ADMIN' | 'THERAPIST';

export type RequestStatus = 
  | 'PENDING'               // 1. Initial request
  | 'ASSIGNED'              // 2. Admin assigned to therapist
  | 'WAITING_APPROVAL'      // 3. Therapist finished draft -> Admin reviews text
  | 'NEEDS_REVISION'        // X. Admin rejected text or final PDF -> Back to Therapist
  | 'WAITING_PDF_UPLOAD'    // 4. Admin approved text -> Admin must upload PDF
  | 'WAITING_SIGNATURE'     // 5. PDF uploaded -> Therapist must sign
  | 'SIGNED_BY_THERAPIST'   // 6. Signed -> Admin final review
  | 'APPROVED_BY_ADMIN'     // 7. Final -> Parent can download
  | 'COMPLETED';            // Legacy

export type RequestCategory = 
  | 'RELATORIO' 
  | 'DECLARACAO' 
  | 'FALTA_JUSTIFICATIVA' 
  | 'ATUALIZACAO_LAUDO' 
  | 'DESLIGAMENTO'
  | 'ACESSORIO'; // Solicitado: "Acessório"

export interface Specialty {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Novo: Senha do usuário
  role: Role;
  avatar?: string;
  signatureUrl?: string; // Image URL of the signature
  permissions?: string[]; // New: List of specific permissions
  specialty?: string; // Novo: Especialidade do terapeuta
}

export interface Patient {
  id: string;
  parentId: string;
  name: string;
  birthDate: string;
  therapyType: string; // Used as generic therapy type
  shift: string; // Novo: Turno
  observations: string;
}

export interface ReportRequest {
  id: string;
  patientId: string;
  parentId: string;
  therapistId?: string;
  status: RequestStatus;
  requestDate: string;
  completionDate?: string;
  
  // New Categorization Fields
  category: RequestCategory;
  
  // Relatório Fields
  reportPurpose?: 'CONSULTA_MEDICA' | 'OUTROS';
  medicalConsultationDate?: string; // Optional
  reportSpecialty?: string; // Qual especialidade o pai quer
  
  // Declaração Fields
  declarationNotes?: string;
  
  // Falta Fields
  absentStartDate?: string;
  absentEndDate?: string;
  absentReason?: string;
  
  // Desligamento Fields
  dismissalReason?: string;

  // Generic
  parentNotes: string; // Fallback or "Outros" details
  attachmentUrl?: string; // For Laudos or Falta proofs
  
  // Workflow
  therapistContent?: string;
  isSigned: boolean;
  adminNotes?: string;
  pdfUrl?: string; // URL of the uploaded/generated PDF
}

export type ThemeMode = 'light' | 'dark';

export interface AppState {
  currentUser: User | null;
  users: User[];
  patients: Patient[];
  requests: ReportRequest[];
  specialties: Specialty[];
  themeMode: ThemeMode;
  isLoading: boolean; // Added for Async Ops
}

export interface AuthCredentials {
  email: string;
}