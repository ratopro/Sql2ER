import { TableNode, Column, Relationship, OnDeleteAction, TableThemeColor } from '../types/erd';
import { TABLE_WIDTH } from './canvasMath';

export interface SqlParseResult {
  tables: TableNode[];
  relationships: Relationship[];
  errors: string[];
  warnings: string[];
}

const PALETTE: TableThemeColor[] = ['indigo', 'emerald', 'purple', 'cyan', 'amber', 'rose', 'teal', 'slate'];

/**
 * Strips SQL comments (-- and /* *\/) and cleans whitespace
 */
function cleanSql(sql: string): string {
  // Remove multi-line comments
  let cleaned = sql.replace(/\/\*[\s\S]*?\*\//g, ' ');
  // Remove single line comments
  cleaned = cleaned.replace(/--.*$/gm, ' ');
  return cleaned;
}

/**
 * Cleans identifiers by removing backticks, double quotes, and square brackets
 */
function cleanIdentifier(id: string): string {
  return id.trim().replace(/^[`"\[]|[`"\]]$/g, '').trim();
}

/**
 * Splits a comma-separated list of items handling nested parentheses
 * e.g. "id INT, price DECIMAL(10,2), CONSTRAINT fk FOREIGN KEY (x) REFERENCES y(z)"
 */
function splitSqlArguments(text: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuote) {
      current += char;
      if (char === quoteChar && text[i - 1] !== '\\') {
        inQuote = false;
      }
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      inQuote = true;
      quoteChar = char;
      current += char;
      continue;
    }

    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      if (current.trim()) {
        parts.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

/**
 * Extracts ON DELETE action from a constraint string
 */
function extractOnDelete(str: string): OnDeleteAction | undefined {
  const match = str.match(/ON\s+DELETE\s+(CASCADE|SET\s+NULL|SET\s+DEFAULT|DEFAULT|RESTRICT|NO\s+ACTION)/i);
  if (!match) return undefined;
  const val = match[1].toUpperCase().replace(/\s+/g, ' ');
  if (val === 'SET NULL') return 'SET NULL';
  if (val === 'SET DEFAULT' || val === 'DEFAULT') return 'SET DEFAULT';
  if (val === 'RESTRICT') return 'RESTRICT';
  if (val === 'NO ACTION') return 'NO ACTION';
  return 'CASCADE';
}

/**
 * Parses raw SQL DDL code into ERD tables and relationships
 */
export function parseSqlDdl(rawSql: string): SqlParseResult {
  const tables: TableNode[] = [];
  const relationships: Relationship[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  const cleaned = cleanSql(rawSql);

  // 1. Find all CREATE TABLE statements
  const createTableRegex = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([`"\[]?\w+[`"\]]?(?:\.[`"\[]?\w+[`"\]]?)?)\s*\(([\s\S]*?)\)(?:[^;]*;?)/gi;
  let match: RegExpExecArray | null;

  while ((match = createTableRegex.exec(cleaned)) !== null) {
    const rawTableName = match[1];
    const rawBody = match[2];

    const parts = rawTableName.split('.');
    const tableName = cleanIdentifier(parts[parts.length - 1]).toLowerCase();

    if (!tableName) continue;

    const tableId = 'tbl_' + tableName;
    const columns: Column[] = [];
    const tableConstraints: {
      type: 'PK' | 'FK' | 'UQ';
      fromCols: string[];
      targetTable?: string;
      toCols?: string[];
      onDelete?: OnDeleteAction;
    }[] = [];

    const itemTokens = splitSqlArguments(rawBody);

    itemTokens.forEach((token, idx) => {
      const trimmed = token.trim();
      if (!trimmed) return;

      // Check for table-level PRIMARY KEY constraint
      const pkTableMatch = trimmed.match(/^(?:CONSTRAINT\s+[`"\[]?\w+[`"\]]?\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (pkTableMatch) {
        const pkCols = pkTableMatch[1].split(',').map(c => cleanIdentifier(c).toLowerCase());
        tableConstraints.push({ type: 'PK', fromCols: pkCols });
        return;
      }

      // Check for table-level FOREIGN KEY constraint
      const fkTableMatch = trimmed.match(/^(?:CONSTRAINT\s+[`"\[]?\w+[`"\]]?\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([`"\[]?\w+[`"\]]?(?:\.[`"\[]?\w+[`"\]]?)?)\s*\(([^)]+)\)([\s\S]*)/i);
      if (fkTableMatch) {
        const fromCols = fkTableMatch[1].split(',').map(c => cleanIdentifier(c).toLowerCase());
        const refTableRaw = fkTableMatch[2].split('.').pop() || '';
        const targetTable = cleanIdentifier(refTableRaw).toLowerCase();
        const toCols = fkTableMatch[3].split(',').map(c => cleanIdentifier(c).toLowerCase());
        const onDelete = extractOnDelete(fkTableMatch[4]);

        tableConstraints.push({
          type: 'FK',
          fromCols,
          targetTable,
          toCols,
          onDelete: onDelete || 'CASCADE',
        });
        return;
      }

      // Check for table-level UNIQUE constraint
      const uqTableMatch = trimmed.match(/^(?:CONSTRAINT\s+[`"\[]?\w+[`"\]]?\s+)?UNIQUE\s*\(([^)]+)\)/i);
      if (uqTableMatch) {
        const uqCols = uqTableMatch[1].split(',').map(c => cleanIdentifier(c).toLowerCase());
        tableConstraints.push({ type: 'UQ', fromCols: uqCols });
        return;
      }

      // Skip CHECK or other table-level constraints for column parsing
      if (/^(?:CONSTRAINT\s+[`"\[]?\w+[`"\]]?\s+)?CHECK\s*\(/i.test(trimmed)) {
        return;
      }

      // Otherwise, parse as Column definition
      // Format: col_name data_type[(len)] [options...]
      const colMatch = trimmed.match(/^([`"\[]?\w+[`"\]]?)\s+([A-Za-z]+)(?:\s*\(([^)]+)\))?([\s\S]*)/i);
      if (!colMatch) {
        warnings.push(`No se pudo interpretar el elemento: "${trimmed.slice(0, 50)}..."`);
        return;
      }

      const colName = cleanIdentifier(colMatch[1]).toLowerCase();
      let colType = colMatch[2].toUpperCase();
      let colLength = colMatch[3] ? colMatch[3].trim() : undefined;
      let colDecimals: string | undefined = undefined;

      if (colType === 'DECIMAL' && colLength && colLength.includes(',')) {
        const parts = colLength.split(',').map(s => s.trim());
        colLength = parts[0];
        colDecimals = parts[1];
      }

      const rest = colMatch[4] || '';

      // Standardize types
      if (colType === 'SERIAL' || colType === 'BIGSERIAL') {
        colType = colType === 'BIGSERIAL' ? 'BIGINT' : 'INT';
      }

      const isPKInline = /\bPRIMARY\s+KEY\b/i.test(rest);
      const isAutoIncrement = /\b(AUTO_INCREMENT|AUTOINCREMENT|SERIAL|BIGSERIAL|IDENTITY)\b/i.test(trimmed);
      const isNullable = !/\bNOT\s+NULL\b/i.test(rest) && !isPKInline;
      const isUniqueInline = /\bUNIQUE\b/i.test(rest);

      // Extract inline default
      let defaultValue: string | undefined = undefined;
      const defMatch = rest.match(/\bDEFAULT\s+('([^']*)'|"([^"]*)"|[\w()]+)/i);
      if (defMatch) {
        defaultValue = defMatch[1];
      }

      // Extract inline REFERENCES
      let inlineFkTable: string | undefined = undefined;
      let inlineFkCol: string | undefined = undefined;
      let inlineOnDelete: OnDeleteAction | undefined = undefined;

      const inlineRefMatch = rest.match(/\bREFERENCES\s+([`"\[]?\w+[`"\]]?(?:\.[`"\[]?\w+[`"\]]?)?)\s*(?:\(([^)]+)\))?([\s\S]*)/i);
      if (inlineRefMatch) {
        inlineFkTable = cleanIdentifier(inlineRefMatch[1].split('.').pop() || '').toLowerCase();
        inlineFkCol = inlineRefMatch[2] ? cleanIdentifier(inlineRefMatch[2]).toLowerCase() : 'id';
        inlineOnDelete = extractOnDelete(inlineRefMatch[3]) || 'CASCADE';
      }

      const colId = `c_${tableId}_${colName}`;

      columns.push({
        id: colId,
        name: colName,
        type: colType,
        length: colLength,
        decimals: colDecimals,
        isPK: isPKInline,
        isFK: !!inlineFkTable,
        isNullable,
        isUnique: isUniqueInline,
        isAutoIncrement,
        defaultValue,
        onDelete: inlineOnDelete,
      });

      if (inlineFkTable) {
        tableConstraints.push({
          type: 'FK',
          fromCols: [colName],
          targetTable: inlineFkTable,
          toCols: [inlineFkCol || 'id'],
          onDelete: inlineOnDelete || 'CASCADE',
        });
      }
    });

    // Apply table-level constraints to columns
    tableConstraints.forEach(tc => {
      if (tc.type === 'PK') {
        tc.fromCols.forEach(colName => {
          const col = columns.find(c => c.name === colName);
          if (col) {
            col.isPK = true;
            col.isNullable = false;
          }
        });
      } else if (tc.type === 'UQ') {
        tc.fromCols.forEach(colName => {
          const col = columns.find(c => c.name === colName);
          if (col) col.isUnique = true;
        });
      } else if (tc.type === 'FK' && tc.targetTable) {
        tc.fromCols.forEach(colName => {
          const col = columns.find(c => c.name === colName);
          if (col) {
            col.isFK = true;
            if (tc.onDelete) col.onDelete = tc.onDelete;
          }
        });
      }
    });

    const colorIndex = tables.length % PALETTE.length;
    const newTable: TableNode = {
      id: tableId,
      name: tableName,
      color: PALETTE[colorIndex],
      x: 0,
      y: 0,
      width: TABLE_WIDTH,
      columns: columns.length > 0 ? columns : [
        { id: `c_${tableId}_id`, name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, isUnique: true, isAutoIncrement: true }
      ],
    };

    // Save table-level FK constraints for post-processing relationships
    (newTable as any)._pendingFks = tableConstraints.filter(tc => tc.type === 'FK');
    tables.push(newTable);
  }

  // 2. Parse ALTER TABLE ... ADD CONSTRAINT / FOREIGN KEY statements
  const alterFkRegex = /ALTER\s+TABLE\s+([`"\[]?\w+[`"\]]?(?:\.[`"\[]?\w+[`"\]]?)?)\s+ADD\s+(?:CONSTRAINT\s+[`"\[]?\w+[`"\]]?\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([`"\[]?\w+[`"\]]?(?:\.[`"\[]?\w+[`"\]]?)?)\s*\(([^)]+)\)([\s\S]*?)(?:;|$)/gi;
  let alterMatch: RegExpExecArray | null;

  while ((alterMatch = alterFkRegex.exec(cleaned)) !== null) {
    const rawSrcTable = alterMatch[1].split('.').pop() || '';
    const srcTable = cleanIdentifier(rawSrcTable).toLowerCase();
    const fromColName = cleanIdentifier(alterMatch[2]).toLowerCase();
    const rawTargetTable = alterMatch[3].split('.').pop() || '';
    const targetTable = cleanIdentifier(rawTargetTable).toLowerCase();
    const toColName = cleanIdentifier(alterMatch[4]).toLowerCase();
    const onDelete = extractOnDelete(alterMatch[5]) || 'CASCADE';

    const tableObj = tables.find(t => t.name === srcTable);
    if (tableObj) {
      if (!(tableObj as any)._pendingFks) (tableObj as any)._pendingFks = [];
      (tableObj as any)._pendingFks.push({
        type: 'FK',
        fromCols: [fromColName],
        targetTable,
        toCols: [toColName],
        onDelete,
      });

      const col = tableObj.columns.find(c => c.name === fromColName);
      if (col) {
        col.isFK = true;
        col.onDelete = onDelete;
      }
    }
  }

  // 3. Resolve all pending Foreign Keys into Relationship edges
  tables.forEach(sourceTable => {
    const pendingFks = (sourceTable as any)._pendingFks || [];
    pendingFks.forEach((fk: any, idx: number) => {
      const targetTable = tables.find(t => t.name === fk.targetTable);
      if (!targetTable) return;

      const fromColName = fk.fromCols[0];
      const toColName = fk.toCols ? fk.toCols[0] : 'id';

      const fromCol = sourceTable.columns.find(c => c.name === fromColName);
      const toCol = targetTable.columns.find(c => c.name === toColName);

      const relId = `rel_${sourceTable.name}_${fromColName}_to_${targetTable.name}`;

      // Check duplicate
      if (relationships.some(r => r.id === relId)) return;

      relationships.push({
        id: relId,
        fromTableId: sourceTable.id,
        fromColumnId: fromCol?.id,
        toTableId: targetTable.id,
        toColumnId: toCol?.id,
        cardinality: fromCol?.isUnique ? '1:1' : 'N:1',
        onDelete: fk.onDelete || 'CASCADE',
        label: `${fromColName} -> ${toColName}`,
      });
    });

    delete (sourceTable as any)._pendingFks;
  });

  // 4. Auto-layout tables in a spacious grid
  const COLS_PER_ROW = tables.length > 6 ? 4 : tables.length > 3 ? 3 : 2;
  const SPACING_X = 400;
  const SPACING_Y = 320;
  const START_X = 100;
  const START_Y = 120;

  tables.forEach((t, i) => {
    const colIndex = i % COLS_PER_ROW;
    const rowIndex = Math.floor(i / COLS_PER_ROW);
    t.x = START_X + colIndex * SPACING_X;
    t.y = START_Y + rowIndex * SPACING_Y;
  });

  if (tables.length === 0) {
    errors.push('No se detectaron sentencias CREATE TABLE válidas en el código SQL.');
  }

  return {
    tables,
    relationships,
    errors,
    warnings,
  };
}
