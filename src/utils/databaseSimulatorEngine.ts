import alasql from 'alasql';
import { ERDSchema, TableNode, Column, Relationship } from '../types/erd';

export interface SimulatedColumnInfo {
  name: string;
  type: string;
  isPK: boolean;
  isFK: boolean;
  isNullable: boolean;
  isUnique: boolean;
  defaultValue?: string;
  fkTarget?: {
    tableName: string;
    columnName: string;
    onDelete?: string;
  };
}

export interface SimulatedRelationInfo {
  id: string;
  direction: 'outgoing' | 'incoming';
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  cardinality: string;
  onDelete: string;
  defaultValue?: string;
}

export interface SimulatedTableInfo {
  id: string;
  name: string;
  rowCount: number;
  columns: SimulatedColumnInfo[];
  relations: SimulatedRelationInfo[];
  color?: string;
}

export interface SqlDiagnostic {
  valid: boolean;
  severity: 'ok' | 'warning' | 'error';
  line: number;
  column: number;
  offset: number;
  length: number;
  lineText: string;
  message: string;
  hint?: string;
  rawError?: string;
}

export interface QueryExecutionResult {
  success: boolean;
  query: string;
  isSelect: boolean;
  columns: string[];
  rows: any[];
  rowCount: number;
  affectedRows?: number;
  executionTimeMs: number;
  error?: string;
  diagnostic?: SqlDiagnostic;
  message?: string;
}

// Convert user types to safe alasql in-memory SQL types
function mapToAlasqlType(col: Column): string {
  const t = (col.type || 'VARCHAR').toUpperCase().trim();
  if (t.includes('INT') || t.includes('SERIAL')) return 'INT';
  if (t.includes('BOOL')) return 'BOOLEAN';
  if (t.includes('DECIMAL') || t.includes('NUMERIC') || t.includes('FLOAT') || t.includes('DOUBLE')) return 'DECIMAL(10,2)';
  if (t.includes('DATE') || t.includes('TIME')) return 'STRING';
  return 'STRING';
}

