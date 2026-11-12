import { TableNode, Column } from '../types/erd';

export const TABLE_WIDTH = 380;
export const HEADER_HEIGHT = 44;
export const COL_HEADER_HEIGHT = 22;
export const ROW_HEIGHT = 36;
export const FOOTER_HEIGHT = 36;

export function getTableHeight(table: TableNode, scaleMultiplier: number = 1): number {
  const header = Math.round(HEADER_HEIGHT * scaleMultiplier);
  const colHeader = Math.round(COL_HEADER_HEIGHT * scaleMultiplier);
  const row = Math.round(ROW_HEIGHT * scaleMultiplier);
  const footer = Math.round(FOOTER_HEIGHT * scaleMultiplier);
  return header + colHeader + table.columns.length * row + footer;
}

export function getColumnYOffset(table: TableNode, columnId?: string, scaleMultiplier: number = 1): number {
  if (!columnId) return getTableHeight(table, scaleMultiplier) / 2;
  const index = table.columns.findIndex(c => c.id === columnId);
  if (index === -1) return getTableHeight(table, scaleMultiplier) / 2;
  const header = Math.round(HEADER_HEIGHT * scaleMultiplier);
  const colHeader = Math.round(COL_HEADER_HEIGHT * scaleMultiplier);
  const row = Math.round(ROW_HEIGHT * scaleMultiplier);
  return header + colHeader + index * row + row / 2;
}

export interface Point {
  x: number;
  y: number;
}

export interface ConnectorEndpoints {
  start: Point;
  end: Point;
  startSide: 'left' | 'right' | 'top' | 'bottom';
  endSide: 'left' | 'right' | 'top' | 'bottom';
}

export function computeConnectorEndpoints(
  fromTable: TableNode,
  toTable: TableNode,
  fromColId?: string,
  toColId?: string,
  scaleMultiplier: number = 1
): ConnectorEndpoints {
  const fromWidth = (fromTable.width || TABLE_WIDTH) * scaleMultiplier;
  const toWidth = (toTable.width || TABLE_WIDTH) * scaleMultiplier;
  const fromHeight = getTableHeight(fromTable, scaleMultiplier);
  const toHeight = getTableHeight(toTable, scaleMultiplier);

  const fromCenter = { x: fromTable.x + fromWidth / 2, y: fromTable.y + fromHeight / 2 };
  const toCenter = { x: toTable.x + toWidth / 2, y: toTable.y + toHeight / 2 };

  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;

  const fromY = fromTable.y + getColumnYOffset(fromTable, fromColId, scaleMultiplier);
  const toY = toTable.y + getColumnYOffset(toTable, toColId, scaleMultiplier);

  // Determine optimal sides based on relative position
  if (Math.abs(dx) > Math.abs(dy) * 0.7) {
    if (dx > 0) {
      // from is to the left of to
      return {
        start: { x: fromTable.x + fromWidth, y: fromY },
        end: { x: toTable.x, y: toY },
        startSide: 'right',
        endSide: 'left',
      };
    } else {
      // from is to the right of to
      return {
        start: { x: fromTable.x, y: fromY },
        end: { x: toTable.x + toWidth, y: toY },
        startSide: 'left',
        endSide: 'right',
      };
    }
  } else {
    // Mostly vertical alignment
    if (dy > 0) {
      // from is above to
      return {
        start: { x: fromCenter.x, y: fromTable.y + fromHeight },
        end: { x: toCenter.x, y: toTable.y },
        startSide: 'bottom',
        endSide: 'top',
      };
    } else {
      // from is below to
      return {
        start: { x: fromCenter.x, y: fromTable.y },
        end: { x: toCenter.x, y: toTable.y + toHeight },
        startSide: 'top',
        endSide: 'bottom',
      };
    }
  }
}

