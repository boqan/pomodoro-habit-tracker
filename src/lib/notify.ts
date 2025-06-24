export function notify(message: string) {
  if (typeof window === 'undefined') return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(message);
    } catch {
      // ignore errors
    }
  }
}
