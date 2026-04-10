import { useEffect, useRef } from 'react';

// Unique ID per tab so we never react to our own broadcasts
const TAB_ID = crypto.randomUUID();
const CHANNEL_NAME = 'edureach_auth';

/**
 * useBroadcastAuth
 *
 * Sends and receives auth events across all open tabs of the same origin.
 * Events: LOGOUT | LOGIN | SESSION_EXPIRED
 *
 * @param {object} handlers
 * @param {() => void} handlers.onRemoteLogout      - called when ANOTHER tab logs out
 * @param {() => void} handlers.onRemoteLogin       - called when ANOTHER tab logs in
 * @param {() => void} handlers.onSessionExpired    - called when server 401 is detected
 * @returns {{ broadcastLogout, broadcastLogin, broadcastExpired }}
 */
export function useBroadcastAuth({ onRemoteLogout, onRemoteLogin, onRemoteSessionExpired } = {}) {
  const channelRef = useRef(null);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, source } = event.data;
      // Ignore messages from self
      if (source === TAB_ID) return;

      if (type === 'LOGOUT' && onRemoteLogout)           onRemoteLogout();
      if (type === 'LOGIN'  && onRemoteLogin)            onRemoteLogin();
      if (type === 'SESSION_EXPIRED' && onRemoteSessionExpired) onRemoteSessionExpired();
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [onRemoteLogout, onRemoteLogin, onRemoteSessionExpired]);

  const broadcast = (type) => {
    channelRef.current?.postMessage({ type, source: TAB_ID });
  };

  return {
    broadcastLogout:  () => broadcast('LOGOUT'),
    broadcastLogin:   () => broadcast('LOGIN'),
    broadcastExpired: () => broadcast('SESSION_EXPIRED'),
  };
}