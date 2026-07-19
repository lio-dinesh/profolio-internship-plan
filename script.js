/**
 * PROFOLIO 7-Day Internship Tracker — script.js
 * Multi-Role Glassmorphism Dashboard with Supabase Integration
 *
 * Architecture:
 *  - DEVELOPER_DAYS / PROJECT_MANAGER_DAYS / SALES_EXECUTIVE_DAYS → role-specific task data
 *  - ALL_ROLE_DAYS   → map role key → days array
 *  - getActiveDays() → returns DAYS for the currently selected role
 *  - state           → dynamic user progress (role, tasks, submissions, notes)
 *  - Supabase client → cloud auth & persistence (with localStorage fallback)
 *  - renderDayCardsGrid, renderModal → new multi-role UI
 */

/* ════════════════════════════════════
   SUPABASE CONFIGURATION
   ════════════════════════════════════
   Replace these with your own Supabase project credentials.
   Get them from: Supabase Dashboard → Settings → API
*/
const SUPABASE_URL = 'https://hjwxfmjwmfyjzwaixtxq.supabase.co';         // e.g. 'https://xyzabc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqd3hmbWp3bWZ5anp3YWl4dHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNjA2NjQsImV4cCI6MjA5OTczNjY2NH0.t6xrFmgpiq3CqTvzuWFxyLZv29G7lwMUCl6RKvv6ZZ4A'; // e.g. 'eyJhb...'

/** Supabase client — initialized only when credentials are configured */
let supabaseClient = null;
try {
  if (
    SUPABASE_URL && SUPABASE_URL.startsWith('http') &&
    SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 20 &&
    typeof window.supabase !== 'undefined'
  ) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn('Supabase client initialization failed:', e);
}

function isSupabaseReady() {
  return supabaseClient !== null;
}

/* ════════════════════════════════════
   ROLE CONFIGURATION
   ════════════════════════════════════ */
const ROLE_CONFIG = {
  developer: {
    label: 'Developer',
    icon: '💻',
    dashTitle: 'Developer Internship Dashboard',
    accent: 'hsl(253, 88%, 70%)'
  },
  project_manager: {
    label: 'Project Manager',
    icon: '📋',
    dashTitle: 'Project Manager Internship Dashboard',
    accent: 'hsl(175, 70%, 50%)'
  },
  sales_executive: {
    label: 'Sales Executive',
    icon: '📈',
    dashTitle: 'Sales Executive Internship Dashboard',
    accent: 'hsl(38, 90%, 62%)'
  }
};

/* ════════════════════════════════════
   SUBMISSION FIELDS (shared across all roles)
   ════════════════════════════════════ */
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

/* ════════════════════════════════════
   DEVELOPER DAYS (existing, renamed from DAYS)
   ════════════════════════════════════ */
