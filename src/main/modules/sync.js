const { createClient } = require('@supabase/supabase-js');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

let supabase = null;
let syncEnabled = false;
let currentUser = null;
let syncSubscription = null;

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

function getConfigPath() {
  return path.join(app.getPath('userData'), 'sync-config.json');
}

function loadConfig() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.error('[Sync] Failed to load config:', e);
  }
  return { url: null, key: null, enabled: false };
}

function saveConfig(config) {
  try {
    const configPath = getConfigPath();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('[Sync] Failed to save config:', e);
  }
}

function initSupabase(url, anonKey) {
  if (!url || !anonKey) {
    console.log('[Sync] Supabase credentials not configured');
    return false;
  }
  
  try {
    supabase = createClient(url, anonKey);
    console.log('[Sync] Supabase client initialized');
    return true;
  } catch (e) {
    console.error('[Sync] Failed to initialize Supabase:', e);
    return false;
  }
}

async function signIn(email, password) {
  if (!supabase) {
    return { success: false, error: 'Supabase not initialized' };
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    currentUser = data.user;
    console.log('[Sync] Signed in as:', currentUser.email);
    return { success: true, user: data.user };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function signUp(email, password) {
  if (!supabase) {
    return { success: false, error: 'Supabase not initialized' };
  }
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, user: data.user };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function signInAnonymous() {
  if (!supabase) {
    return { success: false, error: 'Supabase not initialized' };
  }
  
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    currentUser = data.user;
    console.log('[Sync] Signed in anonymously');
    return { success: true, user: data.user };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function signOut() {
  if (!supabase) return;
  
  try {
    await supabase.auth.signOut();
    currentUser = null;
    console.log('[Sync] Signed out');
  } catch (e) {
    console.error('[Sync] Sign out error:', e);
  }
}

function getUser() {
  return currentUser;
}

async function uploadData(data) {
  if (!supabase || !currentUser) {
    return { success: false, error: 'Not signed in' };
  }
  
  try {
    const tableName = `user_data_${currentUser.id.slice(0, 8)}`;
    
    const { data: existing } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
      .maybeSingle();
    
    const payload = {
      user_id: currentUser.id,
      data: JSON.stringify(data),
      updated_at: new Date().toISOString()
    };
    
    if (existing) {
      const { error } = await supabase
        .from(tableName)
        .update(payload)
        .eq('id', existing.id);
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from(tableName)
        .insert([payload]);
      
      if (error) throw error;
    }
    
    console.log('[Sync] Data uploaded successfully');
    return { success: true };
  } catch (e) {
    console.error('[Sync] Upload error:', e);
    return { success: false, error: e.message };
  }
}

async function downloadData() {
  if (!supabase || !currentUser) {
    return { success: false, error: 'Not signed in' };
  }
  
  try {
    const tableName = `user_data_${currentUser.id.slice(0, 8)}`;
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle();
    
    if (error) throw error;
    
    if (data) {
      return { success: true, data: JSON.parse(data.data) };
    }
    
    return { success: true, data: null };
  } catch (e) {
    console.error('[Sync] Download error:', e);
    return { success: false, error: e.message };
  }
}

function subscribeToChanges(callback) {
  if (!supabase || !currentUser) {
    return null;
  }
  
  const tableName = `user_data_${currentUser.id.slice(0, 8)}`;
  
  syncSubscription = supabase
    .channel('db-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName
      },
      (payload) => {
        console.log('[Sync] Change received:', payload);
        callback(payload);
      }
    )
    .subscribe();
  
  console.log('[Sync] Subscribed to changes');
  return syncSubscription;
}

function unsubscribeFromChanges() {
  if (syncSubscription) {
    supabase.removeChannel(syncSubscription);
    syncSubscription = null;
    console.log('[Sync] Unsubscribed from changes');
  }
}

function enableSync(enabled) {
  syncEnabled = enabled;
  console.log('[Sync] Sync enabled:', enabled);
}

function isSyncEnabled() {
  return syncEnabled;
}

function isConfigured() {
  return supabase !== null;
}

function getStatus() {
  return {
    configured: isConfigured(),
    enabled: syncEnabled,
    signedIn: currentUser !== null,
    user: currentUser ? currentUser.email : null
  };
}

function setupFromConfig() {
  const config = loadConfig();
  if (config.url && config.key) {
    initSupabase(config.url, config.key);
    syncEnabled = config.enabled || false;
  }
  return getStatus();
}

module.exports = {
  setupFromConfig,
  initSupabase,
  signIn,
  signUp,
  signInAnonymous,
  signOut,
  getUser,
  uploadData,
  downloadData,
  subscribeToChanges,
  unsubscribeFromChanges,
  enableSync,
  isSyncEnabled,
  isConfigured,
  getStatus,
  loadConfig,
  saveConfig
};
