import { describe, it, expect } from 'vitest';

// ─────────────────────────────────────────────
// 🧪 Isolated Cart Merge Logic
// ─────────────────────────────────────────────
// This file tests the cart "add item" logic in isolation,
// mirroring exactly what handleAddItem does in CostEstimator.jsx

/** Simulates handleAddItem for individual items */
function addItemToCart(cart, item) {
  const existingIndex = cart.findIndex(
    (i) => i.itemCode === item.itemCode && !i.setInstanceId
  );
  if (existingIndex >= 0) {
    const updated = [...cart];
    updated[existingIndex] = {
      ...updated[existingIndex],
      quantity: updated[existingIndex].quantity + 1,
    };
    return updated;
  }
  return [...cart, { ...item, id: 'mock-id', quantity: 1, dose: '' }];
}

/** Simulates handleAddItem for Item Sets */
function addSetToCart(cart, setItem) {
  const existingGid = cart.find(
    (i) => i.setInstanceId && i.parentSetName === setItem.Common_name
  )?.setInstanceId;

  if (existingGid) {
    return cart.map((i) =>
      i.setInstanceId === existingGid ? { ...i, quantity: i.quantity + 1 } : i
    );
  }

  const instanceId = 'test-gid-001';
  const exploded = setItem.items.map((subItem) => ({
    ...subItem,
    id: `${instanceId}-${subItem.itemCode}`,
    quantity: subItem.quantity || 1,
    dose: '',
    setInstanceId: instanceId,
    parentSetName: setItem.Common_name,
  }));
  return [...cart, ...exploded];
}

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────
const paracetamol = {
  itemCode: 'DRUG001',
  Common_name: 'Paracetamol 500mg',
  category: 'pharma',
  OPD: 10, IPD: 8, OPDTR: 15, IPDTR: 12,
};

const carboplatin = {
  itemCode: 'DRUG002',
  Common_name: 'Carboplatin 450mg INJ',
  category: 'pharma',
  OPD: 3500, IPD: 3200, OPDTR: 4500, IPDTR: 4000,
};

const chemoSetA = {
  itemCode: 'SET001',
  Common_name: 'Chemo Set A',
  isSet: true,
  items: [
    { ...paracetamol, quantity: 2 },
    { ...carboplatin, quantity: 1 },
  ],
};

// ─────────────────────────────────────────────
// ✅ Individual Item Merge Tests
// ─────────────────────────────────────────────
describe('Cart: Adding individual items', () => {
  it('adds a new item to an empty cart', () => {
    const cart = addItemToCart([], paracetamol);
    expect(cart).toHaveLength(1);
    expect(cart[0].itemCode).toBe('DRUG001');
    expect(cart[0].quantity).toBe(1);
  });

  it('MERGE: increments qty instead of creating a duplicate when same item is added twice', () => {
    let cart = addItemToCart([], paracetamol);
    cart = addItemToCart(cart, paracetamol);
    // ✅ Must be 1 row, qty = 2 (not 2 rows)
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  it('MERGE: qty increments correctly on 5th press of the same drug', () => {
    let cart = [];
    for (let i = 0; i < 5; i++) cart = addItemToCart(cart, paracetamol);
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(5);
  });

  it('treats different drugs as separate items', () => {
    let cart = addItemToCart([], paracetamol);
    cart = addItemToCart(cart, carboplatin);
    expect(cart).toHaveLength(2);
  });

  it('initializes dose as empty string', () => {
    const cart = addItemToCart([], paracetamol);
    expect(cart[0].dose).toBe('');
  });
});

// ─────────────────────────────────────────────
// ✅ Item Set Merge Tests
// ─────────────────────────────────────────────
describe('Cart: Adding Item Sets', () => {
  it('explodes a set into multiple sub-item rows', () => {
    const cart = addSetToCart([], chemoSetA);
    // 2 sub-items in chemoSetA
    expect(cart).toHaveLength(2);
    expect(cart.every(i => i.setInstanceId === 'test-gid-001')).toBe(true);
    expect(cart.every(i => i.parentSetName === 'Chemo Set A')).toBe(true);
  });

  it('MERGE: increments ALL sub-item quantities when the same set is added again', () => {
    let cart = addSetToCart([], chemoSetA);
    cart = addSetToCart(cart, chemoSetA); // add same set again
    // Still 2 rows (not 4)
    expect(cart).toHaveLength(2);
    // Each sub-item quantity should be incremented by 1
    cart.forEach(item => {
      const originalQty = chemoSetA.items.find(s => s.itemCode === item.itemCode)?.quantity || 1;
      expect(item.quantity).toBe(originalQty + 1);
    });
  });

  it('keeps sub-item original quantities from the set definition', () => {
    const cart = addSetToCart([], chemoSetA);
    const para = cart.find(i => i.itemCode === 'DRUG001');
    const carbo = cart.find(i => i.itemCode === 'DRUG002');
    expect(para.quantity).toBe(2); // as defined in chemoSetA.items
    expect(carbo.quantity).toBe(1);
  });
});

// ─────────────────────────────────────────────
// ✅ Remove Item Tests
// ─────────────────────────────────────────────
describe('Cart: Removing items', () => {
  it('removes the correct individual item', () => {
    let cart = addItemToCart([], paracetamol);
    cart = addItemToCart(cart, carboplatin);
    // Remove paracetamol (id='mock-id' — only 1 unique in this test)
    const withoutPara = cart.filter(i => i.itemCode !== 'DRUG001');
    expect(withoutPara).toHaveLength(1);
    expect(withoutPara[0].itemCode).toBe('DRUG002');
  });

  it('removes ALL sub-items of a set when group is removed', () => {
    let cart = addSetToCart([], chemoSetA);
    expect(cart).toHaveLength(2);
    const cleared = cart.filter(i => i.setInstanceId !== 'test-gid-001');
    expect(cleared).toHaveLength(0);
  });

  it('cart becomes empty after removing all items', () => {
    let cart = addItemToCart([], paracetamol);
    cart = cart.filter(i => i.itemCode !== 'DRUG001');
    expect(cart).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────
// ✅ Quantity Update Tests
// ─────────────────────────────────────────────
describe('Cart: Updating quantity', () => {
  it('increments quantity by 1', () => {
    let cart = addItemToCart([], paracetamol);
    cart = cart.map(i => i.id === 'mock-id' ? { ...i, quantity: i.quantity + 1 } : i);
    expect(cart[0].quantity).toBe(2);
  });

  it('does not go below 1 when decrementing', () => {
    let cart = addItemToCart([], paracetamol);
    // Try to decrement below 1
    cart = cart.map(i => i.id === 'mock-id' ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i);
    expect(cart[0].quantity).toBe(1);
  });
});
