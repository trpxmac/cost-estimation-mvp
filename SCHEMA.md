# 📋 Cost Estimation MVP — Database Schema & API Reference

> เอกสารนี้สำหรับทีม iMed/HIS เพื่อใช้ในการเชื่อมต่อระบบ  
> **Base URL**: `http://localhost:5000/api`  
> **Database**: PostgreSQL (Neon)  
> **Content-Type**: `application/json`

---

## 🗄️ Database Tables

### 1. `estimations` — ใบประมาณการค่ารักษา

| Column            | Type         | PK  | Nullable | คำอธิบาย                                           |
|-------------------|--------------|-----|----------|----------------------------------------------------|
| `id`              | VARCHAR(100) | ✅  | NO       | ID ของใบประมาณการ (timestamp-based)                 |
| `saved_at`        | TIMESTAMP    |     | NO       | วัน-เวลาที่บันทึก                                  |
| `hn`              | VARCHAR(50)  |     | YES      | Hospital Number (เลข HN ผู้ป่วย)                    |
| `vnan`            | VARCHAR(50)  |     | YES      | Visit Number / Admission Number                     |
| `patient_name`    | VARCHAR(255) |     | YES      | ชื่อผู้ป่วย                                        |
| `doctor_name`     | VARCHAR(255) |     | YES      | ชื่อแพทย์ผู้สั่ง                                    |
| `diagnosis`       | VARCHAR(255) |     | YES      | การวินิจฉัย (เช่น CA breast, LYMPHOMA)               |
| `assessor`        | VARCHAR(255) |     | YES      | ผู้ประเมิน (เภสัชกร/พยาบาล)                         |
| `bsa`             | NUMERIC      |     | YES      | Body Surface Area (m²)                              |
| `patient_type`    | VARCHAR(50)  |     | YES      | ประเภทผู้ป่วย: `OPD` / `IPD`                        |
| `billing_right`   | VARCHAR(50)  |     | YES      | สิทธิ์การรักษา: `OPD` / `IPD` / `OPDTR` / `IPDTR`   |
| `insurance`       | VARCHAR(100) |     | YES      | สิทธิการรักษา: `Self pay` / `ประกันไทย` / `ประกันต่างชาติ` / `ประกันสังคม` |
| `agreement`       | VARCHAR(50)  |     | YES      | การตกลงรักษา: `agrees` / `declines`                  |
| `appointment_date`| DATE         |     | YES      | วันนัดหมาย                                          |
| `prep_fee_total`  | NUMERIC      |     | YES      | ค่าเตรียมยาเคมีบำบัดรวม                              |
| `course_cycles`   | INTEGER      |     | YES      | จำนวนรอบเคมีบำบัด (default: 1)                       |
| `selected_items`  | JSONB        |     | YES      | **รายการยาและบริการทั้งหมด** (ดู JSON schema ด้านล่าง) |
| `pharma_total`    | NUMERIC      |     | YES      | ยอดรวมส่วนเภสัชกรรม                                  |
| `nurse_total`     | NUMERIC      |     | YES      | ยอดรวมส่วนพยาบาล                                     |
| `grand_total`     | NUMERIC      |     | YES      | ยอดรวมทั้งหมดต่อ cycle                                |
| `total_course`    | NUMERIC      |     | YES      | ยอดรวมทั้งหมด × จำนวน cycles                          |
| `status`          | VARCHAR(50)  |     | YES      | สถานะ: `รอพยาบาล` / `รอเภสัช` / `สมบูรณ์`            |
| `last_updated_by` | VARCHAR(50)  |     | YES      | ผู้แก้ไขล่าสุด: `pharma` / `nurse`                   |

#### `selected_items` JSONB Structure (แต่ละ item ในอาร์เรย์):

```json
{
  "id": "1716864000123.456",
  "itemCode": "DRUG-001",
  "Common_name": "Paracetamol 500mg",
  "category": "pharma",
  "OPD": 10,
  "IPD": 8,
  "OPDTR": 15,
  "IPDTR": 12,
  "quantity": 2,
  "dose": "500mg",
  "drugSubCategory": "chemo",
  "customPrice": null,
  "note": "",
  "setInstanceId": null,
  "parentSetName": null,
  "isPreparation": false
}
```

