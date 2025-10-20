import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return false;
  }
  
  return true;
}

export async function scheduleShiftNotification(
  employeeName: string,
  shiftTime: string,
  storeName: string,
) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  console.log(`Scheduling shift notification for ${employeeName} at ${shiftTime} in ${storeName}`);
}

export async function sendCheckInNotification(
  employeeName: string,
  status: 'done' | 'not_done',
  reason?: string,
) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: status === 'done' ? 'Giriş Yapıldı' : 'Giriş Yapılamadı',
      body: status === 'done' 
        ? `${employeeName} vardiyaya giriş yaptı`
        : `${employeeName} vardiyaya giriş yapamadı. Sebep: ${reason}`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

export async function sendCheckOutNotification(
  employeeName: string,
  status: 'done' | 'not_done',
  reason?: string,
) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: status === 'done' ? 'Çıkış Yapıldı' : 'Çıkış Yapılamadı',
      body: status === 'done' 
        ? `${employeeName} vardiyadan çıkış yaptı`
        : `${employeeName} vardiyadan çıkış yapamadı. Sebep: ${reason}`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

export async function sendAnnouncementNotification(
  title: string,
  createdByName: string,
) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📢 Yeni Duyuru',
      body: `${createdByName}: ${title}`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

export async function sendOvertimeSubmittedNotification(
  employeeName: string,
  hours: number,
  date: string,
  storeName: string,
) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Yeni Extra Mesai Talebi',
      body: `${employeeName} - ${storeName} için ${hours} saat extra mesai talebi (${date})`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

export async function sendOvertimeStatusNotification(
  status: 'approved' | 'rejected',
  hours: number,
  date: string,
) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: status === 'approved' ? '✅ Extra Mesai Onaylandı' : '❌ Extra Mesai Reddedildi',
      body: `${date} tarihli ${hours} saatlik extra mesai talebiniz ${status === 'approved' ? 'onaylandı' : 'reddedildi'}.`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

export async function sendShiftCreatedNotification(
  storeName: string,
  weekStart: string,
  weekEnd: string,
  recipientType: 'manager' | 'trainer',
) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📅 Yeni Vardiya Oluşturuldu',
      body: `${storeName} mağazası için ${weekStart} - ${weekEnd} tarihleri arasında vardiya oluşturuldu.`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

export async function sendUntrainedEmployeeNotification(
  employeeName: string,
  position: string,
  storeName: string,
) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Eğitimsiz Personel Eklendi',
      body: `${storeName} mağazasına eğitimsiz ${position} olarak ${employeeName} eklendi.`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

export async function sendRegistrationNotification(
  employeeName: string,
  position: string,
  storeName: string,
  region: string,
) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '👤 Yeni Kayıt Onay Bekliyor',
      body: `${employeeName} (${position}) - ${storeName} (${region}) mağazası için kayıt onayı bekliyor.`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

export async function sendRegistrationApprovedNotification(
  employeeName: string,
  status: 'pending' | 'approved',
) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: status === 'pending' ? '⏳ Onay Sürecinde' : '✅ Hesabınız Onaylandı',
      body: status === 'pending' 
        ? 'Kaydınız alındı. Mağaza yöneticileri ve bölge müdürünüz tarafından onaylandığında sisteme giriş yapabileceksiniz.'
        : 'Hesabınız onaylandı! Artık sisteme giriş yapabilirsiniz.',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

export async function sendWeeklyShiftReminderNotification(
  storeName: string,
  managerName: string,
) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Vardiya Oluşturma Hatırlatması',
      body: `${managerName}, ${storeName} mağazası için gelecek haftanın vardiyasını oluşturma zamanı!`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

export async function scheduleWeeklyShiftReminders() {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  
  let daysUntilFriday = (5 - currentDay + 7) % 7;
  
  if (daysUntilFriday === 0 && currentHour >= 18) {
    daysUntilFriday = 7;
  }
  
  if (daysUntilFriday === 0) {
    daysUntilFriday = 0;
  }

  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + daysUntilFriday);
  nextFriday.setHours(18, 0, 0, 0);

  console.log('📅 Haftalık vardiya hatırlatması planlandı:', nextFriday);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Vardiya Oluşturma Hatırlatması',
      body: 'Gelecek haftanın vardiyasını oluşturma zamanı!',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      weekday: 6,
      hour: 18,
      minute: 0,
      repeats: true,
    },
  });
}
