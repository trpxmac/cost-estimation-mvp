/**
 * Custom hook & utility functions for cost estimation calculations.
 * Extracted from CostEstimator.jsx to separate business logic from UI.
 */

export const fmt = (v) =>
  new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v);

export function getItemPrice(item, billingRight) {
  if (item.customPrice !== undefined && item.customPrice !== null && item.customPrice !== "") {
    return Number(item.customPrice);
  }
  if (item.isSet && item.items) {
    return item.items.reduce((s, i) => s + (i[billingRight] || i["OPD"] || 0), 0);
  }
  return item[billingRight] || item["OPD"] || 0;
}

export function calculateTotals(selectedItems, billingRight) {
  const getPrice = (item) => getItemPrice(item, billingRight);

  const drugItemsOnly = selectedItems.filter(i => (i.category === 'pharma' || !i.category) && !i.isPreparation);
  const nurseItemsOnly = selectedItems.filter(i => i.category === 'nurse' && !i.isPreparation);
  const prepItemsOnly = selectedItems.filter(i => i.isPreparation);

  const drugTotal = drugItemsOnly.reduce((s, i) => s + getPrice(i) * i.quantity, 0);
  const nurseTotal = nurseItemsOnly.reduce((s, i) => s + getPrice(i) * i.quantity, 0);
  const prepTotal = prepItemsOnly.reduce((s, i) => s + getPrice(i) * i.quantity, 0);

  const pharmaTotal = drugTotal;
  const grandTotal = drugTotal + nurseTotal + prepTotal;

  const pharmaItems = selectedItems.filter(i => i.category === "pharma" || !i.category);
  const nurseItems = selectedItems.filter(i => i.category === "nurse");

  return { drugTotal, nurseTotal, prepTotal, pharmaTotal, grandTotal, pharmaItems, nurseItems };
}

export function mergeRoleItems(selectedItems, dbItems, currentRole) {
  if (currentRole === "pharma") {
    const latestNurse = dbItems.filter(i => i.category === "nurse");
    const myPharma = selectedItems.filter(i => i.category === "pharma" || !i.category);
    return [...myPharma, ...latestNurse];
  } else {
    const latestPharma = dbItems.filter(i => i.category === "pharma" || !i.category);
    const myNurse = selectedItems.filter(i => i.category === "nurse");
    return [...latestPharma, ...myNurse];
  }
}

export function determineStatus(items) {
  const hasPharma = items.some(i => i.category === "pharma" || !i.category);
  const hasNurse = items.some(i => i.category === "nurse");
  return (hasPharma && hasNurse) ? "สมบูรณ์" : (hasPharma ? "รอพยาบาล" : "รอเภสัช");
}

export function useEstimationCalculator(selectedItems, billingRight, courseCycles) {
  const getPrice = (item) => getItemPrice(item, billingRight);
  const totals = calculateTotals(selectedItems, billingRight);
  const totalCourse = totals.grandTotal * courseCycles;

  return { getPrice, fmt, ...totals, totalCourse };
}
