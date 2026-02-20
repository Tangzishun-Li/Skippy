const ImportUI = {
  init() {
    this.createImportModal();
    this.bindEvents();
  },
  
  createImportModal() {
    const modalHtml = `
      <div class="modal" id="importModal">
        <div class="modal-content">
          <span class="close" id="importModalClose">&times;</span>
          <h3>导入课程</h3>
          
          <div class="import-tabs">
            <button class="import-tab active" data-tab="google">Google日历</button>
            <button class="import-tab" data-tab="ics">ICS文件</button>
          </div>
          
          <div class="import-tab-content active" id="googleImport">
            <div class="form-group">
              <label for="googleCalendarUrl">Google日历链接：</label>
              <input type="text" id="googleCalendarUrl" placeholder="https://calendar.google.com/calendar/embed?src=...">
              <p class="help-text">请输入Google日历的公开链接或ICS地址</p>
            </div>
            <div class="form-group">
              <label>或使用示例：</label>
              <div class="sample-links">
                <button class="sample-link-btn" data-url="https://calendar.google.com/calendar/ical/zh-cn.chinese%23holiday@group.v.calendar.google.com/public/basic.ics">中国节假日</button>
                <button class="sample-link-btn" data-url="https://calendar.google.com/calendar/ical/en.usa%23holiday@group.v.calendar.google.com/public/basic.ics">美国节假日</button>
              </div>
            </div>
            <button id="importGoogleBtn" class="import-btn">导入Google日历</button>
          </div>
          
          <div class="import-tab-content" id="icsImport">
            <div class="form-group">
              <label for="icsFileInput">选择ICS文件：</label>
              <input type="file" id="icsFileInput" accept=".ics">
            </div>
            <button id="importIcsBtn" class="import-btn">导入ICS文件</button>
          </div>
          
          <div id="importStatus"></div>
          <div id="importPreview"></div>
        </div>
      </div>
    `;
    
    const container = document.createElement('div');
    container.innerHTML = modalHtml;
    document.body.appendChild(container);
  },
  
  bindEvents() {
    const importModal = document.getElementById('importModal');
    const importModalClose = document.getElementById('importModalClose');
    const importTabs = document.querySelectorAll('.import-tab');
    const importGoogleBtn = document.getElementById('importGoogleBtn');
    const importIcsBtn = document.getElementById('importIcsBtn');
    const sampleLinkBtns = document.querySelectorAll('.sample-link-btn');
    
    importModalClose.addEventListener('click', () => {
      importModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
      if (e.target === importModal) {
        importModal.style.display = 'none';
      }
    });
    
    importTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });
    
    sampleLinkBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('googleCalendarUrl').value = btn.dataset.url;
      });
    });
    
    importGoogleBtn.addEventListener('click', () => {
      this.importFromGoogle();
    });
    
    importIcsBtn.addEventListener('click', () => {
      this.importFromIcsFile();
    });
  },
  
  switchTab(tabName) {
    document.querySelectorAll('.import-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    document.querySelectorAll('.import-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}Import`);
    });
  },
  
  show() {
    const modal = document.getElementById('importModal');
    modal.style.display = 'block';
    this.clearStatus();
  },
  
  clearStatus() {
    document.getElementById('importStatus').innerHTML = '';
    document.getElementById('importPreview').innerHTML = '';
  },
  
  showStatus(message, type = 'info') {
    const status = document.getElementById('importStatus');
    status.innerHTML = `<div class="import-status import-status-${type}">${message}</div>`;
  },
  
  showPreview(courses) {
    const preview = document.getElementById('importPreview');
    if (!courses || courses.length === 0) {
      preview.innerHTML = '<p>未找到可导入的课程</p>';
      return;
    }
    
    let html = '<div class="import-preview"><h4>预览将要导入的课程：</h4><ul>';
    courses.forEach(course => {
      html += `<li>${course.name} - ${course.startTime} 至 ${course.endTime}</li>`;
    });
    html += '</ul><button id="confirmImportBtn" class="import-btn import-btn-confirm">确认导入</button></div>';
    
    preview.innerHTML = html;
    
    document.getElementById('confirmImportBtn').addEventListener('click', () => {
      this.confirmImport(courses);
    });
  },
  
  importFromGoogle() {
    const url = document.getElementById('googleCalendarUrl').value.trim();
    
    if (!url) {
      this.showStatus('请输入Google日历链接', 'error');
      return;
    }
    
    this.showStatus('正在获取日历数据...', 'info');
    
    GoogleCalendarImporter.parseUrl(url)
      .then(events => {
        if (!events || events.length === 0) {
          this.showStatus('未找到任何日历事件', 'error');
          return;
        }
        
        const courses = GoogleCalendarImporter.convertEventsToCourses(events);
        this.pendingCourses = courses;
        this.showPreview(courses);
        this.showStatus(`找到 ${events.length} 个事件，将生成 ${courses.length} 门课程`, 'success');
      })
      .catch(error => {
        this.showStatus(`导入失败: ${error.message}`, 'error');
      });
  },
  
  importFromIcsFile() {
    const fileInput = document.getElementById('icsFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
      this.showStatus('请选择ICS文件', 'error');
      return;
    }
    
    this.showStatus('正在解析ICS文件...', 'info');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const icsContent = e.target.result;
        const events = ICSParser.parse(icsContent);
        
        if (!events || events.length === 0) {
          this.showStatus('未找到任何日历事件', 'error');
          return;
        }
        
        const courses = GoogleCalendarImporter.convertEventsToCourses(events);
        this.pendingCourses = courses;
        this.showPreview(courses);
        this.showStatus(`找到 ${events.length} 个事件，将生成 ${courses.length} 门课程`, 'success');
      } catch (error) {
        this.showStatus(`解析失败: ${error.message}`, 'error');
      }
    };
    
    reader.onerror = () => {
      this.showStatus('读取文件失败', 'error');
    };
    
    reader.readAsText(file);
  },
  
  confirmImport(courses) {
    if (!courses || courses.length === 0) {
      this.showStatus('没有可导入的课程', 'error');
      return;
    }
    
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const frequency = document.getElementById('courseFrequency')?.value || 'weekly';
    const repeatCount = parseInt(document.getElementById('repeatCount')?.value) || 16;
    
    courses.forEach(course => {
      const courseDate = new Date(course.startDate);
      course.startDate = courseDate.toISOString();
      course.frequency = frequency;
      course.repeatCount = repeatCount;
      course.dayOfWeek = courseDate.getDay();
      course.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      const result = HolidayService.skipHolidays(courseDate, repeatCount, frequency);
      course.lessons = result.lessons;
      
      if (result.skippedDates.length > 0) {
        console.log(`课程 ${course.name} 跳过了节假日:`, result.skippedDates);
      }
      
      coursesData.push(course);
    });
    
    localStorage.setItem('courses', JSON.stringify(coursesData));
    
    this.showStatus(`成功导入 ${courses.length} 门课程!`, 'success');
    
    setTimeout(() => {
      document.getElementById('importModal').style.display = 'none';
      if (typeof renderCourses === 'function') renderCourses();
      if (typeof renderCalendar === 'function') renderCalendar();
      if (typeof showToast === 'function') showToast(`成功导入 ${courses.length} 门课程`);
    }, 1500);
  },
  
  setCoursesDataAccessor(accessor) {
    coursesData = accessor;
  }
};

let coursesData = courses;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImportUI;
}
