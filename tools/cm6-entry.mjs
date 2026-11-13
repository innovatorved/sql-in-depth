import { EditorState, Compartment } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  placeholder as cmPlaceholder,
} from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  toggleComment,
} from '@codemirror/commands';
import {
  syntaxHighlighting,
  HighlightStyle,
  bracketMatching,
  indentOnInput,
} from '@codemirror/language';
import { tags } from '@lezer/highlight';
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
  acceptCompletion,
} from '@codemirror/autocomplete';
import { sql, PostgreSQL, SQLite } from '@codemirror/lang-sql';
import { setDiagnostics, lintGutter } from '@codemirror/lint';
import { searchKeymap } from '@codemirror/search';

const sqlHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, class: 'cm-sql-kw' },
  { tag: [tags.operatorKeyword, tags.modifier, tags.controlKeyword], class: 'cm-sql-kw' },
  { tag: [tags.typeName, tags.standard(tags.name)], class: 'cm-sql-type' },
  { tag: [tags.function(tags.variableName), tags.function(tags.name)], class: 'cm-sql-fn' },
  { tag: [tags.string, tags.special(tags.string)], class: 'cm-sql-str' },
  { tag: [tags.number, tags.integer, tags.float, tags.bool], class: 'cm-sql-num' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], class: 'cm-sql-cmt' },
  { tag: [tags.operator, tags.compareOperator, tags.arithmeticOperator], class: 'cm-sql-op' },
  { tag: [tags.propertyName, tags.variableName], class: 'cm-sql-ident' },
]);

const baseTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
    fontFamily: 'var(--font-mono, "Geist Mono", monospace)',
    backgroundColor: 'var(--code-bg, #0d121b)',
    color: 'var(--code-fg, #e2e8f0)',
    borderRadius: 'var(--r-md, 6px)',
    border: '1px solid var(--border, #222b3a)',
  },
  '&.cm-focused': {
    outline: '2px solid var(--accent, #0f62fe)',
    outlineOffset: '-1px',
    borderColor: 'var(--accent, #0f62fe)',
  },
  '.cm-scroller': {
    fontFamily: 'inherit',
    lineHeight: '1.6',
    minHeight: '116px',
    maxHeight: '380px',
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '10px 0',
    caretColor: 'var(--fg, #0f172a)',
  },
  '.cm-line': {
    padding: '0 12px',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-alt, #111622)',
    color: 'var(--fg-faint, #64748b)',
    borderRight: '1px solid var(--border, #222b3a)',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '11.5px',
    fontVariantNumeric: 'tabular-nums',
    userSelect: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--surface-hover, rgba(88,166,255,0.08))',
    color: 'var(--fg, #f1f5f9)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(128, 148, 180, 0.06)',
  },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--selection, rgba(15, 98, 254, 0.22)) !important',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--surface, #ffffff)',
    color: 'var(--fg, #0f172a)',
    border: '1px solid var(--border-strong, #cbd2df)',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-lg, 0 12px 32px rgba(0,0,0,0.22))',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '12px',
    overflow: 'hidden',
  },
  '.cm-tooltip-autocomplete ul li': {
    padding: '4px 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'var(--accent-muted, rgba(15, 98, 254, 0.12))',
    color: 'var(--fg, #0f172a)',
  },
  '.cm-completionLabel': {
    fontWeight: '500',
  },
  '.cm-completionDetail': {
    fontSize: '10.5px',
    color: 'var(--fg-muted, #64748b)',
    fontStyle: 'normal',
  },
  '.cm-diagnostic-error': {
    borderLeft: '2px solid var(--error, #ef4444)',
    padding: '6px 10px',
    fontFamily: 'var(--font-sans, sans-serif)',
    fontSize: '12px',
  },
});

const SQL_EXTRA_COMPLETIONS = [
  { label: 'EXPLAIN QUERY PLAN', type: 'keyword', detail: 'SQLite execution plan' },
  { label: 'EXPLAIN (ANALYZE, BUFFERS)', type: 'keyword', detail: 'Postgres runtime plan' },
  { label: 'ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)', apply: 'ROW_NUMBER() OVER (PARTITION BY ', type: 'function', detail: 'Window rank' },
  { label: 'LAG', type: 'function', detail: 'Previous row value in window' },
  { label: 'LEAD', type: 'function', detail: 'Next row value in window' },
  { label: 'COALESCE', type: 'function', detail: 'First non-NULL expression' },
  { label: 'NULLIF', type: 'function', detail: 'NULL if args equal' },
  { label: 'COUNT(*) FILTER (WHERE ...)', apply: 'COUNT(*) FILTER (WHERE ', type: 'function', detail: 'Conditional aggregate' },
  { label: 'WITH RECURSIVE', type: 'keyword', detail: 'Recursive CTE' },
  { label: 'ON CONFLICT DO UPDATE SET', type: 'keyword', detail: 'Idempotent upsert' },
];