const DEVELOPER_DAYS = [
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

/* ════════════════════════════════════
   PROJECT MANAGER DAYS
   ════════════════════════════════════ */
const PROJECT_MANAGER_DAYS = [
  {
    id: 1,
    title: 'Profile Setup & PM Introduction',
    objective: 'Set up your professional LinkedIn profile, prepare an introduction document, and gain a foundational understanding of project management and the PROFOLIO workflow.',
    tasks: [
      'Create or update your LinkedIn profile with a professional summary',
      'Prepare a self-introduction document for the team',
      'Review the PROFOLIO project workflow and organizational structure',
      'Research basic project management principles and methodologies',
      'Familiarize yourself with team communication channels'
    ],
    deliverables: [
      'LinkedIn profile link',
      'Self-introduction document (PDF or Doc)',
      'Brief summary of PROFOLIO workflow understanding'
    ]
  },
  {
    id: 2,
    title: 'PM Fundamentals & Methodologies',
    objective: 'Study core project management concepts including Agile, Scrum frameworks, and the complete project lifecycle from initiation to closure.',
    tasks: [
      'Study project management fundamentals and key terminologies',
      'Learn Agile methodology — sprints, standups, retrospectives',
      'Understand Scrum framework — roles, ceremonies, artifacts',
      'Map out a typical project lifecycle from initiation to closure',
      'Prepare a one-page summary of PM methodologies learned'
    ],
    deliverables: [
      'PM methodologies summary document',
      'Project lifecycle diagram or flowchart'
    ]
  },
  {
    id: 3,
    title: 'PM Tools & Team Management',
    objective: 'Get hands-on with essential project management tools including Notion, Google Sheets, and task tracking systems for effective team coordination.',
    tasks: [
      'Set up and explore Notion for project documentation',
      'Create a Google Sheets template for task tracking',
      'Explore task management tools (Trello, Jira, or Asana)',
      'Learn team management and communication best practices',
      'Practice creating and organizing project boards'
    ],
    deliverables: [
      'Task tracking spreadsheet template',
      'Project board screenshot or link',
      'Tool comparison notes'
    ]
  },
  {
    id: 4,
    title: 'Project Planning & Timeline Creation',
    objective: 'Create a comprehensive project timeline, define task allocation across team members, and build a reusable progress tracking template.',
    tasks: [
      'Create a detailed project timeline with milestones',
      'Build a task allocation sheet assigning work to team members',
      'Design a progress tracking template with status indicators',
      'Define project scope, objectives, and key deliverables',
      'Set up a risk register identifying potential blockers'
    ],
    deliverables: [
      'Project timeline document',
      'Task allocation sheet',
      'Progress tracking template'
    ]
  },
  {
    id: 5,
    title: 'Team Meeting & Coordination',
    objective: 'Organize and lead a team meeting, document meeting minutes, assign clear responsibilities, and ensure alignment on project goals.',
    tasks: [
      'Prepare a meeting agenda with discussion points',
      'Organize and conduct a team meeting (virtual or in-person)',
      'Record detailed meeting minutes and action items',
      'Assign responsibilities with deadlines to team members',
      'Follow up on action items and confirm understanding'
    ],
    deliverables: [
      'Meeting agenda document',
      'Meeting minutes with action items',
      'Responsibility assignment chart'
    ]
  },
  {
    id: 6,
    title: 'Performance Monitoring & Reporting',
    objective: 'Monitor team performance against the project plan, prepare a comprehensive status report, and document issues with proposed solutions.',
    tasks: [
      'Track team performance against planned milestones',
      'Prepare a detailed project status report',
      'Identify and document blockers and issues faced',
      'Propose actionable solutions for each identified issue',
      'Update the project timeline based on current progress'
    ],
    deliverables: [
      'Project status report',
      'Issues and solutions document',
      'Updated project timeline'
    ]
  },
  {
    id: 7,
    title: 'Final Presentation & Review',
    objective: 'Prepare and deliver the final group presentation summarizing tasks completed, skills acquired, challenges overcome, and future plans.',
    tasks: [
      'Compile all deliverables from Days 1-6',
      'Create a final presentation covering project journey',
      'Summarize key tasks completed and milestones achieved',
      'Document skills learned and professional growth',
      'Outline challenges faced and solutions implemented',
      'Present future improvement plans and recommendations'
    ],
    deliverables: [
      'Final group presentation (PPT or PDF)',
      'Internship summary report',
      'Self-assessment document'
    ]
  }
];

/* ════════════════════════════════════
   SALES EXECUTIVE DAYS
   ════════════════════════════════════ */
const SALES_EXECUTIVE_DAYS = [
  {
    id: 1,
    title: 'Professional Profile & Service Research',
    objective: 'Set up your professional LinkedIn presence, create a polished self-introduction, and research PROFOLIO\'s services and value propositions.',
    tasks: [
      'Create or update LinkedIn profile with professional branding',
      'Prepare a professional self-introduction document',
      'Research PROFOLIO services, offerings, and target market',
      'Identify key value propositions and competitive advantages',
      'Study the company\'s online presence and social media'
    ],
    deliverables: [
      'LinkedIn profile link',
      'Self-introduction document',
      'PROFOLIO services research summary'
    ]
  },
  {
    id: 2,
    title: 'Sales & Marketing Fundamentals',
    objective: 'Learn digital marketing basics, understand the sales process from lead generation to closing, and study client acquisition strategies.',
    tasks: [
      'Study digital marketing fundamentals (SEO, social media, content)',
      'Learn the complete sales process from lead to close',
      'Research client acquisition methods and outreach strategies',
      'Practice crafting a service pitch for PROFOLIO offerings',
      'Prepare a one-page summary of sales concepts learned'
    ],
    deliverables: [
      'Sales concepts summary document',
      'Draft service pitch (text or slides)'
    ]
  },
  {
    id: 3,
    title: 'Sales Tools & Professional Communication',
    objective: 'Practice Google Sheets for data organization, learn basic CRM concepts, build LinkedIn networking skills, and master professional communication tools.',
    tasks: [
      'Create a Google Sheets tracker for leads and prospects',
      'Learn basic CRM concepts and workflow (HubSpot, Zoho, etc.)',
      'Practice LinkedIn networking — connect with 5+ professionals',
      'Learn professional email and communication templates',
      'Explore collaboration tools for sales teams'
    ],
    deliverables: [
      'Lead tracker spreadsheet',
      'LinkedIn networking screenshots',
      'Communication template samples'
    ]
  },
  {
    id: 4,
    title: 'Service Presentation & Pitch Strategy',
    objective: 'Prepare a compelling service presentation, create a sales pitch document, and develop a client approach strategy for PROFOLIO.',
    tasks: [
      'Create a professional service presentation (slides)',
      'Write a sales pitch document highlighting key benefits',
      'Develop a client approach strategy with target segments',
      'Practice presenting the pitch (record or rehearse)',
      'Collect feedback on pitch quality and clarity'
    ],
    deliverables: [
      'Service presentation (PPT or PDF)',
      'Sales pitch document',
      'Client approach strategy outline'
    ]
  },
  {
    id: 5,
    title: 'Client Acquisition Strategy Discussion',
    objective: 'Discuss client acquisition approaches with the team, brainstorm creative outreach ideas, and plan an actionable client engagement strategy.',
    tasks: [
      'Discuss client acquisition strategy with the team',
      'Brainstorm creative outreach and engagement ideas',
      'Identify target industries and client profiles',
      'Plan outreach channels (email, LinkedIn, calls, events)',
      'Document the finalized acquisition strategy'
    ],
    deliverables: [
      'Client acquisition strategy document',
      'Outreach channel plan',
      'Target client profile list'
    ]
  },
  {
    id: 6,
    title: 'Lead Generation & Outreach Planning',
    objective: 'Build a lead generation sheet with approximately 20 potential clients, categorize leads by priority, and outline a practical outreach strategy.',
    tasks: [
      'Research and list ~20 potential client leads',
      'Categorize leads by priority (hot, warm, cold)',
      'Add contact information and LinkedIn profiles for each lead',
      'Outline a personalized outreach strategy per category',
      'Draft initial outreach messages for top-priority leads'
    ],
    deliverables: [
      'Lead generation sheet (20+ leads)',
      'Categorized lead list with priorities',
      'Draft outreach messages'
    ]
  },
  {
    id: 7,
    title: 'Final Presentation & Sales Summary',
    objective: 'Help prepare the final group presentation materials and summarize all sales-side outcomes, learnings, and future recommendations.',
    tasks: [
      'Compile all sales deliverables from Days 1-6',
      'Create presentation slides for sales outcomes',
      'Summarize leads generated and outreach plans',
      'Document skills learned and professional growth',
      'Outline future recommendations for sales strategy',
      'Present during the final group presentation'
    ],
    deliverables: [
      'Final presentation materials (sales section)',
      'Sales outcomes summary report',
      'Future recommendations document'
    ]
  }
];

/* ════════════════════════════════════
   ROLE → DAYS MAPPING
   ════════════════════════════════════ */
const ALL_ROLE_DAYS = {
  developer: DEVELOPER_DAYS,
  project_manager: PROJECT_MANAGER_DAYS,
  sales_executive: SALES_EXECUTIVE_DAYS
};

/** Returns the DAYS array for the currently active role */
function getActiveDays() {
  return ALL_ROLE_DAYS[state.activeRole] || DEVELOPER_DAYS;
}

/* ════════════════════════════════════
   STATE
   ════════════════════════════════════ */
const STORAGE_KEY_PREFIX = 'profolioTracker_';

let state = {
  activeRole: 'developer',
  activeDay: 1,
  currentUser: null,    // Supabase user object (null if offline)
  userRole: 'developer', // Role from profile (set at signup)
  isOffline: false,      // True if "Continue Offline" was used
  taskProgress: {},      // { "1": [true, false, ...], ... }
  submissions: {},       // { "1": { date, group, name, ... }, ... }
  proofFiles: {},        // { "1": [{ name, type, dataUrl }, ...], ... }
  notes: '',
  startTime: null        // Timestamp of when the internship started
};

function getStorageKey() {
  return STORAGE_KEY_PREFIX + state.activeRole;
}

function defaultTaskProgress(day) {
  return new Array(day.tasks.length).fill(false);
}

function defaultSubmission() {
  const obj = {};
  SUBMISSION_FIELDS.forEach(f => { obj[f.id] = ''; });
  return obj;
}

/* ════════════════════════════════════
   PERSISTENCE — localStorage (offline fallback)
   ════════════════════════════════════ */
function loadState() {
  try {
    const raw = localStorage.getItem(getStorageKey());
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed) {
      state.activeDay = parsed.activeDay || 1;
      state.taskProgress = parsed.taskProgress || {};
      state.submissions = parsed.submissions || {};
      state.proofFiles = parsed.proofFiles || {};
      state.notes = parsed.notes || '';
      state.startTime = parsed.startTime || null;
    } else {
      // Reset role-specific state
      state.activeDay = 1;
      state.taskProgress = {};
      state.submissions = {};
      state.proofFiles = {};
      state.notes = '';
      state.startTime = null;
    }
  } catch {
    state.activeDay = 1;
    state.taskProgress = {};
    state.submissions = {};
    state.proofFiles = {};
    state.notes = '';
    state.startTime = null;
  }

  // Ensure every day has initialized progress + submission objects
  const days = getActiveDays();
  days.forEach(day => {
    const key = String(day.id);
    if (!state.taskProgress[key]) state.taskProgress[key] = defaultTaskProgress(day);
    if (!state.submissions[key]) state.submissions[key] = defaultSubmission();
    if (!state.proofFiles[key]) state.proofFiles[key] = [];
  });
}

