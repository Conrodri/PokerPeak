import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const loginWithToken = useAuthStore(s => s.loginWithToken);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      navigate('/login?error=' + error, { replace: true });
      return;
    }

    if (token) {
      loginWithToken(token).then(() => {
        navigate('/training', { replace: true });
      });
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-4xl mb-4">🃏</div>
        <p className="text-gray-400 text-sm">Connexion en cours…</p>
      </div>
    </div>
  );
}
