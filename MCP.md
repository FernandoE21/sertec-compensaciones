# Model Context Protocol (MCP) - Portal de Compensaciones

## ¿Qué es MCP?

El **Model Context Protocol (MCP)** es un estándar abierto desarrollado por Anthropic para conectar aplicaciones de IA con sistemas externos (fuentes de datos, herramientas, flujos de trabajo). Funciona como un "USB-C para aplicaciones AI", proporcionando una forma estandarizada de dar contexto a los modelos de lenguaje.

Este archivo implementa el MCP para el proyecto **Portal de Compensaciones - CIPSA**, proporcionando contexto estructurado que permite a cualquier IA (Claude, ChatGPT, GitHub Copilot, etc.) entender rápidamente el proyecto completo.

---

## Contexto Inicial del Proyecto

**Portal de Compensaciones - CIPSA** es un sistema web de gestión de horas extras y compensaciones laborales desarrollado con **React 19 + Vite** y **Supabase** como backend-as-a-service. El sistema permite a los empleados registrar diferentes tipos de compensaciones (traslados, sobretiempos, salidas anticipadas) y a los administradores aprobar o rechazar estas solicitudes. La aplicación está diseñada para desplegarse en contenedores LXC de Proxmox o en plataformas cloud como Cloudflare Pages.

### Características Principales
- Autenticación dual (empleados con código+DNI, administradores con usuario/contraseña)
- Gestión de registros de horas con filtros por fecha y tipo
- Exportación a Excel
- Sistema de estados (Pendiente, Aprobado, Rechazado)
- UI responsive con notificaciones de cierre de mes
- PWA (Progressive Web App) con soporte offline

---

## Estado Actual del Proyecto

**Última actualización:** Febrero 18, 2026

### Cambios Recientes
- ✅ Limpieza de documentación: eliminados archivos .md redundantes, consolidado en RESUMEN-INSTALACION.md
- ✅ Estructura de rutas actualizada con React Router DOM 7.12.0
- ✅ Implementación de toggle de visibilidad de contraseña en login
- ✅ Sistema de filtros dobles en AdminDashboard (texto + sección)
- ✅ Script de despliegue automatizado (deploy.sh) para LXC containers
- ✅ Configuración PWA con vite-plugin-pwa
- ✅ Documentación MCP/skills/agents/mmls creada para contexto de IA

### Tecnologías Actuales
- **Frontend:** React 19.2.0, Vite 7.2.4
- **Routing:** React Router DOM 7.12.0
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **UI/UX:** SweetAlert2, CSS personalizado
- **Exportación:** SheetJS (xlsx)
- **PWA:** vite-plugin-pwa 1.2.0
- **Deploy:** Nginx, Node.js 20 (vía nvm)

### Arquitectura
```
src/
├── main.jsx              # Entry point, rutas
├── App.jsx               # Login empleados
├── AdminLogin.jsx        # Login administradores
├── AdminDashboard.jsx    # Directorio de personal
├── AdminUserRecords.jsx  # Gestión de registros (admin)
├── UserRecords.jsx       # Vista de registros (empleados)
├── NewRequest.jsx        # Crear/editar solicitudes
├── supabaseClient.js     # Cliente Supabase
├── App.css               # Estilos globales
└── index.css             # Reset CSS
```

### Base de Datos Supabase
**Tablas principales:**
- `personal` - Información de empleados (código, DNI, nombres, apellidos, cargo, sección, foto)
- `registro_horas` - Registros de horas (nro_registro, codigo_trabajador, tipo_solicitud, estado, fecha_hora_inicio, fecha_hora_fin, lugar_trabajo, motivo, requerimiento, tipo_de_marcacion)

**Funciones RPC:**
- `obtener_horario_por_fecha` - Consulta horario programado por fecha

**Storage:**
- Bucket `fotos personal` - Fotos de perfil de empleados

---

## Instrucciones para Nuevos Colaboradores (IA o Humanos)

1. **Leer primero:** RESUMEN-INSTALACION.md para setup rápido
2. **Entender capacidades:** skills.md (funcionalidades del sistema)
3. **Conocer roles:** agents.md (tipos de usuarios y permisos)
4. **Arquitectura:** mmls.md (flujos de datos y modelos)
5. **Deploy:** Revisar deploy.sh para despliegue automatizado

### Comandos Rápidos
```bash
npm install      # Instalar dependencias
npm run dev      # Servidor desarrollo (localhost:5173)
npm run build    # Compilar para producción
npm run preview  # Vista previa del build
```

