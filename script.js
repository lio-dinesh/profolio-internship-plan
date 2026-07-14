/**
 * PROFOLIO 7-Day Internship Tracker — script.js
 * Premium Glassmorphism Dashboard
 *
 * Architecture:
 *  - DAYS[]        → static source data for the 7-day plan (title, objective, tasks, deliverables)
 *  - state         → dynamic user progress (task completion, submissions, notes, active day)
 *  - loadState/saveState → localStorage persistence
 *  - renderSidebar, renderDayPanel, renderOverview, renderProgress → DOM rendering
 */

/* ─────────────────────────────────
   STATIC DAY DATA
───────────────────────────────── */
const SUBMISSION_FIELDS = [
  { id: 'date', label: 'Date', type: 'date', full: false },
  { id: 'group', label: 'Group', type: 'text', full: false, placeholder: 'e.g. Group A' },
  { id: 'name', label: 'Name', type: 'text', full: false, placeholder: 'Your full name' },
  { id: 'role', label: 'Role', type: 'text', full: false, placeholder: 'e.g. Developer' },
  { id: 'taskAssigned', label: 'Task Assigned', type: 'textarea', full: true, placeholder: 'What was assigned to you today' },
  { id: 'taskCompleted', label: 'Task Completed', type: 'textarea', full: true, placeholder: 'What you actually completed' },
  { id: 'proofOfWork', label: 'Proof of Work', type: 'proof', full: true, placeholder: 'Paste a link (GitHub, Drive, etc.)' },
  { id: 'challengesFaced', label: 'Challenges Faced', type: 'textarea', full: true, placeholder: 'Any blockers or difficulties' },
  { id: 'learningOutcome', label: 'Learning Outcome', type: 'textarea', full: true, placeholder: 'What you learned today' },
  { id: 'submittedOn', label: 'Submitted On', type: 'date', full: false }
];

const DAYS = [
  {
    id: 1,
    title: 'Professional Profile Setup & Introduction',
    objective: 'Establish your professional online presence and prepare your development environment for the internship.',
    tasks: [
      'Create or update LinkedIn profile',
      'Create GitHub account',
      'Upload a simple repository',
      'Set up the required development environment',
      'Prepare self-introduction document'
    ],
    deliverables: [
      'LinkedIn profile link',
      'GitHub profile & repository link',
      'Development environment setup screenshot',
      'Self-introduction document'
    ]
  },
  {
    id: 2,
    title: 'Research & Learning',
    objective: 'Build foundational knowledge of the assigned technology stack and standard development processes.',
    tasks: [
      'Learn assigned technology stack',
      'Learn Software Development Life Cycle (SDLC)',
      'Learn Git & GitHub basics',
      'Learn development workflow',
      'Prepare supporting references and 1-page research doc'
    ],
    deliverables: [
      '1-page research document',
      'List of supporting references'
    ]
  },
  {
    id: 3,
    title: 'Tool Learning',
    objective: 'Get hands-on with the tools and project structure used throughout the internship.',
    tasks: [
      'Learn GitHub workflow',
      'Learn VS Code',
      'Learn domain-related development tools',
      'Learn basic project structure',
      'Prepare practical demo proof'
    ],
    deliverables: [
      'Practical demo proof (screenshot, video, or link)'
    ]
  },
  {
    id: 4,
    title: 'Practical Assignment',
    objective: 'Apply what you have learned by building something real or completing an assigned task.',
    tasks: [
      'Build a small practical project',
      'Or complete an assigned coding/design task'
    ],
    deliverables: [
      'Completed project files or repository link'
    ]
  },
  {
    id: 5,
    title: 'Team Collaboration Activity',
    objective: 'Collaborate with your team to plan execution and clarify responsibilities.',
    tasks: [
      'Discuss technical execution plans',
      'Identify required resources',
      'Prepare responsibility chart'
    ],
    deliverables: [
      'Responsibility chart document'
    ]
  },
  {
    id: 6,
    title: 'Execution & Performance Task',
    objective: 'Refine your work and document the development process from start to finish.',
    tasks: [
      'Improve and finalize practical task/project',
      'Document development process'
    ],
    deliverables: [
      'Finalized project/task',
      'Development process documentation'
    ]
  },
  {
    id: 7,
    title: 'Final Review & Presentation',
    objective: 'Reflect on the internship and present your journey, outcomes, and future plans.',
    tasks: [
      'Introduce team members',
      'Summarize tasks completed',
      'Summarize skills learned',
      'Summarize challenges faced',
      'Summarize solutions implemented',
      'Present future improvement plan',
      'Include supporting materials and final report'
    ],
    deliverables: [
      'Final presentation file',
      'Final report',
      'Supporting materials'
    ]
  }
];

