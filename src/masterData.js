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
  return [...DEFAULT_DOCTORS, ...custom];
}

export function getStoredDiagnoses() {
  const custom = JSON.parse(localStorage.getItem('master_diagnoses') || '[]');
  return [...DEFAULT_DIAGNOSES, ...custom];
}

export function getStoredAssessors() {
  const custom = JSON.parse(localStorage.getItem('master_assessors') || '[]');
  return [...DEFAULT_ASSESSORS, ...custom];
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
