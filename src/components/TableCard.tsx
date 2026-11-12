import React, { useState, useRef, useEffect } from 'react';
import { 
  Key, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  Copy, 
  Palette,
  Check,
  ChevronDown,
  Clock,
  SlidersHorizontal,
  Settings2,
  Database
} from 'lucide-react';
import { TableNode, Column, TableThemeColor, OnDeleteAction, DatabaseItem } from '../types/erd';
import { TABLE_WIDTH, HEADER_HEIGHT, ROW_HEIGHT, FOOTER_HEIGHT, COL_HEADER_HEIGHT } from '../utils/canvasMath';

interface TableCardProps {
  table: TableNode;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdateTable: (updated: TableNode) => void;
  onDeleteTable: (id: string) => void;
  onDuplicateTable: (table: TableNode) => void;
  onStartConnection: (fromTableId: string, fromColumnId?: string, e?: React.MouseEvent) => void;
  onEndConnection: (toTableId: string, toColumnId?: string) => void;
  connectingSource: { fromTableId: string; fromColumnId?: string } | null;
  onAddStepForTable?: (tableName: string) => void;
  databases?: DatabaseItem[];
  fontScale?: number;
  activePopupId?: string | null;
  onSetActivePopup?: (id: string | null) => void;
}

// Clean SQL types: uuid removed, bigserial removed, jsonf/jsonb removed, varchar without size
const COMMON_SQL_TYPES = [
  'VARCHAR',
  'INT',
  'BIGINT',
  'TEXT',
  'BOOLEAN',
  'DATETIME',
  'TIMESTAMP',
  'DATE',
  'DECIMAL',
  'FLOAT',
  'TIME',
  'BLOB'
];