function saveState() {
  const data = {
    activeDay: state.activeDay,
    taskProgress: state.taskProgress,
    submissions: state.submissions,
    proofFiles: state.proofFiles,
    notes: state.notes,
    startTime: state.startTime
  };
  localStorage.setItem(getStorageKey(), JSON.stringify(data));
}

/* ════════════════════════════════════
   SUPABASE PERSISTENCE
   ════════════════════════════════════ */
async function saveSubmissionToSupabase(dayNumber) {
  if (!isSupabaseReady() || !state.currentUser) return;

  const key = String(dayNumber);
  const sub = state.submissions[key] || {};
  const progress = state.taskProgress[key] || [];
  const status = getDayStatus(getActiveDays().find(d => d.id === dayNumber));

  try {
    await supabaseClient.from('submissions').upsert({
      user_id: state.currentUser.id,
      role: state.activeRole,
      day_number: dayNumber,
      date_field: sub.date || '',
      group_name: sub.group || '',
      user_name: sub.name || '',
      user_role: sub.role || '',
      task_assigned: sub.taskAssigned || '',
      task_completed: sub.taskCompleted || '',
      proof_of_work: sub.proofOfWork || '',
      challenges_faced: sub.challengesFaced || '',
      learning_outcome: sub.learningOutcome || '',
      submitted_on: sub.submittedOn || '',
      status: status,
      task_progress: progress
    }, { onConflict: 'user_id,role,day_number' });
  } catch (err) {
    console.warn('Failed to save to Supabase:', err);
  }
}

async function loadSubmissionsFromSupabase() {
  if (!isSupabaseReady() || !state.currentUser) return;

  try {
    const { data, error } = await supabaseClient
      .from('submissions')
      .select('*')
      .eq('user_id', state.currentUser.id)
      .eq('role', state.activeRole);

    if (error) throw error;
    if (!data || data.length === 0) return;

    data.forEach(row => {
      const key = String(row.day_number);
      state.submissions[key] = {
        date: row.date_field || '',
        group: row.group_name || '',
        name: row.user_name || '',
        role: row.user_role || '',
        taskAssigned: row.task_assigned || '',
        taskCompleted: row.task_completed || '',
        proofOfWork: row.proof_of_work || '',
        challengesFaced: row.challenges_faced || '',
        learningOutcome: row.learning_outcome || '',
        submittedOn: row.submitted_on || ''
      };
      if (row.task_progress && Array.isArray(row.task_progress)) {
        state.taskProgress[key] = row.task_progress;
      }
    });

    // Also save to localStorage as cache
    saveState();
  } catch (err) {
    console.warn('Failed to load from Supabase:', err);
  }
}

async function saveNotesToSupabase() {
  if (!isSupabaseReady() || !state.currentUser) return;
  try {
    await supabaseClient.from('notes').upsert({
      user_id: state.currentUser.id,
      role: state.activeRole,
      content: state.notes || ''
    }, { onConflict: 'user_id,role' });
  } catch (err) {
    console.warn('Failed to save notes to Supabase:', err);
  }
}

