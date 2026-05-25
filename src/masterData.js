// This file manages master data like doctors, diagnoses, and assessors.

const DEFAULT_DOCTORS = ['พ.มานพ', 'พ.ธรรม์', 'พ.วฤทธิ์', 'Dr suwit'];
const DEFAULT_DIAGNOSES = [
  'CA breast', 'CA cervix', 'CA ovary', 'CA prostate', 'CA tonsil',
  'CA rectum', 'CA colon', 'CA tounge', 'CA bladder', 'CA larynx',
  'CA glottis', 'CA lung', 'LYMPHOMA', 'Sarcoma', 'CA Anal'
];
const DEFAULT_ASSESSORS = ['ชญานิษฐ์', 'กฤษณะพล', 'ภัทรพร', 'สุพิชญา', 'Dr suwit'];

export function getStoredDoctors() {
  const custom = JSON.parse(localStorage.getItem('master_doctors') || '[]');
  const deleted = JSON.parse(localStorage.getItem('deleted_doctors') || '[]');
  return [...DEFAULT_DOCTORS.filter(d => !deleted.includes(d)), ...custom];
}

export function getStoredDiagnoses() {
  const custom = JSON.parse(localStorage.getItem('master_diagnoses') || '[]');
  const deleted = JSON.parse(localStorage.getItem('deleted_diagnoses') || '[]');
  return [...DEFAULT_DIAGNOSES.filter(d => !deleted.includes(d)), ...custom];
}

export function getStoredAssessors() {
  const custom = JSON.parse(localStorage.getItem('master_assessors') || '[]');
  const deleted = JSON.parse(localStorage.getItem('deleted_assessors') || '[]');
  return [...DEFAULT_ASSESSORS.filter(d => !deleted.includes(d)), ...custom];
}

export function addDoctor(name) {
  const custom = JSON.parse(localStorage.getItem('master_doctors') || '[]');
  custom.push(name);
  localStorage.setItem('master_doctors', JSON.stringify(custom));
  return name;
}

export function addDiagnosis(name) {
  const custom = JSON.parse(localStorage.getItem('master_diagnoses') || '[]');
  custom.push(name);
  localStorage.setItem('master_diagnoses', JSON.stringify(custom));
  return name;
}

export function addAssessor(name) {
  const custom = JSON.parse(localStorage.getItem('master_assessors') || '[]');
  custom.push(name);
  localStorage.setItem('master_assessors', JSON.stringify(custom));
  return name;
}

export function removeDoctor(name) {
  let custom = JSON.parse(localStorage.getItem('master_doctors') || '[]');
  localStorage.setItem('master_doctors', JSON.stringify(custom.filter(n => n !== name)));
  let deleted = JSON.parse(localStorage.getItem('deleted_doctors') || '[]');
  if (DEFAULT_DOCTORS.includes(name) && !deleted.includes(name)) {
    deleted.push(name);
    localStorage.setItem('deleted_doctors', JSON.stringify(deleted));
  }
}

export function removeDiagnosis(name) {
  let custom = JSON.parse(localStorage.getItem('master_diagnoses') || '[]');
  localStorage.setItem('master_diagnoses', JSON.stringify(custom.filter(n => n !== name)));
  let deleted = JSON.parse(localStorage.getItem('deleted_diagnoses') || '[]');
  if (DEFAULT_DIAGNOSES.includes(name) && !deleted.includes(name)) {
    deleted.push(name);
    localStorage.setItem('deleted_diagnoses', JSON.stringify(deleted));
  }
}

export function removeAssessor(name) {
  let custom = JSON.parse(localStorage.getItem('master_assessors') || '[]');
  localStorage.setItem('master_assessors', JSON.stringify(custom.filter(n => n !== name)));
  let deleted = JSON.parse(localStorage.getItem('deleted_assessors') || '[]');
  if (DEFAULT_ASSESSORS.includes(name) && !deleted.includes(name)) {
    deleted.push(name);
    localStorage.setItem('deleted_assessors', JSON.stringify(deleted));
  }
}
