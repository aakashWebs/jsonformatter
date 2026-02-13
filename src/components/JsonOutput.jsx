import React, { useState, useMemo } from 'react';

const JsonOutput = ({
    value,
    onCopy,
    onEditOriginal,
    onEditResult,
    onDownload,
    darkMode,
    toggleTheme
}) => {
    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState(false);

    // JSONPath State
    // JSONPath State
    const [jsonPath, setJsonPath] = useState('');

    // Parse the JSON string (Memoized to prevent re-renders)
    const { jsonData, parseError } = useMemo(() => {
        if (!value) return { jsonData: null, parseError: false };
        try {
            return { jsonData: JSON.parse(value), parseError: false };
        } catch (e) {
            return { jsonData: null, parseError: true };
        }
    }, [value]);

    // Evaluate JSONPath (Derived State)
    const { pathResult, pathError } = useMemo(() => {
        if (!jsonPath || !jsonData) {
            return { pathResult: null, pathError: null };
        }

        try {
            // Simple Dot Notation Evaluator
            const evaluatePath = (obj, path) => {
                path = path.replace(/^\$\.?/, '');
                if (!path) return obj;

                const parts = path.match(/([^[.\]]+|\[\d+\]|\[['"][^'"]+['"]\])/g);
                if (!parts) return undefined;

                let current = obj;
                for (let part of parts) {
                    if (current === null || current === undefined) return undefined;

                    if (part.startsWith('[')) {
                        const content = part.slice(1, -1);
                        if (/^\d+$/.test(content)) {
                            current = current[parseInt(content, 10)];
                        } else {
                            const key = content.replace(/^['"]|['"]$/g, '');
                            current = current[key];
                        }
                    } else {
                        current = current[part];
                    }
                }
                return current;
            };

            const result = evaluatePath(jsonData, jsonPath);
            return {
                pathResult: result,
                pathError: result === undefined ? 'Undefined path' : null
            };

        } catch (err) {
            return { pathResult: null, pathError: 'Invalid path syntax' };
        }
    }, [jsonPath, jsonData]);

    // Data to display
    const displayData = jsonPath && !pathError ? pathResult : jsonData;
    const isPathActive = jsonPath.length > 0;

    return (
        <div className="json-panel">
            <div className="panel-header">
                <h3>JSON Formatter</h3>

                {/* Search & Path Controls */}
                <div style={{ display: 'flex', gap: '10px', flex: 1, padding: '0 20px' }}>

                    {/* JSON Path Input - HIDDEN FOR NOW
                    <div className="search-bar" style={{ flex: 1 }}>
                        <span style={{ color: '#aaa', fontSize: '12px' }}>Query: $</span>
                        <input
                            type="text"
                            placeholder=".users[0].name"
                            value={jsonPath}
                            onChange={(e) => setJsonPath(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>
                    */}

                    {/* Search Bar */}
                    <div className="search-bar" style={{ flex: 1 }}>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%' }}
                        />
                        <label className="filter-toggle" title="Filter">
                            <input
                                type="checkbox"
                                checked={filterMode}
                                onChange={(e) => setFilterMode(e.target.checked)}
                            />
                            Filter
                        </label>
                    </div>
                </div>

                <div className="header-controls">
                    <button onClick={onEditOriginal} className="btn btn-secondary btn-sm">
                        Back input
                    </button>
                    <button onClick={onEditResult} className="btn btn-primary btn-sm">
                        Edit
                    </button>
                    <button onClick={onDownload} className="btn btn-secondary btn-sm" disabled={!value} title="Download JSON">
                        ⬇
                    </button>
                    <button onClick={onCopy} className="btn btn-success btn-sm" disabled={!value}>
                        Copy
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="btn btn-sm"
                        style={{ background: 'rgba(0,0,0,0.2)', color: 'white', minWidth: '30px' }}
                        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                </div>
            </div>
            <div className="json-output">
                {isPathActive && pathError ? (
                    <div style={{ color: 'orange', padding: '10px' }}>Warning: {pathError}</div>
                ) : displayData !== undefined && displayData !== null ? (
                    <div className="json-tree">
                        <JsonItem
                            value={displayData}
                            isLast={true}
                            searchTerm={searchTerm.toLowerCase()}
                            filterMode={filterMode}
                            isRoot={true}
                        />
                    </div>
                ) : jsonData === null && value && parseError ? (
                    <pre style={{ color: 'red' }}>{value}</pre>
                ) : (
                    <div className="placeholder">
                        {isPathActive ? 'No data matches that path' : 'Formatted JSON will appear here'}
                    </div>
                )}
            </div>
        </div>
    );
};

// Recursive Component for JSON Tree
const JsonItem = ({ keyName, value, isLast, searchTerm, filterMode, isRoot }) => {
    const [collapsed, setCollapsed] = useState(false);

    // -- Helper to determine if a node matches search --
    const matchesSearch = useMemo(() => {
        if (!searchTerm) return true;

        // Check key
        if (keyName && keyName.toLowerCase().includes(searchTerm)) return true;

        // Check primitive value
        if (value !== null && typeof value !== 'object') {
            return String(value).toLowerCase().includes(searchTerm);
        }

        return false;
    }, [keyName, value, searchTerm]);

    // -- Helper to check if any children match (for filtering) --
    // We need to know if we should render this object/array at all when in filter mode
    const hasMatchingChildren = useMemo(() => {
        if (!searchTerm) return true;
        if (value === null || typeof value !== 'object') return matchesSearch;

        // Recursive check
        const check = (val) => {
            if (val === null || typeof val !== 'object') {
                return String(val).toLowerCase().includes(searchTerm);
            }
            return Object.keys(val).some(k =>
                k.toLowerCase().includes(searchTerm) || check(val[k])
            );
        };

        return matchesSearch || check(value);
    }, [value, searchTerm, matchesSearch]);


    if (filterMode && !hasMatchingChildren) {
        return null;
    }

    // -- Handle null --
    if (value === null) {
        return (
            <div className={`json-line ${matchesSearch && searchTerm ? 'highlight-match' : ''}`}>
                {keyName && <span className="json-key">"{keyName}": </span>}
                <span className="json-null">null</span>
                {!isLast && <span>,</span>}
                <span className="type-badge">null</span>
            </div>
        );
    }

    // -- Handle primitives --
    if (typeof value !== 'object') {
        let typeClass = 'json-string';
        if (typeof value === 'number') typeClass = 'json-number';
        if (typeof value === 'boolean') typeClass = 'json-boolean';

        const displayValue = typeof value === 'string' ? `"${value}"` : String(value);

        return (
            <div className={`json-line ${matchesSearch && searchTerm ? 'highlight-match' : ''}`}>
                {keyName && <span className="json-key">"{keyName}": </span>}
                <span className={typeClass}>{displayValue}</span>
                {!isLast && <span>,</span>}
                {/* Metadata: Type Badge */}
                <span className="type-badge">{typeof value}</span>
            </div>
        );
    }

    // -- Handle Objects and Arrays --
    const isArray = Array.isArray(value);
    const keys = Object.keys(value);
    const isEmpty = keys.length === 0;
    const braceOpen = isArray ? '[' : '{';
    const braceClose = isArray ? ']' : '}';
    const sizeLabel = isArray ? `${keys.length} items` : `${keys.length} keys`;

    // Auto-expand if searching and matches found inside
    const shouldExpand = searchTerm && hasMatchingChildren;
    const isCollapsed = (collapsed && !shouldExpand);

    if (isEmpty) {
        return (
            <div className="json-line">
                {keyName && <span className="json-key">"{keyName}": </span>}
                <span className="json-brace">{braceOpen}{braceClose}</span>
                {!isLast && <span>,</span>}
                <span className="type-meta">empty</span>
            </div>
        );
    }

    const handleCollapse = (e) => {
        e.stopPropagation();
        setCollapsed(!collapsed);
    }

    return (
        <div style={{ width: '100%' }}>
            <div className={`json-line ${matchesSearch && searchTerm ? 'highlight-match' : ''}`} style={{ display: isCollapsed ? 'block' : 'flex' }}>
                <span
                    className="json-collapser"
                    onClick={handleCollapse}
                >
                    {isCollapsed ? '▶' : '▼'}
                </span>

                {keyName && <span className="json-key">"{keyName}": </span>}

                <span className="json-brace" onClick={handleCollapse}>{braceOpen}</span>

                {isCollapsed && (
                    <>
                        <span className="json-ellipsis" onClick={handleCollapse}>...</span>
                        <span className="json-meta-summary" onClick={handleCollapse}>{sizeLabel}</span>
                        <span className="json-brace" onClick={handleCollapse}>{braceClose}</span>
                        {!isLast && <span>,</span>}
                    </>
                )}
            </div>

            {!isCollapsed && (
                <div className="json-block">
                    {keys.map((key, idx) => (
                        <JsonItem
                            key={idx}
                            keyName={isArray ? null : key}
                            value={value[key]}
                            isLast={idx === keys.length - 1}
                            searchTerm={searchTerm}
                            filterMode={filterMode}
                        />
                    ))}
                    <div className="json-line">
                        <span className="json-brace">{braceClose}</span>
                        {!isLast && <span>,</span>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default JsonOutput;
