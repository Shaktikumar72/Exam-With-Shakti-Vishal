import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute() {
  const { currentUser, loading } = useAuth();

  if (loading) return (
    <div className="loader-container">
      console.log("Private Rout");
      <p className="loader-text">Please Wait! Authentication in Progress....</p>
      <div className="loader"></div>
    </div>
  );

  return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
}