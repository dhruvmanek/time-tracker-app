import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { notificationsAllowed } from '@/lib/notifications';
import { useAppState } from '@/lib/store';

/**
 * True when Tikko can actually ring: check-ins are switched on in Tikko AND iOS
 * allows notifications. Re-checked whenever the app comes back to the foreground
 * (e.g. after the user changes it in the iPhone Settings app).
 */
export function useCheckInsOn(): boolean {
  const { settings } = useAppState();
  const [allowed, setAllowed] = useState(true);
  useEffect(() => {
    const check = () => notificationsAllowed().then(setAllowed);
    check();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => sub.remove();
  }, []);
  return settings.notificationsOn && allowed;
}
