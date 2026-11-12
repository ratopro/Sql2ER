import React from 'react';

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface ResizeHandlesProps {
  isSelected: boolean;
  color?: string;
  onStartResize: (handle: ResizeHandle, e: React.MouseEvent) => void;
}

const HANDLES: {
  handle: ResizeHandle;
  className: string;
  cursor: string;
  title: string;
}[] = [
  { handle: 'nw', className: '-top-1.5 -left-1.5', cursor: 'cursor-nwse-resize', title: 'Redimensionar superior-izquierda' },
  { handle: 'n', className: '-top-1.5 left-1/2 -translate-x-1/2', cursor: 'cursor-ns-resize', title: 'Redimensionar superior' },
  { handle: 'ne', className: '-top-1.5 -right-1.5', cursor: 'cursor-nesw-resize', title: 'Redimensionar superior-derecha' },
  { handle: 'e', className: 'top-1/2 -right-1.5 -translate-y-1/2', cursor: 'cursor-ew-resize', title: 'Redimensionar derecha' },
  { handle: 'se', className: '-bottom-1.5 -right-1.5', cursor: 'cursor-nwse-resize', title: 'Redimensionar inferior-derecha' },
  { handle: 's', className: '-bottom-1.5 left-1/2 -translate-x-1/2', cursor: 'cursor-ns-resize', title: 'Redimensionar inferior' },
  { handle: 'sw', className: '-bottom-1.5 -left-1.5', cursor: 'cursor-nesw-resize', title: 'Redimensionar inferior-izquierda' },
  { handle: 'w', className: 'top-1/2 -left-1.5 -translate-y-1/2', cursor: 'cursor-ew-resize', title: 'Redimensionar izquierda' },
];

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({
  isSelected,
  onStartResize,
}) => {
  return (
    <>
      {HANDLES.map(({ handle, className, cursor, title }) => (
        <div
          key={handle}
          title={title}
          onMouseDown={e => {
            e.stopPropagation();
            e.preventDefault();
            onStartResize(handle, e);
          }}
          className={`absolute ${className} ${cursor} w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-amber-500 shadow-md z-30 transition-all pointer-events-auto ${
            isSelected
              ? 'opacity-100 scale-100'
              : 'opacity-0 group-hover/resizable:opacity-80 scale-90'
          } hover:scale-135 hover:bg-amber-500 dark:hover:bg-amber-500 hover:border-white`}
        />
      ))}
    </>
  );
};
