# Enhanced Language Validation, Preview, and Sidebar Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add language content validation to prevent mixing scripts, display live preview on home page, and restructure home layout with sidebar post list and center preview panel.

**Architecture:** 
- Add Unicode script detection to identify language families (Latin/Devanagari/Tamil/Telugu/etc.)
- Validate in editor form submit: if user selects "English" but types Marathi, show error
- Restructure home page to 2-column layout: left sidebar with post list, right panel with selected post preview
- Post selection in sidebar loads preview without page navigation; delete/edit buttons available in preview

**Tech Stack:** Vanilla JS, Express.js, CSS Grid

---

## File Structure

**Modified Files:**
- `public/app.js` - Add language detection, validation, sidebar logic
- `public/index.html` - Restructure layout to sidebar + preview
- `public/style.css` - Add sidebar styles, grid layout, responsive adjustments

**No new files needed**

---

## Task 1: Add Language Script Detection Function

**Files:**
- Modify: `public/app.js:1-50` (add at top before existing code)

- [ ] **Step 1: Add script detection helper**

Add this function at the very top of `public/app.js` before the `LANGUAGE_FONTS` constant:

```javascript
function detectLanguageScript(text = '') {
  if (!text) return 'unknown';
  
  // Unicode ranges for common scripts
  const scripts = {
    latin: /[\u0000-\u007F\u0100-\u017F\u0180-\u024F]/g,
    devanagari: /[\u0900-\u097F]/g,
    tamil: /[\u0B80-\u0BFF]/g,
    telugu: /[\u0C60-\u0C7F]/g,
    kannada: /[\u0C80-\u0CFF]/g,
    gujarati: /[\u0A80-\u0AFF]/g,
    punjabi: /[\u0A00-\u0A7F]/g,
    malayalam: /[\u0D00-\u0D7F]/g,
    bengali: /[\u0980-\u09FF]/g
  };

  let maxScript = 'unknown';
  let maxCount = 0;

  for (const [script, pattern] of Object.entries(scripts)) {
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
    devanagari: ['Hindi', 'Marathi'],
    tamil: 'Tamil',
    telugu: 'Telugu',
    kannada: 'Kannada',
    gujarati: 'Gujarati',
    punjabi: 'Punjabi',
    malayalam: 'Malayalam',
    bengali: 'Bengali'
  };
  return scriptMap[script] || null;
}
```

- [ ] **Step 2: Verify helper works**

In browser console (after loading page), test:
```javascript
console.log(detectLanguageScript('Hello world')); // should log 'latin'
console.log(detectLanguageScript('नमस्ते')); // should log 'devanagari'
console.log(detectLanguageScript('मराठी')); // should log 'devanagari'
```

Expected: Both Marathi and Hindi detected as 'devanagari' script

- [ ] **Step 3: Commit**

```bash
git add public/app.js
git commit -m "feat: add language script detection helper functions"
```

---

## Task 2: Add Language Validation to Editor Form Submit

**Files:**
- Modify: `public/app.js:296-331` (editor form submit handler)

- [ ] **Step 1: Create validation function**

Add this function after `mapScriptToLanguage()` (around line 100):

```javascript
function validateLanguageContent(selectedLanguage, titleText, bodyText) {
  const combinedText = titleText + ' ' + bodyText;
  const detectedScript = detectLanguageScript(combinedText);
  const mappedLanguages = mapScriptToLanguage(detectedScript);
  
  if (detectedScript === 'unknown') {
    return { valid: true }; // No non-ASCII content, always valid
  }

  if (Array.isArray(mappedLanguages)) {
    // Devanagari covers multiple languages
    if (selectedLanguage === 'English' && detectedScript !== 'latin') {
      return {
        valid: false,
        error: `You selected "${selectedLanguage}" but your content is in ${detectedScript.toUpperCase()} script (${mappedLanguages.join('/')}). Use the correct language dropdown or rewrite in English.`
      };
    }
  } else if (mappedLanguages && selectedLanguage !== mappedLanguages && selectedLanguage !== 'English') {
    // Strict matching for non-English languages
    if (detectedScript !== 'latin' && detectedScript !== 'unknown') {
      return {
        valid: false,
        error: `Content appears to be in ${mappedLanguages} but you selected "${selectedLanguage}". Please match your selection to the content language.`
      };
    }
  }

  // If English is selected but non-Latin script is detected
  if (selectedLanguage === 'English' && detectedScript !== 'latin' && detectedScript !== 'unknown') {
    return {
      valid: false,
      error: `You selected "English" but your content contains ${detectedScript.toUpperCase()} script. Please select the correct language.`
    };
  }

  return { valid: true };
}
```

- [ ] **Step 2: Integrate validation into form submit**

