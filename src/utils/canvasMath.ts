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
  endSide: 'left' | 'right' | 'top' | 'bottom'
): { path: string; mid: Point } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  const curvature = Math.min(Math.max(distance * 0.4, 40), 160);

  let cp1 = { ...start };
  let cp2 = { ...end };

  if (startSide === 'right') cp1.x += curvature;
  if (startSide === 'left') cp1.x -= curvature;
  if (startSide === 'bottom') cp1.y += curvature;
  if (startSide === 'top') cp1.y -= curvature;

  if (endSide === 'right') cp2.x += curvature;
  if (endSide === 'left') cp2.x -= curvature;
  if (endSide === 'bottom') cp2.y += curvature;
  if (endSide === 'top') cp2.y -= curvature;

  // Midpoint approximation on cubic bezier (t = 0.5)
  const midX = 0.125 * start.x + 0.375 * cp1.x + 0.375 * cp2.x + 0.125 * end.x;
  const midY = 0.125 * start.y + 0.375 * cp1.y + 0.375 * cp2.y + 0.125 * end.y;

  const path = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;

  return { path, mid: { x: midX, y: midY } };
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
