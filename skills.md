# Skills - Capacidades del Sistema

Este documento describe las habilidades y funcionalidades que el **Portal de Compensaciones** ofrece a sus usuarios.

---

## 🔐 Autenticación y Acceso

### Para Empleados
- Login con **código de trabajador + DNI** como contraseña
- Toggle de visibilidad de contraseña (mostrar/ocultar)
- Validación contra tabla `personal` en Supabase
- Redirección automática a panel de registros tras login exitoso
- Saludo personalizado con nombre del empleado

### Para Administradores
- Login con **usuario y contraseña** (actualmente hardcoded: admin/Cipsa419)
- Acceso a panel administrativo con directorio completo de personal
- Gestión de todos los registros de todos los empleados

---

## 📝 Gestión de Registros de Horas (Empleados)

### Crear Nueva Solicitud
- **Tipos de solicitud disponibles:**
  1. Compensación por traslado de viaje
  2. Compensación a favor de CIPSA
  3. Por salidas antes de horario
  4. Sobretiempo en cliente
  5. Sobretiempo en CIPSA

- **Campos del formulario:**
  - Tipo de solicitud (select)
  - Requerimiento (texto libre)
  - Motivo (textarea)
  - Lugar de trabajo (CIPSA, Cliente, N/A - según tipo de solicitud)
  - Tipo de marcación (select)
  - Fecha del día
  - Hora programada de inicio/fin (automático desde BDD)
  - Hora real de inicio/fin (manual)

- **Lógicas automáticas:**
  - Bloqueo/desbloqueo de campos según tipo de solicitud seleccionado
  - Carga automática de horario programado desde RPC `obtener_horario_por_fecha`
  - Validaciones de campos requeridos
  - Cálculo automático de horas totales

### Editar Solicitud Existente
- Carga de datos de registro existente por `nro_registro`
- Misma interfaz que creación con datos pre-cargados
- Guardado actualiza el registro en lugar de crear uno nuevo

### Ver Registros Propios
- Listado de todos los registros del empleado ordenados por fecha (descendente)
- **Filtros disponibles:**
  - Rango de fechas (desde - hasta)
  - Botón de limpieza de filtros

- **Información mostrada por registro:**
  - Número de registro
  - Fecha y hora de inicio/fin
  - Tipo de solicitud
  - Horas calculadas (con código de colores: verde para a favor, rojo para en contra)
  - Estado (Pendiente, Aprobado, Rechazado)
  - Lugar de trabajo
  - Motivo

- **Acciones disponibles:**
  - Ver detalle completo (modal)
  - Editar (solo si estado es Pendiente o Rechazado)
  - Eliminar (solo si estado es Pendiente o Rechazado)

### Balance de Horas
- **Resumen visual en tres bloques:**
  1. Horas a favor (compensaciones por traslado, sobretiempos)
  2. Horas en contra (compensaciones a favor de CIPSA, salidas anticipadas)
  3. Balance neto (diferencia entre favor y contra)

- Colores diferenciados: verde (favor), rojo (contra), azul (neto)
- Formato HH:MM

### Exportación a Excel
- Botón de descarga de registros filtrados
- Generación mediante librería `xlsx`
- Incluye todos los campos relevantes
- Nombre de archivo: `Registros_{Codigo}_{Fecha}.xlsx`

---

## 👔 Gestión Administrativa

### Directorio de Personal
- Listado completo de empleados con foto, nombre, cargo y sección
- **Filtros:**
  - Búsqueda por nombre, código o cargo (texto libre)
  - Filtro por sección (select)
  - Botón de limpieza de filtros

- **Visualización:**
  - Cards con foto de perfil desde Supabase Storage
  - Nombre completo
  - Código de trabajador
  - Cargo
  - Sección

- **Acciones:**
  - Click en card para ver registros del empleado

### Gestión de Registros por Empleado
- Vista similar a UserRecords pero con permisos de administrador
- **Acciones adicionales:**
  - Cambiar estado a "Aprobado" o "Rechazado"
  - Ver detalles completos de cada registro
  - Exportar a Excel

- **Estados modificables:**
  - Pendiente → Aprobado
  - Pendiente → Rechazado
  - Aprobado → Rechazado
  - Rechazado → Aprobado

---

## 🎨 Interfaz de Usuario

### Características UX/UI
- Diseño responsive (mobile-first)
- Notificación de cierre de mes con fecha dinámica (día 21 de cada mes)
- Toast notifications con SweetAlert2
- Confirmaciones para acciones destructivas (eliminar, cambiar estado)
- Loading states en todas las operaciones async
- Iconografía intuitiva (📢, 👥, ✅, ❌, etc.)

### Sistema de Colores
- Azul corporativo: `#193b48`
- Verde (aprobado/favor): `#22c55e`
- Rojo (rechazado/contra): `#ef4444`
- Amarillo (pendiente): `#eab308`
- Gris (metadatos): `#64748b`

---

## 📱 PWA (Progressive Web App)

- Manifest configurado con nombre, íconos y tema
- Service Worker para actualizaciones automáticas
- Iconos de 192x192 y 512x512
- Modo `standalone` (se ve como app nativa)
- Auto-update cuando detecta cambios

---

## 🔒 Seguridad

### Headers de Seguridad (Nginx)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block

### Validaciones
- Campos requeridos en formularios
- Validación de estados antes de permitir acciones
- Confirmación de acciones críticas
- Sanitización de inputs (vía React)

---

## 📊 Capacidades de Datos

- Consultas filtradas por fecha, estado, código de trabajador
- Ordenamiento por fecha (descendente)
- Cálculo de diferencias horarias en minutos y conversión a HH:MM
- Agregaciones para balance de horas
- Soporte para timezones (manejo de offset en edición)

---

**Nota:** Estas capacidades pueden extenderse. Consulta el código fuente o MCP.md para actualizaciones.
