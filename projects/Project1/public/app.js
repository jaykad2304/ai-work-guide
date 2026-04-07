// Unicode ranges for common scripts - extracted as constant for efficiency
const SCRIPT_PATTERNS = {
  latin: /[\u0020-\u007E\u0100-\u017F\u0180-\u024F]/g,
  devanagari: /[\u0900-\u097F]/g,
  tamil: /[\u0B80-\u0BFF]/g,
  telugu: /[\u0C60-\u0C7F]/g,
  kannada: /[\u0C80-\u0CFF]/g,
  gujarati: /[\u0A80-\u0AFF]/g,
  punjabi: /[\u0A00-\u0A7F]/g,
  malayalam: /[\u0D00-\u0D7F]/g,
  bengali: /[\u0980-\u09FF]/g
};

function detectLanguageScript(text = '') {
  if (!text) return 'unknown';

  let maxScript = 'unknown';
  let maxCount = 0;

  for (const [script, pattern] of Object.entries(SCRIPT_PATTERNS)) {
    const matches = (text.match(pattern) || []).length;
    if (matches > maxCount) {
      maxCount = matches;
      maxScript = script;
    }
  }

  return maxCount > 0 ? maxScript : 'unknown';
}

function mapScriptToLanguage(script) {
  const scriptMap = {
    latin: 'English',
    devanagari: 'Hindi/Marathi',
    tamil: 'Tamil',
    telugu: 'Telugu',
    kannada: 'Kannada',
    gujarati: 'Gujarati',
    punjabi: 'Punjabi',
    malayalam: 'Malayalam',
    bengali: 'Bengali'
  };
  return scriptMap[script] || 'Unknown';
}

function validateLanguageContent(selectedLanguage, titleText, bodyText) {
  const combinedText = titleText + ' ' + bodyText;
  const detectedScript = detectLanguageScript(combinedText);

  // If no non-ASCII content detected, always valid
  if (detectedScript === 'unknown') {
    return { valid: true };
  }

  const mappedLanguages = mapScriptToLanguage(detectedScript);

  // If English is selected, content must be in Latin script
  if (selectedLanguage === 'English' && detectedScript !== 'latin') {
    return {
      valid: false,
      error: `You selected "English" but your content contains ${detectedScript.toUpperCase()} script (${mappedLanguages}). Please select the correct language or rewrite in English.`
    };
  }

  // For non-English languages, check if selected language matches detected script
  if (selectedLanguage !== 'English' && detectedScript !== 'latin') {
    // For Devanagari (Hindi/Marathi), both are acceptable
    if (detectedScript === 'devanagari') {
      if (selectedLanguage !== 'Hindi' && selectedLanguage !== 'Marathi') {
        return {
          valid: false,
          error: `You selected "${selectedLanguage}" but content is in Devanagari script (Hindi/Marathi). Please match the language to your content.`
        };
      }
    } else {
      // For other scripts, check exact match
      if (selectedLanguage !== mappedLanguages) {
        return {
          valid: false,
          error: `Content appears to be in ${mappedLanguages} but you selected "${selectedLanguage}". Please match your language selection.`
        };
      }
    }
  }

  return { valid: true };
}

const LANGUAGE_FONTS = {
  English: "'Inter', 'Segoe UI', sans-serif",
  Hindi: "'Noto Sans Devanagari', 'Mangal', sans-serif",
  Marathi: "'Noto Sans Devanagari', 'Mangal', sans-serif",
  Telugu: "'Noto Sans Telugu', sans-serif",
  Tamil: "'Noto Sans Tamil', sans-serif",
  Kannada: "'Noto Sans Kannada', sans-serif",
  Gujarati: "'Noto Sans Gujarati', sans-serif",
  Punjabi: "'Noto Sans Gurmukhi', sans-serif",
  Malayalam: "'Noto Sans Malayalam', sans-serif",
  Bengali: "'Noto Sans Bengali', sans-serif"
};

