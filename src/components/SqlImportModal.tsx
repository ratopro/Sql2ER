import React, { useState, useMemo } from 'react';
import { 
  X, 
  Database, 
  FileCode, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Copy, 
  RotateCcw,
  Layers,
  ArrowRight
} from 'lucide-react';
import { TableNode, Relationship } from '../types/erd';
import { parseSqlDdl } from '../utils/sqlParser';

interface SqlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (tables: TableNode[], relationships: Relationship[], mode: 'replace' | 'append') => void;
}

const SAMPLE_SQL_ECOMMERCE = `-- Esquema E-Commerce con restricciones ON DELETE
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_prod_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
`;

const SAMPLE_SQL_BLOG = `-- Sistema de Blog con Relación Muchos a Muchos
CREATE TABLE authors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  bio TEXT
);

CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  author_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  published_at TIMESTAMP,
  CONSTRAINT fk_post_author FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);

CREATE TABLE tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tag_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE post_tags (
  post_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  CONSTRAINT fk_pt_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_pt_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
`;

const SAMPLE_SQL_SAAS = `-- Plataforma SaaS Multi-tenant
CREATE TABLE organizations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free'
);

CREATE TABLE members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  org_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  CONSTRAINT fk_member_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  org_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  CONSTRAINT fk_project_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  assigned_to INT,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'todo',
  CONSTRAINT fk_task_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_member FOREIGN KEY (assigned_to) REFERENCES members(id) ON DELETE SET NULL
);
`;

export const SqlImportModal: React.FC<SqlImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [sqlCode, setSqlCode] = useState(SAMPLE_SQL_ECOMMERCE);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  // Parse on the fly to give instant feedback
  const parseResult = useMemo(() => {
    if (!sqlCode.trim()) {
      return { tables: [], relationships: [], errors: [], warnings: [] };
    }
    return parseSqlDdl(sqlCode);
  }, [sqlCode]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (parseResult.tables.length === 0) return;
    onImport(parseResult.tables, parseResult.relationships, importMode);
    onClose();
  };

  const totalColumns = parseResult.tables.reduce((acc, t) => acc + t.columns.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Generar Diagrama desde Código SQL (DDL)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold">
                  Parser SQL Nativo
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pega tus sentencias CREATE TABLE y ALTER TABLE con claves foráneas y reglas ON DELETE.
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

        {/* Example Presets Bar */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 overflow-x-auto text-xs shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-500 font-semibold text-[11px]">Ejemplos SQL:</span>
            <button
              type="button"
              onClick={() => setSqlCode(SAMPLE_SQL_ECOMMERCE)}
              className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              Tienda E-Commerce
            </button>
            <button
              type="button"
              onClick={() => setSqlCode(SAMPLE_SQL_BLOG)}
              className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              Blog & Comentarios
            </button>
            <button
              type="button"
              onClick={() => setSqlCode(SAMPLE_SQL_SAAS)}
              className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              SaaS Multi-tenant
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSqlCode('')}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-500 transition-colors shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpiar editor</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* SQL Editor Area */}
          <div className="flex-1 flex flex-col p-4 min-h-[260px] md:min-h-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                Editor SQL DDL
              </span>
              <span className="text-[11px] text-slate-400">
                Soporta PostgreSQL, MySQL, SQLite y MariaDB
              </span>
            </div>

            <textarea
              value={sqlCode}
              onChange={e => setSqlCode(e.target.value)}
              placeholder="CREATE TABLE usuarios (&#10;  id INT PRIMARY KEY AUTO_INCREMENT,&#10;  nombre VARCHAR(100) NOT NULL,&#10;  email VARCHAR(255) UNIQUE&#10;);&#10;&#10;CREATE TABLE pedidos (&#10;  id INT PRIMARY KEY,&#10;  usuario_id INT,&#10;  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE&#10;);"
              className="flex-1 w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-500 resize-none overflow-y-auto leading-relaxed select-text"
              spellCheck={false}
            />
          </div>

          {/* Right Live Summary & Diagnostics Panel */}
          <div className="w-full md:w-80 p-5 bg-slate-50/60 dark:bg-slate-950/40 flex flex-col justify-between shrink-0 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-2">
                  <Database className="w-3.5 h-3.5 text-amber-500" />
                  Estructura Detectada
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 block">
                      {parseResult.tables.length}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Tablas</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 block">
                      {totalColumns}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Campos</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 block">
                      {parseResult.relationships.length}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Relaciones</span>
                  </div>
                </div>
              </div>

              {/* Detected Tables Preview */}
              {parseResult.tables.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                    Tablas a Generar:
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {parseResult.tables.map(t => (
                      <div
                        key={t.id}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {t.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {t.columns.length} campos
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings or Errors */}
              {parseResult.errors.length > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    {parseResult.errors.map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode Selection */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  Modo de Importación:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                      importMode === 'replace'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Reemplazar actual
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                      importMode === 'append'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Añadir al lienzo
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Bottom CTA */}
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <button
                type="button"
                disabled={parseResult.tables.length === 0}
                onClick={handleApply}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 hover:bg-slate-800 disabled:opacity-40 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Generar Diagrama en el Lienzo</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-center transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
