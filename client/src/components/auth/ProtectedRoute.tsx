import { Navigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { RootState, AppDispatch } from '@/store';
import { setToken, fetchMe } from '@/store/authSlice';
import { Spinner } from '@/components/ui/index';

// ── Protected Route ────────────────────────────────────────────
export function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading, accessToken } = useSelector((s: RootState) => s.auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
        <div className="text-center">
          <div className="text-4xl mb-4">🎓</div>
          <Spinner size="lg" className="mx-auto" />
          <p className="text-[#8b949e] text-sm mt-4">Loading CampusConnect...</p>
        </div>
      </div>
    );
  }

  if (!user || !accessToken) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ── OAuth Callback ─────────────────────────────────────────────
export function OAuthCallback() {
  const dispatch = useDispatch<AppDispatch>();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      dispatch(setToken(token));
      dispatch(fetchMe());
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
      <div className="text-center">
        <div className="text-4xl mb-4">🎓</div>
        <Spinner size="lg" className="mx-auto" />
        <p className="text-[#8b949e] text-sm mt-4">Completing sign in...</p>
      </div>
    </div>
  );
}
