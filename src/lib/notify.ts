export function notify(message: string) {
  if (typeof window === 'undefined') return;

  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(message);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(message);
        }
      });
    }
  }

  if ('vibrate' in navigator) {
    navigator.vibrate([200]);
  }
  
  if (Notification.permission === 'granted') {
    try {
      new Notification(message);
    } catch {
      // ignore errors
    }
  }
}
