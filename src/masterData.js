// This file manages master data like doctors, diagnoses, and assessors.

const DEFAULT_DOCTORS = ['Dr. Smith', 'Dr. Jones', 'Dr. Taylor'];
const DEFAULT_DIAGNOSES = ['Common Cold', 'Hypertension', 'Diabetes Type 2'];
const DEFAULT_ASSESSORS = ['Assessor A', 'Assessor B'];

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