### Próximos Pasos Sugeridos
- Migrar autenticación de admin a Supabase Auth
- Implementar roles y permisos granulares (Supervisor, RRHH, Auditor)
- Agregar notificaciones push (PWA)
- Dashboard de analytics para administradores
- Sistema de aprobaciones por niveles
- Integración con sistema de nómina
- Implementar Row Level Security (RLS) en Supabase

---

## Cómo usar este MCP

### Para IAs (Claude, ChatGPT, Copilot, etc.)
1. **Leer primero:** [AI-CONTEXT.md](AI-CONTEXT.md) para párrafos de inicio/final
2. **Leer cambios:** [CHANGELOG.md](CHANGELOG.md) para cambios recientes
3. **Contexto general:** Este archivo (MCP.md) para contexto completo
4. **Estructura completa:** [llms.txt](llms.txt) para índice de toda la documentación
5. **Entender capacidades:** [skills.md](skills.md) para funcionalidades del sistema
6. **Conocer roles:** [agents.md](agents.md) para tipos de usuarios y permisos
7. **Arquitectura:** [architecture.md](architecture.md) para flujos de datos y modelos

### Para Desarrolladores Humanos
1. **Inicio rápido:** [RESUMEN-INSTALACION.md](RESUMEN-INSTALACION.md)
2. **Instalar localmente:** `npm install && npm run dev`
3. **Explorar código:** Revisar componentes en `src/`
4. **Configurar Supabase:** Ver `src/supabaseClient.js`
5. **Consultar arquitectura:** [architecture.md](architecture.md)

### Comandos Rápidos
```bash
npm install      # Instalar dependencias
npm run dev      # Servidor desarrollo (localhost:5173)
npm run build    # Compilar para producción
npm run preview  # Vista previa del build
```

---

## Estructura de Archivos MCP

```
/root/compensaciones/
├── AI-CONTEXT.md             # 🤖 Párrafos inicio/final para IAs (LEER PRIMERO)
├── CHANGELOG.md              # 📝 Registro de cambios del proyecto
├── llms.txt                  # 📄 Índice principal para LLMs (formato estándar)
├── README.md                 # 📘 README principal de GitHub
├── MCP.md                    # 🔌 Este archivo - Contexto MCP
├── skills.md                 # 🎯 Capacidades del sistema
├── agents.md                 # 👥 Roles y permisos
├── architecture.md           # 🏗️ Modelos, flujos y arquitectura
├── RESUMEN-INSTALACION.md    # 📖 Guía de instalación
├── deploy.sh                 # 🐳 Script de despliegue automatizado
├── package.json              # 📦 Dependencias y scripts
├── vite.config.js            # ⚙️ Configuración Vite y PWA
└── src/                      # 💻 Código fuente
    ├── main.jsx              # Entry point
    ├── App.jsx               # Login empleados
    ├── AdminLogin.jsx        # Login admin
    ├── UserRecords.jsx       # Vista empleado
    ├── AdminDashboard.jsx    # Panel admin
    ├── AdminUserRecords.jsx  # Gestión admin
    ├── NewRequest.jsx        # Crear/editar solicitudes
    └── supabaseClient.js     # Cliente Supabase
```

---

## Integración con Model Context Protocol

Este proyecto sigue el estándar MCP de Anthropic:

1. **Archivo llms.txt:** Proporciona índice estructurado de la documentación
2. **Documentación markdown:** Todos los archivos .md son legibles por humanos y LLMs
3. **Estructura clara:** Separación de concerns (skills, agents, architecture)
4. **Referencias explícitas:** Enlaces entre documentos para navegación fácil
5. **Contexto actualizado:** Este archivo se actualiza con cada cambio significativo

### Beneficios del MCP
- **Para IAs:** Comprensión rápida y precisa del proyecto completo
- **Para Desarrolladores:** Documentación consistente y fácil de navegar
- **Para Colaboración:** Nuevo personal (IA o humano) se pone al día rápidamente
- **Para Mantenimiento:** Historial claro de cambios y decisiones arquitectónicas

---

**Nota:** Este documento debe actualizarse cada vez que se realicen cambios significativos en la arquitectura, tecnologías o funcionalidades del proyecto.

---

## Referencias Adicionales

- **Estándar llms.txt:** https://llmstxt.org/
- **Model Context Protocol:** https://modelcontextprotocol.io/
- **Anthropic MCP:** https://www.anthropic.com/news/model-context-protocol
- **GitHub MCP:** https://github.com/modelcontextprotocol
