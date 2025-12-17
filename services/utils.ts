import { ReportRequest, User, Patient } from '../types';

// --- Sound Service (Web Audio API) ---
// Avoiding external MP3 dependencies for reliability
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

const playTone = (freq: number, type: OscillatorType, duration: number, delay = 0) => {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = freq;
  
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + delay);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start(audioCtx.currentTime + delay);
  oscillator.stop(audioCtx.currentTime + delay + duration);
};

export const playSound = (type: 'NEW_REQUEST' | 'ASSIGNED' | 'COMPLETED' | 'MESSAGE') => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  switch (type) {
    case 'NEW_REQUEST': // Soft Bell
      playTone(440, 'sine', 1);
      playTone(554, 'sine', 1, 0.2);
      break;
    case 'ASSIGNED': // Short chirp
      playTone(800, 'triangle', 0.1);
      playTone(1200, 'triangle', 0.1, 0.1);
      break;
    case 'COMPLETED': // Success chord
      playTone(523.25, 'sine', 1.5); // C5
      playTone(659.25, 'sine', 1.5, 0.1); // E5
      playTone(783.99, 'sine', 1.5, 0.2); // G5
      break;
    case 'MESSAGE': // Simple pop
      playTone(300, 'square', 0.1);
      break;
  }
};

// --- PDF Service ---
declare const jspdf: any; // Global from CDN

export const generatePDF = (request: ReportRequest, patient: Patient, therapist: User, parent: User) => {
  if (typeof jspdf === 'undefined') {
    alert('Biblioteca PDF ainda carregando. Tente novamente em alguns segundos.');
    return;
  }

  const { jsPDF } = jspdf;
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(15, 118, 110); // Primary color
  doc.text(request.category === 'RELATORIO' ? 'Relatório Terapêutico' : 'Documento Oficial', 105, 20, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 25, 190, 25);

  // Info Section
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Dados do Paciente:', 20, 40);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome: ${patient.name}`, 20, 50);
  doc.text(`Data de Nasc.: ${patient.birthDate}`, 20, 60);
  doc.text(`Responsável: ${parent.name}`, 20, 70);

  doc.setFont('helvetica', 'bold');
  doc.text('Detalhes do Documento:', 120, 40);
  doc.setFont('helvetica', 'normal');
  doc.text(`Emissor/Terapeuta: ${therapist.name}`, 120, 50);
  doc.text(`Data Solicitação: ${new Date(request.requestDate).toLocaleDateString('pt-BR')}`, 120, 60);
  doc.text(`Data Emissão: ${new Date(request.completionDate || Date.now()).toLocaleDateString('pt-BR')}`, 120, 70);

  // Content
  doc.setDrawColor(0, 0, 0);
  doc.rect(20, 85, 170, 150);
  
  doc.setFontSize(14);
  doc.text('Conteúdo / Parecer', 25, 95);
  doc.setFontSize(11);
  
  // Selecionar o conteúdo correto baseado no tipo de solicitação se o terapeuta não escreveu nada específico
  let contentText = request.therapistContent;
  if (!contentText) {
      if (request.category === 'DECLARACAO') contentText = request.declarationNotes ? `Declaração: ${request.declarationNotes}` : 'Declaração emitida conforme solicitado.';
      else if (request.category === 'DESLIGAMENTO') contentText = request.dismissalReason ? `Motivo do Desligamento: ${request.dismissalReason}` : 'Processo de desligamento concluído.';
      else if (request.category === 'FALTA_JUSTIFICATIVA') contentText = request.absentReason ? `Justificativa de Falta: ${request.absentReason}` : 'Justificativa de falta aceita e processada.';
      else contentText = request.parentNotes || 'Conteúdo não disponível.';
  }

  const splitText = doc.splitTextToSize(contentText, 160);
  doc.text(splitText, 25, 105);

  // Gov.br Signature Simulation
  if (request.isSigned) {
    const yPos = 250;
    doc.setFillColor(240, 248, 255); // AliceBlue
    doc.setDrawColor(15, 118, 110);
    doc.roundedRect(60, yPos, 90, 30, 3, 3, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(15, 118, 110);
    doc.setFont('helvetica', 'bold');
    doc.text('Assinado Digitalmente via Gov.br', 105, yPos + 10, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`Signatário: ${therapist.name}`, 105, yPos + 18, { align: 'center' });
    doc.text(`Hash: ${request.id.toUpperCase()}-${Date.now()}`, 105, yPos + 24, { align: 'center' });
  }

  doc.save(`Documento_${patient.name.replace(/\s/g, '_')}.pdf`);
};