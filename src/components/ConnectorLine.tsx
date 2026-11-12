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
import { Trash2, ArrowLeftRight, Edit2, Check, RotateCcw } from 'lucide-react';

interface ConnectorLineProps {
  relationship: Relationship;
  fromTable?: TableNode;
  toTable?: TableNode;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updated: Relationship, saveToHistory?: boolean) => void;
  onDelete: (id: string) => void;
  fontScale?: number;
  zoom?: number;
  isOpenMenu?: boolean;
  onToggleMenu?: (open: boolean) => void;
}

// Helper to determine rotation for marker pointing towards entity along line
const getSideRotation = (side: 'left' | 'right' | 'top' | 'bottom'): number => {
  switch (side) {
    case 'right': return 0;
    case 'bottom': return 90;
    case 'left': return 180;
    case 'top': return 270;
  }
};

const getBadgeOffset = (side: 'left' | 'right' | 'top' | 'bottom', dist: number): { x: number; y: number } => {
  switch (side) {
    case 'right': return { x: dist, y: 0 };
    case 'left': return { x: -dist, y: 0 };
    case 'bottom': return { x: 0, y: dist };
    case 'top': return { x: 0, y: -dist };
  }
};

interface RelationshipEndMarkerProps {
  point: { x: number; y: number };
  side: 'left' | 'right' | 'top' | 'bottom';
  cardinality: '1' | 'N' | 'M' | '0..1';
  isSelected: boolean;
  tableName: string;
  isSource: boolean;
  onStartDrag?: (e: React.MouseEvent) => void;
}

