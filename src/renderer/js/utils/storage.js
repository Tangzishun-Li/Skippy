(function() {
  'use strict';

  let courses = [];

  function loadFromStorage(key) {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  }

  function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function getCourses() {
    return courses;
  }

  function setCourses(newCourses) {
    courses = newCourses;
  }

  function loadCourses() {
    const storedCourses = loadFromStorage('courses');
    if (storedCourses) {
      courses = storedCourses;
      courses.forEach(course => {
        if (!course.timeline) {
          course.timeline = [];
        }
      });
    }
    return courses;
  }

  function saveCourses() {
    saveToStorage('courses', courses);
  }

  window.AppStorage = {
    loadFromStorage,
    saveToStorage,
    getCourses,
    setCourses,
    loadCourses,
    saveCourses,
    getCoursesData: () => courses,
    setCoursesData: (data) => { courses = data; },
    set: saveToStorage
  };
})();
