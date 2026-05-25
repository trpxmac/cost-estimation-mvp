/**
 * ============================================================
 *  API INTEGRATION LAYER — Hospital Cost Estimator MVP
 * ============================================================
 */

import { getAllItems } from './data';
import {
  getStoredDoctors, getStoredDiagnoses, getStoredAssessors,
  removeDoctor, removeDiagnosis, removeAssessor
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
  try {
    const patients = await searchPatients(hn);
    return patients.find(p => p.patient_id.toLowerCase() === hn.toLowerCase()) || null;
  } catch (e) {
    return null;
  }
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
  const dbPatients = await safeFetch(`${API_BASE_URL}/patients`, {}, []);
  let patients = dbPatients;

  // Auto-migrate from mockData if DB is empty
  if (dbPatients.length === 0) {
    const { default: mockData } = await import('./mockData.json');
    patients = mockData.patients;
    console.log(`Migrating ${patients.length} mock patients to PostgreSQL...`);
    for (const p of patients) {
      await safeFetch(`${API_BASE_URL}/patients`, {
        method: 'POST',
        body: JSON.stringify(p)
      });
    }
  }

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
  const staticItems = getAllItems();

  // 1. Fetch all custom drugs from DB
  const dbCustom = await safeFetch(`${API_BASE_URL}/custom-drugs`, {}, []);
  
  // 2. Auto-Migrate local custom_items to DB
  const localCustom = JSON.parse(localStorage.getItem('custom_items') || '[]');
  if (localCustom.length > 0) {
    console.log(`Migrating ${localCustom.length} local custom items to PostgreSQL...`);
    for (const item of localCustom) {
      const exists = dbCustom.some(d => d.itemCode === item.itemCode);
      if (!exists) {
        await safeFetch(`${API_BASE_URL}/custom-drugs`, {
          method: 'POST',
          body: JSON.stringify(item)
        });
      }
    }
    localStorage.removeItem('custom_items');
    // Re-fetch after migration
    const updatedDbCustom = await safeFetch(`${API_BASE_URL}/custom-drugs`, {}, []);
    dbCustom.length = 0;
    dbCustom.push(...updatedDbCustom);
  }

  const validDbCustom = dbCustom.filter(d => !d.isDeleted);
  let merged = [...validDbCustom];

  // 3. Merge static items (skip if in validDbCustom or if the user deleted them)
  const dbCodes = new Set(dbCustom.map(i => i.itemCode)); // Include deleted in Set so static items don't reappear
  staticItems.forEach(item => {
    if (!dbCodes.has(item.itemCode)) {
      merged.push(item);
    }
  });

  // 4. Auto-Migrate standard nursing service items to DB if they don't exist
  let migratedNurse = false;
  for (const nrs of ALL_NURSING_SERVICES) {
    if (!dbCodes.has(nrs.itemCode)) {
      await safeFetch(`${API_BASE_URL}/custom-drugs`, {
        method: 'POST',
        body: JSON.stringify(nrs)
      });
      migratedNurse = true;
      merged.push(nrs);
      dbCodes.add(nrs.itemCode); // Prevent duplicates in memory
    }
  }

  return merged;
}

export async function getDoctors() {
  const result = await safeFetch(`${API_BASE_URL}/master-data/doctor`, {}, null);
  if (result) {
    const local = JSON.parse(localStorage.getItem('master_doctors') || '[]');
    if (local.length > 0) {
      for (const name of local) {
        if (!result.includes(name)) {
          await safeFetch(`${API_BASE_URL}/master-data/doctor`, { method: 'POST', body: JSON.stringify({ value: name }) });
        }
      }
      localStorage.removeItem('master_doctors');
      return await safeFetch(`${API_BASE_URL}/master-data/doctor`, {}, result);
    }
    return result;
  }
  return getStoredDoctors();
}

export async function getDiagnoses() {
  const result = await safeFetch(`${API_BASE_URL}/master-data/diagnosis`, {}, null);
  if (result) {
    const local = JSON.parse(localStorage.getItem('master_diagnoses') || '[]');
    if (local.length > 0) {
      for (const name of local) {
        if (!result.includes(name)) {
          await safeFetch(`${API_BASE_URL}/master-data/diagnosis`, { method: 'POST', body: JSON.stringify({ value: name }) });
        }
      }
      localStorage.removeItem('master_diagnoses');
      return await safeFetch(`${API_BASE_URL}/master-data/diagnosis`, {}, result);
    }
    return result;
  }
  return getStoredDiagnoses();
}

export async function getAssessors() {
  const result = await safeFetch(`${API_BASE_URL}/master-data/assessor`, {}, null);
  if (result) {
    const local = JSON.parse(localStorage.getItem('master_assessors') || '[]');
    if (local.length > 0) {
      for (const name of local) {
        if (!result.includes(name)) {
          await safeFetch(`${API_BASE_URL}/master-data/assessor`, { method: 'POST', body: JSON.stringify({ value: name }) });
        }
      }
      localStorage.removeItem('master_assessors');
      return await safeFetch(`${API_BASE_URL}/master-data/assessor`, {}, result);
    }
    return result;
  }
  return getStoredAssessors();
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
    Common_name: drugData.Common_name || drugData.name,
    OPD: Number(drugData.OPD) || 0,
    IPD: Number(drugData.IPD) || 0,
    OPDTR: Number(drugData.OPDTR) || 0,
    IPDTR: Number(drugData.IPDTR) || 0,
    category: drugData.category || 'pharma',
    stock: drugData.stock === null ? null : (drugData.stock !== undefined ? Number(drugData.stock) : 50),
    isSet: !!drugData.isSet,
    items: drugData.items,
    isPreparation: !!drugData.isPreparation,
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

export async function deleteDrug(itemCode) {
  const result = await safeFetch(`${API_BASE_URL}/custom-drugs/${itemCode}`, {
    method: 'DELETE'
  }, null);

  if (result) return true;

  // Fallback
  const { deleteCustomDrug } = await import('./data');
  if (deleteCustomDrug) {
    return deleteCustomDrug(itemCode);
  }
  return true;
}

export async function deleteMasterData(type, value) {
  const result = await safeFetch(`${API_BASE_URL}/master-data/${type}/${encodeURIComponent(value)}`, {
    method: 'DELETE'
  }, null);

  if (result) return true;

  // Fallback to local storage
  if (type === 'doctor') removeDoctor(value);
  if (type === 'diagnosis') removeDiagnosis(value);
  if (type === 'assessor') removeAssessor(value);
  return true;
}

export async function loginUser(username, password) {
  const result = await safeFetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  return result; // expected { success: true, user: ... }
}

export async function getUsers() {
  const result = await safeFetch(`${API_BASE_URL}/users`, {}, []);
  return result;
}

export async function createUser(user) {
  const result = await safeFetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    body: JSON.stringify(user)
  });
  return result;
}

export async function updateUser(id, user) {
  const result = await safeFetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user)
  });
  return result;
}

export async function deleteUser(id) {
  const result = await safeFetch(`${API_BASE_URL}/users/${id}`, {
    method: 'DELETE'
  });
  return result;
}
