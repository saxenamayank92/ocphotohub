import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export async function initializeNativeApp(addToast) {
  if (!Capacitor.isNativePlatform()) {
    return { isNative: false };
  }

  try {
    // Hide splash screen after app ready
    await SplashScreen.hide();

    // Style native status bar with club theme
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#172238' });
  } catch (err) {
    console.warn('Native status bar / splash screen config note:', err);
  }

  return { isNative: true };
}

export async function registerPushNotifications(onTokenReceived, onNotificationReceived, addToast) {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications running in Web browser mode.');
    return { success: false, reason: 'web' };
  }

  try {
    // Request push notification permissions
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      if (addToast) addToast('Push notifications permission was not granted.', 'info');
      return { success: false, reason: 'denied' };
    }

    // Register with Apple APNs / Google FCM
    await PushNotifications.register();

    // Listener 1: Token registration successful
    PushNotifications.addListener('registration', (token) => {
      console.log('Capacitor Push Token:', token.value);
      if (onTokenReceived) onTokenReceived(token.value);
      if (addToast) addToast('Device registered for club push notifications!', 'success');
    });

    // Listener 2: Registration error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push Registration Error:', error);
      if (addToast) addToast('Push registration error: ' + error.error, 'error');
    });

    // Listener 3: Push Notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received in foreground:', notification);
      if (onNotificationReceived) onNotificationReceived(notification);
      if (addToast) {
        addToast(`🔔 ${notification.title || 'New Club Update'}: ${notification.body || ''}`, 'info');
      }
    });

    // Listener 4: User tapped a push notification
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification action performed:', action);
      const data = action.notification.data;
      if (data && data.url && window) {
        window.location.hash = data.url;
      }
    });

    return { success: true };
  } catch (err) {
    console.error('Push notification initialization error:', err);
    return { success: false, error: err };
  }
}
