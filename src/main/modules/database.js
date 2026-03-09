const initSqlJs = require('sql.js');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

let db = null;
let SQL = null;

function getDbPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'skippy.db');
}

function getSchemaPath() {
  return path.join(__dirname, 'schema.sql');
}

async function initDatabase() {
  if (db) return db;

  const dbPath = getDbPath();
  console.log('[Database] Initializing at:', dbPath);

  SQL = await initSqlJs();

  let fileBuffer = null;
  if (fs.existsSync(dbPath)) {
    try {
      fileBuffer = fs.readFileSync(dbPath);
      console.log('[Database] Loaded existing database');
    } catch (e) {
      console.error('[Database] Failed to read existing database:', e);
    }
  }

  if (fileBuffer) {
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  createTables();
  saveDatabase();

  console.log('[Database] Initialized successfully');
  return db;
}

function createTables() {
  const schemaPath = getSchemaPath();
  
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.run(schema);
    console.log('[Database] Schema loaded from file');
  } else {
    console.error('[Database] Schema file not found:', schemaPath);
  }
}

function saveDatabase() {
  if (!db) return;
  
  const data = db.export();
  const buffer = Buffer.from(data);
  const dbPath = getDbPath();
  
  try {
    fs.writeFileSync(dbPath, buffer);
    console.log('[Database] Saved to disk');
  } catch (e) {
    console.error('[Database] Failed to save:', e);
  }
}

function getAllCourses() {
  const results = db.exec('SELECT * FROM courses ORDER BY dayOfWeek, startTime');
  if (results.length === 0) return [];
  
  const columns = results[0].columns;
  const values = results[0].values;
  
  return values.map(row => {
    const course = {};
    columns.forEach((col, i) => {
      course[col] = row[i];
    });
    return parseCourse(course);
  });
}

function getCourseById(id) {
  const stmt = db.prepare('SELECT * FROM courses WHERE id = ?');
  stmt.bind([id]);
  
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return parseCourse(row);
  }
  stmt.free();
  return null;
}

function saveCourse(course) {
  const timeline = JSON.stringify(course.timeline || []);
  
  const existing = getCourseById(course.id);
  
  if (existing) {
    db.run(`
      UPDATE courses SET 
        name = ?, dayOfWeek = ?, startTime = ?, endTime = ?,
        startDate = ?, frequency = ?, repeatCount = ?, location = ?,
        status = ?, timeline = ?, updatedAt = datetime('now')
      WHERE id = ?
    `, [
      course.name, course.dayOfWeek, course.startTime, course.endTime,
      course.startDate, course.frequency, course.repeatCount, course.location,
      course.status, timeline, course.id
    ]);
  } else {
    db.run(`
      INSERT INTO courses (id, name, dayOfWeek, startTime, endTime, startDate, frequency, repeatCount, location, status, timeline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      course.id, course.name, course.dayOfWeek, course.startTime, course.endTime,
      course.startDate, course.frequency, course.repeatCount, course.location,
      course.status, timeline
    ]);
  }
  
  saveDatabase();
  return getCourseById(course.id);
}

function deleteCourse(id) {
  db.run('DELETE FROM courses WHERE id = ?', [id]);
  saveDatabase();
}

function getLessonsByCourse(courseId) {
  const results = db.exec('SELECT * FROM lessons WHERE courseId = ? ORDER BY lessonIndex', [courseId]);
  if (results.length === 0) return [];
  
  const columns = results[0].columns;
  return results[0].values.map(row => {
    const lesson = {};
    columns.forEach((col, i) => {
      lesson[col] = row[i];
    });
    return lesson;
  });
}

function saveLesson(lesson) {
  const existingStmt = db.prepare('SELECT id FROM lessons WHERE id = ?');
  existingStmt.bind([lesson.id]);
  const exists = existingStmt.step();
  existingStmt.free();
  
  if (exists) {
    db.run(`
      UPDATE lessons SET status = ?, problem = ?, updatedAt = datetime('now')
      WHERE id = ?
    `, [lesson.status, lesson.problem, lesson.id]);
  } else {
    db.run(`
      INSERT INTO lessons (id, courseId, lessonIndex, date, status, problem)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [lesson.id, lesson.courseId, lesson.lessonIndex, lesson.date, lesson.status, lesson.problem]);
  }
  saveDatabase();
}

function getSetting(key) {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  stmt.bind([key]);
  
  if (stmt.step()) {
    const result = stmt.getAsObject();
    stmt.free();
    return result.value;
  }
  stmt.free();
  return null;
}

function setSetting(key, value) {
  const existingStmt = db.prepare('SELECT key FROM settings WHERE key = ?');
  existingStmt.bind([key]);
  const exists = existingStmt.step();
  existingStmt.free();
  
  if (exists) {
    db.run(`UPDATE settings SET value = ?, updatedAt = datetime('now') WHERE key = ?`, [value, key]);
  } else {
    db.run(`INSERT INTO settings (key, value) VALUES (?, ?)`, [key, value]);
  }
  saveDatabase();
}

function parseCourse(course) {
  if (!course) return null;
  return {
    ...course,
    timeline: course.timeline ? JSON.parse(course.timeline) : []
  };
}

function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    console.log('[Database] Closed');
  }
}

function importData(courses) {
  for (const course of courses) {
    const timeline = JSON.stringify(course.timeline || []);
    
    const existing = getCourseById(course.id);
    
    if (existing) {
      db.run(`
        UPDATE courses SET 
          name = ?, dayOfWeek = ?, startTime = ?, endTime = ?,
          startDate = ?, frequency = ?, repeatCount = ?, location = ?,
          status = ?, timeline = ?, updatedAt = datetime('now')
        WHERE id = ?
      `, [
        course.name || null, 
        course.dayOfWeek ?? 0, 
        course.startTime || '00:00', 
        course.endTime || '00:00',
        course.startDate || null, 
        course.frequency || 'weekly', 
        course.repeatCount || 16, 
        course.location || null,
        course.status || '', 
        timeline, 
        course.id
      ]);
    } else {
      db.run(`
        INSERT INTO courses (id, name, dayOfWeek, startTime, endTime, startDate, frequency, repeatCount, location, status, timeline)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        course.id,
        course.name || '未命名', 
        course.dayOfWeek ?? 0, 
        course.startTime || '00:00', 
        course.endTime || '00:00',
        course.startDate || null, 
        course.frequency || 'weekly', 
        course.repeatCount || 16, 
        course.location || null,
        course.status || '', 
        timeline
      ]);
    }
  }
  saveDatabase();
}

module.exports = {
  initDatabase,
  closeDatabase,
  getAllCourses,
  getCourseById,
  saveCourse,
  deleteCourse,
  getLessonsByCourse,
  saveLesson,
  getSetting,
  setSetting,
  importData
};