const THEME_LIBRARY = {
  joyful: [
    { id: 'sunrise-saffron', label: 'Sunrise Saffron' },
    { id: 'festival-pop', label: 'Festival Pop' },
    { id: 'lotus-light', label: 'Lotus Light' },
    { id: 'mango-burst', label: 'Mango Burst' }
  ],
  calm: [
    { id: 'quiet-blue', label: 'Quiet Blue' },
    { id: 'mint-breeze', label: 'Mint Breeze' },
    { id: 'soft-sand', label: 'Soft Sand' },
    { id: 'moon-mist', label: 'Moon Mist' }
  ],
  emotional: [
    { id: 'rose-dusk', label: 'Rose Dusk' },
    { id: 'lavender-note', label: 'Lavender Note' },
    { id: 'monsoon-ink', label: 'Monsoon Ink' },
    { id: 'quiet-plum', label: 'Quiet Plum' }
  ],
  bold: [
    { id: 'midnight-bold', label: 'Midnight Bold' },
    { id: 'royal-maroon', label: 'Royal Maroon' },
    { id: 'indigo-spark', label: 'Indigo Spark' },
    { id: 'ember-gold', label: 'Ember Gold' }
  ],
  thoughtful: [
    { id: 'classic-paper', label: 'Classic Paper' },
    { id: 'ink-journal', label: 'Ink Journal' },
    { id: 'stone-minimal', label: 'Stone Minimal' },
    { id: 'sage-editorial', label: 'Sage Editorial' }
  ]
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function normalizeText(text = '') {
  return text.toLowerCase();
}

function detectEmotion(title = '', body = '') {
  const text = normalizeText(`${title} ${body}`);

  const rules = [
    {
      emotion: 'joyful',
      words: ['happy', 'joy', 'excited', 'celebrate', 'celebration', 'fun', 'smile', 'love', 'wonderful', 'amazing', 'खुश', 'आनंद', 'सुख', 'సంతోష', 'மகிழ்ச்சி']
    },
    {
      emotion: 'emotional',
      words: ['sad', 'alone', 'miss', 'cry', 'hurt', 'pain', 'grief', 'heartbreak', 'lonely', 'tears', 'दुख', 'उदास', 'வேதனை', 'బాధ']
    },
    {
      emotion: 'bold',
      words: ['fight', 'win', 'power', 'strong', 'change', 'rise', 'leader', 'dream big', 'unstoppable', 'motivation', 'जिंक', 'शक्ती', 'ధైర్యం']
    },
    {
      emotion: 'calm',
      words: ['peace', 'calm', 'breeze', 'silence', 'nature', 'meditation', 'gentle', 'slow', 'quiet', 'rest', 'शांत', 'सुकून', 'శాంతి', 'அமைதி']
    }
  ];

  for (const rule of rules) {
    if (rule.words.some(word => text.includes(word))) {
      return rule.emotion;
    }
  }

  return 'thoughtful';
}

function getThemesForEmotion(emotion) {
  return THEME_LIBRARY[emotion] || THEME_LIBRARY.thoughtful;
}

function toThemeClass(themeId = 'classic-paper') {
  return `theme-${themeId}`;
}

function prettyEmotion(emotion = 'thoughtful') {
  return emotion.charAt(0).toUpperCase() + emotion.slice(1);
}

function getExcerpt(post) {
  if (post.excerpt) return post.excerpt;
  return post.body.length > 160 ? post.body.slice(0, 160) + '…' : post.body;
}

function readingTime(body = '') {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

function applyLanguageFont(language, elements = []) {
  const font = LANGUAGE_FONTS[language] || LANGUAGE_FONTS.English;
  elements.forEach(el => {
    if (el) el.style.fontFamily = font;
  });
}

function setThemeOnElement(element, themeId) {
  if (!element) return;
  element.className = element.className
    .split(' ')
    .filter(cls => !cls.startsWith('theme-'))
    .join(' ')
    .trim();
  element.classList.add(toThemeClass(themeId));
}

// ── Dark Mode (all pages) ──────────────────────────────────────
(function () {
  const toggle = document.getElementById('dark-toggle');
  if (!toggle) return;
  const icon = toggle.querySelector('.toggle-icon');
  const apply = dark => {
    document.documentElement.classList.toggle('dark-mode', dark);
    if (icon) icon.textContent = dark ? '☀' : '☾';
  };
  apply(localStorage.getItem('darkMode') === 'true');
  toggle.addEventListener('click', () => {
    const isDark = !document.documentElement.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    apply(isDark);
  });
})();

// ── Auth State ─────────────────────────────────────────────────
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) return await res.json(); // { id, email, isAdmin }
    return null;
  } catch {
    return null;
  }
}

let currentUser = null;

