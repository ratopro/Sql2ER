export type Cardinality = '1:1' | '1:N' | 'N:1' | 'N:M' | '0..1:1' | '0..1:N';

export type CanvasTool = 'select' | 'pan' | 'table' | 'connector' | 'sticky' | 'frame' | 'text';

export type TableThemeColor = 'indigo' | 'purple' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'slate' | 'teal';

export type StickyColor = 'yellow' | 'teal' | 'orange' | 'pink' | 'purple' | 'green';

export interface Column {
  id: string;
  name: string;
  type: string;
  length?: string;
  decimals?: string;
  isPK: boolean;
  isFK: boolean;
  isNullable: boolean;
  isUnique: boolean;
  isAutoIncrement?: boolean;
  defaultValue?: string;
  comment?: string;
  modifiers?: string[];
  onDelete?: OnDeleteAction;
}

export type OnDeleteAction = 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';

export interface DatabaseItem {
  id: string;
  name: string;
  color: TableThemeColor;
  description?: string;
  createdAt: string;
}

export interface TableNode {
  id: string;
  databaseId?: string;
  name: string;
  color: TableThemeColor;
  x: number;
  y: number;
  width?: number;
  columns: Column[];
  comment?: string;
}

export interface Relationship {
  id: string;
  fromTableId: string;
  fromColumnId?: string;
  toTableId: string;
  toColumnId?: string;
  cardinality: Cardinality;
  onDelete?: OnDeleteAction;
  defaultValue?: string;
  label?: string;
  routing?: 'curved' | 'orthogonal';
  controlPoint1?: { x: number; y: number };
  controlPoint2?: { x: number; y: number };
}

export interface StickyNode {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: StickyColor;
}

export type FrameBorderStyle = 'solid' | 'dashed' | 'dotted';

export interface FrameNode {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  borderColor?: string;
  bgColor?: string;
  borderWidth?: number;
  borderStyle?: FrameBorderStyle;
}

export type MigrationActionType = 
  | 'ADD_COLUMN'
  | 'DROP_COLUMN'
  | 'MODIFY_COLUMN'
  | 'RENAME_COLUMN'
  | 'ADD_CONSTRAINT'
  | 'DROP_CONSTRAINT'
  | 'CREATE_INDEX'
  | 'CUSTOM_SQL';

export interface MigrationCommand {
  id: string;
  type: MigrationActionType;
  tableName: string;
  columnName?: string;
  columnType?: string;
  constraintName?: string;
  constraintDefinition?: string;
  sqlRaw?: string;
  description: string;
}

export interface SchemaStep {
  id: string;
  stepNumber: number;
  version: string;
  title: string;
  description?: string;
  createdAt: string;
  commands: MigrationCommand[];
  schemaSnapshot: {
    tables: TableNode[];
    relationships: Relationship[];
  };
}

export interface ERDSchema {
  title: string;
  description?: string;
  author?: string;
  databases?: DatabaseItem[];
  activeDatabaseId?: string;
  tables: TableNode[];
  relationships: Relationship[];
  stickies?: StickyNode[];
  frames?: FrameNode[];
  steps?: SchemaStep[];
}

export interface HistoryState {
  databases: DatabaseItem[];
  activeDatabaseId?: string;
  tables: TableNode[];
  relationships: Relationship[];
  stickies: StickyNode[];
  frames: FrameNode[];
  steps: SchemaStep[];
  title: string;
  description?: string;
  author?: string;
}
