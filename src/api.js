/**
 * ============================================================
 *  API INTEGRATION LAYER — Hospital Cost Estimator MVP
 * ============================================================
 */

import { getAllItems, saveCustomDrug } from './data';
import {
  getStoredDoctors, getStoredDiagnoses, getStoredAssessors,
  addDoctor, addDiagnosis, addAssessor,
} from './masterData';

const IMED_BASE_URL = import.meta.env.VITE_IMED_API_URL || null;

export async function searchMedications(query) {
  if (!query?.trim()) return [];
  const items = getAllItems();
  return items.filter(item =>
    item.Common_name.toLowerCase().includes(query.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(query.toLowerCase())
  );
}

export async function getPatientByHN(hn) {
  if (!hn?.trim()) return null;
  return null;
}

export async function saveEstimation(record) {
  const existing = JSON.parse(localStorage.getItem('estimations') || '[]');
  existing.unshift(record);
  localStorage.setItem('estimations', JSON.stringify(existing));
  return record;
}

export async function getEstimations() {
  return JSON.parse(localStorage.getItem('estimations') || '[]');
}

export async function deleteEstimation(id) {
  const existing = JSON.parse(localStorage.getItem('estimations') || '[]');
  const updated = existing.filter(r => r.id !== id);
  localStorage.setItem('estimations', JSON.stringify(updated));
  return true;
}

export async function updateEstimation(id, record) {
  const existing = JSON.parse(localStorage.getItem('estimations') || '[]');
  const updated = existing.map(r => r.id === id ? { ...record, id, updatedAt: new Date().toISOString() } : r);
  localStorage.setItem('estimations', JSON.stringify(updated));
  return record;
}

export async function searchPatients(query) {
  const { default: mockData } = await import('./mockData.json');
  const patients = mockData.patients;
  if (!query?.trim()) return patients;
  const q = query.toLowerCase();
  return patients.filter(p =>
    p.patient_id?.toLowerCase().includes(q) ||
    p.name_th?.toLowerCase().includes(q) ||
    p.name_en?.toLowerCase().includes(q) ||
    p.phone?.toLowerCase().includes(q) ||
    p.doctor?.toLowerCase().includes(q)
  );
}

export async function getAllMedications() {
  return getAllItems();
}

export async function getDoctors()   { return getStoredDoctors(); }
export async function getDiagnoses() { return getStoredDiagnoses(); }
export async function getAssessors() { return getStoredAssessors(); }

export async function addNewDoctor(name)   { return addDoctor(name); }
export async function addNewDiagnosis(name) { return addDiagnosis(name); }
export async function addNewAssessor(name) { return addAssessor(name); }

export async function addNewDrug(drugData) {
  const drug = {
    itemCode: drugData.itemCode || `USR-${Date.now()}`,
    Common_name: drugData.name,
    OPD: Number(drugData.OPD) || 0,
    IPD: Number(drugData.IPD) || 0,
    OPDTR: Number(drugData.OPDTR) || 0,
    IPDTR: Number(drugData.IPDTR) || 0,
    TYPE2_OPD: Number(drugData.TYPE2_OPD) || Number(drugData.OPD) || 0,
    TYPE2_IPD: Number(drugData.TYPE2_IPD) || Number(drugData.IPD) || 0,
    TYPE4_OPD: Number(drugData.TYPE4_OPD) || Number(drugData.OPD) || 0,
    TYPE4_IPD: Number(drugData.TYPE4_IPD) || Number(drugData.IPD) || 0,
    TYPE4_OPDTR: Number(drugData.TYPE4_OPDTR) || Number(drugData.OPDTR) || 0,
    TYPE4_IPDTR: Number(drugData.TYPE4_IPDTR) || Number(drugData.IPDTR) || 0,
    category: drugData.category || 'pharma',
    isPreparation: drugData.category === 'nurse',
    addedAt: new Date().toISOString(),
  };
  return saveCustomDrug(drug);
}
