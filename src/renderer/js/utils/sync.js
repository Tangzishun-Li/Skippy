(function() {
  'use strict';

  let syncStatus = {
    configured: false,
    enabled: false,
    signedIn: false,
    user: null
  };

  async function getStatus() {
    if (window.electronAPI && window.electronAPI.sync) {
      try {
        syncStatus = await window.electronAPI.sync.getStatus();
      } catch (e) {
        console.error('[Sync] Failed to get status:', e);
      }
    }
    return syncStatus;
  }

  async function setup(url, key) {
    if (!window.electronAPI || !window.electronAPI.sync) {
      console.warn('[Sync] Sync not available');
      return false;
    }
    try {
      const result = await window.electronAPI.sync.setup(url, key);
      if (result) {
        syncStatus.configured = true;
      }
      return result;
    } catch (e) {
      console.error('[Sync] Setup error:', e);
      return false;
    }
  }

  async function signIn(email, password) {
    if (!window.electronAPI || !window.electronAPI.sync) {
      return { success: false, error: 'Sync not available' };
    }
    try {
      const result = await window.electronAPI.sync.signIn(email, password);
      if (result.success) {
        syncStatus.signedIn = true;
        syncStatus.user = result.user;
      }
      return result;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async function signUp(email, password) {
    if (!window.electronAPI || !window.electronAPI.sync) {
      return { success: false, error: 'Sync not available' };
    }
    try {
      return await window.electronAPI.sync.signUp(email, password);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async function signInAnonymous() {
    if (!window.electronAPI || !window.electronAPI.sync) {
      return { success: false, error: 'Sync not available' };
    }
    try {
      const result = await window.electronAPI.sync.signInAnonymous();
      if (result.success) {
        syncStatus.signedIn = true;
        syncStatus.user = result.user;
      }
      return result;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async function signOut() {
    if (!window.electronAPI || !window.electronAPI.sync) {
      return;
    }
    try {
      await window.electronAPI.sync.signOut();
      syncStatus.signedIn = false;
      syncStatus.user = null;
    } catch (e) {
      console.error('[Sync] Sign out error:', e);
    }
  }

  async function uploadData(data) {
    if (!window.electronAPI || !window.electronAPI.sync) {
      return { success: false, error: 'Sync not available' };
    }
    try {
      return await window.electronAPI.sync.upload(data);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async function downloadData() {
    if (!window.electronAPI || !window.electronAPI.sync) {
      return { success: false, error: 'Sync not available' };
    }
    try {
      return await window.electronAPI.sync.download();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async function enableSync(enabled) {
    if (!window.electronAPI || !window.electronAPI.sync) {
      return false;
    }
    try {
      await window.electronAPI.sync.enable(enabled);
      syncStatus.enabled = enabled;
      return true;
    } catch (e) {
      console.error('[Sync] Enable error:', e);
      return false;
    }
  }

  async function saveConfig(config) {
    if (!window.electronAPI || !window.electronAPI.sync) {
      return false;
    }
    try {
      await window.electronAPI.sync.saveConfig(config);
      return true;
    } catch (e) {
      console.error('[Sync] Save config error:', e);
      return false;
    }
  }

  window.SyncManager = {
    getStatus,
    setup,
    signIn,
    signUp,
    signInAnonymous,
    signOut,
    uploadData,
    downloadData,
    enableSync,
    saveConfig
  };
})();
