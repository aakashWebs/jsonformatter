import React, { useState, useRef, useEffect } from 'react';
import SavedSnippets from './SavedSnippets';
import JsonTreeView from './JsonTreeView';
import { fixJson, formatJson, minifyJson } from '../utils/jsonUtils';
import '../styles/JsonFormatter.css';

/* ── localStorage helpers ─────────────────────────────────────────── */
const LS_DRAFT = 'jf_draft';
const LS_SNIPS = 'jf_snippets';
const LS_SIDEBAR = 'jf_sidebar';
const LS_FONTSIZE = 'jf_fontsize';
const FONT_MIN = 11; const FONT_MAX = 22; const FONT_DEF = 14;
const loadFontSize = () => { try { return Number(localStorage.getItem(LS_FONTSIZE)) || FONT_DEF; } catch { return FONT_DEF; } };
const loadDraft = () => { try { return localStorage.getItem(LS_DRAFT) || ''; } catch { return ''; } };
const saveDraft = (v) => { try { localStorage.setItem(LS_DRAFT, v); } catch { } };
const loadSnippets = () => { try { return JSON.parse(localStorage.getItem(LS_SNIPS) || '[]'); } catch { return []; } };
const saveSnippets = (a) => { try { localStorage.setItem(LS_SNIPS, JSON.stringify(a)); } catch { } };
/* ─────────────────────────────────────────────────────────────────── */

