import React, { useState } from 'react';
import { StickyNode, StickyColor } from '../types/erd';
import { Trash2, Palette, Check } from 'lucide-react';

interface StickyNoteProps {
  sticky: StickyNode;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updated: StickyNode) => void;
  onDelete: (id: string) => void;
}

const STICKY_COLORS: { id: StickyColor; name: string; bg: string; text: string; border: string }[] = [
  { id: 'yellow', name: 'Amarillo', bg: 'bg-amber-100 dark:bg-amber-950/70', text: 'text-amber-950 dark:text-amber-100', border: 'border-amber-300 dark:border-amber-800' },
  { id: 'teal', name: 'Menta', bg: 'bg-emerald-100 dark:bg-emerald-950/70', text: 'text-emerald-950 dark:text-emerald-100', border: 'border-emerald-300 dark:border-emerald-800' },
  { id: 'orange', name: 'Naranja', bg: 'bg-orange-100 dark:bg-orange-950/70', text: 'text-orange-950 dark:text-orange-100', border: 'border-orange-300 dark:border-orange-800' },
  { id: 'pink', name: 'Rosa', bg: 'bg-pink-100 dark:bg-pink-950/70', text: 'text-pink-950 dark:text-pink-100', border: 'border-pink-300 dark:border-pink-800' },
  { id: 'purple', name: 'Lavanda', bg: 'bg-purple-100 dark:bg-purple-950/70', text: 'text-purple-950 dark:text-purple-100', border: 'border-purple-300 dark:border-purple-800' },
  { id: 'green', name: 'Lima', bg: 'bg-lime-100 dark:bg-lime-950/70', text: 'text-lime-950 dark:text-lime-100', border: 'border-lime-300 dark:border-lime-800' },
];

export const StickyNote: React.FC<StickyNoteProps> = ({
  sticky,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const currentColor = STICKY_COLORS.find(c => c.id === sticky.color) || STICKY_COLORS[0];

  return (
    <div
      onClick={onSelect}
      style={{
        transform: `translate3d(${sticky.x}px, ${sticky.y}px, 0)`,
        width: sticky.width,
        minHeight: sticky.height,
      }}
      className={`absolute left-0 top-0 rounded-lg p-3 shadow-md flex flex-col justify-between border select-none group transition-shadow ${
        currentColor.bg
      } ${currentColor.border} ${
        isSelected
          ? 'ring-2 ring-amber-500 shadow-xl border-amber-500 z-10'
          : 'hover:shadow-lg'
      }`}
    >
      {/* Sticky top toolbar */}
      <div className="flex items-center justify-between gap-1 opacity-60 group-hover:opacity-100 transition-opacity mb-2">
        <span className="text-[10px] font-mono tracking-wide uppercase opacity-70">Nota</span>

        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {/* Color palette */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1 rounded hover:bg-black/10 transition-colors"
            >
              <Palette className="w-3 h-3" />
            </button>
            {showColorPicker && (
              <div className="absolute right-0 top-full mt-1 p-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-1 z-50">
                {STICKY_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onUpdate({ ...sticky, color: c.id });
                      setShowColorPicker(false);
                    }}
                    className={`w-4 h-4 rounded ${c.bg} border ${c.border} flex items-center justify-center`}
                  >
                    {sticky.color === c.id && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete note */}
          <button
            onClick={e => {
              e.stopPropagation();
              onDelete(sticky.id);
            }}
            className="p-1 rounded hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Editable multiline note body */}
      <textarea
        value={sticky.text}
        onChange={e => onUpdate({ ...sticky, text: e.target.value })}
        onClick={e => e.stopPropagation()}
        placeholder="Escribe una nota aquí..."
        rows={4}
        className={`w-full bg-transparent resize-none outline-none text-xs leading-relaxed font-sans ${currentColor.text} placeholder:opacity-50`}
      />
    </div>
  );
};