Replace the form submit handler (around line 296). Find this block:

```javascript
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
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
```

Replace with:

```javascript
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
```

- [ ] **Step 3: Test validation in editor**

1. Go to `http://localhost:3000/editor.html`
2. Select "English" in language dropdown
3. Type title: "Hello World"
4. Type body: "मराठी मजकूर" (Marathi text)
5. Click "Publish Post"

Expected: Alert shows "You selected "English" but your content contains DEVANAGARI script. Please select the correct language."

- [ ] **Step 4: Test with correct language**

1. Same setup, but select "Marathi" instead of "English"
2. Keep Marathi text, click publish

Expected: Post saves successfully

- [ ] **Step 5: Commit**

```bash
git add public/app.js
git commit -m "feat: add language content validation to editor form submit"
```

---

## Task 3: Restructure Home Page HTML for Sidebar Layout

**Files:**
- Modify: `public/index.html`

- [ ] **Step 1: Update index.html with new layout**

Replace entire content of `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Blog</title>
  <link rel="stylesheet" href="style.css">
</head>
<body id="home" class="theme-classic-paper">
  <header>
    <div class="container">
      <div>
        <h1><a href="/">My Blog</a></h1>
        <p class="site-subtitle">A multilingual blog space for Indian languages and moods.</p>
      </div>
      <a href="editor.html" class="btn btn-primary">+ New Post</a>
    </div>
  </header>

  <main class="home-main">
    <div class="home-container">
      <!-- Sidebar with posts list -->
      <aside class="posts-sidebar">
        <div class="sidebar-header">
          <h2>Posts</h2>
        </div>
        <div id="posts-list" class="posts-list-sidebar"></div>
      </aside>

      <!-- Preview panel for selected post -->
      <section class="preview-section">
        <div id="preview-area" class="preview-area">
          <div class="empty-preview">
            <p>No post selected</p>
            <p class="preview-hint">Click a post from the list to view it here</p>
          </div>
        </div>
      </section>
    </div>
  </main>

  <template id="post-card-template">
    <div class="post-sidebar-item">
      <div class="post-item-header">
        <h3 class="post-item-title"></h3>
      </div>
      <div class="post-item-meta">
        <span class="tag language-tag"></span>
        <span class="tag emotion-tag"></span>
      </div>
      <p class="post-item-date"></p>
    </div>
  </template>

  <template id="post-preview-template">
    <article class="post-preview-card">
      <div class="preview-header">
        <button class="btn-back" id="btn-back-preview">← Back</button>
        <div class="preview-actions">
          <button class="btn btn-secondary" id="btn-edit-preview">Edit</button>
          <button class="btn btn-danger" id="btn-delete-preview">Delete</button>
        </div>
      </div>
      <div class="post-preview-content">
        <h1 id="preview-title"></h1>
        <p class="preview-meta" id="preview-meta"></p>
        <div class="preview-tags">
          <span class="tag" id="preview-language"></span>
          <span class="tag" id="preview-emotion"></span>
          <span class="tag secondary" id="preview-theme"></span>
        </div>
        <div id="preview-body" class="post-body preview-body"></div>
      </div>
    </article>
  </template>

  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify HTML structure loads**

Open DevTools, check that:
- `<aside class="posts-sidebar">` is present
- `<section class="preview-section">` is present
- Templates exist for post items and preview

Expected: No console errors

- [ ] **Step 3: Commit**

```bash
git add public/index.html
git commit -m "refactor: restructure home page to sidebar + preview layout"
```

---

## Task 4: Add Sidebar Post List Logic to app.js

**Files:**
- Modify: `public/app.js:127-165` (home page section)

- [ ] **Step 1: Replace home page post loading logic**

Find the section starting with `if (document.body.id === 'home')` (around line 127).

Replace the entire `loadPosts()` function and initialization:

```javascript
// ── Home Page ──────────────────────────────────────────────────
if (document.body.id === 'home') {
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
    metaEl.textContent = `${formatDate(post.createdAt)}${post.updatedAt !== post.createdAt ? ' (edited ' + formatDate(post.updatedAt) + ')' : ''}`;
    bodyEl.textContent = post.body;
    languageEl.textContent = post.language || 'English';
    emotionEl.textContent = prettyEmotion(post.emotion || 'thoughtful');
    themeEl.textContent = (post.theme || 'classic-paper').replace(/-/g, ' ');

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

  loadPostsIntoSidebar();
}
```

- [ ] **Step 2: Test sidebar and preview**

1. Start server: `npm start`
2. Navigate to `http://localhost:3000`
3. Verify sidebar shows all posts
4. Click a post in sidebar → preview loads in right panel
5. Click "Back" button → preview clears, sidebar deselects
6. Verify Edit and Delete buttons work in preview

