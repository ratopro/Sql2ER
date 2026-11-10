import React, { useState } from 'react';
import { 
  X, 
  GitCommit, 
  Plus, 
  Trash2, 
  Clock, 
  ArrowRight,
  Database,
  FileCode,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { TableNode, MigrationCommand, MigrationActionType, SchemaStep } from '../types/erd';
import { generateCommandSql } from '../utils/exportSql';

interface AddStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableNode[];
  currentStepCount: number;
  initialTableName?: string;
  onSaveStep: (step: Omit<SchemaStep, 'schemaSnapshot'>) => void;
}

export const AddStepModal: React.FC<AddStepModalProps> = ({
  isOpen,
  onClose,
  tables,
  currentStepCount,
  initialTableName,
  onSaveStep,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState(`v1.${currentStepCount}`);
  const [commands, setCommands] = useState<MigrationCommand[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      const defaultTable = initialTableName || tables[0]?.name || 'users';
      setTitle(initialTableName ? `Alteración en ${initialTableName}` : '');
      setDescription('');
      setVersion(`v1.${currentStepCount}`);
      setCommands([
        {
          id: 'cmd_' + Date.now().toString(36),
          type: 'ADD_COLUMN',
          tableName: defaultTable,
          columnName: 'is_active',
          columnType: 'BOOLEAN DEFAULT TRUE',
          description: `Añadir atributo a ${defaultTable}`,
        },
      ]);
    }
  }, [isOpen, initialTableName, currentStepCount, tables]);

  if (!isOpen) return null;

  const handleAddCommandRow = () => {
    setCommands(prev => [
      ...prev,
      {
        id: 'cmd_' + Math.random().toString(36).slice(2, 9),
        type: 'ADD_COLUMN',
        tableName: tables[0]?.name || 'users',
        columnName: 'new_attribute',
        columnType: 'VARCHAR(255)',
        description: 'Nueva alteración de esquema',
      },
    ]);
  };

  const handleUpdateCommand = (id: string, updates: Partial<MigrationCommand>) => {
    setCommands(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleRemoveCommand = (id: string) => {
    if (commands.length <= 1) return;
    setCommands(prev => prev.filter(c => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newStep: Omit<SchemaStep, 'schemaSnapshot'> = {
      id: 'step_' + Date.now().toString(36),
      stepNumber: currentStepCount,
      version: version.trim() || `Paso ${currentStepCount}`,
      title: title.trim(),
      description: description.trim() || undefined,
      createdAt: new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      commands,
    };

    onSaveStep(newStep);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Nuevo Paso en la Línea de Tiempo</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                  Paso {currentStepCount}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registra modificaciones posteriores (ALTER TABLE, nuevas columnas, restricciones) cronológicamente.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Step Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Título del Paso o Modificación *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej: Añadir verificación en dos pasos y auditoría"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Versión / Etiqueta
              </label>
              <input
                type="text"
                value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder="v1.1"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descripción o Motivo del Cambio (Opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ej: Requerimiento de seguridad para cumplir con normativa GDPR."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Commands List Header */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-500" />
                  Operaciones SQL de este Paso (ALTER TABLE, CONSTRAINTS...)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Configura los comandos que se aplicarán al esquema en este punto del tiempo.
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddCommandRow}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg border border-amber-300 dark:border-amber-800 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Añadir Operación</span>
              </button>
            </div>

            {/* List of Command Cards */}
            <div className="space-y-3 mt-3">
              {commands.map((cmd, idx) => (
                <div
                  key={cmd.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold font-mono text-slate-400">
                      Operación #{idx + 1}
                    </span>

                    <button
                      type="button"
                      disabled={commands.length <= 1}
                      onClick={() => handleRemoveCommand(cmd.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Action Type */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Tipo de Alteración
                      </label>
                      <select
                        value={cmd.type}
                        onChange={e => handleUpdateCommand(cmd.id, { type: e.target.value as MigrationActionType })}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
                      >
                        <option value="ADD_COLUMN">ALTER TABLE ... ADD COLUMN</option>
                        <option value="ADD_CONSTRAINT">ALTER TABLE ... ADD CONSTRAINT (CHECK/UNIQUE)</option>
                        <option value="CREATE_INDEX">CREATE INDEX ... ON</option>
                        <option value="MODIFY_COLUMN">ALTER COLUMN / MODIFY TYPE</option>
                        <option value="DROP_COLUMN">ALTER TABLE ... DROP COLUMN</option>
                        <option value="CUSTOM_SQL">Comando SQL Personalizado</option>
                      </select>
                    </div>

                    {/* Target Table */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Tabla Afectada
                      </label>
                      <select
                        value={cmd.tableName}
                        onChange={e => handleUpdateCommand(cmd.id, { tableName: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none font-mono"
                      >
                        {tables.map(t => (
                          <option key={t.id} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dynamic inputs according to command type */}
                  {cmd.type === 'ADD_COLUMN' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Nombre Columna</label>
                        <input
                          type="text"
                          value={cmd.columnName || ''}
                          onChange={e => handleUpdateCommand(cmd.id, { columnName: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                          placeholder="nombre_columna"
                          className="w-full text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Tipo SQL y Opciones</label>
                        <input
                          type="text"
                          value={cmd.columnType || ''}
                          onChange={e => handleUpdateCommand(cmd.id, { columnType: e.target.value })}
                          placeholder="VARCHAR(100) NOT NULL DEFAULT 'draft'"
                          className="w-full text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {cmd.type === 'ADD_CONSTRAINT' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Nombre del Constraint</label>
                          <input
                            type="text"
                            value={cmd.constraintName || ''}
                            onChange={e => handleUpdateCommand(cmd.id, { constraintName: e.target.value })}
                            placeholder={`fk_${cmd.tableName}_ref`}
                            className="w-full text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Definición de Restricción</label>
                          <input
                            type="text"
                            value={cmd.constraintDefinition || ''}
                            onChange={e => handleUpdateCommand(cmd.id, { constraintDefinition: e.target.value })}
                            placeholder="FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"
                            className="w-full text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        </div>
                      </div>

                      {/* Plantillas rápidas para restricciones y ON DELETE */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">Plantillas:</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateCommand(cmd.id, {
                              constraintName: `fk_${cmd.tableName}_parent`,
                              constraintDefinition: `FOREIGN KEY (parent_id) REFERENCES ${tables[0]?.name || 'items'}(id) ON DELETE CASCADE`
                            });
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 font-mono"
                        >
                          FK ON DELETE CASCADE
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateCommand(cmd.id, {
                              constraintName: `fk_${cmd.tableName}_parent`,
                              constraintDefinition: `FOREIGN KEY (parent_id) REFERENCES ${tables[0]?.name || 'items'}(id) ON DELETE SET NULL`
                            });
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 font-mono"
                        >
                          FK ON DELETE SET NULL
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateCommand(cmd.id, {
                              constraintName: `fk_${cmd.tableName}_parent`,
                              constraintDefinition: `FOREIGN KEY (parent_id) REFERENCES ${tables[0]?.name || 'items'}(id) ON DELETE RESTRICT`
                            });
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 font-mono"
                        >
                          FK ON DELETE RESTRICT
                        </button>
                      </div>
                    </div>
                  )}

                  {cmd.type === 'CREATE_INDEX' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Nombre de Índice</label>
                        <input
                          type="text"
                          value={cmd.constraintName || ''}
                          onChange={e => handleUpdateCommand(cmd.id, { constraintName: e.target.value })}
                          placeholder={`idx_${cmd.tableName}_col`}
                          className="w-full text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Columna Indexada</label>
                        <input
                          type="text"
                          value={cmd.columnName || ''}
                          onChange={e => handleUpdateCommand(cmd.id, { columnName: e.target.value })}
                          placeholder="created_at"
                          className="w-full text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {cmd.type === 'CUSTOM_SQL' && (
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Sentencia SQL a ejecutar</label>
                      <input
                        type="text"
                        value={cmd.sqlRaw || ''}
                        onChange={e => handleUpdateCommand(cmd.id, { sqlRaw: e.target.value })}
                        placeholder="ALTER TABLE ... ;"
                        className="w-full text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                  )}

                  {/* Live SQL Preview Box */}
                  <div className="pt-1.5 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                    <span className="truncate">{generateCommandSql(cmd, 'postgres')}</span>
                    <span className="text-[10px] text-amber-500 ml-2 shrink-0">SQL</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!title.trim()}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 hover:bg-slate-800 disabled:opacity-50 rounded-lg shadow-sm transition-all"
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Guardar Paso en Línea de Tiempo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
