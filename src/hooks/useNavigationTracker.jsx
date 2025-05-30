import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useNavigationTracker() {
  const location = useLocation();
  
  useEffect(() => {
    console.log('Navigated to:', location.pathname);
    // Add any navigation tracking logic here
  }, [location]);
}