| Field              | Type    | คำอธิบาย                                                      |
|--------------------|---------|---------------------------------------------------------------|
| `id`               | string  | unique ID ของรายการ (timestamp-based)                          |
| `itemCode`         | string  | รหัสยา/บริการ (ใช้ match กับ iMed item code)                    |
| `Common_name`      | string  | ชื่อยาหรือบริการ                                               |
| `category`         | string  | `"pharma"` (ยา) หรือ `"nurse"` (บริการพยาบาล)                  |
| `OPD/IPD/OPDTR/IPDTR` | number | ราคาตามสิทธิ์ (Thai OPD / Thai IPD / Inter OPD / Inter IPD)  |
| `quantity`         | number  | จำนวน                                                         |
| `dose`             | string  | ขนาดยา (free text)                                            |
| `drugSubCategory`  | string  | ประเภทย่อย: `chemo`/`targeted`/`gcsf`/`home`/`other`           |
| `customPrice`      | number? | ราคาที่ระบุเอง (สำหรับค่าแพทย์ ค่าเวชภัณฑ์ ward ฯลฯ)           |
| `setInstanceId`    | string? | null = รายการเดี่ยว, มีค่า = เป็นส่วนหนึ่งของ Item Set          |
| `parentSetName`    | string? | ชื่อ Set ต้นทาง (เช่น "ชุดเวชภัณฑ์ให้ยาเคมีบำบัด")             |
| `isPreparation`    | boolean | เป็นค่าเตรียมยาหรือไม่                                        |

---

### 2. `custom_drugs` — รายการยาและบริการ (Drug Master)

| Column              | Type         | PK  | Nullable | คำอธิบาย                                     |
|---------------------|--------------|-----|----------|----------------------------------------------|
| `item_code`         | VARCHAR(100) | ✅  | NO       | รหัสยา/บริการ **(ต้อง map กับ iMed)**          |
| `common_name`       | VARCHAR(255) |     | YES      | ชื่อยา/บริการ                                 |
| `opd`               | NUMERIC      |     | YES      | ราคา OPD (Thai)                               |
| `ipd`               | NUMERIC      |     | YES      | ราคา IPD (Thai)                               |
| `opdtr`             | NUMERIC      |     | YES      | ราคา OPD (International/Expat)                |
| `ipdtr`             | NUMERIC      |     | YES      | ราคา IPD (International/Expat)                |
| `category`          | VARCHAR(50)  |     | YES      | `pharma` / `nurse`                            |
| `stock`             | INTEGER      |     | YES      | จำนวนคงเหลือ (null = ไม่ติดตาม)               |
| `is_set`            | BOOLEAN      |     | YES      | เป็น Item Set หรือไม่                          |
| `items`             | JSONB        |     | YES      | รายการย่อยของ Set (ถ้า is_set = true)           |
| `is_preparation`    | BOOLEAN      |     | YES      | เป็นรายการเตรียมยาเคมีบำบัด                    |
| `added_at`          | TIMESTAMP    |     | YES      | วันที่เพิ่ม                                    |
| `is_deleted`        | BOOLEAN      |     | YES      | Soft delete flag (default: false)              |
| `drug_sub_category` | VARCHAR(100) |     | YES      | ประเภทย่อยยา (ไม่ใช้แล้ว — ย้ายไปจัดที่ Estimator) |

#### Pricing Tiers (สิทธิ์การรักษา):
| Tier     | คำอธิบาย                                |
|----------|-----------------------------------------|
| `OPD`    | ผู้ป่วยนอก คนไทย                        |
| `IPD`    | ผู้ป่วยใน คนไทย                          |
| `OPDTR`  | ผู้ป่วยนอก ต่างชาติ (International/Expat) |
| `IPDTR`  | ผู้ป่วยใน ต่างชาติ (International/Expat)   |

---

### 3. `patients` — ข้อมูลผู้ป่วย

