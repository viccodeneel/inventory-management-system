import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Authentication/Login';
import ForgotPassword from './components/Authentication/forget';
import Register from './components/Authentication/register';

import Dashboard from './components/Pages/Dashboard';
import Inventory from './components/Pages/Inventory';
import Users from './components/Pages/Users';
import Check from './components/Pages/Check';
import Reports from './components/Pages/Reports';
import Maintenance from './components/Pages/Main';
import Settings from './components/Pages/Settings';
import Requests from './components/Pages/requests';
import EquipmentRequests from './components/Pages/equipment_requests';

import Userdash from './components/Ppages/Userdash';
import MyRequest from './components/Ppages/MyRequest';
import Equipments from './components/Ppages/Equipments';
import Updates from './components/Ppages/Updates';
import Psettings from './components/Ppages/Psettings';
import Help from './components/Ppages/help';

// Import CSS files
import './App.css';

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/equipment_requests" element={<EquipmentRequests />} />
        <Route path="/forget-password" element={<ForgotPassword />} /> {/* Add route for forgot password */}
       <Route path="/register" element={<Register />} /> 
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/users" element={<Users />} />
        <Route path="/check" element={<Check />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/main" element={<Maintenance />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/userdash" element={<Userdash />} />
        <Route path="/myrequest" element={<MyRequest />} />
        <Route path="/equipments" element={<Equipments />} />
        <Route path="/updates" element={<Updates />} />
        <Route path="/psettings" element={<Psettings />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </Router>
  );
};

export default App;