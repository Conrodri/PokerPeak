import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const loginWithToken = useAuthStore(s => s.loginWithToken);

  useEffect(() => {
    // The token now arrives in the URL fragment (#token=…) so it never reaches a
    // server log or Referer header. Errors still come through the query string.
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = hash.get('token');
    const error = new URLSearchParams(window.location.search).get('error');

    if (error) {
      navigate('/login?error=' + error, { replace: true });
      return;
    }

    if (token) {
      // Drop the token from the address bar before continuing.
      window.history.replaceState(null, '', window.location.pathname);
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
