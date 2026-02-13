import React, { useState } from 'react';
import JsonInput from './JsonInput';
import JsonOutput from './JsonOutput';

import { formatJson, minifyJson, validateJson } from '../utils/jsonUtils';
import '../styles/JsonFormatter.css';

const JsonFormatter = () => {
    const [inputJson, setInputJson] = useState('');
    const [outputJson, setOutputJson] = useState('');
    const [error, setError] = useState(null);
    const [indentSize, setIndentSize] = useState(2);
    const [activeView, setActiveView] = useState('input'); // 'input' or 'output'
    const [darkMode, setDarkMode] = useState(false);

    // Apply theme to body
    React.useEffect(() => {
        if (darkMode) {
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
        }
    }, [darkMode]);

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
        setActiveView('output');
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
        setActiveView('output');
    };

    const handleClear = () => {
        setInputJson('');
        setOutputJson('');
        setError(null);
        setActiveView('input');
    };

    const handleCopy = () => {
        if (outputJson) {
            navigator.clipboard.writeText(outputJson);
            // Optional: Show toast notification
        }
    };

    const handleEditOriginal = () => {
        setActiveView('input');
    };

    const handleEditResult = () => {
        if (outputJson) {
            setInputJson(outputJson);
        }
        setActiveView('input');
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

    return (
        <div className={`json-formatter ${activeView}-mode`}>
            {error && (
                <div className="error-message">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="formatter-panels">
                {activeView === 'input' ? (
                    <JsonInput
                        value={inputJson}
                        onChange={setInputJson}
                        onFormat={handleFormat}
                        onMinify={handleMinify}
                        onClear={handleClear}
                        indentSize={indentSize}
                        setIndentSize={setIndentSize}
                        darkMode={darkMode}
                        toggleTheme={() => setDarkMode(!darkMode)}
                    />
                ) : (
                    <JsonOutput
                        value={outputJson}
                        onCopy={handleCopy}
                        onEditOriginal={handleEditOriginal}
                        onEditResult={handleEditResult}
                        onDownload={handleDownload}
                        darkMode={darkMode}
                        toggleTheme={() => setDarkMode(!darkMode)}
                    />
                )}
            </div>
        </div>
    );
};

export default JsonFormatter;
