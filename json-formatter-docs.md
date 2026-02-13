# JSON Formatter - React Implementation Guide

## Overview
This guide will help you build a JSON formatter/beautifier tool using React. The formatter will validate, format, and display JSON with syntax highlighting.

## Features to Implement
- JSON validation
- Format/beautify JSON (with customizable indentation)
- Minify JSON (remove whitespace)
- Syntax highlighting
- Copy to clipboard
- Error handling with line numbers
- Clear input/output

## Project Structure

```
src/
├── components/
│   ├── JsonFormatter.jsx
│   ├── JsonInput.jsx
│   ├── JsonOutput.jsx
│   └── Controls.jsx
├── utils/
│   └── jsonUtils.js
├── styles/
│   └── JsonFormatter.css
└── App.jsx
```

## Core Components

### 1. Main JsonFormatter Component

```jsx
// components/JsonFormatter.jsx
import React, { useState } from 'react';
import JsonInput from './JsonInput';
import JsonOutput from './JsonOutput';
import Controls from './Controls';
import { formatJson, minifyJson, validateJson } from '../utils/jsonUtils';
import '../styles/JsonFormatter.css';

const JsonFormatter = () => {
  const [inputJson, setInputJson] = useState('');
  const [outputJson, setOutputJson] = useState('');
  const [error, setError] = useState(null);
  const [indentSize, setIndentSize] = useState(2);

  const handleFormat = () => {
    setError(null);
    const validation = validateJson(inputJson);
    
    if (!validation.isValid) {
      setError(validation.error);
      setOutputJson('');
      return;
    }

    const formatted = formatJson(inputJson, indentSize);
    setOutputJson(formatted);
  };

  const handleMinify = () => {
    setError(null);
    const validation = validateJson(inputJson);
    
    if (!validation.isValid) {
      setError(validation.error);
      setOutputJson('');
      return;
    }

    const minified = minifyJson(inputJson);
    setOutputJson(minified);
  };

  const handleClear = () => {
    setInputJson('');
    setOutputJson('');
    setError(null);
  };

  const handleCopy = () => {
    if (outputJson) {
      navigator.clipboard.writeText(outputJson);
      // Optional: Show toast notification
    }
  };

  return (
    <div className="json-formatter">
      <h1>JSON Formatter</h1>
      
      <Controls
        onFormat={handleFormat}
        onMinify={handleMinify}
        onClear={handleClear}
        onCopy={handleCopy}
        indentSize={indentSize}
        setIndentSize={setIndentSize}
        hasOutput={!!outputJson}
      />

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="formatter-panels">
        <JsonInput 
          value={inputJson}
          onChange={setInputJson}
        />
        
        <JsonOutput 
          value={outputJson}
        />
      </div>
    </div>
  );
};

export default JsonFormatter;
```

### 2. JsonInput Component

```jsx
// components/JsonInput.jsx
import React from 'react';

const JsonInput = ({ value, onChange }) => {
  return (
    <div className="json-panel">
      <h3>Input JSON</h3>
      <textarea
        className="json-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='Enter JSON here, e.g., {"name": "John", "age": 30}'
        spellCheck="false"
      />
    </div>
  );
};

export default JsonInput;
```

### 3. JsonOutput Component

```jsx
// components/JsonOutput.jsx
import React from 'react';

const JsonOutput = ({ value }) => {
  const renderHighlightedJson = (jsonString) => {
    if (!jsonString) return null;

    // Simple syntax highlighting
    const highlighted = jsonString
      .replace(/(".*?")/g, '<span class="json-string">$1</span>')
      .replace(/(\d+)/g, '<span class="json-number">$1</span>')
      .replace(/(true|false)/g, '<span class="json-boolean">$1</span>')
      .replace(/(null)/g, '<span class="json-null">$1</span>');

    return <pre dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  return (
    <div className="json-panel">
      <h3>Formatted Output</h3>
      <div className="json-output">
        {value ? (
          renderHighlightedJson(value)
        ) : (
          <div className="placeholder">Formatted JSON will appear here</div>
        )}
      </div>
    </div>
  );
};

export default JsonOutput;
```

### 4. Controls Component

```jsx
// components/Controls.jsx
import React from 'react';

const Controls = ({ 
  onFormat, 
  onMinify, 
  onClear, 
  onCopy, 
  indentSize, 
  setIndentSize,
  hasOutput 
}) => {
  return (
    <div className="controls">
      <div className="button-group">
        <button onClick={onFormat} className="btn btn-primary">
          Format
        </button>
        <button onClick={onMinify} className="btn btn-secondary">
          Minify
        </button>
        <button onClick={onClear} className="btn btn-danger">
          Clear
        </button>
        <button 
          onClick={onCopy} 
          className="btn btn-success"
          disabled={!hasOutput}
        >
          Copy Output
        </button>
      </div>

      <div className="indent-control">
        <label htmlFor="indent-size">Indent Size:</label>
        <select 
          id="indent-size"
          value={indentSize} 
          onChange={(e) => setIndentSize(Number(e.target.value))}
        >
          <option value={2}>2 spaces</option>
          <option value={4}>4 spaces</option>
          <option value={8}>8 spaces</option>
        </select>
      </div>
    </div>
  );
};

export default Controls;
```

## Utility Functions

### JSON Processing Utilities

