import React, { useState } from 'react';

const SavedSnippets = ({ snippets, onRestore, onDelete, onClose }) => {
    const [hoveredId, setHoveredId] = useState(null);

    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleString(undefined, {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="snippets-overlay" onClick={onClose}>
            <div className="snippets-panel" onClick={(e) => e.stopPropagation()}>
                <div className="snippets-header">
                    <h3>📚 Saved Snippets</h3>
                    <button className="btn-close-snippets" onClick={onClose} title="Close">✕</button>
                </div>

                {snippets.length === 0 ? (
                    <div className="snippets-empty">
                        <span className="snippets-empty-icon">📂</span>
                        <p>No saved snippets yet.</p>
                        <p className="snippets-empty-hint">Use the <strong>Save</strong> button to store your JSON here.</p>
                    </div>
                ) : (
                    <ul className="snippets-list">
                        {snippets.map((s) => (
                            <li
                                key={s.id}
                                className={`snippet-item ${hoveredId === s.id ? 'snippet-item--hovered' : ''}`}
                                onMouseEnter={() => setHoveredId(s.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                <div className="snippet-info">
                                    <span className="snippet-name">{s.name}</span>
                                    <span className="snippet-date">{formatDate(s.savedAt)}</span>
                                    <span className="snippet-preview">{s.preview}</span>
                                </div>
                                <div className="snippet-actions">
                                    <button
                                        className="btn btn-sm btn-restore"
                                        onClick={() => { onRestore(s); onClose(); }}
                                        title="Restore this snippet"
                                    >
                                        ↩ Restore
                                    </button>
                                    <button
                                        className="btn btn-sm btn-delete-snippet"
                                        onClick={() => onDelete(s.id)}
                                        title="Delete"
                                    >
                                        🗑
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default SavedSnippets;
