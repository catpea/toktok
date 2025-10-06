#!/usr/bin/env node
import Tokenizer from './index.js'

console.log('='.repeat(60));
console.log('ENHANCED TOKENIZER TEST SUITE');
console.log('='.repeat(60));

// Test 1: Basic CSS with position tracking
{
  console.log('\n📍 Test 1: Position Tracking');
  const code = `.hello-item {
  padding: 1rem;
}`;
  const tokenizer = new Tokenizer(code, { trackPosition: true });
  const tokens = tokenizer.tokenize();
  console.log('Code:', code);
  console.log('First token:', JSON.stringify(tokens[0], null, 2));
}

// Test 2: Hex, Binary, Octal numbers
{
  console.log('\n🔢 Test 2: Special Number Formats');
  const code = 'let hex = 0xFF; let bin = 0b1010; let oct = 0o755; let sci = 1.5e10;';
  const tokenizer = new Tokenizer(code);
  console.log('Code:', code);
  const numbers = tokenizer.tokenize().filter(t => t.type === 'number');
  console.log('Numbers found:', numbers);
}

// Test 3: Regular expressions
{
  console.log('\n📝 Test 3: Regular Expression Support');
  const code = 'const pattern = /[a-z]+/gi; const result = str.match(pattern);';
  const tokenizer = new Tokenizer(code, { allowRegex: true });
  console.log('Code:', code);
  const regex = tokenizer.tokenize().find(t => t.type === 'regex');
  console.log('Regex found:', regex);
}

// Test 4: Escape sequences in strings
{
  console.log('\n🔤 Test 4: String Escape Sequences');
  const code = 'const msg = "He said \\"Hello\\" and left\\n";';
  const tokenizer = new Tokenizer(code);
  console.log('Code:', code);
  const strings = tokenizer.tokenize().filter(t => t.type === 'string');
  console.log('Strings:', strings);
}

// Test 5: Comment preservation
{
  console.log('\n💬 Test 5: Comment Handling');
  const code = `// Single line comment
  function test() {
    /* Multi-line
       comment */
    return 42;
  }`;
  const tokenizer = new Tokenizer(code, { preserveComments: true });
  console.log('Code:', code);
  const comments = tokenizer.tokenize().filter(t => t.type === 'comment');
  console.log('Comments found:', comments.length);
  comments.forEach(c => console.log('  -', c.value.trim()));
}

// Test 6: Whitespace preservation
{
  console.log('\n⎵ Test 6: Whitespace Preservation');
  const code = 'let  x  =  10;';
  const tokenizer = new Tokenizer(code, { preserveWhitespace: true });
  console.log('Code:', code);
  const tokens = tokenizer.tokenize();
  console.log('Total tokens (with whitespace):', tokens.length);
  console.log('Whitespace tokens:', tokens.filter(t => t.type === 'whitespace').length);
}

// Test 7: Multi-character operators
{
  console.log('\n⚡ Test 7: Multi-Character Operators');
  const code = 'if (x === 10 && y !== 5) { x += 1; }';
  const tokenizer = new Tokenizer(code);
  console.log('Code:', code);
  const operators = tokenizer.tokenize().filter(t =>
    t.type === 'symbol' && t.value.length > 1
  );
  console.log('Multi-char operators:', operators.map(o => o.value));
}

// Test 8: Mismatched brackets error
{
  console.log('\n❌ Test 8: Error Handling - Mismatched Brackets');
  const code = 'function test() { return [1, 2, 3); }';
  try {
    const tokenizer = new Tokenizer(code);
    tokenizer.tokenize();
  } catch (error) {
    console.log('Error caught:', error.message.split('\n')[0]);
  }
}

// Test 9: Utility methods
{
  console.log('\n🔧 Test 9: Utility Methods');
  const code = 'function add(a, b) { return a + b; }';
  const tokenizer = new Tokenizer(code);
  tokenizer.tokenize();

  console.log('Statistics:', tokenizer.getStats());
  console.log('All identifiers:', tokenizer.find(t => t.type === 'identifier').map(t => t.value));
}

// Test 10: Pretty printing
{
  console.log('\n🖨️  Test 10: Pretty Print');
  const code = 'const obj = { x: [1, 2], y: 3 };';
  const tokenizer = new Tokenizer(code, { trackPosition: true });
  tokenizer.tokenize();
  console.log('Code:', code);
  console.log('Tokens:\n' + tokenizer.toString());
}

// Test 11: Complex real-world example
{
  console.log('\n🌍 Test 11: Real-World JavaScript');
  const code = `
export default function install(system) {
  const params = await fetch("./config.json");
  const regex = /^[a-z0-9]+$/i;
  const value = 0xFF + 0b1010; // Hex + Binary
  system.install({ name: "app", version: "1.0.0" });
}`;
  const tokenizer = new Tokenizer(code, {
    trackPosition: true,
    preserveComments: true,
    allowRegex: true
  });
  const tokens = tokenizer.tokenize();
  console.log('Code:', code.trim());
  console.log('\nStatistics:', tokenizer.getStats());
  console.log('Identifiers:', new Set(
    tokenizer.find(t => t.type === 'identifier').map(t => t.value)
  ));
}

// Test 12: Performance test
{
  console.log('\n⚡ Test 12: Performance');
  const largeCode = 'let x = 1;\n'.repeat(1000);
  const start = performance.now();
  const tokenizer = new Tokenizer(largeCode);
  tokenizer.tokenize();
  const end = performance.now();
  console.log(`Tokenized ${largeCode.length} chars in ${(end - start).toFixed(2)}ms`);
  console.log('Stats:', tokenizer.getStats());
}

console.log('\n' + '='.repeat(60));
console.log('✅ All tests completed!');
console.log('='.repeat(60));
