import React, { useState, useRef, useEffect } from 'react';
import { FrameNode, FrameBorderStyle } from '../types/erd';
import { Trash2, Palette, Check, Ban } from 'lucide-react';
import { ResizeHandles, ResizeHandle } from './ResizeHandles';

interface FrameCardProps {
  frame: FrameNode;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updated: FrameNode) => void;
  onDelete: (id: string) => void;
  onStartResize?: (handle: ResizeHandle, e: React.MouseEvent) => void;
  isOpenStyleMenu?: boolean;
  onToggleStyleMenu?: (open: boolean) => void;
}

const BORDER_COLORS = [
  { label: 'Pizarra', value: '#94a3b8' },
  { label: 'Ámbar', value: '#f59e0b' },
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Índigo', value: '#6366f1' },
  { label: 'Púrpura', value: '#a855f7' },
  { label: 'Esmeralda', value: '#10b981' },
  { label: 'Rosa', value: '#f43f5e' },
  { label: 'Cian', value: '#06b6d4' },
  { label: 'Oscuro', value: '#334155' },
];

const BG_COLORS = [
  { label: 'Transparente', value: 'transparent' },
  { label: 'Pizarra', value: 'rgba(100, 116, 139, 0.08)' },
  { label: 'Ámbar', value: 'rgba(245, 158, 11, 0.08)' },
  { label: 'Azul', value: 'rgba(59, 130, 246, 0.08)' },
  { label: 'Índigo', value: 'rgba(99, 102, 241, 0.08)' },
  { label: 'Púrpura', value: 'rgba(168, 85, 247, 0.08)' },
  { label: 'Esmeralda', value: 'rgba(16, 185, 129, 0.08)' },
  { label: 'Rosa', value: 'rgba(244, 63, 94, 0.08)' },
  { label: 'Cian', value: 'rgba(6, 182, 212, 0.08)' },
];

const BORDER_WIDTHS = [1, 2, 3, 4, 6];

const BORDER_STYLES: { id: FrameBorderStyle; label: string; preview: string }[] = [
  { id: 'solid', label: 'Liso', preview: 'border-solid' },
  { id: 'dashed', label: 'Guiones', preview: 'border-dashed' },
  { id: 'dotted', label: 'Puntos', preview: 'border-dotted' },
];

