import * as Notifications from 'expo-notifications';

export const scheduleReminder = async (date, subscriptionName) => {
  // Request permissions if not already granted
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }

  // Schedule the notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Fornyelse snart: ${subscriptionName}`,
      body: `${subscriptionName} fornyes om 1 dag`,
    },
    trigger: new Date(date.getTime() - 24 * 60 * 60 * 1000), // 1 dag før
  });
}; 