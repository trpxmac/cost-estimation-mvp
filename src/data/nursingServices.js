/**
 * Standard Nursing Service items — merged into the medication search pool.
 *
 * Pricing keys match billingRight: OPD | IPD | OPDTR | IPDTR
 *
 * Source: Bangkok Hospital Siriroj price list (from photo)
 *   Ward 1 วัน (IPD) columns: Thai | Expat | Inter
 *   OPD 4-6 hrs   columns: Thai | Expat | Inter
 *
 * Mapping to 4 tiers:
 *   OPD   = Thai   OPD  (4-6 hrs, Thai column)
 *   IPD   = Thai   IPD  (Ward 1 day, Thai column)   — use MAX if range
 *   OPDTR = Foreign OPD (4-6 hrs, max of Expat/Inter)
 *   IPDTR = Foreign IPD (Ward 1 day, max of Expat/Inter) — use MAX if range
 */

export const ALL_NURSING_SERVICES = [
  // -------------------------
  // ห้องและที่พัก
  // -------------------------
  {
    itemCode: 'NRS-ROOM',
    Common_name: 'Room / Observe Room (ค่าห้อง / ค่าห้องสังเกตอาการเคมีบำบัด)',
    category: 'nurse',
    OPD: 1000,    // Thai OPD
    IPD: 1500,    // Thai IPD
    OPDTR: 2000,  // Inter OPD (max of Expat 1000, Inter 2000)
    IPDTR: 3000,  // Inter IPD (max of Expat 1500, Inter 3000)
  },
  {
    itemCode: 'NRS-FOOD',
    Common_name: 'Food (ค่าอาหาร)',
    category: 'nurse',
    OPD: 0,       // OPD ไม่มีค่าอาหาร
    IPD: 800,     // Thai IPD
    OPDTR: 0,     // OPD ไม่มีค่าอาหาร
    IPDTR: 1500,  // Inter IPD (max of Expat 800, Inter 1500)
  },

  // -------------------------
  // ค่าบริการพยาบาลและโรงพยาบาล
  // -------------------------
  {
    itemCode: 'NRS-NURSING',
    Common_name: 'Nursing Fee (ค่าบริการพยาบาลเคมีบำบัด)',
    category: 'nurse',
    OPD: 100,     // Thai OPD
    IPD: 1800,    // Thai IPD
    OPDTR: 150,   // Inter OPD (max of Expat 100, Inter 150)
    IPDTR: 3700,  // Inter IPD (max of Expat 1800, Inter 3700)
  },
  {
    itemCode: 'NRS-HOSPITAL',
    Common_name: 'Hospital Fee (ค่าบริการ รพ.)',
    category: 'nurse',
    OPD: 200,     // Thai OPD
    IPD: 1400,    // Thai IPD
    OPDTR: 250,   // Inter OPD (max of Expat 200, Inter 250)
    IPDTR: 3300,  // Inter IPD (max of Expat 1400, Inter 3300)
  },

  // -------------------------
  // ค่าเวชภัณฑ์และตรวจวินิจฉัย
  // -------------------------
  {
    // Range item — ใช้ค่า MAX แยกตาม tier:
    //   Thai IPD:    7,000–10,000  → max = 10,000
    //   Inter IPD:   15,000–20,000 → max = 20,000
    //   Thai OPD:    5,000 (ไม่มี range)
    //   Inter OPD:   max(Expat 5,000, Inter 7,000) = 7,000
    itemCode: 'NRS-SUPPLY',
    Common_name: 'Medical Supply (ค่าเวชภัณฑ์ ward)',
    category: 'nurse',
    OPD: 5000,    // Thai OPD
    IPD: 10000,   // Thai IPD max (7,000–10,000)
    OPDTR: 7000,  // Inter OPD max (Expat 5,000 / Inter 7,000)
    IPDTR: 20000, // Inter IPD max (Expat 10,000 / Inter 20,000)
  },
  {
    // Range item — ใช้ค่า MAX แยกตาม tier:
    //   Thai IPD:    3,000–4,000  → max = 4,000
    //   Inter IPD:   max(Expat 4,000, Inter 5,000) = 5,000
    //   Thai OPD:    3,000
    //   Inter OPD:   max(Expat 3,000, Inter 4,000) = 4,000
    itemCode: 'NRS-LAB',
    Common_name: 'Laboratory (ค่าตรวจวินิจฉัย Lab+X-ray)',
    category: 'nurse',
    OPD: 3000,    // Thai OPD
    IPD: 4000,    // Thai IPD max (3,000–4,000)
    OPDTR: 4000,  // Inter OPD max (Expat 3,000 / Inter 4,000)
    IPDTR: 5000,  // Inter IPD max (Expat 4,000 / Inter 5,000)
  },

  // -------------------------
  // ค่าเตรียมยาเคมีบำบัด
  // -------------------------
  {
    itemCode: 'NRS-PREP',
    Common_name: 'Chemotherapy Preparation Fee (ค่าบริการเตรียมยาเคมีบำบัด)',
    category: 'nurse',
    isPreparation: true,
    OPD: 1500,    // Thai OPD (700 + 800)
    IPD: 1700,    // Thai IPD (900 + 800)
    OPDTR: 1630,  // Inter OPD (750 + 880)
    IPDTR: 1980,  // Inter IPD (1100 + 880)
  },

  // -------------------------
  // ค่าแพทย์
  // -------------------------
  {
    // Ward 1 day: Thai 2,400 / Expat 3,000 / Inter 4,000
    // OPD 4-6 hrs: Thai 1,000 / Expat 1,500 / Inter 1,500
    itemCode: 'NRS-DOCTOR',
    Common_name: 'Doctor Fee (ค่าแพทย์ admit+visit)',
    category: 'nurse',
    OPD: 1000,    // Thai OPD
    IPD: 2400,    // Thai IPD
    OPDTR: 2000,  // Inter OPD
    IPDTR: 4000,  // Inter IPD
  },
  {
    // Ward 1 day: Thai 5,000 / Expat 10,000 / Inter 15,000
    // OPD 4-6 hrs: Thai 5,000 / Expat 5,000 / Inter 10,000
    itemCode: 'NRS-ONCO',
    Common_name: 'Oncologist Fee (ค่าแพทย์เฉพาะทางเคมีบำบัด)',
    category: 'nurse',
    OPD: 5000,    // Thai OPD
    IPD: 5000,    // Thai IPD
    OPDTR: 15000, // Inter OPD
    IPDTR: 15000, // Inter IPD
  },
];
