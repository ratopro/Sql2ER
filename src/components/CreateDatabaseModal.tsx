import React, { useState } from 'react';
import { X, Database, Check } from 'lucide-react';
import { DatabaseItem, TableThemeColor } from '../types/erd';

interface CreateDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDatabase: (db: Omit<DatabaseItem, 'id' | 'createdAt'>) => void;
  isFirstDatabase?: boolean;
}

const DB_THEME_COLORS: { id: TableThemeColor; name: string; bg: string; dot: string }[] = [
  { id: 'indigo', name: 'Índigo', bg: 'bg-indigo-600', dot: 'bg-indigo-500' },
  { id: 'emerald', name: 'Esmeralda', bg: 'bg-emerald-600', dot: 'bg-emerald-500' },
  { id: 'purple', name: 'Púrpura', bg: 'bg-purple-600', dot: 'bg-purple-500' },
  { id: 'amber', name: 'Ámbar', bg: 'bg-amber-500', dot: 'bg-amber-400' },
  { id: 'cyan', name: 'Cian', bg: 'bg-cyan-600', dot: 'bg-cyan-500' },
  { id: 'rose', name: 'Rosa', bg: 'bg-rose-600', dot: 'bg-rose-500' },
  { id: 'teal', name: 'Turquesa', bg: 'bg-teal-600', dot: 'bg-teal-500' },
  { id: 'slate', name: 'Pizarra', bg: 'bg-slate-700', dot: 'bg-slate-500' },
];

export const CreateDatabaseModal: React.FC<CreateDatabaseModalProps> = ({
  isOpen,
  onClose,
  onCreateDatabase,
  isFirstDatabase = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<TableThemeColor>('indigo');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanName) return;

    onCreateDatabase({
      name: cleanName,
      description: description.trim() || undefined,
      color,
    });

    setName('');
    setDescription('');
    setColor('indigo');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isFirstDatabase ? 'Crear Primera Base de Datos' : 'Nueva Base de Datos'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFirstDatabase 
                  ? 'Antes de añadir tablas, necesitas crear una base de datos para organizarlas.' 
                  : 'Crea una base de datos para organizar tus tablas.'}
              </p>
            </div>
          </div>

          {!isFirstDatabase && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre de la Base de Datos *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ej. tienda_online, crm_db, auth_service"
              className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Todas las tablas creadas pertenecerán a esta base de datos.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Color Temático Identificador
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DB_THEME_COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs font-medium transition-all ${
                    color === c.id
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 font-bold text-slate-900 dark:text-slate-100'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${c.dot} shrink-0`} />
                  <span className="truncate text-[11px]">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descripción del Módulo (Opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="ej. Módulo transaccional principal de e-commerce"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            {!isFirstDatabase && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={!name.trim()}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 hover:bg-slate-800 disabled:opacity-50 rounded-lg shadow-sm transition-all"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Crear Base de Datos</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
