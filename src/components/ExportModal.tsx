import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  FileText, 
  Braces, 
  Upload 
} from 'lucide-react';
import { ERDSchema, SchemaStep } from '../types/erd';
import { generateSqlDDL, generateTimelineMigrationSql, SqlDialect } from '../utils/exportSql';
import { generateMermaidER } from '../utils/exportMermaid';
import { Clock } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: ERDSchema;
  steps?: SchemaStep[];
  initialTab?: 'sql' | 'timeline' | 'mermaid' | 'json';
  onImportJson: (newSchema: ERDSchema) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  schema,
  steps = [],
  initialTab = 'sql',
  onImportJson,
}) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'timeline' | 'mermaid' | 'json'>(initialTab);
  const [dialect, setDialect] = useState<SqlDialect>('postgres');
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const sqlContent = generateSqlDDL(schema, dialect);
  const timelineContent = generateTimelineMigrationSql(steps, dialect);
  const mermaidContent = generateMermaidER(schema);
  const jsonContent = JSON.stringify(schema, null, 2);

  const currentContent = activeTab === 'sql' 
    ? sqlContent 
    : activeTab === 'timeline'
    ? timelineContent
    : activeTab === 'mermaid' 
    ? mermaidContent 
    : jsonContent;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let filename = `${schema.title.toLowerCase().replace(/\s+/g, '_')}`;
    let mimeType = 'text/plain';

    if (activeTab === 'sql') {
      filename += `_${dialect}.sql`;
      mimeType = 'application/sql';
    } else if (activeTab === 'timeline') {
      filename += `_migrations_${dialect}.sql`;
      mimeType = 'application/sql';
    } else if (activeTab === 'mermaid') {
      filename += '_erd.mmd';
      mimeType = 'text/plain';
    } else {
      filename += '_schema.json';
      mimeType = 'application/json';
    }

    const blob = new Blob([currentContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(jsonInput);
      if (!parsed.tables || !Array.isArray(parsed.tables)) {
        throw new Error('El JSON debe contener un arreglo "tables".');
      }
      onImportJson(parsed);
      onClose();
    } catch (err: any) {
      setImportError(err.message || 'JSON inválido');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Exportar / Importar Esquema
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Genera código SQL listo para producción, diagramas Mermaid o exporta el proyecto.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Main Format Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab('sql')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'sql'
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>SQL DDL</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'timeline'
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Migraciones ({steps.length} pasos)</span>
            </button>

            <button
              onClick={() => setActiveTab('mermaid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'mermaid'
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Mermaid.js</span>
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'json'
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Braces className="w-3.5 h-3.5" />
              <span>JSON Backup</span>
            </button>
          </div>

          {/* SQL Dialect Switcher */}
          {activeTab === 'sql' && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 mr-1">Dialecto:</span>
              {(['postgres', 'mysql', 'sqlite'] as SqlDialect[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDialect(d)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    dialect === d
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {d === 'postgres' ? 'PostgreSQL' : d === 'mysql' ? 'MySQL' : 'SQLite'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col">
          {activeTab === 'json' ? (
            <div className="flex flex-col h-full gap-4">
              <div className="flex-1 relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-950 text-slate-100">
                <textarea
                  readOnly
                  value={jsonContent}
                  className="w-full h-full p-4 font-mono text-xs bg-transparent resize-none outline-none overflow-auto"
                />
              </div>

              {/* Import from JSON section */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-amber-500" />
                  Importar o Restaurar Esquema desde JSON
                </span>
                <textarea
                  value={jsonInput}
                  onChange={e => setJsonInput(e.target.value)}
                  placeholder="Pega aquí el JSON del esquema para restaurarlo..."
                  rows={2}
                  className="w-full text-xs font-mono p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                />
                {importError && (
                  <p className="text-xs text-rose-500 font-medium">{importError}</p>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleImportSubmit}
                    disabled={!jsonInput.trim()}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    Cargar Esquema
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-950 text-slate-100">
              <pre className="p-4 font-mono text-xs leading-relaxed overflow-auto h-full text-emerald-400 dark:text-emerald-300">
                <code>{currentContent}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {schema.tables.length} tablas · {schema.relationships.length} relaciones
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-300 dark:border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar al portapapeles'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 hover:bg-slate-800 rounded-lg shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Archivo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