async function loadNotesFromSupabase() {
  if (!isSupabaseReady() || !state.currentUser) return;
  try {
    const { data } = await supabaseClient
      .from('notes')
      .select('content')
      .eq('user_id', state.currentUser.id)
      .eq('role', state.activeRole)
      .single();
    if (data) {
      state.notes = data.content || '';
    }
  } catch (err) {
    // No notes row yet — that's fine
  }
}

async function saveTimerToSupabase() {
  if (!isSupabaseReady() || !state.currentUser || !state.startTime) return;
  try {
    await supabaseClient.from('internship_timers').upsert({
      user_id: state.currentUser.id,
      role: state.activeRole,
      start_time: state.startTime
    }, { onConflict: 'user_id,role' });
  } catch (err) {
    console.warn('Failed to save timer to Supabase:', err);
  }
}

async function loadTimerFromSupabase() {
  if (!isSupabaseReady() || !state.currentUser) return;
  try {
    const { data } = await supabaseClient
      .from('internship_timers')
      .select('start_time')
      .eq('user_id', state.currentUser.id)
      .eq('role', state.activeRole)
      .single();
    if (data) {
      state.startTime = data.start_time;
    }
  } catch (err) {
    // No timer row yet — that's fine
  }
}

/* ════════════════════════════════════
   AUTHENTICATION
   ════════════════════════════════════ */
let selectedLoginRole = 'developer'; // tracks which role is selected on login form

async function handleSignUp(email, password) {
  if (!isSupabaseReady()) {
    showLoginError('Supabase is not configured. Use "Continue Offline" or add your Supabase credentials.');
    return;
  }

  try {
    showLoginError('');
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;

    if (data.session) {
      // User is fully logged in (Email confirmation is disabled)
      await supabaseClient.from('profiles').upsert({
        id: data.user.id,
        email: email,
        full_name: '',
        role: selectedLoginRole
      }, { onConflict: 'id' });

      state.currentUser = data.user;
      state.userRole = selectedLoginRole;
      state.activeRole = selectedLoginRole;
      state.isOffline = false;

      showToast('✨ Account created! Welcome to PROFOLIO!', 'success');
      showDashboard();
    } else if (data.user) {
      // Email confirmation is required
      showLoginError('Account created! Please check your email to confirm, or disable Email Confirmations in Supabase settings.');
    } else {
      showLoginError('Sign up failed. Please try again.');
    }
  } catch (err) {
    showLoginError(err.message || 'Sign up failed. Please try again.');
  }
}

async function handleSignIn(email, password) {
  if (!isSupabaseReady()) {
    showLoginError('Supabase is not configured. Use "Continue Offline" or add your Supabase credentials.');
    return;
  }

  try {
    showLoginError('');
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;

    state.currentUser = data.user;
    state.isOffline = false;

    // Fetch profile to get role
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile && profile.role) {
      state.userRole = profile.role;
      state.activeRole = profile.role;
    } else {
      state.userRole = selectedLoginRole;
      state.activeRole = selectedLoginRole;
      // create it if missing
      await supabaseClient.from('profiles').upsert({
        id: data.user.id,
        email: email,
        full_name: '',
        role: selectedLoginRole
      }, { onConflict: 'id' });
    }

    showToast('🔑 Signed in successfully!', 'success');
    showDashboard();
  } catch (err) {
    if (err.message.includes('Invalid login credentials')) {
      showLoginError('Invalid email or password. Did you Sign Up first?');
    } else {
      showLoginError(err.message || 'Sign in failed. Check your credentials.');
    }
  }
}

async function handleSignOut() {
  if (isSupabaseReady()) {
    try {
      await supabaseClient.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  }

  state.currentUser = null;
  state.isOffline = false;
  clearInterval(countdownInterval);
  showLoginScreen();
  showToast('🚪 Signed out successfully', 'info');
}

function handleOfflineMode() {
  state.currentUser = null;
  state.isOffline = true;
  state.activeRole = selectedLoginRole;
  state.userRole = selectedLoginRole;
  showToast('🔌 Continuing in offline mode', 'info');
  showDashboard();
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  if (el) el.textContent = msg;
}

/* ════════════════════════════════════
   UI SCREEN SWITCHING
   ════════════════════════════════════ */
function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('dashboard-container').style.display = 'none';
  document.getElementById('submission-modal').style.display = 'none';
}

function showDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard-container').style.display = 'block';

  // Initialize dashboard for current role
  loadState();
  initDashboard();
}

async function initDashboard() {
  displayDates();
  updateRoleUI();

  // Load from Supabase if available
  if (isSupabaseReady() && state.currentUser) {
    await loadSubmissionsFromSupabase();
    await loadNotesFromSupabase();
    await loadTimerFromSupabase();
  }

  renderSidebarNav();
  renderOverview();
  renderDayCardsGrid();
  renderDayPanel();
  initNotes();
  initCountdown();
}

/* ════════════════════════════════════
   ROLE SWITCHING
   ════════════════════════════════════ */
function switchRole(newRole) {
  if (newRole === state.activeRole) return;

  // Save current role state
  saveState();

  // Switch
  state.activeRole = newRole;
  state.activeDay = 1;

  // Load new role state
  loadState();
  updateRoleUI();

  // Load from Supabase for this role
  if (isSupabaseReady() && state.currentUser) {
    loadSubmissionsFromSupabase().then(() => {
      loadNotesFromSupabase().then(() => {
        loadTimerFromSupabase().then(() => {
          renderAll();
          initNotes();
          initCountdown();
        });
      });
    });
  } else {
    renderAll();
    initNotes();
    initCountdown();
  }
}

