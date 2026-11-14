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
import { tags, tagHighlighter } from '@lezer/highlight';
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
  acceptCompletion,
} from '@codemirror/autocomplete';
import { sql, SQLDialect } from '@codemirror/lang-sql';
import { setDiagnostics, lintGutter } from '@codemirror/lint';
import { searchKeymap } from '@codemirror/search';

const SQL_KEYWORDS_LIST = [
  'abort', 'action', 'add', 'after', 'all', 'alter', 'always', 'analyse', 'analyze', 'and', 'any',
  'as', 'asc', 'attach', 'autoincrement', 'before', 'begin', 'between', 'by', 'cascade', 'case',
  'check', 'cluster', 'collate', 'column', 'comment', 'commit', 'committed', 'concurrently',
  'conflict', 'constraint', 'copy', 'costs', 'create', 'cross', 'cube', 'current', 'current_row',
  'cycle', 'database', 'deallocate', 'declare', 'default', 'deferrable', 'deferred', 'delete',
  'desc', 'detach', 'distinct', 'do', 'drop', 'each', 'else', 'end', 'escape', 'except', 'exclude',
  'excluding', 'exclusive', 'exists', 'explain', 'extension', 'fail', 'fetch', 'filter', 'first',
  'following', 'for', 'foreign', 'from', 'full', 'function', 'generated', 'glob', 'grant', 'group',
  'grouping', 'groups', 'having', 'identity', 'if', 'ignore', 'ilike', 'immediate', 'in', 'include',
  'including', 'increment', 'index', 'indexed', 'inherits', 'initially', 'inner', 'inout',
  'insensitive', 'insert', 'instead', 'intersect', 'into', 'is', 'isolation', 'join', 'key',
  'language', 'last', 'lateral', 'leading', 'left', 'level', 'like', 'limit', 'listen', 'load',
  'local', 'lock', 'locked', 'logged', ' matched', 'matched', 'materialized', 'merge', 'natural',
  'next', 'no', 'not', 'nothing', 'notify', 'notnull', 'nowait', 'nulls', 'of', 'off', 'offset',
  'on', 'only', 'open', 'operator', 'option', 'or', 'order', 'ordinality', 'others', 'out', 'outer',
  'over', 'overlaps', 'overriding', 'owned', 'partition', 'passing', 'placing', 'plan', 'policy',
  'pragma', 'preceding', 'prepare', 'prepared', 'primary', 'prior', 'privileges', 'procedure',
  'publication', 'query', 'raise', 'range', 'read', ' recursive', 'recursive', 'ref', 'references',
  'refresh', 'ava', 'regexp', 'reindex', 'release', 'rename', 'repeatable', 'replace', 'replica',
  'reset', 'restart', 'restrict', 'return', 'returning', 'returns', 'revoke', 'right', 'role',
  'rollback', 'rollup', 'routine', 'row', 'rows', 'rule', 'savepoint', 'schema', 'scroll', 'search',
  'security', 'select', 'sequence', 'serializable', 'session', 'set', 'sets', 'share', 'show',
  'similar', 'simple', 'skip', 'snapshot', 'some', 'sql', 'stable', 'standalone', 'start',
  'statement', 'statistics', 'stdin', 'stdout', 'storage', 'stored', 'strict', 'subscription',
  'symmetric', 'sysid', 'system', 'table', 'tables', 'tablesample', 'tablespace', 'temp',
  'template', 'temporary', 'then', 'ties', 'to', 'trailing', 'transaction', 'trigger', 'truncate',
  'trusted', 'type', 'types', 'unbounded', 'uncommitted', 'union', 'unique', 'unknown', 'unlisten',
  'unlogged', 'until', 'update', 'upsert', 'using', 'vacuum', 'valid', 'validate', 'value',
  'values', 'variadic', 'verbose', 'version', 'view', 'views', 'virtual', 'volatile', 'when',
  'where', 'window', 'with', 'within', 'without', 'work', 'write', 'zone', 'buffers'
].join(' ');

const SQL_TYPES_LIST = [
  'array', 'bigint', 'bigserial', 'bit', 'blob', 'bool', 'boolean', 'box', 'bytea', 'char',
  'character', 'cidr', 'circle', 'clob', 'date', 'datetime', 'dec', 'decimal', 'double', 'enum',
  'float', 'float4', 'float8', 'inet', 'int', 'int2', 'int4', 'int8', 'integer', 'interval',
  'json', 'jsonb', 'line', 'lseg', 'macaddr', 'macaddr8', 'money', 'nchar', 'numeric', 'nvarchar',
  'path', 'pg_lsn', 'point', 'polygon', 'precision', 'real', 'regclass', 'regtype', 'serial',
  'serial2', 'serial4', 'serial8', 'smallint', 'smallserial', 'text', 'time', 'timestamp',
  'timestamptz', 'timetz', 'tsquery', 'tsvector', 'txid_snapshot', 'uuid', 'varbinary', 'varbit',
  'varchar', 'varying', 'xml'
].join(' ');

