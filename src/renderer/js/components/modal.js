(function() {
  'use strict';

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
    }
  }

  function initModalCloseEvents() {
    const modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
      window.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    });

    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) {
          modal.style.display = 'none';
        }
      });
    });
  }

  window.Modal = {
    open: openModal,
    close: closeModal,
    initCloseEvents: initModalCloseEvents
  };
})();
