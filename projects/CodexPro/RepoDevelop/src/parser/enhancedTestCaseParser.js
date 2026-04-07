/**
 * Enhanced AI-Powered Test Case Parser
 * Supports more natural language variations and flexible text input
 */

class EnhancedTestCaseParser {
  constructor() {
    this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    // Expanded action keywords - NOW YOU CAN USE ANY OF THESE!
    this.actionKeywords = {
      navigate: [
        'navigate', 'go to', 'open', 'visit', 'load', 'browse to', 
        'access', 'launch', 'start at', 'redirect to', 'land on'
      ],
      click: [
        'click', 'press', 'tap', 'hit', 'push', 
        'activate', 'trigger', 'choose', 'pick', 'click on'
      ],
      press: [
        'press key', 'hit key', 'press enter', 'hit enter', 'press tab', 'hit tab',
        'press escape', 'hit escape', 'press esc', 'hit esc', 'press space', 'hit space'
      ],
      fill: [
        'enter', 'type', 'input', 'fill', 'write', 'put', 
        'set', 'insert', 'add', 'provide', 'key in', 'fill in',
        'populate', 'complete'
      ],
      select: [
        'select', 'choose', 'pick', 'opt for', 'go with',
        'decide on', 'take', 'use'
      ],
      verify: [
        'verify', 'check', 'assert', 'should', 'ensure', 
        'confirm', 'validate', 'test', 'see', 'expect',
        'make sure', 'look for', 'find'
      ],
      wait: [
        'wait', 'pause', 'hold', 'delay', 'sleep',
        'wait for', 'hold on', 'give it'
      ],
      hover: [
        'hover', 'mouse over', 'move to', 'point to'
      ],
      scroll: [
        'scroll', 'scroll to', 'scroll down', 'scroll up',
        'move down', 'move up', 'page down', 'page up'
      ],
      clear: [
        'clear', 'delete', 'remove', 'erase', 'empty'
      ],
      doubleClick: [
        'double click', 'double-click', 'dblclick', 'click twice'
      ],
      rightClick: [
        'right click', 'right-click', 'context menu', 'secondary click'
      ],
      upload: [
        'upload', 'attach', 'upload file', 'choose file', 'select file'
      ]
    };
  }

  /**
   * Parse test file
   */
  async parseTestFile(fileContent) {
    const lines = fileContent.split('\n').filter(line => line.trim());
    return this.parseWithEnhancedLogic(lines);
  }

  /**
   * Enhanced parser
   */
  parseWithEnhancedLogic(lines) {
    const testCases = [];
    let currentTestCase = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (this.isTestCaseHeader(line)) {
        if (currentTestCase) {
          testCases.push(currentTestCase);
        }

        currentTestCase = {
          name: this.extractTestCaseName(line),
          steps: [],
          rawSteps: []
        };
      }
      else if (currentTestCase && this.isTestStep(line)) {
        const stepText = this.cleanStepText(line);
        
        currentTestCase.rawSteps.push(stepText);
        currentTestCase.steps.push(this.parseStepEnhanced(stepText));
      }
    }

    if (currentTestCase) {
      testCases.push(currentTestCase);
    }

