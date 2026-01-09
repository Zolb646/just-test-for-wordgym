/**
 * Notification service for WordGym
 * Handles streak and daily study reminders
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Storage keys
const STREAK_REMINDER_KEY = "wordgym_streak_reminder";
const DAILY_REMINDER_KEY = "wordgym_daily_reminder";
const DAILY_REMINDER_TIME_KEY = "wordgym_daily_reminder_time";

// Notification identifiers
const STREAK_NOTIFICATION_ID = "streak-reminder";
const DAILY_NOTIFICATION_ID = "daily-reminder";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log("Notifications only work on physical devices");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Notification permission not granted");
    return false;
  }

  // Set up Android channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Study Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#667eea",
    });
  }

  return true;
}

/**
 * Schedule streak reminder notification
 * Shows at 20:00 if user hasn't studied today
 */
export async function scheduleStreakReminder(): Promise<boolean> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return false;

  // Cancel existing streak notification
  await cancelStreakReminder();

  // Schedule daily at 20:00
  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_NOTIFICATION_ID,
    content: {
      title: "Streak-ээ хадгал! 🔥",
      body: "Өнөөдөр давтлага хийгээгүй байна. Streak-ээ таслахгүй шүү!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });

  // Save preference
  await SecureStore.setItemAsync(STREAK_REMINDER_KEY, "true");
  console.log("Streak reminder scheduled for 20:00 daily");
  return true;
}

/**
 * Cancel streak reminder
 */
export async function cancelStreakReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(STREAK_NOTIFICATION_ID);
  await SecureStore.setItemAsync(STREAK_REMINDER_KEY, "false");
  console.log("Streak reminder cancelled");
}

/**
 * Schedule daily study reminder at specified time
 */
export async function scheduleDailyReminder(
  hour: number = 20,
  minute: number = 0
): Promise<boolean> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return false;

  // Cancel existing daily notification
  await cancelDailyReminder();

  // Schedule at specified time
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_NOTIFICATION_ID,
    content: {
      title: "Давтлага хийх цаг боллоо! 📚",
      body: "Өнөөдрийн зорилгоо биелүүлье. Хэдхэн минутын давтлага хангалттай!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  // Save preferences
  await SecureStore.setItemAsync(DAILY_REMINDER_KEY, "true");
  await SecureStore.setItemAsync(DAILY_REMINDER_TIME_KEY, `${hour}:${minute}`);
  console.log(`Daily reminder scheduled for ${hour}:${String(minute).padStart(2, "0")}`);
  return true;
}

/**
 * Cancel daily reminder
 */
export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIFICATION_ID);
  await SecureStore.setItemAsync(DAILY_REMINDER_KEY, "false");
  console.log("Daily reminder cancelled");
}

/**
 * Cancel all reminders
 */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await SecureStore.setItemAsync(STREAK_REMINDER_KEY, "false");
  await SecureStore.setItemAsync(DAILY_REMINDER_KEY, "false");
  console.log("All reminders cancelled");
}

/**
 * Get saved notification preferences
 */
export async function getNotificationPreferences(): Promise<{
  streakReminder: boolean;
  dailyReminder: boolean;
  dailyReminderTime: { hour: number; minute: number };
}> {
  const streakReminder = (await SecureStore.getItemAsync(STREAK_REMINDER_KEY)) === "true";
  const dailyReminder = (await SecureStore.getItemAsync(DAILY_REMINDER_KEY)) === "true";
  const timeString = await SecureStore.getItemAsync(DAILY_REMINDER_TIME_KEY);

  let dailyReminderTime = { hour: 20, minute: 0 };
  if (timeString) {
    const [hour, minute] = timeString.split(":").map(Number);
    dailyReminderTime = { hour, minute };
  }

  return { streakReminder, dailyReminder, dailyReminderTime };
}

/**
 * Restore notification schedules from saved preferences
 * Call this on app startup
 */
export async function restoreNotifications(): Promise<void> {
  const prefs = await getNotificationPreferences();

  if (prefs.streakReminder) {
    await scheduleStreakReminder();
  }

  if (prefs.dailyReminder) {
    await scheduleDailyReminder(
      prefs.dailyReminderTime.hour,
      prefs.dailyReminderTime.minute
    );
  }
}

/**
 * Send immediate test notification (for debugging)
 */
export async function sendTestNotification(): Promise<void> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "WordGym Test 🎉",
      body: "Мэдэгдэл амжилттай ажиллаж байна!",
      sound: true,
    },
    trigger: null, // Immediate
  });
}