function buildSqlExtension(schemaTables, dialectName) {
  const schemaMap = {};
  const tableCompletions = [];
  if (Array.isArray(schemaTables)) {
    for (const tbl of schemaTables) {
      if (!tbl || !tbl.name) continue;
      tableCompletions.push({
        label: tbl.name,
        type: 'class',
        detail: `table (${(tbl.columns || []).length} cols)`,
        boost: 2,
      });
      schemaMap[tbl.name] = (tbl.columns || []).map((col) => ({
        label: col.name || col,
        type: 'property',
        detail: [col.type || '', col.pk ? 'PK' : '', col.fk ? 'FK' : ''].filter(Boolean).join(' '),
      }));
    }
  }
  const dialect = dialectName === 'postgres' ? PostgreSQL : SQLite;
  return [
    sql({
      dialect,
      schema: schemaMap,
      tables: tableCompletions,
      upperCaseKeywords: true,
    }),
    dialect.language.data.of({
      autocomplete: SQL_EXTRA_COMPLETIONS,
    }),
  ];
}

function locateErrorSpan(docText, errorMessage) {
  const len = docText.length;
  if (!len || !errorMessage) return null;
  const msg = String(errorMessage);

  // 1. SQLite: near "TOKEN": syntax error or no such column: COL or no such table: TBL
  const nearMatch = msg.match(/near\s+"([^"]+)"/i)
    || msg.match(/no such (?:column|table|function):\s*([a-zA-Z0-9_.]+)/i)
    || msg.match(/column\s+"?([a-zA-Z0-9_.]+)"?\s+does not exist/i)
    || msg.match(/relation\s+"?([a-zA-Z0-9_.]+)"?\s+does not exist/i);

  if (nearMatch && nearMatch[1]) {
    const token = nearMatch[1];
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'i');
    const m = re.exec(docText) || docText.toLowerCase().indexOf(token.toLowerCase());
    if (typeof m === 'object' && m !== null && typeof m.index === 'number') {
      return { from: m.index, to: Math.min(len, m.index + token.length) };
    }
    if (typeof m === 'number' && m >= 0) {
      return { from: m, to: Math.min(len, m + token.length) };
    }
  }

  // 2. PostgreSQL LINE N:
  const lineMatch = msg.match(/LINE\s+(\d+):/i);
  if (lineMatch) {
    const lineNum = Math.max(1, parseInt(lineMatch[1], 10));
    const lines = docText.split('\n');
    let offset = 0;
    for (let i = 0; i < Math.min(lineNum - 1, lines.length - 1); i++) {
      offset += lines[i].length + 1;
    }
    const targetLine = lines[Math.min(lineNum - 1, lines.length - 1)] || '';
    return { from: offset, to: Math.min(len, offset + Math.max(1, targetLine.length)) };
  }

  // Default: highlight first non-empty line
  const firstLineEnd = docText.indexOf('\n');
  return { from: 0, to: firstLineEnd > 0 ? firstLineEnd : Math.min(len, 24) };
}

