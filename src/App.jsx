import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';

import CostEstimator from './pages/CostEstimator';
import PatientRecords from './pages/PatientRecords';
import AddNewItem from './pages/AddNewItem';
import Dashboard from './pages/Dashboard';
import DrugPrices from './pages/DrugPrices';
import { ToastProvider } from './components/Toast';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* ✅ ใช้ Layout เป็น Route หลักที่คอยครอบหน้าย่อยทั้งหมด */}
          <Route path="/" element={<Layout />}>
            {/* เมื่อเข้ามาหน้าแรก ให้ Redirect ไปที่ Dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* หน้าต่าง ๆ จะถูกนำไปแสดงตรง <Outlet /> ในไฟล์ Layout */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="patients" element={<PatientRecords />} />
            <Route path="estimator" element={<CostEstimator />} />
            <Route path="drug-prices" element={<DrugPrices />} />
            <Route path="add-item" element={<AddNewItem />} />
          </Route>
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;