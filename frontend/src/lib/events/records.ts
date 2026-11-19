const EVENT = 'records:changed';

export function emitRecordsChanged() {
  window.dispatchEvent(new Event(EVENT));
}

export function onRecordsChanged(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}