const STORAGE_KEY = 'profolioTrackerState';

/* ─────────────────────────────────
   STATE
───────────────────────────────── */
let state = {
  activeDay: 1,
  taskProgress: {},   // { "1": [true, false, ...], ... }
  submissions: {},    // { "1": { date, group, name, ... }, ... }
  proofFiles: {},     // { "1": [{ name, type, dataUrl }, ...], ... }
  notes: '',
  startTime: null     // Timestamp of when the internship started
};

function defaultTaskProgress(day) {
  return new Array(day.tasks.length).fill(false);
}

function defaultSubmission() {
  const obj = {};
  SUBMISSION_FIELDS.forEach(f => { obj[f.id] = ''; });
  return obj;
}

/* ─────────────────────────────────
   PERSISTENCE
───────────────────────────────── */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed) {
      state = {
        activeDay: parsed.activeDay || 1,
        taskProgress: parsed.taskProgress || {},
        submissions: parsed.submissions || {},
        proofFiles: parsed.proofFiles || {},
        notes: parsed.notes || '',
        startTime: parsed.startTime || null
      };
    }
  } catch {
    state = { activeDay: 1, taskProgress: {}, submissions: {}, proofFiles: {}, notes: '' };
  }

  // Ensure every day has initialized progress + submission objects
  DAYS.forEach(day => {
    const key = String(day.id);
    if (!state.taskProgress[key]) state.taskProgress[key] = defaultTaskProgress(day);
    if (!state.submissions[key]) state.submissions[key] = defaultSubmission();
    if (!state.proofFiles[key]) state.proofFiles[key] = [];
  });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ─────────────────────────────────
   STATUS / PROGRESS CALCULATIONS
───────────────────────────────── */
function getDayTaskStats(day) {
  const progress = state.taskProgress[String(day.id)] || [];
  const completed = progress.filter(Boolean).length;
  const total = day.tasks.length;
  return { completed, total, pct: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

function isSubmissionFilled(day) {
  const sub = state.submissions[String(day.id)] || {};
  return SUBMISSION_FIELDS.every(f => (sub[f.id] || '').trim().length > 0);
}

function getDayStatus(day) {
  const { completed, total } = getDayTaskStats(day);
  const submissionFilled = isSubmissionFilled(day);
  if (completed === total && submissionFilled) return 'completed';
  if (completed > 0 || submissionFilled) return 'in-progress';
  return 'pending';
}

function getOverallStats() {
  const totalDays = DAYS.length;
  const completedDays = DAYS.filter(d => getDayStatus(d) === 'completed').length;
  const pendingDays = totalDays - completedDays;
  const totalTasks = DAYS.reduce((sum, d) => sum + d.tasks.length, 0);
  const completedTasks = DAYS.reduce((sum, d) => sum + getDayTaskStats(d).completed, 0);
  const pct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  return { totalDays, completedDays, pendingDays, pct };
}

const STATUS_LABEL = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed'
};

/* ─────────────────────────────────
   RENDER: SIDEBAR NAV
───────────────────────────────── */
function renderSidebarNav() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = DAYS.map(day => {
    const status = getDayStatus(day);
    const active = day.id === state.activeDay ? 'active' : '';
    return `
      <button class="nav-day-item ${active}" data-day="${day.id}" aria-label="Day ${day.id}: ${escapeHtml(day.title)}">
        <span class="nav-day-number">${day.id}</span>
        <span class="nav-day-text">
          <span class="nav-day-title">Day ${day.id}</span>
          <span class="nav-day-label">${escapeHtml(day.title)}</span>
        </span>
        <span class="nav-day-dot status-${status}" title="${STATUS_LABEL[status]}"></span>
      </button>
    `;
  }).join('');
}