// ── Home Page ──────────────────────────────────────────────────
if (document.body.id === 'home') {
  // Show/hide nav based on auth state, then load posts
  (async () => {
    currentUser = await checkAuth();
    const newPostBtn = document.getElementById('new-post-btn');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    if (currentUser) {
      if (newPostBtn) newPostBtn.style.display = '';
      if (logoutBtn) {
        logoutBtn.style.display = '';
        logoutBtn.addEventListener('click', async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          window.location.reload();
        });
      }
    } else {
      if (loginBtn) loginBtn.style.display = '';
    }
    loadPostsIntoSidebar();
  })();

  const sidebarList = document.getElementById('posts-list');
  const previewArea = document.getElementById('preview-area');
  const postCardTemplate = document.getElementById('post-card-template');
  const postPreviewTemplate = document.getElementById('post-preview-template');

  let allPosts = [];
  let selectedPostId = null;

  async function loadPostsIntoSidebar() {
    try {
      allPosts = await fetch('/api/posts').then(r => r.json());
      sidebarList.innerHTML = '';

      if (allPosts.length === 0) {
        previewArea.innerHTML = `
          <div class="empty-preview">
            <p>No posts yet. Start writing!</p>
            <a href="editor.html" class="btn btn-primary">Write your first post</a>
          </div>`;
        return;
      }

      for (const post of allPosts) {
        const item = postCardTemplate.content.cloneNode(true);
        const itemDiv = item.querySelector('.post-sidebar-item');
        const titleEl = item.querySelector('.post-item-title');
        const dateEl = item.querySelector('.post-item-date');
        const languageTag = item.querySelector('.language-tag');
        const emotionTag = item.querySelector('.emotion-tag');

        titleEl.textContent = post.title;
        dateEl.textContent = formatDate(post.createdAt);
        languageTag.textContent = post.language || 'English';
        emotionTag.textContent = prettyEmotion(post.emotion || 'thoughtful');
        const readTimeEl = item.querySelector('.reading-time-badge');
        if (readTimeEl) readTimeEl.textContent = readingTime(post.body);

        itemDiv.dataset.postId = post.id;
        itemDiv.addEventListener('click', () => loadPostPreview(post.id));

        sidebarList.appendChild(item);
      }

      // Load first post by default
      if (allPosts.length > 0) {
        loadPostPreview(allPosts[0].id);
      }
    } catch (err) {
      previewArea.innerHTML = `<p style="color:#dc2626">Failed to load posts: ${err.message}</p>`;
    }
  }

  function loadPostPreview(postId) {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    selectedPostId = postId;

    // Highlight selected post in sidebar
    document.querySelectorAll('.post-sidebar-item').forEach(item => {
      item.classList.toggle('active', item.dataset.postId === postId);
    });

    // Load preview
    const preview = postPreviewTemplate.content.cloneNode(true);
    const titleEl = preview.querySelector('#preview-title');
    const metaEl = preview.querySelector('#preview-meta');
    const bodyEl = preview.querySelector('#preview-body');
    const languageEl = preview.querySelector('#preview-language');
    const emotionEl = preview.querySelector('#preview-emotion');
    const themeEl = preview.querySelector('#preview-theme');
    const editBtn = preview.querySelector('#btn-edit-preview');
    const deleteBtn = preview.querySelector('#btn-delete-preview');
    const backBtn = preview.querySelector('#btn-back-preview');

    titleEl.textContent = post.title;
    metaEl.textContent = `${formatDate(post.createdAt)}${post.updatedAt !== post.createdAt ? ' · edited ' + formatDate(post.updatedAt) : ''} · ${readingTime(post.body)}`;
    bodyEl.textContent = post.body;
    languageEl.textContent = post.language || 'English';
    emotionEl.textContent = prettyEmotion(post.emotion || 'thoughtful');
    themeEl.textContent = (post.theme || 'classic-paper').replace(/-/g, ' ');

    // Show edit/delete only for post owner or admin
    const canEdit = currentUser && (post.userId === currentUser.id || currentUser.isAdmin);
    if (!canEdit) {
      editBtn.style.display = 'none';
      deleteBtn.style.display = 'none';
    }

    editBtn.addEventListener('click', () => {
      window.location.href = `editor.html?id=${postId}`;
    });

    deleteBtn.addEventListener('click', async () => {
      if (!confirm('Delete this post? This cannot be undone.')) return;
      try {
        await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
        loadPostsIntoSidebar();
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    });

    backBtn.addEventListener('click', () => {
      previewArea.innerHTML = `
        <div class="empty-preview">
          <p>No post selected</p>
          <p class="preview-hint">Click a post from the list to view it here</p>
        </div>`;
      selectedPostId = null;
      document.querySelectorAll('.post-sidebar-item').forEach(item => {
        item.classList.remove('active');
      });
    });

    previewArea.innerHTML = '';
    previewArea.appendChild(preview);

    // Apply theme to preview
    setThemeOnElement(previewArea.querySelector('.post-preview-card'), post.theme || 'classic-paper');
    applyLanguageFont(post.language || 'English', [titleEl, bodyEl]);
  }

  // Filter logic
  const searchInput = document.getElementById('filter-search');
  const langFilter = document.getElementById('filter-lang');

  function applyFilter() {
    const q = (searchInput ? searchInput.value : '').toLowerCase();
    const lang = langFilter ? langFilter.value : '';
    document.querySelectorAll('.post-sidebar-item').forEach(item => {
      const post = allPosts.find(p => p.id === item.dataset.postId);
      if (!post) return;
      const matchText = !q || post.title.toLowerCase().includes(q) || post.body.toLowerCase().includes(q);
      const matchLang = !lang || (post.language || 'English') === lang;
      item.style.display = matchText && matchLang ? '' : 'none';
    });
  }

  if (searchInput) searchInput.addEventListener('input', applyFilter);
  if (langFilter) langFilter.addEventListener('change', applyFilter);
}