function updateRoleUI() {
  const config = ROLE_CONFIG[state.activeRole] || ROLE_CONFIG.developer;

  // Update dashboard title
  const title = document.getElementById('dash-title');
  if (title) title.textContent = config.dashTitle;

  // Update sidebar role badge
  const badge = document.getElementById('sidebar-role-badge');
  if (badge) {
    badge.setAttribute('data-role', state.activeRole);
    document.getElementById('sidebar-role-icon').textContent = config.icon;
    document.getElementById('sidebar-role-name').textContent = config.label;
  }

  // Update role selector tabs
  document.querySelectorAll('.role-selector-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.role === state.activeRole);
  });
}

function renderAll() {
  renderSidebarNav();
  renderOverview();
  renderDayCardsGrid();
  renderDayPanel();
}

/* ════════════════════════════════════
   STATUS / PROGRESS CALCULATIONS
   ════════════════════════════════════ */
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
  const ACTIVE_DAYS = getActiveDays();
  const totalDays = ACTIVE_DAYS.length;
  const completedDays = ACTIVE_DAYS.filter(d => getDayStatus(d) === 'completed').length;
  const pendingDays = totalDays - completedDays;
  const totalTasks = ACTIVE_DAYS.reduce((sum, d) => sum + d.tasks.length, 0);
  const completedTasks = ACTIVE_DAYS.reduce((sum, d) => sum + getDayTaskStats(d).completed, 0);
  const pct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  return { totalDays, completedDays, pendingDays, pct };
}

const STATUS_LABEL = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed'
};

/* ════════════════════════════════════
   RENDER: SIDEBAR NAV
   ════════════════════════════════════ */
