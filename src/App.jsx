import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard';
import Exam from './components/Exam';
import Result from './components/Result';
import Admin from './components/Admin';
import Contact from './components/Contact';
import About from './components/About';
import AdminExamResults from './components/AdminExamResults'; // New component for admin results view
import './styles/App.css';

function AppContent() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/exam/:examId" element={<Exam />} />
          <Route path="/result/:examId" element={<Result />} />
          <Route path="/result/:examId/:userId" element={<Result />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/exam/:examId/results" element={<AdminExamResults />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

