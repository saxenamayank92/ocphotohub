import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export async function initializeNativeApp() {
  if (!Capacitor.isNativePlatform()) {
    return { isNative: false };
  }

  try {
    // Hide splash screen after app ready
    await SplashScreen.hide();

    // Style native status bar with club theme
    // The entry screen is navy, so use light status-bar content until the
    // authenticated app switches to its light header.
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#172238' });
    await CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      try {
        const parsed = new URL(url);
        window.location.assign(`${parsed.pathname}${parsed.search}${parsed.hash}`);
      } catch (error) {
        console.warn('Ignored invalid app link:', error);
      }
    });
  } catch (err) {
    console.warn('Native status bar / splash screen config note:', err);
  }

  return { isNative: true };
}

export async function setNativeStatusBarForApp(isAuthenticated) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await StatusBar.setStyle({ style: isAuthenticated ? Style.Dark : Style.Light });
  } catch (error) {
    console.warn('Could not update native status-bar style:', error);
  }
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

    // Replace listeners on account changes so one device cannot register duplicate callbacks.
    await PushNotifications.removeAllListeners();

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
      const data = action.notification.data;
      if (data?.url && typeof window !== 'undefined') {
        window.location.assign(data.url);
      }
    });

    // Register with Apple APNs / Google FCM after listeners are installed.
    await PushNotifications.register();

    return { success: true };
  } catch (err) {
    console.error('Push notification initialization error:', err);
    return { success: false, error: err };
  }
}
