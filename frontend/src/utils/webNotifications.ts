// Browser Native Notification & Sound Reminder Utility

export const webNotifications = {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
    return false;
  },

  sendReminder(title: string, body: string, onClick?: () => void) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'followup-reminder',
        });
        if (onClick) {
          notif.onclick = () => {
            window.focus();
            onClick();
            notif.close();
          };
        }
      } catch (err) {
        console.error('Failed to trigger browser notification:', err);
      }
    }
  },
};
