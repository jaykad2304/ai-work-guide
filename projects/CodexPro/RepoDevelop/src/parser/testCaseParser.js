/**
 * AI-Powered Test Case Parser
 * Uses Claude API to intelligently parse manual test cases from text files
 */

class TestCaseParser {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
  }

  /**
   * Parse a text file containing manual test cases
   * @param {string} filePath - Path to the text file
   * @returns {Promise<Array>} - Parsed test cases
   */
  async parseTestFile(fileContent) {
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    // Simple parser - can be enhanced with AI
    return this.parseSimpleFormat(lines);
  }

  /**
   * Parse simple format test cases
   * Format: 
   * Test Case: Login functionality
   * 1. Navigate to login page
   * 2. Enter username "user@example.com"
   * 3. Enter password "password123"
   * 4. Click login button
   * 5. Verify user is logged in
   */
  parseSimpleFormat(lines) {
    const testCases = [];
    let currentTestCase = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if it's a test case header
      if (line.toLowerCase().startsWith('test case:') || 
          line.toLowerCase().startsWith('test:') ||
          line.toLowerCase().startsWith('scenario:')) {
        
        if (currentTestCase) {
          testCases.push(currentTestCase);
        }

        currentTestCase = {
          name: line.split(':')[1].trim(),
          steps: [],
          rawSteps: []
        };
      }
      // Check if it's a step (numbered or bulleted)
      else if (currentTestCase && (
        /^\d+[\.\)]/.test(line) || 
        /^[-*]/.test(line) ||
        line.toLowerCase().startsWith('step')
      )) {
        const stepText = line.replace(/^\d+[\.\)]/, '')
                            .replace(/^[-*]/, '')
                            .replace(/^step\s*\d*:?/i, '')
                            .trim();
        
        currentTestCase.rawSteps.push(stepText);
        currentTestCase.steps.push(this.parseStep(stepText));
      }
    }

    if (currentTestCase) {
      testCases.push(currentTestCase);
    }

    return testCases;
  }

  /**
   * Parse individual step and extract action, element, and data
   */
  parseStep(stepText) {
    const step = {
      action: '',
      element: '',
      data: '',
      assertion: false,
      raw: stepText
    };

    const lowerStep = stepText.toLowerCase();

    // Identify action type
    if (lowerStep.includes('navigate') || lowerStep.includes('go to') || lowerStep.includes('open')) {
      step.action = 'navigate';
      step.element = this.extractUrl(stepText) || this.extractQuotedText(stepText);
    }
    else if (lowerStep.includes('click') || lowerStep.includes('press')) {
      step.action = 'click';
      step.element = this.extractElement(stepText);
    }
    else if (lowerStep.includes('enter') || lowerStep.includes('type') || lowerStep.includes('input')) {
      step.action = 'fill';
      step.element = this.extractElement(stepText);
      step.data = this.extractQuotedText(stepText);
    }
    else if (lowerStep.includes('select') || lowerStep.includes('choose')) {
      step.action = 'select';
      step.element = this.extractElement(stepText);
      step.data = this.extractQuotedText(stepText);
    }
    else if (lowerStep.includes('verify') || lowerStep.includes('check') || 
             lowerStep.includes('assert') || lowerStep.includes('should')) {
      step.action = 'verify';
      step.assertion = true;
      step.element = this.extractElement(stepText);
      step.data = this.extractQuotedText(stepText);
    }
    else if (lowerStep.includes('wait')) {
      step.action = 'wait';
      step.element = this.extractElement(stepText);
    }
    else {
      step.action = 'custom';
    }

    return step;
  }

  /**
   * Extract element identifier from step text
   */
  extractElement(text) {
    // Look for common element patterns
    const patterns = [
      /(?:button|link|field|input|checkbox|radio|dropdown|menu)\s+["']([^"']+)["']/i,
      /["']([^"']+)["']\s+(?:button|link|field|input|checkbox|radio|dropdown)/i,
      /(?:on|in|from|to)\s+the\s+["']?([^"'\n]+?)["']?\s+(?:button|link|field|input|checkbox|radio|dropdown)/i,
      /(?:button|link|field|input|checkbox|radio|dropdown|menu)(?:\s+labeled)?\s+["']?([^"'\n]+?)["']?$/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return text;
  }

  /**
   * Extract quoted text (for data values)
   */
  extractQuotedText(text) {
    const match = text.match(/["']([^"']+)["']/);
    return match ? match[1] : '';
  }

  /**
   * Extract URL from text
   */
  extractUrl(text) {
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
    if (urlMatch) return urlMatch[1];

    const pathMatch = text.match(/\/[^\s]*/);
    return pathMatch ? pathMatch[0] : '';
  }

  /**
   * Enhanced AI-powered parsing using Claude API
   * This method can intelligently understand complex test cases
   */
  async parseWithAI(fileContent) {
    if (!this.apiKey) {
      console.warn('ANTHROPIC_API_KEY not set. Using basic parser instead.');
      return this.parseTestFile(fileContent);
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: `Parse the following manual test cases into a structured JSON format. 
            
For each test case, extract:
- name: test case name
- steps: array of step objects with:
  - action: (navigate, click, fill, select, verify, wait)
  - element: element identifier (text, id, selector hint)
  - data: any input data
  - assertion: true if it's a verification step

Test cases:
${fileContent}

Respond ONLY with valid JSON array, no markdown backticks.`
          }]
        })
      });

      const data = await response.json();
      const content = data.content[0].text;
      
      // Parse JSON response
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('AI parsing failed, falling back to basic parser:', error.message);
      return this.parseTestFile(fileContent);
    }
  }
}

export default TestCaseParser;
