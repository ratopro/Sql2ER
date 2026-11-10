import React, { useState } from 'react';
import { 
  Relationship, 
  TableNode, 
  Cardinality,
  OnDeleteAction
} from '../types/erd';
import { 
  computeConnectorEndpoints, 
  generateSmoothBezier 
} from '../utils/canvasMath';
import { Trash2, ArrowLeftRight, Edit2, Check, ShieldAlert } from 'lucide-react';

interface ConnectorLineProps {
  relationship: Relationship;
  fromTable?: TableNode;
  toTable?: TableNode;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updated: Relationship) => void;
  onDelete: (id: string) => void;
  fontScale?: number;
}

export const ConnectorLine: React.FC<ConnectorLineProps> = ({
  relationship,
  fromTable,
  toTable,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  fontScale = 1,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState(relationship.label || '');

  if (!fromTable || !toTable) return null;

  const endpoints = computeConnectorEndpoints(
    fromTable,
    toTable,
    relationship.fromColumnId,
    relationship.toColumnId,
    fontScale
  );

  const { path, mid } = generateSmoothBezier(
    endpoints.start,
    endpoints.end,
    endpoints.startSide,
    endpoints.endSide
  );

  const handleCardinalityCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cycleMap: Record<Cardinality, Cardinality> = {
      '1:N': 'N:1',
      'N:1': '1:1',
      '1:1': 'N:M',
      'N:M': '1:N',
      '0..1:1': '1:N',
      '0..1:N': '1:N',
    };
    const nextCardinality = cycleMap[relationship.cardinality] || '1:N';
    onUpdate({ ...relationship, cardinality: nextCardinality });
  };

  const handleOnDeleteCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cycleMap: Record<OnDeleteAction, OnDeleteAction> = {
      'CASCADE': 'SET NULL',
      'SET NULL': 'RESTRICT',
      'RESTRICT': 'NO ACTION',
      'NO ACTION': 'CASCADE',
    };
    const currentAction = relationship.onDelete || 'CASCADE';
    const nextAction = cycleMap[currentAction] || 'CASCADE';
    onUpdate({ ...relationship, onDelete: nextAction });
  };

  const handleReverse = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({
      ...relationship,
      fromTableId: relationship.toTableId,
      fromColumnId: relationship.toColumnId,
      toTableId: relationship.fromTableId,
      toColumnId: relationship.fromColumnId,
      cardinality: relationship.cardinality === '1:N' ? 'N:1' : relationship.cardinality === 'N:1' ? '1:N' : relationship.cardinality,
    });
  };

  const handleLabelSubmit = () => {
    setIsEditingLabel(false);
    onUpdate({ ...relationship, label: labelInput.trim() || undefined });
  };

  return (
    <g className="cursor-pointer group/line" onClick={onSelect}>
      {/* Invisible thicker stroke for easy hover and click detection */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        className="cursor-pointer"
        onClick={() => setShowMenu(!showMenu)}
      />

      {/* Main Connection SVG Path */}
      <path
        d={path}
        fill="none"
        className={`transition-colors duration-200 ${
          isSelected
            ? 'stroke-amber-500 stroke-[2.5]'
            : 'stroke-slate-400 dark:stroke-slate-500 group-hover/line:stroke-amber-500 stroke-2'
        }`}
        strokeDasharray={relationship.cardinality.includes('0..') ? '4 3' : 'none'}
      />

      {/* Start anchor circle */}
      <circle
        cx={endpoints.start.x}
        cy={endpoints.start.y}
        r={3.5}
        className={isSelected ? 'fill-amber-500' : 'fill-slate-500 dark:fill-slate-400 group-hover/line:fill-amber-500'}
      />

      {/* End anchor circle */}
      <circle
        cx={endpoints.end.x}
        cy={endpoints.end.y}
        r={3.5}
        className={isSelected ? 'fill-amber-500' : 'fill-slate-500 dark:fill-slate-400 group-hover/line:fill-amber-500'}
      />

      {/* Middle Interactive Badge / Floating Controller */}
      <foreignObject
        x={mid.x - 140}
        y={mid.y - 18}
        width={280}
        height={90}
        className="overflow-visible pointer-events-auto"
      >
        <div className="flex flex-col items-center justify-center">
          <div
            onClick={e => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-tight flex items-center gap-1.5 shadow-sm border transition-all cursor-pointer ${
              isSelected || showMenu
                ? 'bg-amber-500 text-slate-950 border-amber-600 scale-105'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-amber-500'
            }`}
          >
            <span>{relationship.cardinality}</span>
            <span className={`text-[9px] font-semibold px-1 py-0.2 rounded border-l border-current/20 ${
              (relationship.onDelete || 'CASCADE') === 'CASCADE'
                ? 'text-rose-600 dark:text-rose-400'
                : (relationship.onDelete) === 'SET NULL'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}>
              ON DEL: {relationship.onDelete || 'CASCADE'}
            </span>
            {relationship.label && (
              <span className="font-sans font-medium text-[9px] opacity-80 border-l border-current/20 pl-1 max-w-[50px] truncate">
                {relationship.label}
              </span>
            )}
          </div>

          {/* Quick Context Popup on click */}
          {showMenu && (
            <div
              onClick={e => e.stopPropagation()}
              className="mt-1.5 p-1.5 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
            >
              {/* Cardinality Cycle */}
              <button
                onClick={handleCardinalityCycle}
                title="Cambiar cardinalidad (1:N, 1:1, N:M)"
                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono text-[10px] font-semibold text-slate-800 dark:text-slate-200 shrink-0"
              >
                {relationship.cardinality}
              </button>

              {/* Direct ON DELETE Action Selector */}
              <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded shrink-0">
                {(['CASCADE', 'SET NULL', 'RESTRICT'] as OnDeleteAction[]).map(act => {
                  const isCurrent = (relationship.onDelete || 'CASCADE') === act;
                  return (
                    <button
                      key={act}
                      onClick={e => {
                        e.stopPropagation();
                        onUpdate({ ...relationship, onDelete: act });
                      }}
                      title={`Regla referencial ON DELETE ${act}`}
                      className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold transition-all ${
                        isCurrent
                          ? act === 'CASCADE'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : act === 'SET NULL'
                            ? 'bg-blue-500 text-white shadow-xs'
                            : 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {act === 'SET NULL' ? 'NULL' : act === 'CASCADE' ? 'CASCADE' : 'RESTRICT'}
                    </button>
                  );
                })}
              </div>

              {/* Flip direction */}
              <button
                onClick={handleReverse}
                title="Invertir dirección"
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors shrink-0"
              >
                <ArrowLeftRight className="w-3 h-3" />
              </button>

              {/* Edit label */}
              {isEditingLabel ? (
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="text"
                    value={labelInput}
                    autoFocus
                    onChange={e => setLabelInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleLabelSubmit();
                      if (e.key === 'Escape') setIsEditingLabel(false);
                    }}
                    placeholder="etiqueta"
                    className="w-16 px-1 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none border border-amber-500"
                  />
                  <button onClick={handleLabelSubmit} className="text-emerald-500 p-0.5">
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingLabel(true)}
                  title="Editar nombre de relación"
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors shrink-0"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}

              {/* Delete relation */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDelete(relationship.id);
                }}
                title="Eliminar relación"
                className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-500 transition-colors shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
};
