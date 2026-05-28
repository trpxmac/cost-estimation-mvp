import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredDoctors, getStoredDiagnoses, getStoredAssessors,
  addDoctor, addDiagnosis, addAssessor,
  removeDoctor, removeDiagnosis, removeAssessor,
} from '../masterData';

// ─────────────────────────────────────────────
// 🧪 masterData.js — Master Data (Local Storage)
// ─────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

// ─────────────────────────────────────────────
// 📖 Read (getStored*)
// ─────────────────────────────────────────────
describe('getStoredDoctors', () => {
  it('returns default doctors when localStorage is empty', () => {
    const docs = getStoredDoctors();
    expect(docs).toContain('พ.มานพ');
    expect(docs).toContain('พ.ธรรม์');
    expect(docs).toContain('พ.วฤทธิ์');
    expect(docs).toContain('Dr suwit');
    expect(docs).toHaveLength(4);
  });

  it('includes custom doctors from localStorage', () => {
    localStorage.setItem('master_doctors', JSON.stringify(['Dr.Test']));
    const docs = getStoredDoctors();
    expect(docs).toContain('Dr.Test');
    expect(docs.length).toBe(5); // 4 defaults + 1 custom
  });

  it('excludes deleted default doctors', () => {
    localStorage.setItem('deleted_doctors', JSON.stringify(['พ.มานพ']));
    const docs = getStoredDoctors();
    expect(docs).not.toContain('พ.มานพ');
    expect(docs).toHaveLength(3);
  });
});

describe('getStoredDiagnoses', () => {
  it('returns 15 default diagnoses when localStorage is empty', () => {
    const diags = getStoredDiagnoses();
    expect(diags).toHaveLength(15);
    expect(diags).toContain('CA breast');
    expect(diags).toContain('LYMPHOMA');
  });
});

describe('getStoredAssessors', () => {
  it('returns 5 default assessors when localStorage is empty', () => {
    const assessors = getStoredAssessors();
    expect(assessors).toHaveLength(5);
    expect(assessors).toContain('ชญานิษฐ์');
  });
});

// ─────────────────────────────────────────────
// ✏️ Add
// ─────────────────────────────────────────────
describe('addDoctor', () => {
  it('adds a new doctor and persists to localStorage', () => {
    addDoctor('Dr.NewDoc');
    const docs = getStoredDoctors();
    expect(docs).toContain('Dr.NewDoc');
  });

  it('returns the name that was added', () => {
    const result = addDoctor('Dr.Return');
    expect(result).toBe('Dr.Return');
  });
});

describe('addDiagnosis', () => {
  it('adds a new diagnosis and persists to localStorage', () => {
    addDiagnosis('CA new');
    const diags = getStoredDiagnoses();
    expect(diags).toContain('CA new');
  });
});

describe('addAssessor', () => {
  it('adds a new assessor and persists to localStorage', () => {
    addAssessor('NewAssessor');
    const assessors = getStoredAssessors();
    expect(assessors).toContain('NewAssessor');
  });
});

// ─────────────────────────────────────────────
// 🗑️ Remove
// ─────────────────────────────────────────────
describe('removeDoctor', () => {
  it('removes a default doctor by adding to deleted list', () => {
    removeDoctor('พ.มานพ');
    const docs = getStoredDoctors();
    expect(docs).not.toContain('พ.มานพ');
    const deleted = JSON.parse(localStorage.getItem('deleted_doctors'));
    expect(deleted).toContain('พ.มานพ');
  });

  it('removes a custom doctor from the custom list', () => {
    addDoctor('Dr.Custom');
    expect(getStoredDoctors()).toContain('Dr.Custom');
    removeDoctor('Dr.Custom');
    expect(getStoredDoctors()).not.toContain('Dr.Custom');
  });

  it('does not add non-default doctors to the deleted list', () => {
    addDoctor('Dr.Temp');
    removeDoctor('Dr.Temp');
    const deleted = JSON.parse(localStorage.getItem('deleted_doctors') || '[]');
    expect(deleted).not.toContain('Dr.Temp');
  });
});

describe('removeDiagnosis', () => {
  it('removes a default diagnosis', () => {
    removeDiagnosis('CA breast');
    expect(getStoredDiagnoses()).not.toContain('CA breast');
  });
});

describe('removeAssessor', () => {
  it('removes a default assessor', () => {
    removeAssessor('ชญานิษฐ์');
    expect(getStoredAssessors()).not.toContain('ชญานิษฐ์');
  });
});
