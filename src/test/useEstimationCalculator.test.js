import { describe, it, expect } from 'vitest';
import {
  getItemPrice,
  calculateTotals,
  mergeRoleItems,
  determineStatus,
  fmt,
} from '../hooks/useEstimationCalculator';

// ─────────────────────────────────────────────
// 🧪 Mock Data
// ─────────────────────────────────────────────
const paracetamol = {
  id: 'item-1',
  itemCode: 'DRUG001',
  Common_name: 'Paracetamol 500mg',
  category: 'pharma',
  OPD: 10,
  IPD: 8,
  OPDTR: 15,
  IPDTR: 12,
  quantity: 1,
  dose: '',
};

const syringeService = {
  id: 'item-2',
  itemCode: 'NUR001',
  Common_name: 'Syringe Service',
  category: 'nurse',
  OPD: 50,
  IPD: 40,
  OPDTR: 70,
  IPDTR: 60,
  quantity: 1,
  dose: '',
};

const prepItem = {
  id: 'item-3',
  itemCode: 'PREP001',
  Common_name: 'IV Preparation',
  category: 'nurse',
  isPreparation: true,
  OPD: 200,
  IPD: 200,
  OPDTR: 200,
  IPDTR: 200,
  quantity: 1,
  dose: '',
};

const setItem = {
  id: 'item-4',
  itemCode: 'SET001',
  Common_name: 'Chemo Set A',
  isSet: true,
  items: [
    { ...paracetamol, quantity: 2 },
    { ...syringeService, quantity: 1 },
  ],
};

// ─────────────────────────────────────────────
// 🔢 getItemPrice
// ─────────────────────────────────────────────
describe('getItemPrice', () => {
  it('returns the correct price for the given billingRight', () => {
    expect(getItemPrice(paracetamol, 'OPD')).toBe(10);
    expect(getItemPrice(paracetamol, 'IPD')).toBe(8);
    expect(getItemPrice(paracetamol, 'OPDTR')).toBe(15);
    expect(getItemPrice(paracetamol, 'IPDTR')).toBe(12);
  });

  it('falls back to OPD price when billingRight key is missing', () => {
    const item = { ...paracetamol, OPDTR: undefined };
    expect(getItemPrice(item, 'OPDTR')).toBe(10); // falls back to OPD
  });

  it('sums all sub-item UNIT prices for an Item Set (qty multiplication happens at calculateTotals)', () => {
    // getItemPrice returns the unit price of the whole set = sum of each sub-item's unit price (no qty factor)
    // Paracetamol(OPD=10) + Syringe(OPD=50) = 60  (NOT 10×2 + 50×1 = 70)
    expect(getItemPrice(setItem, 'OPD')).toBe(60);
  });
});

// ─────────────────────────────────────────────
// 🧮 calculateTotals
// ─────────────────────────────────────────────
describe('calculateTotals', () => {
  it('correctly splits pharma and nurse totals', () => {
    const items = [
      { ...paracetamol, quantity: 3 },  // pharma: 3 × 10 = 30
      { ...syringeService, quantity: 2 }, // nurse: 2 × 50 = 100
    ];
    const { drugTotal, nurseTotal, grandTotal } = calculateTotals(items, 'OPD');
    expect(drugTotal).toBe(30);
    expect(nurseTotal).toBe(100);
    expect(grandTotal).toBe(130);
  });

  it('excludes preparation items from nurseTotal and counts them in prepTotal', () => {
    const items = [
      { ...paracetamol, quantity: 1 },  // pharma: 10
      { ...prepItem, quantity: 1 },     // prep: 200 (NOT in nurseTotal)
    ];
    const { drugTotal, nurseTotal, prepTotal, grandTotal } = calculateTotals(items, 'OPD');
    expect(drugTotal).toBe(10);
    expect(nurseTotal).toBe(0);
    expect(prepTotal).toBe(200);
    expect(grandTotal).toBe(210);
  });

  it('returns zero totals for an empty cart', () => {
    const { drugTotal, nurseTotal, grandTotal } = calculateTotals([], 'OPD');
    expect(drugTotal).toBe(0);
    expect(nurseTotal).toBe(0);
    expect(grandTotal).toBe(0);
  });

  it('respects billingRight when calculating totals', () => {
    const items = [{ ...paracetamol, quantity: 1 }];
    const { drugTotal: opdTotal } = calculateTotals(items, 'OPD');    // 10
    const { drugTotal: ipdTotal } = calculateTotals(items, 'IPD');    // 8
    const { drugTotal: trTotal } = calculateTotals(items, 'OPDTR');   // 15
    expect(opdTotal).toBe(10);
    expect(ipdTotal).toBe(8);
    expect(trTotal).toBe(15);
  });

  it('multiplies price × quantity correctly', () => {
    const items = [{ ...paracetamol, quantity: 7 }]; // 7 × 10 = 70
    const { drugTotal } = calculateTotals(items, 'OPD');
    expect(drugTotal).toBe(70);
  });
});

