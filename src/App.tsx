import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  TableNode, 
  Relationship, 
  StickyNode, 
  FrameNode, 
  CanvasTool, 
  ERDSchema,
  HistoryState,
  SchemaStep,
  Column,
  DatabaseItem
} from './types/erd';
import { TEMPLATES } from './data/templates';
import { TopBar } from './components/TopBar';
import { Toolbar } from './components/Toolbar';
import { TableCard } from './components/TableCard';
import { ConnectorLine } from './components/ConnectorLine';
import { StickyNote } from './components/StickyNote';
import { FrameCard } from './components/FrameCard';
import { ResizeHandle } from './components/ResizeHandles';
import { ZoomBar } from './components/ZoomBar';
import { Minimap } from './components/Minimap';
import { TimelineBar } from './components/TimelineBar';
import { AddStepModal } from './components/AddStepModal';
import { ExportModal } from './components/ExportModal';
import { SqlImportModal } from './components/SqlImportModal';
import { TemplatesModal } from './components/TemplatesModal';
import { CreateDatabaseModal } from './components/CreateDatabaseModal';
import { ConfirmNewProjectModal } from './components/ConfirmNewProjectModal';
import { CreateProjectModal, CreateProjectFormData } from './components/CreateProjectModal';
import { DatabaseSimulator } from './components/DatabaseSimulator';
import { Type } from 'lucide-react';
import { computeFitToScreen, generateSmoothBezier, getColumnYOffset, TABLE_WIDTH, getTableHeight } from './utils/canvasMath';