export function generateSmoothBezier(
  start: Point,
  end: Point,
  startSide: 'left' | 'right' | 'top' | 'bottom',
  endSide: 'left' | 'right' | 'top' | 'bottom',
  customP1?: Point,
  customP2?: Point
): { path: string; mid: Point; p1: Point; p2: Point } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  const curvature = Math.min(Math.max(distance * 0.4, 40), 160);

  let defaultCp1 = { ...start };
  let defaultCp2 = { ...end };

  if (startSide === 'right') defaultCp1.x += curvature;
  if (startSide === 'left') defaultCp1.x -= curvature;
  if (startSide === 'bottom') defaultCp1.y += curvature;
  if (startSide === 'top') defaultCp1.y -= curvature;

  if (endSide === 'right') defaultCp2.x += curvature;
  if (endSide === 'left') defaultCp2.x -= curvature;
  if (endSide === 'bottom') defaultCp2.y += curvature;
  if (endSide === 'top') defaultCp2.y -= curvature;

  // Compute final cubic Bezier control points (cp1, cp2) smoothly
  let cp1 = { ...defaultCp1 };
  let cp2 = { ...defaultCp2 };

  if (customP1 && customP2) {
    // Both handles customized: solve the 2x2 system so curve passes smoothly through customP1 at t=1/3 and customP2 at t=2/3
    const R1x = 27 * customP1.x - 8 * start.x - end.x;
    const R1y = 27 * customP1.y - 8 * start.y - end.y;
    const R2x = 27 * customP2.x - start.x - 8 * end.x;
    const R2y = 27 * customP2.y - start.y - 8 * end.y;

    cp1 = {
      x: Math.round((2 * R1x - R2x) / 18),
      y: Math.round((2 * R1y - R2y) / 18),
    };
    cp2 = {
      x: Math.round((2 * R2x - R1x) / 18),
      y: Math.round((2 * R2y - R1y) / 18),
    };
  } else if (customP1) {
    // Only handle 1 customized: curve passes through customP1 at t=1/3 with default cp2
    cp1 = {
      x: Math.round((27 * customP1.x - 8 * start.x - 6 * defaultCp2.x - end.x) / 12),
      y: Math.round((27 * customP1.y - 8 * start.y - 6 * defaultCp2.y - end.y) / 12),
    };
  } else if (customP2) {
    // Only handle 2 customized: curve passes through customP2 at t=2/3 with default cp1
    cp2 = {
      x: Math.round((27 * customP2.x - start.x - 6 * defaultCp1.x - 8 * end.x) / 12),
      y: Math.round((27 * customP2.y - start.y - 6 * defaultCp1.y - 8 * end.y) / 12),
    };
  }

  // Consistent cubic Bezier evaluator
  const evalBezier = (t: number): Point => {
    const t1 = 1 - t;
    return {
      x: Math.round(t1 * t1 * t1 * start.x + 3 * t1 * t1 * t * cp1.x + 3 * t1 * t * t * cp2.x + t * t * t * end.x),
      y: Math.round(t1 * t1 * t1 * start.y + 3 * t1 * t1 * t * cp1.y + 3 * t1 * t * t * cp2.y + t * t * t * end.y),
    };
  };

  const p1 = customP1 ? { ...customP1 } : evalBezier(0.33);
  const p2 = customP2 ? { ...customP2 } : evalBezier(0.67);
  const mid = evalBezier(0.5);

  const path = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;

  return { path, mid, p1, p2 };
}

export function computeFitToScreen(
  tables: TableNode[],
  stickies: { x: number; y: number; width: number; height: number }[],
  containerWidth: number,
  containerHeight: number
): { pan: Point; zoom: number } {
  const allElements = [
    ...tables.map(t => ({ x: t.x, y: t.y, width: t.width || TABLE_WIDTH, height: getTableHeight(t) })),
    ...stickies.map(s => ({ x: s.x, y: s.y, width: s.width, height: s.height })),
  ];

  if (allElements.length === 0) {
    return { pan: { x: 100, y: 100 }, zoom: 1 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  allElements.forEach(el => {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  });

  const padding = 120;
  const contentWidth = maxX - minX + padding * 2;
  const contentHeight = maxY - minY + padding * 2;

  const zoomX = containerWidth / contentWidth;
  const zoomY = containerHeight / contentHeight;
  const zoom = Math.min(Math.max(Math.min(zoomX, zoomY), 0.3), 1.4);

  const centerX = minX + (maxX - minX) / 2;
  const centerY = minY + (maxY - minY) / 2;

  const panX = containerWidth / 2 - centerX * zoom;
  const panY = containerHeight / 2 - centerY * zoom;

  return { pan: { x: panX, y: panY }, zoom };
}