/* ─────────────────────────────────
   RENDER: OVERVIEW STATS + PROGRESS
───────────────────────────────── */
function renderOverview() {
  const { totalDays, completedDays, pendingDays, pct } = getOverallStats();
  document.getElementById('stat-total-days').textContent = totalDays;
  document.getElementById('stat-completed-days').textContent = completedDays;
  document.getElementById('stat-pending-days').textContent = pendingDays;
  document.getElementById('stat-progress-pct').textContent = pct + '%';

  document.getElementById('progress-pct-text').textContent = pct + '%';
  document.getElementById('progress-fill').style.width = pct + '%';

  const summary = document.getElementById('progress-summary');
  if (completedDays === 0 && pct === 0) {
    summary.textContent = 'Start your internship journey — select a day from the sidebar.';
  } else if (completedDays === totalDays) {
    summary.textContent = '🎉 All 7 days complete! Great work on finishing the internship.';
  } else {
    summary.textContent = `${completedDays} of ${totalDays} days completed (${pct}% overall progress). Keep going!`;
  }

  const dots = document.getElementById('day-dots');
  dots.innerHTML = DAYS.map(day => {
    const status = getDayStatus(day);
    const active = day.id === state.activeDay ? 'active' : '';
    return `<button class="day-dot ${active} status-${status}" data-day="${day.id}" title="Day ${day.id} — ${STATUS_LABEL[status]}">${day.id}</button>`;
  }).join('');
}

