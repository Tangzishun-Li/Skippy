const nodemailer = require('nodemailer');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

let transporter = null;
let mailSettings = {
  enabled: false,
  host: '',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  from: '',
  recipients: [],
  ddlReminderHours: [24, 1]
};

const SETTINGS_FILE = 'mail-settings.json';

function getSettingsPath() {
  return path.join(app.getPath('userData'), SETTINGS_FILE);
}

function loadSettings() {
  try {
    const settingsPath = getSettingsPath();
    if (fs.existsSync(settingsPath)) {
      mailSettings = { ...mailSettings, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };
    }
  } catch (e) {
    console.error('[Mailer] Failed to load settings:', e);
  }
  return mailSettings;
}

function saveSettings() {
  try {
    const settingsPath = getSettingsPath();
    fs.writeFileSync(settingsPath, JSON.stringify(mailSettings, null, 2));
  } catch (e) {
    console.error('[Mailer] Failed to save settings:', e);
  }
}

function updateSettings(newSettings) {
  mailSettings = { ...mailSettings, ...newSettings };
  
  if (newSettings.host && newSettings.user && newSettings.pass) {
    initTransporter();
  }
  
  saveSettings();
  return mailSettings;
}

function getSettings() {
  return mailSettings;
}

function initTransporter() {
  if (!mailSettings.host || !mailSettings.user || !mailSettings.pass) {
    console.log('[Mailer] SMTP not configured');
    return false;
  }

  try {
    transporter = nodemailer.createTransport({
      host: mailSettings.host,
      port: mailSettings.port,
      secure: mailSettings.secure,
      auth: {
        user: mailSettings.user,
        pass: mailSettings.pass
      }
    });

    console.log('[Mailer] Transporter initialized');
    return true;
  } catch (e) {
    console.error('[Mailer] Failed to create transporter:', e);
    return false;
  }
}

async function sendMail(to, subject, html, text) {
  if (!mailSettings.enabled) {
    console.log('[Mailer] Mail disabled');
    return { success: false, error: 'Mail disabled' };
  }

  if (!transporter) {
    const initialized = initTransporter();
    if (!initialized) {
      return { success: false, error: 'SMTP not configured' };
    }
  }

  try {
    const info = await transporter.sendMail({
      from: mailSettings.from || mailSettings.user,
      to: to,
      subject: subject,
      text: text,
      html: html
    });

    console.log('[Mailer] Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (e) {
    console.error('[Mailer] Failed to send email:', e);
    return { success: false, error: e.message };
  }
}

function buildDDLReminderEmail(ddl, daysLeft, hoursLeft) {
  let timeText = '';
  if (daysLeft > 0) {
    timeText = `还剩 <strong>${daysLeft} 天 ${hoursLeft} 小时</strong>`;
  } else if (hoursLeft > 0) {
    timeText = `还剩 <strong>${hoursLeft} 小时</strong>`;
  } else {
    timeText = '<strong>即将截止！</strong>';
  }

  const subject = `【提醒】DDL: ${ddl.name} - ${timeText}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">⚠️ DDL 提醒</h1>
      </div>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">您好，</p>
        <p style="font-size: 16px;">您的 <strong>${ddl.name}</strong> 截止日期即将到来：</p>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea;">
          <p style="font-size: 18px; margin: 0; color: #333;">${timeText}</p>
          ${ddl.location ? `<p style="margin: 10px 0 0 0; color: #666;">📍 地点：${ddl.location}</p>` : ''}
        </div>
        <p style="color: #666; font-size: 14px;">请及时完成相关任务，避免错过截止日期。</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">此邮件由 Skippy 自动发送</p>
      </div>
    </div>
  `;

  const text = `
DDL 提醒

您好，

您的 ${ddl.name} 截止日期即将到来：
${timeText}
${ddl.location ? '地点：' + ddl.location : ''}

请及时完成相关任务，避免错过截止日期。

此邮件由 Skippy 自动发送
  `;

  return { subject, html, text };
}

async function sendDDLReminder(ddl, daysLeft, hoursLeft) {
  if (!mailSettings.enabled || mailSettings.recipients.length === 0) {
    return { success: false, error: 'Mail disabled or no recipients' };
  }

  const { subject, html, text } = buildDDLReminderEmail(ddl, daysLeft, hoursLeft);
  
  const results = [];
  for (const recipient of mailSettings.recipients) {
    const result = await sendMail(recipient, subject, html, text);
    results.push({ recipient, ...result });
  }
  
  return results;
}

async function sendCourseReminder(course, minutesUntil) {
  if (!mailSettings.enabled || mailSettings.recipients.length === 0) {
    return { success: false, error: 'Mail disabled or no recipients' };
  }

  const subject = `【提醒】课程 ${course.name} 即将开始`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">📚 课程提醒</h1>
      </div>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">您好，</p>
        <p style="font-size: 16px;">您的课程 <strong>${course.name}</strong> 即将开始：</p>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea;">
          <p style="font-size: 18px; margin: 0; color: #333;">⏰ ${minutesUntil} 分钟后开始</p>
          <p style="margin: 10px 0 0 0; color: #666;">🕐 时间：${course.startTime} - ${course.endTime}</p>
          ${course.location ? `<p style="margin: 5px 0 0 0; color: #666;">📍 地点：${course.location}</p>` : ''}
        </div>
        <p style="color: #666; font-size: 14px;">请做好准备，准时参加课程。</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">此邮件由 Skippy 自动发送</p>
      </div>
    </div>
  `;

  const text = `
课程提醒

您好，

您的课程 ${course.name} 即将开始：
${minutesUntil} 分钟后开始
时间：${course.startTime} - ${course.endTime}
${course.location ? '地点：' + course.location : ''}

请做好准备，准时参加课程。

此邮件由 Skippy 自动发送
  `;

  const results = [];
  for (const recipient of mailSettings.recipients) {
    const result = await sendMail(recipient, subject, html, text);
    results.push({ recipient, ...result });
  }
  
  return results;
}

async function testConnection() {
  if (!transporter) {
    const initialized = initTransporter();
    if (!initialized) {
      return { success: false, error: 'SMTP not configured' };
    }
  }

  try {
    await transporter.verify();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = {
  loadSettings,
  saveSettings,
  updateSettings,
  getSettings,
  initTransporter,
  sendMail,
  sendDDLReminder,
  sendCourseReminder,
  testConnection,
  buildDDLReminderEmail
};