Expected: All interactions work smoothly without page navigation

- [ ] **Step 3: Commit**

```bash
git add public/app.js
git commit -m "feat: add sidebar post list and preview panel logic to home page"
```

---

## Task 5: Add Sidebar and Preview Styling to CSS

**Files:**
- Modify: `public/style.css`

- [ ] **Step 1: Add layout and sidebar styles**

Find the line `main {` (around line 170-180 in style.css) and add this new section right before it:

```css
main.home-main {
  padding: 2rem 1rem;
  min-height: calc(100vh - 120px);
}

.home-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.posts-sidebar {
  background: var(--surface);
  border-radius: 8px;
  border: 1px solid var(--border);
  padding: 1.5rem;
  max-height: 75vh;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.sidebar-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--primary);
}

.sidebar-header h2 {
  font-size: 1.1rem;
  margin: 0;
  color: var(--text);
}

.posts-list-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.post-sidebar-item {
  padding: 0.875rem;
  border-radius: 6px;
  border: 1px solid transparent;
  background: var(--surface-2);
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.post-sidebar-item:hover {
  background: #f0f0eb;
  border-left-color: var(--primary);
}

.post-sidebar-item.active {
  background: var(--primary);
  color: white;
  border-left-color: var(--primary-dark);
}

.post-sidebar-item.active .post-item-title {
  color: white;
}

.post-sidebar-item.active .tag {
  background: rgba(255,255,255,0.25);
  color: white;
}

.post-item-header {
  margin-bottom: 0.5rem;
}

.post-item-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
  color: var(--text);
  word-break: break-word;
  line-height: 1.3;
}

.post-item-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.post-item-date {
  font-size: 0.8rem;
  color: var(--muted);
  margin: 0;
}

.post-sidebar-item.active .post-item-date {
  color: rgba(255,255,255,0.8);
}

.preview-section {
  background: var(--surface);
  border-radius: 8px;
  border: 1px solid var(--border);
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  max-height: 75vh;
  overflow-y: auto;
}

.preview-area {
  min-height: 300px;
}

.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.empty-preview p {
  margin: 0.5rem 0;
  color: var(--muted);
  font-size: 1rem;
}

.preview-hint {
  font-size: 0.9rem;
}

.post-preview-card {
  width: 100%;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.btn-back {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0;
  transition: color 0.2s ease;
}

.btn-back:hover {
  color: var(--primary-dark);
}

.preview-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.post-preview-content {
  width: 100%;
}

#preview-title {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  line-height: 1.2;
}

.preview-meta {
  color: var(--muted);
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.preview-tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.preview-body {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.8;
  color: var(--text);
}

/* Responsive: stack on smaller screens */
@media (max-width: 900px) {
  .home-container {
    grid-template-columns: 1fr;
  }

  .posts-sidebar {
    max-height: none;
  }

  .preview-section {
    max-height: none;
  }

  .post-sidebar-item {
    padding: 0.75rem;
  }
}
```

- [ ] **Step 2: Verify existing main styling doesn't conflict**

Find the old `main {` rule (should be further down in style.css) and check if it still applies. Add `&:not(.home-main)` logic or just leave it — the home-main override should take precedence.

Actually, add this to make sure non-home pages still work:

Find the rule starting with `main {` and update it:

```css
main:not(.home-main) {
  /* existing main styles */
  padding: 2rem 0;
}
```

- [ ] **Step 3: Verify tag styles**

Look for existing `.tag` styles in style.css. Ensure they exist (they should from the original code). If you see conflicts, add this override:

```css
.tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  background: var(--surface-2);
  color: var(--text);
}

.tag.secondary {
  background: #f0f0eb;
}
```

- [ ] **Step 4: Test styling in browser**

1. Refresh home page at `http://localhost:3000`
2. Verify sidebar appears on left with all posts
3. Verify preview panel appears on right
4. Verify colors, spacing, and layout match design
5. Resize browser to test responsive (should stack on mobile)

Expected: Clean sidebar layout with preview, proper spacing, no layout breaks

- [ ] **Step 5: Commit**

```bash
git add public/style.css
git commit -m "style: add sidebar and preview panel layout styling"
```

---

## Task 6: Cleanup Old Single Post Page Code

**Files:**
- Modify: `public/app.js:168-210` (single-post section - keep but no changes needed for now)

- [ ] **Step 1: Verify single post page still works**

1. From home preview, click Edit on any post → opens editor
2. After saving, should navigate to `post.html?id=...`
3. Verify post page still loads correctly

Note: The single-post page (`post.html`) still uses the old direct view. This is fine for now — users can still access posts directly via URL. The sidebar preview is the new home page feature.