// Escape identifier for safe SQL usage
export function escapeIdent(name: string): string {
  const clean = name.trim().replace(/[`"']/g, '');
  return `\`${clean}\``;
}

const DB_NAME = 'relatia_sim_db';

class DatabaseSimulatorEngine {
  private isInitialized = false;
  private currentSchema: ERDSchema | null = null;
  private log: string[] = [];

  public init(schema: ERDSchema): { success: boolean; log: string[]; tablesCount: number } {
    this.currentSchema = schema;
    this.log = [];

    try {
      // Re-create isolated simulation database
      alasql(`DROP DATABASE IF EXISTS ${DB_NAME};`);
      alasql(`CREATE DATABASE ${DB_NAME}; USE ${DB_NAME};`);
      this.log.push(`[OK] Base de datos en memoria '${DB_NAME}' inicializada.`);

      // 1. Create all tables from ERD schema
      for (const table of schema.tables) {
        const colDefs: string[] = [];
        for (const col of table.columns) {
          const safeColName = escapeIdent(col.name);
          const typeStr = mapToAlasqlType(col);
          let def = `${safeColName} ${typeStr}`;
          if (col.isPK) {
            def += ' PRIMARY KEY';
          }
          colDefs.push(def);
        }

        const safeTableName = escapeIdent(table.name);
        const createSql = `CREATE TABLE ${safeTableName} (${colDefs.join(', ')});`;
        alasql(createSql);
        this.log.push(`[OK] Tabla '${table.name}' creada con ${table.columns.length} campos.`);
      }

      // 2. Generate and insert realistic seed data
      this.seedInitialData(schema);

      this.isInitialized = true;
      return {
        success: true,
        log: this.log,
        tablesCount: schema.tables.length,
      };
    } catch (err: any) {
      console.error('Error initializing database simulation:', err);
      this.log.push(`[ERROR] ${err.message || String(err)}`);
      return {
        success: false,
        log: this.log,
        tablesCount: 0,
      };
    }
  }

  // Realistic mock data generator based on common column names & types
  private seedInitialData(schema: ERDSchema) {
    const tableIds = new Map<string, any[]>();

    // Process tables in order of dependencies (tables with no FKs first)
    const sortedTables = [...schema.tables].sort((a, b) => {
      const aHasFk = schema.relationships.some(r => r.fromTableId === a.id);
      const bHasFk = schema.relationships.some(r => r.fromTableId === b.id);
      return (aHasFk ? 1 : 0) - (bHasFk ? 1 : 0);
    });

    for (const table of sortedTables) {
      const rows: any[] = [];
      const rowCount = 4; // Generate 4 realistic rows per table

      for (let i = 1; i <= rowCount; i++) {
        const rowData: Record<string, any> = {};

        for (const col of table.columns) {
          const colNameLower = col.name.toLowerCase();
          const colType = col.type.toUpperCase();

          // Check if this column is a Foreign Key
          const rel = schema.relationships.find(r => r.fromTableId === table.id && r.fromColumnId === col.id);
          if (rel) {
            const targetTable = schema.tables.find(t => t.id === rel.toTableId);
            if (targetTable) {
              const targetPks = tableIds.get(targetTable.id) || [1, 2, 3];
              // Pick an existing PK from target table
              rowData[col.name] = targetPks[(i - 1) % targetPks.length] ?? 1;
              continue;
            }
          }

          // Primary key or id
          if (col.isPK || colNameLower === 'id' || colNameLower.endsWith('_id')) {
            rowData[col.name] = i;
            continue;
          }

          // Smart generators based on column name
          if (colNameLower.includes('name') || colNameLower.includes('nombre')) {
            const names = ['Elena García', 'Marcos Ruiz', 'Lucía Fernández', 'David Morales'];
            const prodNames = ['Smartphone Pro Max', 'Auriculares Inalámbricos', 'Monitor UltraWide 34"', 'Teclado Mecánico RGB'];
            const catNames = ['Electrónica & Gadgets', 'Hogar & Confort', 'Accesorios', 'Gaming'];
            if (table.name.toLowerCase().includes('user') || table.name.toLowerCase().includes('client')) {
              rowData[col.name] = names[i - 1] || `Usuario ${i}`;
            } else if (table.name.toLowerCase().includes('cat')) {
              rowData[col.name] = catNames[i - 1] || `Categoría ${i}`;
            } else {
              rowData[col.name] = prodNames[i - 1] || `Artículo ${i}`;
            }
          } else if (colNameLower.includes('email') || colNameLower.includes('correo')) {
            const emails = ['elena@empresa.com', 'marcos.ruiz@test.es', 'lucia.f@correo.com', 'david.m@dev.org'];
            rowData[col.name] = emails[i - 1] || `contacto${i}@ejemplo.com`;
          } else if (colNameLower.includes('price') || colNameLower.includes('precio') || colNameLower.includes('cost')) {
            const prices = [799.99, 59.50, 349.00, 119.95];
            rowData[col.name] = prices[i - 1] || (i * 25.5);
          } else if (colNameLower.includes('total') || colNameLower.includes('monto') || colNameLower.includes('amount')) {
            const totals = [859.49, 119.95, 349.00, 24.90];
            rowData[col.name] = totals[i - 1] || (i * 50);
          } else if (colNameLower.includes('stock') || colNameLower.includes('cant') || colNameLower.includes('qty')) {
            const stocks = [45, 120, 8, 200];
            rowData[col.name] = stocks[i - 1] || (i * 10);
          } else if (colNameLower.includes('status') || colNameLower.includes('estado')) {
            const statuses = ['completado', 'pendiente', 'en_proceso', 'entregado'];
            rowData[col.name] = statuses[i - 1] || 'activo';
          } else if (colNameLower.includes('role') || colNameLower.includes('rol')) {
            const roles = ['admin', 'cliente', 'moderador', 'cliente'];
            rowData[col.name] = roles[i - 1] || 'usuario';
          } else if (colNameLower.includes('date') || colNameLower.includes('fecha') || colNameLower.includes('created') || colNameLower.includes('at')) {
            rowData[col.name] = `2026-11-0${i} 10:${15 * i}:00`;
          } else if (colType.includes('BOOL') || colNameLower.startsWith('is_') || colNameLower.startsWith('has_')) {
            rowData[col.name] = i % 2 !== 0;
          } else if (colNameLower.includes('slug')) {
            rowData[col.name] = `item-${i}-slug`;
          } else if (colNameLower.includes('sku') || colNameLower.includes('code') || colNameLower.includes('codigo')) {
            rowData[col.name] = `SKU-2026-${1000 + i}`;
          } else if (colNameLower.includes('desc') || colNameLower.includes('detail')) {
            rowData[col.name] = `Descripción detallada del registro #${i} para pruebas.`;
          } else if (colType.includes('INT')) {
            rowData[col.name] = i * 10;
          } else {
            rowData[col.name] = `Dato ${i}`;
          }
        }

        rows.push(rowData);
      }

      // Record PKs for dependent tables
      const pkCol = table.columns.find(c => c.isPK) || table.columns[0];
      if (pkCol) {
        tableIds.set(table.id, rows.map(r => r[pkCol.name]));
      }

      // Insert into alasql
      try {
        const safeTableName = escapeIdent(table.name);
        for (const row of rows) {
          const cols = Object.keys(row).map(c => escapeIdent(c)).join(', ');
          const vals = Object.values(row).map(v => {
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
            if (v === null || v === undefined) return 'NULL';
            return v;
          }).join(', ');

          alasql(`INSERT INTO ${safeTableName} (${cols}) VALUES (${vals});`);
        }
        this.log.push(`[OK] Insertadas ${rows.length} filas de prueba en '${table.name}'.`);
      } catch (insertErr: any) {
        console.warn(`Could not seed data for table ${table.name}:`, insertErr);
      }
    }
  }

  // Execute arbitrary SQL statement(s) written by the user
  public execute(rawSql: string): QueryExecutionResult {
    const startTime = performance.now();
    const query = rawSql.trim();

    if (!query) {
      return {
        success: false,
        query: '',
        isSelect: false,
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: 0,
        error: 'Por favor ingresa una consulta SQL válida.',
      };
    }

    try {
      // Ensure we are using our simulation database
      alasql(`USE ${DB_NAME};`);

      // Execute query
      const result = alasql(query);
      const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

      // Handle multi-statement array or single statement
      let finalResult = result;
      if (Array.isArray(result) && result.length > 0 && Array.isArray(result[result.length - 1])) {
        finalResult = result[result.length - 1];
      }

      // Determine if result is tabular (SELECT)
      if (Array.isArray(finalResult)) {
        const rows = finalResult;
        const columns = rows.length > 0 && typeof rows[0] === 'object' && rows[0] !== null
          ? Object.keys(rows[0])
          : [];

        return {
          success: true,
          query,
          isSelect: true,
          columns,
          rows,
          rowCount: rows.length,
          executionTimeMs,
          message: `${rows.length} fila${rows.length === 1 ? '' : 's'} devuelta${rows.length === 1 ? '' : 's'} en ${executionTimeMs} ms.`,
        };
      }

      // Non-SELECT (INSERT, UPDATE, DELETE, CREATE, DROP, ALTER)
      const affected = typeof finalResult === 'number' ? finalResult : undefined;
      const upper = query.toUpperCase();
      let action = 'Instrucción ejecutada con éxito.';
      if (upper.startsWith('INSERT')) action = `Registro insertado correctamente (${affected !== undefined ? affected : 1} fila afectada).`;
      else if (upper.startsWith('UPDATE')) action = `Registros actualizados (${affected !== undefined ? affected : 1} filas afectadas).`;
      else if (upper.startsWith('DELETE')) action = `Registros eliminados (${affected !== undefined ? affected : 1} filas afectadas).`;
      else if (upper.startsWith('CREATE TABLE')) action = 'Tabla creada correctamente en la base de datos simulada.';
      else if (upper.startsWith('DROP TABLE')) action = 'Tabla eliminada de la simulación.';
      else if (upper.startsWith('ALTER TABLE')) action = 'Estructura de tabla modificada.';

      return {
        success: true,
        query,
        isSelect: false,
        columns: [],
        rows: [],
        rowCount: 0,
        affectedRows: affected,
        executionTimeMs,
        message: `${action} Tiempo: ${executionTimeMs} ms.`,
      };
    } catch (err: any) {
      const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
      const diag = this.validateSql(rawSql, this.currentSchema || undefined);
      const errorMsg = diag && !diag.valid
        ? `Línea ${diag.line}, Columna ${diag.column}: ${diag.message}`
        : (err.message || String(err));
      return {
        success: false,
        query,
        isSelect: false,
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs,
        error: errorMsg,
        diagnostic: diag && !diag.valid ? diag : undefined,
      };
    }
  }

  // Compute exact 1-based line, column, and 0-based offset from an offset in rawSql
  private offsetToLineCol(sql: string, offset: number): { line: number; column: number; lineText: string } {
    const safeOffset = Math.max(0, Math.min(offset, sql.length));
    const lines = sql.split('\n');
    let running = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i].length;
      if (safeOffset <= running + lineLen || i === lines.length - 1) {
        return {
          line: i + 1,
          column: safeOffset - running + 1,
          lineText: lines[i],
        };
      }
      running += lineLen + 1; // +1 for '\n'
    }
    return { line: 1, column: 1, lineText: lines[0] || '' };
  }

  private lineColToOffset(sql: string, line: number, column: number): number {
    const lines = sql.split('\n');
    let offset = 0;
    for (let i = 0; i < Math.min(line - 1, lines.length); i++) {
      offset += lines[i].length + 1;
    }
    const targetLine = lines[line - 1] || '';
    return offset + Math.max(0, Math.min(column - 1, targetLine.length));
  }

  // Lexical pre-check for unclosed quotes/backticks and unmatched parentheses
  private checkLexicalBalance(sql: string): SqlDiagnostic | null {
    const parenStack: number[] = [];
    let quoteChar: "'" | '"' | '`' | null = null;
    let quoteStartOffset = 0;
    let inLineComment = false;
    let inBlockComment = false;

    for (let i = 0; i < sql.length; i++) {
      const ch = sql[i];
      const next = sql[i + 1];

      if (inLineComment) {
        if (ch === '\n') inLineComment = false;
        continue;
      }
      if (inBlockComment) {
        if (ch === '*' && next === '/') {
          inBlockComment = false;
          i++;
        }
        continue;
      }

      if (quoteChar) {
        if (ch === '\\' && next) {
          i++;
          continue;
        }
        if (ch === quoteChar) {
          if (next === quoteChar) {
            i++; // escaped doubled quote
            continue;
          }
          quoteChar = null;
        }
        continue;
      }

      if (ch === '-' && next === '-') {
        inLineComment = true;
        i++;
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        i++;
        continue;
      }

      if (ch === "'" || ch === '"' || ch === '`') {
        quoteChar = ch;
        quoteStartOffset = i;
        continue;
      }

      if (ch === '(') {
        parenStack.push(i);
      } else if (ch === ')') {
        if (parenStack.length === 0) {
          const pos = this.offsetToLineCol(sql, i);
          return {
            valid: false,
            severity: 'error',
            line: pos.line,
            column: pos.column,
            offset: i,
            length: 1,
            lineText: pos.lineText,
            message: "Paréntesis de cierre ')' inesperado sin su apertura '(' correspondiente.",
            hint: "Elimina este ')' sobrante o añade un '(' antes.",
          };
        }
        parenStack.pop();
      }
    }

    if (quoteChar) {
      const pos = this.offsetToLineCol(sql, quoteStartOffset);
      const label = quoteChar === "'" ? "Comilla simple (')" : quoteChar === '"' ? 'Comilla doble (")' : 'Acento grave (`)';
      return {
        valid: false,
        severity: 'error',
        line: pos.line,
        column: pos.column,
        offset: quoteStartOffset,
        length: 1,
        lineText: pos.lineText,
        message: `${label} sin cerrar.`,
        hint: `Cierra el texto o identificador con ${quoteChar} antes de finalizar la consulta.`,
      };
    }

    if (inBlockComment) {
      const start = sql.lastIndexOf('/*');
      const pos = this.offsetToLineCol(sql, Math.max(0, start));
      return {
        valid: false,
        severity: 'error',
        line: pos.line,
        column: pos.column,
        offset: Math.max(0, start),
        length: 2,
        lineText: pos.lineText,
        message: "Comentario de bloque '/*' sin cerrar.",
        hint: "Añade '*/' para cerrar el comentario.",
      };
    }

    if (parenStack.length > 0) {
      const unclosedOffset = parenStack[parenStack.length - 1];
      const pos = this.offsetToLineCol(sql, unclosedOffset);
      return {
        valid: false,
        severity: 'error',
        line: pos.line,
        column: pos.column,
        offset: unclosedOffset,
        length: 1,
        lineText: pos.lineText,
        message: "Paréntesis '(' sin cerrar.",
        hint: "Añade el paréntesis de cierre ')' correspondiente.",
      };
    }

    return null;
  }

  // Locate a token (table/column name) outside strings and comments
  private findIdentifierPosition(sql: string, identifier: string): { line: number; column: number; offset: number; length: number; lineText: string } {
    const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:\`${escaped}\`|"${escaped}"|\\b${escaped}\\b)`, 'gi');

    // Build mask of string/comment ranges
    const masked = new Uint8Array(sql.length);
    let q: string | null = null;
    let inLine = false;
    let inBlock = false;
    for (let i = 0; i < sql.length; i++) {
      const ch = sql[i];
      const nx = sql[i + 1];
      if (inLine) {
        masked[i] = 1;
        if (ch === '\n') inLine = false;
        continue;
      }
      if (inBlock) {
        masked[i] = 1;
        if (ch === '*' && nx === '/') {
          masked[i + 1] = 1;
          inBlock = false;
          i++;
        }
        continue;
      }
      if (q) {
        masked[i] = 1;
        if (ch === '\\' && nx) {
          masked[i + 1] = 1;
          i++;
          continue;
        }
        if (ch === q) {
          if (nx === q) {
            masked[i + 1] = 1;
            i++;
          } else {
            q = null;
          }
        }
        continue;
      }
      if (ch === '-' && nx === '-') {
        masked[i] = 1;
        inLine = true;
        continue;
      }
      if (ch === '/' && nx === '*') {
        masked[i] = 1;
        inBlock = true;
        continue;
      }
      if (ch === "'" || ch === '"') {
        masked[i] = 1;
        q = ch;
      }
    }

    let match: RegExpExecArray | null;
    while ((match = regex.exec(sql)) !== null) {
      if (!masked[match.index]) {
        const pos = this.offsetToLineCol(sql, match.index);
        return {
          ...pos,
          offset: match.index,
          length: match[0].length,
        };
      }
    }
    const fallback = this.offsetToLineCol(sql, 0);
    return { ...fallback, offset: 0, length: identifier.length };
  }

  private findClosestMatch(target: string, candidates: string[]): string | null {
    const t = target.toLowerCase();
    let best: string | null = null;
    let bestDist = Infinity;
    for (const cand of candidates) {
      const c = cand.toLowerCase();
      if (c === t) return cand;
      const dist = this.levenshtein(t, c);
      if (dist < bestDist && dist <= Math.max(2, Math.floor(c.length / 2))) {
        bestDist = dist;
        best = cand;
      }
    }
    return best;
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  // Format Jison parser error into exact line/column & Spanish explanation
  private parseAlasqlSyntaxError(sql: string, errMsg: string): SqlDiagnostic {
    const lines = sql.split('\n');
    const lineMatch = errMsg.match(/Parse error on line (\d+):/);
    const lineNum = lineMatch ? Math.max(1, Math.min(parseInt(lineMatch[1], 10), lines.length)) : 1;

    const msgLines = errMsg.split('\n');
    const caretLineIdx = msgLines.findIndex(l => /^-*\^$/.test(l));
    let col = 1;

    if (caretLineIdx >= 1) {
      const snippetLine = msgLines[caretLineIdx - 1];
      const caretPosInSnippet = msgLines[caretLineIdx].indexOf('^');
      let beforeCaret = snippetLine.slice(0, caretPosInSnippet);
      if (beforeCaret.startsWith('...')) beforeCaret = beforeCaret.slice(3);

      const uncommented = ((alasql as any).utils?.uncomment?.(sql) ?? sql) as string;
      const uLines = uncommented.split('\n');
      let flat = '';
      const map: { line: number; col: number }[] = [];
      for (let l = 0; l < Math.min(lineNum, uLines.length); l++) {
        const text = uLines[l];
        for (let c = 0; c < text.length; c++) {
          flat += text[c];
          map.push({ line: l + 1, col: c + 1 });
        }
      }

      if (beforeCaret.length > 0) {
        let searchFrom = flat.length;
        while (searchFrom >= 0) {
          const idx = flat.lastIndexOf(beforeCaret, searchFrom);
          if (idx === -1) break;
          const endIdx = idx + beforeCaret.length;
          const targetLine = endIdx < map.length ? map[endIdx].line : lineNum;
          if (targetLine === lineNum) {
            col = endIdx < map.length ? map[endIdx].col : (uLines[lineNum - 1]?.length ?? 0) + 1;
            break;
          }
          searchFrom = idx - 1;
        }
      }
    }

    const lineText = lines[lineNum - 1] ?? '';
    const offset = this.lineColToOffset(sql, lineNum, col);
    const tokenSlice = lineText.slice(Math.max(0, col - 1));
    const wordMatch = tokenSlice.match(/^[a-zA-Z_][a-zA-Z0-9_]*|^[^\s]+/);
    const nearToken = wordMatch ? wordMatch[0] : '';
    const tokenLen = Math.max(1, nearToken.length);

    const gotMatch = errMsg.match(/got '([^']+)'/);
    const gotToken = gotMatch ? gotMatch[1] : '';
    const expectingMatch = errMsg.match(/Expecting (.+?), got '/);
    const expectedRaw = expectingMatch ? expectingMatch[1] : '';

    const tokenNames: Record<string, string> = {
      EOF: 'fin de consulta',
      SEMICOLON: "';'",
      COMMA: "','",
      LPAR: "'('",
      RPAR: "')'",
      STAR: "'*'",
      LITERAL: 'identificador',
      STRING: 'cadena de texto',
      NUMBER: 'número',
      FROM: 'FROM',
      WHERE: 'WHERE',
      INTO: 'INTO',
      VALUES: 'VALUES',
      SET: 'SET',
      ON: 'ON',
      AS: 'AS',
      INVALID: 'carácter o texto no válido',
    };

    const gotDesc = gotToken === 'EOF'
      ? 'fin de consulta inesperado (instrucción incompleta)'
      : gotToken === 'INVALID'
      ? 'carácter o cadena no válida'
      : nearToken
      ? `token inesperado '${nearToken}'`
      : `token inesperado (${tokenNames[gotToken] || gotToken})`;

    // Build concise Spanish hint from expected tokens
    const expectedList = expectedRaw
      .split(',')
      .map(s => s.trim().replace(/^'|'$/g, ''))
      .filter(Boolean);

    const friendlyExpected: string[] = [];
    const priorityMap: [string, string][] = [
      ['FROM', 'FROM'],
      ['WHERE', 'WHERE'],
      ['INTO', 'INTO'],
      ['VALUES', 'VALUES'],
      ['SET', 'SET'],
      ['ON', 'ON'],
      ['JOIN', 'JOIN'],
      ['COMMA', "','"],
      ['RPAR', "')'"],
      ['LPAR', "'('"],
      ['SEMICOLON', "';'"],
      ['LITERAL', 'nombre de tabla/campo'],
      ['STRING', 'valor de texto'],
      ['NUMBER', 'número'],
      ['EQ', "'='"],
      ['EOF', 'fin de instrucción'],
    ];

    for (const [key, label] of priorityMap) {
      if (expectedList.includes(key) && !friendlyExpected.includes(label)) {
        friendlyExpected.push(label);
      }
      if (friendlyExpected.length >= 5) break;
    }

    let hint = friendlyExpected.length > 0
      ? `Se esperaba: ${friendlyExpected.join(', ')}.`
      : 'Revisa las palabras clave SQL, comas o nombres de tablas/campos en esa posición.';

    // Helpful tip if user used a reserved keyword like TOTAL, KEY, VALUE, ORDER, etc.
    if (nearToken && /^[a-zA-Z_]+$/.test(nearToken) && gotToken !== 'LITERAL' && gotToken !== 'EOF' && gotToken !== 'SEMICOLON') {
      hint += ` Si '${nearToken}' es el nombre de un campo o alias, prueba envolverlo con \`${nearToken}\`.`;
    }

    return {
      valid: false,
      severity: 'error',
      line: lineNum,
      column: col,
      offset,
      length: tokenLen,
      lineText,
      message: `Error de sintaxis: ${gotDesc}.`,
      hint,
      rawError: errMsg,
    };
  }

  // Validate SQL syntax & schema references, pinpointing exact location of errors
  public validateSql(rawSql: string, schema?: ERDSchema): SqlDiagnostic {
    const trimmed = rawSql.trim();
    if (!trimmed) {
      return {
        valid: true,
        severity: 'ok',
        line: 1,
        column: 1,
        offset: 0,
        length: 0,
        lineText: '',
        message: 'Escribe una consulta SQL para comprobar su sintaxis.',
      };
    }

    // 1. Lexical checks (quotes, comments, parens)
    const lexErr = this.checkLexicalBalance(rawSql);
    if (lexErr) return lexErr;

    // 2. Full SQL grammar parse via alasql
    let ast: any;
    try {
      ast = alasql.parse(rawSql);
    } catch (err: any) {
      return this.parseAlasqlSyntaxError(rawSql, err?.message || String(err));
    }

    // 3. Schema-aware checks (tables & columns)
    const s = schema || this.currentSchema;
    const knownTables = new Map<string, { realName: string; columns: Set<string>; columnNames: string[] }>();

    if (s) {
      for (const t of s.tables) {
        knownTables.set(t.name.toLowerCase(), {
          realName: t.name,
          columns: new Set(t.columns.map(c => c.name.toLowerCase())),
          columnNames: t.columns.map(c => c.name),
        });
      }
    }

    // Include any tables created dynamically in memory
    try {
      const liveTables = (alasql as any).databases?.[DB_NAME]?.tables;
      if (liveTables) {
        for (const tName of Object.keys(liveTables)) {
          if (!knownTables.has(tName.toLowerCase())) {
            const cols: string[] = Array.isArray(liveTables[tName].columns)
              ? liveTables[tName].columns.map((c: any) => c.columnid).filter(Boolean)
              : [];
            knownTables.set(tName.toLowerCase(), {
              realName: tName,
              columns: new Set(cols.map(c => c.toLowerCase())),
              columnNames: cols,
            });
          }
        }
      }
    } catch {
      // ignore
    }

    if (knownTables.size > 0 && Array.isArray(ast?.statements)) {
      const allTableNames = Array.from(knownTables.values()).map(v => v.realName);

      for (const stmt of ast.statements) {
        if (!stmt || typeof stmt !== 'object') continue;

        const isCreateTable = Array.isArray(stmt.columns) && stmt.columns.some((c: any) => typeof c?.dbtypeid === 'string');
        if (isCreateTable) {
          if (stmt.table?.tableid) {
            const newCols = stmt.columns.map((c: any) => c.columnid).filter(Boolean);
            knownTables.set(stmt.table.tableid.toLowerCase(), {
              realName: stmt.table.tableid,
              columns: new Set(newCols.map((c: string) => c.toLowerCase())),
              columnNames: newCols,
            });
          }
          continue;
        }

        // Collect tables referenced in this statement
        const stmtTables: { name: string; alias?: string }[] = [];
        if (Array.isArray(stmt.from)) {
          for (const f of stmt.from) {
            if (f?.tableid) stmtTables.push({ name: f.tableid, alias: f.as });
          }
        }
        if (Array.isArray(stmt.joins)) {
          for (const j of stmt.joins) {
            if (j?.table?.tableid) stmtTables.push({ name: j.table.tableid, alias: j.as });
          }
        }
        if (stmt.into?.tableid) {
          stmtTables.push({ name: stmt.into.tableid });
        }
        if (stmt.table?.tableid) {
          // UPDATE / DELETE
          stmtTables.push({ name: stmt.table.tableid });
        }

        // Verify referenced tables exist
        for (const ref of stmtTables) {
          if (!knownTables.has(ref.name.toLowerCase())) {
            const pos = this.findIdentifierPosition(rawSql, ref.name);
            const suggestion = this.findClosestMatch(ref.name, allTableNames);
            return {
              valid: false,
              severity: 'error',
              ...pos,
              message: `La tabla '${ref.name}' no existe en la base de datos simulada.`,
              hint: suggestion
                ? `¿Quisiste decir '${suggestion}'?`
                : `Tablas disponibles: ${allTableNames.join(', ')}.`,
            };
          }
        }

        // Skip column checks if no known tables in statement
        if (stmtTables.length === 0) continue;

        // Build alias -> table info map
        const aliasMap = new Map<string, { realName: string; columns: Set<string>; columnNames: string[] }>();
        for (const ref of stmtTables) {
          const info = knownTables.get(ref.name.toLowerCase());
          if (info) {
            aliasMap.set(ref.name.toLowerCase(), info);
            if (ref.alias) aliasMap.set(ref.alias.toLowerCase(), info);
          }
        }

        // Collect output aliases defined in SELECT (so ORDER BY alias works)
        const selectAliases = new Set<string>();
        if (Array.isArray(stmt.columns)) {
          for (const c of stmt.columns) {
            if (c?.as) selectAliases.add(String(c.as).toLowerCase());
          }
        }

        // Walk AST nodes to collect column references
        const colRefs: { columnid: string; tableid?: string }[] = [];
        const walk = (node: any) => {
          if (!node || typeof node !== 'object') return;
          if (Array.isArray(node)) {
            node.forEach(walk);
            return;
          }
          if (typeof node.columnid === 'string' && node.columnid !== '*') {
            colRefs.push({ columnid: node.columnid, tableid: node.tableid });
          }
          for (const key of Object.keys(node)) {
            if (key === 'from' || key === 'into' || key === 'table') continue;
            walk(node[key]);
          }
        };

        walk(stmt.columns);
        walk(stmt.where);
        walk(stmt.joins);
        walk(stmt.group);
        walk(stmt.having);
        walk(stmt.order);
        walk(stmt.updates);

        // Also check INSERT explicit column list
        if (Array.isArray(stmt.columns) && stmt.into?.tableid) {
          // already covered by walk(stmt.columns)
        }

        for (const cref of colRefs) {
          const colLower = cref.columnid.toLowerCase();
          if (cref.tableid) {
            const targetTable = aliasMap.get(cref.tableid.toLowerCase());
            if (targetTable && targetTable.columns.size > 0 && !targetTable.columns.has(colLower)) {
              const pos = this.findIdentifierPosition(rawSql, cref.columnid);
              const suggestion = this.findClosestMatch(cref.columnid, targetTable.columnNames);
              return {
                valid: false,
                severity: 'warning',
                ...pos,
                message: `El campo '${cref.columnid}' no existe en la tabla '${targetTable.realName}'.`,
                hint: suggestion
                  ? `¿Quisiste decir '${suggestion}'?`
                  : `Campos de ${targetTable.realName}: ${targetTable.columnNames.join(', ')}.`,
              };
            }
          } else {
            // Unqualified column: skip if it's an alias from SELECT
            if (selectAliases.has(colLower)) continue;
            const tableInfos = stmtTables
              .map(r => knownTables.get(r.name.toLowerCase()))
              .filter((x): x is NonNullable<typeof x> => !!x && x.columns.size > 0);

            if (tableInfos.length > 0 && !tableInfos.some(t => t.columns.has(colLower))) {
              const allCols = Array.from(new Set(tableInfos.flatMap(t => t.columnNames)));
              const pos = this.findIdentifierPosition(rawSql, cref.columnid);
              const suggestion = this.findClosestMatch(cref.columnid, allCols);
              const tableLabel = tableInfos.map(t => t.realName).join(', ');
              return {
                valid: false,
                severity: 'warning',
                ...pos,
                message: `El campo '${cref.columnid}' no existe en ${tableInfos.length === 1 ? `la tabla '${tableLabel}'` : `las tablas (${tableLabel})`}.`,
                hint: suggestion
                  ? `¿Quisiste decir '${suggestion}'?`
                  : `Campos disponibles: ${allCols.join(', ')}.`,
              };
            }
          }
        }
      }
    }

    const lineCount = rawSql.split('\n').length;
    return {
      valid: true,
      severity: 'ok',
      line: lineCount,
      column: 1,
      offset: 0,
      length: 0,
      lineText: '',
      message: 'Sintaxis SQL válida.',
    };
  }

  // Get current state of tables and relationships
  public getTablesInfo(schema?: ERDSchema): SimulatedTableInfo[] {
    const s = schema || this.currentSchema;
    if (!s) return [];

    const tablesInfo: SimulatedTableInfo[] = [];

    // Ensure database is selected
    try {
      alasql(`USE ${DB_NAME};`);
    } catch {
      // ignore
    }

    const currentDb = (alasql as any).databases?.[DB_NAME];

    for (const table of s.tables) {
      // Row count in memory
      let rowCount = 0;
      try {
        if (currentDb?.tables?.[table.name]?.data) {
          rowCount = currentDb.tables[table.name].data.length;
        } else {
          const res = alasql(`SELECT * FROM ${escapeIdent(table.name)};`);
          if (Array.isArray(res)) rowCount = res.length;
        }
      } catch {
        rowCount = 0;
      }

      // Column definitions
      const columns: SimulatedColumnInfo[] = table.columns.map(col => {
        // Check foreign key
        const outgoingRel = s.relationships.find(r => r.fromTableId === table.id && r.fromColumnId === col.id);
        const targetTable = outgoingRel ? s.tables.find(t => t.id === outgoingRel.toTableId) : undefined;
        const targetCol = outgoingRel && targetTable ? targetTable.columns.find(c => c.id === outgoingRel.toColumnId) : undefined;

        const effectiveDefault = col.defaultValue || outgoingRel?.defaultValue;

        return {
          name: col.name,
          type: col.type + (col.length ? `(${col.length}${col.decimals ? `, ${col.decimals}` : ''})` : ''),
          isPK: !!col.isPK,
          isFK: !!col.isFK || !!outgoingRel,
          isNullable: !!col.isNullable,
          isUnique: !!col.isUnique,
          defaultValue: effectiveDefault,
          fkTarget: targetTable && targetCol ? {
            tableName: targetTable.name,
            columnName: targetCol.name,
            onDelete: outgoingRel?.onDelete || 'CASCADE',
          } : undefined,
        };
      });

      // Relationships
      const relations: SimulatedRelationInfo[] = [];

      // Outgoing (this table has FK pointing to other table)
      s.relationships
        .filter(r => r.fromTableId === table.id)
        .forEach(r => {
          const toT = s.tables.find(t => t.id === r.toTableId);
          const fromC = table.columns.find(c => c.id === r.fromColumnId);
          const toC = toT?.columns.find(c => c.id === r.toColumnId);
          if (toT && fromC && toC) {
            relations.push({
              id: r.id,
              direction: 'outgoing',
              fromTable: table.name,
              fromColumn: fromC.name,
              toTable: toT.name,
              toColumn: toC.name,
              cardinality: r.cardinality || '1:N',
              onDelete: r.onDelete || 'CASCADE',
              defaultValue: r.defaultValue,
            });
          }
        });

      // Incoming (other tables point to this table)
      s.relationships
        .filter(r => r.toTableId === table.id)
        .forEach(r => {
          const fromT = s.tables.find(t => t.id === r.fromTableId);
          const fromC = fromT?.columns.find(c => c.id === r.fromColumnId);
          const toC = table.columns.find(c => c.id === r.toColumnId);
          if (fromT && fromC && toC) {
            relations.push({
              id: r.id,
              direction: 'incoming',
              fromTable: fromT.name,
              fromColumn: fromC.name,
              toTable: table.name,
              toColumn: toC.name,
              cardinality: r.cardinality || '1:N',
              onDelete: r.onDelete || 'CASCADE',
              defaultValue: r.defaultValue,
            });
          }
        });

      tablesInfo.push({
        id: table.id,
        name: table.name,
        rowCount,
        columns,
        relations,
        color: table.color,
      });
    }

    return tablesInfo;
  }

  // Pre-built queries based on actual tables and relationships
  public generateSampleQueries(schema: ERDSchema): { label: string; description: string; sql: string }[] {
    const queries: { label: string; description: string; sql: string }[] = [];
    if (!schema.tables || schema.tables.length === 0) return queries;

    // 1. SELECT * from first table
    const firstTable = schema.tables[0];
    queries.push({
      label: `Consultar ${firstTable.name}`,
      description: `Ver todos los registros de la tabla ${firstTable.name}`,
      sql: `SELECT * FROM ${escapeIdent(firstTable.name)};`,
    });

    // 2. JOIN query if there is any relationship
    const firstRel = schema.relationships.find(r => r.fromColumnId && r.toColumnId);
    if (firstRel) {
      const fromTable = schema.tables.find(t => t.id === firstRel.fromTableId);
      const toTable = schema.tables.find(t => t.id === firstRel.toTableId);
      const fromCol = fromTable?.columns.find(c => c.id === firstRel.fromColumnId);
      const toCol = toTable?.columns.find(c => c.id === firstRel.toColumnId);

      if (fromTable && toTable && fromCol && toCol) {
        queries.push({
          label: `INNER JOIN (${fromTable.name} ➔ ${toTable.name})`,
          description: `Cruzar datos mediante la relación de clave foránea`,
          sql: `SELECT 
  a.${escapeIdent(fromCol.name)}, 
  b.${escapeIdent(toCol.name)}, 
  a.* 
FROM ${escapeIdent(fromTable.name)} a
INNER JOIN ${escapeIdent(toTable.name)} b 
  ON a.${escapeIdent(fromCol.name)} = b.${escapeIdent(toCol.name)};`,
        });
      }
    }

    // 3. Aggregate query (COUNT)
    queries.push({
      label: `Contar registros de ${firstTable.name}`,
      description: `Agregación con función COUNT`,
      sql: `SELECT COUNT(*) AS total_filas FROM ${escapeIdent(firstTable.name)};`,
    });

    // 4. Sample INSERT
    const pkCol = firstTable.columns.find(c => c.isPK) || firstTable.columns[0];
    const nonPkCols = firstTable.columns.filter(c => c !== pkCol).slice(0, 3);
    const insertCols = [pkCol, ...nonPkCols].filter(Boolean);
    const colList = insertCols.map(c => escapeIdent(c.name)).join(', ');
    const valList = insertCols.map(c => {
      if (c.name.toLowerCase().includes('id') || c.type.includes('INT')) return '999';
      if (c.type.includes('DECIMAL') || c.type.includes('FLOAT')) return '199.99';
      if (c.type.includes('BOOL')) return 'TRUE';
      return `'Nuevo Registro'`;
    }).join(', ');

    queries.push({
      label: `Insertar registro en ${firstTable.name}`,
      description: `Añadir una nueva fila de prueba con INSERT INTO`,
      sql: `INSERT INTO ${escapeIdent(firstTable.name)} (${colList})
VALUES (${valList});`,
    });

    // 5. Filter with WHERE
    queries.push({
      label: `Filtrar ${firstTable.name} con WHERE`,
      description: `Filtrado condicional`,
      sql: `SELECT * FROM ${escapeIdent(firstTable.name)} WHERE ${escapeIdent(pkCol.name)} > 1;`,
    });

    return queries;
  }
}

export const dbSimulator = new DatabaseSimulatorEngine();
