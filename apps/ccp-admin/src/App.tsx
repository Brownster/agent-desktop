import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Customers from '@/pages/Customers';
import CustomerDetail from '@/pages/CustomerDetail';
import Modules from '@/pages/Modules';
import Branding from '@/pages/Branding';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';

/**
 * Main Application Component
 * 
 * Handles routing and layout for the Configuration Admin Dashboard
 */
function App(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Main layout with sidebar */}
        <Route path="/" element={<Layout />}>
          {/* Redirect root to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Customer management */}
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:customerId" element={<CustomerDetail />} />
          
          {/* Module management */}
          <Route path="modules" element={<Modules />} />
          
          {/* Branding management */}
          <Route path="branding" element={<Branding />} />
          
          {/* Settings */}
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;