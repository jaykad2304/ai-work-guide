function pushCandidate(candidates, seen, key, factory) {
  if (!key || seen.has(key)) {
    return;
  }

  seen.add(key);
  candidates.push(factory);
}

function getHostname(page) {
  try {
    return new URL(page.url()).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function addAmazonCandidates(page, lower, candidates, seen) {
  if (lower.includes('search field') || lower.includes('search box')) {
    pushCandidate(candidates, seen, 'amazon:search-input', () => page.locator('#twotabsearchtextbox'));
    pushCandidate(candidates, seen, 'amazon:search-role', () => page.getByRole('searchbox', { name: /search amazon/i }));
  }

  if (lower.includes('search button') || lower === 'search' || lower.includes('go button')) {
    pushCandidate(candidates, seen, 'amazon:search-submit', () => page.locator('#nav-search-submit-button'));
    pushCandidate(candidates, seen, 'amazon:search-go', () => page.getByRole('button', { name: /^go$/i }));
  }

  if (lower.includes('search dropdown') || (lower.includes('dropdown') && lower.includes('search'))) {
    pushCandidate(candidates, seen, 'amazon:search-dropdown', () => page.locator('#searchDropdownBox'));
    pushCandidate(candidates, seen, 'amazon:department-combobox', () => page.getByRole('combobox', { name: /department.*search/i }));
  }

  if (lower === 'amazon' || lower.includes('amazon logo')) {
    pushCandidate(candidates, seen, 'amazon:logo', () => page.locator('#nav-logo-sprites'));
    pushCandidate(candidates, seen, 'amazon:logo-link', () => page.getByRole('link', { name: /amazon/i }));
  }

  if (lower.includes('sign in')) {
    pushCandidate(candidates, seen, 'amazon:signin-link', () => page.getByRole('link', { name: /hello,\s*sign in/i }));
    pushCandidate(candidates, seen, 'amazon:signin-text', () => page.getByText(/sign in/i));
  }

  if (lower.includes('results')) {
    pushCandidate(candidates, seen, 'amazon:results', () => page.locator('[data-component-type="s-search-result"]'));
  }
}

function addFlipkartCandidates(page, lower, action, candidates, seen) {
  if (lower.includes('search')) {
    if (action === 'fill') {
      pushCandidate(candidates, seen, 'flipkart:search-input-name', () => page.locator('input[name="q"]'));
      pushCandidate(candidates, seen, 'flipkart:search-input-placeholder', () => page.getByPlaceholder(/search for products/i));
      pushCandidate(candidates, seen, 'flipkart:search-textbox', () => page.getByRole('textbox', { name: /search for products/i }));
    }

    if (action === 'click' || lower.includes('button')) {
      pushCandidate(candidates, seen, 'flipkart:search-submit', () => page.locator('button[type="submit"]'));
      pushCandidate(candidates, seen, 'flipkart:search-submit-icon', () => page.getByRole('button', { name: /search/i }));
    }
  }

  if (lower.includes('result')) {
    pushCandidate(candidates, seen, 'flipkart:results-grid', () => page.locator('[data-id], [class*="slAVV4"], [class*="_75nlfW"]'));
    pushCandidate(candidates, seen, 'flipkart:results-link', () => page.locator('a[href*="/search"]'));
  }

  if (lower.includes('first product')) {
    pushCandidate(candidates, seen, 'flipkart:first-product-card', () => page.locator('a[href*="/p/"], a[href*="/itm"]').first());
  }

  if (lower.includes('product title')) {
    pushCandidate(candidates, seen, 'flipkart:product-title', () => page.locator('a[title], [class*="KzDlHZ"], [class*="wjcEIp"]'));
  }

  if (lower.includes('login')) {
    pushCandidate(candidates, seen, 'flipkart:login-link', () => page.getByRole('link', { name: /^login$/i }));
    pushCandidate(candidates, seen, 'flipkart:login-button', () => page.getByRole('button', { name: /^login$/i }));
  }

  if (lower.includes('mobile number') || lower.includes('email/mobile')) {
    pushCandidate(candidates, seen, 'flipkart:mobile-input', () => page.locator('input[type="tel"], input[inputmode="numeric"], input[autocomplete="off"]'));
    pushCandidate(candidates, seen, 'flipkart:mobile-placeholder', () => page.getByPlaceholder(/email\/mobile number/i));
    pushCandidate(candidates, seen, 'flipkart:mobile-label', () => page.getByLabel(/email\/mobile number|mobile number/i));
  }
}

export function addSiteProfileCandidates(page, lower, action, candidates, seen) {
  const hostname = getHostname(page);

  if (hostname.includes('amazon.')) {
    addAmazonCandidates(page, lower, candidates, seen);
  }

  if (hostname.includes('flipkart.')) {
    addFlipkartCandidates(page, lower, action, candidates, seen);
  }
}