// ── Single Post Page ───────────────────────────────────────────
if (document.body.id === 'single-post') {
  // Set currentUser for this page
  (async () => {
    currentUser = await checkAuth();
    const newPostBtn = document.getElementById('new-post-btn');
    if (currentUser && newPostBtn) newPostBtn.style.display = '';
  })();

  const id = getParam('id');

  async function loadPost() {
    if (!id) { window.location.href = '/'; return; }
    try {
      const post = await fetch(`/api/posts/${id}`).then(async r => {
        if (!r.ok) throw new Error('Post not found');
        return r.json();
      });
      document.title = post.title + ' — My Blog';
      document.getElementById('post-title').textContent = post.title;
      document.getElementById('post-date').textContent = formatDate(post.createdAt) +
        (post.updatedAt !== post.createdAt ? ' · edited ' + formatDate(post.updatedAt) : '') +
        ' · ' + readingTime(post.body);
      document.getElementById('post-body').textContent = post.body;
      document.getElementById('post-language').textContent = post.language || 'English';
      document.getElementById('post-emotion').textContent = prettyEmotion(post.emotion || 'thoughtful');
      document.getElementById('post-theme').textContent = (post.theme || 'classic-paper').replace(/-/g, ' ');
      setThemeOnElement(document.body, post.theme || 'classic-paper');
      setThemeOnElement(document.getElementById('post-article'), post.theme || 'classic-paper');
      applyLanguageFont(post.language || 'English', [document.getElementById('post-title'), document.getElementById('post-body')]);

      // Show edit/delete only for post owner or admin
      const canEdit = currentUser && (post.userId === currentUser.id || currentUser.isAdmin);
      document.getElementById('btn-edit').style.display = canEdit ? '' : 'none';
      document.getElementById('btn-delete').style.display = canEdit ? '' : 'none';
    } catch (err) {
      document.querySelector('main .container').innerHTML =
        `<p style="color:#dc2626">Error: ${err.message}</p><a href="/">Go back</a>`;
    }
  }

  document.getElementById('btn-edit').addEventListener('click', () => {
    window.location.href = `editor.html?id=${id}`;
  });

  document.getElementById('btn-delete').addEventListener('click', async () => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      window.location.href = '/';
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  });

  loadPost();
}

