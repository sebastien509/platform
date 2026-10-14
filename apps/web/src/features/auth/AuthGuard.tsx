import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from './useSession';

export function AuthGuard() {
  const { data: session, isLoading, isError } = useSession();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-0)',
      }}>
        <div style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (isError || !session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
