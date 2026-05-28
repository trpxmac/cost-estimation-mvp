import { describe, it, expect, beforeEach } from 'vitest';
import { getAllItems, saveCustomDrug } from '../data';

// ─────────────────────────────────────────────
// 🧪 data.js — Drug Master (Local Storage)
// ─────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

describe('getAllItems', () => {
  it('returns initial sets even when localStorage is empty', () => {
    const items = getAllItems();
    // Should contain at least the default "ชุดเวชภัณฑ์ให้ยาเคมีบำบัด" set
    expect(items.length).toBeGreaterThanOrEqual(1);
    const chemoSet = items.find(i => i.itemCode === 'phc01');
    expect(chemoSet).toBeDefined();
    expect(chemoSet.isSet).toBe(true);
    expect(chemoSet.items.length).toBe(6);
  });

  it('includes custom items saved to localStorage', () => {
    const customDrug = {
      itemCode: 'CUSTOM-001',
      Common_name: 'Test Drug',
      OPD: 100, IPD: 80, OPDTR: 120, IPDTR: 90,
      category: 'pharma',
    };
    localStorage.setItem('custom_items', JSON.stringify([customDrug]));
    const items = getAllItems();
    const found = items.find(i => i.itemCode === 'CUSTOM-001');
    expect(found).toBeDefined();
    expect(found.Common_name).toBe('Test Drug');
  });
});

describe('saveCustomDrug', () => {
  it('saves a new drug to localStorage', () => {
    const drug = {
      itemCode: 'NEW-001',
      Common_name: 'New Drug A',
      OPD: 50, IPD: 40, OPDTR: 60, IPDTR: 45,
      category: 'pharma',
    };
    saveCustomDrug(drug);
    const stored = JSON.parse(localStorage.getItem('custom_items'));
    expect(stored).toHaveLength(1);
    expect(stored[0].itemCode).toBe('NEW-001');
  });

  it('updates existing drug by itemCode instead of duplicating', () => {
    const drug = {
      itemCode: 'UPD-001',
      Common_name: 'Drug Original',
      OPD: 100,
    };
    saveCustomDrug(drug);
    saveCustomDrug({ ...drug, Common_name: 'Drug Updated', OPD: 200 });
    const stored = JSON.parse(localStorage.getItem('custom_items'));
    expect(stored).toHaveLength(1);
    expect(stored[0].Common_name).toBe('Drug Updated');
    expect(stored[0].OPD).toBe(200);
  });

  it('returns the drug object after saving', () => {
    const drug = { itemCode: 'RET-001', Common_name: 'Return Test' };
    const result = saveCustomDrug(drug);
    expect(result.itemCode).toBe('RET-001');
  });
});
