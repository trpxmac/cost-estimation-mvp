import { describe, it, expect } from 'vitest';
import {
  shouldSpecifyPrice,
  getItemPrice,
  useEstimationCalculator,
} from '../hooks/useEstimationCalculator';

// ─────────────────────────────────────────────
// 🧪 shouldSpecifyPrice
// ─────────────────────────────────────────────
describe('shouldSpecifyPrice', () => {
  it('returns true for NRS-DOCTOR regardless of billingRight', () => {
    expect(shouldSpecifyPrice('NRS-DOCTOR', 'OPD')).toBe(true);
    expect(shouldSpecifyPrice('NRS-DOCTOR', 'IPD')).toBe(true);
    expect(shouldSpecifyPrice('NRS-DOCTOR', 'OPDTR')).toBe(true);
    expect(shouldSpecifyPrice('NRS-DOCTOR', 'IPDTR')).toBe(true);
  });

  it('returns true for NRS-ONCO regardless of billingRight', () => {
    expect(shouldSpecifyPrice('NRS-ONCO', 'OPD')).toBe(true);
    expect(shouldSpecifyPrice('NRS-ONCO', 'IPD')).toBe(true);
  });

  it('returns true for NRS-SUPPLY only when billingRight is IPD or IPDTR', () => {
    expect(shouldSpecifyPrice('NRS-SUPPLY', 'IPD')).toBe(true);
    expect(shouldSpecifyPrice('NRS-SUPPLY', 'IPDTR')).toBe(true);
    expect(shouldSpecifyPrice('NRS-SUPPLY', 'OPD')).toBe(false);
    expect(shouldSpecifyPrice('NRS-SUPPLY', 'OPDTR')).toBe(false);
  });

  it('returns true for NRS-LAB only when billingRight is IPD', () => {
    expect(shouldSpecifyPrice('NRS-LAB', 'IPD')).toBe(true);
    expect(shouldSpecifyPrice('NRS-LAB', 'OPD')).toBe(false);
    expect(shouldSpecifyPrice('NRS-LAB', 'OPDTR')).toBe(false);
    expect(shouldSpecifyPrice('NRS-LAB', 'IPDTR')).toBe(false);
  });

  it('returns false for regular drug item codes', () => {
    expect(shouldSpecifyPrice('DRUG001', 'OPD')).toBe(false);
    expect(shouldSpecifyPrice('DRUG001', 'IPD')).toBe(false);
    expect(shouldSpecifyPrice('SET001', 'OPD')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// 💰 getItemPrice with customPrice
// ─────────────────────────────────────────────
describe('getItemPrice with customPrice (shouldSpecifyPrice items)', () => {
  const doctorFeeItem = {
    itemCode: 'NRS-DOCTOR',
    Common_name: 'ค่าแพทย์',
    category: 'nurse',
    OPD: 0, IPD: 0, OPDTR: 0, IPDTR: 0,
    quantity: 1,
  };

  it('returns customPrice when set on a shouldSpecifyPrice item', () => {
    const item = { ...doctorFeeItem, customPrice: 1500 };
    expect(getItemPrice(item, 'OPD')).toBe(1500);
  });

  it('returns 0 when customPrice is not set on a shouldSpecifyPrice item', () => {
    expect(getItemPrice(doctorFeeItem, 'OPD')).toBe(0);
  });

  it('returns 0 when customPrice is null', () => {
    const item = { ...doctorFeeItem, customPrice: null };
    expect(getItemPrice(item, 'OPD')).toBe(0);
  });

  it('returns 0 when customPrice is empty string', () => {
    const item = { ...doctorFeeItem, customPrice: '' };
    expect(getItemPrice(item, 'OPD')).toBe(0);
  });

  it('returns customPrice as number even when passed as string', () => {
    const item = { ...doctorFeeItem, customPrice: '2000' };
    expect(getItemPrice(item, 'OPD')).toBe(2000);
  });
});

// ─────────────────────────────────────────────
// 🔄 useEstimationCalculator (totalCourse)
// ─────────────────────────────────────────────
describe('useEstimationCalculator hook', () => {
  const pharmaItem = {
    id: 'p1', itemCode: 'DRUG001', Common_name: 'Drug A',
    category: 'pharma', OPD: 100, IPD: 80, OPDTR: 120, IPDTR: 90,
    quantity: 2, dose: '',
  };
  const nurseItem = {
    id: 'n1', itemCode: 'NUR001', Common_name: 'Service A',
    category: 'nurse', OPD: 50, IPD: 40, OPDTR: 60, IPDTR: 50,
    quantity: 1, dose: '',
  };

  it('calculates totalCourse = grandTotal × courseCycles', () => {
    const items = [pharmaItem, nurseItem];
    // grandTotal = (100×2) + (50×1) = 250
    const result = useEstimationCalculator(items, 'OPD', 3);
    expect(result.grandTotal).toBe(250);
    expect(result.totalCourse).toBe(750); // 250 × 3
  });

  it('totalCourse equals grandTotal when courseCycles is 1', () => {
    const items = [pharmaItem];
    const result = useEstimationCalculator(items, 'OPD', 1);
    expect(result.grandTotal).toBe(200);
    expect(result.totalCourse).toBe(200);
  });

  it('totalCourse is 0 for empty items', () => {
    const result = useEstimationCalculator([], 'OPD', 5);
    expect(result.grandTotal).toBe(0);
    expect(result.totalCourse).toBe(0);
  });

  it('provides getPrice function that works correctly', () => {
    const result = useEstimationCalculator([pharmaItem], 'IPD', 1);
    expect(result.getPrice(pharmaItem)).toBe(80);
  });
});
