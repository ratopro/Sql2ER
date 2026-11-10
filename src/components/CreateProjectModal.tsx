import React, { useState } from 'react';
import { 
  X, 
  FolderPlus, 
  FileText, 
  LayoutTemplate, 
  Database, 
  Check, 
  Sparkles, 
  ShoppingCart, 
  Briefcase, 
  Activity, 
  SquarePlus,
  ArrowRight,
  Info
} from 'lucide-react';
import { TableThemeColor, DatabaseItem } from '../types/erd';
import { TEMPLATES } from '../data/templates';

export interface CreateProjectFormData {
  title: string;
  description: string;
  author: string;
  mode: 'blank' | 'template';
  initialDatabaseName: string;
  initialDatabaseColor: TableThemeColor;
  initialDatabaseDescription?: string;
  selectedTemplateId?: string;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (data: CreateProjectFormData) => void;
  initialMode?: 'blank' | 'template';
}

const COLOR_PALETTE: { id: TableThemeColor; name: string; bg: string; border: string; preview: string }[] = [
  { id: 'indigo', name: 'Índigo', bg: 'bg-indigo-600', border: 'border-indigo-400', preview: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' },
  { id: 'purple', name: 'Púrpura', bg: 'bg-purple-600', border: 'border-purple-400', preview: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' },
  { id: 'emerald', name: 'Esmeralda', bg: 'bg-emerald-600', border: 'border-emerald-400', preview: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' },
  { id: 'amber', name: 'Ámbar', bg: 'bg-amber-500', border: 'border-amber-400', preview: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' },
  { id: 'rose', name: 'Rosa', bg: 'bg-rose-600', border: 'border-rose-400', preview: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300' },
  { id: 'cyan', name: 'Cian', bg: 'bg-cyan-600', border: 'border-cyan-400', preview: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300' },
  { id: 'slate', name: 'Pizarra', bg: 'bg-slate-700', border: 'border-slate-500', preview: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  { id: 'teal', name: 'Turquesa', bg: 'bg-teal-600', border: 'border-teal-400', preview: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300' },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  initialMode = 'blank',
}) => {
  // Mode selection defaults to blank project as requested by user
  const [mode, setMode] = useState<'blank' | 'template'>(initialMode);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);
  
  // Project info
  const [title, setTitle] = useState('Mi Nuevo Proyecto ER');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  
  // Initial database configuration for blank project
  const [dbName, setDbName] = useState('principal_db');
  const [dbColor, setDbColor] = useState<TableThemeColor>('indigo');
  const [dbDescription, setDbDescription] = useState('Base de datos principal del proyecto');

  // Template selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('ecommerce');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateProject({
      title: title.trim(),
      description: description.trim(),
      author: author.trim(),
      mode,
      initialDatabaseName: dbName.trim().toLowerCase().replace(/\s+/g, '_') || 'principal_db',
      initialDatabaseColor: dbColor,
      initialDatabaseDescription: dbDescription.trim(),
      selectedTemplateId: mode === 'template' ? selectedTemplateId : undefined,
    });
  };

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingCart':
        return <ShoppingCart className="w-5 h-5 text-emerald-500" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-indigo-500" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-purple-500" />;
      default:
        return <SquarePlus className="w-5 h-5 text-amber-500" />;
    }
  };

  const currentTemplates = TEMPLATES.filter(t => t.id !== 'blank');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Crear Nuevo Proyecto</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                  MiroER
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configura la información del proyecto y selecciona cómo deseas comenzar.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Project Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              1. Información del Proyecto
            </h3>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Proyecto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej: ERP Logística y Ventas"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Autor / Equipo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    placeholder="Ej: Equipo Backend / Juan Pérez"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción (Opcional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ej: Modelo relacional para catálogo, almacén y pagos"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Mode Selector (Blank project selected by default vs Template) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              2. Modo de Inicio
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Blank Project (Default) */}
              <button
                type="button"
                onClick={() => setMode('blank')}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  mode === 'blank'
                    ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/20 ring-2 ring-amber-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold">
                      Predeterminado
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Proyecto en Blanco
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Comienza desde cero con tu primera base de datos lista para agregar tablas.
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <Check className={`w-3.5 h-3.5 ${mode === 'blank' ? 'opacity-100' : 'opacity-0'}`} />
                  <span>{mode === 'blank' ? 'Seleccionado' : 'Elegir en blanco'}</span>
                </div>
              </button>

              {/* Option 2: Use Template */}
              <button
                type="button"
                onClick={() => setMode('template')}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  mode === 'template'
                    ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/20 ring-2 ring-amber-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <LayoutTemplate className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-medium">
                      Plantillas
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Empezar con una Plantilla
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Esquemas completos prediseñados: E-Commerce, SaaS Multi-Tenant o Citas Clínicas.
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  <Check className={`w-3.5 h-3.5 ${mode === 'template' ? 'opacity-100' : 'opacity-0'}`} />
                  <span>{mode === 'template' ? 'Seleccionado' : 'Explorar plantillas'}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3A: If Blank Project -> Initial Database Configuration */}
          {mode === 'blank' && (
            <div className="space-y-3 bg-amber-50/40 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-200/60 dark:border-amber-800/40 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  3. Configuración de la Primera Base de Datos
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                Antes de añadir tablas se crea una base de datos. Todas las tablas que crees inicialmente estarán asociadas a ella.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de la Base de Datos <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={dbName}
                    onChange={e => setDbName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="principal_db"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Formato sugerido: snake_case (ej: tienda_db, usuarios_db)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Color Distintivo
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {COLOR_PALETTE.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setDbColor(c.id)}
                        title={c.name}
                        className={`h-7 rounded-lg ${c.bg} flex items-center justify-center transition-transform hover:scale-105 ${
                          dbColor === c.id ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-105' : 'opacity-85'
                        }`}
                      >
                        {dbColor === c.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción de la Base de Datos (Opcional)
                </label>
                <input
                  type="text"
                  value={dbDescription}
                  onChange={e => setDbDescription(e.target.value)}
                  placeholder="Base de datos principal para las tablas del sistema"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-start gap-2 pt-1 text-[11px] text-amber-700 dark:text-amber-400">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Podrás añadir más bases de datos y cambiar tablas de base de datos en cualquier momento desde el menú superior.
                </span>
              </div>
            </div>
          )}

          {/* Section 3B: If Template Project -> Template Picker */}
          {mode === 'template' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <LayoutTemplate className="w-3.5 h-3.5 text-indigo-500" />
                <span>3. Selecciona una Plantilla para Inicializar</span>
              </h3>

              <div className="grid grid-cols-1 gap-2.5">
                {currentTemplates.map(tpl => {
                  const isSelected = selectedTemplateId === tpl.id;
                  const tableCount = tpl.schema.tables.length;
                  const relCount = tpl.schema.relationships.length;

                  return (
                    <div
                      key={tpl.id}
                      onClick={() => {
                        setSelectedTemplateId(tpl.id);
                        if (!title || title === 'Mi Nuevo Proyecto ER') {
                          setTitle(tpl.name);
                        }
                        if (!description) {
                          setDescription(tpl.description);
                        }
                      }}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                        {getTemplateIcon(tpl.icon)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {tpl.name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                            {tableCount} tablas · {relCount} relaciones
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                          {tpl.description}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {tpl.schema.tables.slice(0, 5).map(tbl => (
                            <span
                              key={tbl.id}
                              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              {tbl.name}
                            </span>
                          ))}
                          {tpl.schema.tables.length > 5 && (
                            <span className="text-[9px] text-slate-400 font-mono self-center">
                              +{tpl.schema.tables.length - 5} más
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 self-center">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 hover:bg-slate-800 rounded-xl shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{mode === 'blank' ? 'Crear Proyecto en Blanco' : 'Crear Proyecto con Plantilla'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
