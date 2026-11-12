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
      return {
        success: false,
        query,
        isSelect: false,
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs,
        error: err.message || String(err),
      };
    }
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
