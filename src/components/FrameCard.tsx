import React, { useState } from 'react';
import { FrameNode } from '../types/erd';
import { Trash2 } from 'lucide-react';

interface FrameCardProps {
  frame: FrameNode;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updated: FrameNode) => void;
  onDelete: (id: string) => void;
}

export const FrameCard: React.FC<FrameCardProps> = ({
  frame,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(frame.title);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onUpdate({ ...frame, title: titleInput.trim() });
    } else {
      setTitleInput(frame.title);
    }
  };

  return (
    <div
      onClick={onSelect}
      style={{
        transform: `translate3d(${frame.x}px, ${frame.y}px, 0)`,
        width: frame.width,
        height: frame.height,
      }}
      className={`absolute left-0 top-0 border-2 rounded-2xl pointer-events-auto select-none transition-colors group/frame ${
        isSelected
          ? 'border-amber-500 bg-amber-500/5'
          : 'border-slate-300 dark:border-slate-700/80 bg-slate-50/20 dark:bg-slate-900/10'
      }`}
    >
      {/* Title tab top left */}
      <div className="absolute -top-7 left-2 flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-lg px-2.5 py-1 shadow-sm">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
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
            className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide cursor-text"
          >
            {frame.title}
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
