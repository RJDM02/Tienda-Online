import { useSyncExternalStore } from 'react';

function subscribe(callback) {
  window.addEventListener('storage', callback);
  window.addEventListener('vjh-session-changed', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('vjh-session-changed', callback);
  };
}

export function useSessionSnapshot() {
  return useSyncExternalStore(subscribe, () => localStorage.getItem('userData'));
}
