import { ERDSchema } from '../types/erd';

export function generateMermaidER(schema: ERDSchema): string {
  const lines: string[] = ['erDiagram'];

  // Output entities and attributes
  schema.tables.forEach(table => {
    lines.push(`    ${table.name} {`);
    table.columns.forEach(col => {
      // Mermaid type format: TYPE name PK/FK "comment"
      const fullType = col.length ? `${col.type}_${col.length}` : col.type;
      const safeType = fullType.replace(/[\(\),]/g, '_');
      const keyAnnotation = col.isPK ? 'PK' : col.isFK ? 'FK' : '';
      lines.push(`        ${safeType} ${col.name} ${keyAnnotation}`.trimEnd());
    });
    lines.push('    }');
  });

  // Output relationships
  schema.relationships.forEach(rel => {
    const fromTable = schema.tables.find(t => t.id === rel.fromTableId);
    const toTable = schema.tables.find(t => t.id === rel.toTableId);
    if (!fromTable || !toTable) return;

    let connectorSymbol = '}o--||';
    switch (rel.cardinality) {
      case '1:1':
        connectorSymbol = '||--||';
        break;
      case '1:N':
        connectorSymbol = '||--o{';
        break;
      case 'N:1':
        connectorSymbol = '}o--||';
        break;
      case 'N:M':
        connectorSymbol = '}o--o{';
        break;
      default:
        connectorSymbol = '}o--||';
    }

    const label = rel.label ? `"${rel.label}"` : '""';
    lines.push(`    ${fromTable.name} ${connectorSymbol} ${toTable.name} : ${label}`);
  });

  return lines.join('\n');
}