// ─────────────────────────────────────────────
// 🔀 mergeRoleItems
// ─────────────────────────────────────────────
describe('mergeRoleItems', () => {
  const pharmaInDB = [{ ...paracetamol, category: 'pharma' }];
  const nurseInDB = [{ ...syringeService, category: 'nurse' }];

  it('pharma role: keeps my pharma items, pulls latest nurse from DB', () => {
    const myItems = [{ ...paracetamol, quantity: 5 }]; // my pharma
    const dbItems = [...pharmaInDB, ...nurseInDB];
    const merged = mergeRoleItems(myItems, dbItems, 'pharma');
    // Should have my pharma (qty 5) + DB's nurse
    const myPharma = merged.filter(i => i.category === 'pharma');
    const dbNurse = merged.filter(i => i.category === 'nurse');
    expect(myPharma[0].quantity).toBe(5);
    expect(dbNurse.length).toBe(1);
  });

  it('nurse role: keeps my nurse items, pulls latest pharma from DB', () => {
    const myItems = [{ ...syringeService, quantity: 3 }]; // my nurse
    const dbItems = [...pharmaInDB, ...nurseInDB];
    const merged = mergeRoleItems(myItems, dbItems, 'nurse');
    const dbPharma = merged.filter(i => i.category === 'pharma');
    const myNurse = merged.filter(i => i.category === 'nurse');
    expect(myNurse[0].quantity).toBe(3);
    expect(dbPharma.length).toBe(1);
  });
});

// ─────────────────────────────────────────────
// 📊 determineStatus
// ─────────────────────────────────────────────
describe('determineStatus', () => {
  it('returns "สมบูรณ์" when both pharma and nurse items exist', () => {
    const items = [paracetamol, syringeService];
    expect(determineStatus(items)).toBe('สมบูรณ์');
  });

  it('returns "รอพยาบาล" when only pharma items exist', () => {
    expect(determineStatus([paracetamol])).toBe('รอพยาบาล');
  });

  it('returns "รอเภสัช" when only nurse items exist', () => {
    expect(determineStatus([syringeService])).toBe('รอเภสัช');
  });

  it('returns "รอเภสัช" for empty cart', () => {
    expect(determineStatus([])).toBe('รอเภสัช');
  });
});

// ─────────────────────────────────────────────
// 🔤 fmt (number formatter)
// ─────────────────────────────────────────────
describe('fmt', () => {
  it('formats integers correctly in Thai locale', () => {
    expect(fmt(1000)).toBe('1,000');
    expect(fmt(0)).toBe('0');
  });

  it('formats decimals up to 2 places', () => {
    expect(fmt(1234.5)).toBe('1,234.5');
    expect(fmt(1234.56)).toBe('1,234.56');
    expect(fmt(1234.567)).toBe('1,234.57'); // rounds to 2dp
  });
});
