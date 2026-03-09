(function() {
  'use strict';

  let courses = [];
  let dbReady = false;

  async function initStorage() {
    if (window.electronAPI && window.electronAPI.db) {
      dbReady = true;
      await migrateFromLocalStorage();
      await loadCoursesFromDb();
    } else {
      console.warn('[Storage] Database not available, falling back to localStorage');
      loadCoursesFromLocalStorage();
    }
  }

  async function migrateFromLocalStorage() {
    const storedCourses = localStorage.getItem('courses');
    if (storedCourses) {
      try {
        const courses = JSON.parse(storedCourses);
        if (courses.length > 0) {
          console.log('[Storage] Migrating data from localStorage to SQLite...');
          await window.electronAPI.db.importData(courses);
          console.log('[Storage] Migration completed');
        }
      } catch (e) {
        console.error('[Storage] Migration failed:', e);
      }
    }
  }

  async function loadCoursesFromDb() {
    try {
      const dbCourses = await window.electronAPI.db.getAllCourses();
      if (dbCourses && dbCourses.length > 0) {
        courses = dbCourses;
        courses.forEach(course => {
          if (!course.timeline) {
            course.timeline = [];
          }
        });
        console.log('[Storage] Loaded', courses.length, 'courses from database');
      } else {
        courses = [];
        console.log('[Storage] No courses in database');
      }
    } catch (e) {
      console.error('[Storage] Failed to load from database:', e);
      courses = [];
    }
    return courses;
  }

  function loadCoursesFromLocalStorage() {
    const storedCourses = localStorage.getItem('courses');
    if (storedCourses) {
      courses = JSON.parse(storedCourses);
      courses.forEach(course => {
        if (!course.timeline) {
          course.timeline = [];
        }
      });
    }
    return courses;
  }

  function getCourses() {
    return courses;
  }

  function setCourses(newCourses) {
    courses = newCourses;
  }

  async function saveCourses() {
    if (dbReady && window.electronAPI && window.electronAPI.db) {
      try {
        for (const course of courses) {
          await window.electronAPI.db.saveCourse(course);
        }
        console.log('[Storage] Saved', courses.length, 'courses to database');
      } catch (e) {
        console.error('[Storage] Failed to save to database:', e);
        localStorage.setItem('courses', JSON.stringify(courses));
      }
    } else {
      localStorage.setItem('courses', JSON.stringify(courses));
    }
  }

  async function addCourse(course) {
    courses.push(course);
    await saveCourses();
  }

  async function updateCourse(courseId, updates) {
    const index = courses.findIndex(c => c.id === courseId);
    if (index !== -1) {
      courses[index] = { ...courses[index], ...updates };
      await saveCourses();
    }
  }

  async function removeCourse(courseId) {
    courses = courses.filter(c => c.id !== courseId);
    if (dbReady && window.electronAPI && window.electronAPI.db) {
      try {
        await window.electronAPI.db.deleteCourse(courseId);
      } catch (e) {
        console.error('[Storage] Failed to delete from database:', e);
      }
    }
    await saveCourses();
  }

  window.AppStorage = {
    init: initStorage,
    getCourses,
    setCourses,
    loadCourses: () => courses,
    saveCourses,
    addCourse,
    updateCourse,
    removeCourse,
    getCoursesData: () => courses,
    setCoursesData: (data) => { courses = data; },
    isDbReady: () => dbReady
  };
})();
