import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const FCM_TOKEN_KEY = 'vita_fcm_token';

class NotificationService {
  private async getAuthToken(): Promise<string | null> {
    return sessionStorage.getItem('authToken');
  }

  private getStoredFcmToken(): string | null {
    return localStorage.getItem(FCM_TOKEN_KEY);
  }

  private storeFcmToken(token: string): void {
    localStorage.setItem(FCM_TOKEN_KEY, token);
  }

  private clearFcmToken(): void {
    localStorage.removeItem(FCM_TOKEN_KEY);
  }

  async requestPermissionAndGetToken(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) return null;

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') return null;

    return new Promise((resolve) => {
      PushNotifications.addListener('registration', (token) => {
        this.storeFcmToken(token.value);
        resolve(token.value);
      });

      PushNotifications.addListener('registrationError', () => {
        resolve(null);
      });

      PushNotifications.register();
    });
  }

  async updateSettings(fcmToken: string, enabled: boolean): Promise<boolean> {
    const authToken = await this.getAuthToken();
    if (!authToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/notification/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ fcm_token: fcmToken, enabled })
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async getSettings(): Promise<{ exists: boolean; enabled: boolean; fcm_token?: string }> {
    const authToken = await this.getAuthToken();
    if (!authToken) return { exists: false, enabled: false };

    const fcmToken = this.getStoredFcmToken();
    const queryParam = fcmToken ? `?fcm_token=${encodeURIComponent(fcmToken)}` : '';

    try {
      const response = await fetch(`${API_BASE_URL}/api/notification/settings${queryParam}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (!response.ok) return { exists: false, enabled: false };
      return await response.json();
    } catch {
      return { exists: false, enabled: false };
    }
  }

  async initializeOnAppLaunch(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const fcmToken = this.getStoredFcmToken();

    if (!fcmToken) {
      const newToken = await this.requestPermissionAndGetToken();
      if (newToken) {
        await this.updateSettings(newToken, true);
      }
      return;
    }

    const settings = await this.getSettings();
    if (!settings.exists) {
      const permResult = await PushNotifications.checkPermissions();
      const enabled = permResult.receive === 'granted';
      await this.updateSettings(fcmToken, enabled);
    }
  }

  async enableNotifications(): Promise<boolean> {
    const token = this.getStoredFcmToken() || await this.requestPermissionAndGetToken();
    if (!token) return false;
    return this.updateSettings(token, true);
  }

  async disableNotifications(): Promise<boolean> {
    const token = this.getStoredFcmToken();
    if (!token) return false;
    return this.updateSettings(token, false);
  }
}

export const notificationService = new NotificationService();

