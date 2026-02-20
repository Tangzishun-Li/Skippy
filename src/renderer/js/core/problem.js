(function() {
  'use strict';

  const problemModal = document.getElementById('problemModal');
  const problemForm = document.getElementById('problemForm');
  const closeModal = document.querySelector('.close');

  function showProblemModal(courseId, lessonIndex) {
    const courses = window.AppStorage.getCoursesData();
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const lesson = course.lessons[lessonIndex];
      document.getElementById('courseId').value = courseId;
      document.getElementById('lessonIndex').value = lessonIndex;
      document.getElementById('problemDescription').value = lesson.problem || '';
      problemModal.style.display = 'block';
    }
  }

  function closeProblemModal() {
    problemModal.style.display = 'none';
  }

  function saveProblem(e) {
    e.preventDefault();

    const courseId = document.getElementById('courseId').value;
    const lessonIndex = parseInt(document.getElementById('lessonIndex').value);
    const problemDescription = document.getElementById('problemDescription').value;

    const courses = window.AppStorage.getCoursesData();
    const course = courses.find(c => c.id === courseId);
    if (course) {
      course.lessons[lessonIndex].problem = problemDescription;
      window.AppStorage.saveCourses();
      if (window.CourseManager) {
        window.CourseManager.renderCourses();
      }
      if (window.Calendar) {
        window.Calendar.render();
      }
      problemModal.style.display = 'none';
    }
  }

  function initProblemEvents() {
    problemForm.addEventListener('submit', saveProblem);

    closeModal.addEventListener('click', () => {
      problemModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === problemModal) {
        problemModal.style.display = 'none';
      }
    });
  }

  window.Problem = {
    showModal: showProblemModal,
    closeModal: closeProblemModal,
    save: saveProblem,
    initEvents: initProblemEvents
  };
})();
