-- Skippy Database Schema

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    dayOfWeek INTEGER NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    startDate TEXT,
    frequency TEXT DEFAULT 'weekly',
    repeatCount INTEGER DEFAULT 16,
    location TEXT,
    status TEXT DEFAULT '',
    timeline TEXT DEFAULT '[]',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    courseId TEXT NOT NULL,
    lessonIndex INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT '',
    problem TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lessons_courseId ON lessons(courseId);
CREATE INDEX IF NOT EXISTS idx_lessons_date ON lessons(date);
