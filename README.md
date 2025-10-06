# toktok
# Universal Tokenizer

A lightweight, fast, and flexible tokenizer for C-like syntax languages (JavaScript, CSS, JSON, Java, C#, etc.)

## Features

✅ **String Handling**
- Escape sequences (`\"`, `\'`, `\\`, etc.)
- Template literals support
- Multiple quote styles (`, ', ")

✅ **Number Formats**
- Decimal: `123`, `45.67`
- Hexadecimal: `0xFF`, `0xDEADBEEF`
- Binary: `0b1010`, `0b11110000`
- Octal: `0o755`, `0o644`
- Scientific notation: `1.5e10`, `3.14e-5`

✅ **Comments**
- Single-line: `// comment`
- Multi-line: `/* comment */`
- Optional preservation

✅ **Regular Expressions**
- Pattern detection: `/[a-z]+/gi`
- Flags support
- Context-aware parsing

✅ **Advanced Operators**
- Multi-character: `===`, `!==`, `<=`, `>=`, `=>`, `&&`, `||`
- Assignment: `+=`, `-=`, `*=`, `/=`
- Increment/Decrement: `++`, `--`

✅ **Block Tracking**
- Nested structures: `[{()}]`
- Balanced bracket validation
- Mismatched bracket detection

✅ **Position Tracking**
- Line and column numbers
- Token location metadata
- Error context with visual pointer

✅ **Utility Methods**
- Filter tokens by type
- Find tokens with predicates
- Pretty printing
- Statistics generation

## Installation

```bash
npm install toktok
```

## Basic Usage

```javascript
import Tokenizer from 'toktok';

const code = 'function add(a, b) { return a + b; }';
const tokenizer = new Tokenizer(code);
const tokens = tokenizer.tokenize();

console.log(JSON.stringify(tokens, null, 2));
```

## Options

```javascript
const tokenizer = new Tokenizer(code, {
  trackPosition: true,        // Track line/column numbers
  preserveWhitespace: false,  // Include whitespace tokens
  preserveComments: true,     // Include comment tokens
  allowRegex: true,           // Parse regular expressions
  hexNumbers: true,           // Parse 0x... numbers
  binaryNumbers: true,        // Parse 0b... numbers
  octalNumbers: true,         // Parse 0o... numbers
  templateLiterals: true,     // Parse template strings
  customOperators: []         // Add custom operators
});
```

## Token Types

Tokens have the following structure:

```javascript
{
  type: 'identifier' | 'number' | 'string' | 'symbol' | 'comment' | 'regex' | 'block',
  value: 'token-value',
  position: {              // If trackPosition: true
    start: { line: 1, column: 5 },
    end: { line: 1, column: 13 }
  },
  format: 'hex'           // For numbers: 'hex', 'binary', 'octal', 'decimal'
}
```

### Block Tokens

```javascript
{
  type: 'block',
  opener: '{',
  closer: '}',
  children: [ /* nested tokens */ ]
}
```

## Utility Methods

### Filter by Type

```javascript
const identifiers = tokenizer.filter('identifier');
const numbers = tokenizer.filter('number');
```

### Find with Predicate

```javascript
const functions = tokenizer.find(token =>
  token.type === 'identifier' && token.value === 'function'
);
```

### Pretty Print

```javascript
console.log(tokenizer.toString());
// Output:
// identifier: "function"
// identifier: "add"
// block: (...)
//   identifier: "a"
//   symbol: ","
//   identifier: "b"
```

### Statistics

```javascript
const stats = tokenizer.getStats();
// {
//   total: 15,
//   byType: {
//     identifier: 5,
//     symbol: 7,
//     block: 3
//   },
//   lines: 3
// }
```

## Error Handling

Errors include context and visual pointer:

```javascript
try {
  const tokenizer = new Tokenizer('function test() { return [1, 2, 3); }');
  tokenizer.tokenize();
} catch (error) {
  console.log(error.message);
}
```

Output:
```
Mismatched brackets: expected ']' but got ')' at line 1, column 39 (position 38)
Context: return [1, 2, 3); }
                        ^
```

## Examples

### CSS Tokenization

```javascript
const css = `
.button {
  padding: 1rem;
  background: #0066ff;
}`;

const tokenizer = new Tokenizer(css);
const tokens = tokenizer.tokenize();
```

### JSON Parsing

```javascript
const json = '{"name":"John", "age":30, "active":true}';
const tokenizer = new Tokenizer(json);
const tokens = tokenizer.tokenize();
```

### Regular Expressions

```javascript
const code = 'const pattern = /[a-z]+/gi;';
const tokenizer = new Tokenizer(code, { allowRegex: true });
const tokens = tokenizer.tokenize();

const regex = tokens.find(t => t.type === 'regex');
console.log(regex.value); // "/[a-z]+/gi"
```

### Number Formats

```javascript
const code = `
let decimal = 42;
let hex = 0xFF;
let binary = 0b1010;
let octal = 0o755;
let scientific = 1.5e10;
`;

const tokenizer = new Tokenizer(code);
const numbers = tokenizer.tokenize().filter(t => t.type === 'number');

numbers.forEach(num => {
  console.log(`${num.value} (${num.format})`);
});
// 42 (decimal)
// 0xFF (hex)
// 0b1010 (binary)
// 0o755 (octal)
// 1.5e10 (decimal)
```

## Performance

The tokenizer is designed for speed and low memory usage:

- **Fast**: Tokenizes ~1MB of code in milliseconds
- **Lightweight**: Zero dependencies
- **Memory efficient**: Streaming-style parsing

```javascript
const largeCode = generateCode(1000000); // 1M chars
const start = performance.now();
const tokenizer = new Tokenizer(largeCode);
tokenizer.tokenize();
const end = performance.now();
console.log(`Tokenized in ${end - start}ms`);
```

## Use Cases

- **Syntax Highlighting**: Extract tokens for code editors
- **Code Analysis**: Parse and analyze source code
- **Transpilers**: Build AST from tokens
- **Formatters**: Preserve structure while reformatting
- **Linters**: Detect patterns and issues
- **Minifiers**: Remove unnecessary tokens

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## License

MIT © 2025

## Changelog

### v2.0.0 (2025)
- ✨ Added position tracking
- ✨ Added regex support
- ✨ Added hex/binary/octal numbers
- ✨ Added utility methods (filter, find, toString, getStats)
- ✨ Added multi-character operator support
- ✨ Added escape sequence handling
- ✨ Improved error messages with context
- 🐛 Fixed mismatched bracket detection
- 🐛 Fixed unclosed block detection
- ⚡ Performance optimizations

### v1.0.0 (2024)
- Initial release
- Basic tokenization
- String and number support
- Block tracking
