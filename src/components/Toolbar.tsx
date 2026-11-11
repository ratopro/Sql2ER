import React from 'react';
import { 
  MousePointer, 
  Hand, 
  Table2, 
  Network, 
  StickyNote as StickyIcon, 
  SquareDashed, 
  FileCode,
  LayoutTemplate,
  Clock,
  Database
} from 'lucide-react';
import { CanvasTool } from '../types/erd';

interface ToolbarProps {
  activeTool: CanvasTool;
  onSelectTool: (tool: CanvasTool) => void;
  onOpenSqlImport: () => void;
  onOpenTemplates: () => void;
  onOpenCreateDatabase: () => void;
  isTimelineOpen: boolean;
  onToggleTimeline: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  onOpenSqlImport,
  onOpenTemplates,
  onOpenCreateDatabase,
  isTimelineOpen,
  onToggleTimeline,
}) => {
  const tools: { id: CanvasTool; label: string; shortcut: string; icon: React.ReactNode }[] = [
    { id: 'select', label: 'Seleccionar', shortcut: 'V', icon: <MousePointer className="w-4 h-4" /> },
    { id: 'pan', label: 'Mover lienzo (Mano)', shortcut: 'Espacio / H', icon: <Hand className="w-4 h-4" /> },
    { id: 'table', label: 'Nueva Tabla / Entidad', shortcut: 'T', icon: <Table2 className="w-4 h-4" /> },
    { id: 'connector', label: 'Conector de Relación', shortcut: 'C', icon: <Network className="w-4 h-4" /> },
    { id: 'sticky', label: 'Nota Adhesiva', shortcut: 'N', icon: <StickyIcon className="w-4 h-4" /> },
    { id: 'frame', label: 'Marco de Módulo', shortcut: 'F', icon: <SquareDashed className="w-4 h-4" /> },
  ];

  return (
    <div className="absolute left-4 top-20 z-20 flex flex-col items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-lg select-none gap-1">
      {tools.map(tool => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
            className={`relative p-2.5 rounded-lg transition-all flex items-center justify-center group ${
              isActive 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tool.icon}

            {/* Miro-style Tooltip */}
            <span className="absolute left-full ml-3 px-2 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-slate-800 rounded-md shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {tool.label} <span className="opacity-60 text-[10px] ml-1">({tool.shortcut})</span>
            </span>
          </button>
        );
      })}

      <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-1" />

      {/* Database Management button */}
      <button
        onClick={onOpenCreateDatabase}
        title="Crear Nueva Base de Datos"
        className="relative p-2.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors group"
      >
        <Database className="w-4 h-4" />
        <span className="absolute left-full ml-3 px-2 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-slate-800 rounded-md shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          Nueva Base de Datos
        </span>
      </button>

      {/* SQL Import quick button */}
      <button
        onClick={onOpenSqlImport}
        title="Crear Diagrama desde Código SQL"
        className="relative p-2.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors group"
      >
        <FileCode className="w-4 h-4" />
        <span className="absolute left-full ml-3 px-2 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-slate-800 rounded-md shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          Importar SQL
        </span>
      </button>

      {/* Timeline quick button */}
      <button
        onClick={onToggleTimeline}
        title="Línea de Tiempo y Pasos de Migración"
        className={`relative p-2.5 rounded-lg transition-colors group ${
          isTimelineOpen
            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <Clock className="w-4 h-4" />
        <span className="absolute left-full ml-3 px-2 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-slate-800 rounded-md shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          Línea de Tiempo
        </span>
      </button>

      {/* Templates quick button */}
      <button
        onClick={onOpenTemplates}
        title="Galería de Plantillas"
        className="relative p-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors group"
      >
        <LayoutTemplate className="w-4 h-4" />
        <span className="absolute left-full ml-3 px-2 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-slate-800 rounded-md shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          Plantillas ER
        </span>
      </button>
    </div>
  );
};