/* ─────────────────────────────────
   RENDER: DAY PANEL
───────────────────────────────── */
function renderDayPanel() {
  const day = DAYS.find(d => d.id === state.activeDay);
  const panel = document.getElementById('day-panel');
  if (!day) { panel.innerHTML = ''; return; }

  const status = getDayStatus(day);
  const { completed, total } = getDayTaskStats(day);
  const sub = state.submissions[String(day.id)] || defaultSubmission();

  const checklistHtml = day.tasks.map((task, idx) => {
    const done = !!(state.taskProgress[String(day.id)] || [])[idx];
    return `
      <label class="checklist-item ${done ? 'completed' : ''}" data-idx="${idx}">
        <input type="checkbox" class="checklist-checkbox" data-idx="${idx}" ${done ? 'checked' : ''} aria-label="${escapeHtml(task)}" />
        <span class="checklist-text">${escapeHtml(task)}</span>
      </label>
    `;
  }).join('');

  const deliverablesHtml = day.deliverables.map(item => `<li>${escapeHtml(item)}</li>`).join('');

  const proofFilesForDay = state.proofFiles[String(day.id)] || [];
  const proofPreviewsHtml = proofFilesForDay.map((f, idx) => {
    const isImage = f.type.startsWith('image/');
    const thumb = isImage
      ? `<img src="${f.dataUrl}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,0.15);" />`
      : `<div style="width:60px;height:60px;display:flex;align-items:center;justify-content:center;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);font-size:1.6rem;">📄</div>`;
    return `<div class="proof-thumb" data-idx="${idx}" style="position:relative;display:inline-block;margin:4px;">
      ${thumb}
      <button class="proof-remove-btn" data-idx="${idx}" title="Remove" style="position:absolute;top:-6px;right:-6px;background:#ef4444;color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;line-height:1;">✕</button>
      <div style="font-size:9px;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-muted);text-align:center;margin-top:2px;">${escapeHtml(f.name)}</div>
    </div>`;
  }).join('');

  const formFieldsHtml = SUBMISSION_FIELDS.map(f => {
    const value = escapeAttr(sub[f.id] || '');
    if (f.type === 'textarea') {
      return `
        <div class="form-group ${f.full ? 'full-width' : ''}">
          <label for="field-${f.id}">${f.label}</label>
          <textarea id="field-${f.id}" data-field="${f.id}" placeholder="${f.placeholder || ''}" rows="2">${escapeHtml(sub[f.id] || '')}</textarea>
        </div>
      `;
    }
    if (f.type === 'proof') {
      return `
        <div class="form-group full-width">
          <label>📎 ${f.label}</label>
          <input type="text" id="field-${f.id}" data-field="${f.id}" value="${value}" placeholder="${f.placeholder || ''}" style="margin-bottom:0.5rem;" />
          <div class="proof-upload-zone" id="proof-upload-zone">
            <input type="file" id="proof-file-input" multiple accept="image/*,.pdf" style="display:none;" />
            <button type="button" id="proof-upload-btn" class="btn btn-ghost" style="font-size:0.8rem;padding:0.45rem 1rem;">📂 Upload Files / Screenshots / PDFs</button>
            <div id="proof-previews" style="margin-top:0.6rem;display:flex;flex-wrap:wrap;gap:4px;">${proofPreviewsHtml}</div>
          </div>
        </div>
      `;
    }
    return `
      <div class="form-group ${f.full ? 'full-width' : ''}">
        <label for="field-${f.id}">${f.label}</label>
        <input type="${f.type}" id="field-${f.id}" data-field="${f.id}" value="${value}" placeholder="${f.placeholder || ''}" />
      </div>
    `;
  }).join('');

  const activeIdx = DAYS.findIndex(d => d.id === day.id);
  const prevDay = DAYS[activeIdx - 1];
  const nextDay = DAYS[activeIdx + 1];

  panel.innerHTML = `
    <article class="day-card glass-card">
      <div class="day-card-header">
        <div class="day-card-heading">
          <div>
            <span class="day-card-number">Day ${day.id} of ${DAYS.length}</span>
            <h2 class="day-card-title">${escapeHtml(day.title)}</h2>
            <p class="day-card-objective">${escapeHtml(day.objective)}</p>
          </div>
        </div>
        <span class="status-badge status-${status}">${STATUS_LABEL[status]}</span>
      </div>

      <div class="day-checklist-section">
        <h3 class="day-section-title">✅ Task Checklist <span class="day-progress-mini">(${completed}/${total} done)</span></h3>
        <div class="checklist">${checklistHtml}</div>
      </div>

      <div class="day-deliverables-section">
        <h3 class="day-section-title">📦 Deliverables & Proof Required</h3>
        <ul class="deliverables-list">${deliverablesHtml}</ul>
      </div>

      <div class="day-submission-section">
        <h3 class="day-section-title">🖊️ Submission Details</h3>
        <form class="submission-form" id="submission-form" autocomplete="off">
          <div class="form-grid">${formFieldsHtml}</div>
          <div class="form-save-row">
            <button type="submit" class="btn btn-primary">💾 Save Submission</button>
            <span class="save-indicator" id="save-indicator">Saved ✓</span>
          </div>
        </form>
      </div>

      <div class="day-nav-buttons">
        <button class="btn btn-ghost" id="prev-day-btn" ${prevDay ? '' : 'disabled style="visibility:hidden"'}>← Day ${prevDay ? prevDay.id : ''}</button>
        <button class="btn btn-ghost" id="next-day-btn" ${nextDay ? '' : 'disabled style="visibility:hidden"'}>Day ${nextDay ? nextDay.id : ''} →</button>
      </div>
    </article>
  `;

  attachDayPanelListeners(day);
}

