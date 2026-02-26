(function() {
  const courseSettingsSidebar = document.getElementById('course-settings-sidebar');
  const closeCourseSettingsBtn = document.getElementById('close-course-settings');
  const openCourseSettingsBtn = document.getElementById('open-course-settings');

  const importSidebar = document.getElementById('import-sidebar');
  const closeImportSidebarBtn = document.getElementById('close-import-sidebar');
  const importToCourseListBtn = document.getElementById('import-to-course-list');

  const exportSidebar = document.getElementById('export-sidebar');
  const closeExportSidebarBtn = document.getElementById('close-export-sidebar');
  const exportFromCourseListBtn = document.getElementById('export-from-course-list');
  const sidebarExportBtn = document.getElementById('sidebar-export-btn');

  let courses = [];

  function loadCourses() {
    const storedCourses = localStorage.getItem('courses');
    if (storedCourses) {
      courses = JSON.parse(storedCourses);
    }
  }

  function saveCourses() {
    localStorage.setItem('courses', JSON.stringify(courses));
  }

  function toggleCourseSettings() {
    if (!courseSettingsSidebar) return;
    
    if (courseSettingsSidebar.classList.contains('show')) {
      closeCourseSettings();
    } else {
      openCourseSettings();
    }
  }

  function openCourseSettings() {
    loadCourses();
    courseSettingsSidebar.classList.remove('hidden');
    setTimeout(() => courseSettingsSidebar.classList.add('show'), 10);
  }

  function closeCourseSettings() {
    courseSettingsSidebar.classList.remove('show');
    setTimeout(() => courseSettingsSidebar.classList.add('hidden'), 300);
  }

  function toggleImportSidebar() {
    if (!importSidebar) return;
    
    if (importSidebar.classList.contains('show')) {
      closeImportSidebar();
    } else {
      openImportSidebar();
    }
  }

  function openImportSidebar() {
    closeCourseSettings();
    closeExportSidebar();
    importSidebar.classList.remove('hidden');
    setTimeout(() => importSidebar.classList.add('show'), 10);
  }

  function closeImportSidebar() {
    importSidebar.classList.remove('show');
    setTimeout(() => importSidebar.classList.add('hidden'), 300);
  }

  function toggleExportSidebar() {
    if (!exportSidebar) return;
    
    if (exportSidebar.classList.contains('show')) {
      closeExportSidebar();
    } else {
      openExportSidebar();
    }
  }

  function openExportSidebar() {
    closeCourseSettings();
    closeImportSidebar();
    exportSidebar.classList.remove('hidden');
    setTimeout(() => exportSidebar.classList.add('show'), 10);
  }

  function closeExportSidebar() {
    exportSidebar.classList.remove('show');
    setTimeout(() => exportSidebar.classList.add('hidden'), 300);
  }

  function handleExport() {
    if (typeof window.exportToICS === 'function') {
      window.exportToICS();
    }
  }

  function showToast(message, duration) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration || 3000);
  }

  function initCourseSettings() {
    if (!courseSettingsSidebar) return;

    closeCourseSettingsBtn.addEventListener('click', closeCourseSettings);

    if (openCourseSettingsBtn) {
      openCourseSettingsBtn.addEventListener('click', toggleCourseSettings);
    }

    if (closeImportSidebarBtn) {
      closeImportSidebarBtn.addEventListener('click', closeImportSidebar);
    }
    if (importToCourseListBtn) {
      importToCourseListBtn.addEventListener('click', toggleImportSidebar);
    }

    if (closeExportSidebarBtn) {
      closeExportSidebarBtn.addEventListener('click', closeExportSidebar);
    }
    if (exportFromCourseListBtn) {
      exportFromCourseListBtn.addEventListener('click', toggleExportSidebar);
    }
    if (sidebarExportBtn) {
      sidebarExportBtn.addEventListener('click', handleExport);
    }

    initImportSidebarTabs();
    initImportForms();
  }

  function initImportSidebarTabs() {
    const importSidebarEl = document.getElementById('import-sidebar');
    if (!importSidebarEl) return;

    const tabs = importSidebarEl.querySelectorAll('.import-tab');
    const googlePanel = importSidebarEl.querySelector('#sidebar-googlePanel');
    const icsPanel = importSidebarEl.querySelector('#sidebar-icsPanel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabName = tab.dataset.tab;
        if (tabName === 'google') {
          if (googlePanel) googlePanel.style.display = 'block';
          if (icsPanel) icsPanel.style.display = 'none';
        } else if (tabName === 'ics') {
          if (googlePanel) googlePanel.style.display = 'none';
          if (icsPanel) icsPanel.style.display = 'block';
        }
      });
    });
  }

  function initImportForms() {
    const importSidebarEl = document.getElementById('import-sidebar');
    if (!importSidebarEl) return;

    const googleImportForm = importSidebarEl.querySelector('#sidebar-googleImportForm');
    const icsImportForm = importSidebarEl.querySelector('#sidebar-icsImportForm');

    if (googleImportForm) {
      googleImportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = importSidebarEl.querySelector('#sidebar-googleCalendarUrl').value.trim();
        const resultDiv = importSidebarEl.querySelector('#sidebar-googleImportResult');

        resultDiv.className = 'loading';
        resultDiv.textContent = '正在获取日历数据...';
        resultDiv.style.display = 'block';

        const submitBtn = googleImportForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
          const icsContent = await window.fetchGoogleCalendar(url);
          const events = window.parseICS(icsContent);
          
          if (events.length === 0) {
            throw new Error('未找到任何日历事件');
          }
          
          const importedCourses = window.convertEventsToCourses(events);
          
          courses = [...courses, ...importedCourses];
          saveCourses();
          
          if (typeof window.renderCourses === 'function') {
            window.renderCourses();
          }
          if (typeof window.renderCalendar === 'function') {
            window.renderCalendar();
          }
          
          resultDiv.className = 'success';
          resultDiv.innerHTML = `<strong>导入成功！</strong><br>成功导入 ${importedCourses.length} 个课程/事件`;
          googleImportForm.reset();
          
          showToast(`成功导入 ${importedCourses.length} 个课程`);
        } catch (error) {
          resultDiv.className = 'error';
          resultDiv.textContent = '导入失败: ' + error.message;
        } finally {
          submitBtn.disabled = false;
        }
      });
    }

    if (icsImportForm) {
      icsImportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fileInput = importSidebarEl.querySelector('#sidebar-icsFile');
        const resultDiv = importSidebarEl.querySelector('#sidebar-icsImportResult');

        if (!fileInput.files.length) {
          resultDiv.className = 'error';
          resultDiv.textContent = '请选择ICS文件';
          resultDiv.style.display = 'block';
          return;
        }

        resultDiv.className = 'loading';
        resultDiv.textContent = '正在解析文件...';
        resultDiv.style.display = 'block';

        const submitBtn = icsImportForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        const reader = new FileReader();
        
        reader.onload = function(event) {
          try {
            const icsContent = event.target.result;
            const events = window.parseICS(icsContent);
            
            if (events.length === 0) {
              throw new Error('未找到任何日历事件');
            }
            
            const importedCourses = window.convertEventsToCourses(events);
            
            courses = [...courses, ...importedCourses];
            saveCourses();
            
            if (typeof window.renderCourses === 'function') {
              window.renderCourses();
            }
            if (typeof window.renderCalendar === 'function') {
              window.renderCalendar();
            }
            
            resultDiv.className = 'success';
            resultDiv.innerHTML = `<strong>导入成功！</strong><br>成功导入 ${importedCourses.length} 个课程/事件`;
            icsImportForm.reset();
            
            showToast(`成功导入 ${importedCourses.length} 个课程`);
          } catch (error) {
            resultDiv.className = 'error';
            resultDiv.textContent = '解析失败: ' + error.message;
          } finally {
            submitBtn.disabled = false;
          }
        };
        
        reader.onerror = function() {
          resultDiv.className = 'error';
          resultDiv.textContent = '文件读取失败';
          submitBtn.disabled = false;
        };
        
        reader.readAsText(fileInput.files[0]);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCourseSettings);
  } else {
    initCourseSettings();
  }

  window.openCourseSettings = openCourseSettings;
  window.closeCourseSettings = closeCourseSettings;
  window.toggleCourseSettings = toggleCourseSettings;
  window.openImportSidebar = openImportSidebar;
  window.closeImportSidebar = closeImportSidebar;
  window.openExportSidebar = openExportSidebar;
  window.closeExportSidebar = closeExportSidebar;
})();
