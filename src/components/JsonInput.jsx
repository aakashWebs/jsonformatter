import React, { useState, useRef } from 'react';

const JsonInput = ({
    value,
    onChange,
    onFormat,
    onMinify,
    onClear,
    indentSize,
    setIndentSize,
    darkMode,
    toggleTheme
}) => {
    const fileInputRef = useRef(null);
    const [url, setUrl] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => onChange(e.target.result);
            reader.readAsText(file);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onload = (e) => onChange(e.target.result);
            reader.readAsText(file);
        }
    };

    const handleUrlSubmit = async (e) => {
        e.preventDefault();
        if (!url) return;

        setIsLoading(true);
        try {
            const response = await fetch(url);
            const data = await response.text(); // Get text first to ensure it's not empty
            onChange(data);
            setShowUrlInput(false);
            setUrl('');
        } catch (error) {
            alert('Failed to fetch JSON: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`json-panel ${dragActive ? 'drag-active' : ''}`} onDragEnter={handleDrag}>
            <div className="panel-header">
                <h3>JSON Formatter</h3>
                <div className="header-controls">
                    <button onClick={() => fileInputRef.current.click()} className="btn btn-secondary btn-sm" title="Upload File">
                        📂 Upload
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".json,.txt"
                        onChange={handleFileUpload}
                    />

                    <button onClick={() => setShowUrlInput(!showUrlInput)} className="btn btn-secondary btn-sm" title="Load from URL">
                        🌐 URL
                    </button>

                    <span className="separator">|</span>

                    <button onClick={onFormat} className="btn btn-primary btn-sm">Format</button>
                    <button onClick={onMinify} className="btn btn-secondary btn-sm">Minify</button>
                    <button onClick={onClear} className="btn btn-danger btn-sm">Clear</button>
                    <div className="indent-control-sm">
                        <select
                            value={indentSize}
                            onChange={(e) => setIndentSize(Number(e.target.value))}
                        >
                            <option value={2}>2 spaces</option>
                            <option value={4}>4 spaces</option>
                            <option value={8}>8 spaces</option>
                        </select>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="btn btn-sm btn-icon" // added btn-icon class if needed for styling later, or reused btn-sm
                        style={{ background: 'rgba(0,0,0,0.2)', color: 'white', minWidth: '30px' }}
                        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                </div>
            </div>

            {showUrlInput && (
                <div className="url-input-bar">
                    <form onSubmit={handleUrlSubmit} style={{ display: 'flex', width: '100%', gap: '10px' }}>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Enter JSON URL..."
                            className="url-input"
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary btn-sm" disabled={isLoading}>
                            {isLoading ? 'Loading...' : 'Fetch'}
                        </button>
                    </form>
                </div>
            )}

            <div className="textarea-container" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                {dragActive && <div className="drag-overlay">Drop JSON file here</div>}
                <textarea
                    className="json-textarea"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder='Enter JSON here, drag & drop a file, or load from URL...'
                    spellCheck="false"
                />
            </div>
        </div>
    );
};

export default JsonInput;
