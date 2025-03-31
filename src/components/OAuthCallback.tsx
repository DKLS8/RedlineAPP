import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getToken } from '../lib/googleAuth';
import { Loader2 } from 'lucide-react';

export default function OAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    
    if (code) {
      getToken(code)
        .then(tokens => {
          localStorage.setItem('googleAccessToken', tokens.access_token || '');
          if (tokens.refresh_token) {
            localStorage.setItem('googleRefreshToken', tokens.refresh_token);
          }
          navigate('/');
        })
        .catch(error => {
          console.error('Error exchanging code for token:', error);
          navigate('/', { state: { error: 'Failed to authenticate with Google' } });
        });
    } else {
      navigate('/', { state: { error: 'No authorization code received' } });
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
        <h1 className="text-xl text-white mb-2">Authenticating with Google...</h1>
        <p className="text-gray-400">Please wait while we complete the process.</p>
      </div>
    </div>
  );
}