import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Layout from './components/Layout';
import Login from './pages/Login';

import CostEstimator from './pages/CostEstimator';
import PatientRecords from './pages/PatientRecords';
import AddNewItem from './pages/AddNewItem';
import Dashboard from './pages/Dashboard';
import DrugPrices from './pages/DrugPrices';
import Settings from './pages/Settings';
import { ToastProvider } from './components/Toast';

// ✅ Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuth = localStorage.getItem('isAuthenticated') === 'true';
  if (!isAuth) return <Navigate to="/login" replace />;
  
  if (allowedRoles) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/estimator" replace />;
    }
  }

  return children;
};

// ✅ Index Redirect Component
const IndexRedirect = () => {
  return <Navigate to="/dashboard" replace />;
};

// ✅ Public Route (Redirect if already logged in)
const PublicRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isAuthenticated') === 'true';
  if (isAuth) return <IndexRedirect />;
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
            <Route index element={<IndexRedirect />} />
            <Route path="dashboard" element={<ProtectedRoute allowedRoles={['admin', 'pharma', 'nurse']}><Dashboard /></ProtectedRoute>} />
            <Route path="patients" element={<PatientRecords />} />
            <Route path="estimator" element={<CostEstimator />} />
            <Route path="settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
            <Route path="drug-prices" element={<ProtectedRoute allowedRoles={['admin', 'pharma', 'nurse']}><DrugPrices /></ProtectedRoute>} />
            <Route path="add-item" element={<ProtectedRoute allowedRoles={['admin', 'pharma', 'nurse']}><AddNewItem /></ProtectedRoute>} />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<IndexRedirect />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;