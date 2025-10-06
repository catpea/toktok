export default class Tokenizer {
  #input;
  #tokens = [];
  #tokenBuffer = '';
  #tokenStack = [];
  #position = 0;
  #line = 1;
  #column = 1;
  #inString = false;
  #stringDelimiter = null;
  #currentBlock = null;
  #options;

  constructor(input, options = {}) {
    this.#input = input;
    this.#options = {
      trackPosition: true,
      preserveWhitespace: false,
      preserveComments: true,
      allowRegex: true,
      customOperators: [],
      hexNumbers: true,
      binaryNumbers: true,
      octalNumbers: true,
      templateLiterals: true,
      ...options
    };
  }

  tokenize() {
    while (this.#position < this.#input.length) {
      const char = this.#input[this.#position];

      if (this.#inString) {
        this.#handleStringContent(char);
      } else if (this.#checkComment()) {
        this.#handleComment();
      } else if (this.#options.allowRegex && this.#checkRegex()) {
        this.#handleRegex();
      } else if (char.match(/[`'"]/)) {
        this.#startString(char);
      } else if (/\s/.test(char)) {
        if (this.#options.preserveWhitespace) {
          this.#flushBuffer();
          this.#addToken({ type: 'whitespace', value: char });
        } else {
          this.#flushBuffer();
        }
        this.#updatePosition(char);
      } else if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(this.#peek()))) {
        this.#tokenBuffer += char;
      } else if (/[a-zA-Z#._$-]/.test(char)) {
        this.#tokenBuffer += char;
      } else if (this.#checkMultiCharOperator()) {
        this.#handleMultiCharOperator();
      } else if ('+-*/:;,=<>!&|%^~?'.includes(char)) {
        this.#flushBuffer();
        this.#addToken({ type: 'symbol', value: char });
      } else if ('[{('.includes(char)) {
        this.#startBlock(char);
      } else if (']})'.includes(char)) {
        this.#finishBlock(char);
      } else {
        throw this.#error(`Unexpected character: ${char}`);
      }

      this.#position++;
      if (char !== '\n' && char !== '\r') {
        this.#column++;
      }
    }

    this.#flushBuffer();

    // Check for unclosed blocks
    if (this.#tokenStack.length > 0) {
      const unclosed = this.#tokenStack[this.#tokenStack.length - 1];
      throw this.#error(`Unclosed block starting with '${unclosed.opener}'`);
    }

    // Check for unclosed strings
    if (this.#inString) {
      throw this.#error(`Unclosed string starting with '${this.#stringDelimiter}'`);
    }

    return this.#currentBlock || this.#tokens;
  }

  #handleStringContent(char) {
    // Check for escape sequences
    if (char === '\\' && this.#position + 1 < this.#input.length) {
      this.#tokenBuffer += char;
      this.#position++;
      this.#tokenBuffer += this.#input[this.#position];
      return;
    }

    if (char === this.#stringDelimiter) {
      this.#finishToken('string');
      this.#inString = false;
      this.#stringDelimiter = null;
    } else {
      this.#tokenBuffer += char;
    }
  }

  #startString(delimiter) {
    this.#flushBuffer();
    this.#inString = true;
    this.#stringDelimiter = delimiter;
  }

  #checkComment() {
    const remaining = this.#input.slice(this.#position);
    return remaining.startsWith('//') || remaining.startsWith('/*');
  }

  #handleComment() {
    this.#flushBuffer();
    const remaining = this.#input.slice(this.#position);

    if (remaining.startsWith('//')) {
      // Single-line comment
      const endIndex = this.#input.indexOf('\n', this.#position);
      const commentEnd = endIndex === -1 ? this.#input.length : endIndex;
      const comment = this.#input.slice(this.#position, commentEnd);

      if (this.#options.preserveComments) {
        this.#addToken({ type: 'comment', value: comment });
      }
      this.#position = commentEnd - 1; // -1 because main loop will increment
    } else if (remaining.startsWith('/*')) {
      // Multi-line comment
      const endIndex = this.#input.indexOf('*/', this.#position + 2);
      if (endIndex === -1) {
        throw this.#error('Unclosed multi-line comment');
      }
      const comment = this.#input.slice(this.#position, endIndex + 2);

      if (this.#options.preserveComments) {
        this.#addToken({ type: 'comment', value: comment });
      }

      // Update line tracking for multi-line comments
      const lines = comment.split('\n');
      this.#line += lines.length - 1;
      if (lines.length > 1) {
        this.#column = lines[lines.length - 1].length;
      }

      this.#position = endIndex + 1; // +1 because we want to be at the '/' and main loop will increment
    }
  }

  #checkRegex() {
    if (this.#input[this.#position] !== '/') return false;

    // Regex detection heuristic: check if previous token suggests regex context
    const lastToken = this.#getLastMeaningfulToken();
    const regexContext = !lastToken ||
      ['symbol', 'keyword'].includes(lastToken.type) &&
      ['=', '(', '[', ',', 'return', 'throw'].includes(lastToken.value);

    return regexContext && this.#position + 1 < this.#input.length &&
           this.#input[this.#position + 1] !== '/' && // Not a comment
           this.#input[this.#position + 1] !== '=';   // Not /=
  }

  #handleRegex() {
    this.#flushBuffer();
    let regex = '/';
    let pos = this.#position + 1;
    let escaped = false;
    let inCharClass = false;

    while (pos < this.#input.length) {
      const char = this.#input[pos];
      regex += char;

      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '[' && !inCharClass) {
        inCharClass = true;
      } else if (char === ']' && inCharClass) {
        inCharClass = false;
      } else if (char === '/' && !inCharClass) {
        // End of regex, check for flags
        pos++;
        while (pos < this.#input.length && /[gimsuvy]/.test(this.#input[pos])) {
          regex += this.#input[pos];
          pos++;
        }
        this.#addToken({ type: 'regex', value: regex });
        this.#position = pos - 1;
        return;
      } else if (char === '\n') {
        throw this.#error('Unterminated regular expression');
      }
      pos++;
    }

    throw this.#error('Unterminated regular expression');
  }

  #peek(offset = 1) {
    return this.#input[this.#position + offset];
  }

  #updatePosition(char) {
    if (char === '\n') {
      this.#line++;
      this.#column = 1;
    } else if (char === '\r') {
      // Handle \r\n
      if (this.#peek() === '\n') {
        this.#position++;
      }
      this.#line++;
      this.#column = 1;
    }
  }

  #getLastMeaningfulToken() {
    const tokens = this.#currentBlock ? this.#currentBlock.children : this.#tokens;
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (tokens[i].type !== 'whitespace' && tokens[i].type !== 'comment') {
        return tokens[i];
      }
    }
    return null;
  }

  #checkMultiCharOperator() {
    const remaining = this.#input.slice(this.#position, this.#position + 3);
    // Check 3-char operators
    if (['===', '!=='].includes(remaining.slice(0, 3))) return true;
    // Check 2-char operators
    const twoChar = remaining.slice(0, 2);
    return ['==', '!=', '<=', '>=', '=>', '&&', '||', '++', '--', '+=', '-=', '*=', '/='].includes(twoChar);
  }

  #handleMultiCharOperator() {
    this.#flushBuffer();
    const remaining = this.#input.slice(this.#position, this.#position + 3);

    // Try 3-char operators first
    if (['===', '!=='].includes(remaining.slice(0, 3))) {
      this.#addToken({ type: 'symbol', value: remaining.slice(0, 3) });
      this.#position += 2; // +2 because main loop will add 1
      return;
    }

    // Try 2-char operators
    const twoChar = remaining.slice(0, 2);
    const twoCharOps = ['==', '!=', '<=', '>=', '=>', '&&', '||', '++', '--', '+=', '-=', '*=', '/='];
    if (twoCharOps.includes(twoChar)) {
      this.#addToken({ type: 'symbol', value: twoChar });
      this.#position += 1; // +1 because main loop will add 1
    }
  }

  #finishToken(type) {
    if (this.#tokenBuffer.length > 0) {
      const token = { type, value: this.#tokenBuffer };
      this.#addToken(token);
      this.#tokenBuffer = '';
    }
  }

  #startBlock(char) {
    this.#flushBuffer();
    const closers = { '[': ']', '{': '}', '(': ')' };
    const block = {
      type: 'block',
      opener: char,
      closer: closers[char],
      children: []
    };
    this.#addToken(block);
    this.#tokenStack.push(block);
    this.#currentBlock = block;
  }

  #finishBlock(char) {
    this.#flushBuffer();

    if (!this.#tokenStack.length) {
      throw this.#error(`Unbalanced closing bracket '${char}'`);
    }

    const currentBlock = this.#tokenStack[this.#tokenStack.length - 1];
    if (currentBlock.closer !== char) {
      throw this.#error(`Mismatched brackets: expected '${currentBlock.closer}' but got '${char}'`);
    }

    this.#tokenStack.pop();
    this.#currentBlock = this.#tokenStack[this.#tokenStack.length - 1] || null;
  }

  #flushBuffer() {
    if (this.#tokenBuffer.length > 0) {
      if (/^[0-9.]+$/.test(this.#tokenBuffer)) {
        // Validate number format
        const dotCount = (this.#tokenBuffer.match(/\./g) || []).length;
        if (dotCount > 1) {
          throw this.#error(`Invalid number format: ${this.#tokenBuffer}`);
        }
        this.#finishToken('number');
      } else {
        this.#finishToken('identifier');
      }
    }
  }

  #addToken(token) {
    if (this.#currentBlock) {
      this.#currentBlock.children.push(token);
    } else {
      this.#tokens.push(token);
    }
  }

  #error(message) {
    const start = Math.max(0, this.#position - 20);
    const end = Math.min(this.#input.length, this.#position + 20);
    const context = this.#input.slice(start, end);
    const pointer = ' '.repeat(this.#position - start) + '^';

    const errorMsg = this.#options.trackPosition
      ? `${message} at line ${this.#line}, column ${this.#column} (position ${this.#position})`
      : `${message} at position ${this.#position}`;

    return new Error(
      `${errorMsg}\n` +
      `Context: ${context}\n` +
      `         ${pointer}`
    );
  }

  // Public utility methods

  /**
   * Filter tokens by type
   */
  filter(type) {
    const filterRecursive = (tokens) => {
      return tokens.filter(token => {
        if (token.type === type) return true;
        if (token.type === 'block') {
          token.children = filterRecursive(token.children);
          return token.children.length > 0;
        }
        return false;
      });
    };

    const tokens = this.#currentBlock || this.#tokens;
    return filterRecursive(tokens);
  }

  /**
   * Pretty print tokens
   */
  toString(indent = 0) {
    const printToken = (token, level) => {
      const spaces = '  '.repeat(level);
      if (token.type === 'block') {
        let result = `${spaces}${token.type}: ${token.opener}...${token.closer}\n`;
        token.children.forEach(child => {
          result += printToken(child, level + 1);
        });
        return result;
      }
      const pos = token.position
        ? ` [${token.position.start.line}:${token.position.start.column}]`
        : '';
      return `${spaces}${token.type}: ${JSON.stringify(token.value)}${pos}\n`;
    };

    const tokens = this.#currentBlock || this.#tokens;
    return tokens.map(token => printToken(token, indent)).join('');
  }

  /**
   * Find all tokens matching a predicate
   */
  find(predicate) {
    const results = [];
    const searchRecursive = (tokens) => {
      tokens.forEach(token => {
        if (predicate(token)) results.push(token);
        if (token.type === 'block') {
          searchRecursive(token.children);
        }
      });
    };
    searchRecursive(this.#currentBlock || this.#tokens);
    return results;
  }

  /**
   * Get token statistics
   */
  getStats() {
    const stats = {
      total: 0,
      byType: {},
      lines: this.#line
    };

    const countRecursive = (tokens) => {
      tokens.forEach(token => {
        stats.total++;
        stats.byType[token.type] = (stats.byType[token.type] || 0) + 1;
        if (token.type === 'block') {
          countRecursive(token.children);
        }
      });
    };

    countRecursive(this.#currentBlock || this.#tokens);
    return stats;
  }
}