// Helper to build initial evolution steps for the template
function createInitialSteps(baseTables: TableNode[], baseRels: Relationship[]): SchemaStep[] {
  // Step 0: Initial Schema creation
  const step0: SchemaStep = {
    id: 'step_0',
    stepNumber: 0,
    version: 'v1.0',
    title: 'Creación Inicial del Esquema',
    description: 'Tablas base con campos principales y claves primarias.',
    createdAt: '01 nov 2026',
    commands: [],
    schemaSnapshot: {
      tables: JSON.parse(JSON.stringify(baseTables)),
      relationships: JSON.parse(JSON.stringify(baseRels)),
    },
  };

  // Step 1: Users 2FA and phone verification
  const tablesV1 = JSON.parse(JSON.stringify(baseTables)) as TableNode[];
  const userTableV1 = tablesV1.find(t => t.name === 'users');
  if (userTableV1) {
    userTableV1.columns.push(
      { id: 'u_phone_ver', name: 'is_phone_verified', type: 'BOOLEAN', defaultValue: 'FALSE', isPK: false, isFK: false, isNullable: false, isUnique: false },
      { id: 'u_2fa', name: 'two_factor_enabled', type: 'BOOLEAN', defaultValue: 'FALSE', isPK: false, isFK: false, isNullable: false, isUnique: false }
    );
  }
  const step1: SchemaStep = {
    id: 'step_1',
    stepNumber: 1,
    version: 'v1.1',
    title: 'Seguridad: Verificación y 2FA',
    description: 'ALTER TABLE users ADD COLUMN para verificación telefónica y doble factor.',
    createdAt: '03 nov 2026',
    commands: [
      { id: 'cmd_1', type: 'ADD_COLUMN', tableName: 'users', columnName: 'is_phone_verified', columnType: 'BOOLEAN DEFAULT FALSE', description: 'Añadir estado de verificación de teléfono' },
      { id: 'cmd_2', type: 'ADD_COLUMN', tableName: 'users', columnName: 'two_factor_enabled', columnType: 'BOOLEAN DEFAULT FALSE', description: 'Añadir indicador de doble factor' },
    ],
    schemaSnapshot: {
      tables: tablesV1,
      relationships: JSON.parse(JSON.stringify(baseRels)),
    },
  };

  // Step 2: Constraints
  const tablesV2 = JSON.parse(JSON.stringify(tablesV1)) as TableNode[];
  const step2: SchemaStep = {
    id: 'step_2',
    stepNumber: 2,
    version: 'v1.2',
    title: 'Restricciones de Integridad y Check',
    description: 'Garantizar que stocks y montos nunca sean negativos.',
    createdAt: '06 nov 2026',
    commands: [
      { id: 'cmd_3', type: 'ADD_CONSTRAINT', tableName: 'products', constraintName: 'chk_stock_positive', constraintDefinition: 'CHECK (stock_quantity >= 0)', description: 'Impedir stock negativo' },
      { id: 'cmd_4', type: 'ADD_CONSTRAINT', tableName: 'orders', constraintName: 'chk_total_positive', constraintDefinition: 'CHECK (total_amount >= 0)', description: 'Impedir total negativo' },
    ],
    schemaSnapshot: {
      tables: tablesV2,
      relationships: JSON.parse(JSON.stringify(baseRels)),
    },
  };

  // Step 3: Query indexes
  const tablesV3 = JSON.parse(JSON.stringify(tablesV2)) as TableNode[];
  const step3: SchemaStep = {
    id: 'step_3',
    stepNumber: 3,
    version: 'v1.3',
    title: 'Optimización de Consultas e Índices',
    description: 'Índices para acelerar búsquedas de pedidos y productos.',
    createdAt: '09 nov 2026',
    commands: [
      { id: 'cmd_5', type: 'CREATE_INDEX', tableName: 'orders', constraintName: 'idx_orders_user_placed', columnName: 'user_id', description: 'Índice de pedidos por usuario' },
      { id: 'cmd_6', type: 'CREATE_INDEX', tableName: 'order_items', constraintName: 'idx_order_items_product', columnName: 'product_id', description: 'Índice de items por producto' },
    ],
    schemaSnapshot: {
      tables: tablesV3,
      relationships: JSON.parse(JSON.stringify(baseRels)),
    },
  };

  return [step0, step1, step2, step3];
}

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Diagram schema state initialized from default e-commerce template
  const initialTemplate = TEMPLATES[0].schema;
  const [title, setTitle] = useState(initialTemplate.title);
  const [projectDescription, setProjectDescription] = useState(initialTemplate.description || '');
  const [projectAuthor, setProjectAuthor] = useState('');

  // Databases state
  const initialDb: DatabaseItem = {
    id: 'db_ecommerce',
    name: 'ecommerce_store',
    color: 'indigo',
    description: 'Base de datos principal',
    createdAt: '01 nov 2026',
  };
  const [databases, setDatabases] = useState<DatabaseItem[]>([initialDb]);
  const [activeDatabaseId, setActiveDatabaseId] = useState<string | undefined>('db_ecommerce');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // New Project & Database Modals state
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [createProjectInitialMode, setCreateProjectInitialMode] = useState<'blank' | 'template'>('blank');
  const [isCreateDbOpen, setIsCreateDbOpen] = useState(false);
  const [isFirstDbPrompt, setIsFirstDbPrompt] = useState(false);
  const [isConfirmNewProjectOpen, setIsConfirmNewProjectOpen] = useState(false);
  
  // Active navigation tab ('erd' diagram or 'simulator' SQL)
  const [activeTab, setActiveTab] = useState<'erd' | 'simulator'>('erd');
  const [simulationKey, setSimulationKey] = useState<number>(0);

  const handleRunSimulation = useCallback(() => {
    setSimulationKey(prev => prev + 1);
    setActiveTab('simulator');
  }, []);

  // Application text scale state (Ctrl + / Ctrl -)
  const [fontSizePercent, setFontSizePercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('miro_er_font_size');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 70 && parsed <= 160) return parsed;
      }
    } catch (_) {}
    return 100;
  });
  const [fontSizeToast, setFontSizeToast] = useState<{ message: string; visible: boolean } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSizePercent}%`;
    try {
      localStorage.setItem('miro_er_font_size', fontSizePercent.toString());
    } catch (_) {}
  }, [fontSizePercent]);

  const showFontToast = useCallback((pct: number) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setFontSizeToast({ message: `Tamaño de texto: ${pct}%`, visible: true });
    toastTimeoutRef.current = setTimeout(() => {
      setFontSizeToast(prev => prev ? { ...prev, visible: false } : null);
    }, 1600);
  }, []);

  const handleIncreaseFontSize = useCallback(() => {
    setFontSizePercent(prev => {
      const next = Math.min(prev + 10, 160);
      showFontToast(next);
      return next;
    });
  }, [showFontToast]);

  const handleDecreaseFontSize = useCallback(() => {
    setFontSizePercent(prev => {
      const next = Math.max(prev - 10, 70);
      showFontToast(next);
      return next;
    });
  }, [showFontToast]);

  const handleResetFontSize = useCallback(() => {
    setFontSizePercent(100);
    showFontToast(100);
  }, [showFontToast]);

  const handleSetFontSize = useCallback((pct: number) => {
    const clamped = Math.max(70, Math.min(160, pct));
    setFontSizePercent(clamped);
    showFontToast(clamped);
  }, [showFontToast]);
  
  // Timeline steps state
  const initialStepsList = createInitialSteps(
    initialTemplate.tables.map(t => ({ ...t, databaseId: t.databaseId || 'db_ecommerce' })), 
    initialTemplate.relationships
  );
  const [steps, setSteps] = useState<SchemaStep[]>(initialStepsList);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(initialStepsList.length - 1);
  const [isTimelineOpen, setIsTimelineOpen] = useState(true);
  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [selectedTableForStep, setSelectedTableForStep] = useState<string | undefined>(undefined);

  // The active schema mirrors the snapshot of the selected step
  const [tables, setTables] = useState<TableNode[]>(
    initialStepsList[initialStepsList.length - 1].schemaSnapshot.tables.map(t => ({
      ...t,
      databaseId: t.databaseId || 'db_ecommerce'
    }))
  );
  const [relationships, setRelationships] = useState<Relationship[]>(initialStepsList[initialStepsList.length - 1].schemaSnapshot.relationships);
  const [stickies, setStickies] = useState<StickyNode[]>(initialTemplate.stickies || []);
  const [frames, setFrames] = useState<FrameNode[]>(initialTemplate.frames || []);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const saveHistory = useCallback((newState: { 
    databases?: DatabaseItem[];
    activeDatabaseId?: string;
    tables: TableNode[]; 
    relationships: Relationship[]; 
    stickies: StickyNode[]; 
    frames: FrameNode[]; 
    steps: SchemaStep[]; 
    title: string;
    description?: string;
    author?: string;
  }) => {
    const fullState: HistoryState = {
      databases: newState.databases || databases,
      activeDatabaseId: newState.activeDatabaseId || activeDatabaseId,
      tables: newState.tables,
      relationships: newState.relationships,
      stickies: newState.stickies,
      frames: newState.frames,
      steps: newState.steps,
      title: newState.title,
      description: newState.description !== undefined ? newState.description : projectDescription,
      author: newState.author !== undefined ? newState.author : projectAuthor,
    };
    setHistory(prev => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, fullState];
    });
    setHistoryIndex(prev => prev + 1);
    setHasUnsavedChanges(true);
  }, [historyIndex, databases, activeDatabaseId, projectDescription, projectAuthor]);

  // Record initial history
  useEffect(() => {
    if (history.length === 0) {
      setHistory([{
        databases: [initialDb],
        activeDatabaseId: 'db_ecommerce',
        tables: initialStepsList[initialStepsList.length - 1].schemaSnapshot.tables.map(t => ({
          ...t,
          databaseId: t.databaseId || 'db_ecommerce'
        })),
        relationships: initialStepsList[initialStepsList.length - 1].schemaSnapshot.relationships,
        stickies: initialTemplate.stickies || [],
        frames: initialTemplate.frames || [],
        steps: initialStepsList,
        title: initialTemplate.title,
        description: initialTemplate.description,
        author: '',
      }]);
      setHistoryIndex(0);
      setHasUnsavedChanges(false);
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetState = history[historyIndex - 1];
      if (targetState.databases) setDatabases(targetState.databases);
      if (targetState.activeDatabaseId) setActiveDatabaseId(targetState.activeDatabaseId);
      setTables(targetState.tables);
      setRelationships(targetState.relationships);
      setStickies(targetState.stickies);
      setFrames(targetState.frames);
      setSteps(targetState.steps);
      setTitle(targetState.title);
      if (targetState.description !== undefined) setProjectDescription(targetState.description);
      if (targetState.author !== undefined) setProjectAuthor(targetState.author);
      setHistoryIndex(historyIndex - 1);
      setHasUnsavedChanges(true);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetState = history[historyIndex + 1];
      if (targetState.databases) setDatabases(targetState.databases);
      if (targetState.activeDatabaseId) setActiveDatabaseId(targetState.activeDatabaseId);
      setTables(targetState.tables);
      setRelationships(targetState.relationships);
      setStickies(targetState.stickies);
      setFrames(targetState.frames);
      setSteps(targetState.steps);
      setTitle(targetState.title);
      if (targetState.description !== undefined) setProjectDescription(targetState.description);
      if (targetState.author !== undefined) setProjectAuthor(targetState.author);
      setHistoryIndex(historyIndex + 1);
      setHasUnsavedChanges(true);
    }
  }, [historyIndex, history]);

  // Canvas viewport navigation
  const [pan, setPan] = useState({ x: 80, y: 40 });
  const [zoom, setZoom] = useState(0.85);
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [showMinimap, setShowMinimap] = useState(true);

  // Selection state
  const [selectedElement, setSelectedElement] = useState<{ id: string; type: 'table' | 'relation' | 'sticky' | 'frame' } | null>(null);

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportInitialTab, setExportInitialTab] = useState<'sql' | 'timeline' | 'mermaid' | 'json'>('sql');
  const [isSqlImportOpen, setIsSqlImportOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // Connection dragging state
  const [connectingSource, setConnectingSource] = useState<{ fromTableId: string; fromColumnId?: string } | null>(null);
  const [mouseWorldPos, setMouseWorldPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Dragging state
  const [draggedNode, setDraggedNode] = useState<{
    id: string;
    type: 'table' | 'sticky' | 'frame';
    startX: number;
    startY: number;
    elemStartX: number;
    elemStartY: number;
    containedTables?: { id: string; startX: number; startY: number }[];
    containedStickies?: { id: string; startX: number; startY: number }[];
  } | null>(null);

  // Resizing state for frames and stickies (border points)
  const [resizingNode, setResizingNode] = useState<{
    id: string;
    type: 'frame' | 'sticky';
    handle: ResizeHandle;
    startX: number;
    startY: number;
    elemX: number;
    elemY: number;
    elemWidth: number;
    elemHeight: number;
  } | null>(null);

  // Canvas Panning drag state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Active Popup Tracker: ensures popups always render in front (z-100) and close when another object is clicked
  const [activePopup, setActivePopup] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Screen to world coordinates helper
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const relX = screenX - rect.left;
    const relY = screenY - rect.top;
    return {
      x: (relX - pan.x) / zoom,
      y: (relY - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // Save current project state to local storage
  const handleSaveProject = () => {
    const projectData = {
      title,
      description: projectDescription,
      author: projectAuthor,
      databases,
      activeDatabaseId,
      tables,
      relationships,
      stickies,
      frames,
      steps,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('relatia_saved_project', JSON.stringify(projectData));
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Error guardando proyecto:', err);
    }
  };

  // Create Project handler: checks unsaved changes first, then opens CreateProjectModal
  const handleNewProject = () => {
    if (hasUnsavedChanges) {
      setIsConfirmNewProjectOpen(true);
    } else {
      setCreateProjectInitialMode('blank');
      setIsCreateProjectOpen(true);
    }
  };

  const handleOpenTemplates = () => {
    if (hasUnsavedChanges) {
      setIsConfirmNewProjectOpen(true);
    } else {
      setCreateProjectInitialMode('template');
      setIsCreateProjectOpen(true);
    }
  };

  const handleCreateProject = (data: CreateProjectFormData) => {
    if (data.mode === 'template') {
      const chosenTemplate = TEMPLATES.find(t => t.id === data.selectedTemplateId) || TEMPLATES[0];
      const templateDb: DatabaseItem = {
        id: 'db_' + (data.selectedTemplateId || 'template'),
        name: data.initialDatabaseName && data.initialDatabaseName !== 'principal_db'
          ? data.initialDatabaseName
          : chosenTemplate.id + '_db',
        color: data.initialDatabaseColor || 'indigo',
        description: data.description || chosenTemplate.description,
        createdAt: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      };
      const assignedTables = chosenTemplate.schema.tables.map(t => ({
        ...t,
        databaseId: templateDb.id,
      }));
      const templateSteps = createInitialSteps(assignedTables, chosenTemplate.schema.relationships);

      setTitle(data.title || chosenTemplate.name);
      setProjectDescription(data.description || chosenTemplate.description || '');
      setProjectAuthor(data.author || '');
      setDatabases([templateDb]);
      setActiveDatabaseId(templateDb.id);
      setTables(assignedTables);
      setRelationships(chosenTemplate.schema.relationships);
      setStickies(chosenTemplate.schema.stickies || []);
      setFrames(chosenTemplate.schema.frames || []);
      setSteps(templateSteps);
      setActiveStepIndex(templateSteps.length - 1);
      setHistory([{
        databases: [templateDb],
        activeDatabaseId: templateDb.id,
        tables: assignedTables,
        relationships: chosenTemplate.schema.relationships,
        stickies: chosenTemplate.schema.stickies || [],
        frames: chosenTemplate.schema.frames || [],
        steps: templateSteps,
        title: data.title || chosenTemplate.name,
        description: data.description || chosenTemplate.description,
        author: data.author,
      }]);
      setHistoryIndex(0);
      setHasUnsavedChanges(false);
      setIsCreateProjectOpen(false);
      setIsConfirmNewProjectOpen(false);
      setTimeout(() => handleFitToScreen(), 150);
    } else {
      // Blank project: initializes with configured initial database
      const firstDb: DatabaseItem = {
        id: 'db_' + Date.now().toString(36),
        name: data.initialDatabaseName.trim() || 'principal_db',
        color: data.initialDatabaseColor || 'indigo',
        description: data.initialDatabaseDescription || 'Base de datos principal',
        createdAt: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      };
      const newDbs = [firstDb];
      const emptySteps = createInitialSteps([], []);

      setTitle(data.title);
      setProjectDescription(data.description || '');
      setProjectAuthor(data.author || '');
      setDatabases(newDbs);
      setActiveDatabaseId(firstDb.id);
      setTables([]);
      setRelationships([]);
      setStickies([]);
      setFrames([]);
      setSteps(emptySteps);
      setActiveStepIndex(0);
      setHistory([{
        databases: newDbs,
        activeDatabaseId: firstDb.id,
        tables: [],
        relationships: [],
        stickies: [],
        frames: [],
        steps: emptySteps,
        title: data.title,
        description: data.description,
        author: data.author,
      }]);
      setHistoryIndex(0);
      setHasUnsavedChanges(false);
      setIsCreateProjectOpen(false);
      setIsConfirmNewProjectOpen(false);
      setPan({ x: 80, y: 60 });
      setZoom(1);
    }
  };

  const handleCreateDatabase = (dbData: Omit<DatabaseItem, 'id' | 'createdAt'>) => {
    const newDb: DatabaseItem = {
      ...dbData,
      id: 'db_' + Date.now().toString(36),
      createdAt: new Date().toISOString(),
    };
    const updatedDbs = [...databases, newDb];
    setDatabases(updatedDbs);
    setActiveDatabaseId(newDb.id);
    setIsFirstDbPrompt(false);

    saveHistory({
      databases: updatedDbs,
      activeDatabaseId: newDb.id,
      tables,
      relationships,
      stickies,
      frames,
      steps,
      title,
    });
  };

  const handleSelectTool = (tool: CanvasTool) => {
    if (tool === 'table' && databases.length === 0) {
      setIsFirstDbPrompt(true);
      setIsCreateDbOpen(true);
      return;
    }
    setActiveTool(tool);
  };

  // Timeline step navigation (Time travel!)
  const handleSelectStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setActiveStepIndex(index);
      const snapshot = steps[index].schemaSnapshot;
      setTables(JSON.parse(JSON.stringify(snapshot.tables)));
      setRelationships(JSON.parse(JSON.stringify(snapshot.relationships)));
    }
  };

  // Add a new evolution step
  const handleSaveStep = (newStepData: Omit<SchemaStep, 'schemaSnapshot'>) => {
    // Start from current tables of the latest step
    const currentBaseTables = JSON.parse(JSON.stringify(steps[steps.length - 1].schemaSnapshot.tables)) as TableNode[];
    const currentBaseRels = JSON.parse(JSON.stringify(steps[steps.length - 1].schemaSnapshot.relationships)) as Relationship[];

    // Apply the commands to create the new step's snapshot
    newStepData.commands.forEach(cmd => {
      const targetTable = currentBaseTables.find(t => t.name.toLowerCase() === cmd.tableName.toLowerCase());
      if (targetTable) {
        if (cmd.type === 'ADD_COLUMN' && cmd.columnName) {
          const colExists = targetTable.columns.some(c => c.name.toLowerCase() === cmd.columnName?.toLowerCase());
          if (!colExists) {
            targetTable.columns.push({
              id: 'c_' + Math.random().toString(36).slice(2, 9),
              name: cmd.columnName,
              type: cmd.columnType || 'VARCHAR(255)',
              isPK: false,
              isFK: false,
              isNullable: !cmd.columnType?.toUpperCase().includes('NOT NULL'),
              isUnique: cmd.columnType?.toUpperCase().includes('UNIQUE') || false,
              comment: `Añadido en ${newStepData.version}`,
            });
          }
        } else if (cmd.type === 'DROP_COLUMN' && cmd.columnName) {
          targetTable.columns = targetTable.columns.filter(c => c.name.toLowerCase() !== cmd.columnName?.toLowerCase());
        } else if (cmd.type === 'MODIFY_COLUMN' && cmd.columnName) {
          const col = targetTable.columns.find(c => c.name.toLowerCase() === cmd.columnName?.toLowerCase());
          if (col && cmd.columnType) {
            col.type = cmd.columnType;
          }
        }
      }
    });

    const completeStep: SchemaStep = {
      ...newStepData,
      stepNumber: steps.length,
      schemaSnapshot: {
        tables: currentBaseTables,
        relationships: currentBaseRels,
      },
    };

    const newStepsList = [...steps, completeStep];
    setSteps(newStepsList);
    setActiveStepIndex(newStepsList.length - 1);
    setTables(currentBaseTables);
    setRelationships(currentBaseRels);

    saveHistory({
      tables: currentBaseTables,
      relationships: currentBaseRels,
      stickies,
      frames,
      steps: newStepsList,
      title,
    });
  };

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global Text Size Scaling Shortcuts: Ctrl + + / Ctrl + - / Ctrl + 0
      const isPlusKey = e.key === '+' || e.key === '=' || e.code === 'NumpadAdd' || e.code === 'Equal' || e.key === 'Add';
      const isMinusKey = e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract' || e.code === 'Minus' || e.key === 'Subtract';
      const isZeroKey = e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0';

      if ((e.ctrlKey || e.metaKey) && isPlusKey) {
        e.preventDefault();
        handleIncreaseFontSize();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && isMinusKey) {
        e.preventDefault();
        handleDecreaseFontSize();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && isZeroKey) {
        e.preventDefault();
        handleResetFontSize();
        return;
      }

      // F5: Ejecutar simulación de base de datos
      if (e.key === 'F5' || e.code === 'F5') {
        e.preventDefault();
        handleRunSimulation();
        return;
      }

      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName) || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      // Activar opción de movimiento (mano) únicamente mientras se mantenga presionada la tecla Espacio
      if ((e.key === ' ' || e.code === 'Space') && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTool('pan');
      } else if (e.key === 't' || e.key === 'T') {
        if (databases.length === 0) {
          setIsFirstDbPrompt(true);
          setIsCreateDbOpen(true);
        } else {
          setActiveTool('table');
        }
      } else if (e.key === 'c' || e.key === 'C') {
        setActiveTool('connector');
      } else if (e.key === 'n' || e.key === 'N') {
        setActiveTool('sticky');
      } else if (e.key === 'f' || e.key === 'F') {
        setActiveTool('frame');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement) {
          e.preventDefault();
          handleDeleteSelected();
        }
      } else if (e.key === 'Escape') {
        if (activeTab === 'simulator') {
          setActiveTab('erd');
          return;
        }
        setConnectingSource(null);
        setSelectedElement(null);
        setActiveTool('select');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    const handleBlur = () => {
      setIsSpacePressed(false);
      setIsPanning(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isSpacePressed, selectedElement, handleUndo, handleRedo, databases, handleIncreaseFontSize, handleDecreaseFontSize, handleResetFontSize, activeTab, handleRunSimulation]);

  const handleDeleteSelected = () => {
    if (!selectedElement) return;
    if (selectedElement.type === 'table') {
      handleDeleteTable(selectedElement.id);
    } else if (selectedElement.type === 'relation') {
      handleDeleteRelation(selectedElement.id);
    } else if (selectedElement.type === 'sticky') {
      handleDeleteSticky(selectedElement.id);
    } else if (selectedElement.type === 'frame') {
      handleDeleteFrame(selectedElement.id);
    }
    setSelectedElement(null);
  };

  // Prevenir scroll o zoom por defecto del navegador al usar la rueda sobre el lienzo
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const handleNativeWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      // Si la rueda se usa dentro de un desplegable, menú o select con scroll,
      // permitimos el scroll natural de la lista
      const isInsideScrollable = !!target?.closest(
        '[data-dropdown="true"], select, [role="listbox"], [role="menu"], [role="dialog"], .overflow-y-auto, .overflow-auto'
      );
      if (isInsideScrollable) {
        return;
      }

      // Si hay un desplegable abierto en la pantalla, no hacer zoom ni scroll
      const isDropdownOpen = !!document.querySelector('[data-dropdown="true"]');
      if (isDropdownOpen) {
        return;
      }

      e.preventDefault();
    };

    canvasEl.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      canvasEl.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  // Wheel handler:
  // - Rueda normal: Zoom centrado en la posición del puntero del ratón (desactivado si un select o menú está abierto)
  // - Shift + rueda: Desplazamiento en vertical (arriba / abajo)
  // - Ctrl + rueda: Desplazamiento en horizontal (derecha / izquierda)
  const handleWheel = (e: React.WheelEvent) => {
    if (!canvasRef.current) return;

    const target = e.target as HTMLElement | null;
    const isInsideScrollable = !!target?.closest(
      '[data-dropdown="true"], select, [role="listbox"], [role="menu"], [role="dialog"], .overflow-y-auto, .overflow-auto'
    );
    const isDropdownOpen = !!document.querySelector('[data-dropdown="true"]');

    // "Si se tiene abierto un select para seleccionar un tipo de datos u otra opción, la rueda del ratón no debe de hacer zoom"
    if (isInsideScrollable || isDropdownOpen) {
      return;
    }

    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Desplazamiento horizontal (derecha / izquierda) con Ctrl + rueda
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      setPan(prev => ({
        x: prev.x - delta,
        y: prev.y,
      }));
    } else if (e.shiftKey) {
      // Desplazamiento vertical (arriba / abajo) con Shift + rueda
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      setPan(prev => ({
        x: prev.x,
        y: prev.y - delta,
      }));
    } else {
      // Rueda normal del ratón: Zoom centrado en el puntero del ratón
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.2), 2.5);

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  // Canvas Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || isSpacePressed || activeTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return;

    // Guard: ignore clicks that originated on SVG elements, popups, or connection line handles
    const target = e.target as HTMLElement | SVGElement | null;
    if (target && (target.closest('svg') || target.closest('[data-popup]') || target.closest('[data-dropdown]'))) {
      return;
    }

    const world = screenToWorld(e.clientX, e.clientY);

    if (activeTool === 'table') {
      if (databases.length === 0) {
        setIsFirstDbPrompt(true);
        setIsCreateDbOpen(true);
        setActiveTool('select');
        return;
      }

      const activeDb = databases.find(d => d.id === activeDatabaseId) || databases[0];
      const newTable: TableNode = {
        id: 'table_' + Date.now().toString(36),
        databaseId: activeDb.id,
        name: 'new_entity',
        color: activeDb.color || 'indigo',
        x: Math.round(world.x),
        y: Math.round(world.y),
        columns: [
          { id: 'c1', name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, isUnique: true, isAutoIncrement: true },
          { id: 'c2', name: 'name', type: 'VARCHAR', length: '100', isPK: false, isFK: false, isNullable: false, isUnique: false },
          { id: 'c3', name: 'created_at', type: 'TIMESTAMP', isPK: false, isFK: false, isNullable: false, isUnique: false },
        ],
      };
      const updated = [...tables, newTable];
      setTables(updated);
      saveHistory({ tables: updated, relationships, stickies, frames, steps, title });
      setSelectedElement({ id: newTable.id, type: 'table' });
      setActiveTool('select');
      return;
    }

    if (activeTool === 'sticky') {
      const newSticky: StickyNode = {
        id: 'st_' + Date.now().toString(36),
        text: 'Nota nueva',
        x: Math.round(world.x),
        y: Math.round(world.y),
        width: 220,
        height: 120,
        color: 'yellow',
      };
      const updated = [...stickies, newSticky];
      setStickies(updated);
      saveHistory({ tables, relationships, stickies: updated, frames, steps, title });
      setSelectedElement({ id: newSticky.id, type: 'sticky' });
      setActiveTool('select');
      return;
    }

    if (activeTool === 'frame') {
      const newFrame: FrameNode = {
        id: 'fr_' + Date.now().toString(36),
        title: 'Nuevo Módulo',
        x: Math.round(world.x),
        y: Math.round(world.y),
        width: 500,
        height: 400,
        borderColor: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.08)',
        borderWidth: 2,
        borderStyle: 'dashed',
      };
      const updated = [...frames, newFrame];
      setFrames(updated);
      saveHistory({ tables, relationships, stickies, frames: updated, steps, title });
      setSelectedElement({ id: newFrame.id, type: 'frame' });
      setActiveTool('select');
      return;
    }

    setSelectedElement(null);
    if (connectingSource) {
      setConnectingSource(null);
    }
    if (activePopup) {
      setActivePopup(null);
    }

    // Clicking and dragging on empty canvas background moves the screen (canvas pan)
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Global capture listener: closes any active popup when clicking on any other object or canvas area
  useEffect(() => {
    if (!activePopup) return;

    const handleGlobalCaptureMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // If clicked inside the currently active popup or dropdown, do not close
      if (target.closest('[data-popup="true"]') || target.closest('[data-dropdown="true"]')) {
        return;
      }

      // If clicked directly on the trigger button of this popup, leave toggle to the button handler
      if (target.closest('[data-popup-trigger="true"]')) {
        return;
      }

      // Otherwise: clicked on another table, sticky, frame, relation, canvas, etc. -> close popup!
      setActivePopup(null);
    };

    window.addEventListener('mousedown', handleGlobalCaptureMouseDown, true);
    return () => {
      window.removeEventListener('mousedown', handleGlobalCaptureMouseDown, true);
    };
  }, [activePopup]);

  // Global window listeners for completely smooth, uninterrupted panning and dragging
  useEffect(() => {
    if (!isPanning && !draggedNode) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
        return;
      }

      if (draggedNode) {
        const dx = (e.clientX - draggedNode.startX) / zoom;
        const dy = (e.clientY - draggedNode.startY) / zoom;

        const newX = Math.round(draggedNode.elemStartX + dx);
        const newY = Math.round(draggedNode.elemStartY + dy);

        if (draggedNode.type === 'table') {
          setTables(prev => prev.map(t => (t.id === draggedNode.id ? { ...t, x: newX, y: newY } : t)));
        } else if (draggedNode.type === 'sticky') {
          setStickies(prev => prev.map(s => (s.id === draggedNode.id ? { ...s, x: newX, y: newY } : s)));
        } else if (draggedNode.type === 'frame') {
          setFrames(prev => prev.map(f => (f.id === draggedNode.id ? { ...f, x: newX, y: newY } : f)));

          // "Al mover un marco del módulo, si se tiene pulsada la tecla control, se moverá junto a los objetos que estén dentro de ella."
          const isCtrlPressed = e.ctrlKey || e.metaKey;

          if (draggedNode.containedTables && draggedNode.containedTables.length > 0) {
            setTables(prev => prev.map(t => {
              const match = draggedNode.containedTables?.find(ct => ct.id === t.id);
              if (!match) return t;
              if (isCtrlPressed) {
                return { ...t, x: Math.round(match.startX + dx), y: Math.round(match.startY + dy) };
              } else {
                return { ...t, x: match.startX, y: match.startY };
              }
            }));
          }

          if (draggedNode.containedStickies && draggedNode.containedStickies.length > 0) {
            setStickies(prev => prev.map(s => {
              const match = draggedNode.containedStickies?.find(cs => cs.id === s.id);
              if (!match) return s;
              if (isCtrlPressed) {
                return { ...s, x: Math.round(match.startX + dx), y: Math.round(match.startY + dy) };
              } else {
                return { ...s, x: match.startX, y: match.startY };
              }
            }));
          }
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (isPanning) {
        setIsPanning(false);
      }

      if (draggedNode) {
        saveHistory({ tables, relationships, stickies, frames, steps, title });
        setDraggedNode(null);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPanning, panStart, draggedNode, zoom, tables, relationships, stickies, frames, steps, title]);

  // Canvas Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    const world = screenToWorld(e.clientX, e.clientY);
    setMouseWorldPos(world);

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggedNode) {
      const dx = (e.clientX - draggedNode.startX) / zoom;
      const dy = (e.clientY - draggedNode.startY) / zoom;

      const newX = Math.round(draggedNode.elemStartX + dx);
      const newY = Math.round(draggedNode.elemStartY + dy);

      if (draggedNode.type === 'table') {
        setTables(prev => prev.map(t => (t.id === draggedNode.id ? { ...t, x: newX, y: newY } : t)));
      } else if (draggedNode.type === 'sticky') {
        setStickies(prev => prev.map(s => (s.id === draggedNode.id ? { ...s, x: newX, y: newY } : s)));
      } else if (draggedNode.type === 'frame') {
        setFrames(prev => prev.map(f => (f.id === draggedNode.id ? { ...f, x: newX, y: newY } : f)));

        // "Al mover un marco del módulo, si se tiene pulsada la tecla control, se moverá junto a los objetos que estén dentro de ella."
        const isCtrlPressed = e.ctrlKey || e.metaKey;

        if (draggedNode.containedTables && draggedNode.containedTables.length > 0) {
          setTables(prev => prev.map(t => {
            const match = draggedNode.containedTables?.find(ct => ct.id === t.id);
            if (!match) return t;
            if (isCtrlPressed) {
              return { ...t, x: Math.round(match.startX + dx), y: Math.round(match.startY + dy) };
            } else {
              return { ...t, x: match.startX, y: match.startY };
            }
          }));
        }

        if (draggedNode.containedStickies && draggedNode.containedStickies.length > 0) {
          setStickies(prev => prev.map(s => {
            const match = draggedNode.containedStickies?.find(cs => cs.id === s.id);
            if (!match) return s;
            if (isCtrlPressed) {
              return { ...s, x: Math.round(match.startX + dx), y: Math.round(match.startY + dy) };
            } else {
              return { ...s, x: match.startX, y: match.startY };
            }
          }));
        }
      }
    }
  };

  // Canvas Mouse Up
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (draggedNode) {
      saveHistory({ tables, relationships, stickies, frames, steps, title });
      setDraggedNode(null);
    }
  };

  // Start dragging a node
  const handleStartDragNode = (
    id: string,
    type: 'table' | 'sticky' | 'frame',
    e: React.MouseEvent
  ) => {
    if (activeTool === 'pan' || isSpacePressed) return;
    e.stopPropagation();

    setSelectedElement({ id, type });

    let elemStartX = 0;
    let elemStartY = 0;
    let containedTables: { id: string; startX: number; startY: number }[] = [];
    let containedStickies: { id: string; startX: number; startY: number }[] = [];

    if (type === 'table') {
      const t = tables.find(item => item.id === id);
      if (t) {
        elemStartX = t.x;
        elemStartY = t.y;
      }
    } else if (type === 'sticky') {
      const s = stickies.find(item => item.id === id);
      if (s) {
        elemStartX = s.x;
        elemStartY = s.y;
      }
    } else if (type === 'frame') {
      const f = frames.find(item => item.id === id);
      if (f) {
        elemStartX = f.x;
        elemStartY = f.y;

        // Bounding box of the frame
        const fx1 = f.x;
        const fy1 = f.y;
        const fx2 = f.x + f.width;
        const fy2 = f.y + f.height;

        // Detect all tables that are inside or mostly inside the frame
        containedTables = tables
          .filter(t => {
            const tw = t.width || TABLE_WIDTH;
            const th = getTableHeight(t);
            const cx = t.x + tw / 2;
            const cy = t.y + th / 2;
            const centerInside = cx >= fx1 && cx <= fx2 && cy >= fy1 && cy <= fy2;
            const originInside = t.x >= fx1 - 10 && t.x <= fx2 && t.y >= fy1 - 10 && t.y <= fy2;
            return centerInside || originInside;
          })
          .map(t => ({ id: t.id, startX: t.x, startY: t.y }));

        // Detect all stickies that are inside the frame
        containedStickies = stickies
          .filter(s => {
            const cx = s.x + s.width / 2;
            const cy = s.y + s.height / 2;
            const centerInside = cx >= fx1 && cx <= fx2 && cy >= fy1 && cy <= fy2;
            const originInside = s.x >= fx1 - 10 && s.x <= fx2 && s.y >= fy1 - 10 && s.y <= fy2;
            return centerInside || originInside;
          })
          .map(s => ({ id: s.id, startX: s.x, startY: s.y }));
      }
    }

    setDraggedNode({
      id,
      type,
      startX: e.clientX,
      startY: e.clientY,
      elemStartX,
      elemStartY,
      containedTables,
      containedStickies,
    });
  };

  // Start resizing a frame or sticky note from one of the 8 border handles
  const handleStartResize = (
    id: string,
    type: 'frame' | 'sticky',
    handle: ResizeHandle,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();

    if (type === 'frame') {
      const f = frames.find(item => item.id === id);
      if (!f) return;
      setSelectedElement({ id, type: 'frame' });
      setResizingNode({
        id,
        type: 'frame',
        handle,
        startX: e.clientX,
        startY: e.clientY,
        elemX: f.x,
        elemY: f.y,
        elemWidth: f.width,
        elemHeight: f.height,
      });
    } else if (type === 'sticky') {
      const s = stickies.find(item => item.id === id);
      if (!s) return;
      setSelectedElement({ id, type: 'sticky' });
      setResizingNode({
        id,
        type: 'sticky',
        handle,
        startX: e.clientX,
        startY: e.clientY,
        elemX: s.x,
        elemY: s.y,
        elemWidth: s.width,
        elemHeight: s.height,
      });
    }
  };

  // Window listeners for smooth, uninterrupted resizing across the screen
  useEffect(() => {
    if (!resizingNode) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - resizingNode.startX) / zoom;
      const dy = (e.clientY - resizingNode.startY) / zoom;

      const minW = resizingNode.type === 'frame' ? 140 : 100;
      const minH = resizingNode.type === 'frame' ? 80 : 80;

      let newX = resizingNode.elemX;
      let newY = resizingNode.elemY;
      let newW = resizingNode.elemWidth;
      let newH = resizingNode.elemHeight;

      // Horizontal resize calculation
      if (resizingNode.handle.includes('e')) {
        newW = Math.max(minW, Math.round(resizingNode.elemWidth + dx));
      } else if (resizingNode.handle.includes('w')) {
        const targetW = resizingNode.elemWidth - dx;
        const clampedW = Math.max(minW, Math.round(targetW));
        const deltaW = clampedW - resizingNode.elemWidth;
        newX = Math.round(resizingNode.elemX - deltaW);
        newW = clampedW;
      }

      // Vertical resize calculation
      if (resizingNode.handle.includes('s')) {
        newH = Math.max(minH, Math.round(resizingNode.elemHeight + dy));
      } else if (resizingNode.handle.includes('n')) {
        const targetH = resizingNode.elemHeight - dy;
        const clampedH = Math.max(minH, Math.round(targetH));
        const deltaH = clampedH - resizingNode.elemHeight;
        newY = Math.round(resizingNode.elemY - deltaH);
        newH = clampedH;
      }

      if (resizingNode.type === 'frame') {
        setFrames(prev => prev.map(f => (f.id === resizingNode.id ? { ...f, x: newX, y: newY, width: newW, height: newH } : f)));
      } else if (resizingNode.type === 'sticky') {
        setStickies(prev => prev.map(s => (s.id === resizingNode.id ? { ...s, x: newX, y: newY, width: newW, height: newH } : s)));
      }
    };

    const handleWindowMouseUp = () => {
      saveHistory({ tables, relationships, stickies, frames, steps, title });
      setResizingNode(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [resizingNode, zoom, tables, relationships, stickies, frames, steps, title]);

  // Connection creation logic
  const handleStartConnection = (fromTableId: string, fromColumnId?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConnectingSource({ fromTableId, fromColumnId });
  };

  const handleEndConnection = (toTableId: string, toColumnId?: string) => {
    if (!connectingSource) return;

    if (connectingSource.fromTableId !== toTableId) {
      const exists = relationships.some(
        r =>
          (r.fromTableId === connectingSource.fromTableId && r.toTableId === toTableId) ||
          (r.fromTableId === toTableId && r.toTableId === connectingSource.fromTableId)
      );

      if (!exists) {
        const newRel: Relationship = {
          id: 'rel_' + Date.now().toString(36),
          fromTableId: connectingSource.fromTableId,
          fromColumnId: connectingSource.fromColumnId,
          toTableId: toTableId,
          toColumnId: toColumnId,
          cardinality: '1:N',
          label: 'has_many',
        };

        const updated = [...relationships, newRel];
        setRelationships(updated);
        saveHistory({ tables, relationships: updated, stickies, frames, steps, title });
        setSelectedElement({ id: newRel.id, type: 'relation' });
      }
    }

    setConnectingSource(null);
  };

  // Node Mutations
  const handleUpdateTable = (updatedTable: TableNode) => {
    const updated = tables.map(t => (t.id === updatedTable.id ? updatedTable : t));
    setTables(updated);
    saveHistory({ tables: updated, relationships, stickies, frames, steps, title });
  };

  const handleDeleteTable = (id: string) => {
    const updatedTables = tables.filter(t => t.id !== id);
    const updatedRels = relationships.filter(r => r.fromTableId !== id && r.toTableId !== id);
    setTables(updatedTables);
    setRelationships(updatedRels);
    saveHistory({ tables: updatedTables, relationships: updatedRels, stickies, frames, steps, title });
  };

  const handleDuplicateTable = (table: TableNode) => {
    const newId = 'table_' + Date.now().toString(36);
    const duplicated: TableNode = {
      ...table,
      id: newId,
      name: `${table.name}_copy`,
      x: table.x + 40,
      y: table.y + 40,
      columns: table.columns.map(c => ({ ...c, id: 'c_' + Math.random().toString(36).slice(2, 8) })),
    };
    const updated = [...tables, duplicated];
    setTables(updated);
    saveHistory({ tables: updated, relationships, stickies, frames, steps, title });
    setSelectedElement({ id: newId, type: 'table' });
  };

  const handleUpdateRelation = (updatedRel: Relationship, saveToHistory: boolean = true) => {
    setRelationships(prev => {
      const updated = prev.map(r => (r.id === updatedRel.id ? updatedRel : r));
      if (saveToHistory) {
        saveHistory({ tables, relationships: updated, stickies, frames, steps, title });
      }
      return updated;
    });
  };

  const handleDeleteRelation = (id: string) => {
    const updated = relationships.filter(r => r.id !== id);
    setRelationships(updated);
    saveHistory({ tables, relationships: updated, stickies, frames, steps, title });
  };

  const handleUpdateSticky = (updatedSticky: StickyNode) => {
    const updated = stickies.map(s => (s.id === updatedSticky.id ? updatedSticky : s));
    setStickies(updated);
    saveHistory({ tables, relationships, stickies: updated, frames, steps, title });
  };

  const handleDeleteSticky = (id: string) => {
    const updated = stickies.filter(s => s.id !== id);
    setStickies(updated);
    saveHistory({ tables, relationships, stickies: updated, frames, steps, title });
  };

  const handleUpdateFrame = (updatedFrame: FrameNode) => {
    const updated = frames.map(f => (f.id === updatedFrame.id ? updatedFrame : f));
    setFrames(updated);
    saveHistory({ tables, relationships, stickies, frames: updated, steps, title });
  };

  const handleDeleteFrame = (id: string) => {
    const updated = frames.filter(f => f.id !== id);
    setFrames(updated);
    saveHistory({ tables, relationships, stickies, frames: updated, steps, title });
  };

  // Fit to screen helper
  const handleFitToScreen = () => {
    if (!canvasRef.current) return;
    const { clientWidth, clientHeight } = canvasRef.current;
    const result = computeFitToScreen(tables, stickies, clientWidth, clientHeight);
    setPan(result.pan);
    setZoom(result.zoom);
  };

  // Full schema replacements
  const handleApplySchema = (newSchema: ERDSchema) => {
    setTitle(newSchema.title || 'Diagrama ER');
    const newDbs: DatabaseItem[] = newSchema.databases && newSchema.databases.length > 0
      ? newSchema.databases
      : [{
          id: 'db_' + Date.now().toString(36),
          name: newSchema.title ? newSchema.title.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 20) : 'default_db',
          color: 'indigo',
          description: 'Base de datos principal',
          createdAt: new Date().toISOString(),
        }];
    const activeDbId = newSchema.activeDatabaseId || newDbs[0].id;
    setDatabases(newDbs);
    setActiveDatabaseId(activeDbId);

    const newBaseTables = (newSchema.tables || []).map(t => ({
      ...t,
      databaseId: t.databaseId || activeDbId,
    }));
    const newBaseRels = newSchema.relationships || [];
    const newSteps = createInitialSteps(newBaseTables, newBaseRels);

    setSteps(newSteps);
    setActiveStepIndex(newSteps.length - 1);
    setTables(newSteps[newSteps.length - 1].schemaSnapshot.tables);
    setRelationships(newSteps[newSteps.length - 1].schemaSnapshot.relationships);
    setStickies(newSchema.stickies || []);
    setFrames(newSchema.frames || []);

    saveHistory({
      databases: newDbs,
      activeDatabaseId: activeDbId,
      tables: newSteps[newSteps.length - 1].schemaSnapshot.tables,
      relationships: newSteps[newSteps.length - 1].schemaSnapshot.relationships,
      stickies: newSchema.stickies || [],
      frames: newSchema.frames || [],
      steps: newSteps,
      title: newSchema.title || 'Diagrama ER',
    });
    setTimeout(() => handleFitToScreen(), 100);
  };

  // Import SQL DDL tables and relationships
  const handleImportSql = (importedTables: TableNode[], importedRels: Relationship[], mode: 'replace' | 'append') => {
    let currentDbs = databases;
    let actualDbId = activeDatabaseId || (databases.length > 0 ? databases[0].id : undefined);

    if (!actualDbId) {
      const newDb: DatabaseItem = {
        id: 'db_' + Date.now().toString(36),
        name: 'esquema_importado',
        color: 'emerald',
        description: 'Base de datos generada desde código SQL',
        createdAt: new Date().toISOString(),
      };
      currentDbs = [newDb];
      setDatabases(currentDbs);
      setActiveDatabaseId(newDb.id);
      actualDbId = newDb.id;
    }

    const assignedTables = importedTables.map(t => ({
      ...t,
      databaseId: t.databaseId || actualDbId,
    }));

    if (mode === 'replace') {
      const newSteps = createInitialSteps(assignedTables, importedRels);
      setSteps(newSteps);
      setActiveStepIndex(newSteps.length - 1);
      setTables(newSteps[newSteps.length - 1].schemaSnapshot.tables);
      setRelationships(newSteps[newSteps.length - 1].schemaSnapshot.relationships);
      setStickies([]);
      setFrames([]);

      saveHistory({
        databases: currentDbs,
        activeDatabaseId: actualDbId,
        tables: newSteps[newSteps.length - 1].schemaSnapshot.tables,
        relationships: newSteps[newSteps.length - 1].schemaSnapshot.relationships,
        stickies: [],
        frames: [],
        steps: newSteps,
        title: title || 'Esquema SQL Importado',
      });
    } else {
      // Append mode: calculate maxX to place imported tables to the right of existing tables
      const maxX = tables.length > 0 ? Math.max(...tables.map(t => t.x + (t.width || TABLE_WIDTH))) + 120 : 100;
      const adjustedTables = assignedTables.map(t => ({
        ...t,
        x: t.x + maxX,
      }));

      const mergedTables = [...tables, ...adjustedTables];
      const mergedRels = [...relationships, ...importedRels];
      const newSteps = createInitialSteps(mergedTables, mergedRels);

      setSteps(newSteps);
      setActiveStepIndex(newSteps.length - 1);
      setTables(mergedTables);
      setRelationships(mergedRels);

      saveHistory({
        databases: currentDbs,
        activeDatabaseId: actualDbId,
        tables: mergedTables,
        relationships: mergedRels,
        stickies,
        frames,
        steps: newSteps,
        title,
      });
    }
    setTimeout(() => handleFitToScreen(), 150);
  };

  // Temporary live connector line when dragging from a port
  const renderTemporaryConnector = () => {
    if (!connectingSource) return null;
    const sourceTable = tables.find(t => t.id === connectingSource.fromTableId);
    if (!sourceTable) return null;

    const fontScale = fontSizePercent / 100;
    const sourceY = sourceTable.y + getColumnYOffset(sourceTable, connectingSource.fromColumnId, fontScale);
    const sourceX = sourceTable.x + (sourceTable.width || TABLE_WIDTH) * fontScale;

    const { path } = generateSmoothBezier(
      { x: sourceX, y: sourceY },
      mouseWorldPos,
      'right',
      'left'
    );

    return (
      <path
        d={path}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={2.5}
        strokeDasharray="6 4"
        className="animate-pulse pointer-events-none"
      />
    );
  };

  const currentSchema: ERDSchema = {
    title,
    description: projectDescription,
    author: projectAuthor,
    databases,
    activeDatabaseId,
    tables,
    relationships,
    stickies,
    frames,
    steps,
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* Top Header Bar */}
      <TopBar
        title={title}
        onTitleChange={newTitle => {
          setTitle(newTitle);
          saveHistory({ tables, relationships, stickies, frames, steps, title: newTitle });
        }}
        onNewProject={handleNewProject}
        hasUnsavedChanges={hasUnsavedChanges}
        onSaveProject={handleSaveProject}
        saveSuccess={saveSuccess}
        databases={databases}
        activeDatabaseId={activeDatabaseId}
        onSelectDatabase={setActiveDatabaseId}
        onOpenCreateDatabase={() => {
          setIsFirstDbPrompt(false);
          setIsCreateDbOpen(true);
        }}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenExport={() => {
          setExportInitialTab('sql');
          setIsExportOpen(true);
        }}
        onOpenSqlImport={() => setIsSqlImportOpen(true)}
        onOpenTemplates={handleOpenTemplates}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        tablesCount={tables.length}
        relationsCount={relationships.length}
        isTimelineOpen={isTimelineOpen}
        onToggleTimeline={() => setIsTimelineOpen(!isTimelineOpen)}
        stepsCount={steps.length}
        fontSizePercent={fontSizePercent}
        onIncreaseFontSize={handleIncreaseFontSize}
        onDecreaseFontSize={handleDecreaseFontSize}
        onResetFontSize={handleResetFontSize}
        onSetFontSize={handleSetFontSize}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRunSimulation={handleRunSimulation}
      />

      {/* Database Simulation Tab (In-Memory SQL Console & Created Tables Explorer) */}
      {activeTab === 'simulator' && (
        <DatabaseSimulator
          key={simulationKey}
          schema={currentSchema}
          onBackToDiagram={() => setActiveTab('erd')}
          onReRunSimulation={handleRunSimulation}
          isDark={isDark}
        />
      )}

      {/* Floating Left Toolbar */}
      <Toolbar
        activeTool={isSpacePressed ? 'pan' : activeTool}
        onSelectTool={handleSelectTool}
        onOpenSqlImport={() => setIsSqlImportOpen(true)}
        onOpenTemplates={handleOpenTemplates}
        onOpenCreateDatabase={() => {
          setIsFirstDbPrompt(false);
          setIsCreateDbOpen(true);
        }}
        isTimelineOpen={isTimelineOpen}
        onToggleTimeline={() => setIsTimelineOpen(!isTimelineOpen)}
      />

      {/* Bottom Right Zoom & Minimap Bar */}
      <ZoomBar
        zoom={zoom}
        onZoomIn={() => setZoom(prev => Math.min(prev * 1.15, 2.5))}
        onZoomOut={() => setZoom(prev => Math.max(prev * 0.85, 0.2))}
        onResetZoom={() => setZoom(1)}
        onFitToScreen={handleFitToScreen}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        fontSizePercent={fontSizePercent}
        onIncreaseFontSize={handleIncreaseFontSize}
        onDecreaseFontSize={handleDecreaseFontSize}
        onResetFontSize={handleResetFontSize}
      />

      {/* Collapsible Minimap */}
      {showMinimap && canvasRef.current && (
        <Minimap
          tables={tables}
          stickies={stickies}
          frames={frames}
          pan={pan}
          zoom={zoom}
          canvasWidth={canvasRef.current.clientWidth}
          canvasHeight={canvasRef.current.clientHeight}
          onPanChange={setPan}
        />
      )}

      {/* Interactive Whiteboard Canvas */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full h-full canvas-dots relative overflow-hidden select-none ${
          resizingNode
            ? (resizingNode.handle === 'nw' || resizingNode.handle === 'se'
                ? 'cursor-nwse-resize'
                : resizingNode.handle === 'ne' || resizingNode.handle === 'sw'
                ? 'cursor-nesw-resize'
                : resizingNode.handle === 'n' || resizingNode.handle === 's'
                ? 'cursor-ns-resize'
                : 'cursor-ew-resize')
            : isPanning || isSpacePressed || activeTool === 'pan'
            ? (isPanning ? 'cursor-grabbing' : 'cursor-grab')
            : activeTool === 'table'
            ? 'cursor-copy'
            : activeTool === 'sticky'
            ? 'cursor-crosshair'
            : 'cursor-default'
        }`}
      >
        {/* World Space Container */}
        <div
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
          className="absolute left-0 top-0 w-0 h-0 pointer-events-none"
        >
          {/* Layer 1: Frames (Grouping boundaries - elevated to z-[100] when style menu is open) */}
          <div className="relative pointer-events-auto">
            {frames.map(frame => {
              const isSelected = selectedElement?.id === frame.id;
              const isStyleMenuOpen = activePopup === 'frame_style_' + frame.id;
              return (
                <div
                  key={frame.id}
                  style={{ zIndex: isStyleMenuOpen ? 100 : 0 }}
                  className={`relative ${isStyleMenuOpen ? 'z-[100]' : 'z-0'}`}
                  onMouseDown={e => {
                    if (isSpacePressed || activeTool === 'pan') {
                      setIsPanning(true);
                      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                      return;
                    }
                    if (activePopup && activePopup !== 'frame_style_' + frame.id) {
                      setActivePopup(null);
                    }
                    // Bring frame to foreground among frames on drag start
                    setFrames(prev => {
                      const target = prev.find(f => f.id === frame.id);
                      if (!target) return prev;
                      return [...prev.filter(f => f.id !== frame.id), target];
                    });
                    handleStartDragNode(frame.id, 'frame', e);
                  }}
                >
                  <FrameCard
                    frame={frame}
                    isSelected={isSelected}
                    isOpenStyleMenu={isStyleMenuOpen}
                    onToggleStyleMenu={open => setActivePopup(open ? 'frame_style_' + frame.id : null)}
                    onSelect={e => {
                      if (isSpacePressed || isPanning || activeTool === 'pan') return;
                      e.stopPropagation();
                      if (activePopup && activePopup !== 'frame_style_' + frame.id) {
                        setActivePopup(null);
                      }
                      setSelectedElement({ id: frame.id, type: 'frame' });
                      // Bring to front among frames
                      setFrames(prev => {
                        const target = prev.find(f => f.id === frame.id);
                        if (!target) return prev;
                        return [...prev.filter(f => f.id !== frame.id), target];
                      });
                    }}
                    onUpdate={handleUpdateFrame}
                    onDelete={handleDeleteFrame}
                    onStartResize={(handle, e) => handleStartResize(frame.id, 'frame', handle, e)}
                  />
                </div>
              );
            })}
          </div>

          {/* Layer 2: SVG Relationships & Connectors - elevated to z-[50]/[100] when selected or relation context menu is open */}
          {(() => {
            const hasAnyRelPopup = relationships.some(r => activePopup === 'rel_menu_' + r.id);
            const hasSelectedRel = selectedElement?.type === 'relation';
            return (
              <svg 
                style={{ zIndex: hasAnyRelPopup ? 100 : hasSelectedRel ? 50 : 10 }}
                className={`absolute left-0 top-0 overflow-visible w-[1px] h-[1px] pointer-events-auto ${hasAnyRelPopup ? 'z-[100]' : hasSelectedRel ? 'z-[50]' : 'z-10'}`}
              >
                {relationships.map(rel => {
                  const fromT = tables.find(t => t.id === rel.fromTableId);
                  const toT = tables.find(t => t.id === rel.toTableId);
                  const isMenuOpen = activePopup === 'rel_menu_' + rel.id;
                  return (
                    <ConnectorLine
                      key={rel.id}
                      relationship={rel}
                      fromTable={fromT}
                      toTable={toT}
                      isSelected={selectedElement?.id === rel.id}
                      isOpenMenu={isMenuOpen}
                      onToggleMenu={open => setActivePopup(open ? 'rel_menu_' + rel.id : null)}
                      onSelect={e => {
                        if (isSpacePressed || isPanning || activeTool === 'pan') return;
                        e.stopPropagation();
                        if (activePopup && activePopup !== 'rel_menu_' + rel.id) {
                          setActivePopup(null);
                        }
                        setSelectedElement({ id: rel.id, type: 'relation' });
                      }}
                      onUpdate={handleUpdateRelation}
                      onDelete={handleDeleteRelation}
                      fontScale={fontSizePercent / 100}
                      zoom={zoom}
                    />
                  );
                })}

                {/* Live temporary connection preview line */}
                {renderTemporaryConnector()}
              </svg>
            );
          })()}

          {/* Layer 3: Sticky Notes - elevated to z-[100] when color picker is open */}
          <div className="relative pointer-events-auto">
            {stickies.map(sticky => {
              const isColorOpen = activePopup === 'sticky_color_' + sticky.id;
              return (
                <div
                  key={sticky.id}
                  style={{ zIndex: isColorOpen ? 100 : 15 }}
                  className={`relative ${isColorOpen ? 'z-[100]' : 'z-15'}`}
                  onMouseDown={e => {
                    if (isSpacePressed || activeTool === 'pan') {
                      setIsPanning(true);
                      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                      return;
                    }
                    if (activePopup && activePopup !== 'sticky_color_' + sticky.id) {
                      setActivePopup(null);
                    }
                    // Bring clicked sticky to top of stickies
                    setStickies(prev => {
                      const target = prev.find(s => s.id === sticky.id);
                      if (!target) return prev;
                      return [...prev.filter(s => s.id !== sticky.id), target];
                    });
                    handleStartDragNode(sticky.id, 'sticky', e);
                  }}
                >
                  <StickyNote
                    sticky={sticky}
                    isSelected={selectedElement?.id === sticky.id}
                    isOpenColorPicker={isColorOpen}
                    onToggleColorPicker={open => setActivePopup(open ? 'sticky_color_' + sticky.id : null)}
                    onSelect={e => {
                      if (isSpacePressed || isPanning || activeTool === 'pan') return;
                      e.stopPropagation();
                      if (activePopup && activePopup !== 'sticky_color_' + sticky.id) {
                        setActivePopup(null);
                      }
                      setSelectedElement({ id: sticky.id, type: 'sticky' });
                      setStickies(prev => {
                        const target = prev.find(s => s.id === sticky.id);
                        if (!target) return prev;
                        return [...prev.filter(s => s.id !== sticky.id), target];
                      });
                    }}
                    onUpdate={handleUpdateSticky}
                    onDelete={handleDeleteSticky}
                    onStartResize={(handle, e) => handleStartResize(sticky.id, 'sticky', handle, e)}
                  />
                </div>
              );
            })}
          </div>

          {/* Layer 4: Entity Tables - elevated to z-[100] when any dropdown is open */}
          <div className="relative pointer-events-auto">
            {tables.map(table => {
              const hasTablePopup = !!activePopup && activePopup.startsWith('table_') && activePopup.includes(table.id);
              return (
                <div
                  key={table.id}
                  style={{ zIndex: hasTablePopup ? 100 : 20 }}
                  className={`relative ${hasTablePopup ? 'z-[100]' : 'z-20'}`}
                  onMouseDown={e => {
                    if (isSpacePressed || activeTool === 'pan') {
                      setIsPanning(true);
                      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                      return;
                    }
                    if (activePopup && !activePopup.includes(table.id)) {
                      setActivePopup(null);
                    }
                    // Bring clicked table to top of tables
                    setTables(prev => {
                      const target = prev.find(t => t.id === table.id);
                      if (!target) return prev;
                      return [...prev.filter(t => t.id !== table.id), target];
                    });
                    handleStartDragNode(table.id, 'table', e);
                  }}
                >
                  <TableCard
                    table={table}
                    databases={databases}
                    fontScale={fontSizePercent / 100}
                    isSelected={selectedElement?.id === table.id}
                    activePopupId={activePopup}
                    onSetActivePopup={setActivePopup}
                    onSelect={e => {
                      if (isSpacePressed || isPanning || activeTool === 'pan') return;
                      e.stopPropagation();
                      if (activePopup && !activePopup.includes(table.id)) {
                        setActivePopup(null);
                      }
                      setSelectedElement({ id: table.id, type: 'table' });
                      setTables(prev => {
                        const target = prev.find(t => t.id === table.id);
                        if (!target) return prev;
                        return [...prev.filter(t => t.id !== table.id), target];
                      });
                    }}
                    onUpdateTable={handleUpdateTable}
                    onDeleteTable={handleDeleteTable}
                    onDuplicateTable={handleDuplicateTable}
                    onStartConnection={handleStartConnection}
                    onEndConnection={handleEndConnection}
                    connectingSource={connectingSource}
                    onAddStepForTable={tblName => {
                      setSelectedTableForStep(tblName);
                      setIsAddStepOpen(true);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Database Evolution Timeline Bar */}
      <TimelineBar
        steps={steps}
        activeStepIndex={activeStepIndex}
        onSelectStep={handleSelectStep}
        onOpenAddStep={() => {
          setSelectedTableForStep(undefined);
          setIsAddStepOpen(true);
        }}
        onOpenMigrationsSql={() => {
          setExportInitialTab('timeline');
          setIsExportOpen(true);
        }}
        isOpen={isTimelineOpen}
        onToggleOpen={() => setIsTimelineOpen(!isTimelineOpen)}
      />

      {/* Modal: New Evolution Step */}
      <AddStepModal
        isOpen={isAddStepOpen}
        onClose={() => setIsAddStepOpen(false)}
        tables={tables}
        currentStepCount={steps.length}
        initialTableName={selectedTableForStep}
        onSaveStep={handleSaveStep}
      />

      {/* Modal: Export & Migrations SQL */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        schema={currentSchema}
        steps={steps}
        initialTab={exportInitialTab}
        onImportJson={handleApplySchema}
      />

      {/* Modal: SQL DDL to ER Diagram Generator */}
      <SqlImportModal
        isOpen={isSqlImportOpen}
        onClose={() => setIsSqlImportOpen(false)}
        onImport={handleImportSql}
      />

      {/* Modal: Templates Gallery */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleApplySchema}
      />

      {/* Modal: Create Database */}
      <CreateDatabaseModal
        isOpen={isCreateDbOpen}
        onClose={() => {
          setIsCreateDbOpen(false);
          setIsFirstDbPrompt(false);
        }}
        onCreateDatabase={handleCreateDatabase}
        isFirstDatabase={isFirstDbPrompt}
      />

      {/* Modal: Confirm New Project Warning */}
      <ConfirmNewProjectModal
        isOpen={isConfirmNewProjectOpen}
        onClose={() => setIsConfirmNewProjectOpen(false)}
        onSaveAndCreateNew={() => {
          handleSaveProject();
          setIsConfirmNewProjectOpen(false);
          setCreateProjectInitialMode('blank');
          setIsCreateProjectOpen(true);
        }}
        onDiscardAndCreateNew={() => {
          setIsConfirmNewProjectOpen(false);
          setCreateProjectInitialMode('blank');
          setIsCreateProjectOpen(true);
        }}
      />

      {/* Modal: Create Project (Blank or Template) */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreateProject={handleCreateProject}
        initialMode={createProjectInitialMode}
      />
      {/* Floating Font Size Toast Feedback */}
      {fontSizeToast && fontSizeToast.visible && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300">
          <div className="bg-slate-900/90 dark:bg-slate-800/95 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-2xl border border-slate-700/60 flex items-center gap-2.5 text-xs font-semibold">
            <Type className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{fontSizeToast.message}</span>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-800 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-600/50">
              Ctrl + / Ctrl -
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