// ── Editor Page ────────────────────────────────────────────────
if (document.body.id === 'editor') {
  (async () => {
    const user = await checkAuth();
    if (!user) { window.location.href = '/login.html'; return; }

    const id = getParam('id');
    const form = document.getElementById('post-form');
    const titleInput = document.getElementById('title');
    const bodyInput = document.getElementById('body');
    const languageInput = document.getElementById('language');
    const emotionInput = document.getElementById('emotion');
    const submitBtn = document.getElementById('submit-btn');
    const editorTitle = document.getElementById('editor-title');
    const previewTitle = document.getElementById('preview-title');
    const previewBody = document.getElementById('preview-body');
    const previewLanguage = document.getElementById('preview-language');
    const previewEmotion = document.getElementById('preview-emotion');
    const previewTheme = document.getElementById('preview-theme');
    const previewCard = document.getElementById('preview-card');
    const themeOptions = document.getElementById('theme-options');

    let selectedTheme = 'classic-paper';

    function renderThemeOptions(emotion, preferredTheme) {
      const themes = getThemesForEmotion(emotion);
      if (!themes.some(theme => theme.id === preferredTheme)) {
        selectedTheme = themes[0].id;
      } else {
        selectedTheme = preferredTheme;
      }

      themeOptions.innerHTML = '';
      themes.forEach(theme => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `theme-option ${theme.id === selectedTheme ? 'active' : ''}`;
        button.dataset.themeId = theme.id;
        button.innerHTML = `<strong>${theme.label}</strong><span>${prettyEmotion(emotion)} mood</span>`;
        button.addEventListener('click', () => {
          selectedTheme = theme.id;
          renderPreview();
        });
        themeOptions.appendChild(button);
      });
    }

    function renderPreview() {
      const title = titleInput.value.trim() || 'Your title will appear here';
      const body = bodyInput.value.trim() || 'Start writing to see a preview of your blog post.';
      const language = languageInput.value || 'English';
      const emotion = detectEmotion(titleInput.value, bodyInput.value);

      emotionInput.value = prettyEmotion(emotion);
      previewTitle.textContent = title;
      previewBody.textContent = body;
      previewLanguage.textContent = language;
      previewEmotion.textContent = prettyEmotion(emotion);
      const activeTheme = selectedTheme;
      const activeThemeLabel = activeTheme.replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
      previewTheme.textContent = activeThemeLabel;

      setThemeOnElement(document.body, activeTheme);
      setThemeOnElement(previewCard, activeTheme);
      applyLanguageFont(language, [titleInput, bodyInput, previewTitle, previewBody]);

      renderThemeOptions(emotion, activeTheme);
    }

    if (id) {
      editorTitle.textContent = 'Edit Post';
      submitBtn.textContent = 'Save Changes';

      fetch(`/api/posts/${id}`).then(r => r.json()).then(post => {
        titleInput.value = post.title;
        bodyInput.value = post.body;
        languageInput.value = post.language || 'English';
        selectedTheme = post.theme || 'classic-paper';
        renderPreview();
      }).catch(err => alert('Could not load post: ' + err.message));
    } else {
      renderPreview();
    }

    titleInput.addEventListener('input', renderPreview);
    bodyInput.addEventListener('input', renderPreview);
    languageInput.addEventListener('change', renderPreview);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate language content
      const validation = validateLanguageContent(
        languageInput.value,
        titleInput.value,
        bodyInput.value
      );
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      const payload = {
        title: titleInput.value.trim(),
        body: bodyInput.value.trim(),
        language: languageInput.value,
        emotion: detectEmotion(titleInput.value, bodyInput.value),
        theme: selectedTheme,
        excerpt: bodyInput.value.trim().slice(0, 180)
      };
      if (!payload.title || !payload.body) {
        alert('Title and content are both required.');
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving…';
      try {
        const url = id ? `/api/posts/${id}` : '/api/posts';
        const method = id ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Server error');
        }
        const saved = await res.json();
        window.location.href = `post.html?id=${saved.id}`;
      } catch (err) {
        alert('Failed to save: ' + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = id ? 'Save Changes' : 'Publish Post';
      }
    });
  })();
}

// ── Login Page ─────────────────────────────────────────────────
if (document.body.id === 'login') {
  // Redirect to home if already logged in
  checkAuth().then(user => { if (user) window.location.href = '/'; });

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const errEl = document.getElementById('auth-error');
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Logging in…';
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      window.location.href = '/';
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = '';
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  });
}

// ── Register Page ──────────────────────────────────────────────
if (document.body.id === 'register') {
  // Redirect to home if already logged in
  checkAuth().then(user => { if (user) window.location.href = '/'; });

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const errEl = document.getElementById('auth-error');
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Creating account…';
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      window.location.href = '/';
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = '';
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
