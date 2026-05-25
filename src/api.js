/**
 * ============================================================
 *  API INTEGRATION LAYER — Hospital Cost Estimator MVP
 * ============================================================
 */

import { getAllItems } from './data';
import {
  getStoredDoctors, getStoredDiagnoses, getStoredAssessors,
} from './masterData';
import { ALL_NURSING_SERVICES } from './data/nursingServices';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper to handle safe fetch with fallback to local storage
async function safeFetch(url, options = {}, fallbackValue = null) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`API request to ${url} failed, using local fallback.`, err.message);
  }
  return typeof fallbackValue === 'function' ? fallbackValue() : fallbackValue;
}

export async function searchMedications(query) {
  if (!query?.trim()) return [];
  const baseItems = await getAllMedications();
  return baseItems.filter(item =>
    item.Common_name.toLowerCase().includes(query.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(query.toLowerCase())
  );
}

export async function getPatientByHN(hn) {
  if (!hn?.trim()) return null;
  return null;
}

export async function saveEstimation(record) {
  const result = await safeFetch(`${API_BASE_URL}/estimations`, {
    method: 'POST',
    body: JSON.stringify(record)
  });
  
  if (result) return result;

  // Local Storage Fallback
  const existing = JSON.parse(localStorage.getItem('estimations') || '[]');
  existing.unshift(record);
  localStorage.setItem('estimations', JSON.stringify(existing));
  return record;
}

export async function getEstimations() {
  const result = await safeFetch(`${API_BASE_URL}/estimations`, {}, null);
  if (result) {
    // 💡 Auto-Migration Engine: If we have local storage data, migrate it to PostgreSQL!
    const local = JSON.parse(localStorage.getItem('estimations') || '[]');
    if (local.length > 0) {
      console.log(`Migrating ${local.length} local estimations to PostgreSQL...`);
      for (const record of local) {
        const exists = result.some(r => r.id === record.id);
        if (!exists) {
          await safeFetch(`${API_BASE_URL}/estimations`, {
            method: 'POST',
            body: JSON.stringify(record)
          });
        }
      }
      localStorage.removeItem('estimations');
      return await safeFetch(`${API_BASE_URL}/estimations`, {}, result);
    }
    return result;
  }

  // Local Storage Fallback
  return JSON.parse(localStorage.getItem('estimations') || '[]');
}

export async function getEstimationById(id) {
  const result = await safeFetch(`${API_BASE_URL}/estimations/${id}`, {}, null);
  if (result) return result;

  // Local Storage Fallback
  const existing = JSON.parse(localStorage.getItem('estimations') || '[]');
  return existing.find(r => r.id === id) || null;
}

export async function deleteEstimation(id) {
  const result = await safeFetch(`${API_BASE_URL}/estimations/${id}`, {
    method: 'DELETE'
  }, null);
  
  if (result) return true;

  // Local Storage Fallback
  const existing = JSON.parse(localStorage.getItem('estimations') || '[]');
  const updated = existing.filter(r => r.id !== id);
  localStorage.setItem('estimations', JSON.stringify(updated));
  return true;
}

export async function updateEstimation(id, record) {
  const result = await safeFetch(`${API_BASE_URL}/estimations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(record)
  });

  if (result) return result;

  // Local Storage Fallback
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
  const dbCustom = await safeFetch(`${API_BASE_URL}/custom-drugs`, {}, []);
  const staticItems = getAllItems();

  // Start with static pharma items
  const merged = [...staticItems];

  // Merge DB custom items (overwrite static if same itemCode)
  dbCustom.forEach(custom => {
    const idx = merged.findIndex(i => i.itemCode === custom.itemCode);
    if (idx > -1) {
      merged[idx] = custom;
    } else {
      merged.push(custom);
    }
  });

  // Merge standard nursing service items (skip if already in DB as custom)
  const allCodes = new Set(merged.map(i => i.itemCode));
  ALL_NURSING_SERVICES.forEach(nrs => {
    if (!allCodes.has(nrs.itemCode)) {
      merged.push(nrs);
    }
  });

  return merged;
}

export async function getDoctors() {
  const result = await safeFetch(`${API_BASE_URL}/master-data/doctor`, {}, null);
  return result || getStoredDoctors();
}

export async function getDiagnoses() {
  const result = await safeFetch(`${API_BASE_URL}/master-data/diagnosis`, {}, null);
  return result || getStoredDiagnoses();
}

export async function getAssessors() {
  const result = await safeFetch(`${API_BASE_URL}/master-data/assessor`, {}, null);
  return result || getStoredAssessors();
}

export async function addNewDoctor(name) {
  const result = await safeFetch(`${API_BASE_URL}/master-data/doctor`, {
    method: 'POST',
    body: JSON.stringify({ value: name })
  });
  if (result) return name;
  
  // Fallback
  const { addDoctor } = await import('./masterData');
  return addDoctor(name);
}

export async function addNewDiagnosis(name) {
  const result = await safeFetch(`${API_BASE_URL}/master-data/diagnosis`, {
    method: 'POST',
    body: JSON.stringify({ value: name })
  });
  if (result) return name;

  // Fallback
  const { addDiagnosis } = await import('./masterData');
  return addDiagnosis(name);
}

export async function addNewAssessor(name) {
  const result = await safeFetch(`${API_BASE_URL}/master-data/assessor`, {
    method: 'POST',
    body: JSON.stringify({ value: name })
  });
  if (result) return name;

  // Fallback
  const { addAssessor } = await import('./masterData');
  return addAssessor(name);
}

export async function addNewDrug(drugData) {
  const drug = {
    itemCode: drugData.itemCode || `USR-${Date.now()}`,
    Common_name: drugData.name,
    OPD: Number(drugData.OPD) || 0,
    IPD: Number(drugData.IPD) || 0,
    OPDTR: Number(drugData.OPDTR) || 0,
    IPDTR: Number(drugData.IPDTR) || 0,
    category: drugData.category || 'pharma',
    stock: drugData.stock !== undefined ? Number(drugData.stock) : 50,
    isSet: !!drugData.isSet,
    items: drugData.items,
    isPreparation: drugData.category === 'nurse',
    addedAt: new Date().toISOString(),
  };

  const result = await safeFetch(`${API_BASE_URL}/custom-drugs`, {
    method: 'POST',
    body: JSON.stringify(drug)
  });

  if (result) return drug;

  // Fallback
  const { saveCustomDrug } = await import('./data');
  return saveCustomDrug(drug);
}