function attachDayPanelListeners(day) {
  // Checklist toggles
  document.querySelectorAll('.checklist-checkbox').forEach(cb => {
    cb.addEventListener('change', e => {
      const idx = Number(e.target.dataset.idx);
      const key = String(day.id);
      state.taskProgress[key][idx] = e.target.checked;
      saveState();
      renderSidebarNav();
      renderOverview();
      renderDayPanel();
      showToast(e.target.checked ? '✅ Task marked complete' : '↩ Task marked pending', 'success');
    });
  });

  // Submission form save
  const form = document.getElementById('submission-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const key = String(day.id);
    const updated = {};
    SUBMISSION_FIELDS.forEach(f => {
      const el = document.getElementById(`field-${f.id}`);
      if (f.type === 'proof') {
        updated[f.id] = el ? el.value : '';
      } else {
        updated[f.id] = el ? el.value : '';
      }
    });
    state.submissions[key] = updated;
    saveState();
    renderSidebarNav();
    renderOverview();

    const badge = document.querySelector('.status-badge');
    const newStatus = getDayStatus(day);
    if (badge) {
      badge.className = `status-badge status-${newStatus}`;
      badge.textContent = STATUS_LABEL[newStatus];
    }

    const indicator = document.getElementById('save-indicator');
    indicator.classList.add('show');
    setTimeout(() => indicator.classList.remove('show'), 2200);
    showToast('💾 Submission saved!', 'success');
  });

  // Proof of Work file upload
  const proofUploadBtn = document.getElementById('proof-upload-btn');
  const proofFileInput = document.getElementById('proof-file-input');
  const proofPreviews = document.getElementById('proof-previews');

  if (proofUploadBtn && proofFileInput) {
    proofUploadBtn.addEventListener('click', () => proofFileInput.click());

    proofFileInput.addEventListener('change', e => {
      const key = String(day.id);
      const files = Array.from(e.target.files);
      let processed = 0;
      files.forEach(file => {
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
          showToast(`⚠️ Skipped "${file.name}" — only images and PDFs allowed`, 'error');
          return;
        }
        const reader = new FileReader();
        reader.onload = ev => {
          state.proofFiles[key].push({ name: file.name, type: file.type, dataUrl: ev.target.result });
          processed++;
          if (processed === files.length) {
            saveState();
            renderDayPanel();
            showToast(`✅ ${files.length} file(s) attached`, 'success');
          }
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    });

    // Remove proof file
    proofPreviews.addEventListener('click', e => {
      const btn = e.target.closest('.proof-remove-btn');
      if (!btn) return;
      const idx = Number(btn.dataset.idx);
      const key = String(day.id);
      state.proofFiles[key].splice(idx, 1);
      saveState();
      renderDayPanel();
      showToast('🗑️ File removed', 'info');
    });
  }

  // Prev / Next day navigation
  const prevBtn = document.getElementById('prev-day-btn');
  const nextBtn = document.getElementById('next-day-btn');
  if (prevBtn) prevBtn.addEventListener('click', () => goToDay(day.id - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToDay(day.id + 1));
}

/* ─────────────────────────────────
   DAY NAVIGATION
───────────────────────────────── */
function goToDay(dayId) {
  const day = DAYS.find(d => d.id === dayId);
  if (!day) return;
  state.activeDay = dayId;
  saveState();
  renderSidebarNav();
  renderOverview();
  renderDayPanel();
  closeMobileSidebar();
  document.getElementById('day-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ─────────────────────────────────
   MOBILE SIDEBAR
───────────────────────────────── */
function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('show');
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

/* ─────────────────────────────────
   NOTES
───────────────────────────────── */
let notesTimer = null;
function initNotes() {
  const area = document.getElementById('notes-area');
  area.value = state.notes || '';
  area.addEventListener('input', e => {
    state.notes = e.target.value;
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => {
      saveState();
      showToast('📝 Notes saved', 'info');
    }, 700);
  });
}

/* ─────────────────────────────────
   DATES
───────────────────────────────── */
function displayDates() {
  const now = new Date();
  const longOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const shortOptions = { month: 'short', day: 'numeric' };
  document.getElementById('header-date').textContent = now.toLocaleDateString('en-US', longOptions);
  document.getElementById('mobile-date').textContent = now.toLocaleDateString('en-US', shortOptions);
}

/* ─────────────────────────────────
   TOAST
───────────────────────────────── */
let toastTimer = null;
function showToast(message, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = `toast toast-${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ─────────────────────────────────
   UTILITY
───────────────────────────────── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  return escapeHtml(str);
}

/* ─────────────────────────────────
   PDF EXPORT — with Profolio "P" Watermark
───────────────────────────────── */

/**
 * Profolio "P" logo source.
 * Prefers the embedded base64 data URI from logo-data.js (loaded before this script)
 * for zero-CORS, offline-capable operation. Falls back to the local file path.
 */
const PROFOLIO_LOGO_SRC = (typeof PROFOLIO_LOGO_BASE64 !== 'undefined')
  ? PROFOLIO_LOGO_BASE64
  : 'assets/profolio-logo.png';

/**
 * Loads an image, removes white/near-white background pixels,
 * and returns a transparent-background PNG as a data URL.
 * @param {string} src - Path or data URL of the logo image
 * @param {number} whiteThreshold - RGB threshold (0-255). Pixels where R,G,B are all >= this value are made transparent.
 * @returns {Promise<string>} - Transparent PNG data URL
 */
function loadTransparentLogo(src, whiteThreshold = 230) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Make white / near-white pixels fully transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold) {
          data[i + 3] = 0; // alpha = 0 (transparent)
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load logo image'));
    img.src = src;
  });
}

/**
 * Adds a centered watermark image to every page of a jsPDF document.
 * @param {object} pdf - jsPDF instance
 * @param {string} watermarkDataUrl - Transparent PNG data URL of the watermark
 * @param {number} opacity - Watermark opacity (0-1), recommended 0.10–0.12
 */
function addWatermarkToAllPages(pdf, watermarkDataUrl, opacity = 0.11) {
  const totalPages = pdf.internal.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Watermark size — about 55% of the smaller page dimension for a prominent but subtle mark
  const watermarkSize = Math.min(pageWidth, pageHeight) * 0.55;
  const x = (pageWidth - watermarkSize) / 2;
  const y = (pageHeight - watermarkSize) / 2;

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    // Save current graphics state
    pdf.saveGraphicsState();

    // Set opacity via graphics state (GState)
    pdf.setGState(new pdf.GState({ opacity: opacity }));

    // Add the watermark image centered on the page
    pdf.addImage(
      watermarkDataUrl,
      'PNG',
      x,
      y,
      watermarkSize,
      watermarkSize
    );

    // Restore graphics state so content above remains fully opaque
    pdf.restoreGraphicsState();
  }
}

function generateReportHTML() {
  let html = `<div style="font-family: Arial, sans-serif; color: #000; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; box-sizing: border-box;">`;

  const day = DAYS.find(d => String(d.id) === String(state.activeDay));
  if (!day) return html + `</div>`;

  const key = String(day.id);
  const sub = state.submissions[key] || {};
  const files = state.proofFiles[key] || [];

  const formatText = (text) => text && text.trim() ? escapeHtml(text).replace(/\n/g, '<br>') : '<em>[Not provided]</em>';

  html += `
    <h1 style="text-align:center; font-size: 28px; text-transform:uppercase; margin-bottom: 30px; color: #111;">PROFOLIO INTERNSHIP DAY ${day.id}</h1>
    
    <div style="font-size:16px; line-height:1.8; margin-bottom: 40px; background: #f9f9f9; padding: 20px; border-radius: 8px;">
      <div style="margin-bottom: 10px;"><strong>Date:</strong> ${sub.date ? escapeHtml(sub.date) : '[Not provided]'}</div>
      <div style="margin-bottom: 10px;"><strong>Group:</strong> ${sub.group ? escapeHtml(sub.group) : '[Not provided]'}</div>
      <div style="margin-bottom: 10px;"><strong>Name:</strong> ${sub.name ? escapeHtml(sub.name) : '[Not provided]'}</div>
      <div style="margin-bottom: 10px;"><strong>Role:</strong> ${sub.role ? escapeHtml(sub.role) : '[Not provided]'}</div>
      <div><strong>Submitted On:</strong> ${sub.submittedOn ? escapeHtml(sub.submittedOn) : '[Not provided]'}</div>
    </div>
    
    <div style="font-size:16px; line-height:1.6;">
      <div style="margin-bottom: 30px;">
        <strong style="font-size: 18px; color: #000; display: block; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Task Assigned</strong>
        <div style="margin-top: 5px;">${formatText(sub.taskAssigned)}</div>
      </div>
      
      <div style="margin-bottom: 30px;">
        <strong style="font-size: 18px; color: #000; display: block; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Task Completed</strong>
        <div style="margin-top: 5px;">${formatText(sub.taskCompleted)}</div>
      </div>
      
      <div style="margin-bottom: 30px;">
        <strong style="font-size: 18px; color: #000; display: block; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Proof of Work</strong>
        <div style="margin-top: 5px;">
          ${sub.proofOfWork ? `<div style="margin-bottom: 15px;"><strong>Link:</strong> <a href="${escapeHtml(sub.proofOfWork)}" style="color: #0066cc;">${escapeHtml(sub.proofOfWork)}</a></div>` : ''}
          ${files.map(pf => {
            if (pf.type.startsWith('image/')) {
              return `<div style="margin-top: 15px; page-break-inside: avoid;"><img src="${pf.dataUrl}" style="max-width:100%; height:auto; border: 1px solid #ddd; border-radius: 4px; display: block;" /></div>`;
            } else {
              return `<div style="margin-top: 10px; padding: 10px; background: #eee; border-radius: 4px;">📄 Attached File: ${escapeHtml(pf.name)}</div>`;
            }
          }).join('')}
          ${!sub.proofOfWork && files.length === 0 ? '<em>[No proof provided]</em>' : ''}
        </div>
      </div>
      
      <div style="margin-bottom: 30px;">
        <strong style="font-size: 18px; color: #000; display: block; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Challenges Faced</strong>
        <div style="margin-top: 5px;">${formatText(sub.challengesFaced)}</div>
      </div>
      
      <div style="margin-bottom: 30px;">
        <strong style="font-size: 18px; color: #000; display: block; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Learning Outcome</strong>
        <div style="margin-top: 5px;">${formatText(sub.learningOutcome)}</div>
      </div>
    </div>
  `;

  html += `</div>`;
  return html;
}

async function exportPDF() {
  showToast('📄 Generating professional PDF report…', 'info');

  // ── Step 1: Pre-load & process the watermark logo (remove white bg) ──
  let watermarkDataUrl = null;
  try {
    watermarkDataUrl = await loadTransparentLogo(PROFOLIO_LOGO_SRC, 230);
  } catch (err) {
    console.warn('Watermark logo could not be loaded, PDF will be generated without watermark:', err);
  }

  // ── Step 2: Build the report HTML container ──
  const container = document.createElement('div');
  container.innerHTML = generateReportHTML();
  
  // Set explicit width for accurate rendering, but don't append to body
  container.style.width = '800px';
  container.style.background = '#ffffff';

  const opt = {
    margin: 10,
    filename: `Day_${state.activeDay}_Report.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    // ── Step 3 & 4: Generate PDF, inject watermark, and save ──
    await html2pdf()
      .set(opt)
      .from(container)
      .toPdf()
      .get('pdf')
      .then(pdf => {
        if (watermarkDataUrl) {
          addWatermarkToAllPages(pdf, watermarkDataUrl, 0.11);
        }
      })
      .save();

    showToast('✅ Professional PDF with watermark downloaded!', 'success');
  } catch (err) {
    console.error('PDF generation error:', err);
    showToast('❌ Error generating PDF', 'error');
  }
}

/* ─────────────────────────────────
   COUNTDOWN TIMER
───────────────────────────────── */
let countdownInterval = null;

function updateCountdownDisplay() {
  if (!state.startTime) return;

  const startBtn = document.getElementById('start-internship-btn');
  const timerDiv = document.getElementById('countdown-timer');
  const dayInfo = document.getElementById('countdown-day-info');

  if (startBtn) startBtn.style.display = 'none';
  if (timerDiv) timerDiv.style.display = 'block';

  const totalDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  const now = new Date().getTime();
  const elapsed = now - state.startTime;
  const remaining = totalDuration - elapsed;

  if (remaining <= 0) {
    document.getElementById('cd-days').textContent = '0';
    document.getElementById('cd-hours').textContent = '00';
    document.getElementById('cd-mins').textContent = '00';
    document.getElementById('cd-secs').textContent = '00';
    if (dayInfo) dayInfo.textContent = 'Internship Time Ended!';
    clearInterval(countdownInterval);
    return;
  }

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  document.getElementById('cd-days').textContent = days;
  document.getElementById('cd-hours').textContent = hours.toString().padStart(2, '0');
  document.getElementById('cd-mins').textContent = minutes.toString().padStart(2, '0');
  document.getElementById('cd-secs').textContent = seconds.toString().padStart(2, '0');
  
  const currentDayNumber = Math.min(7, Math.floor(elapsed / (1000 * 60 * 60 * 24)) + 1);
  if (dayInfo) dayInfo.textContent = `Currently on Day ${currentDayNumber} of 7`;
}

function initCountdown() {
  const startBtn = document.getElementById('start-internship-btn');
  if (!state.startTime) {
    if (startBtn) startBtn.style.display = 'inline-block';
    return;
  }
  updateCountdownDisplay();
  countdownInterval = setInterval(updateCountdownDisplay, 1000);
}

function handleStartInternship() {
  if (!state.startTime) {
    state.startTime = new Date().getTime();
    saveState();
    initCountdown();
    showToast('🚀 Internship Started! Good luck!', 'success');
  }
}

/* ─────────────────────────────────
   EVENT WIRING
───────────────────────────────── */
function initEventListeners() {
  // Sidebar day nav clicks
  document.getElementById('sidebar-nav').addEventListener('click', e => {
    const btn = e.target.closest('[data-day]');
    if (btn) goToDay(Number(btn.dataset.day));
  });

  // Day dots clicks
  document.getElementById('day-dots').addEventListener('click', e => {
    const btn = e.target.closest('[data-day]');
    if (btn) goToDay(Number(btn.dataset.day));
  });

  // Mobile hamburger
  document.getElementById('hamburger-btn').addEventListener('click', openMobileSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', closeMobileSidebar);

  // Close mobile sidebar on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMobileSidebar();
  });

  // Export PDF
  const exportPdfBtn = document.getElementById('export-pdf-btn');
  if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportPDF);

  // Start Internship
  const startBtn = document.getElementById('start-internship-btn');
  if (startBtn) startBtn.addEventListener('click', handleStartInternship);
}

/* ─────────────────────────────────
   INIT
───────────────────────────────── */
function init() {
  loadState();
  displayDates();
  renderSidebarNav();
  renderOverview();
  renderDayPanel();
  initNotes();
  initEventListeners();
  initCountdown();
}

document.addEventListener('DOMContentLoaded', init);