export default function JsonFormatter() {
    /* view: 'edit' = raw textarea | 'tree' = collapsible tree */
    const [viewMode, setViewMode] = useState('edit');
    const [value, setValue_] = useState(loadDraft);
    const [formattedVal, setFormattedVal] = useState('');
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [indentSize, setIndentSize] = useState(2);
    const [darkMode, setDarkMode] = useState(false);
    const [showUrlBar, setShowUrlBar] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [urlLoading, setUrlLoading] = useState(false);
    const [snippets, setSnippets] = useState(loadSnippets);
    const [showSnippets, setShowSnippets] = useState(false);
    const [showSaveDlg, setShowSaveDlg] = useState(false);
    const [snippetName, setSnippetName] = useState('');
    const [activeId, setActiveId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        try { return localStorage.getItem(LS_SIDEBAR) !== 'false'; } catch { return true; }
    });
    const [fontSize, setFontSize] = useState(loadFontSize);

    const fileRef = useRef(null);
    const undoStack = useRef([]);
    const value_ref = useRef(value);
    const [undoLen, setUndoLen] = useState(0);

    // Refs that always point to the latest action handlers — fixes stale-closure
    // issue where keyboard shortcuts captured the initial empty value.
    const formatRef = useRef(null);
    const undoRef = useRef(null);

    /* ── helpers ─────────────────────────────────────────────────── */
    const setValue = (v) => { value_ref.current = v; setValue_(v); saveDraft(v); };

    const pushUndo = () => {
        if (!value_ref.current) return;
        undoStack.current = [value_ref.current, ...undoStack.current].slice(0, 50);
        setUndoLen(undoStack.current.length);
    };
    const showToast = (msg) => setToast(msg);

    const toggleSidebar = () => {
        setSidebarOpen(prev => {
            const next = !prev;
            try { localStorage.setItem(LS_SIDEBAR, String(next)); } catch { }
            return next;
        });
    };

    /* ── persist sidebar pref ────────────────────────────────────── */
    useEffect(() => {
        try { localStorage.setItem(LS_SIDEBAR, String(sidebarOpen)); } catch { }
    }, [sidebarOpen]);

    /* ── keyboard shortcuts (use refs to avoid stale closures) ─────── */
    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                if (undoStack.current.length) { e.preventDefault(); undoRef.current?.(); }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault(); formatRef.current?.();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);  // safe — reads from refs, not closures

    /* ── theme ───────────────────────────────────────────────────── */
    useEffect(() => {
        if (darkMode) document.body.setAttribute('data-theme', 'dark');
        else document.body.removeAttribute('data-theme');
    }, [darkMode]);

    /* ── toast auto-dismiss ──────────────────────────────────────── */
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(''), 2500);
        return () => clearTimeout(t);
    }, [toast]);

    /* ── undo ────────────────────────────────────────────────────── */
    const handleUndo = () => {
        if (!undoStack.current.length) return;
        const [prev, ...rest] = undoStack.current;
        undoStack.current = rest;
        setUndoLen(rest.length);
        setValue(prev);
        setError('');
        setViewMode('edit');
        setActiveId(null);
        showToast('↩ Undone');
    };
    undoRef.current = handleUndo;   // keep ref current every render

    /* ── format → tree view ──────────────────────────────────────── */
    const handleFormat = () => {
        setError('');
        const raw = value_ref.current.trim();  // read from ref — always current
        if (!raw) return;
        const { fixed, wasFixed, error: fixErr } = fixJson(raw);
        if (fixErr) { setError(fixErr); return; }
        pushUndo();
        const pretty = formatJson(fixed, indentSize);
        setValue(pretty);
        setFormattedVal(pretty);
        setViewMode('tree');
        showToast(wasFixed ? '🔧 Auto-fixed & Formatted!' : '✅ Formatted!');
    };
    formatRef.current = handleFormat;  // keep ref current every render

    /* ── font size ───────────────────────────────────────────────── */
    const changeFontSize = (delta) => {
        setFontSize(prev => {
            const next = Math.min(FONT_MAX, Math.max(FONT_MIN, prev + delta));
            try { localStorage.setItem(LS_FONTSIZE, String(next)); } catch { }
            return next;
        });
    };

    /* ── minify ──────────────────────────────────────────────────── */
    const handleMinify = () => {
        setError('');
        const raw = value.trim();
        if (!raw) return;
        const { fixed, wasFixed, error: fixErr } = fixJson(raw);
        if (fixErr) { setError(fixErr); return; }
        pushUndo();
        setValue(minifyJson(fixed));
        setViewMode('edit');
        showToast(wasFixed ? '🔧 Auto-fixed & Minified!' : '✅ Minified!');
    };

    /* ── clear ───────────────────────────────────────────────────── */
    const handleClear = () => {
        if (!value.trim() && viewMode === 'edit') return;
        pushUndo();
        setValue(''); setError(''); setFormattedVal('');
        setViewMode('edit'); setActiveId(null);
        showToast('🗑 Cleared — press Undo to recover');
    };

    /* ── copy ────────────────────────────────────────────────────── */
    const handleCopy = () => {
        const src = viewMode === 'tree' ? formattedVal : value;
        if (!src.trim()) return;
        navigator.clipboard.writeText(src).then(() => showToast('📋 Copied!'));
    };

    /* ── download ────────────────────────────────────────────────── */
    const handleDownload = () => {
        const src = viewMode === 'tree' ? formattedVal : value;
        if (!src.trim()) return;
        const blob = new Blob([src], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = (activeId ? (snippets.find(s => s.id === activeId)?.name || 'output') : 'output') + '.json';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        showToast('⬇ Downloaded!');
    };

    /* ── upload ──────────────────────────────────────────────────── */
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            pushUndo();
            setValue(ev.target.result);
            setError(''); setViewMode('edit'); setActiveId(null);
            showToast('📂 File loaded');
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    /* ── fetch URL ───────────────────────────────────────────────── */
    const handleFetchUrl = async (e) => {
        e.preventDefault();
        if (!urlInput.trim()) return;
        setUrlLoading(true);
        try {
            const res = await fetch(urlInput.trim());
            const text = await res.text();
            pushUndo();
            setValue(text); setError(''); setViewMode('edit'); setActiveId(null);
            setShowUrlBar(false); setUrlInput('');
            showToast('🌐 Loaded from URL');
        } catch (err) {
            setError('Failed to fetch: ' + err.message);
        } finally {
            setUrlLoading(false);
        }
    };

    /* ── sidebar: switch snippet ─────────────────────────────────── */
    const handleSwitchSnippet = (s) => {
        if (activeId === s.id) return;      // already active
        pushUndo();
        setValue(s.json);
        setError(''); setFormattedVal(''); setViewMode('edit');
        setActiveId(s.id);
        showToast('📄 ' + s.name);
    };

    /* ── sidebar: new (blank) ────────────────────────────────────── */
    const handleNew = () => {
        pushUndo();
        setValue(''); setError(''); setFormattedVal('');
        setViewMode('edit'); setActiveId(null);
    };

    /* ── snippets: save ──────────────────────────────────────────── */
    const openSave = () => {
        const src = viewMode === 'tree' ? formattedVal : value;
        if (!src.trim()) return;
        setSnippetName(''); setShowSaveDlg(true);
    };
    const confirmSave = () => {
        const src = viewMode === 'tree' ? formattedVal : value;
        const name = snippetName.trim() || `Snippet ${snippets.length + 1}`;
        const preview = src.slice(0, 80) + (src.length > 80 ? '…' : '');
        const entry = { id: Date.now(), name, preview, json: src, savedAt: new Date().toISOString() };
        const updated = [entry, ...snippets];
        setSnippets(updated); saveSnippets(updated);
        setShowSaveDlg(false); setActiveId(entry.id);
        showToast('💾 Saved!');
    };

    /* ── snippets: restore from modal ───────────────────────────── */
    const handleRestore = (s) => {
        pushUndo();
        setValue(s.json); setError(''); setViewMode('edit');
        setActiveId(s.id); setShowSnippets(false);
        showToast('↩ Restored: ' + s.name);
    };

    /* ── snippets: delete ────────────────────────────────────────── */
    const handleDeleteSnippet = (id) => {
        const updated = snippets.filter(s => s.id !== id);
        setSnippets(updated); saveSnippets(updated);
        if (activeId === id) setActiveId(null);
    };

    /* ── delete from sidebar ─────────────────────────────────────── */
    const handleSidebarDelete = (e, id) => {
        e.stopPropagation();
        const updated = snippets.filter(s => s.id !== id);
        setSnippets(updated); saveSnippets(updated);
        if (activeId === id) { setValue(''); setActiveId(null); }
    };

    /* ─────────────────────────────────────────────────────────────
       RENDER
    ───────────────────────────────────────────────────────────── */
    return (
        <div className="app-shell">

            {/* ── Toolbar ─────────────────────────────────────────── */}
            <header className="app-toolbar">
                <div className="toolbar-left">
                    {/* Sidebar toggle */}
                    <button
                        className={`tb-btn tb-btn--icon sidebar-toggle-btn ${sidebarOpen ? 'active' : ''}`}
                        onClick={toggleSidebar}
                        title={sidebarOpen ? 'Hide file list' : 'Show file list'}
                    >
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                    <span className="app-logo">⚙ JSON Formatter</span>
                </div>

                <div className="toolbar-center">
                    <button className="tb-btn" onClick={() => fileRef.current.click()} title="Upload JSON file">
                        📂 <span>Upload</span>
                    </button>
                    <input ref={fileRef} type="file" accept=".json,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />

                    <button className="tb-btn" onClick={() => { setShowUrlBar(!showUrlBar); setError(''); }} title="Load from URL">
                        🌐 <span>URL</span>
                    </button>

                    <div className="tb-divider" />

                    <button className="tb-btn tb-btn--primary" onClick={handleFormat} title="Auto-fix + Format (Ctrl+Enter)">
                        Format
                    </button>
                    <button className="tb-btn tb-btn--secondary" onClick={handleMinify}>
                        Minify
                    </button>

                    <select className="tb-select" value={indentSize} onChange={(e) => setIndentSize(Number(e.target.value))} title="Indent size">
                        <option value={2}>2 spaces</option>
                        <option value={4}>4 spaces</option>
                        <option value={8}>8 spaces</option>
                    </select>

                    <div className="tb-divider" />

                    <button className="tb-btn tb-btn--ghost" onClick={handleCopy} title="Copy">
                        📋 <span>Copy</span>
                    </button>
                    <button className="tb-btn tb-btn--ghost" onClick={handleDownload} title="Download">
                        ⬇ <span>Download</span>
                    </button>
                    <button className="tb-btn tb-btn--danger" onClick={handleClear} title="Clear">
                        ✕ <span>Clear</span>
                    </button>

                    {undoLen > 0 && (
                        <button className="tb-btn tb-btn--undo" onClick={handleUndo} title="Undo (Ctrl+Z)">
                            ↩ <span>Undo</span>
                        </button>
                    )}

                    <div className="tb-divider" />

                    <button className="tb-btn tb-btn--save" onClick={openSave} title="Save snippet">
                        💾 <span>Save</span>
                    </button>
                    <button className="tb-btn tb-btn--snippets" onClick={() => setShowSnippets(true)} title="Browse all snippets">
                        📚{snippets.length > 0 && <span className="tb-badge">{snippets.length}</span>}
                        <span> Snippets</span>
                    </button>
                </div>

                <div className="toolbar-right">
                    {/* Font size control */}
                    <div className="font-size-ctrl" title="Adjust editor font size">
                        <button
                            className="font-size-btn"
                            onClick={() => changeFontSize(-1)}
                            disabled={fontSize <= FONT_MIN}
                            title="Decrease font size"
                        >A⁻</button>
                        <span className="font-size-val">{fontSize}px</span>
                        <button
                            className="font-size-btn"
                            onClick={() => changeFontSize(1)}
                            disabled={fontSize >= FONT_MAX}
                            title="Increase font size"
                        >A⁺</button>
                    </div>

                    <div className="tb-divider" style={{ background: 'rgba(255,255,255,0.2)', margin: '0 6px' }} />

                    <button className="tb-btn tb-btn--icon" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Light mode' : 'Dark mode'}>
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                </div>
            </header>

            {/* ── URL bar ── */}
            {showUrlBar && (
                <div className="url-bar">
                    <form onSubmit={handleFetchUrl}>
                        <input type="url" className="url-bar__input"
                            placeholder="https://example.com/data.json"
                            value={urlInput} onChange={(e) => setUrlInput(e.target.value)} autoFocus />
                        <button type="submit" className="tb-btn tb-btn--primary" disabled={urlLoading}>
                            {urlLoading ? 'Loading…' : 'Fetch'}
                        </button>
                        <button type="button" className="tb-btn tb-btn--ghost" onClick={() => setShowUrlBar(false)}>Cancel</button>
                    </form>
                </div>
            )}

            {/* ── Error banner ── */}
            {error && (
                <div className="error-bar">
                    <span>⚠ {error}</span>
                    <button onClick={() => setError('')}>✕</button>
                </div>
            )}

            {/* ══ Body: sidebar + editor ════════════════════════════ */}
            <div className="workspace">

                {/* ── Left sidebar ── */}
                {sidebarOpen && (
                    <aside className="sidebar">
                        <div className="sidebar-header">
                            <span className="sidebar-title">📁 Saved Files</span>
                            <button className="sidebar-new-btn" onClick={handleNew} title="New empty file">
                                + New
                            </button>
                        </div>

                        {snippets.length === 0 ? (
                            <div className="sidebar-empty">
                                <span className="sidebar-empty-icon">📂</span>
                                <p>No saved files yet.</p>
                                <p>Click <strong>💾 Save</strong> to save your current JSON.</p>
                            </div>
                        ) : (
                            <ul className="sidebar-list">
                                {snippets.map((s) => (
                                    <li
                                        key={s.id}
                                        className={`sidebar-item ${activeId === s.id ? 'sidebar-item--active' : ''}`}
                                        onClick={() => handleSwitchSnippet(s)}
                                        title={s.name}
                                    >
                                        <div className="sidebar-item-icon">
                                            {activeId === s.id ? '📄' : '📃'}
                                        </div>
                                        <div className="sidebar-item-info">
                                            <span className="sidebar-item-name">{s.name}</span>
                                            <span className="sidebar-item-date">
                                                {new Date(s.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <button
                                            className="sidebar-item-del"
                                            onClick={(e) => handleSidebarDelete(e, s.id)}
                                            title="Delete"
                                        >✕</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </aside>
                )}

                {/* ── Main editor / tree area ── */}
                <main className="editor-wrap">
                    {viewMode === 'edit' ? (
                        <>
                            <textarea
                                className="editor"
                                style={{ fontSize: `${fontSize}px` }}
                                value={value}
                                onChange={(e) => { setValue(e.target.value); setActiveId(prev => prev); }}
                                placeholder={"Paste JSON here, upload a file, or pick a saved file from the sidebar\u2026\n\nTip: Ctrl+Enter to Auto-fix & Format."}
                                spellCheck="false"
                                autoCorrect="off"
                                autoCapitalize="off"
                            />
                            {!value && (
                                <div className="editor-hint">
                                    Supports auto-fix for trailing commas, single quotes, unquoted keys &amp; more
                                </div>
                            )}
                        </>
                    ) : (
                        <JsonTreeView jsonString={formattedVal} onEdit={() => setViewMode('edit')} fontSize={fontSize} />
                    )}
                </main>
            </div>

            {/* ── Toast ── */}
            {toast && <div className="toast">{toast}</div>}

            {/* ── Snippets modal ── */}
            {showSnippets && (
                <SavedSnippets
                    snippets={snippets}
                    onRestore={handleRestore}
                    onDelete={handleDeleteSnippet}
                    onClose={() => setShowSnippets(false)}
                />
            )}

            {/* ── Save dialog ── */}
            {showSaveDlg && (
                <div className="modal-overlay" onClick={() => setShowSaveDlg(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>💾 Save File</h3>
                        <p className="modal-hint">Give this JSON a memorable name.</p>
                        <input
                            className="modal-input" type="text" autoFocus
                            placeholder={`Snippet ${snippets.length + 1}`}
                            value={snippetName}
                            onChange={(e) => setSnippetName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') confirmSave(); if (e.key === 'Escape') setShowSaveDlg(false); }}
                        />
                        <div className="modal-actions">
                            <button className="tb-btn tb-btn--primary" onClick={confirmSave}>Save</button>
                            <button className="tb-btn" onClick={() => setShowSaveDlg(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
