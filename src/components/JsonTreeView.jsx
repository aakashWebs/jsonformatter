import React, { useState, useMemo } from 'react';

/* ── Single node in the tree ──────────────────────────────────────── */
const JsonNode = ({ keyName, value, isLast, depth, searchTerm, filterMode }) => {
    const [collapsed, setCollapsed] = useState(depth > 3); // auto-collapse deep nodes

    /* ── search matching ── */
    const matchesSearch = useMemo(() => {
        if (!searchTerm) return true;
        if (keyName !== null && keyName !== undefined &&
            String(keyName).toLowerCase().includes(searchTerm)) return true;
        if (value !== null && typeof value !== 'object')
            return String(value).toLowerCase().includes(searchTerm);
        return false;
    }, [keyName, value, searchTerm]);

    const hasMatchingDescendant = useMemo(() => {
        if (!searchTerm) return true;
        if (value === null || typeof value !== 'object') return matchesSearch;
        const recurse = (v) => {
            if (v === null || typeof v !== 'object')
                return String(v).toLowerCase().includes(searchTerm);
            return Object.keys(v).some(k =>
                k.toLowerCase().includes(searchTerm) || recurse(v[k])
            );
        };
        return matchesSearch || recurse(value);
    }, [value, searchTerm, matchesSearch]);

    if (filterMode && !hasMatchingDescendant) return null;

    const highlight = matchesSearch && searchTerm ? 'jtv-highlight' : '';

    /* ── null ── */
    if (value === null) return (
        <div className={`jtv-line ${highlight}`}>
            {keyName !== null && keyName !== undefined && (
                <span className="jtv-key">"{keyName}": </span>
            )}
            <span className="jtv-null">null</span>
            {!isLast && <span className="jtv-comma">,</span>}
        </div>
    );

    /* ── primitives ── */
    if (typeof value !== 'object') {
        const cls = typeof value === 'number' ? 'jtv-number'
            : typeof value === 'boolean' ? 'jtv-boolean'
                : 'jtv-string';
        const disp = typeof value === 'string' ? `"${value}"` : String(value);
        return (
            <div className={`jtv-line ${highlight}`}>
                {keyName !== null && keyName !== undefined && (
                    <span className="jtv-key">"{keyName}": </span>
                )}
                <span className={cls}>{disp}</span>
                {!isLast && <span className="jtv-comma">,</span>}
            </div>
        );
    }

    /* ── objects / arrays ── */
    const isArray = Array.isArray(value);
    const keys = Object.keys(value);
    const isEmpty = keys.length === 0;
    const open = isArray ? '[' : '{';
    const close = isArray ? ']' : '}';
    const meta = isArray ? `${keys.length} item${keys.length !== 1 ? 's' : ''}` : `${keys.length} key${keys.length !== 1 ? 's' : ''}`;

    const forceOpen = searchTerm && hasMatchingDescendant;
    const isOpen = !collapsed || forceOpen;

    if (isEmpty) return (
        <div className="jtv-line">
            {keyName !== null && keyName !== undefined && (
                <span className="jtv-key">"{keyName}": </span>
            )}
            <span className="jtv-brace">{open}{close}</span>
            {!isLast && <span className="jtv-comma">,</span>}
        </div>
    );

    return (
        <div className="jtv-node">
            <div
                className={`jtv-line jtv-line--collapsible ${highlight}`}
                onClick={() => setCollapsed(c => !c)}
            >
                <span className="jtv-arrow">{isOpen ? '▼' : '▶'}</span>
                {keyName !== null && keyName !== undefined && (
                    <span className="jtv-key">"{keyName}": </span>
                )}
                <span className="jtv-brace">{open}</span>
                {!isOpen && (
                    <>
                        <span className="jtv-ellipsis">…</span>
                        <span className="jtv-meta">{meta}</span>
                        <span className="jtv-brace">{close}</span>
                        {!isLast && <span className="jtv-comma">,</span>}
                    </>
                )}
            </div>

            {isOpen && (
                <div className="jtv-children">
                    {keys.map((k, i) => (
                        <JsonNode
                            key={i}
                            keyName={isArray ? null : k}
                            value={value[k]}
                            isLast={i === keys.length - 1}
                            depth={depth + 1}
                            searchTerm={searchTerm}
                            filterMode={filterMode}
                        />
                    ))}
                    <div className="jtv-line">
                        <span className="jtv-brace">{close}</span>
                        {!isLast && <span className="jtv-comma">,</span>}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── Top-level tree view ──────────────────────────────────────────── */
const JsonTreeView = ({ jsonString, onEdit, fontSize = 14 }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState(false);

    const parsed = useMemo(() => {
        try { return { data: JSON.parse(jsonString), err: null }; }
        catch (e) { return { data: null, err: e.message }; }
    }, [jsonString]);

    if (parsed.err) return (
        <div className="jtv-parse-error">⚠ {parsed.err}</div>
    );

    return (
        <div className="jtv-wrapper">
            {/* toolbar row */}
            <div className="jtv-bar">
                <div className="jtv-search">
                    <span className="jtv-search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search keys or values…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value.toLowerCase())}
                    />
                    {searchTerm && (
                        <button className="jtv-clear-btn" onClick={() => setSearchTerm('')}>✕</button>
                    )}
                </div>
                <label className="jtv-filter-toggle" title="Only show matching nodes">
                    <input type="checkbox" checked={filterMode} onChange={e => setFilterMode(e.target.checked)} />
                    Filter
                </label>
                <button className="jtv-edit-btn" onClick={onEdit} title="Go back to raw editor">
                    ✏ Edit
                </button>
            </div>

            {/* tree */}
            <div className="jtv-tree" style={{ fontSize: `${fontSize}px` }}>
                <JsonNode
                    keyName={null}
                    value={parsed.data}
                    isLast={true}
                    depth={0}
                    searchTerm={searchTerm}
                    filterMode={filterMode}
                />
            </div>
        </div>
    );
};

export default JsonTreeView;