function enhanceTextarea(textarea, opts = {}) {
  if (!textarea || !textarea.parentNode) return null;
  if (textarea._cm6Instance) return textarea._cm6Instance;

  const sqlCompartment = new Compartment();
  let suppressSync = false;
  let hasActiveDiagnostics = false;
  const nativeValDesc = (typeof HTMLTextAreaElement !== 'undefined' && HTMLTextAreaElement.prototype)
    ? Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
    : null;
  const setRawTextareaValue = (val) => {
    if (nativeValDesc && nativeValDesc.set) {
      nativeValDesc.set.call(textarea, val);
    } else {
      textarea.value = val;
    }
  };
  const getRawTextareaValue = () => {
    if (nativeValDesc && nativeValDesc.get) {
      return nativeValDesc.get.call(textarea);
    }
    return textarea.value;
  };

  const host = document.createElement('div');
  host.className = 'cm-sql-host';
  if (opts.minHeight) {
    host.style.setProperty('--cm-min-h', typeof opts.minHeight === 'number' ? `${opts.minHeight}px` : opts.minHeight);
  }

  // Hide underlying textarea visually while preserving DOM presence for legacy queries/tests
  textarea.style.display = 'none';
  textarea.setAttribute('aria-hidden', 'true');
  textarea.tabIndex = -1;
  textarea.parentNode.insertBefore(host, textarea);

  const runCommand = () => {
    const val = view.state.doc.toString();
    setRawTextareaValue(val);
    if (typeof api.onRun === 'function') {
      api.onRun(val);
      return true;
    }
    return false;
  };

  const state = EditorState.create({
    doc: getRawTextareaValue() || opts.doc || '',
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      history(),
      drawSelection(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      autocompletion({
        activateOnTyping: true,
        maxRenderedOptions: 24,
      }),
      highlightActiveLine(),
      lintGutter(),
      syntaxHighlighting(sqlHighlightStyle),
      baseTheme,
      EditorView.contentAttributes.of({
        'aria-label': opts.ariaLabel || textarea.getAttribute('aria-label') || 'SQL query editor',
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off',
      }),
      opts.placeholder ? cmPlaceholder(opts.placeholder) : [],
      sqlCompartment.of(buildSqlExtension(opts.schema || [], opts.dialect || 'sqlite')),
      keymap.of([
        { key: 'Mod-Enter', run: () => { runCommand(); return true; } },
        { key: 'Tab', run: (v) => acceptCompletion(v) || indentWithTab.run(v), shift: indentWithTab.shift },
        { key: 'Mod-/', run: toggleComment },
        ...closeBracketsKeymap,
        ...completionKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !suppressSync) {
          const nextVal = update.state.doc.toString();
          setRawTextareaValue(nextVal);
          if (hasActiveDiagnostics) {
            hasActiveDiagnostics = false;
            queueMicrotask(() => {
              try {
                view.dispatch(setDiagnostics(view.state, []));
              } catch (_) {}
            });
          }
          if (typeof opts.onChange === 'function') {
            opts.onChange(nextVal);
          }
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }),
    ],
  });

  const view = new EditorView({ state, parent: host });

  const api = {
    isCodeMirror: true,
    host,
    shell: host,
    view,
    textarea,
    onRun: opts.onRun || null,
    getValue() {
      return view.state.doc.toString();
    },
    setValue(nextText) {
      const str = String(nextText ?? '');
      setRawTextareaValue(str);
      const cur = view.state.doc.toString();
      if (cur === str) return;
      suppressSync = true;
      view.dispatch({
        changes: { from: 0, to: cur.length, insert: str },
      });
      suppressSync = false;
    },
    insertSnippet(snippet) {
      const text = String(snippet || '');
      const sel = view.state.selection.main;
      const docStr = view.state.doc.toString();
      const before = docStr.slice(0, sel.from);
      const needLeadingSpace = before.length > 0 && !/[\s(,\n.]$/.test(before) && !/^[,);\s]/.test(text);
      const prefix = needLeadingSpace ? (text.indexOf('\n') !== -1 ? '\n' : ' ') : '';
      const insertStr = prefix + text;
      suppressSync = true;
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: insertStr },
        selection: { anchor: sel.from + insertStr.length },
      });
      suppressSync = false;
      const updated = view.state.doc.toString();
      setRawTextareaValue(updated);
      view.focus();
    },
    setSchema(schemaTables, dialectName) {
      view.dispatch({
        effects: sqlCompartment.reconfigure(buildSqlExtension(schemaTables || [], dialectName || 'sqlite')),
      });
    },
    setError(errorMessage) {
      if (!errorMessage) {
        this.clearError();
        return;
      }
      const docStr = view.state.doc.toString();
      const span = locateErrorSpan(docStr, errorMessage);
      if (!span) return;
      hasActiveDiagnostics = true;
      view.dispatch(setDiagnostics(view.state, [{
        from: span.from,
        to: Math.max(span.from + 1, span.to),
        severity: 'error',
        message: String(errorMessage),
      }]));
    },
    clearError() {
      hasActiveDiagnostics = false;
      view.dispatch(setDiagnostics(view.state, []));
    },
    refresh() {
      const taVal = getRawTextareaValue();
      if (typeof taVal === 'string' && taVal !== view.state.doc.toString()) {
        this.setValue(taVal);
      }
    },
    sync() {
      this.refresh();
    },
    focus() {
      view.focus();
    },
    destroy() {
      view.destroy();
      host.remove();
      textarea.style.display = '';
      textarea.removeAttribute('aria-hidden');
      delete textarea._cm6Instance;
      delete textarea._sqlIdeInstance;
    },
  };

  if (nativeValDesc && nativeValDesc.get && nativeValDesc.set) {
    try {
      Object.defineProperty(textarea, 'value', {
        configurable: true,
        enumerable: true,
        get() {
          return view.state.doc.toString();
        },
        set(v) {
          api.setValue(v);
        },
      });
    } catch (_) {}
  }

  textarea._cm6Instance = api;
  textarea._sqlIdeInstance = api;
  textarea._syncSqlIde = () => api.refresh();
  return api;
}

window.SqlCodeMirror = {
  enhanceTextarea,
  locateErrorSpan,
};
