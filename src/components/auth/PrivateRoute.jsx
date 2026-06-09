import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { getCookie } from '@/lib/cookies';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, getMe } = useAuthStore();
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const token = getCookie('token');
      // If no token, ensure store is unauthenticated
      if (!token) {
        await getMe(); // will clear user if invalid / no token
        return;
      }

      // If token exists, always verify it with backend to avoid stale persisted state
      setVerifying(true);
      await getMe();
      setVerifying(false);
    };

    verify();
  }, [isAuthenticated, getMe]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Verifying session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default PrivateRoute;
