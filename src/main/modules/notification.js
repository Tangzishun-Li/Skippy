const { Notification, app } = require('electron');
const path = require('path');
const fs = require('fs');

let notificationSettings = {
  enabled: true,
  advanceMinutes: 15,
  sound: true,
  repeatInterval: 0,
  history: []
};

const SETTINGS_FILE = 'notification-settings.json';

function getSettingsPath() {
  return path.join(app.getPath('userData'), SETTINGS_FILE);
}

function loadSettings() {
  try {
    const settingsPath = getSettingsPath();
    if (fs.existsSync(settingsPath)) {
      notificationSettings = { ...notificationSettings, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };
    }
  } catch (e) {
    console.error('[Notification] Failed to load settings:', e);
  }
  return notificationSettings;
}

function saveSettings() {
  try {
    const settingsPath = getSettingsPath();
    fs.writeFileSync(settingsPath, JSON.stringify(notificationSettings, null, 2));
  } catch (e) {
    console.error('[Notification] Failed to save settings:', e);
  }
}

function updateSettings(newSettings) {
  notificationSettings = { ...notificationSettings, ...newSettings };
  saveSettings();
  return notificationSettings;
}

function getSettings() {
  return notificationSettings;
}

function showNotification(title, body, options = {}) {
  if (!notificationSettings.enabled) {
    console.log('[Notification] Notifications disabled, skipping');
    return null;
  }

  if (!Notification.isSupported()) {
    console.log('[Notification] Notifications not supported');
    return null;
  }

  const notification = new Notification({
    title: title,
    body: body,
    silent: !notificationSettings.sound,
    icon: path.join(__dirname, '../../renderer/assets/icon.png'),
    ...options
  });

  notification.on('click', () => {
    console.log('[Notification] Clicked:', title);
    if (options.onClick) {
      options.onClick();
    }
  });

  notification.on('close', () => {
    console.log('[Notification] Closed:', title);
  });

  notification.show();

  addToHistory({
    title,
    body,
    timestamp: new Date().toISOString(),
    clicked: false
  });

  return notification;
}

function showCourseReminder(course, minutesUntil) {
  const title = '📚 课程提醒';
  const body = `【${course.name}】将在 ${minutesUntil} 分钟后开始\n${course.location ? '地点：' + course.location : ''}`;
  
  return showNotification(title, body, {
    tag: `course-${course.id}`,
    data: { type: 'course', course }
  });
}

function showDDLReminder(ddl, daysLeft, hoursLeft) {
  let timeText = '';
  if (daysLeft > 0) {
    timeText = `还剩 ${daysLeft} 天 ${hoursLeft} 小时`;
  } else if (hoursLeft > 0) {
    timeText = `还剩 ${hoursLeft} 小时`;
  } else {
    timeText = '即将截止！';
  }

  const title = '⚠️ DDL 提醒';
  const body = `【${ddl.name}】${timeText}`;

  return showNotification(title, body, {
    tag: `ddl-${ddl.id}`,
    urgency: daysLeft === 0 ? 'critical' : 'normal',
    data: { type: 'ddl', ddl }
  });
}

function showGenericNotification(title, body) {
  return showNotification(title, body);
}

function addToHistory(item) {
  notificationSettings.history.unshift(item);
  
  if (notificationSettings.history.length > 100) {
    notificationSettings.history = notificationSettings.history.slice(0, 100);
  }
  
  saveSettings();
}

function getHistory() {
  return notificationSettings.history;
}

function clearHistory() {
  notificationSettings.history = [];
  saveSettings();
}

function scheduleNotification(id, delayMs, title, body, options = {}) {
  return setTimeout(() => {
    showNotification(title, body, options);
  }, delayMs);
}

function cancelScheduledNotification(id) {
  clearTimeout(id);
}

function checkUpcomingCourses(courses) {
  if (!notificationSettings.enabled) return [];

  const now = new Date();
  const upcomingCourses = [];
  const advanceMs = notificationSettings.advanceMinutes * 60 * 1000;

  for (const course of courses) {
    if (!course.startTime) continue;

    const [hours, minutes] = course.startTime.split(':').map(Number);
    const courseDate = new Date();
    courseDate.setHours(hours, minutes, 0, 0);

    if (courseDate < now) {
      courseDate.setDate(courseDate.getDate() + 7);
    }

    const diffMs = courseDate - now;
    
    if (diffMs > 0 && diffMs <= advanceMs) {
      upcomingCourses.push({
        course,
        minutesUntil: Math.round(diffMs / 60000)
      });
    }
  }

  return upcomingCourses;
}

function checkUpcomingDDLs(courses) {
  if (!notificationSettings.enabled) return [];

  const now = new Date();
  const upcomingDDLs = [];

  for (const course of courses) {
    if (course.status !== 'ddl' || !course.startTime) continue;

    const [hours, minutes] = course.startTime.split(':').map(Number);
    const ddlDate = new Date();
    ddlDate.setHours(hours, minutes, 0, 0);

    const diffMs = ddlDate - now;
    const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffMs > 0 && daysLeft <= 1) {
      upcomingDDLs.push({
        ddl: course,
        daysLeft,
        hoursLeft
      });
    }
  }

  return upcomingDDLs;
}

module.exports = {
  loadSettings,
  saveSettings,
  updateSettings,
  getSettings,
  showNotification,
  showCourseReminder,
  showDDLReminder,
  showGenericNotification,
  getHistory,
  clearHistory,
  scheduleNotification,
  cancelScheduledNotification,
  checkUpcomingCourses,
  checkUpcomingDDLs
};