function renderSidebarNav() {
  const nav = document.getElementById('sidebar-nav');
  const days = getActiveDays();
  nav.innerHTML = days.map(day => {
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

/* ════════════════════════════════════
   RENDER: OVERVIEW STATS + PROGRESS
   ════════════════════════════════════ */
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
    summary.textContent = 'Start your internship journey — click a day card below.';
  } else if (completedDays === totalDays) {
    summary.textContent = '🎉 All 7 days complete! Great work on finishing the internship.';
  } else {
    summary.textContent = `${completedDays} of ${totalDays} days completed (${pct}% overall progress). Keep going!`;
  }

  const days = getActiveDays();
  const dots = document.getElementById('day-dots');
  dots.innerHTML = days.map(day => {
    const status = getDayStatus(day);
    const active = day.id === state.activeDay ? 'active' : '';
    return `<button class="day-dot ${active} status-${status}" data-day="${day.id}" title="Day ${day.id} — ${STATUS_LABEL[status]}">${day.id}</button>`;
  }).join('');
}

/* ════════════════════════════════════
   RENDER: DAY CARDS GRID (7 glass cards)
   ════════════════════════════════════ */
function renderDayCardsGrid() {
  const grid = document.getElementById('day-cards-grid');
  const days = getActiveDays();

  grid.innerHTML = days.map(day => {
    const status = getDayStatus(day);
    const { completed, total } = getDayTaskStats(day);
    const summaryText = day.tasks.slice(0, 3).join(' • ');

    return `
      <div class="day-grid-card status-${status}" data-day="${day.id}" tabindex="0" role="button" aria-label="Open Day ${day.id}: ${escapeHtml(day.title)}">
        <div class="day-grid-card-header">
          <span class="day-grid-num">Day ${day.id}</span>
          <span class="status-badge-sm status-${status}">${STATUS_LABEL[status]}</span>
        </div>
        <h3 class="day-grid-card-title">${escapeHtml(day.title)}</h3>
        <p class="day-grid-card-summary">${escapeHtml(summaryText)}</p>
        <div class="day-grid-card-footer">
          <span class="day-grid-task-count">${completed}/${total} tasks done</span>
          <span class="day-grid-task-count">${day.deliverables.length} deliverables</span>
        </div>
      </div>
    `;
  }).join('');
}

/* ════════════════════════════════════
   RENDER: DAY PANEL (inline, below grid)
   ════════════════════════════════════ */
function renderDayPanel() {
  const days = getActiveDays();
  const day = days.find(d => d.id === state.activeDay);
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

  const activeIdx = days.findIndex(d => d.id === day.id);
  const prevDay = days[activeIdx - 1];
  const nextDay = days[activeIdx + 1];

  panel.innerHTML = `
    <article class="day-card glass-card">
      <div class="day-card-header">
        <div class="day-card-heading">
          <div>
            <span class="day-card-number">Day ${day.id} of ${days.length}</span>
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

/* ════════════════════════════════════
   RENDER: MODAL (opened on day card click)
   ════════════════════════════════════ */
function openModal(dayId) {
  const days = getActiveDays();
  const day = days.find(d => d.id === dayId);
  if (!day) return;

  state.activeDay = dayId;
  saveState();

  // Update sidebar active state
  renderSidebarNav();
  renderOverview();
  renderDayCardsGrid();

  const modal = document.getElementById('submission-modal');
  const badge = document.getElementById('modal-day-badge');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  badge.textContent = `Day ${day.id}`;
  title.textContent = escapeHtml(day.title);

  const status = getDayStatus(day);
  const { completed, total } = getDayTaskStats(day);
  const sub = state.submissions[String(day.id)] || defaultSubmission();

  const checklistHtml = day.tasks.map((task, idx) => {
    const done = !!(state.taskProgress[String(day.id)] || [])[idx];
    return `
      <label class="checklist-item ${done ? 'completed' : ''}" data-idx="${idx}">
        <input type="checkbox" class="modal-checklist-checkbox" data-idx="${idx}" ${done ? 'checked' : ''} aria-label="${escapeHtml(task)}" />
        <span class="checklist-text">${escapeHtml(task)}</span>
      </label>
    `;
  }).join('');

  const deliverablesHtml = day.deliverables.map(item => `<li>${escapeHtml(item)}</li>`).join('');

  // Auto-fill taskAssigned from the day's tasks if not already set
  let taskAssignedValue = sub.taskAssigned || '';
  if (!taskAssignedValue.trim()) {
    taskAssignedValue = day.tasks.join('\n');
  }

  const formFieldsHtml = SUBMISSION_FIELDS.map(f => {
    let value = escapeAttr(sub[f.id] || '');
    let textValue = sub[f.id] || '';

    // Auto-fill taskAssigned
    if (f.id === 'taskAssigned') {
      value = escapeAttr(taskAssignedValue);
      textValue = taskAssignedValue;
    }
    // Auto-fill submittedOn with today's date
    if (f.id === 'submittedOn' && !value) {
      value = new Date().toISOString().split('T')[0];
    }
    // Auto-fill role
    if (f.id === 'role' && !value) {
      const config = ROLE_CONFIG[state.activeRole];
      value = escapeAttr(config ? config.label : '');
    }

    if (f.type === 'textarea') {
      return `
        <div class="form-group ${f.full ? 'full-width' : ''}">
          <label for="modal-field-${f.id}">${f.label}</label>
          <textarea id="modal-field-${f.id}" data-field="${f.id}" placeholder="${f.placeholder || ''}" rows="2">${escapeHtml(textValue)}</textarea>
        </div>
      `;
    }
    if (f.type === 'proof') {
      return `
        <div class="form-group full-width">
          <label>📎 ${f.label}</label>
          <input type="text" id="modal-field-${f.id}" data-field="${f.id}" value="${value}" placeholder="${f.placeholder || ''}" />
        </div>
      `;
    }
    return `
      <div class="form-group ${f.full ? 'full-width' : ''}">
        <label for="modal-field-${f.id}">${f.label}</label>
        <input type="${f.type}" id="modal-field-${f.id}" data-field="${f.id}" value="${value}" placeholder="${f.placeholder || ''}" />
      </div>
    `;
  }).join('');

  body.innerHTML = `
    <div>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${escapeHtml(day.objective)}</p>
      <span class="status-badge status-${status}">${STATUS_LABEL[status]}</span>
    </div>

    <div>
      <h3 class="day-section-title">✅ Task Checklist <span class="day-progress-mini">(${completed}/${total} done)</span></h3>
      <div class="checklist">${checklistHtml}</div>
    </div>

    <div>
      <h3 class="day-section-title">📦 Deliverables</h3>
      <ul class="deliverables-list">${deliverablesHtml}</ul>
    </div>

    <div>
      <h3 class="day-section-title">🖊️ Daily Submission Template</h3>
      <form class="submission-form" id="modal-submission-form" autocomplete="off">
        <div class="form-grid">${formFieldsHtml}</div>
        <div class="form-save-row">
          <button type="submit" class="btn btn-primary">💾 Save Submission</button>
          <span class="save-indicator" id="modal-save-indicator">Saved ✓</span>
        </div>
      </form>
    </div>
  `;

  modal.style.display = 'flex';
  attachModalListeners(day);
}

function closeModal() {
  document.getElementById('submission-modal').style.display = 'none';
  // Re-render the day panel and grid after modal closes
  renderDayPanel();
  renderDayCardsGrid();
  renderOverview();
}

function attachModalListeners(day) {
  // Checklist toggles inside modal
  document.querySelectorAll('.modal-checklist-checkbox').forEach(cb => {
    cb.addEventListener('change', e => {
      const idx = Number(e.target.dataset.idx);
      const key = String(day.id);
      state.taskProgress[key][idx] = e.target.checked;
      saveState();
      saveSubmissionToSupabase(day.id);

      // Update the checklist UI
      const label = e.target.closest('.checklist-item');
      if (label) label.classList.toggle('completed', e.target.checked);

      // Update counter
      const { completed, total } = getDayTaskStats(day);
      const mini = document.querySelector('.modal-body .day-progress-mini');
      if (mini) mini.textContent = `(${completed}/${total} done)`;

      // Update status badge in modal
      const newStatus = getDayStatus(day);
      const badge = document.querySelector('.modal-body .status-badge');
      if (badge) {
        badge.className = `status-badge status-${newStatus}`;
        badge.textContent = STATUS_LABEL[newStatus];
      }

      showToast(e.target.checked ? '✅ Task marked complete' : '↩ Task marked pending', 'success');
    });
  });

  // Modal submission form
  const form = document.getElementById('modal-submission-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const key = String(day.id);
      const updated = {};
      SUBMISSION_FIELDS.forEach(f => {
        const el = document.getElementById(`modal-field-${f.id}`);
        updated[f.id] = el ? el.value : '';
      });
      state.submissions[key] = updated;
      saveState();
      saveSubmissionToSupabase(day.id);

      // Show saved indicator
      const indicator = document.getElementById('modal-save-indicator');
      if (indicator) {
        indicator.classList.add('show');
        setTimeout(() => indicator.classList.remove('show'), 2200);
      }

      // Update status badge in modal
      const newStatus = getDayStatus(day);
      const badge = document.querySelector('.modal-body .status-badge');
      if (badge) {
        badge.className = `status-badge status-${newStatus}`;
        badge.textContent = STATUS_LABEL[newStatus];
      }

      showToast('💾 Submission saved! Generating PDF...', 'success');
      exportPDF();
    });
  }
}

/* ════════════════════════════════════
   DAY PANEL LISTENERS (inline panel)
   ════════════════════════════════════ */
function attachDayPanelListeners(day) {
  // Checklist toggles
  document.querySelectorAll('.checklist-checkbox').forEach(cb => {
    cb.addEventListener('change', e => {
      const idx = Number(e.target.dataset.idx);
      const key = String(day.id);
      state.taskProgress[key][idx] = e.target.checked;
      saveState();
      saveSubmissionToSupabase(day.id);
      renderSidebarNav();
      renderOverview();
      renderDayCardsGrid();
      renderDayPanel();
      showToast(e.target.checked ? '✅ Task marked complete' : '↩ Task marked pending', 'success');
    });
  });

  // Submission form save
  const form = document.getElementById('submission-form');
  if (form) {
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
      saveSubmissionToSupabase(day.id);
      renderSidebarNav();
      renderOverview();
      renderDayCardsGrid();

      const badge = document.querySelector('.day-panel .status-badge');
      const newStatus = getDayStatus(day);
      if (badge) {
        badge.className = `status-badge status-${newStatus}`;
        badge.textContent = STATUS_LABEL[newStatus];
      }

      const indicator = document.getElementById('save-indicator');
      if (indicator) {
        indicator.classList.add('show');
        setTimeout(() => indicator.classList.remove('show'), 2200);
      }
      showToast('💾 Submission saved! Generating PDF...', 'success');
      exportPDF();
    });
  }

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
    if (proofPreviews) {
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
  }

  // Prev / Next day navigation
  const prevBtn = document.getElementById('prev-day-btn');
  const nextBtn = document.getElementById('next-day-btn');
  if (prevBtn) prevBtn.addEventListener('click', () => goToDay(day.id - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToDay(day.id + 1));
}

/* ════════════════════════════════════
   DAY NAVIGATION
   ════════════════════════════════════ */
function goToDay(dayId) {
  const days = getActiveDays();
  const day = days.find(d => d.id === dayId);
  if (!day) return;
  state.activeDay = dayId;
  saveState();
  renderSidebarNav();
  renderOverview();
  renderDayCardsGrid();
  renderDayPanel();
  closeMobileSidebar();
  document.getElementById('day-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ════════════════════════════════════
   MOBILE SIDEBAR
   ════════════════════════════════════ */
function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('show');
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

/* ════════════════════════════════════
   NOTES
   ════════════════════════════════════ */
let notesTimer = null;
function initNotes() {
  const area = document.getElementById('notes-area');
  if (!area) return;
  area.value = state.notes || '';
  // Remove old listeners by cloning
  const newArea = area.cloneNode(true);
  area.parentNode.replaceChild(newArea, area);
  newArea.value = state.notes || '';
  newArea.addEventListener('input', e => {
    state.notes = e.target.value;
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => {
      saveState();
      saveNotesToSupabase();
      showToast('📝 Notes saved', 'info');
    }, 700);
  });
}

/* ════════════════════════════════════
   DATES
   ════════════════════════════════════ */
function displayDates() {
  const now = new Date();
  const longOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const shortOptions = { month: 'short', day: 'numeric' };
  const headerDate = document.getElementById('header-date');
  const mobileDate = document.getElementById('mobile-date');
  if (headerDate) headerDate.textContent = now.toLocaleDateString('en-US', longOptions);
  if (mobileDate) mobileDate.textContent = now.toLocaleDateString('en-US', shortOptions);
}

/* ════════════════════════════════════
   TOAST
   ════════════════════════════════════ */
let toastTimer = null;
function showToast(message, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.className = `toast toast-${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ════════════════════════════════════
   UTILITY
   ════════════════════════════════════ */
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

/* ════════════════════════════════════
   PDF EXPORT — with Profolio "P" Watermark
   ════════════════════════════════════ */

const PROFOLIO_LOGO_SRC = (typeof PROFOLIO_LOGO_BASE64 !== 'undefined')
  ? PROFOLIO_LOGO_BASE64
  : 'assets/profolio-logo.png';

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

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load logo image'));
    img.src = src;
  });
}

