import { ERDSchema } from '../types/erd';

export const TEMPLATES: { id: string; name: string; description: string; icon: string; schema: ERDSchema }[] = [
  {
    id: 'ecommerce',
    name: 'E-Commerce Marketplace',
    description: 'Usuarios, productos, categorías, pedidos, detalles de pedido y pagos.',
    icon: 'ShoppingCart',
    schema: {
      title: 'E-Commerce Marketplace ERD',
      description: 'Modelo de datos para tienda en línea con catálogo, compras y pagos.',
      frames: [
        { id: 'f1', title: 'Catálogo de Productos', x: 60, y: 50, width: 800, height: 460, color: 'emerald' },
        { id: 'f2', title: 'Ventas y Checkout', x: 900, y: 50, width: 900, height: 800, color: 'indigo' },
        { id: 'f3', title: 'Usuarios y Accesos', x: 60, y: 540, width: 800, height: 420, color: 'purple' }
      ],
      stickies: [
        {
          id: 's1',
          text: '📌 Nota de Arquitectura:\nLos precios en order_items se guardan fijos al momento de comprar (snapshot de precio) para auditoría fiscal.',
          x: 920,
          y: 720,
          width: 280,
          height: 140,
          color: 'yellow'
        }
      ],
      tables: [
        {
          id: 'categories',
          name: 'categories',
          color: 'emerald',
          x: 100,
          y: 110,
          columns: [
            { id: 'cat1', name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, isUnique: true, isAutoIncrement: true },
            { id: 'cat2', name: 'name', type: 'VARCHAR', length: '100', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 'cat3', name: 'slug', type: 'VARCHAR', length: '120', isPK: false, isFK: false, isNullable: false, isUnique: true },
            { id: 'cat4', name: 'parent_id', type: 'INT', isPK: false, isFK: true, isNullable: true, isUnique: false },
            { id: 'cat5', name: 'is_active', type: 'BOOLEAN', isPK: false, isFK: false, isNullable: false, isUnique: false, defaultValue: 'TRUE' }
          ]
        },
        {
          id: 'products',
          name: 'products',
          color: 'emerald',
          x: 480,
          y: 110,
          columns: [
            { id: 'p1', name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, isUnique: true, isAutoIncrement: true },
            { id: 'p2', name: 'category_id', type: 'INT', isPK: false, isFK: true, isNullable: false, isUnique: false },
            { id: 'p3', name: 'sku', type: 'VARCHAR', length: '50', isPK: false, isFK: false, isNullable: false, isUnique: true },
            { id: 'p4', name: 'title', type: 'VARCHAR', length: '255', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 'p5', name: 'price', type: 'DECIMAL', length: '10,2', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 'p6', name: 'stock_quantity', type: 'INT', isPK: false, isFK: false, isNullable: false, isUnique: false, defaultValue: '0' },
            { id: 'p7', name: 'created_at', type: 'TIMESTAMP', isPK: false, isFK: false, isNullable: false, isUnique: false }
          ]
        },
        {
          id: 'users',
          name: 'users',
          color: 'purple',
          x: 100,
          y: 600,
          columns: [
            { id: 'u1', name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, isUnique: true, isAutoIncrement: true },
            { id: 'u2', name: 'email', type: 'VARCHAR', length: '255', isPK: false, isFK: false, isNullable: false, isUnique: true },
            { id: 'u3', name: 'password_hash', type: 'VARCHAR', length: '255', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 'u4', name: 'first_name', type: 'VARCHAR', length: '80', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 'u5', name: 'last_name', type: 'VARCHAR', length: '80', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 'u6', name: 'phone', type: 'VARCHAR', length: '30', isPK: false, isFK: false, isNullable: true, isUnique: false }
          ]
        },
        {
          id: 'orders',
          name: 'orders',
          color: 'indigo',
          x: 940,
          y: 110,
          columns: [
            { id: 'o1', name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, isUnique: true, isAutoIncrement: true },
            { id: 'o2', name: 'user_id', type: 'INT', isPK: false, isFK: true, isNullable: false, isUnique: false },
            { id: 'o3', name: 'order_number', type: 'VARCHAR', length: '50', isPK: false, isFK: false, isNullable: false, isUnique: true },
            { id: 'o4', name: 'status', type: 'VARCHAR', length: '30', isPK: false, isFK: false, isNullable: false, isUnique: false, defaultValue: "'PENDING'" },
            { id: 'o5', name: 'total_amount', type: 'DECIMAL', length: '12,2', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 'o6', name: 'placed_at', type: 'TIMESTAMP', isPK: false, isFK: false, isNullable: false, isUnique: false }
          ]
        },
        {
          id: 'order_items',
          name: 'order_items',
          color: 'indigo',
          x: 1400,
          y: 110,
          columns: [
            { id: 'oi1', name: 'id', type: 'BIGINT', isPK: true, isFK: false, isNullable: false, isUnique: true, isAutoIncrement: true },
            { id: 'oi2', name: 'order_id', type: 'INT', isPK: false, isFK: true, isNullable: false, isUnique: false },
            { id: 'oi3', name: 'product_id', type: 'INT', isPK: false, isFK: true, isNullable: false, isUnique: false },
            { id: 'oi4', name: 'unit_price', type: 'DECIMAL', length: '10,2', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 'oi5', name: 'quantity', type: 'INT', isPK: false, isFK: false, isNullable: false, isUnique: false, defaultValue: '1' },
            { id: 'oi6', name: 'subtotal', type: 'DECIMAL', length: '10,2', isPK: false, isFK: false, isNullable: false, isUnique: false }
          ]
        },
        {
          id: 'payments',
          name: 'payments',
          color: 'amber',
          x: 940,
          y: 460,
          columns: [
            { id: 'pay1', name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, isUnique: true, isAutoIncrement: true },
            { id: 'pay2', name: 'order_id', type: 'INT', isPK: false, isFK: true, isNullable: false, isUnique: true },
            { id: 'pay3', name: 'provider', type: 'VARCHAR', length: '50', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 'pay4', name: 'transaction_ref', type: 'VARCHAR', length: '120', isPK: false, isFK: false, isNullable: false, isUnique: true },
            { id: 'pay5', name: 'amount', type: 'DECIMAL', length: '12,2', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 'pay6', name: 'status', type: 'VARCHAR', length: '30', isPK: false, isFK: false, isNullable: false, isUnique: false }
          ]
        }
      ],
      relationships: [
        { id: 'r_cat_p', fromTableId: 'products', fromColumnId: 'p2', toTableId: 'categories', toColumnId: 'cat1', cardinality: 'N:1', label: 'categorized_as' },
        { id: 'r_u_o', fromTableId: 'orders', fromColumnId: 'o2', toTableId: 'users', toColumnId: 'u1', cardinality: 'N:1', label: 'placed_by' },
        { id: 'r_o_oi', fromTableId: 'order_items', fromColumnId: 'oi2', toTableId: 'orders', toColumnId: 'o1', cardinality: 'N:1', label: 'belongs_to' },
        { id: 'r_p_oi', fromTableId: 'order_items', fromColumnId: 'oi3', toTableId: 'products', toColumnId: 'p1', cardinality: 'N:1', label: 'references_product' },
        { id: 'r_o_pay', fromTableId: 'payments', fromColumnId: 'pay2', toTableId: 'orders', toColumnId: 'o1', cardinality: '1:1', label: 'settles_order' }
      ]
    }
  },
  {
    id: 'saas_collaboration',
    name: 'SaaS Multi-Tenant & Proyectos',
    description: 'Organizaciones, miembros, roles, proyectos, tareas y comentarios.',
    icon: 'Briefcase',
    schema: {
      title: 'SaaS Platform & Workspace ERD',
      description: 'Estructura multi-inquilino con control de acceso por roles (RBAC).',
      stickies: [
        {
          id: 'st_saas',
          text: '💡 RBAC Tip:\nEl campo "role" en organization_members permite niveles: OWNER, ADMIN, MEMBER, VIEWER.',
          x: 100,
          y: 440,
          width: 280,
          height: 120,
          color: 'teal'
        }
      ],
      tables: [
        {
          id: 'organizations',
          name: 'organizations',
          color: 'indigo',
          x: 100,
          y: 100,
          columns: [
            { id: 'org1', name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, isUnique: true, isAutoIncrement: true },
            { id: 'org2', name: 'name', type: 'VARCHAR', length: '120', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 'org3', name: 'plan', type: 'VARCHAR', length: '30', isPK: false, isFK: false, isNullable: false, isUnique: false, defaultValue: "'FREE'" },
            { id: 'org4', name: 'created_at', type: 'TIMESTAMP', isPK: false, isFK: false, isNullable: false, isUnique: false }
          ]
        },
        {
          id: 'organization_members',
          name: 'organization_members',
          color: 'purple',
          x: 480,
          y: 100,
          columns: [
            { id: 'om1', name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, isUnique: true, isAutoIncrement: true },
            { id: 'om2', name: 'org_id', type: 'INT', isPK: false, isFK: true, isNullable: false, isUnique: false },
            { id: 'om3', name: 'user_id', type: 'INT', isPK: false, isFK: true, isNullable: false, isUnique: false },
            { id: 'om4', name: 'role', type: 'VARCHAR', length: '30', isPK: false, isFK: false, isNullable: false, isUnique: false, defaultValue: "'MEMBER'" },
            { id: 'om5', name: 'joined_at', type: 'TIMESTAMP', isPK: false, isFK: false, isNullable: false, isUnique: false }
          ]
        },
        {
          id: 'projects',
          name: 'projects',
          color: 'cyan',
          x: 880,
          y: 100,
          columns: [
            { id: 'prj1', name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, isUnique: true, isAutoIncrement: true },
            { id: 'prj2', name: 'org_id', type: 'INT', isPK: false, isFK: true, isNullable: false, isUnique: false },
            { id: 'prj3', name: 'name', type: 'VARCHAR', length: '150', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 'prj4', name: 'status', type: 'VARCHAR', length: '30', isPK: false, isFK: false, isNullable: false, isUnique: false, defaultValue: "'ACTIVE'" }
          ]
        },
        {
          id: 'tasks',
          name: 'tasks',
          color: 'emerald',
          x: 1280,
          y: 100,
          columns: [
            { id: 't1', name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, isUnique: true, isAutoIncrement: true },
            { id: 't2', name: 'project_id', type: 'INT', isPK: false, isFK: true, isNullable: false, isUnique: false },
            { id: 't3', name: 'assignee_id', type: 'INT', isPK: false, isFK: true, isNullable: true, isUnique: false },
            { id: 't4', name: 'title', type: 'VARCHAR', length: '255', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 't5', name: 'priority', type: 'VARCHAR', length: '20', isPK: false, isFK: false, isNullable: false, isUnique: false, defaultValue: "'MEDIUM'" },
            { id: 't6', name: 'due_date', type: 'DATE', isPK: false, isFK: false, isNullable: true, isUnique: false }
          ]
        }
      ],
      relationships: [
        { id: 'r_org_mem', fromTableId: 'organization_members', fromColumnId: 'om2', toTableId: 'organizations', toColumnId: 'org1', cardinality: 'N:1', label: 'members_of' },
        { id: 'r_org_prj', fromTableId: 'projects', fromColumnId: 'prj2', toTableId: 'organizations', toColumnId: 'org1', cardinality: 'N:1', label: 'owns_projects' },
        { id: 'r_prj_tsk', fromTableId: 'tasks', fromColumnId: 't2', toTableId: 'projects', toColumnId: 'prj1', cardinality: 'N:1', label: 'contains_tasks' }
      ]
    }
  },
  {
    id: 'hospital',
    name: 'Hospital y Citas Clínicas',
    description: 'Pacientes, médicos, especialidades, citas médicas y recetas prescritas.',
    icon: 'Activity',
    schema: {
      title: 'Sistema de Gestión Clínica ERD',
      tables: [
        {
          id: 'patients',
          name: 'patients',
          color: 'indigo',
          x: 100,
          y: 120,
          columns: [
            { id: 'cp1', name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, isUnique: true, isAutoIncrement: true },
            { id: 'cp2', name: 'dni', type: 'VARCHAR', length: '20', isPK: false, isFK: false, isNullable: false, isUnique: true },
            { id: 'cp3', name: 'full_name', type: 'VARCHAR', length: '150', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 'cp4', name: 'blood_type', type: 'VARCHAR', length: '5', isPK: false, isFK: false, isNullable: true, isUnique: false },
            { id: 'cp5', name: 'phone', type: 'VARCHAR', length: '25', isPK: false, isFK: false, isNullable: false, isUnique: false }
          ]
        },
        {
          id: 'doctors',
          name: 'doctors',
          color: 'emerald',
          x: 100,
          y: 460,
          columns: [
            { id: 'cd1', name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, isUnique: true, isAutoIncrement: true },
            { id: 'cd2', name: 'license_no', type: 'VARCHAR', length: '30', isPK: false, isFK: false, isNullable: false, isUnique: true },
            { id: 'cd3', name: 'name', type: 'VARCHAR', length: '120', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 'cd4', name: 'specialty', type: 'VARCHAR', length: '100', isPK: false, isFK: false, isNullable: false, isUnique: false }
          ]
        },
        {
          id: 'appointments',
          name: 'appointments',
          color: 'purple',
          x: 540,
          y: 260,
          columns: [
            { id: 'ca1', name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, isUnique: true, isAutoIncrement: true },
            { id: 'ca2', name: 'patient_id', type: 'INT', isPK: false, isFK: true, isNullable: false, isUnique: false },
            { id: 'ca3', name: 'doctor_id', type: 'INT', isPK: false, isFK: true, isNullable: false, isUnique: false },
            { id: 'ca4', name: 'scheduled_for', type: 'TIMESTAMP', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 'ca5', name: 'status', type: 'VARCHAR', length: '25', isPK: false, isFK: false, isNullable: false, isUnique: false, defaultValue: "'PROGRAMADA'" }
          ]
        },
        {
          id: 'prescriptions',
          name: 'prescriptions',
          color: 'amber',
          x: 980,
          y: 260,
          columns: [
            { id: 'cr1', name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, isUnique: true, isAutoIncrement: true },
            { id: 'cr2', name: 'appointment_id', type: 'INT', isPK: false, isFK: true, isNullable: false, isUnique: true },
            { id: 'cr3', name: 'notes', type: 'TEXT', isPK: false, isFK: false, isNullable: false, isUnique: false },
            { id: 'cr4', name: 'issued_at', type: 'TIMESTAMP', isPK: false, isFK: false, isNullable: false, isUnique: false }
          ]
        }
      ],
      relationships: [
        { id: 'rh1', fromTableId: 'appointments', fromColumnId: 'ca2', toTableId: 'patients', toColumnId: 'cp1', cardinality: 'N:1', label: 'for_patient' },
        { id: 'rh2', fromTableId: 'appointments', fromColumnId: 'ca3', toTableId: 'doctors', toColumnId: 'cd1', cardinality: 'N:1', label: 'with_doctor' },
        { id: 'rh3', fromTableId: 'prescriptions', fromColumnId: 'cr2', toTableId: 'appointments', toColumnId: 'ca1', cardinality: '1:1', label: 'prescription' }
      ]
    }
  },
  {
    id: 'blank',
    name: 'Lienzo en Blanco',
    description: 'Empieza desde cero con una pizarra despejada estilo Miró.',
    icon: 'SquarePlus',
    schema: {
      title: 'Nuevo Diagrama ER',
      tables: [],
      relationships: [],
      stickies: [
        {
          id: 's_welcome',
          text: '✨ ¡Bienvenido a Relatia!\n\n• Pulsa "T" o haz clic en "+ Tabla" para crear una entidad.\n• Configura tipos (VARCHAR, INT, DATETIME...), escribe su longitud y abre el menú de opciones para marcar NOT NULL, AUTO_INCREMENT, DEFAULT o PK.\n• Arrastra desde los conectores para enlazar claves foráneas.\n• Agrega pasos de evolución (ALTER TABLE) en la línea de tiempo.',
          x: 350,
          y: 200,
          width: 340,
          height: 190,
          color: 'yellow'
        }
      ],
      frames: []
    }
  }
];