    return testCases;
  }

  isTestCaseHeader(line) {
    const lower = line.toLowerCase();
    return (
      lower.startsWith('test case:') ||
      lower.startsWith('test:') ||
      lower.startsWith('scenario:') ||
      lower.startsWith('feature:') ||
      lower.match(/^tc[-_\s]?\d+:/)
    );
  }

  extractTestCaseName(line) {
    return line
      .replace(/^(test case|test|scenario|feature|tc[-_\s]?\d+):/i, '')
      .trim();
  }

  isTestStep(line) {
    return (
      /^\d+[\.\)]/.test(line) ||
      /^[-*•]/.test(line) ||
      /^step\s*\d*/i.test(line) ||
      /^given|when|then|and/i.test(line)
    );
  }

  cleanStepText(line) {
    return line
      .replace(/^\d+[\.\)]/, '')
      .replace(/^[-*•]/, '')
      .replace(/^step\s*\d*:?/i, '')
      .replace(/^(given|when|then|and|but)\s+/i, '')
      .trim();
  }

  parseStepEnhanced(stepText) {
    const step = {
      action: '',
      element: '',
      data: '',
      assertion: false,
      raw: stepText
    };

    const lowerStep = stepText.toLowerCase();
    const detectedAction = this.detectAction(lowerStep);
    
    if (detectedAction) {
      step.action = detectedAction;
      
      switch (detectedAction) {
        case 'navigate':
          step.element = this.extractUrl(stepText) || this.extractQuotedText(stepText) || this.extractAfterKeywords(stepText, this.actionKeywords.navigate);
          break;
          
        case 'click':
        case 'doubleClick':
        case 'rightClick':
        case 'hover':
          step.element = this.extractElementSmart(stepText);
          break;

        case 'press':
          step.data = this.extractKeyName(stepText);
          break;
          
        case 'fill':
          step.element = this.extractFieldTarget(stepText);
          step.data = this.extractQuotedText(stepText) || this.extractValueAfterKeywords(stepText, ['with', 'as', 'to be', 'value']);
          break;
          
        case 'select':
          step.element = this.extractSelectTarget(stepText);
          step.data = this.extractQuotedText(stepText) || this.extractValueAfterKeywords(stepText, ['from', 'in']);
          break;
          
        case 'verify':
          step.assertion = true;
          step.element = this.extractVerificationTarget(stepText);
          step.data = this.extractQuotedText(stepText) || this.extractExpectedValue(stepText);
          break;
          
        case 'wait':
          step.element = this.extractWaitTarget(stepText);
          break;
          
        case 'scroll':
        case 'clear':
        case 'upload':
          step.element = this.extractElementSmart(stepText);
          if (detectedAction === 'upload') {
            step.data = this.extractQuotedText(stepText);
          }
          break;
          
        default:
          step.element = this.extractElementSmart(stepText);
      }
    } else {
      step.action = 'custom';
      step.element = stepText;
    }

    return step;
  }

  detectAction(lowerStep) {
    let bestMatch = null;

    for (const [action, keywords] of Object.entries(this.actionKeywords)) {
      for (const keyword of keywords) {
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKeyword.replace(/\s+/g, '\\s+')}\\b`, 'i');
        const match = lowerStep.match(regex);

        if (!match || typeof match.index !== 'number') {
          continue;
        }

        if (
          !bestMatch ||
          match.index < bestMatch.index ||
          (match.index === bestMatch.index && keyword.length > bestMatch.keyword.length)
        ) {
          bestMatch = { action, keyword, index: match.index };
        }
      }
    }

    if (!bestMatch) {
      return null;
    }

    if (bestMatch.action === 'select' && !this.looksLikeOptionSelection(lowerStep)) {
      return 'click';
    }

    return bestMatch.action;
  }

  looksLikeOptionSelection(text) {
    return /\b(dropdown|select|menu|option|options|list|filter|quantity|country|state|color|size)\b/i.test(text) ||
      /\bfrom\b/i.test(text);
  }

  extractElementSmart(text) {
    const quoted = this.extractQuotedText(text);
    if (quoted) return quoted;

    const patterns = [
      /(?:the|a|an)\s+['"]?([^'"]+?)['"]?\s+(button|link|field|input|checkbox|dropdown|menu|tab|icon|image)/i,
      /(button|link|field|input|checkbox|dropdown|menu|tab)\s+(?:called|labeled|named|with text|saying)\s+['"]?([^'"]+?)['"]?/i,
      /['"]?([^'"]+?)['"]?\s+(button|link|field|input|checkbox|dropdown|menu|tab|icon)/i,
      /(?:on|in|at|to|into|from)\s+(?:the\s+)?['"]?([^'"]+?)['"]?$/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1] || match[2] || match[0];
      }
    }

    return this.extractAfterAction(text);
  }

  extractAfterAction(text) {
    const lower = text.toLowerCase();
    let earliestPos = text.length;
    let actionFound = false;
    
    for (const keywords of Object.values(this.actionKeywords)) {
      for (const keyword of keywords) {
        const pos = lower.indexOf(keyword);
        if (pos !== -1 && pos < earliestPos) {
          earliestPos = pos + keyword.length;
          actionFound = true;
        }
      }
    }
    
    if (actionFound) {
      return text.substring(earliestPos).trim();
    }
    
    return text;
  }

  extractFieldTarget(text) {
    const lowered = text.toLowerCase();
    const withoutQuoted = text.replace(/["'][^"']+["']/g, '').trim();
    const fieldPatterns = [
      /\b(?:in|into|for|as)\s+(?:the\s+)?(.+?)$/i,
      /\b(?:field|input|box|textbox|textarea|bar)\b/i
    ];

    const contextual = withoutQuoted.match(/\b(?:in|into|for|as)\s+(?:the\s+)?(.+?)$/i);
    if (contextual && contextual[1]) {
      return contextual[1].trim();
    }

    for (const keyword of ['username', 'email', 'password', 'search', 'name', 'subject', 'message', 'comment', 'address', 'city', 'state', 'zip', 'promo code', 'card number', 'expiry', 'cvv']) {
      if (lowered.includes(keyword)) {
        return keyword;
      }
    }

    if (fieldPatterns.some(pattern => pattern.test(withoutQuoted))) {
      return withoutQuoted;
    }

    return this.extractElementSmart(withoutQuoted);
  }

  extractSelectTarget(text) {
    const withoutQuoted = text.replace(/["'][^"']+["']/g, '').trim();
    const match = withoutQuoted.match(/\bfrom\s+(?:the\s+)?(.+?)$/i);
    if (match && match[1]) {
      return match[1].trim();
    }

    return this.extractElementSmart(withoutQuoted);
  }

  extractVerificationTarget(text) {
    const withoutQuoted = text.replace(/["'][^"']+["']/g, '').trim();
    const match = withoutQuoted.match(/(?:that|the)\s+(.+?)\s+(?:contains|shows|displays|has|says|is|are|appears|loads)/i);
    if (match && match[1]) {
      return match[1].trim();
    }

    return this.extractElementSmart(withoutQuoted);
  }

  extractAfterKeywords(text, keywords) {
    const lower = text.toLowerCase();
    
    for (const keyword of keywords) {
      const pos = lower.indexOf(keyword);
      if (pos !== -1) {
        return text.substring(pos + keyword.length).trim();
      }
    }
    
    return text;
  }

  extractValueAfterKeywords(text, prepositions) {
    const lower = text.toLowerCase();
    
    for (const prep of prepositions) {
      const pos = lower.indexOf(` ${prep} `);
      if (pos !== -1) {
        return text.substring(pos + prep.length + 2).trim();
      }
    }
    
    return '';
  }

  extractExpectedValue(text) {
    const patterns = [
      /(?:contains|shows|displays|has|says)\s+['"]?([^'"]+?)['"]?$/i,
      /(?:is|equals|be)\s+['"]?([^'"]+?)['"]?$/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = match[1].trim();
        if (/^(displayed|visible|shown|present|available)$/i.test(value)) {
          return '';
        }
        return value;
      }
    }
    
    return this.extractQuotedText(text);
  }

  extractWaitTarget(text) {
    const timeMatch = text.match(/(\d+)\s*(second|sec|ms|millisecond)/i);
    if (timeMatch) {
      return timeMatch[0];
    }
    
    return this.extractAfterKeywords(text, ['for', 'until']);
  }

  extractQuotedText(text) {
    const match = text.match(/["']([^"']+)["']/);
    return match ? match[1] : '';
  }

  extractUrl(text) {
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
    if (urlMatch) return urlMatch[1];

    const pathMatch = text.match(/\/[^\s]*/);
    return pathMatch ? pathMatch[0] : '';
  }

  extractKeyName(text) {
    const lower = text.toLowerCase();

    if (lower.includes('enter')) return 'Enter';
    if (lower.includes('tab')) return 'Tab';
    if (lower.includes('escape') || lower.includes('esc')) return 'Escape';
    if (lower.includes('space')) return ' ';

    const quoted = this.extractQuotedText(text);
    return quoted || '';
  }

  async parseWithAI(fileContent) {
    if (this.ollamaModel) {
      try {
        return await this.parseWithOllama(fileContent);
      } catch (error) {
        console.error('Ollama parsing failed, trying next parser:', error.message);
      }
    }

    if (this.geminiApiKey) {
      try {
        return await this.parseWithGemini(fileContent);
      } catch (error) {
        console.error('Gemini parsing failed, using enhanced parser:', error.message);
      }
    }

    console.warn('No AI parser available. Using enhanced parser instead.');
    return this.parseTestFile(fileContent);
  }

  async parseWithOllama(fileContent) {
    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.ollamaModel,
        stream: false,
        options: {
          temperature: 0.1,
        },
        prompt: this.buildLLMPrompt(fileContent),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return this.parseLLMResponse(data.response || '');
  }

  async parseWithGemini(fileContent) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: this.buildLLMPrompt(fileContent),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return this.parseLLMResponse(content);
  }

  buildLLMPrompt(fileContent) {
    return `You are a test automation assistant. Parse manual test cases into a JSON array.

RULES:
- Output ONLY a JSON array. No markdown fences, no explanation, no extra text.
- "raw" = the exact original step text, copied verbatim. Never leave it empty.
- "element" = the UI element or target being acted on (e.g. "search field", "submit button", "username input").
- "data" = the value being typed or asserted. Strip surrounding quotes from the original text (e.g. "glasses" not "\\"glasses\\"").
- For "navigate": element = the full URL.
- For "fill": element = the field name extracted from the step (e.g. "Type X in search field" → element="search field", data="X").
- For "press": use action="press", element="", data = the key name exactly as: "Enter", "Tab", "Escape", "Space". Never map key presses to "click".
- For "wait": element = the duration string (e.g. "3 seconds"), data = "".
- For "verify" with a URL check: element = "page url", data = the expected URL fragment.
- For "verify" with visible text: element = "", data = the expected text.
- For "verify" with a visible element: element = the element description, data = "".
- assertion = true only for "verify" steps, false for everything else.
- Use "" for any field that has no value. Never use null.

EXAMPLE INPUT:
Test Case: Login Flow
1. Navigate to https://example.com/login
2. Type "admin" in username field
3. Type "secret" in password field
4. Click login button
5. Press Enter
6. Verify page url is "dashboard"
7. Verify text "Welcome" is displayed
8. Verify the logout button is visible
9. Mouse over the user avatar
10. Confirm search results are displayed
11. Wait for 2 seconds

EXAMPLE OUTPUT:
[
  {
    "name": "Login Flow",
    "steps": [
      { "action": "navigate", "element": "https://example.com/login", "data": "",          "assertion": false, "raw": "Navigate to https://example.com/login" },
      { "action": "fill",     "element": "username field",            "data": "admin",     "assertion": false, "raw": "Type \\"admin\\" in username field" },
      { "action": "fill",     "element": "password field",            "data": "secret",    "assertion": false, "raw": "Type \\"secret\\" in password field" },
      { "action": "click",    "element": "login button",              "data": "",          "assertion": false, "raw": "Click login button" },
      { "action": "press",    "element": "",                          "data": "Enter",     "assertion": false, "raw": "Press Enter" },
      { "action": "verify",   "element": "page url",                  "data": "dashboard", "assertion": true,  "raw": "Verify page url is \\"dashboard\\"" },
      { "action": "verify",   "element": "",                          "data": "Welcome",   "assertion": true,  "raw": "Verify text \\"Welcome\\" is displayed" },
      { "action": "verify",   "element": "logout button",             "data": "",          "assertion": true,  "raw": "Verify the logout button is visible" },
      { "action": "hover",    "element": "user avatar",               "data": "",          "assertion": false, "raw": "Mouse over the user avatar" },
      { "action": "verify",   "element": "search results",            "data": "",          "assertion": true,  "raw": "Confirm search results are displayed" },
      { "action": "wait",     "element": "2 seconds",                 "data": "",          "assertion": false, "raw": "Wait for 2 seconds" }
    ]
  }
]

Now parse these manual test cases:
${fileContent}`;
  }

  parseLLMResponse(content) {
    const cleanedContent = this.extractJSONArray(content);
    let parsed = JSON.parse(cleanedContent);

    if (!Array.isArray(parsed) && parsed !== null && typeof parsed === 'object') {
      parsed = [parsed];
    }

    if (!Array.isArray(parsed)) {
      throw new Error('LLM response was not a JSON array');
    }

    const normalized = parsed.map(testCase => ({
      name: testCase.name || 'Untitled Test Case',
      steps: Array.isArray(testCase.steps)
        ? testCase.steps.map(step => ({
            action: step.action || 'custom',
            element: step.element || '',
            data: step.data || '',
            assertion: Boolean(step.assertion),
            raw: step.raw || '',
          }))
        : [],
    }));

    if (!this.isValidParsedTestCases(normalized)) {
      throw new Error('LLM returned low-quality structured output');
    }

    return normalized;
  }

  extractJSONArray(content = '') {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');

    if (start === -1 || end === -1 || end < start) {
      throw new Error('Could not find JSON array in LLM response');
    }

    return cleaned.slice(start, end + 1);
  }

  isValidParsedTestCases(testCases) {
    if (!Array.isArray(testCases) || testCases.length === 0) {
      return false;
    }

    return testCases.every(testCase => {
      if (!testCase.name || !Array.isArray(testCase.steps) || testCase.steps.length === 0) {
        return false;
      }

      return testCase.steps.every(step => {
        if (!step.action) {
          return false;
        }

        if (step.action === 'navigate') {
          return Boolean(step.element);
        }

        if (['fill', 'select', 'hover', 'clear', 'doubleClick', 'rightClick', 'upload'].includes(step.action)) {
          return Boolean(step.element || step.data);
        }

        return true;
      });
    });
  }
}

export default EnhancedTestCaseParser;