function addWatermarkToAllPages(pdf, watermarkDataUrl, opacity = 0.11) {
  const totalPages = pdf.internal.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const watermarkSize = Math.min(pageWidth, pageHeight) * 0.55;
  const x = (pageWidth - watermarkSize) / 2;
  const y = (pageHeight - watermarkSize) / 2;

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.saveGraphicsState();
    pdf.setGState(new pdf.GState({ opacity: opacity }));
    pdf.addImage(watermarkDataUrl, 'PNG', x, y, watermarkSize, watermarkSize);
    pdf.restoreGraphicsState();
  }
}

function generateReportHTML() {
  const days = getActiveDays();
  let html = `<div style="font-family: Arial, sans-serif; color: #000; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; box-sizing: border-box;">`;

  const day = days.find(d => String(d.id) === String(state.activeDay));
  if (!day) return html + `</div>`;

  const key = String(day.id);
  const sub = state.submissions[key] || {};
  const files = state.proofFiles[key] || [];
  const roleLabel = (ROLE_CONFIG[state.activeRole] || {}).label || 'Intern';

  const formatText = (text) => text && text.trim() ? escapeHtml(text).replace(/\n/g, '<br>') : '<em>[Not provided]</em>';

  html += `
    <h1 style="text-align:center; font-size: 28px; text-transform:uppercase; margin-bottom: 30px; color: #111;">PROFOLIO INTERNSHIP DAY ${day.id} — ${escapeHtml(roleLabel)}</h1>
    
    <div style="font-size:16px; line-height:1.8; margin-bottom: 40px; background: #f9f9f9; padding: 20px; border-radius: 8px;">
      <div style="margin-bottom: 10px;"><strong>Date:</strong> ${sub.date ? escapeHtml(sub.date) : '[Not provided]'}</div>
      <div style="margin-bottom: 10px;"><strong>Group:</strong> ${sub.group ? escapeHtml(sub.group) : '[Not provided]'}</div>
      <div style="margin-bottom: 10px;"><strong>Name:</strong> ${sub.name ? escapeHtml(sub.name) : '[Not provided]'}</div>
      <div style="margin-bottom: 10px;"><strong>Role:</strong> ${sub.role ? escapeHtml(sub.role) : escapeHtml(roleLabel)}</div>
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

  let watermarkDataUrl = null;
  try {
    watermarkDataUrl = await loadTransparentLogo(PROFOLIO_LOGO_SRC, 230);
  } catch (err) {
    console.warn('Watermark logo could not be loaded, PDF will be generated without watermark:', err);
  }

  const container = document.createElement('div');
  container.innerHTML = generateReportHTML();

  container.style.width = '800px';
  container.style.background = '#ffffff';

  const roleLabel = (ROLE_CONFIG[state.activeRole] || {}).label || 'Intern';
  const opt = {
    margin: 10,
    filename: `Day_${state.activeDay}_${roleLabel.replace(/\s+/g, '_')}_Report.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
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

/* ════════════════════════════════════
   COUNTDOWN TIMER
   ════════════════════════════════════ */
let countdownInterval = null;

function updateCountdownDisplay() {
  if (!state.startTime) return;

  const startBtn = document.getElementById('start-internship-btn');
  const timerDiv = document.getElementById('countdown-timer');
  const dayInfo = document.getElementById('countdown-day-info');

  if (startBtn) startBtn.style.display = 'none';
  if (timerDiv) timerDiv.style.display = 'block';

  const totalDuration = 7 * 24 * 60 * 60 * 1000;
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
  clearInterval(countdownInterval);
  const startBtn = document.getElementById('start-internship-btn');
  const timerDiv = document.getElementById('countdown-timer');

  if (!state.startTime) {
    if (startBtn) startBtn.style.display = 'inline-block';
    if (timerDiv) timerDiv.style.display = 'none';
    return;
  }
  updateCountdownDisplay();
  countdownInterval = setInterval(updateCountdownDisplay, 1000);
}

function handleStartInternship() {
  if (!state.startTime) {
    state.startTime = new Date().getTime();
    saveState();
    saveTimerToSupabase();
    initCountdown();
    showToast('🚀 Internship Started! Good luck!', 'success');
  }
}

/* ════════════════════════════════════
   EVENT WIRING
   ════════════════════════════════════ */
function initEventListeners() {
  // ── Login screen events ──

  // Login role tabs
  document.getElementById('login-role-tabs').addEventListener('click', e => {
    const tab = e.target.closest('.login-role-tab');
    if (!tab) return;
    selectedLoginRole = tab.dataset.role;
    document.querySelectorAll('.login-role-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });

  // Sign In form submit
  document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    handleSignIn(email, password);
  });

  // Sign Up button
  document.getElementById('login-signup-btn').addEventListener('click', () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || password.length < 6) {
      showLoginError('Enter a valid email and password (min 6 characters).');
      return;
    }
    handleSignUp(email, password);
  });

  // Google Sign In
  const googleBtn = document.getElementById('login-google-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', handleGoogleSignIn);
  }

  // Continue Offline
  document.getElementById('login-offline-btn').addEventListener('click', handleOfflineMode);

  // ── Dashboard events ──

  // Role selector tabs
  document.getElementById('role-selector-bar').addEventListener('click', e => {
    const tab = e.target.closest('.role-selector-tab');
    if (tab) switchRole(tab.dataset.role);
  });

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

  // Day cards grid clicks → open modal
  document.getElementById('day-cards-grid').addEventListener('click', e => {
    const card = e.target.closest('.day-grid-card');
    if (card) openModal(Number(card.dataset.day));
  });

  // Day cards grid keyboard support
  document.getElementById('day-cards-grid').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.day-grid-card');
      if (card) {
        e.preventDefault();
        openModal(Number(card.dataset.day));
      }
    }
  });

  // Modal close
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('submission-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Mobile hamburger
  document.getElementById('hamburger-btn').addEventListener('click', openMobileSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', closeMobileSidebar);

  // Close mobile sidebar / modal on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeMobileSidebar();
      if (document.getElementById('submission-modal').style.display !== 'none') {
        closeModal();
      }
    }
  });

  // Export PDF
  const exportPdfBtn = document.getElementById('export-pdf-btn');
  if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportPDF);

  // Start Internship
  const startBtn = document.getElementById('start-internship-btn');
  if (startBtn) startBtn.addEventListener('click', handleStartInternship);

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleSignOut);
}

