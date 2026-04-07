/**
 * Test Script Generator
 * Converts parsed test cases into executable Playwright test scripts
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import EnhancedTestCaseParser from '../parser/enhancedTestCaseParser.js';

class TestGenerator {
  constructor() {
    this.parser = new EnhancedTestCaseParser();
  }

  /**
   * Generate Playwright tests from manual test case file
   */
  async generateTests(inputFile, outputDir = './tests/generated') {
    console.log(`\n🚀 Generating tests from: ${inputFile}`);
    
    // Read input file
    const fileContent = fs.readFileSync(inputFile, 'utf-8');
    
    // Parse test cases (with GPT if OPENAI_API_KEY is available)
    console.log('📝 Parsing test cases...');
    const testCases = await this.parser.parseWithAI(fileContent);
    
    console.log(`✅ Found ${testCases.length} test case(s)`);
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate test file
    const testFileName = path.basename(inputFile, path.extname(inputFile)) + '.spec.js';
    const testFilePath = path.join(outputDir, testFileName);
    
    const testContent = this.generateTestContent(testCases);
    fs.writeFileSync(testFilePath, testContent);
    
    console.log(`\n✨ Test generated: ${testFilePath}`);
    console.log(`\n💡 Run tests with: npm test\n`);
    
    return testFilePath;
  }

  /**
   * Generate complete test file content
   */
  generateTestContent(testCases) {
    let content = `import { test, expect } from '@playwright/test';
import {
  clearByDescription,
  clickByDescription,
  dblclickByDescription,
  expectTextVisible,
  expectVisibleByDescription,
  fillByDescription,
  hoverByDescription,
  rightClickByDescription,
  selectByDescription,
  setInputFilesByDescription,
  waitForByDescription,
} from '../../src/utils/locatorHelper.js';
import { dismissStartupPopups } from '../../src/utils/testHelpers.js';

/**
 * Auto-generated test file
 * Generated on: ${new Date().toISOString()}
 */

`;

    testCases.forEach(testCase => {
      content += this.generateTestCase(testCase);
      content += '\n';
    });

    return content;
  }

  /**
   * Generate individual test case
   */
  generateTestCase(testCase) {
    const testName = this.sanitizeTestName(testCase.name);
    
    let testCode = `test('${testName}', async ({ page }) => {\n`;
    
    testCase.steps.forEach(step => {
      const stepCode = this.generateStepCode(step);
      if (stepCode) {
        testCode += `  ${stepCode}\n`;
      }
    });
    
    testCode += `});\n`;
    
    return testCode;
  }

  /**
   * Generate code for individual step
   */
  generateStepCode(step) {
    switch (step.action) {
      case 'navigate':
        if (step.element.startsWith('http') || step.element.startsWith('/')) {
          return `await page.goto('${step.element}');\n  await dismissStartupPopups(page);`;
        }
        return `// Navigate to: ${step.raw}`;
        
      case 'click':
        return this.generateClickCode(step);
        
      case 'fill':
        return this.generateFillCode(step);
        
      case 'select':
        return this.generateSelectCode(step);
        
      case 'verify':
        return this.generateVerifyCode(step);
        
      case 'wait':
        return this.generateWaitCode(step);

      case 'press':
        return this.generatePressCode(step);

      case 'hover':
        return `await hoverByDescription(page, ${this.toJsString(step.element)});`;

      case 'scroll':
        return this.generateScrollCode(step);

      case 'clear':
        return `await clearByDescription(page, ${this.toJsString(step.element)});`;

      case 'doubleClick':
        return `await dblclickByDescription(page, ${this.toJsString(step.element)});`;

      case 'rightClick':
        return `await rightClickByDescription(page, ${this.toJsString(step.element)});`;

      case 'upload':
        if (step.data) {
          return `await setInputFilesByDescription(page, ${this.toJsString(step.element || 'file input')}, ${this.toJsString(step.data)});`;
        }
        return `// Upload: ${step.raw}`;
        
      default:
        return `// ${step.raw}`;
    }
  }

  /**
   * Generate click action code
   */
  generateClickCode(step) {
    return `await clickByDescription(page, ${this.toJsString(step.element)});`;
  }

  /**
   * Generate fill/input action code
   */
  generateFillCode(step) {
    const data = step.data || 'test-data';
    return `await fillByDescription(page, ${this.toJsString(step.element)}, ${this.toJsString(data)});`;
  }

  /**
   * Generate select action code
   */
  generateSelectCode(step) {
    const value = step.data || '';
    return `await selectByDescription(page, ${this.toJsString(step.element)}, ${this.toJsString(value)});`;
  }

  generatePressCode(step) {
    const key = step.data || step.element || 'Enter';
    return `await page.keyboard.press(${this.toJsString(key)});`;
  }

  /**
   * Generate verification/assertion code
   */
  generateVerifyCode(step) {
    const element = step.element.toLowerCase();

    if (element.includes('url') || element.includes('page')) {
      if (step.data) {
        return `await expect(page).toHaveURL(/${step.data}/);`;
      }
    }

    if (step.data) {
      return `await expectTextVisible(page, ${this.toJsString(step.data)});`;
    }
    
    if (element.includes('visible') || element.includes('displayed') || element.includes('shown')) {
      return `await expect(await expectVisibleByDescription(page, ${this.toJsString(step.element)})).toBeVisible();`;
    }
    
    if (element.includes('text') || element.includes('message')) {
      return `await expect(await expectVisibleByDescription(page, ${this.toJsString(step.element)})).toBeVisible();`;
    }

    if (step.element) {
      return `await expect(await expectVisibleByDescription(page, ${this.toJsString(step.element)})).toBeVisible();`;
    }

    return `// Verify: ${step.raw}`;
  }

  /**
   * Generate wait action code
   */
  generateWaitCode(step) {
    const element = step.element.toLowerCase();
    
    if (element.includes('second') || element.includes('ms')) {
      const timeMatch = element.match(/(\d+)/);
      let time = timeMatch ? parseInt(timeMatch[1], 10) : 1000;
      if (element.includes('second') && !element.includes('ms')) {
        time *= 1000;
      }
      return `await page.waitForTimeout(${time});`;
    }
    
    return `await waitForByDescription(page, ${this.toJsString(step.element)});`;
  }

  generateScrollCode(step) {
    const element = step.element.toLowerCase();

    if (element.includes('bottom')) {
      return `await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));`;
    }

    if (element.includes('top')) {
      return `await page.evaluate(() => window.scrollTo(0, 0));`;
    }

    return `await (await expectVisibleByDescription(page, ${this.toJsString(step.element)})).scrollIntoViewIfNeeded();`;
  }

  toJsString(value = '') {
    return JSON.stringify(value);
  }

  /**
   * Sanitize test name for Playwright
   */
  sanitizeTestName(name) {
    return name
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Generate tests from directory of test case files
   */
  async generateTestsFromDirectory(inputDir, outputDir = './tests/generated') {
    const files = fs.readdirSync(inputDir)
      .filter(file => file.endsWith('.txt'));
    
    console.log(`\n📁 Found ${files.length} test case file(s) in ${inputDir}`);
    
    const generatedFiles = [];
    for (const file of files) {
      const inputPath = path.join(inputDir, file);
      const outputPath = await this.generateTests(inputPath, outputDir);
      generatedFiles.push(outputPath);
    }
    
    return generatedFiles;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new TestGenerator();
  
  const inputPath = process.argv[2] || './manual-test-cases';
  const outputPath = process.argv[3] || './tests/generated';
  
  if (fs.existsSync(inputPath)) {
    const stats = fs.statSync(inputPath);
    
    if (stats.isDirectory()) {
      generator.generateTestsFromDirectory(inputPath, outputPath);
    } else {
      generator.generateTests(inputPath, outputPath);
    }
  } else {
    console.error(`❌ Error: Path not found: ${inputPath}`);
    console.log('\nUsage:');
    console.log('  node src/generator/testGenerator.js <input-file-or-dir> [output-dir]');
    console.log('\nExamples:');
    console.log('  node src/generator/testGenerator.js ./manual-test-cases/login.txt');
    console.log('  node src/generator/testGenerator.js ./manual-test-cases');
  }
}

export default TestGenerator;
