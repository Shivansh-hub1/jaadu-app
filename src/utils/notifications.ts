import notifee, { AndroidImportance, TriggerType, RepeatFrequency } from '@notifee/react-native';

const CHANNEL_ID = 'jaadu_alerts';

export async function initNotifications(): Promise<void> {
  try {
    await notifee.requestPermission();
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'JAADU Study & Downloads',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true
    });

    // Schedule daily study reminder at 8:00 PM if not already scheduled
    const date = new Date(Date.now());
    date.setHours(20, 0, 0, 0);
    if (date.getTime() <= Date.now()) {
      date.setDate(date.getDate() + 1);
    }

    await notifee.createTriggerNotification(
      {
        id: 'daily_study_reminder',
        title: '🔥 Keep Your Streak Alive!',
        body: 'Time for your daily coding session on JAADU. Consistent practice builds senior engineers!',
        android: {
          channelId: CHANNEL_ID,
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default'
          }
        }
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: date.getTime(),
        repeatFrequency: RepeatFrequency.DAILY
      }
    );
  } catch (err) {
    console.warn('Notifications init error:', err);
  }
}

export async function notifyDownloadComplete(title: string): Promise<void> {
  try {
    await notifee.displayNotification({
      title: '📥 Download Finished',
      body: `"${title}" is saved to your phone. Ready for offline playback!`,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default'
        }
      }
    });
  } catch (err) {
    console.warn('Download notification error:', err);
  }
}