const SQL_BUILTIN_FUNCTIONS_LIST = [
  'abs', 'acos', 'age', 'any_value', 'array_agg', 'array_append', 'array_length', 'array_position',
  'array_remove', 'array_to_string', 'ascii', 'asin', 'atan', 'atan2', 'avg', 'bit_and', 'bit_length',
  'bit_or', 'bool_and', 'bool_or', 'btrim', 'cardinality', 'cast', 'cbrt', 'ceil', 'ceiling',
  'char_length', 'character_length', 'changes', 'chr', ' clock_timestamp', 'coalesce', 'concat',
  'concat_ws', 'corr', 'cos', 'cot', 'count', 'covar_pop', 'covar_samp', 'cume_dist', 'current_date',
  'current_database', 'current_schema', 'current_setting', 'current_time', 'current_timestamp',
  'current_user', 'currval', 'date_add', 'date_bin', 'date_part', 'date_sub', 'date_trunc',
  'datetime', 'dense_rank', 'div', 'encode', 'decode', 'every', 'exp', 'extract', 'first_value',
  'floor', 'format', 'gen_random_uuid', 'generate_series', 'generate_subscripts', 'greatest',
  'group_concat', 'hex', 'ifnull', 'iif', 'initcap', 'instr', 'isfinite', 'json_agg', 'json_array',
  'json_array_elements', 'json_array_length', 'json_build_array', 'json_build_object', 'json_each',
  'json_extract', 'json_group_array', 'json_group_object', 'json_object', 'json_object_agg',
  'json_set', 'json_strip_nulls', 'json_type', 'json_valid', 'jsonb_agg', 'jsonb_array_elements',
  'jsonb_array_length', 'jsonb_build_array', 'jsonb_build_object', 'jsonb_each', 'jsonb_extract_path',
  'jsonb_extract_path_text', 'jsonb_object_agg', 'jsonb_pretty', 'jsonb_set', 'julianday', 'lag',
  'last_insert_rowid', 'last_value', 'lead', 'least', 'left', 'length', 'ln', 'localtime',
  'localtimestamp', 'log', 'log10', 'lower', 'lpad', 'ltrim', 'make_date', 'make_interval',
  'make_timestamp', 'max', 'md5', 'min', 'mod', 'nextval', 'now', 'nth_value', 'ntile', 'nullif',
  'octet_length', 'overlay', 'parse_ident', 'percent_rank', 'percentile_cont', 'percentile_disc',
  'pg_backend_pid', 'pg_Blocking_pids', 'pg_column_size', 'pg_current_wal_lsn', 'pg_indexes_size',
  'pg_relation_size', 'pg_size_pretty', 'pg_sleep', 'pg_table_size', 'pg_total_relation_size',
  'pg_typeof', 'pi', 'position', 'pow', 'power', 'printf', 'quote_ident', 'quote_literal',
  'quote_nullable', 'radians', 'random', 'rank', 'regexp_count', 'regexp_instr', 'regexp_like',
  'regexp_match', 'regexp_matches', 'regexp_replace', 'regexp_split_to_array',
  'regexp_split_to_table', 'regexp_substr', 'regr_avgx', 'regr_avgy', 'regr_count', 'regr_r2',
  'regr_slope', 'repeat', 'replace', 'reverse', 'right', 'round', 'row_number', 'row_to_json',
  'rpad', 'rtrim', 'setval', 'sha256', 'sign', 'sin', 'split_part', 'sqrt', ' statement_timestamp',
  'stddev', 'stddev_pop', 'stddev_samp', 'strftime', 'string_agg', 'string_to_array', 'strpos',
  'substr', 'substring', 'sum', 'tan', 'timeofday', 'to_char', 'to_date', 'to_hex', 'to_json',
  'to_jsonb', 'to_number', 'to_timestamp', 'total', 'transaction_timestamp', 'translate', 'trim',
  'trunc', 'typeof', 'unicode', 'unnest', 'upper', 'variance', 'var_pop', 'var_samp', 'width_bucket'
].join(' ');

const RichPostgreSQL = SQLDialect.define({
  charSetCasts: true,
  doubleDollarQuotedStrings: true,
  operatorChars: '+-*/<>=~!@#%^&|`?',
  specialVar: '$',
  identifierQuotes: '"',
  keywords: SQL_KEYWORDS_LIST,
  types: SQL_TYPES_LIST,
  builtin: SQL_BUILTIN_FUNCTIONS_LIST,
});

