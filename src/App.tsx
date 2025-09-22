import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard';
import Inventory from './Pages/Inventory';
import Users from './Pages/Users';
import Check from './Pages/Check';
import Reports from './Pages/Reports';
import Maintenance from './Pages/Main';
import Settings from './Pages/Settings';
import ForgotPassword from './Pages/forget'; // Import the forget password component
import Register from './Pages/register';
import Requests from './Pages/requests';

import Userdash from './Ppages/Userdash';
import MyRequest from './Ppages/MyRequest';
import Equipments from './Ppages/Equipments';
import Updates from './Ppages/Updates';
import Psettings from './Ppages/Psettings';
import EquipmentRequests from './Pages/equipment_requests';

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
      </Routes>
    </Router>
  );
};

export default App;