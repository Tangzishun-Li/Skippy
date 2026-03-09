(function() {
  'use strict';

  let notificationSettings = {
    enabled: true,
    advanceMinutes: 15,
    sound: true,
    repeatInterval: 0,
    history: []
  };

  let mailSettings = {
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    user: '',
    from: '',
    recipients: [],
    ddlReminderHours: [24, 1]
  };

  async function loadSettings() {
    if (window.electronAPI && window.electronAPI.notification) {
      try {
        notificationSettings = await window.electronAPI.notification.getSettings();
      } catch (e) {
        console.error('[NotificationSettings] Failed to load notification settings:', e);
      }
    }
    if (window.electronAPI && window.electronAPI.mailer) {
      try {
        mailSettings = await window.electronAPI.mailer.getSettings();
      } catch (e) {
        console.error('[NotificationSettings] Failed to load mail settings:', e);
      }
    }
    return { notification: notificationSettings, mail: mailSettings };
  }

  async function saveNotificationSettings(settings) {
    if (window.electronAPI && window.electronAPI.notification) {
      try {
        notificationSettings = await window.electronAPI.notification.updateSettings(settings);
        return true;
      } catch (e) {
        console.error('[NotificationSettings] Failed to save:', e);
        return false;
      }
    }
    return false;
  }

  async function saveMailSettings(settings) {
    if (window.electronAPI && window.electronAPI.mailer) {
      try {
        mailSettings = await window.electronAPI.mailer.updateSettings(settings);
        return true;
      } catch (e) {
        console.error('[NotificationSettings] Failed to save mail settings:', e);
        return false;
      }
    }
    return false;
  }

  async function testMailConnection() {
    if (window.electronAPI && window.electronAPI.mailer) {
      try {
        return await window.electronAPI.mailer.testConnection();
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    return { success: false, error: 'Mailer not available' };
  }

  async function sendTestMail(to) {
    if (window.electronAPI && window.electronAPI.mailer) {
      try {
        return await window.electronAPI.mailer.sendTest(to);
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    return { success: false, error: 'Mailer not available' };
  }

  async function getNotificationHistory() {
    if (window.electronAPI && window.electronAPI.notification) {
      try {
        return await window.electronAPI.notification.getHistory();
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  async function clearNotificationHistory() {
    if (window.electronAPI && window.electronAPI.notification) {
      try {
        await window.electronAPI.notification.clearHistory();
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  async function showTestNotification() {
    if (window.electronAPI && window.electronAPI.notification) {
      try {
        await window.electronAPI.notification.show('测试通知', '这是一条测试通知！');
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  window.NotificationSettings = {
    loadSettings,
    saveNotificationSettings,
    saveMailSettings,
    testMailConnection,
    sendTestMail,
    getNotificationHistory,
    clearNotificationHistory,
    showTestNotification
  };
})();