const THEME_COLORS: { id: TableThemeColor; name: string; bg: string; border: string; header: string }[] = [
  { id: 'indigo', name: 'Índigo', bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-300 dark:border-indigo-800', header: 'bg-indigo-600 text-white' },
  { id: 'purple', name: 'Púrpura', bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-300 dark:border-purple-800', header: 'bg-purple-600 text-white' },
  { id: 'emerald', name: 'Esmeralda', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-300 dark:border-emerald-800', header: 'bg-emerald-600 text-white' },
  { id: 'amber', name: 'Ámbar', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-300 dark:border-amber-800', header: 'bg-amber-500 text-slate-950' },
  { id: 'rose', name: 'Rosa', bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-300 dark:border-rose-800', header: 'bg-rose-600 text-white' },
  { id: 'cyan', name: 'Cian', bg: 'bg-cyan-50 dark:bg-cyan-950/20', border: 'border-cyan-300 dark:border-cyan-800', header: 'bg-cyan-600 text-white' },
  { id: 'slate', name: 'Pizarra', bg: 'bg-slate-50 dark:bg-slate-900/40', border: 'border-slate-300 dark:border-slate-700', header: 'bg-slate-700 text-white' },
  { id: 'teal', name: 'Turquesa', bg: 'bg-teal-50 dark:bg-teal-950/20', border: 'border-teal-300 dark:border-teal-800', header: 'bg-teal-600 text-white' },
];

export const TableCard: React.FC<TableCardProps> = ({
  table,
  isSelected,
  onSelect,
  onUpdateTable,
  onDeleteTable,
  onDuplicateTable,
  onStartConnection,
  onEndConnection,
  connectingSource,
  onAddStepForTable,
  databases,
  fontScale = 1,
  activePopupId,
  onSetActivePopup,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(table.name);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDbPicker, setShowDbPicker] = useState(false);
  const [activeTypeDropdownColId, setActiveTypeDropdownColId] = useState<string | null>(null);
  const [activeModifiersColId, setActiveModifiersColId] = useState<string | null>(null);
  
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const modifiersDropdownRef = useRef<HTMLDivElement>(null);

  const currentTheme = THEME_COLORS.find(c => c.id === table.color) || THEME_COLORS[0];
  const currentDb = databases?.find(d => d.id === table.databaseId) || (databases && databases.length > 0 ? databases[0] : null);

  const isColorPickerOpen = activePopupId === `table_color_${table.id}` || (!onSetActivePopup && showColorPicker);
  const isDbPickerOpen = activePopupId === `table_db_${table.id}` || (!onSetActivePopup && showDbPicker);
  const isTypeDropdownOpen = (colId: string) => activePopupId === `table_type_${table.id}_${colId}` || (!onSetActivePopup && activeTypeDropdownColId === colId);
  const isModifiersColOpen = (colId: string) => activePopupId === `table_mod_${table.id}_${colId}` || (!onSetActivePopup && activeModifiersColId === colId);

  const toggleColorPicker = () => {
    if (onSetActivePopup) {
      onSetActivePopup(isColorPickerOpen ? null : `table_color_${table.id}`);
    } else {
      setShowColorPicker(!showColorPicker);
    }
  };

  const toggleDbPicker = () => {
    if (onSetActivePopup) {
      onSetActivePopup(isDbPickerOpen ? null : `table_db_${table.id}`);
    } else {
      setShowDbPicker(!showDbPicker);
    }
  };

  const toggleTypeDropdown = (colId: string) => {
    if (onSetActivePopup) {
      onSetActivePopup(isTypeDropdownOpen(colId) ? null : `table_type_${table.id}_${colId}`);
    } else {
      setActiveModifiersColId(null);
      setActiveTypeDropdownColId(activeTypeDropdownColId === colId ? null : colId);
    }
  };

  const toggleModifiers = (colId: string) => {
    if (onSetActivePopup) {
      onSetActivePopup(isModifiersColOpen(colId) ? null : `table_mod_${table.id}_${colId}`);
    } else {
      setActiveTypeDropdownColId(null);
      setActiveModifiersColId(activeModifiersColId === colId ? null : colId);
    }
  };

  useEffect(() => {
    setTitleInput(table.name);
  }, [table.name]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && titleInput !== table.name) {
      onUpdateTable({ ...table, name: titleInput.trim().toLowerCase().replace(/\s+/g, '_') });
    } else {
      setTitleInput(table.name);
    }
  };

  const handleAddColumn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCol: Column = {
      id: 'c_' + Date.now().toString(36),
      name: 'column_' + (table.columns.length + 1),
      type: 'VARCHAR',
      length: '255',
      isPK: false,
      isFK: false,
      isNullable: true,
      isUnique: false,
      isAutoIncrement: false,
    };
    onUpdateTable({
      ...table,
      columns: [...table.columns, newCol],
    });
  };

  const handleUpdateColumn = (colId: string, updates: Partial<Column>) => {
    const newCols = table.columns.map(c => (c.id === colId ? { ...c, ...updates } : c));
    onUpdateTable({ ...table, columns: newCols });
  };

  const handleDeleteColumn = (colId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (table.columns.length <= 1) return;
    const newCols = table.columns.filter(c => c.id !== colId);
    onUpdateTable({ ...table, columns: newCols });
  };

  const handleColorSelect = (color: TableThemeColor, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateTable({ ...table, color });
    setShowColorPicker(false);
  };

  const isConnectingFromHere = connectingSource?.fromTableId === table.id;

  return (
    <div
      onClick={onSelect}
      style={{
        transform: `translate3d(${table.x}px, ${table.y}px, 0)`,
        width: Math.round((table.width || TABLE_WIDTH) * fontScale),
      }}
      className={`absolute left-0 top-0 bg-white dark:bg-slate-900 rounded-xl shadow-md transition-shadow select-none group border ${
        isSelected
          ? 'ring-2 ring-amber-500 shadow-xl border-amber-500 z-10'
          : 'border-slate-200 dark:border-slate-800 hover:shadow-lg'
      }`}
    >
      {/* Table Header */}
      <div
        style={{ minHeight: Math.round(HEADER_HEIGHT * fontScale) }}
        className={`px-3 py-2 rounded-t-xl flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing ${currentTheme.header}`}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-white/40 shrink-0" />
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              autoFocus
              onChange={e => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={e => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTitleInput(table.name);
                  setIsEditingTitle(false);
                }
              }}
              onClick={e => e.stopPropagation()}
              className="text-xs font-bold px-1.5 py-0.5 rounded bg-black/20 text-white outline-none w-full"
            />
          ) : (
            <span
              onDoubleClick={e => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              title="Doble clic para renombrar"
              className="text-xs font-bold truncate tracking-wide cursor-text"
            >
              {table.name}
            </span>
          )}

          {/* Database Badge */}
          {currentDb && (
            <span
              title={`Base de datos: ${currentDb.name}`}
              className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/25 text-white/95 shrink-0 max-w-[85px] truncate border border-white/20"
            >
              {currentDb.name}
            </span>
          )}
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-1 opacity-80 hover:opacity-100 shrink-0" onClick={e => e.stopPropagation()}>
          {/* Switch database if multiple databases exist */}
          {databases && databases.length > 1 && (
            <div className="relative">
              <button
                data-popup-trigger="true"
                onClick={toggleDbPicker}
                title="Cambiar base de datos de esta tabla"
                className="p-1 rounded hover:bg-black/20 transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
              </button>
              {isDbPickerOpen && (
                <div 
                  data-popup="true"
                  data-dropdown="true" 
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1.5 p-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 min-w-[150px] z-[150]"
                >
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block px-2 py-1">
                    Mover a Base de Datos:
                  </span>
                  {databases.map(db => (
                    <button
                      key={db.id}
                      onClick={e => {
                        e.stopPropagation();
                        onUpdateTable({ ...table, databaseId: db.id });
                        toggleDbPicker();
                      }}
                      className={`w-full text-left font-mono text-[11px] px-2 py-1 rounded transition-colors flex items-center justify-between ${
                        (table.databaseId === db.id || (!table.databaseId && databases[0]?.id === db.id))
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="truncate">{db.name}</span>
                      {(table.databaseId === db.id || (!table.databaseId && databases[0]?.id === db.id)) && (
                        <Check className="w-3 h-3 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Color palette toggle */}
          <div className="relative">
            <button
              data-popup-trigger="true"
              onClick={toggleColorPicker}
              title="Cambiar color de cabecera"
              className="p-1 rounded hover:bg-black/20 transition-colors"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            {isColorPickerOpen && (
              <div 
                data-popup="true"
                data-dropdown="true" 
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                className="absolute right-0 top-full mt-1.5 p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 grid grid-cols-4 gap-1.5 z-[150]"
              >
                {THEME_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={e => {
                      handleColorSelect(c.id, e);
                      toggleColorPicker();
                    }}
                    title={c.name}
                    className={`w-5 h-5 rounded-md ${c.header} flex items-center justify-center transition-transform hover:scale-110`}
                  >
                    {table.color === c.id && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Step / ALTER TABLE for this table */}
          {onAddStepForTable && (
            <button
              onClick={e => {
                e.stopPropagation();
                onAddStepForTable(table.name);
              }}
              title={`Registrar paso (ALTER TABLE) para ${table.name}`}
              className="p-1 rounded hover:bg-black/20 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Duplicate table */}
          <button
            onClick={e => {
              e.stopPropagation();
              onDuplicateTable(table);
            }}
            title="Duplicar tabla"
            className="p-1 rounded hover:bg-black/20 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete table */}
          <button
            onClick={e => {
              e.stopPropagation();
              onDeleteTable(table.id);
            }}
            title="Eliminar tabla"
            className="p-1 rounded hover:bg-red-500/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table Column Headers (PK/FK, Nombre campo, Tipo, Tamaño, Opciones, Borrar) */}
      <div 
        style={{ height: Math.round(COL_HEADER_HEIGHT * fontScale) }}
        className="px-2.5 bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 grid grid-cols-[28px_1fr_78px_60px_60px_24px] gap-2 items-center text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 select-none uppercase tracking-wider"
      >
        {/* 1. PK / FK */}
        <div className="w-[28px] text-center" title="Clave Primaria (PK) y Clave Foránea (FK)">
          PK/FK
        </div>

        {/* 2. Nombre campo */}
        <div className="min-w-0 px-1 text-left truncate" title="Nombre del campo">
          Campo
        </div>

        {/* 3. Tipo */}
        <div className="w-[78px] text-left px-1 truncate" title="Tipo de dato SQL">
          Tipo
        </div>

        {/* 4. Tamaño */}
        <div className="w-[60px] text-center truncate" title="Longitud o precisión">
          Tamaño
        </div>

        {/* 5. Opciones */}
        <div className="w-[60px] text-center truncate" title="Opciones y modificadores">
          Opciones
        </div>

        {/* 6. Borrar */}
        <div className="w-[24px] text-center flex items-center justify-center" title="Eliminar campo">
          <Trash2 className="w-2.5 h-2.5 opacity-60" />
        </div>
      </div>

      {/* Columns List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {table.columns.map(col => {
          const isPK = col.isPK;
          const isFK = col.isFK;
          const isModifiersOpen = isModifiersColOpen(col.id);

          // Compute compact tags to display on the right (excluding PK and FK, which are shown on the left as icons)
          const activeTags: string[] = [];
          if (col.isAutoIncrement) activeTags.push('AI');
          if (!col.isNullable) activeTags.push('NN');
          else activeTags.push('NULL');
          if (col.isUnique && !col.isPK) activeTags.push('UQ');
          if (col.defaultValue && col.defaultValue.trim()) activeTags.push('DEF');

          return (
            <div
              key={col.id}
              style={{ height: Math.round(ROW_HEIGHT * fontScale) }}
              className="relative px-2.5 grid grid-cols-[28px_1fr_78px_60px_60px_24px] gap-2 items-center text-xs group/row hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {/* Left Column Port / Drag handle for connections */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (connectingSource) {
                    onEndConnection(table.id, col.id);
                  } else {
                    onStartConnection(table.id, col.id, e);
                  }
                }}
                title={connectingSource ? "Conectar a este campo" : "Arrastrar relación desde este campo"}
                className={`absolute -left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 transition-all flex items-center justify-center ${
                  connectingSource && !isConnectingFromHere
                    ? 'bg-amber-500 scale-125 animate-pulse'
                    : 'bg-slate-300 dark:bg-slate-600 opacity-0 group-hover/row:opacity-100 hover:scale-125 hover:bg-amber-500'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </button>

              {/* 1. PK/FK Column */}
              <div className="w-[28px] flex items-center justify-center gap-0.5">
                {isPK && (
                  <span title="Clave Primaria (PK)" className="shrink-0 flex items-center">
                    <Key className="w-3 h-3 text-amber-500" />
                  </span>
                )}
                {isFK && (
                  <span title={`Clave Foránea (FK)${col.onDelete ? ` - ON DELETE ${col.onDelete}` : ''}`} className="shrink-0 flex items-center">
                    <LinkIcon className="w-3 h-3 text-cyan-500" />
                  </span>
                )}
                {!isPK && !isFK && (
                  <span className="w-3 h-3 block opacity-0" />
                )}
              </div>

              {/* 2. Column Name Input */}
              <div className="min-w-0 flex items-center">
                <input
                  type="text"
                  value={col.name}
                  onChange={e => handleUpdateColumn(col.id, { name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  onClick={e => e.stopPropagation()}
                  placeholder="nombre_campo"
                  className="w-full bg-transparent font-medium text-slate-800 dark:text-slate-200 outline-none hover:bg-slate-100 dark:hover:bg-slate-800 px-1.5 py-0.5 rounded transition-colors text-[11px] truncate"
                />
              </div>

              {/* 3. Data Type Dropdown */}
              <div className="w-[78px] relative" onClick={e => e.stopPropagation()}>
                <button
                  data-popup-trigger="true"
                  onClick={() => toggleTypeDropdown(col.id)}
                  className="w-full font-mono text-[10px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors border border-slate-200/70 dark:border-slate-700/70 bg-white/60 dark:bg-slate-800/60"
                >
                  <span className="font-semibold truncate">{col.type}</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-60 shrink-0 ml-0.5" />
                </button>

                {isTypeDropdownOpen(col.id) && (
                  <div
                    ref={typeDropdownRef}
                    data-popup="true"
                    data-dropdown="true"
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    className="absolute left-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-[150] max-h-48 overflow-y-auto"
                  >
                    {COMMON_SQL_TYPES.map(t => (
                      <button
                        key={t}
                        onClick={() => {
                          handleUpdateColumn(col.id, { 
                            type: t,
                            length: t === 'DECIMAL' ? (col.length || '10') : col.length,
                            decimals: t === 'DECIMAL' ? (col.decimals !== undefined ? col.decimals : '2') : col.decimals,
                          });
                          toggleTypeDropdown(col.id);
                        }}
                        className={`w-full text-left font-mono text-[11px] px-2 py-1 rounded transition-colors ${
                          col.type === t
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Tamaño (Longitud / Precisión) */}
              <div className="w-[60px] flex items-center justify-center gap-1">
                {col.type === 'DECIMAL' ? (
                  <>
                    <input
                      type="text"
                      value={col.length || '10'}
                      onChange={e => handleUpdateColumn(col.id, { length: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      placeholder="10"
                      title="Precisión total de dígitos (ej. 10)"
                      className="w-[28px] bg-slate-50 dark:bg-slate-800/80 font-mono text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded px-0.5 py-0.5 text-center outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      value={col.decimals !== undefined ? col.decimals : '2'}
                      onChange={e => handleUpdateColumn(col.id, { decimals: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      placeholder="2"
                      title="Decimales (escala, ej. 2)"
                      className="w-[28px] bg-amber-50/70 dark:bg-amber-950/40 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 rounded px-0.5 py-0.5 text-center outline-none focus:border-amber-500"
                    />
                  </>
                ) : (
                  <input
                    type="text"
                    value={col.length || ''}
                    onChange={e => handleUpdateColumn(col.id, { length: e.target.value })}
                    onClick={e => e.stopPropagation()}
                    placeholder="Long."
                    title="Longitud o tamaño del campo (ej. 255)"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 font-mono text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-center outline-none focus:border-amber-500 placeholder:text-slate-400 placeholder:text-[9px]"
                  />
                )}
              </div>

              {/* 5. Desplegable de opciones y restricciones */}
              <div className="w-[60px] relative" onClick={e => e.stopPropagation()}>
                <button
                  data-popup-trigger="true"
                  onClick={() => toggleModifiers(col.id)}
                  title="Configurar opciones y restricciones del campo (NULL, Auto Increment, Default, etc.)"
                  className={`w-full flex items-center justify-between px-1.5 py-0.5 rounded text-[10px] font-mono border transition-all ${
                    isModifiersOpen
                      ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500'
                  }`}
                >
                  <div className="flex items-center gap-0.5 truncate">
                    {activeTags.length === 0 ? (
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-sans">Opt</span>
                    ) : (
                      activeTags.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className={`text-[8.5px] px-0.5 py-0.2 rounded font-bold ${
                            tag === 'AI'
                              ? 'bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200'
                              : tag === 'NN'
                              ? 'bg-blue-100 dark:bg-blue-900/80 text-blue-900 dark:text-blue-200'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {tag}
                        </span>
                      ))
                    )}
                    {activeTags.length > 2 && (
                      <span className="text-[8px] opacity-75">+{activeTags.length - 2}</span>
                    )}
                  </div>
                  <ChevronDown className="w-2.5 h-2.5 opacity-60 shrink-0 ml-0.5" />
                </button>

                {/* Modifiers Multi-select Popover */}
                {isModifiersOpen && (
                  <div
                    ref={modifiersDropdownRef}
                    data-popup="true"
                    data-dropdown="true"
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2.5 z-[150] text-xs space-y-2 animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span className="font-bold text-[11px] text-slate-900 dark:text-slate-100 flex items-center gap-1">
                        <Settings2 className="w-3.5 h-3.5 text-amber-500" />
                        Opciones de "{col.name}"
                      </span>
                      <button
                        onClick={() => toggleModifiers(col.id)}
                        className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                      >
                        Listo
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {/* DECIMAL Precision & Decimals Config */}
                      {col.type === 'DECIMAL' && (
                        <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800/60 space-y-1.5">
                          <span className="text-[10px] font-bold text-amber-900 dark:text-amber-200 block">
                            Precisión y Decimales (DECIMAL):
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="text-[9px] text-slate-500 dark:text-slate-400 block mb-0.5">Dígitos totales</label>
                              <input
                                type="text"
                                value={col.length || '10'}
                                onChange={e => handleUpdateColumn(col.id, { length: e.target.value })}
                                placeholder="10"
                                className="w-full text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-500 dark:text-slate-400 block mb-0.5">Nº Decimales</label>
                              <input
                                type="text"
                                value={col.decimals !== undefined ? col.decimals : '2'}
                                onChange={e => handleUpdateColumn(col.id, { decimals: e.target.value })}
                                placeholder="2"
                                className="w-full text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center font-bold text-amber-600 dark:text-amber-400 outline-none"
                              />
                            </div>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block text-right font-medium">
                            SQL: DECIMAL({col.length || '10'}, {col.decimals !== undefined ? col.decimals : '2'})
                          </span>
                        </div>
                      )}

                      {/* NOT NULL vs NULL */}
                      <div className="grid grid-cols-2 gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-lg">
                        <label className="flex items-center gap-1.5 p-1 rounded hover:bg-white dark:hover:bg-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!col.isNullable}
                            onChange={e => handleUpdateColumn(col.id, { isNullable: !e.target.checked })}
                            className="rounded text-amber-500 focus:ring-0"
                          />
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">NOT NULL</span>
                        </label>

                        <label className="flex items-center gap-1.5 p-1 rounded hover:bg-white dark:hover:bg-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={col.isNullable}
                            onChange={e => handleUpdateColumn(col.id, { isNullable: e.target.checked })}
                            className="rounded text-amber-500 focus:ring-0"
                          />
                          <span className="text-[11px] text-slate-600 dark:text-slate-400">NULL</span>
                        </label>
                      </div>

                      {/* AUTO INCREMENT */}
                      <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!col.isAutoIncrement}
                          onChange={e => handleUpdateColumn(col.id, { isAutoIncrement: e.target.checked })}
                          className="rounded text-amber-500 focus:ring-0"
                        />
                        <div className="flex-1">
                          <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">AUTO_INCREMENT</span>
                          <span className="text-[9px] text-slate-400 block">ID numérico autoincremental</span>
                        </div>
                      </label>

                      {/* PRIMARY KEY */}
                      <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={col.isPK}
                          onChange={e => handleUpdateColumn(col.id, { isPK: e.target.checked })}
                          className="rounded text-amber-500 focus:ring-0"
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">PRIMARY KEY (PK)</span>
                          <Key className="w-3 h-3 text-amber-500" />
                        </div>
                      </label>

                      {/* UNIQUE */}
                      <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={col.isUnique}
                          onChange={e => handleUpdateColumn(col.id, { isUnique: e.target.checked })}
                          className="rounded text-amber-500 focus:ring-0"
                        />
                        <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">UNIQUE</span>
                      </label>

                      {/* FOREIGN KEY & ON DELETE */}
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={col.isFK}
                            onChange={e => {
                              const isChecked = e.target.checked;
                              handleUpdateColumn(col.id, { 
                                isFK: isChecked,
                                onDelete: isChecked ? (col.onDelete || 'CASCADE') : undefined
                              });
                            }}
                            className="rounded text-amber-500 focus:ring-0"
                          />
                          <div className="flex-1 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">FOREIGN KEY (FK)</span>
                            <LinkIcon className="w-3 h-3 text-cyan-500" />
                          </div>
                        </label>

                        {/* ON DELETE Options when FK is checked */}
                        {col.isFK && (
                          <div className="ml-5 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-cyan-500/20 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                                Regla ON DELETE:
                              </span>
                              <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-mono font-semibold">
                                {col.onDelete || 'CASCADE'}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-1">
                              {(['CASCADE', 'SET NULL', 'SET DEFAULT', 'RESTRICT', 'NO ACTION'] as OnDeleteAction[]).map(action => {
                                const isCurrent = (col.onDelete || 'CASCADE') === action;
                                return (
                                  <button
                                    key={action}
                                    type="button"
                                    onClick={() => handleUpdateColumn(col.id, { onDelete: action })}
                                    className={`text-[9px] font-mono px-1 py-1 rounded border text-center transition-all ${
                                      isCurrent
                                        ? action === 'CASCADE'
                                          ? 'bg-rose-500 text-white font-bold border-rose-600 shadow-xs'
                                          : action === 'SET NULL'
                                          ? 'bg-blue-500 text-white font-bold border-blue-600 shadow-xs'
                                          : action === 'SET DEFAULT'
                                          ? 'bg-emerald-500 text-white font-bold border-emerald-600 shadow-xs'
                                          : action === 'RESTRICT'
                                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-xs'
                                          : 'bg-slate-700 text-white font-bold border-slate-800 shadow-xs'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                                    }`}
                                  >
                                    {action === 'SET NULL' ? 'NULL' : action === 'SET DEFAULT' ? 'DEFAULT' : action}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Textbox para el valor DEFAULT de la regla ON DELETE: visible únicamente al pulsar la opción DEFAULT */}
                            {col.onDelete === 'SET DEFAULT' && (
                              <div className="p-2 rounded-lg border bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-emerald-900 dark:text-emerald-200">
                                    Valor DEFAULT (SET DEFAULT):
                                  </label>
                                  <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    ON DELETE SET DEFAULT
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  value={col.defaultValue || ''}
                                  onChange={e => handleUpdateColumn(col.id, { defaultValue: e.target.value })}
                                  placeholder="ej. 0, 'sin_asignar', NULL"
                                  autoFocus
                                  className="w-full text-[10px] font-mono px-2 py-1 rounded bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* DEFAULT VALUE */}
                      <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 space-y-1">
                        <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 block">
                          Valor DEFAULT:
                        </span>
                        <input
                          type="text"
                          value={col.defaultValue || ''}
                          onChange={e => handleUpdateColumn(col.id, { defaultValue: e.target.value })}
                          placeholder="ej. 'activo', 0, CURRENT_TIMESTAMP"
                          className="w-full text-[11px] px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Delete Column button */}
              <div className="w-[24px] flex items-center justify-center">
                <button
                  onClick={e => handleDeleteColumn(col.id, e)}
                  title="Eliminar campo"
                  disabled={table.columns.length <= 1}
                  className="p-1 text-slate-300 hover:text-rose-500 disabled:opacity-0 transition-colors rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 w-5 h-5 flex items-center justify-center"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Right Column Port / Drag handle for connections */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (connectingSource) {
                    onEndConnection(table.id, col.id);
                  } else {
                    onStartConnection(table.id, col.id, e);
                  }
                }}
                title={connectingSource ? "Conectar a este campo" : "Arrastrar relación desde este campo"}
                className={`absolute -right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 transition-all flex items-center justify-center ${
                  connectingSource && !isConnectingFromHere
                    ? 'bg-amber-500 scale-125 animate-pulse'
                    : 'bg-slate-300 dark:bg-slate-600 opacity-0 group-hover/row:opacity-100 hover:scale-125 hover:bg-amber-500'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Column Button Footer */}
      <div 
        style={{ minHeight: Math.round(FOOTER_HEIGHT * fontScale) }}
        className="px-3 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl flex items-center justify-between"
      >
        <button
          onClick={handleAddColumn}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir campo</span>
        </button>

        <span className="text-[10px] text-slate-400 font-mono">
          {table.columns.length} campos
        </span>
      </div>

      {/* General Table Connection Ports (Top, Bottom) */}
      <button
        onClick={e => {
          e.stopPropagation();
          if (connectingSource) {
            onEndConnection(table.id);
          } else {
            onStartConnection(table.id, undefined, e);
          }
        }}
        className={`absolute left-1/2 -top-2.5 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 transition-all flex items-center justify-center ${
          connectingSource && !isConnectingFromHere
            ? 'bg-amber-500 scale-125 animate-pulse'
            : 'bg-slate-300 dark:bg-slate-600 opacity-0 group-hover:opacity-100 hover:scale-125 hover:bg-amber-500'
        }`}
        title="Conectar por arriba"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-white" />
      </button>

      <button
        onClick={e => {
          e.stopPropagation();
          if (connectingSource) {
            onEndConnection(table.id);
          } else {
            onStartConnection(table.id, undefined, e);
          }
        }}
        className={`absolute left-1/2 -bottom-2.5 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 transition-all flex items-center justify-center ${
          connectingSource && !isConnectingFromHere
            ? 'bg-amber-500 scale-125 animate-pulse'
            : 'bg-slate-300 dark:bg-slate-600 opacity-0 group-hover:opacity-100 hover:scale-125 hover:bg-amber-500'
        }`}
        title="Conectar por abajo"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-white" />
      </button>
    </div>
  );
};