export const FrameCard: React.FC<FrameCardProps> = ({
  frame,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onStartResize,
  isOpenStyleMenu,
  onToggleStyleMenu,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(frame.title);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isMenuOpen = isOpenStyleMenu !== undefined ? isOpenStyleMenu : showStyleMenu;
  const toggleStyleMenu = () => {
    if (onToggleStyleMenu) {
      onToggleStyleMenu(!isMenuOpen);
    } else {
      setShowStyleMenu(!showStyleMenu);
    }
  };

  useEffect(() => {
    setTitleInput(frame.title);
  }, [frame.title]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onUpdate({ ...frame, title: titleInput.trim() });
    } else {
      setTitleInput(frame.title);
    }
  };

  // Map legacy template color names to hex if borderColor/bgColor is not explicitly set
  const COLOR_NAME_TO_HEX: Record<string, { border: string; bg: string }> = {
    emerald: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
    indigo: { border: '#6366f1', bg: 'rgba(99, 102, 241, 0.08)' },
    purple: { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.08)' },
    amber: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
    blue: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
    rose: { border: '#f43f5e', bg: 'rgba(244, 63, 94, 0.08)' },
    cyan: { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.08)' },
    slate: { border: '#94a3b8', bg: 'rgba(100, 116, 139, 0.08)' },
  };

  const themeFallback = frame.color ? COLOR_NAME_TO_HEX[frame.color] : undefined;
  const currentBorderColor = frame.borderColor || themeFallback?.border || '#94a3b8';
  const currentBgColor = frame.bgColor ?? themeFallback?.bg ?? 'rgba(148, 163, 184, 0.06)';
  const currentBorderWidth = frame.borderWidth ?? 2;
  const currentBorderStyle = frame.borderStyle || 'dashed';

  return (
    <div
      onClick={onSelect}
      style={{
        transform: `translate3d(${frame.x}px, ${frame.y}px, 0)`,
        width: frame.width,
        height: frame.height,
        borderColor: currentBorderColor,
        borderWidth: `${currentBorderWidth}px`,
        borderStyle: currentBorderStyle,
        backgroundColor: currentBgColor,
      }}
      className={`absolute left-0 top-0 rounded-2xl pointer-events-auto select-none transition-all group/frame group/resizable ${
        isMenuOpen
          ? 'ring-2 ring-amber-500/80 shadow-lg z-[100]'
          : isSelected
          ? 'ring-2 ring-amber-500/80 shadow-lg z-0'
          : 'hover:shadow-sm z-0'
      }`}
    >
      {/* 8 resize handle points on border */}
      {onStartResize && (
        <ResizeHandles
          isSelected={isSelected}
          onStartResize={onStartResize}
        />
      )}

      {/* Title & Controls tab top left */}
      <div 
        ref={menuRef}
        onClick={e => e.stopPropagation()}
        className={`absolute -top-8 left-2 flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-lg px-2.5 py-1 shadow-md text-xs ${
          isMenuOpen ? 'z-[100] ring-1 ring-amber-500' : 'z-20'
        }`}
      >
        {/* Border color indicator dot */}
        <div 
          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs border border-black/10" 
          style={{ backgroundColor: currentBorderColor }} 
        />

        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            autoFocus
            onChange={e => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={e => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') setIsEditingTitle(false);
            }}
            onClick={e => e.stopPropagation()}
            className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent outline-none w-36"
          />
        ) : (
          <span
            onDoubleClick={e => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            title="Doble clic para renombrar marco"
            className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide cursor-text max-w-[150px] truncate"
          >
            {frame.title}
          </span>
        )}

        {/* Style / Formatting trigger button */}
        <button
          data-popup-trigger="true"
          onClick={e => {
            e.stopPropagation();
            onSelect(e);
            toggleStyleMenu();
          }}
          title="Personalizar estilo del marco (fondo, borde, grosor, tipo de línea)"
          className={`p-1 rounded transition-colors ${
            isMenuOpen
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
        </button>

        {/* Style Customization Popover Menu */}
        {isMenuOpen && (
          <div
            data-popup="true"
            data-dropdown="true"
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            className="absolute left-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-[150] text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100 space-y-3"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Estilo del Marco
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {frame.title}
              </span>
            </div>

            {/* 1. Tipo de línea de marco */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                Tipo de línea:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {BORDER_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => onUpdate({ ...frame, borderStyle: style.id })}
                    className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                      currentBorderStyle === style.id
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span 
                      className={`w-full h-0 border-t-2 ${style.preview} border-current opacity-80`} 
                    />
                    <span className="text-[10px]">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Ancho de línea de marco */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Grosor de línea:
                </label>
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                  {currentBorderWidth}px
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {BORDER_WIDTHS.map(width => (
                  <button
                    key={width}
                    onClick={() => onUpdate({ ...frame, borderWidth: width })}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                      currentBorderWidth === width
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span 
                      className="w-4 bg-current rounded-full"
                      style={{ height: Math.max(width, 1) }}
                    />
                    <span className="text-[10px]">{width}px</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Color de marco (Borde) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Color del marco:
                </label>
                <input
                  type="color"
                  value={currentBorderColor.startsWith('#') ? currentBorderColor : '#94a3b8'}
                  onChange={e => onUpdate({ ...frame, borderColor: e.target.value })}
                  title="Color de borde personalizado"
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {BORDER_COLORS.map(c => {
                  const isActive = currentBorderColor === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={() => onUpdate({ ...frame, borderColor: c.value })}
                      title={c.label}
                      style={{ backgroundColor: c.value }}
                      className={`h-6 rounded-md border border-black/10 flex items-center justify-center transition-transform hover:scale-110 shadow-2xs ${
                        isActive ? 'ring-2 ring-amber-500 ring-offset-1 dark:ring-offset-slate-900 scale-105' : ''
                      }`}
                    >
                      {isActive && <Check className="w-3.5 h-3.5 text-white drop-shadow stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Color de fondo (Relleno) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Color de fondo:
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onUpdate({ ...frame, bgColor: 'transparent' })}
                    title="Sin color de fondo (Transparente)"
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 transition-colors ${
                      currentBgColor === 'transparent'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Ban className="w-2.5 h-2.5" />
                    <span>Transparente</span>
                  </button>
                  <input
                    type="color"
                    value={currentBgColor.startsWith('#') ? currentBgColor : '#f1f5f9'}
                    onChange={e => onUpdate({ ...frame, bgColor: e.target.value + '22' })}
                    title="Color de fondo personalizado"
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {BG_COLORS.map(c => {
                  const isActive = currentBgColor === c.value;
                  const isTrans = c.value === 'transparent';
                  return (
                    <button
                      key={c.value}
                      onClick={() => onUpdate({ ...frame, bgColor: c.value })}
                      title={c.label}
                      style={{ backgroundColor: isTrans ? 'transparent' : c.value }}
                      className={`h-6 rounded-md border border-slate-300 dark:border-slate-700 flex items-center justify-center transition-transform hover:scale-110 shadow-2xs relative overflow-hidden ${
                        isActive ? 'ring-2 ring-amber-500 ring-offset-1 dark:ring-offset-slate-900 scale-105' : ''
                      }`}
                    >
                      {isTrans ? (
                        <Ban className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        isActive && <Check className="w-3.5 h-3.5 text-slate-800 dark:text-slate-100 stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {isSelected && (
          <span 
            title="Mantén presionada la tecla Ctrl al arrastrar el marco para mover también las tablas y notas de su interior"
            className="text-[9px] text-amber-700 dark:text-amber-300 font-medium px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 hidden sm:inline-block"
          >
            Ctrl + arrastrar: mover contenidos
          </span>
        )}

        <button
          onClick={e => {
            e.stopPropagation();
            onDelete(frame.id);
          }}
          title="Eliminar marco"
          className="p-0.5 text-slate-400 hover:text-rose-500 rounded transition-colors opacity-0 group-hover/frame:opacity-100"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
