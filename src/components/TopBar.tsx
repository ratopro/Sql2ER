import React, { useState, useRef, useEffect } from 'react';
import { 
  Database, 
  Undo2, 
  Redo2, 
  FileCode, 
  Share2, 
  Check, 
  Clock, 
  Moon, 
  Sun, 
  Plus, 
  Save, 
  ChevronDown, 
  PlusCircle, 
  FolderPlus,
  AlertCircle,
  Type,
  Minus,
  RotateCcw,
  Play,
  Layers
} from 'lucide-react';
import { DatabaseItem } from '../types/erd';

interface TopBarProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenExport: () => void;
  onOpenSqlImport: () => void;
  onOpenTemplates?: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  tablesCount: number;
  relationsCount: number;
  isTimelineOpen: boolean;
  onToggleTimeline: () => void;
  stepsCount: number;
  onNewProject: () => void;
  hasUnsavedChanges: boolean;
  onSaveProject: () => void;
  saveSuccess: boolean;
  databases: DatabaseItem[];
  activeDatabaseId?: string;
  onSelectDatabase: (id: string) => void;
  onOpenCreateDatabase: () => void;
  fontSizePercent: number;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onResetFontSize: () => void;
  onSetFontSize: (pct: number) => void;
  activeTab?: 'erd' | 'simulator';
  onTabChange?: (tab: 'erd' | 'simulator') => void;
  onRunSimulation?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  onTitleChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenExport,
  onOpenSqlImport,
  onOpenTemplates,
  isDark,
  onToggleTheme,
  tablesCount,
  relationsCount,
  isTimelineOpen,
  onToggleTimeline,
  stepsCount,
  onNewProject,
  hasUnsavedChanges,
  onSaveProject,
  saveSuccess,
  databases,
  activeDatabaseId,
  onSelectDatabase,
  onOpenCreateDatabase,
  fontSizePercent,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onResetFontSize,
  onSetFontSize,
  activeTab = 'erd',
  onTabChange,
  onRunSimulation,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDbDropdown, setShowDbDropdown] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  
  const dbDropdownRef = useRef<HTMLDivElement>(null);
  const fontSizeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dbDropdownRef.current && !dbDropdownRef.current.contains(e.target as Node)) {
        setShowDbDropdown(false);
      }
      if (fontSizeMenuRef.current && !fontSizeMenuRef.current.contains(e.target as Node)) {
        setShowFontSizeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const activeDb = databases.find(d => d.id === activeDatabaseId) || databases[0];

  return (
    <header className="absolute top-0 left-0 right-0 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-30 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 select-none">
      {/* Zone 1: Brand, Board Title & Project Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2 pr-2.5 sm:pr-3 border-r border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-sm font-black text-base tracking-tight">
            R
          </div>
          <span className="font-bold tracking-tight text-slate-900 dark:text-slate-100 text-base hidden sm:inline">
            Relatia<span className="text-amber-500">.</span>
          </span>
        </div>

        {/* Board Title */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              autoFocus
              onChange={e => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={e => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTempTitle(title);
                  setIsEditingTitle(false);
                }
              }}
              className="text-xs sm:text-sm font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-amber-500 outline-none w-36 sm:w-48"
            />
          ) : (
            <button
              onClick={() => {
                setTempTitle(title);
                setIsEditingTitle(true);
              }}
              title="Haz clic para renombrar el proyecto"
              className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded transition-colors text-left max-w-[120px] sm:max-w-xs truncate"
            >
              {title}
            </button>
          )}

          {/* Create Project Button */}
          <button
            onClick={onNewProject}
            title="Crear un nuevo proyecto ER (en blanco o con plantilla)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Crear Proyecto</span>
          </button>

          {/* Save Button & Dirty Indicator */}
          <button
            onClick={onSaveProject}
            title={hasUnsavedChanges ? "Guardar cambios en el proyecto" : "Proyecto guardado"}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
              saveSuccess
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                : hasUnsavedChanges
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Guardado</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guardar</span>
                {hasUnsavedChanges && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Cambios sin guardar" />
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Zone 2: Databases Switcher & Navigation Tools */}
      <nav className="flex items-center gap-1.5 sm:gap-2">
        {/* Navigation Tabs: Diagrama ERD vs Simulación SQL */}
        {onTabChange && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onTabChange('erd')}
              title="Ver el diagrama y lienzo visual ERD"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                activeTab === 'erd'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Diagrama ERD</span>
            </button>
            <button
              onClick={() => {
                if (activeTab !== 'simulator' && onRunSimulation) {
                  onRunSimulation();
                } else {
                  onTabChange('simulator');
                }
              }}
              title="Abrir la pestaña de simulación SQL y explorador de tablas (F5)"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                activeTab === 'simulator'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
              <span className="hidden sm:inline">Simulación SQL</span>
            </button>
          </div>
        )}

        {/* Database Selector Dropdown */}
        <div className="relative" ref={dbDropdownRef}>
          {databases.length > 0 ? (
            <button
              onClick={() => setShowDbDropdown(!showDbDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
              title="Base de datos activa actual"
            >
              <Database className="w-3.5 h-3.5 text-amber-500" />
              <span className="max-w-[90px] sm:max-w-[130px] truncate font-mono text-[11px]">
                {activeDb?.name || 'Base de datos'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          ) : (
            <button
              onClick={onOpenCreateDatabase}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm transition-all animate-pulse"
              title="Crea una base de datos antes de añadir tablas"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Crear Base de Datos</span>
            </button>
          )}

          {showDbDropdown && (
            <div data-dropdown="true" className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Bases de Datos ({databases.length})
                </span>
                <button
                  onClick={() => {
                    setShowDbDropdown(false);
                    onOpenCreateDatabase();
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nueva</span>
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1">
                {databases.map(db => {
                  const isActive = db.id === (activeDb?.id);
                  return (
                    <button
                      key={db.id}
                      onClick={() => {
                        onSelectDatabase(db.id);
                        setShowDbDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left font-mono text-xs transition-colors ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{db.name}</span>
                      {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowDbDropdown(false);
                    onOpenCreateDatabase();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-dashed border-amber-300 dark:border-amber-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear otra Base de Datos</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create Database direct button in menu */}
        {databases.length > 0 && (
          <button
            onClick={onOpenCreateDatabase}
            title="Crear una nueva base de datos adicional"
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Plus className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Base de Datos</span>
          </button>
        )}

        {/* Timeline toggle button */}
        <button
          onClick={onToggleTimeline}
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors border ${
            isTimelineOpen
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>Línea de Tiempo ({stepsCount})</span>
        </button>

        {/* Import SQL button */}
        <button
          onClick={onOpenSqlImport}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-md transition-colors border border-amber-300 dark:border-amber-800/60 shadow-xs"
        >
          <FileCode className="w-3.5 h-3.5 text-amber-500" />
          <span>Importar SQL</span>
        </button>
      </nav>

      {/* Zone 3: Actions & Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Deshacer (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Rehacer (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Size Scale Dropdown (Ctrl + / Ctrl -) */}
        <div className="relative" ref={fontSizeMenuRef}>
          <button
            onClick={() => setShowFontSizeMenu(!showFontSizeMenu)}
            title="Tamaño de texto de la aplicación (Ctrl + / Ctrl -)"
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              fontSizePercent !== 100
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-mono text-[11px] tabular-nums">{fontSizePercent}%</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showFontSizeMenu && (
            <div data-dropdown="true" className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 text-slate-800 dark:text-slate-200">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold block">Tamaño de Texto</span>
                  <span className="text-[10px] text-slate-400">Escala global de fuentes</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40">
                  {fontSizePercent}%
                </span>
              </div>

              {/* Stepper */}
              <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg mb-2.5">
                <button
                  onClick={onDecreaseFontSize}
                  disabled={fontSizePercent <= 70}
                  title="Reducir texto (Ctrl -)"
                  className="p-1 rounded-md hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors flex items-center justify-center w-7 h-7"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="text-center">
                  <span className="text-xs font-mono font-bold">{fontSizePercent}%</span>
                  <span className="block text-[9px] text-slate-400">
                    {fontSizePercent === 100 ? 'Predeterminado' : fontSizePercent > 100 ? 'Ampliado' : 'Reducido'}
                  </span>
                </div>

                <button
                  onClick={onIncreaseFontSize}
                  disabled={fontSizePercent >= 160}
                  title="Aumentar texto (Ctrl +)"
                  className="p-1 rounded-md hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors flex items-center justify-center w-7 h-7"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-4 gap-1 mb-2.5">
                {[80, 90, 100, 110, 120, 130, 140, 150].map(pct => (
                  <button
                    key={pct}
                    onClick={() => onSetFontSize(pct)}
                    className={`py-1 text-[11px] font-mono rounded transition-colors ${
                      fontSizePercent === pct
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              {/* Reset button if not 100% */}
              {fontSizePercent !== 100 && (
                <button
                  onClick={onResetFontSize}
                  className="w-full flex items-center justify-center gap-1.5 py-1 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-md transition-colors font-medium mb-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restablecer al 100% (Ctrl + 0)</span>
                </button>
              )}

              {/* Keyboard Shortcuts Hint */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Aumentar texto:</span>
                  <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">Ctrl + +</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Reducir texto:</span>
                  <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">Ctrl + -</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Restablecer:</span>
                  <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">Ctrl + 0</kbd>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dark/Light mode toggle */}
        <button
          onClick={onToggleTheme}
          title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Share / Copy link */}
        <button
          onClick={handleShare}
          title="Copiar enlace del proyecto"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'Copiado' : 'Compartir'}</span>
        </button>

        {/* Run Simulation CTA Button */}
        {onRunSimulation && (
          <button
            onClick={onRunSimulation}
            title="Ejecutar simulación de base de datos en memoria y abrir consola SQL (F5)"
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Simular BD</span>
            <kbd className="text-[10px] font-mono bg-emerald-700/60 px-1 py-0.2 rounded font-bold">
              F5
            </kbd>
          </button>
        )}

        {/* Export SQL Primary CTA */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 hover:bg-slate-800 rounded-lg shadow-sm transition-all"
        >
          <FileCode className="w-4 h-4" />
          <span>Exportar SQL</span>
        </button>
      </div>
    </header>
  );
};