const RichSQLite = SQLDialect.define({
  operatorChars: '*+-%<>!=&|/~',
  identifierQuotes: '`"[]',
  specialVar: '@:?$',
  keywords: SQL_KEYWORDS_LIST,
  types: SQL_TYPES_LIST,
  builtin: SQL_BUILTIN_FUNCTIONS_LIST,
});

const sqlHighlightStyle = HighlightStyle.define([
  {
    tag: [tags.keyword, tags.operatorKeyword, tags.modifier, tags.controlKeyword, tags.definitionKeyword],
    color: 'var(--syn-kw)',
    fontWeight: '600',
  },
  {
    tag: [tags.standard(tags.name), tags.function(tags.variableName), tags.function(tags.name), tags.special(tags.name)],
    color: 'var(--syn-fn)',
    fontWeight: '500',
  },
  {
    tag: [tags.typeName, tags.className, tags.namespace],
    color: 'var(--syn-type)',
    fontWeight: '500',
  },
  {
    tag: [tags.string, tags.character],
    color: 'var(--syn-str)',
  },
  {
    tag: [tags.special(tags.string)],
    color: 'var(--code-fg)',
  },
  {
    tag: [tags.number, tags.integer, tags.float, tags.bool, tags.null, tags.atom],
    color: 'var(--syn-num)',
  },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: 'var(--syn-cmt)',
    fontStyle: 'italic',
  },
  {
    tag: [tags.operator, tags.compareOperator, tags.arithmeticOperator, tags.logicOperator, tags.punctuation],
    color: 'var(--syn-op)',
  },
  {
    tag: [tags.name, tags.propertyName, tags.variableName],
    color: 'var(--code-fg)',
  },
]);

const sqlClassHighlighter = tagHighlighter([
  { tag: [tags.keyword, tags.operatorKeyword, tags.modifier, tags.controlKeyword], class: 'cm-sql-kw' },
  { tag: [tags.standard(tags.name), tags.function(tags.variableName), tags.function(tags.name), tags.special(tags.name)], class: 'cm-sql-fn' },
  { tag: [tags.typeName, tags.className], class: 'cm-sql-type' },
  { tag: [tags.string, tags.character], class: 'cm-sql-str' },
  { tag: [tags.number, tags.integer, tags.float, tags.bool, tags.null, tags.atom], class: 'cm-sql-num' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], class: 'cm-sql-cmt' },
  { tag: [tags.operator, tags.compareOperator, tags.arithmeticOperator, tags.punctuation], class: 'cm-sql-op' },
  { tag: [tags.name, tags.propertyName, tags.variableName], class: 'cm-sql-ident' },
]);

const baseTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
    fontFamily: 'var(--font-mono, "Geist Mono", monospace)',
    backgroundColor: 'var(--code-bg, #FAFAF8)',
    color: 'var(--code-fg, #18181B)',
    borderRadius: 'var(--r-md, 6px)',
    border: '1px solid var(--border, #E6E4DF)',
  },
  '&.cm-focused': {
    outline: 'none',
    borderColor: 'var(--border-focus, #3F3F46)',
  },
  '.cm-scroller': {
    fontFamily: 'inherit',
    lineHeight: '1.6',
    minHeight: 'var(--cm-min-h, 112px)',
    maxHeight: '420px',
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '10px 0',
    caretColor: 'var(--fg, #18181B)',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--fg, #18181B)',
  },
  '.cm-line': {
    padding: '0 12px',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-alt, #F1F1EE)',
    color: 'var(--fg-faint, #6E6A64)',
    borderRight: '1px solid var(--border, #E6E4DF)',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '12px',
    fontVariantNumeric: 'tabular-nums',
    userSelect: 'none',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 10px 0 12px',
    minWidth: '36px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: 'var(--fg, #18181B)',
    fontWeight: '500',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(128, 128, 128, 0.055)',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'var(--accent-muted, rgba(24, 24, 27, 0.1))',
    outline: '1px solid var(--border-strong, #D3D0C9)',
    borderRadius: '2px',
  },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--selection, rgba(24, 24, 27, 0.14)) !important',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--surface, #ffffff)',
    color: 'var(--fg, #18181B)',
    border: '1px solid var(--border-strong, #D3D0C9)',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-lg)',
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
    backgroundColor: 'var(--accent-muted, rgba(24, 24, 27, 0.08))',
    color: 'var(--fg, #18181B)',
  },
  '.cm-completionLabel': {
    fontWeight: '500',
  },
  '.cm-completionDetail': {
    fontSize: '11px',
    color: 'var(--fg-muted, #52525B)',
    fontStyle: 'normal',
  },
  '.cm-diagnostic-error': {
    borderLeft: '1px solid var(--error, #B42318)',
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
  const dialect = dialectName === 'postgres' ? RichPostgreSQL : RichSQLite;
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
      syntaxHighlighting(sqlClassHighlighter),
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
