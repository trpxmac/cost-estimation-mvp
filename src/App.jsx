import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Layout from './components/Layout';
import Login from './pages/Login';

import CostEstimator from './pages/CostEstimator';
import PatientRecords from './pages/PatientRecords';
import AddNewItem from './pages/AddNewItem';
import Dashboard from './pages/Dashboard';
import DrugPrices from './pages/DrugPrices';
import { ToastProvider } from './components/Toast';

// ✅ Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isAuthenticated') === 'true';
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
};

// ✅ Public Route (Redirect if already logged in)
const PublicRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isAuthenticated') === 'true';
  if (isAuth) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

          {/* Protected Routes inside Layout */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="patients" element={<PatientRecords />} />
            <Route path="estimator" element={<CostEstimator />} />
            <Route path="drug-prices" element={<DrugPrices />} />
            <Route path="add-item" element={<AddNewItem />} />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;