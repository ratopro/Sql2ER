# Relatia - Editor y Visualizador de Diagramas Entidad-Relación (ERD)

**Relatia** es una aplicación web interactiva para diseñar, modelar y exportar diagramas entidad-relación (ERD) relacionales con generación de código SQL (PostgreSQL, MySQL, SQLite, SQL Server) y visualización gráfica avanzada.

---

## ✨ Características Principales

- **Diseño de Tablas Relacionales**:
  - Cabecera con 6 columnas perfectamente alineadas: `PK/FK`, `Campo`, `Tipo`, `Tamaño`, `Opciones` y `Borrar`.
  - Soporte para tipos de datos completos: `INT`, `BIGINT`, `VARCHAR`, `TEXT`, `BOOLEAN`, `DECIMAL`, `DATE`, `DATETIME`, `TIMESTAMP`, `UUID`, `JSON`.
  - Configuración de claves primarias (`PK`), foráneas (`FK`), `NULL / NOT NULL`, `UNIQUE` y autoincremento.
  - Reglas de integridad referencial: `ON DELETE` (`CASCADE`, `RESTRICT`, `SET NULL`, `SET DEFAULT`, `NO ACTION`) y campo dinámico para el valor por defecto solo cuando se selecciona `SET DEFAULT`.

- **Navegación e Interacción en el Lienzo**:
  - **Zoom con Rueda**: Rueda del ratón para ampliar/reducir el lienzo (desactivado automáticamente al desplegar selectores).
  - **Desplazamiento Vertical**: `Shift + Rueda del ratón`.
  - **Desplazamiento Horizontal**: `Ctrl + Rueda del ratón`.
  - **Modo Mano / Arrastre**: Manteniendo presionada la tecla `Espacio`, se activa la herramienta mano para arrastrar y desplazar el lienzo fluidamente.
  - Minimapa interactivo con vista general del diagrama.

- **Conectores y Relaciones Inteligentes**:
  - Líneas Bezier suaves con cálculo geométrico a nivel de fila y cabecera.
  - Badges con tipo de cardinalidad (1:1, 1:N, N:M) y etiqueta de acción `ON DELETE`.

- **Importación y Exportación**:
  - Exportación de scripts DDL SQL para PostgreSQL, MySQL, SQLite y SQL Server.
  - Parser SQL para importar esquemas existentes directamente al lienzo.
  - Exportación gráfica en **PNG** y **SVG** de alta resolución.
  - Guardado y carga en formato JSON nativo de Relatia.

- **Diseño Moderno**:
  - Tema Claro y Oscuro.
  - Interfaz responsiva y pulida con Tailwind CSS e iconos Lucide.

---

## 🚀 Instalación y Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

---

## 🛠️ Tecnologías Utilizadas

- **React 18** + **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Lucide React** (Iconografía)
- **Canvas Math & SVG** para renderizado de relaciones relacionales