const RelationshipEndMarker: React.FC<RelationshipEndMarkerProps> = ({
  point,
  side,
  cardinality,
  isSelected,
  tableName,
  isSource,
  onStartDrag,
}) => {
  const rotation = getSideRotation(side);
  const badgeDist = cardinality === '0..1' ? 30 : 25;
  const badgeOffset = getBadgeOffset(side, badgeDist);
  const badgeX = point.x + badgeOffset.x;
  const badgeY = point.y + badgeOffset.y;

  const colorClass = isSelected
    ? 'text-amber-500 stroke-amber-500 fill-amber-500'
    : 'text-slate-500 dark:text-slate-400 stroke-slate-500 dark:stroke-slate-400 fill-slate-500 dark:fill-slate-400 group-hover/line:text-amber-500 group-hover/line:stroke-amber-500 group-hover/line:fill-amber-500';

  return (
    <g 
      className={`transition-colors duration-200 cursor-move ${colorClass}`}
      style={{ pointerEvents: 'all' }}
      onMouseDown={e => {
        e.stopPropagation();
        if (onStartDrag) onStartDrag(e);
      }}
    >
      <title>{`${isSource ? 'Origen' : 'Destino'}: ${tableName} (Cardinalidad: ${cardinality})`}</title>

      {/* Geometric Arrow & Marker (aligned with entry vector) */}
      <g transform={`translate(${point.x}, ${point.y}) rotate(${rotation})`}>
        {/* Contact anchor circle */}
        <circle cx={0} cy={0} r={2.5} className="fill-current" />

        {/* Cardinality "Many" (N or M): Crow's foot (patas de gallo) + arrowhead into table */}
        {(cardinality === 'N' || cardinality === 'M') && (
          <g>
            {/* Triangular arrow tip pointing directly into table edge at (0, 0) */}
            <polygon points="0,0 8,-4.5 8,4.5" className="fill-current" />
            {/* Crow's foot branches spreading into table edge */}
            <line x1={0} y1={-8} x2={15} y2={0} strokeWidth={2} strokeLinecap="round" className="stroke-current fill-none" />
            <line x1={0} y1={8} x2={15} y2={0} strokeWidth={2} strokeLinecap="round" className="stroke-current fill-none" />
            <line x1={0} y1={0} x2={15} y2={0} strokeWidth={2} strokeLinecap="round" className="stroke-current fill-none" />
            {/* Distinct multiplicity tick */}
            <line x1={15} y1={-6} x2={15} y2={6} strokeWidth={1.6} strokeLinecap="round" className="stroke-current fill-none" />
          </g>
        )}

        {/* Cardinality "One" (1): Crisp arrow into table + perpendicular crossbars */}
        {cardinality === '1' && (
          <g>
            {/* Triangular arrow tip pointing directly into table edge */}
            <polygon points="0,0 8,-4.5 8,4.5" className="fill-current" />
            {/* Connecting stem */}
            <line x1={7} y1={0} x2={15} y2={0} strokeWidth={2} strokeLinecap="round" className="stroke-current fill-none" />
            {/* Perpendicular crossbar (classic "One" notation) */}
            <line x1={12} y1={-7} x2={12} y2={7} strokeWidth={2} strokeLinecap="round" className="stroke-current fill-none" />
            {/* Secondary crossbar for strict 1 indicator */}
            <line x1={16} y1={-5} x2={16} y2={5} strokeWidth={1.5} strokeLinecap="round" className="stroke-current fill-none" />
          </g>
        )}

        {/* Cardinality "Zero or One" (0..1): Arrow into table + crossbar + hollow ring */}
        {cardinality === '0..1' && (
          <g>
            {/* Triangular arrow tip pointing into table */}
            <polygon points="0,0 7,-4 7,4" className="fill-current" />
            {/* Perpendicular crossbar */}
            <line x1={11} y1={-6} x2={11} y2={6} strokeWidth={1.8} strokeLinecap="round" className="stroke-current fill-none" />
            {/* Connecting stem */}
            <line x1={7} y1={0} x2={15} y2={0} strokeWidth={1.8} className="stroke-current fill-none" />
            {/* Hollow circle indicating 0/optional */}
            <circle
              cx={18}
              cy={0}
              r={4.5}
              strokeWidth={1.8}
              className="stroke-current fill-white dark:fill-slate-900"
            />
          </g>
        )}
      </g>

      {/* Typographic Badge Label: Always upright and readable at any line angle */}
      <g>
        <rect
          x={badgeX - (cardinality === '0..1' ? 14 : 9)}
          y={badgeY - 8}
          width={cardinality === '0..1' ? 28 : 18}
          height={16}
          rx={3.5}
          className={`transition-colors shadow-xs ${
            isSelected
              ? 'fill-amber-500/15 stroke-amber-500'
              : 'fill-white/95 dark:fill-slate-900/95 stroke-slate-300 dark:stroke-slate-600 group-hover/line:stroke-amber-400'
          }`}
          strokeWidth={1.2}
        />
        <text
          x={badgeX}
          y={badgeY}
          textAnchor="middle"
          dominantBaseline="central"
          className={`select-none pointer-events-none font-mono font-bold tracking-tight transition-colors ${
            isSelected
              ? 'fill-amber-600 dark:fill-amber-400'
              : 'fill-slate-700 dark:fill-slate-200 group-hover/line:fill-amber-600 dark:group-hover/line:fill-amber-400'
          }`}
          style={{ fontSize: cardinality === '0..1' ? '8px' : '9.5px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
        >
          {cardinality}
        </text>
      </g>
    </g>
  );
};

export const ConnectorLine: React.FC<ConnectorLineProps> = ({
  relationship,
  fromTable,
  toTable,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  fontScale = 1,
  zoom = 1,
  isOpenMenu,
  onToggleMenu,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState(relationship.label || '');
  const [isDraggingBadge, setIsDraggingBadge] = useState(false);

  const isMenuOpen = isOpenMenu !== undefined ? isOpenMenu : showMenu;
  const toggleMenu = () => {
    if (onToggleMenu) {
      onToggleMenu(!isMenuOpen);
    } else {
      setShowMenu(!showMenu);
    }
  };

  if (!fromTable || !toTable) return null;

  const endpoints = computeConnectorEndpoints(
    fromTable,
    toTable,
    relationship.fromColumnId,
    relationship.toColumnId,
    fontScale
  );

  const { path, mid, p1, p2 } = generateSmoothBezier(
    endpoints.start,
    endpoints.end,
    endpoints.startSide,
    endpoints.endSide,
    relationship.controlPoint1,
    relationship.controlPoint2
  );

  // Compute cardinalities for start (fromTable) and end (toTable)
  const [startCard, endCard]: ['1' | 'N' | 'M' | '0..1', '1' | 'N' | 'M' | '0..1'] = (() => {
    switch (relationship.cardinality) {
      case '1:N': return ['1', 'N'];
      case 'N:1': return ['N', '1'];
      case '1:1': return ['1', '1'];
      case 'N:M': return ['N', 'M'];
      case '0..1:1': return ['0..1', '1'];
      case '0..1:N': return ['0..1', 'N'];
      default: return ['1', 'N'];
    }
  })();

  const handleStartDragPoint = (pointIndex: 1 | 2, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(e);

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const currentPoint = pointIndex === 1 ? p1 : p2;
    const startPointX = currentPoint.x;
    const startPointY = currentPoint.y;
    let hasMoved = false;
    let latestRel = relationship;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dist = Math.hypot(moveEvent.clientX - startClientX, moveEvent.clientY - startClientY);
      if (dist > 3) {
        hasMoved = true;
        moveEvent.stopPropagation();
        moveEvent.preventDefault();
        const dx = (moveEvent.clientX - startClientX) / zoom;
        const dy = (moveEvent.clientY - startClientY) / zoom;
        const newPoint = {
          x: Math.round(startPointX + dx),
          y: Math.round(startPointY + dy),
        };

        if (pointIndex === 1) {
          latestRel = { ...relationship, controlPoint1: newPoint };
        } else {
          latestRel = { ...relationship, controlPoint2: newPoint };
        }
        onUpdate(latestRel, false);
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mouseup', handleMouseUp, true);
      if (hasMoved) {
        upEvent.stopPropagation();
        upEvent.preventDefault();
        onUpdate(latestRel, true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('mouseup', handleMouseUp, true);
  };

  // Drag directly on the relationship text/badge or line curve to move the connection line
  const handleStartDragBadge = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(e);

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startP1 = { ...p1 };
    const startP2 = { ...p2 };
    let hasMoved = false;
    let latestRel = relationship;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dist = Math.hypot(moveEvent.clientX - startClientX, moveEvent.clientY - startClientY);
      if (dist > 3) {
        hasMoved = true;
        setIsDraggingBadge(true);
        moveEvent.stopPropagation();
        moveEvent.preventDefault();
        const dx = (moveEvent.clientX - startClientX) / zoom;
        const dy = (moveEvent.clientY - startClientY) / zoom;

        latestRel = {
          ...relationship,
          controlPoint1: { x: Math.round(startP1.x + dx), y: Math.round(startP1.y + dy) },
          controlPoint2: { x: Math.round(startP2.x + dx), y: Math.round(startP2.y + dy) },
        };
        onUpdate(latestRel, false);
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsDraggingBadge(false);
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mouseup', handleMouseUp, true);
      if (hasMoved) {
        upEvent.stopPropagation();
        onUpdate(latestRel, true);
      } else {
        toggleMenu();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('mouseup', handleMouseUp, true);
  };

  const handleCardinalityCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cycleMap: Record<Cardinality, Cardinality> = {
      '1:N': 'N:1',
      'N:1': '1:1',
      '1:1': 'N:M',
      'N:M': '0..1:1',
      '0..1:1': '0..1:N',
      '0..1:N': '1:N',
    };
    const nextCardinality = cycleMap[relationship.cardinality] || '1:N';
    onUpdate({ ...relationship, cardinality: nextCardinality });
  };

  const handleOnDeleteCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cycleMap: Record<OnDeleteAction, OnDeleteAction> = {
      'CASCADE': 'SET NULL',
      'SET NULL': 'SET DEFAULT',
      'SET DEFAULT': 'RESTRICT',
      'RESTRICT': 'NO ACTION',
      'NO ACTION': 'CASCADE',
    };
    const currentAction = relationship.onDelete || 'CASCADE';
    const nextAction = cycleMap[currentAction] || 'CASCADE';
    onUpdate({ ...relationship, onDelete: nextAction });
  };

  const handleReverse = (e: React.MouseEvent) => {
    e.stopPropagation();
    let reversedCard = relationship.cardinality;
    if (relationship.cardinality === '1:N') reversedCard = 'N:1';
    else if (relationship.cardinality === 'N:1') reversedCard = '1:N';
    else if (relationship.cardinality === '0..1:N') reversedCard = 'N:1';

    onUpdate({
      ...relationship,
      fromTableId: relationship.toTableId,
      fromColumnId: relationship.toColumnId,
      toTableId: relationship.fromTableId,
      toColumnId: relationship.fromColumnId,
      cardinality: reversedCard,
    });
  };

  const handleLabelSubmit = () => {
    setIsEditingLabel(false);
    onUpdate({ ...relationship, label: labelInput.trim() || undefined });
  };

  return (
    <g
      className="cursor-pointer group/line"
      onClick={onSelect}
      onMouseDown={e => {
        // Prevent clicking anywhere on relation from bubbling to canvas panning
        e.stopPropagation();
      }}
    >
      {/* Invisible thicker stroke for easy hover and drag */}
      <path
        d={path}
        fill="none"
        stroke="#000000"
        strokeOpacity={0}
        strokeWidth={24}
        style={{ pointerEvents: 'stroke' }}
        className="cursor-move"
        onMouseDown={handleStartDragBadge}
        onClick={() => toggleMenu()}
        data-popup-trigger="true"
      />

      {/* Main Connection SVG Path */}
      <path
        d={path}
        fill="none"
        style={{ pointerEvents: 'stroke' }}
        className={`transition-colors duration-200 cursor-move ${
          isSelected
            ? 'stroke-amber-500 stroke-[2.5]'
            : 'stroke-slate-400 dark:stroke-slate-500 group-hover/line:stroke-amber-500 stroke-2'
        }`}
        strokeDasharray={relationship.cardinality.includes('0..') ? '4 3' : 'none'}
        onMouseDown={handleStartDragBadge}
      />

      {/* Start anchor marker & relationship arrow (fromTable side) */}
      <RelationshipEndMarker
        point={endpoints.start}
        side={endpoints.startSide}
        cardinality={startCard}
        isSelected={isSelected}
        tableName={fromTable.name}
        isSource={true}
        onStartDrag={handleStartDragBadge}
      />

      {/* End anchor marker & relationship arrow (toTable side) */}
      <RelationshipEndMarker
        point={endpoints.end}
        side={endpoints.endSide}
        cardinality={endCard}
        isSelected={isSelected}
        tableName={toTable.name}
        isSource={false}
        onStartDrag={handleStartDragBadge}
      />

      {/* Draggable Midpoint 1: Move and bend line */}
      <g
        className={`cursor-move ${
          isSelected || relationship.controlPoint1 || relationship.controlPoint2
            ? 'opacity-100'
            : 'opacity-70 group-hover/line:opacity-100'
        }`}
        style={{ pointerEvents: 'all' }}
        onMouseDown={e => handleStartDragPoint(1, e)}
        onDoubleClick={e => {
          e.stopPropagation();
          onUpdate({ ...relationship, controlPoint1: undefined });
        }}
      >
        <title>Punto 1: Arrastra para mover la línea (Doble clic para restablecer)</title>
        {/* Generous 36px interactive hit area */}
        <circle cx={p1.x} cy={p1.y} r={18} fill="#000000" fillOpacity={0} style={{ pointerEvents: 'all' }} />
        <circle
          cx={p1.x}
          cy={p1.y}
          r={6.5}
          className="fill-white dark:fill-slate-900 stroke-[2.5] stroke-amber-500 shadow-md"
          style={{ pointerEvents: 'all' }}
        />
        <circle cx={p1.x} cy={p1.y} r={2.5} className="fill-amber-500 pointer-events-none" />
      </g>

      {/* Draggable Midpoint 2: Move and bend line */}
      <g
        className={`cursor-move ${
          isSelected || relationship.controlPoint1 || relationship.controlPoint2
            ? 'opacity-100'
            : 'opacity-70 group-hover/line:opacity-100'
        }`}
        style={{ pointerEvents: 'all' }}
        onMouseDown={e => handleStartDragPoint(2, e)}
        onDoubleClick={e => {
          e.stopPropagation();
          onUpdate({ ...relationship, controlPoint2: undefined });
        }}
      >
        <title>Punto 2: Arrastra para mover la línea (Doble clic para restablecer)</title>
        {/* Generous 36px interactive hit area */}
        <circle cx={p2.x} cy={p2.y} r={18} fill="#000000" fillOpacity={0} style={{ pointerEvents: 'all' }} />
        <circle
          cx={p2.x}
          cy={p2.y}
          r={6.5}
          className="fill-white dark:fill-slate-900 stroke-[2.5] stroke-amber-500 shadow-md"
          style={{ pointerEvents: 'all' }}
        />
        <circle cx={p2.x} cy={p2.y} r={2.5} className="fill-amber-500 pointer-events-none" />
      </g>

      {/* Middle Interactive Badge / Floating Controller */}
      <foreignObject
        x={mid.x - 210}
        y={mid.y - 18}
        width={420}
        height={130}
        className="overflow-visible pointer-events-auto"
      >
        <div className="flex flex-col items-center justify-center">
          <div
            onMouseDown={handleStartDragBadge}
            onDoubleClick={e => {
              e.stopPropagation();
              onUpdate({ ...relationship, controlPoint1: undefined, controlPoint2: undefined });
            }}
            title="Arrastra el texto para mover la conexión • Clic para opciones • Doble clic para restablecer"
            data-popup-trigger="true"
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-tight flex items-center gap-1.5 shadow-sm border transition-all select-none ${
              isDraggingBadge
                ? 'bg-amber-500 text-slate-950 border-amber-600 scale-110 cursor-grabbing ring-2 ring-amber-400 shadow-md z-30'
                : isSelected || isMenuOpen
                ? 'bg-amber-500 text-slate-950 border-amber-600 scale-105 cursor-grab hover:scale-110'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-amber-500 hover:scale-105 cursor-grab'
            }`}
          >
            <span>{relationship.cardinality}</span>
            <span className={`text-[9px] font-semibold px-1 py-0.2 rounded border-l border-current/20 ${
              (relationship.onDelete || 'CASCADE') === 'CASCADE'
                ? 'text-rose-600 dark:text-rose-400'
                : (relationship.onDelete) === 'SET NULL'
                ? 'text-blue-600 dark:text-blue-400'
                : (relationship.onDelete) === 'SET DEFAULT'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}>
              ON DEL: {relationship.onDelete || 'CASCADE'}
              {relationship.onDelete === 'SET DEFAULT' && relationship.defaultValue !== undefined && relationship.defaultValue !== ''
                ? ` (${relationship.defaultValue})`
                : ''}
            </span>
            {relationship.label && (
              <span className="font-sans font-medium text-[9px] opacity-80 border-l border-current/20 pl-1 max-w-[50px] truncate">
                {relationship.label}
              </span>
            )}
          </div>

          {/* Quick Context Popup on click */}
          {isMenuOpen && (
            <div
              data-popup="true"
              data-dropdown="true"
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
              className="mt-1.5 p-1.5 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 z-[150] text-xs animate-in fade-in zoom-in-95 duration-100 max-w-[390px]"
            >
              <div className="flex items-center gap-1.5">
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
                  {(['CASCADE', 'SET NULL', 'SET DEFAULT', 'RESTRICT', 'NO ACTION'] as OnDeleteAction[]).map(act => {
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
                              : act === 'SET DEFAULT'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : act === 'RESTRICT'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'bg-slate-700 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {act === 'SET NULL' ? 'NULL' : act === 'SET DEFAULT' ? 'DEFAULT' : act}
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

                {/* Reset custom curve points if modified */}
                {(relationship.controlPoint1 || relationship.controlPoint2) && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onUpdate({ ...relationship, controlPoint1: undefined, controlPoint2: undefined });
                    }}
                    title="Restablecer trayectoria original de la línea"
                    className="px-1.5 py-0.5 rounded hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 transition-colors shrink-0 flex items-center gap-1 text-[10px]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">Restablecer</span>
                  </button>
                )}

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

              {/* Default Value Input when ON DELETE SET DEFAULT is selected */}
              {relationship.onDelete === 'SET DEFAULT' && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 bg-emerald-50/70 dark:bg-emerald-950/40 px-2 py-1.5 rounded-md animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 shrink-0">
                      Valor DEFAULT:
                    </span>
                    <input
                      type="text"
                      value={relationship.defaultValue ?? ''}
                      onClick={e => e.stopPropagation()}
                      onMouseDown={e => e.stopPropagation()}
                      onChange={e => {
                        e.stopPropagation();
                        onUpdate({ ...relationship, defaultValue: e.target.value });
                      }}
                      placeholder="ej. 0, 'sin_asignar', 1"
                      className="flex-1 min-w-[120px] max-w-[190px] px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none border border-emerald-300 dark:border-emerald-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                    SET DEFAULT
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
};
