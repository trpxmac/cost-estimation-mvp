import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { Pool } = pg;

// Establish database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection and initialize tables on startup
async function initDatabase() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Neon PostgreSQL successfully!');
    
    // Create tables if they do not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS estimations (
        id VARCHAR(100) PRIMARY KEY,
        saved_at TIMESTAMP NOT NULL,
        hn VARCHAR(50),
        vnan VARCHAR(50),
        patient_name VARCHAR(255),
        doctor_name VARCHAR(255),
        diagnosis VARCHAR(255),
        assessor VARCHAR(255),
        bsa NUMERIC,
        patient_type VARCHAR(50),
        billing_right VARCHAR(50),
        insurance VARCHAR(100),
        agreement VARCHAR(50),
        appointment_date DATE,
        prep_fee_total NUMERIC,
        course_cycles INTEGER,
        selected_items JSONB,
        pharma_total NUMERIC,
        nurse_total NUMERIC,
        grand_total NUMERIC,
        total_course NUMERIC,
        status VARCHAR(50),
        last_updated_by VARCHAR(50)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS custom_drugs (
        item_code VARCHAR(100) PRIMARY KEY,
        common_name VARCHAR(255),
        opd NUMERIC,
        ipd NUMERIC,
        opdtr NUMERIC,
        ipdtr NUMERIC,
        category VARCHAR(50),
        stock INTEGER,
        is_set BOOLEAN,
        items JSONB,
        is_preparation BOOLEAN,
        added_at TIMESTAMP,
        is_deleted BOOLEAN DEFAULT FALSE,
        drug_sub_category VARCHAR(100)
      );
    `);

    // Add columns if they do not exist (migration)
    await client.query(`
      ALTER TABLE custom_drugs ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
    `);
    await client.query(`
      ALTER TABLE custom_drugs ADD COLUMN IF NOT EXISTS drug_sub_category VARCHAR(100);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS master_data (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        value VARCHAR(255) NOT NULL,
        UNIQUE(type, value)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        patient_id VARCHAR(50) PRIMARY KEY,
        name_th VARCHAR(255),
        name_en VARCHAR(255),
        phone VARCHAR(50),
        gender VARCHAR(20),
        age INTEGER,
        type VARCHAR(50),
        nationality VARCHAR(50),
        doctor VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        avatar VARCHAR(10)
      );
    `);

    // Insert default doctors, diagnoses, and assessors if empty
    const docCheck = await client.query("SELECT COUNT(*) FROM master_data WHERE type = 'doctor'");
    if (parseInt(docCheck.rows[0].count) === 0) {
      console.log('Populating initial master data...');
      const defaultDocs = ['พ.มานพ', 'พ.ธรรม์', 'พ.วฤทธิ์', 'Dr suwit'];
      for (const doc of defaultDocs) {
        await client.query("INSERT INTO master_data (type, value) VALUES ('doctor', $1) ON CONFLICT DO NOTHING", [doc]);
      }
      
      const defaultDiags = [
        'CA breast', 'CA cervix', 'CA ovary', 'CA prostate', 'CA tonsil',
        'CA rectum', 'CA colon', 'CA tounge', 'CA bladder', 'CA larynx',
        'CA glottis', 'CA lung', 'LYMPHOMA', 'Sarcoma', 'CA Anal'
      ];
      for (const diag of defaultDiags) {
        await client.query("INSERT INTO master_data (type, value) VALUES ('diagnosis', $1) ON CONFLICT DO NOTHING", [diag]);
      }

      const defaultAssessors = ['ชญานิษฐ์', 'กฤษณะพล', 'ภัทรพร', 'สุพิชญา', 'Dr suwit'];
      for (const ass of defaultAssessors) {
        await client.query("INSERT INTO master_data (type, value) VALUES ('assessor', $1) ON CONFLICT DO NOTHING", [ass]);
      }
    }

    const userCheck = await client.query("SELECT COUNT(*) FROM users");
    if (parseInt(userCheck.rows[0].count) === 0) {
      console.log('Populating initial users...');
      const defaultUsers = [
        { id: 'admin', name: 'Admin User', password: 'password', role: 'admin', avatar: 'A' },
        { id: 'pharma', name: 'เภสัชกร (Pharmacist)', password: 'password', role: 'pharma', avatar: 'P' },
        { id: 'nurse', name: 'พยาบาล (Nurse)', password: 'password', role: 'nurse', avatar: 'N' }
      ];
      for (const u of defaultUsers) {
        await client.query("INSERT INTO users (id, name, password, role, avatar) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING", [u.id, u.name, u.password, u.role, u.avatar]);
      }
    }

    client.release();
    console.log('✅ Database schemas initialized successfully!');
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
  }
}

// ------------------- API Endpoints -------------------

// Estimations APIs
app.get('/api/estimations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estimations ORDER BY saved_at DESC');
    // Map db snake_case keys back to camelCase for the frontend React components
    const mapped = result.rows.map(r => ({
      id: r.id,
      savedAt: r.saved_at.toISOString(),
      hn: r.hn,
      vnan: r.vnan,
      patientName: r.patient_name,
      doctorName: r.doctor_name,
      diagnosis: r.diagnosis,
      assessor: r.assessor,
      bsa: r.bsa ? parseFloat(r.bsa) : null,
      patientType: r.patient_type,
      billingRight: r.billing_right,
      insurance: r.insurance,
      agreement: r.agreement,
      appointmentDate: r.appointment_date ? r.appointment_date.toISOString().split('T')[0] : null,
      prepFeeTotal: parseFloat(r.prep_fee_total || 0),
      courseCycles: r.course_cycles,
      selectedItems: r.selected_items,
      pharmaTotal: parseFloat(r.pharma_total || 0),
      nurseTotal: parseFloat(r.nurse_total || 0),
      grandTotal: parseFloat(r.grand_total || 0),
      totalCourse: parseFloat(r.total_course || 0),
      status: r.status,
      lastUpdatedBy: r.last_updated_by
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/estimations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM estimations WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Estimation not found' });
    const r = result.rows[0];
    const mapped = {
      id: r.id,
      savedAt: r.saved_at.toISOString(),
      hn: r.hn,
      vnan: r.vnan,
      patientName: r.patient_name,
      doctorName: r.doctor_name,
      diagnosis: r.diagnosis,
      assessor: r.assessor,
      bsa: r.bsa ? parseFloat(r.bsa) : null,
      patientType: r.patient_type,
      billingRight: r.billing_right,
      insurance: r.insurance,
      agreement: r.agreement,
      appointmentDate: r.appointment_date ? r.appointment_date.toISOString().split('T')[0] : null,
      prepFeeTotal: parseFloat(r.prep_fee_total || 0),
      courseCycles: r.course_cycles,
      selectedItems: r.selected_items,
      pharmaTotal: parseFloat(r.pharma_total || 0),
      nurseTotal: parseFloat(r.nurse_total || 0),
      grandTotal: parseFloat(r.grand_total || 0),
      totalCourse: parseFloat(r.total_course || 0),
      status: r.status,
      lastUpdatedBy: r.last_updated_by
    };
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/estimations', async (req, res) => {
  try {
    const r = req.body;
    await pool.query(`
      INSERT INTO estimations (
        id, saved_at, hn, vnan, patient_name, doctor_name, diagnosis, assessor, bsa,
        patient_type, billing_right, insurance, agreement, appointment_date,
        prep_fee_total, course_cycles, selected_items, pharma_total, nurse_total,
        grand_total, total_course, status, last_updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
    `, [
      r.id, r.savedAt || new Date().toISOString(), r.hn, r.vnan, r.patientName, r.doctorName, r.diagnosis, r.assessor, r.bsa || null,
      r.patientType, r.billingRight, r.insurance, r.agreement, r.appointmentDate || null,
      r.prepFeeTotal || 0, r.courseCycles || 1, JSON.stringify(r.selectedItems || []), r.pharmaTotal || 0, r.nurseTotal || 0,
      r.grandTotal || 0, r.totalCourse || 0, r.status, r.lastUpdatedBy
    ]);
    res.status(201).json(r);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/estimations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const r = req.body;
    await pool.query(`
      UPDATE estimations SET
        hn = $1, vnan = $2, patient_name = $3, doctor_name = $4, diagnosis = $5, assessor = $6, bsa = $7,
        patient_type = $8, billing_right = $9, insurance = $10, agreement = $11, appointment_date = $12,
        prep_fee_total = $13, course_cycles = $14, selected_items = $15, pharma_total = $16, nurse_total = $17,
        grand_total = $18, total_course = $19, status = $20, last_updated_by = $21,
        saved_at = $22
      WHERE id = $23
    `, [
      r.hn, r.vnan, r.patientName, r.doctorName, r.diagnosis, r.assessor, r.bsa || null,
      r.patientType, r.billingRight, r.insurance, r.agreement, r.appointmentDate || null,
      r.prepFeeTotal || 0, r.courseCycles || 1, JSON.stringify(r.selectedItems || []), r.pharmaTotal || 0, r.nurseTotal || 0,
      r.grandTotal || 0, r.totalCourse || 0, r.status, r.lastUpdatedBy,
      new Date().toISOString(), id
    ]);
    res.json(r);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/estimations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM estimations WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Custom Drugs APIs
app.get('/api/custom-drugs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM custom_drugs ORDER BY added_at DESC');
    const mapped = result.rows.map(r => ({
      itemCode: r.item_code,
      Common_name: r.common_name,
      OPD: parseFloat(r.opd || 0),
      IPD: parseFloat(r.ipd || 0),
      OPDTR: parseFloat(r.opdtr || 0),
      IPDTR: parseFloat(r.ipdtr || 0),
      category: r.category,
      stock: r.stock,
      isSet: r.is_set,
      items: r.items,
      isPreparation: r.is_preparation,
      isDeleted: r.is_deleted,
      addedAt: r.added_at ? r.added_at.toISOString() : null,
      drugSubCategory: r.drug_sub_category
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/custom-drugs', async (req, res) => {
  try {
    const r = req.body;
    await pool.query(`
      INSERT INTO custom_drugs (
        item_code, common_name, opd, ipd, opdtr, ipdtr,
        category, stock, is_set, items, is_preparation, added_at, drug_sub_category
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (item_code) DO UPDATE SET
        common_name = EXCLUDED.common_name, opd = EXCLUDED.opd, ipd = EXCLUDED.ipd, opdtr = EXCLUDED.opdtr, ipdtr = EXCLUDED.ipdtr,
        stock = EXCLUDED.stock, items = EXCLUDED.items, drug_sub_category = EXCLUDED.drug_sub_category
    `, [
      r.itemCode, r.Common_name, r.OPD || 0, r.IPD || 0, r.OPDTR || 0, r.IPDTR || 0,
      r.category, r.stock !== undefined ? r.stock : 50, r.isSet || false, JSON.stringify(r.items || null), r.isPreparation || false, r.addedAt || new Date().toISOString(),
      r.drugSubCategory || ''
    ]);
    res.json(r);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/custom-drugs/:itemCode', async (req, res) => {
  try {
    const { itemCode } = req.params;
    await pool.query(`
      INSERT INTO custom_drugs (item_code, is_deleted, added_at)
      VALUES ($1, true, $2)
      ON CONFLICT (item_code) DO UPDATE SET is_deleted = true
    `, [itemCode, new Date().toISOString()]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Master Data APIs
app.get('/api/master-data/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const result = await pool.query('SELECT value FROM master_data WHERE type = $1 ORDER BY id ASC', [type]);
    res.json(result.rows.map(r => r.value));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/master-data/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { value } = req.body;
    await pool.query('INSERT INTO master_data (type, value) VALUES ($1, $2) ON CONFLICT DO NOTHING', [type, value]);
    res.json({ type, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/master-data/:type/:value', async (req, res) => {
  try {
    const { type, value } = req.params;
    await pool.query('DELETE FROM master_data WHERE type = $1 AND value = $2', [type, value]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Patients APIs
app.get('/api/patients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const p = req.body;
    await pool.query(`
      INSERT INTO patients (patient_id, name_th, name_en, phone, gender, age, type, nationality, doctor)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (patient_id) DO NOTHING
    `, [p.patient_id, p.name_th, p.name_en, p.phone, p.gender, p.age, p.type, p.nationality, p.doctor]);
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Users & Auth APIs
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT id, name, role, avatar FROM users WHERE id = $1 AND password = $2', [username, password]);
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, role, avatar FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { id, name, password, role, avatar } = req.body;
    await pool.query(
      'INSERT INTO users (id, name, password, role, avatar) VALUES ($1, $2, $3, $4, $5)',
      [id, name, password || 'password', role, avatar || id.charAt(0).toUpperCase()]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, password, avatar } = req.body;
    if (password) {
      await pool.query('UPDATE users SET name=$1, role=$2, password=$3, avatar=$4 WHERE id=$5', [name, role, password, avatar, id]);
    } else {
      await pool.query('UPDATE users SET name=$1, role=$2, avatar=$3 WHERE id=$4', [name, role, avatar, id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start listening
app.listen(PORT, () => {
  console.log(`🚀 Express server running on port ${PORT}`);
  initDatabase();
});