- [ ] **Step 2: No changes needed**

The editor and single-post pages remain unchanged. They work independently.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: verify existing pages still functional after home page restructure"
```

---

## Task 7: Manual Testing and Verification

**Files:**
- None (testing phase)

- [ ] **Step 1: Test language validation**

**Test Case 1: English post with Marathi content**
- Go to editor
- Select "English"
- Title: "Test Post"
- Body: "हेलो मराठी" (Hello in Marathi)
- Try to publish
- Expected: Alert with validation error

**Test Case 2: Marathi post with Marathi content**
- Go to editor
- Select "Marathi"
- Title: "परीक्षा"
- Body: "हेलो मराठी"
- Try to publish
- Expected: Post saves successfully

**Test Case 3: Mixed language allowed scenario**
- English selected
- Title: "Hello" (English)
- Body: "This is a test" (English only)
- Expected: Saves successfully

**Test Case 4: Hindi in Marathi selection**
- Select "Hindi"
- Title: "नमस्ते"
- Body: "हिंदी टेक्स्ट" (Hindi text)
- Try to publish
- Expected: Saves successfully (both use Devanagari)

- [ ] **Step 2: Test home page sidebar and preview**

**Test Case 1: Create multiple posts**
- Create 3+ posts with different languages
- Go to home page

**Test Case 2: Sidebar displays all posts**
- Verify all posts appear in left sidebar
- Verify language and emotion tags show
- Verify first post auto-selected on page load
- Expected: First post preview visible on right

**Test Case 3: Click post in sidebar**
- Click different posts
- Expected: Preview updates, sidebar item highlights
- Verify title, body, metadata display correctly

**Test Case 4: Edit from preview**
- Click Edit button in preview
- Expected: Opens editor with post content pre-filled

**Test Case 5: Delete from preview**
- Click Delete button
- Confirm deletion
- Expected: Post removed, sidebar refreshes

**Test Case 6: Back button**
- Click Back in preview
- Expected: Preview clears, shows empty state, sidebar deselects

**Test Case 7: Responsive behavior**
- Resize browser to 768px width
- Expected: Layout stacks vertically (sidebar above preview)
- Content still readable

- [ ] **Step 3: Test existing features not broken**

**Test Case 1: Direct post URL**
- Visit `post.html?id=<some-post-id>` directly
- Expected: Single post page loads correctly

**Test Case 2: Editor for new post**
- From home, click "+ New Post"
- Expected: Editor page loads

**Test Case 3: Theme selection**
- Create post, observe theme selection
- Expected: Themes update based on emotion

**Test Case 4: Navigation between pages**
- Header links work correctly
- Back links work
- Expected: No broken links

- [ ] **Step 4: Document results**

Create a test summary:
```
VALIDATION TESTING: ✓ PASS
- English + Marathi content blocked
- Marathi + Marathi content allowed
- Mixed English content allowed
- Hindi + Marathi (Devanagari) allowed

HOME PAGE REDESIGN: ✓ PASS
- Sidebar displays all posts
- Preview loads on click
- Edit/Delete work from preview
- Responsive design functions

EXISTING FEATURES: ✓ PASS
- Single post page still works
- Editor works
- Navigation intact
- Theme selection works
```

- [ ] **Step 5: Commit final state**

```bash
git add -A
git commit -m "test: verify language validation, sidebar preview, and existing features"
```

---

## Self-Review

**Spec Coverage:**
✓ Language validation - Task 2 validates and prevents mixed scripts
✓ Live preview - Task 4 adds preview panel on home page
✓ Sidebar layout - Tasks 3 & 5 restructure home to sidebar + preview
✓ Delete/Edit in preview - Task 4 includes action buttons
✓ Responsive design - Task 5 includes mobile stacking

**Placeholder Check:**
✓ All code is complete and shown
✓ All test cases are specific
✓ All commands are exact
✓ No "TBD" or "implement later"

**Type/Function Consistency:**
✓ `detectLanguageScript()` defined in Task 1, used in Task 2
✓ `validateLanguageContent()` defined in Task 2, used in Task 2
✓ `loadPostPreview()` defined in Task 4
✓ All CSS classes defined before use

**No Red Flags**
✓ No incomplete sections
✓ No contradictions
✓ Clear dependencies between tasks
✓ All functions match their usage

---

## Execution

Plan complete and saved to `docs/superpowers/plans/2026-04-04-enhanced-validation-preview-sidebar.md`.

**Two execution options:**

**Option 1: Subagent-Driven (Recommended)** - I dispatch a fresh subagent per task with review checkpoints. Faster iteration, fresh perspective on each step.

**Option 2: Inline Execution** - Execute tasks sequentially in this session with checkpoint reviews between groups.

Which would you prefer?