| Column        | Type         | PK  | Nullable | คำอธิบาย                                  |
|---------------|--------------|-----|----------|-------------------------------------------|
| `patient_id`  | VARCHAR(50)  | ✅  | NO       | **HN — Hospital Number (ใช้ match กับ iMed)** |
| `name_th`     | VARCHAR(255) |     | YES      | ชื่อภาษาไทย                               |
| `name_en`     | VARCHAR(255) |     | YES      | ชื่อภาษาอังกฤษ                             |
| `phone`       | VARCHAR(50)  |     | YES      | เบอร์โทร                                  |
| `gender`      | VARCHAR(20)  |     | YES      | เพศ                                       |
| `age`         | INTEGER      |     | YES      | อายุ                                      |
| `type`        | VARCHAR(50)  |     | YES      | ประเภท: `OPD` / `IPD`                     |
| `nationality` | VARCHAR(50)  |     | YES      | สัญชาติ: `THAI` / `INTERNATIONAL`          |
| `doctor`      | VARCHAR(255) |     | YES      | แพทย์ประจำ                                 |

---

### 4. `master_data` — ข้อมูลหลัก (แพทย์, โรค, ผู้ประเมิน)

| Column  | Type         | PK  | Nullable | คำอธิบาย                                     |
|---------|--------------|-----|----------|----------------------------------------------|
| `id`    | SERIAL       | ✅  | NO       | Auto-increment ID                             |
| `type`  | VARCHAR(50)  |     | NO       | ชนิด: `doctor` / `diagnosis` / `assessor`     |
| `value` | VARCHAR(255) |     | NO       | ค่า (ชื่อแพทย์ / ชื่อโรค / ชื่อผู้ประเมิน)     |

> UNIQUE constraint: `(type, value)`

---

### 5. `users` — ผู้ใช้งานระบบ

| Column     | Type         | PK  | Nullable | คำอธิบาย                              |
|------------|--------------|-----|----------|---------------------------------------|
| `id`       | VARCHAR(50)  | ✅  | NO       | Username (เช่น admin, pharma, nurse)  |
| `name`     | VARCHAR(255) |     | NO       | ชื่อแสดงผล                            |
| `password` | VARCHAR(255) |     | NO       | รหัสผ่าน (plain text ตอนนี้)           |
| `role`     | VARCHAR(50)  |     | NO       | บทบาท: `admin` / `pharma` / `nurse`   |
| `avatar`   | VARCHAR(10)  |     | YES      | ตัวอักษร avatar                       |

---

## 🔌 API Endpoints

### ผู้ป่วย (Patients) — **จุดเชื่อมต่อหลักกับ iMed**

| Method | Endpoint          | คำอธิบาย                         |
|--------|-------------------|---------------------------------|
| GET    | `/api/patients`   | ดึงรายชื่อผู้ป่วยทั้งหมด          |
| POST   | `/api/patients`   | เพิ่ม/sync ข้อมูลผู้ป่วยจาก iMed  |

**POST `/api/patients`** — Body:
```json
{
  "patient_id": "HN-001234",
  "name_th": "นายสมชาย ใจดี",
  "name_en": "Somchai Jaidee",
  "phone": "0812345678",
  "gender": "M",
  "age": 55,
  "type": "OPD",
  "nationality": "THAI",
  "doctor": "พ.มานพ"
}
```
> ⚠️ `ON CONFLICT (patient_id) DO NOTHING` — ไม่ทับข้อมูลเดิม

---

### ใบประมาณการ (Estimations)

| Method | Endpoint                | คำอธิบาย                    |
|--------|-------------------------|-----------------------------|
| GET    | `/api/estimations`      | ดึงทั้งหมด (เรียงตามวันที่ล่าสุด) |
| GET    | `/api/estimations/:id`  | ดึงตาม ID                    |
| POST   | `/api/estimations`      | สร้างใหม่                     |
| PUT    | `/api/estimations/:id`  | แก้ไข                        |
| DELETE | `/api/estimations/:id`  | ลบ                           |

---

### ยาและเวชภัณฑ์ (Custom Drugs)

| Method | Endpoint                       | คำอธิบาย                     |
|--------|--------------------------------|-----------------------------|
| GET    | `/api/custom-drugs`            | ดึงรายการยาทั้งหมด            |
| POST   | `/api/custom-drugs`            | เพิ่ม/อัปเดตรายการยา          |
| DELETE | `/api/custom-drugs/:itemCode`  | Soft delete (set is_deleted)  |

