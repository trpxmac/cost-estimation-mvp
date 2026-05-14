// src/data.js
// This file manages the medication and item data, including custom additions.

const INITIAL_ITEMS = [
  { itemCode: '5111160000006', Common_name: 'Pemetrexed INJ (100 mg)', OPD: 3000, IPD: 4200, OPDTR: 3300, IPDTR: 5040, category: 'pharma' },
  { itemCode: '5111180600005', Common_name: 'CAMPTO 100 MG/5ML INJ.', OPD: 18000, IPD: 18000, OPDTR: 18000, IPDTR: 18000, category: 'pharma' },
  { itemCode: 'PACset', Common_name: 'Paclitaxel set', OPD: 1020, IPD: 1020, OPDTR: 1020, IPDTR: 1020, category: 'pharma' },
  { itemCode: '5120160800002', Common_name: 'Fluquadri 0.5ml', OPD: 596, IPD: 775, OPDTR: 656, IPDTR: 930, category: 'pharma' },
  { itemCode: 'DRUG001', Common_name: 'Paracetamol 500mg', OPD: 10, IPD: 12, OPDTR: 10, IPDTR: 12, category: 'pharma' },
  { itemCode: 'SERV001', Common_name: 'Nursing Charge', OPD: 200, IPD: 300, OPDTR: 200, IPDTR: 300, category: 'nurse' },
];

const INITIAL_SETS = [
  {
    itemCode: 'phc01',
    Common_name: 'ชุดเวชภัณฑ์ให้ยาเคมีบำบัด (phc01)',
    isSet: true,
    isPreparation: true,
    category: 'pharma',
    items: [
      { itemCode: '138', Common_name: 'Syringe 50 ML (Disp.)', OPD: 138, IPD: 150, OPDTR: 138, IPDTR: 150, category: 'pharma', isPreparation: true },
      { itemCode: '624', Common_name: 'ค่าเตรียมยาเคมีบำบัด', OPD: 624, IPD: 700, OPDTR: 624, IPDTR: 700, category: 'pharma', isPreparation: true },
      { itemCode: '800', Common_name: 'ค่าตู้เตรียมยาเคมีบำบัด', OPD: 800, IPD: 900, OPDTR: 800, IPDTR: 900, category: 'pharma', isPreparation: true },
      { itemCode: '108', Common_name: 'Gauze Sterile 8Ply 4x4 In (10 Pcs)', OPD: 60, IPD: 80, OPDTR: 60, IPDTR: 80, category: 'pharma', quantity: 2, isPreparation: true },
      { itemCode: '165', Common_name: 'Thumps-Up Gown Regular #PPE', OPD: 165, IPD: 200, OPDTR: 165, IPDTR: 200, category: 'pharma', isPreparation: true },
      { itemCode: '200', Common_name: 'Glove Sterile Dermaprene Ultra 7.5', OPD: 200, IPD: 250, OPDTR: 200, IPDTR: 250, category: 'pharma', isPreparation: true },
    ]
  }
];

export function getAllItems() {
  const customItems = JSON.parse(localStorage.getItem('custom_items') || '[]');
  return [...INITIAL_ITEMS, ...INITIAL_SETS, ...customItems];
}

export function saveCustomDrug(drug) {
  const customItems = JSON.parse(localStorage.getItem('custom_items') || '[]');
  const idx = customItems.findIndex(i => i.itemCode === drug.itemCode);
  if (idx > -1) customItems[idx] = drug;
  else customItems.push(drug);
  localStorage.setItem('custom_items', JSON.stringify(customItems));
  return drug;
}