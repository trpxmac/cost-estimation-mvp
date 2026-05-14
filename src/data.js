// src/data.js
// This file manages the medication and item data, including custom additions.

const INITIAL_ITEMS = [
  { itemCode: 'DRUG001', Common_name: 'Paracetamol 500mg', OPD: 10, IPD: 12, category: 'pharma' },
  { itemCode: 'DRUG002', Common_name: 'Amoxicillin 250mg', OPD: 50, IPD: 55, category: 'pharma' },
  { itemCode: 'SERV001', Common_name: 'Nursing Charge', OPD: 200, IPD: 300, category: 'nurse' },
  { itemCode: 'SERV002', Common_name: 'Facility Fee', OPD: 100, IPD: 150, category: 'nurse' },
];

export function getAllItems() {
  const customItems = JSON.parse(localStorage.getItem('custom_items') || '[]');
  return [...INITIAL_ITEMS, ...customItems];
}

export function saveCustomDrug(drug) {
  const customItems = JSON.parse(localStorage.getItem('custom_items') || '[]');
  customItems.push(drug);
  localStorage.setItem('custom_items', JSON.stringify(customItems));
  return drug;
}