**POST `/api/custom-drugs`** — Body:
```json
{
  "itemCode": "DRUG-001",
  "Common_name": "Paracetamol 500mg Tab",
  "OPD": 10,
  "IPD": 8,
  "OPDTR": 15,
  "IPDTR": 12,
  "category": "pharma",
  "stock": 100,
  "isSet": false,
  "items": null,
  "isPreparation": false,
  "drugSubCategory": ""
}
```
> ⚠️ `ON CONFLICT (item_code)` จะ UPDATE ราคาและชื่อ

---

### Master Data (แพทย์, โรค, ผู้ประเมิน)

| Method | Endpoint                              | คำอธิบาย               |
|--------|---------------------------------------|------------------------|
| GET    | `/api/master-data/doctor`             | รายชื่อแพทย์            |
| GET    | `/api/master-data/diagnosis`          | รายชื่อโรค              |
| GET    | `/api/master-data/assessor`           | รายชื่อผู้ประเมิน        |
| POST   | `/api/master-data/:type`              | เพิ่มข้อมูล              |
| DELETE | `/api/master-data/:type/:value`       | ลบข้อมูล                |

---

### Auth & Users

| Method | Endpoint           | คำอธิบาย       |
|--------|--------------------|----------------|
| POST   | `/api/login`       | เข้าสู่ระบบ     |
| GET    | `/api/users`       | ดึง user ทั้งหมด |
| POST   | `/api/users`       | สร้าง user      |
| PUT    | `/api/users/:id`   | แก้ไข user      |
| DELETE | `/api/users/:id`   | ลบ user         |

---

## 🔗 จุดเชื่อมต่อที่แนะนำสำหรับ iMed/HIS Integration

### 1. Sync ข้อมูลผู้ป่วย (Patient Sync)
- เมื่อผู้ป่วยลงทะเบียน/เข้ารับบริการใน iMed → POST `/api/patients`
- **Key ที่ใช้ match**: `patient_id` = HN จาก iMed
- ระบบจะดึง patient auto เมื่อเภสัชกรพิมพ์ HN ในหน้า Cost Estimator

### 2. Sync รายการยา (Drug Master Sync)  
- เมื่อมีการอัปเดตราคายาใน iMed → POST `/api/custom-drugs`
- **Key ที่ใช้ match**: `item_code` = รหัสยาจาก iMed
- ราคา 4 ระดับ: `OPD`, `IPD`, `OPDTR`, `IPDTR`

### 3. Sync รายชื่อแพทย์
- POST `/api/master-data/doctor` body: `{ "value": "ชื่อแพทย์" }`

### 4. ดึงใบประมาณการ
- GET `/api/estimations` → ใช้แสดงใน iMed dashboard
- Filter by HN: ตอนนี้ยังไม่มี query param ถ้าต้องการ filter สามารถเพิ่ม endpoint ได้

---

## 📊 ER Diagram

```mermaid
erDiagram
    patients ||--o{ estimations : "HN"
    estimations {
        varchar id PK
        timestamp saved_at
        varchar hn FK
        varchar vnan
        varchar patient_name
        varchar doctor_name
        varchar diagnosis
        varchar patient_type
        varchar billing_right
        varchar insurance
        varchar agreement
        jsonb selected_items
        numeric grand_total
        varchar status
    }
    
    patients {
        varchar patient_id PK
        varchar name_th
        varchar name_en
        varchar type
        varchar nationality
        varchar doctor
    }
    
    custom_drugs {
        varchar item_code PK
        varchar common_name
        numeric opd
        numeric ipd
        numeric opdtr
        numeric ipdtr
        varchar category
        integer stock
        boolean is_set
        jsonb items
    }
    
    master_data {
        serial id PK
        varchar type
        varchar value
    }
    
    users {
        varchar id PK
        varchar name
        varchar role
    }
```

---

## ⚙️ Environment Variables

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
PORT=5000
```

---

> 📌 **หมายเหตุ**: เอกสารนี้สร้างจาก codebase เมื่อ 28 พ.ค. 2569  
> หากมีคำถามหรือต้องการ endpoint เพิ่ม ติดต่อทีม dev ได้เลยครับ
