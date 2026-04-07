import { addSiteProfileCandidates } from './siteProfiles.js';

function escapeRegex(text = '') {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeAttributeValue(text = '') {
  return text.replace(/"/g, '\\"');
}

function normalizeDescription(text = '') {
  return text
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/^(click|tap|press|hit|open|select|choose|pick|enter|type|input|fill|verify|check|assert|ensure|confirm|wait for)\s+/i, '')
    .replace(/\b(is|are)\s+(displayed|visible|shown)\b/gi, '')
    .replace(/\b(displayed|visible|shown)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripControlWords(text = '') {
  return normalizeDescription(text)
    .replace(/\b(button|link|field|input|textbox|searchbox|checkbox|radio|dropdown|menu|tab|icon|dialog|modal|file|upload)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toLoosePattern(text = '') {
  const normalized = stripControlWords(text) || normalizeDescription(text);
  return new RegExp(escapeRegex(normalized), 'i');
}

function pushCandidate(candidates, seen, key, factory) {
  if (!key || seen.has(key)) {
    return;
  }

  seen.add(key);
  candidates.push(factory);
}

export function getCandidateLocators(page, elementText, options = {}) {
  const rawText = normalizeDescription(elementText);
  const lower = rawText.toLowerCase();
  const nameText = stripControlWords(rawText) || rawText;
  const namePattern = toLoosePattern(rawText);
  const action = options.action || 'click';
  const candidates = [];
  const seen = new Set();

  if (!rawText) {
    return [() => page.locator('body')];
  }

  pushCandidate(candidates, seen, `testid:${nameText}`, () => page.getByTestId(nameText));
  addSiteProfileCandidates(page, lower, action, candidates, seen);

  if (lower.includes('✕') || lower.includes('✖') || lower.includes('×') || lower === 'x' || lower.includes('x button') || lower.includes('close') || lower.includes('dismiss')) {
    pushCandidate(candidates, seen, 'close:button-x', () => page.getByRole('button', { name: '✕' }));
    pushCandidate(candidates, seen, 'close:button-times', () => page.getByRole('button', { name: '×' }));
    pushCandidate(candidates, seen, 'close:button-cross', () => page.getByRole('button', { name: '✖' }));
    pushCandidate(candidates, seen, 'close:aria-label', () => page.locator('[aria-label*="close" i], [aria-label*="dismiss" i]'));
    pushCandidate(candidates, seen, 'close:css-text', () => page.locator('button:has-text("✕"), button:has-text("×"), button:has-text("✖")'));
    pushCandidate(candidates, seen, 'close:role-close', () => page.getByRole('button', { name: /^close$|^dismiss$/i }));
  }

  if (lower.includes('search')) {
    if (action === 'fill') {
      pushCandidate(candidates, seen, 'role:searchbox', () => page.getByRole('searchbox'));
      pushCandidate(candidates, seen, 'placeholder:search', () => page.getByPlaceholder(/search/i));
      pushCandidate(candidates, seen, 'css:search', () => page.locator('input[type="search"], input[name*="search" i], input[placeholder*="search" i], input[aria-label*="search" i]'));
      pushCandidate(candidates, seen, 'label:search', () => page.getByLabel(/search/i));
    } else {
      pushCandidate(candidates, seen, 'role:searchbox', () => page.getByRole('searchbox'));
      pushCandidate(candidates, seen, 'label:search', () => page.getByLabel(/search/i));
      pushCandidate(candidates, seen, 'placeholder:search', () => page.getByPlaceholder(/search/i));
      pushCandidate(candidates, seen, 'role:button:search', () => page.getByRole('button', { name: /search/i }));
      pushCandidate(candidates, seen, 'css:search', () => page.locator('input[type="search"], input[name*="search" i], input[placeholder*="search" i]'));
    }
  }

  if (lower.includes('result')) {
    pushCandidate(candidates, seen, 'css:search-results', () => page.locator('[data-component-type="s-search-result"], [data-testid*="result" i], .search-results, .results'));
    pushCandidate(candidates, seen, 'role:list-results', () => page.getByRole('list').filter({ hasText: /result/i }));
  }

  if (lower.includes('email') || lower.includes('username')) {
    pushCandidate(candidates, seen, 'label:email-user', () => page.getByLabel(/email|username/i));
    pushCandidate(candidates, seen, 'placeholder:email-user', () => page.getByPlaceholder(/email|username/i));
    pushCandidate(candidates, seen, 'css:email-user', () => page.locator('input[name="username"], input[name*="email" i], input[type="email"], input[autocomplete="username"]'));
  }

  if (lower.includes('password')) {
    pushCandidate(candidates, seen, 'label:password', () => page.getByLabel(/password/i));
    pushCandidate(candidates, seen, 'placeholder:password', () => page.getByPlaceholder(/password/i));
    pushCandidate(candidates, seen, 'css:password', () => page.locator('input[type="password"], input[name="password"], input[autocomplete="current-password"], input[autocomplete="new-password"]'));
  }

  if (lower.includes('message') || lower.includes('comment')) {
    pushCandidate(candidates, seen, 'label:message', () => page.getByLabel(/message|comment/i));
    pushCandidate(candidates, seen, 'placeholder:message', () => page.getByPlaceholder(/message|comment/i));
    pushCandidate(candidates, seen, 'css:message', () => page.locator('textarea, [contenteditable="true"], textarea[name*="message" i], textarea[name*="comment" i]'));
  }

  if (lower.includes('name')) {
    pushCandidate(candidates, seen, 'label:name', () => page.getByLabel(/name/i));
    pushCandidate(candidates, seen, 'placeholder:name', () => page.getByPlaceholder(/name/i));
    pushCandidate(candidates, seen, 'css:name', () => page.locator('input[name*="name" i], input[placeholder*="name" i]'));
  }

  if (lower.includes('subject')) {
    pushCandidate(candidates, seen, 'label:subject', () => page.getByLabel(/subject/i));
    pushCandidate(candidates, seen, 'placeholder:subject', () => page.getByPlaceholder(/subject/i));
    pushCandidate(candidates, seen, 'css:subject', () => page.locator('input[name*="subject" i], input[placeholder*="subject" i]'));
  }

  if (lower.includes('address')) {
    pushCandidate(candidates, seen, 'label:address', () => page.getByLabel(/address/i));
    pushCandidate(candidates, seen, 'placeholder:address', () => page.getByPlaceholder(/address/i));
    pushCandidate(candidates, seen, 'css:address', () => page.locator('input[name*="address" i], textarea[name*="address" i], input[placeholder*="address" i]'));
  }

  if (lower.includes('city')) {
    pushCandidate(candidates, seen, 'label:city', () => page.getByLabel(/city/i));
    pushCandidate(candidates, seen, 'placeholder:city', () => page.getByPlaceholder(/city/i));
    pushCandidate(candidates, seen, 'css:city', () => page.locator('input[name*="city" i], input[placeholder*="city" i]'));
  }

  if (lower.includes('state')) {
    pushCandidate(candidates, seen, 'label:state', () => page.getByLabel(/state/i));
    pushCandidate(candidates, seen, 'role:combobox-state', () => page.getByRole('combobox', { name: /state/i }));
    pushCandidate(candidates, seen, 'css:state', () => page.locator('select[name*="state" i], input[name*="state" i], [aria-label*="state" i]'));
  }

  if (lower.includes('zip') || lower.includes('postal')) {
    pushCandidate(candidates, seen, 'label:zip', () => page.getByLabel(/zip|postal/i));
    pushCandidate(candidates, seen, 'placeholder:zip', () => page.getByPlaceholder(/zip|postal/i));
    pushCandidate(candidates, seen, 'css:zip', () => page.locator('input[name*="zip" i], input[name*="postal" i], input[placeholder*="zip" i]'));
  }

  if (lower.includes('promo') || lower.includes('coupon')) {
    pushCandidate(candidates, seen, 'label:promo', () => page.getByLabel(/promo|coupon/i));
    pushCandidate(candidates, seen, 'placeholder:promo', () => page.getByPlaceholder(/promo|coupon/i));
    pushCandidate(candidates, seen, 'css:promo', () => page.locator('input[name*="promo" i], input[name*="coupon" i], input[placeholder*="promo" i]'));
  }

  if (lower.includes('card number')) {
    pushCandidate(candidates, seen, 'label:card', () => page.getByLabel(/card number/i));
    pushCandidate(candidates, seen, 'css:card', () => page.locator('input[name*="card" i], input[autocomplete="cc-number"]'));
  }

  if (lower.includes('expiry')) {
    pushCandidate(candidates, seen, 'label:expiry', () => page.getByLabel(/expiry|expiration/i));
    pushCandidate(candidates, seen, 'css:expiry', () => page.locator('input[name*="expiry" i], input[autocomplete="cc-exp"]'));
  }

  if (lower.includes('cvv') || lower.includes('cvc')) {
    pushCandidate(candidates, seen, 'label:cvv', () => page.getByLabel(/cvv|cvc|security code/i));
    pushCandidate(candidates, seen, 'css:cvv', () => page.locator('input[name*="cvv" i], input[autocomplete="cc-csc"]'));
  }

  if (lower.includes('file') || lower.includes('upload')) {
    pushCandidate(candidates, seen, 'label:file', () => page.getByLabel(/upload|file/i));
    pushCandidate(candidates, seen, 'css:file', () => page.locator('input[type="file"]'));
  }

  if (lower.includes('dropdown') || lower.includes('menu') || lower.includes('select')) {
    pushCandidate(candidates, seen, `role:combobox:${nameText}`, () => page.getByRole('combobox', { name: namePattern }));
    pushCandidate(candidates, seen, `label:combobox:${nameText}`, () => page.getByLabel(namePattern));
  }

  if (lower.includes('checkbox')) {
    pushCandidate(candidates, seen, `role:checkbox:${nameText}`, () => page.getByRole('checkbox', { name: namePattern }));
  }

  if (lower.includes('radio')) {
    pushCandidate(candidates, seen, `role:radio:${nameText}`, () => page.getByRole('radio', { name: namePattern }));
  }

  if (lower.includes('link')) {
    pushCandidate(candidates, seen, `role:link:${nameText}`, () => page.getByRole('link', { name: namePattern }));
  }

  if (lower.includes('button') || action === 'click') {
    pushCandidate(candidates, seen, `role:button:${nameText}`, () => page.getByRole('button', { name: namePattern }));
  }

  if (action === 'fill') {
    pushCandidate(candidates, seen, `label:fill:${nameText}`, () => page.getByLabel(namePattern));
    pushCandidate(candidates, seen, `placeholder:fill:${nameText}`, () => page.getByPlaceholder(namePattern));
    pushCandidate(candidates, seen, `css:fillable:${nameText}`, () => page.locator(`input[name*="${escapeAttributeValue(nameText)}" i], textarea[name*="${escapeAttributeValue(nameText)}" i], input[id*="${escapeAttributeValue(nameText)}" i], textarea[id*="${escapeAttributeValue(nameText)}" i], input[placeholder*="${escapeAttributeValue(nameText)}" i], textarea[placeholder*="${escapeAttributeValue(nameText)}" i], [contenteditable="true"][aria-label*="${escapeAttributeValue(nameText)}" i], input[aria-label*="${escapeAttributeValue(nameText)}" i], textarea[aria-label*="${escapeAttributeValue(nameText)}" i]`));
  }

  if (action === 'select') {
    pushCandidate(candidates, seen, `role:combobox-action:${nameText}`, () => page.getByRole('combobox', { name: namePattern }));
  }

  if (action !== 'fill' && action !== 'select' && action !== 'upload') {
    pushCandidate(candidates, seen, `text:${nameText}`, () => page.getByText(namePattern, { exact: false }));
  }

  if (/^[a-z0-9_\-\s]+$/i.test(nameText)) {
    const attrText = escapeAttributeValue(nameText);
    if (action === 'fill') {
      pushCandidate(candidates, seen, `css:name:${attrText}`, () => page.locator(`input[name*="${attrText}" i], textarea[name*="${attrText}" i], input[id*="${attrText}" i], textarea[id*="${attrText}" i], input[placeholder*="${attrText}" i], textarea[placeholder*="${attrText}" i], [contenteditable="true"][aria-label*="${attrText}" i], input[aria-label*="${attrText}" i], textarea[aria-label*="${attrText}" i]`));
    } else {
      pushCandidate(candidates, seen, `css:name:${attrText}`, () => page.locator(`[name*="${attrText}" i], [id*="${attrText}" i], [aria-label*="${attrText}" i], [placeholder*="${attrText}" i]`));
    }
  }

  if (rawText.includes('#') || rawText.includes('.') || rawText.includes('[')) {
    pushCandidate(candidates, seen, `css:raw:${rawText}`, () => page.locator(rawText));
  }

  return candidates;
}

async function isCompatibleCandidate(locator, action) {
  if (action === 'fill') {
    return locator.evaluate((element) => {
      const tagName = element.tagName.toLowerCase();
      const role = (element.getAttribute('role') || '').toLowerCase();
      return (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        element.isContentEditable ||
        role === 'textbox' ||
        role === 'searchbox' ||
        role === 'combobox' ||
        role === 'spinbutton'
      );
    });
  }

  if (action === 'select') {
    return locator.evaluate((element) => {
      const tagName = element.tagName.toLowerCase();
      const role = (element.getAttribute('role') || '').toLowerCase();
      return tagName === 'select' || role === 'combobox' || role === 'listbox';
    });
  }

  if (action === 'upload') {
    return locator.evaluate((element) => {
      const tagName = element.tagName.toLowerCase();
      return tagName === 'input' && element.getAttribute('type') === 'file';
    });
  }

  return true;
}

async function resolveLocator(page, elementText, options = {}) {
  const timeout = options.timeout ?? 1500;
  const action = options.action || 'click';
  const candidates = getCandidateLocators(page, elementText, options);
  const failures = [];

  for (const createLocator of candidates) {
    const locator = createLocator();

    try {
      const count = await locator.count();
      if (count === 0) {
        failures.push('no-match');
        continue;
      }

      for (let index = 0; index < Math.min(count, 5); index += 1) {
        const candidate = locator.nth(index);
        if (await candidate.isVisible({ timeout }) && await isCompatibleCandidate(candidate, action)) {
          return candidate;
        }
      }

      failures.push('not-visible');
    } catch (error) {
      failures.push(error.message);
    }
  }

  throw new Error(`Unable to resolve locator for "${elementText}". Tried ${candidates.length} strategies.`);
}

export async function clickByDescription(page, elementText) {
  const locator = await resolveLocator(page, elementText, { action: 'click' });
  await locator.click();
}

export async function dblclickByDescription(page, elementText) {
  const locator = await resolveLocator(page, elementText, { action: 'click' });
  await locator.dblclick();
}

export async function rightClickByDescription(page, elementText) {
  const locator = await resolveLocator(page, elementText, { action: 'click' });
  await locator.click({ button: 'right' });
}

export async function hoverByDescription(page, elementText) {
  const locator = await resolveLocator(page, elementText, { action: 'hover' });
  await locator.hover();
}

export async function fillByDescription(page, elementText, value) {
  const locator = await resolveLocator(page, elementText, { action: 'fill' });
  await locator.fill(value);
}

export async function clearByDescription(page, elementText) {
  const locator = await resolveLocator(page, elementText, { action: 'fill' });
  await locator.fill('');
}

export async function selectByDescription(page, elementText, value) {
  const locator = await resolveLocator(page, elementText, { action: 'select' });
  await locator.selectOption(value);
}

export async function setInputFilesByDescription(page, elementText, filePath) {
  const locator = await resolveLocator(page, elementText, { action: 'upload' });
  await locator.setInputFiles(filePath);
}

export async function waitForByDescription(page, elementText) {
  await resolveLocator(page, elementText, { action: 'wait', timeout: 3000 });
}

export async function expectVisibleByDescription(page, elementText) {
  const locator = await resolveLocator(page, elementText, { action: 'verify', timeout: 3000 });
  return locator;
}

export async function expectTextVisible(page, text) {
  const locator = page.getByText(new RegExp(escapeRegex(text), 'i'));
  const count = await locator.count();

  for (let index = 0; index < Math.min(count, 50); index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible({ timeout: 3000 })) {
      return;
    }
  }

  throw new Error(`Visible text not found for "${text}"`);
}
