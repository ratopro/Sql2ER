import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Play, 
  RotateCcw, 
  ArrowLeft, 
  Search, 
  Key, 
  Link2, 
  FileCode, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Clock, 
  Copy, 
  Check, 
  HelpCircle,
  Table as TableIcon,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ERDSchema } from '../types/erd';
import { 
  dbSimulator, 
  SimulatedTableInfo, 
  QueryExecutionResult, 
  escapeIdent 
} from '../utils/databaseSimulatorEngine';

interface DatabaseSimulatorProps {
  schema: ERDSchema;
  onBackToDiagram: () => void;
  onReRunSimulation: () => void;
  isDark: boolean;
}

export const DatabaseSimulator: React.FC<DatabaseSimulatorProps> = ({
  schema,
  onBackToDiagram,
  onReRunSimulation,
  isDark,
}) => {
  const [tablesInfo, setTablesInfo] = useState<SimulatedTableInfo[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [tableSearch, setTableSearch] = useState('');
  
  // SQL Console state
  const [sqlCode, setSqlCode] = useState<string>('');
  const [queryResult, setQueryResult] = useState<QueryExecutionResult | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize or re-read simulation state
  const refreshSimulatorState = () => {
    const info = dbSimulator.getTablesInfo(schema);
    setTablesInfo(info);
    if (!selectedTableId && info.length > 0) {
      setSelectedTableId(info[0].id);
      // Expand first table by default
      setExpandedTables({ [info[0].id]: true });
    }
  };

  useEffect(() => {
    // Run simulation initialization on mount
    const initRes = dbSimulator.init(schema);
    setSimulationLogs(initRes.log);
    refreshSimulatorState();

    // Default query: SELECT * from first table
    if (schema.tables.length > 0) {
      const defaultQuery = `SELECT * FROM ${escapeIdent(schema.tables[0].name)};`;
      setSqlCode(defaultQuery);
      // Auto run first query to show immediate results
      const res = dbSimulator.execute(defaultQuery);
      setQueryResult(res);
    }
  }, [schema]);

  // Handle SQL execution
  const handleExecute = (codeToRun?: string) => {
    const query = (codeToRun !== undefined ? codeToRun : sqlCode).trim();
    if (!query) return;

    setIsExecuting(true);
    setTimeout(() => {
      const result = dbSimulator.execute(query);
      setQueryResult(result);
      setIsExecuting(false);

      // Add to history if unique
      setQueryHistory(prev => {
        const filtered = prev.filter(q => q !== query);
        return [query, ...filtered].slice(0, 10);
      });

      // Refresh table counts (e.g. after INSERT/UPDATE/DELETE/CREATE)
      refreshSimulatorState();
    }, 40);
  };

  // Keyboard shortcut Ctrl+Enter / Cmd+Enter inside editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  // Quick action: SELECT from table
  const handleSelectFromTable = (tableName: string) => {
    const q = `SELECT * FROM ${escapeIdent(tableName)};`;
    setSqlCode(q);
    handleExecute(q);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Quick action: Pre-fill INSERT
  const handleInsertTemplate = (table: SimulatedTableInfo) => {
    const cols = table.columns.filter(c => !c.isPK).slice(0, 4);
    const colNames = cols.map(c => escapeIdent(c.name)).join(', ');
    const dummyVals = cols.map(c => {
      if (c.type.includes('INT')) return '100';
      if (c.type.includes('DECIMAL') || c.type.includes('FLOAT')) return '49.99';
      if (c.type.includes('BOOL')) return 'TRUE';
      return `'Ejemplo'`;
    }).join(', ');

    const q = `INSERT INTO ${escapeIdent(table.name)} (${colNames})\nVALUES (${dummyVals});`;
    setSqlCode(q);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Export current result as CSV
  const handleExportCsv = () => {
    if (!queryResult || !queryResult.isSelect || queryResult.rows.length === 0) return;
    const headers = queryResult.columns.join(',');
    const rows = queryResult.rows.map(r => 
      queryResult.columns.map(c => {
        const val = r[c];
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resultado_consulta_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy result as JSON
  const handleCopyJson = () => {
    if (!queryResult || !queryResult.isSelect) return;
    navigator.clipboard.writeText(JSON.stringify(queryResult.rows, null, 2));
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
  };

  const sampleQueries = dbSimulator.generateSampleQueries(schema);

  const filteredTables = tablesInfo.filter(t => 
    t.name.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const totalFields = tablesInfo.reduce((acc, t) => acc + t.columns.length, 0);
  const totalRelations = schema.relationships.length;

  return (
    <div className="absolute inset-0 top-14 bg-slate-100 dark:bg-slate-950 flex flex-col z-20 overflow-hidden font-sans select-none">
      {/* Simulation Sub-Header & Controls */}
      <div className="h-13 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDiagram}
            title="Volver a la vista del diagrama ERD (Esc)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Diagrama</span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              Simulación de Base de Datos
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-300 dark:border-emerald-800">
                SQL En Memoria
              </span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pl-2">
            <span className="flex items-center gap-1">
              <TableIcon className="w-3.5 h-3.5 text-amber-500" />
              <b className="text-slate-700 dark:text-slate-200">{tablesInfo.length}</b> tablas
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <b className="text-slate-700 dark:text-slate-200">{totalFields}</b> campos
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-violet-500" />
              <b className="text-slate-700 dark:text-slate-200">{totalRelations}</b> relaciones
            </span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2">
          {/* Re-run / Reset simulation button */}
          <button
            onClick={() => {
              const res = dbSimulator.init(schema);
              setSimulationLogs(res.log);
              refreshSimulatorState();
              if (sqlCode) handleExecute();
            }}
            title="Reiniciar base de datos con los datos iniciales limpios"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Reiniciar Datos</span>
          </button>

          {/* Sync from ERD Button (F5) */}
          <button
            onClick={onReRunSimulation}
            title="Recrear base de datos a partir de los cambios del diagrama ERD (F5)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Re-ejecutar (F5)</span>
          </button>
        </div>
      </div>

      {/* Main Simulator Workspace (Split View) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Created Tables & Fields Explorer */}
        <aside className="w-80 md:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-hidden">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                placeholder="Buscar tabla o campo..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={() => {
                const allExpanded = Object.keys(expandedTables).length === tablesInfo.length;
                if (allExpanded) {
                  setExpandedTables({});
                } else {
                  const map: Record<string, boolean> = {};
                  tablesInfo.forEach(t => { map[t.id] = true; });
                  setExpandedTables(map);
                }
              }}
              title="Expandir o contraer todas las tablas"
              className="px-2 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              {Object.keys(expandedTables).length === tablesInfo.length ? 'Contraer' : 'Expandir'}
            </button>
          </div>

          {/* Tables Accordion List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 select-text">
            {filteredTables.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No se encontraron tablas.
              </div>
            ) : (
              filteredTables.map(table => {
                const isExpanded = !!expandedTables[table.id];
                const isSelected = selectedTableId === table.id;

                return (
                  <div
                    key={table.id}
                    className={`rounded-xl border transition-all ${
                      isSelected
                        ? 'border-amber-400 dark:border-amber-600 bg-amber-50/20 dark:bg-amber-950/10 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Table Card Header */}
                    <div 
                      onClick={() => {
                        setSelectedTableId(table.id);
                        setExpandedTables(prev => ({ ...prev, [table.id]: !prev[table.id] }));
                      }}
                      className="p-2.5 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {table.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                          {table.rowCount} fila{table.rowCount === 1 ? '' : 's'}
                        </span>
                      </div>

                      {/* Quick query buttons */}
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleSelectFromTable(table.name)}
                          title={`Consultar registros de ${table.name}`}
                          className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          SELECT
                        </button>
                      </div>
                    </div>

                    {/* Table Details: Defined Fields & Relationships */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                        {/* Fields List */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Campos ({table.columns.length})
                            </span>
                            <button
                              onClick={() => handleInsertTemplate(table)}
                              className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                            >
                              + INSERT
                            </button>
                          </div>

                          <div className="space-y-1">
                            {table.columns.map(col => (
                              <div
                                key={col.name}
                                className="flex items-center justify-between gap-1 px-2 py-1 rounded bg-slate-50 dark:bg-slate-800/60 font-mono text-[11px]"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {col.isPK && (
                                    <span title="Clave Primaria (PK)">
                                      <Key className="w-3 h-3 text-amber-500 shrink-0" />
                                    </span>
                                  )}
                                  {col.isFK && (
                                    <span title="Clave Foránea (FK)">
                                      <Link2 className="w-3 h-3 text-blue-500 shrink-0" />
                                    </span>
                                  )}
                                  <span className={`truncate ${col.isPK ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {col.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 text-[10px] opacity-80">
                                  <span className="text-slate-500 dark:text-slate-400">
                                    {col.type}
                                  </span>
                                  {col.defaultValue && (
                                    <span 
                                      className="px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold"
                                      title={`Valor por defecto: ${col.defaultValue}`}
                                    >
                                      DEF: {col.defaultValue}
                                    </span>
                                  )}
                                  {!col.isNullable && !col.isPK && (
                                    <span className="text-[9px] text-slate-400 font-sans">
                                      NN
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Relationships List */}
                        {table.relations.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                              Relaciones ({table.relations.length})
                            </span>
                            <div className="space-y-1">
                              {table.relations.map(rel => (
                                <div
                                  key={rel.id + rel.direction}
                                  className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/60 text-[10px] font-mono flex flex-col gap-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                      <span className="font-bold text-amber-600 dark:text-amber-400">{rel.cardinality}</span>
                                      <span>
                                        {rel.direction === 'outgoing' 
                                          ? `${rel.fromColumn} ➔ ${rel.toTable}.${rel.toColumn}`
                                          : `ref por ${rel.fromTable}.${rel.fromColumn}`}
                                      </span>
                                    </div>
                                    <span className="text-[9px] px-1 py-0.2 rounded font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                                      ON DEL: {rel.onDelete}
                                      {rel.onDelete === 'SET DEFAULT' && rel.defaultValue && ` (${rel.defaultValue})`}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Logs Drawer Toggle */}
          <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40">
            <span className="text-[11px]">Registro de inicialización</span>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
            >
              {showLogs ? 'Ocultar logs' : 'Ver logs'}
            </button>
          </div>
        </aside>

        {/* Right Column: SQL Editor & Results Viewer */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
          {/* Top Console Toolbar */}
          <div className="h-11 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 gap-3">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-amber-500" />
                Editor SQL:
              </span>

              {/* Sample Queries Dropdown */}
              {sampleQueries.length > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto">
                  {sampleQueries.slice(0, 3).map((sq, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSqlCode(sq.sql);
                        handleExecute(sq.sql);
                      }}
                      title={sq.description}
                      className="px-2 py-1 text-[11px] font-mono rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shrink-0"
                    >
                      {sq.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Run Action */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSqlCode('')}
                title="Limpiar editor"
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleExecute()}
                disabled={isExecuting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ejecutar SQL</span>
                <kbd className="text-[10px] font-mono bg-emerald-700/60 px-1 py-0.2 rounded hidden sm:inline">
                  Ctrl+Enter
                </kbd>
              </button>
            </div>
          </div>

          {/* SQL Input Textarea (Monospace Editor) */}
          <div className="h-44 bg-slate-900 border-b border-slate-800 relative flex shrink-0">
            <textarea
              ref={textareaRef}
              value={sqlCode}
              onChange={e => setSqlCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe consultas SQL aquí (SELECT, INSERT, UPDATE, DELETE, JOIN, etc.)... Presiona Ctrl + Enter para ejecutar."
              className="w-full h-full p-3 font-mono text-xs text-amber-200 bg-transparent resize-none outline-none leading-relaxed selection:bg-amber-500 selection:text-slate-950"
              spellCheck={false}
            />
            <div className="absolute right-3 bottom-2 text-[10px] font-mono text-slate-500 pointer-events-none">
              Presiona Ctrl + Enter para ejecutar
            </div>
          </div>

          {/* Results Header Bar */}
          <div className="h-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Resultados:
              </span>
              {queryResult && (
                <div className="flex items-center gap-2">
                  {queryResult.success ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {queryResult.isSelect 
                        ? `${queryResult.rowCount} fila${queryResult.rowCount === 1 ? '' : 's'}`
                        : (queryResult.message || 'Completado')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-500 font-semibold text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Error en consulta
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {queryResult.executionTimeMs} ms
                  </span>
                </div>
              )}
            </div>

            {/* Export and copy actions */}
            {queryResult && queryResult.isSelect && queryResult.rows.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyJson}
                  title="Copiar resultado como JSON"
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {copiedResult ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedResult ? 'Copiado' : 'JSON'}</span>
                </button>
                <button
                  onClick={handleExportCsv}
                  title="Descargar resultado como CSV"
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
              </div>
            )}
          </div>

          {/* Results Body / Data Grid */}
          <div className="flex-1 overflow-auto p-4 select-text">
            {!queryResult ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <Database className="w-10 h-10 opacity-30 text-amber-500" />
                <p className="text-xs">Escribe una consulta SQL o haz clic en "SELECT" en cualquier tabla para ver los resultados.</p>
              </div>
            ) : !queryResult.success ? (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Error de Ejecución SQL</span>
                </div>
                <pre className="font-mono text-xs whitespace-pre-wrap bg-white/60 dark:bg-black/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/40">
                  {queryResult.error}
                </pre>
                <p className="text-[11px] text-rose-600 dark:text-rose-400">
                  Verifica los nombres de las tablas y campos definidos en el explorador de la izquierda.
                </p>
              </div>
            ) : !queryResult.isSelect ? (
              <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs">Sentencia ejecutada con éxito</h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {queryResult.message}
                  </p>
                </div>
              </div>
            ) : queryResult.rows.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-60" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  La consulta se ejecutó correctamente pero no devolvió ninguna fila.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2 px-3 text-[10px] font-mono font-bold text-slate-400 uppercase w-10 text-center">
                        #
                      </th>
                      {queryResult.columns.map(col => (
                        <th
                          key={col}
                          className="py-2 px-3 font-mono font-bold text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-slate-800 text-[11px]"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {queryResult.rows.map((row, rowIdx) => (
                      <tr 
                        key={rowIdx}
                        className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors"
                      >
                        <td className="py-1.5 px-3 text-[10px] text-slate-400 text-center select-none">
                          {rowIdx + 1}
                        </td>
                        {queryResult.columns.map(col => {
                          const val = row[col];
                          const isNull = val === null || val === undefined;
                          const isBool = typeof val === 'boolean';
                          return (
                            <td
                              key={col}
                              className="py-1.5 px-3 border-l border-slate-100 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 text-[11px]"
                            >
                              {isNull ? (
                                <span className="text-slate-400 italic text-[10px]">NULL</span>
                              ) : isBool ? (
                                <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${val ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                                  {val ? 'TRUE' : 'FALSE'}
                                </span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Simulation Initialization Logs Bottom Drawer (Collapsible) */}
          {showLogs && (
            <div className="h-36 bg-slate-900 border-t border-slate-800 p-3 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-1 shrink-0 select-text">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-slate-400 font-bold text-[10px]">
                <span>REGISTRO DE INICIALIZACIÓN DE LA BASE DE DATOS</span>
                <button onClick={() => setShowLogs(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              {simulationLogs.map((logLine, idx) => (
                <div key={idx} className={logLine.startsWith('[ERROR]') ? 'text-rose-400' : 'text-emerald-400'}>
                  {logLine}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
