import React, { useState, useCallback, useMemo, useEffect } from 'react';
import './App.css';

const LABEL_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316'];

const App = () => {
  const [text, setText] = useState('The quick brown fox jumps over the lazy dog. John works at Google in New York.');
  const [labels, setLabels] = useState([
    { name: 'PERSON', color: '#3b82f6' },
    { name: 'ORG', color: '#8b5cf6' },
    { name: 'GPE', color: '#10b981' },
  ]);
  const [newLabel, setNewLabel] = useState('');
  const [annotations, setAnnotations] = useState([]);
  const [selectedText, setSelectedText] = useState(null);
  const [lastAnnotation, setLastAnnotation] = useState(null);

  const handleTextChange = (e) => {
    setText(e.target.value);
    setAnnotations([]);
    setSelectedText(null);
  };

  const handleSelect = (e) => {
    const { selectionStart, selectionEnd } = e.target;
    if (selectionStart !== selectionEnd) {
      setSelectedText({ start: selectionStart, end: selectionEnd });
    }
  };

  const addLabel = useCallback(() => {
    if (newLabel.trim() && !labels.find(l => l.name === newLabel.toUpperCase().trim())) {
      const color = LABEL_COLORS[labels.length % LABEL_COLORS.length];
      setLabels(prev => [...prev, { name: newLabel.toUpperCase().trim(), color }]);
      setNewLabel('');
    }
  }, [newLabel, labels]);

  const handleLabelClick = useCallback((labelName) => {
    if (selectedText) {
      const newAnnotation = {
        start: selectedText.start,
        end: selectedText.end,
        tag_name: labelName,
      };
      setAnnotations(prev => [...prev, newAnnotation].sort((a, b) => a.start - b.start));
      setLastAnnotation(newAnnotation);
      setSelectedText(null);
    }
  }, [selectedText]);

  const handleDelete = useCallback((toRemove) => {
    setAnnotations(prev => prev.filter(a => a !== toRemove));
  }, []);

  const annotatedContent = useMemo(() => {
    if (annotations.length === 0) return null;
    const sorted = [...annotations].sort((a, b) => a.start - b.start);
    let lastIdx = 0;
    const parts = [];

    sorted.forEach((ann, idx) => {
      if (ann.start >= lastIdx) {
        if (ann.start > lastIdx) parts.push(text.substring(lastIdx, ann.start));
        parts.push(
          <span
            key={`${ann.start}-${ann.end}-${idx}`}
            style={{
              backgroundColor: labels.find(l => l.name === ann.tag_name)?.color || '#3b82f6',
              borderRadius: '3px',
              padding: '2px 4px',
              margin: '0 1px'
            }}
          >
            <span style={{ color: 'white', fontWeight: 500 }}>{text.substring(ann.start, ann.end)}</span>
            <span className="annotation-tag">[{ann.tag_name}]</span>
            <button onClick={() => handleDelete(ann)} className="annotation-remove" title="Remove">
              ×
            </button>
          </span>
        );
        lastIdx = ann.end;
      }
    });
    parts.push(text.substring(lastIdx));
    return parts;
  }, [annotations, labels, text, handleDelete]);

  const getJson = useCallback(() => ({
    examples: [{ id: 'ex-1', content: text, annotations }]
  }), [text, annotations]);

  const downloadJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(getJson(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'annotations.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }, [getJson]);

  useEffect(() => {
    const handleKey = (e) => {
      // Only trigger if text is selected and number key pressed
      if (selectedText && e.key >= '1' && e.key <= '9') {
        const k = parseInt(e.key);
        if (k > 0 && k <= labels.length) {
          e.preventDefault(); // Prevent typing into textarea
          handleLabelClick(labels[k - 1].name);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [labels, handleLabelClick, selectedText]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-inner">
          <div className="app-brand">
            <div className="brand-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
            <div>
              <div className="brand-name">TextAnnotator</div>
              <div className="brand-tagline">Entity labeling tool</div>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="main-inner">
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <span className="panel-title-icon">&#x2605;</span>
                Passage Input
              </h2>
            </div>
            <textarea
              value={text}
              onChange={handleTextChange}
              onSelect={handleSelect}
              placeholder="Paste or type your passage text here..."
            />
            {selectedText && (
              <div className="selection-info">
                <span>&#x2713;</span>
                <span>"{text.substring(selectedText.start, selectedText.end)}"</span>
                <span>({selectedText.end - selectedText.start} chars)</span>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <span className="panel-title-icon">&#x2B50;</span>
                Entity Labels
              </h2>
              <span className="panel-meta">{labels.length} labels</span>
            </div>
            <div className="input-row">
              <input
                type="text"
                className="input"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLabel()}
                placeholder="Enter new label..."
              />
              <button className="btn btn-primary" onClick={addLabel}>+ Add</button>
            </div>
            <div className="labels-flex">
              {labels.map((label, idx) => (
                <button
                  key={label.name}
                  className="label-chip"
                  style={{ backgroundColor: label.color }}
                  onClick={() => handleLabelClick(label.name)}
                >
                  {label.name}
                  <span className="key">{idx + 1}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel panel-full">
            <div className="panel-header">
              <h2 className="panel-title">
                <span className="panel-title-icon">&#x2714;</span>
                Annotated Text
              </h2>
              <span className="panel-meta">
                {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
              </span>
            </div>
            {annotatedContent ? (
              <div className="output-area">{annotatedContent}</div>
            ) : (
              <div className="output-area output-area-empty">
                Select text above and choose a label to annotate
              </div>
            )}
          </div>

          <div className="panel panel-full">
            <div className="panel-header">
              <h2 className="panel-title">
                <span className="panel-title-icon">&#x7B;</span>
                JSON Output
              </h2>
            </div>
            <div className="json-section">
              <div className="json-header-row">
                <button className="btn btn-success" onClick={downloadJson}>
                  &#x2193; Download
                </button>
              </div>
              <pre className="json-code">{JSON.stringify(getJson(), null, 2)}</pre>
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-label">Characters</div>
                  <div className="stat-value">{text.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Annotations</div>
                  <div className="stat-value blue">{annotations.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Labels</div>
                  <div className="stat-value green">{labels.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;