```javascript
// utils/jsonUtils.js

/**
 * Validates JSON string
 * @param {string} jsonString - The JSON string to validate
 * @returns {object} - { isValid: boolean, error: string|null }
 */
export const validateJson = (jsonString) => {
  if (!jsonString.trim()) {
    return { isValid: false, error: 'Input is empty' };
  }

  try {
    JSON.parse(jsonString);
    return { isValid: true, error: null };
  } catch (error) {
    // Extract line number from error message if possible
    const match = error.message.match(/position (\d+)/);
    const position = match ? match[1] : '';
    
    return { 
      isValid: false, 
      error: `${error.message}${position ? ` at position ${position}` : ''}`
    };
  }
};

/**
 * Formats JSON with specified indentation
 * @param {string} jsonString - The JSON string to format
 * @param {number} indent - Number of spaces for indentation
 * @returns {string} - Formatted JSON string
 */
export const formatJson = (jsonString, indent = 2) => {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, indent);
  } catch (error) {
    throw new Error('Invalid JSON');
  }
};

/**
 * Minifies JSON (removes all unnecessary whitespace)
 * @param {string} jsonString - The JSON string to minify
 * @returns {string} - Minified JSON string
 */
export const minifyJson = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed);
  } catch (error) {
    throw new Error('Invalid JSON');
  }
};

/**
 * Counts lines in a string
 * @param {string} str - The string to count lines in
 * @returns {number} - Number of lines
 */
export const countLines = (str) => {
  return str.split('\n').length;
};
```

## Styling

### CSS Styles

```css
/* styles/JsonFormatter.css */

.json-formatter {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.json-formatter h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.button-group {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.indent-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.indent-control label {
  font-weight: 500;
  color: #333;
}

.indent-control select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.error-message {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.formatter-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .formatter-panels {
    grid-template-columns: 1fr;
  }
  
  .controls {
    flex-direction: column;
    gap: 15px;
  }
  
  .button-group {
    flex-wrap: wrap;
  }
}

.json-panel {
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.json-panel h3 {
  margin: 0;
  padding: 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #ddd;
  color: #333;
  font-size: 16px;
}

.json-textarea {
  flex: 1;
  min-height: 400px;
  padding: 15px;
  border: none;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
}

.json-output {
  flex: 1;
  min-height: 400px;
  padding: 15px;
  overflow: auto;
  background: #f8f9fa;
}

.json-output pre {
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.6;
}

.placeholder {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 50px 20px;
}

/* Syntax Highlighting */
.json-string {
  color: #d14;
}

.json-number {
  color: #099;
}

.json-boolean {
  color: #0086b3;
}

.json-null {
  color: #999;
}
```

## App Integration

```jsx
// App.jsx
import React from 'react';
import JsonFormatter from './components/JsonFormatter';
import './App.css';

function App() {
  return (
    <div className="App">
      <JsonFormatter />
    </div>
  );
}

export default App;
```

## Enhanced Features (Optional)

### 1. Advanced Syntax Highlighting

For better syntax highlighting, you can use a library like `react-json-view` or implement a more sophisticated tokenizer:

```jsx
// Enhanced JsonOutput with better highlighting
import React from 'react';

const JsonOutput = ({ value }) => {
  const syntaxHighlight = (json) => {
    if (!json) return '';
    
    json = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  return (
    <div className="json-panel">
      <h3>Formatted Output</h3>
      <div className="json-output">
        {value ? (
          <pre dangerouslySetInnerHTML={{ __html: syntaxHighlight(value) }} />
        ) : (
          <div className="placeholder">Formatted JSON will appear here</div>
        )}
      </div>
    </div>
  );
};

export default JsonOutput;
```

### 2. Line Numbers

```jsx
// Add line numbers to output
const JsonOutputWithLineNumbers = ({ value }) => {
  const lines = value ? value.split('\n') : [];

  return (
    <div className="json-panel">
      <h3>Formatted Output</h3>
      <div className="json-output-with-lines">
        <div className="line-numbers">
          {lines.map((_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>
        <pre className="json-code">{value}</pre>
      </div>
    </div>
  );
};
```

### 3. File Upload/Download

```jsx
// Add to Controls component
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      setInputJson(e.target.result);
    };
    reader.readAsText(file);
  }
};

const handleDownload = () => {
  if (!outputJson) return;
  
  const blob = new Blob([outputJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'formatted.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// In JSX
<input 
  type="file" 
  accept=".json"
  onChange={handleFileUpload}
  style={{ display: 'none' }}
  id="file-upload"
/>
<label htmlFor="file-upload" className="btn btn-info">
  Upload JSON
</label>
<button onClick={handleDownload} className="btn btn-info" disabled={!hasOutput}>
  Download
</button>
```

## Testing

Example test cases to verify:

1. **Valid JSON**: `{"name": "John", "age": 30}`
2. **Nested Objects**: `{"user": {"name": "John", "address": {"city": "NYC"}}}`
3. **Arrays**: `[1, 2, 3, {"key": "value"}]`
4. **Invalid JSON**: `{name: "John"}` (should show error)
5. **Edge Cases**: Empty input, whitespace only, very large JSON

## Performance Tips

1. Use `useMemo` for expensive operations
2. Debounce format operations for real-time formatting
3. Consider virtual scrolling for very large JSON files
4. Lazy load syntax highlighting

## Conclusion

This documentation provides a complete guide to building a JSON formatter in React. Start with the basic implementation and add enhanced features as needed. The formatter validates, formats, minifies, and displays JSON with syntax highlighting and proper error handling.