/* ════════════════════════════════════
   GOOGLE AUTH & INIT
   ════════════════════════════════════ */

// Google Auth: login
async function handleGoogleSignIn() {
  if (!isSupabaseReady()) {
    showLoginError('Supabase is not configured. Use "Continue Offline" or add your Supabase credentials.');
    return;
  }

  try {
    showLoginError('');
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  } catch (err) {
    console.error('Google Sign-In Error:', err);
    showLoginError('Failed to sign in with Google.');
  }
}

// Google Auth: fetch user & save profile
async function checkAuthSession() {
  if (!isSupabaseReady()) return false;

  const { data: { session }, error } = await supabaseClient.auth.getSession();

  if (session && session.user) {
    const user = session.user;
    state.currentUser = user;
    state.isOffline = false;

    // Extract Google metadata
    const email = user.email;
    const fullName = user.user_metadata?.full_name || '';
    const avatarUrl = user.user_metadata?.avatar_url || '';

    // Check if the user already has a profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      // First time Google login: Insert new profile
      const roleToSave = selectedLoginRole || 'developer';

      await supabaseClient.from('profiles').upsert({
        id: user.id,
        email: email,
        full_name: fullName,
        avatar_url: avatarUrl,
        role: roleToSave
      }, { onConflict: 'id' });

      state.userRole = roleToSave;
      state.activeRole = roleToSave;
    } else {
      // Existing user
      state.userRole = profile.role;
      state.activeRole = profile.role;

      // Optionally update avatar_url if it changed
      if (avatarUrl && profile.avatar_url !== avatarUrl) {
        await supabaseClient.from('profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', user.id);
      }
    }

    showDashboard(); // Transition to the main app view
    return true;
  }
  return false;
}

async function init() {
  initEventListeners();

  // Check for existing Supabase session
  if (isSupabaseReady()) {
    try {
      const isLoggedIn = await checkAuthSession();
      if (isLoggedIn) return;
    } catch (err) {
      console.warn('Session check failed:', err);
    }
  }

  // No session — show login screen
  showLoginScreen();
}

document.addEventListener('DOMContentLoaded', init);
