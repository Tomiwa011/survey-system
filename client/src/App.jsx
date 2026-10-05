import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SurveyBuilder from './pages/SurveyBuilder';
import PublicSurvey from './pages/PublicSurvey';
import Results from './pages/Results';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Security from './pages/Security';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/surveys/:id" element={<SurveyBuilder />} />
      <Route path="/s/:id" element={<PublicSurvey />} />
      <Route path="/surveys/:id/results" element={<Results />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/security" element={<Security />} />
    </Routes>
  );
}