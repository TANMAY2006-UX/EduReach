import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Info, X } from 'lucide-react';

const MESSAGES = {
  session_expired: {
    icon: AlertTriangle,
    text: 'Your session expired. Please sign in again.',
    style: 'bg-amber-50 border-amber-200 text-amber-800',
    iconStyle: 'text-amber-500',
  },
  logged_out_elsewhere: {
    icon: Info,
    text: 'You were signed out from another tab or device.',
    style: 'bg-blue-50 border-blue-200 text-blue-800',
    iconStyle: 'text-blue-500',
  },
  oauth_failed: {
    icon: AlertTriangle,
    text: 'Google sign-in failed. Please try again.',
    style: 'bg-red-50 border-red-200 text-red-800',
    iconStyle: 'text-red-500',
  },
};

/**
 * SessionBanner
 * Drop this inside LoginPage to show contextual reason messages.
 *
 * Usage:
 *   <SessionBanner />
 *
 * It reads ?reason= from the URL. Cleans itself up after 8 seconds.
 */
export default function SessionBanner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [visible, setVisible] = useState(false);

  const reason = searchParams.get('reason') || searchParams.get('error');
  const config = MESSAGES[reason];

  useEffect(() => {
    if (config) {
      setVisible(true);
      const t = setTimeout(dismiss, 8000);
      return () => clearTimeout(t);
    }
  }, [reason]);

  const dismiss = () => {
    setVisible(false);
    // Clean the URL without reloading
    const next = new URLSearchParams(searchParams);
    next.delete('reason');
    next.delete('error');
    setSearchParams(next, { replace: true });
  };

  if (!config || !visible) return null;

  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 mb-5 ${config.style}`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.iconStyle}`} />
      <p className="text-sm flex-1 font-medium">{config.text}</p>
      <button onClick={dismiss} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}