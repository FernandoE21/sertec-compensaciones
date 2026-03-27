# Agents - Roles y Tipos de Usuarios

Este documento define los diferentes agentes (roles) que interactúan con el **Portal de Compensaciones**, sus permisos y responsabilidades.

---

## 👤 Rol: Empleado (User)

### Descripción
Usuario estándar del sistema. Trabajador de CIPSA que necesita registrar sus horas extras, compensaciones y visualizar su balance de horas.

### Autenticación
- **Credenciales:** Código de trabajador (ej: 0100xxxx) + DNI
- **Validación:** Consulta a tabla `personal` en Supabase
- **Flujo:** Login → Toast de bienvenida → Redirección a `/registros/:codigo`

### Permisos

#### ✅ Puede
- Ver sus propios registros de horas
- Crear nuevas solicitudes de compensación
- Editar sus solicitudes en estado "Pendiente", "Rechazado" u "Observado"
- Eliminar sus solicitudes en estado "Pendiente", "Rechazado" u "Observado"
- Filtrar sus registros por rango de fechas
- Exportar sus registros a Excel
- Ver su balance de horas (favor, contra, neto)
- Ver detalles completos de cada registro

#### ❌ No Puede
- Ver registros de otros empleados
- Cambiar el estado de sus propias solicitudes (Aprobar/Rechazar)
- Editar o eliminar solicitudes aprobadas
- Acceder al panel administrativo
- Ver el directorio completo de personal
- Modificar datos de perfil (nombres, cargo, foto, etc.)

### Rutas Asignadas
- `/` - Login de empleados
- `/registros/:codigo` - Vista de registros propios
- `/nuevo-registro/:codigo` - Crear nueva solicitud
- `/editar-registro/:codigo/:nroRegistro` - Editar solicitud existente

### Datos Accesibles
- Información propia de `personal` (nombres, apellidos, cargo, foto, código)
- Registros de `registro_horas` donde `codigo_trabajador = su_codigo`
- Horarios programados vía RPC `obtener_horario_por_fecha`

---

## 👔 Rol: Administrador (Admin)

### Descripción
Usuario con privilegios elevados. Responsable de gestionar el directorio de personal, aprobar o rechazar solicitudes de compensación y supervisar el sistema.

### Autenticación
- **Credenciales:** Usuario: `admin` / Contraseña: `Cipsa419` (hardcoded)
- **Validación:** Condicional en código (AdminLogin.jsx)
- **Flujo:** Login → Toast de bienvenida → Redirección a `/admin-panel`

### Permisos

#### ✅ Puede
- Ver el directorio completo de personal
- Filtrar personal por nombre, código, cargo o sección
- Acceder a los registros de cualquier empleado
- Cambiar el estado de solicitudes (Aprobar/Rechazar)
- Ver detalles completos de todos los registros
- Exportar registros de cualquier empleado a Excel
- Ver balance de horas de cualquier empleado
- Filtrar registros por rango de fechas

#### ❌ No Puede (actualmente)
- Crear solicitudes en nombre de empleados
- Editar campos de solicitudes (solo cambiar estado)
- Eliminar registros de empleados
- Modificar datos de personal (nombres, cargos, secciones, fotos)
- Crear nuevos usuarios administradores
- Ver logs de auditoría (no implementado)

### Rutas Asignadas
- `/admin` - Login de administradores
- `/admin-panel` - Directorio de personal
- `/admin/registros/:codigo` - Gestión de registros por empleado

### Datos Accesibles
- **Lectura completa:**
  - Tabla `personal` (todos los empleados)
  - Tabla `registro_horas` (todos los registros)
  - Storage `fotos personal` (todas las fotos)

- **Escritura:**
  - Campo `estado` en tabla `registro_horas`

---

## 🤖 Rol: Sistema (System)

### Descripción
Procesos automatizados y lógicas del sistema que operan sin intervención directa del usuario.

### Responsabilidades

#### Notificaciones
- Mostrar banner de cierre de mes (día 21 de cada mes)
- Calcular fecha de cierre dinámicamente según mes actual
- Toast notifications de confirmación de acciones

#### Validaciones Automáticas
- Bloquear campos según tipo de solicitud seleccionado
- Validar campos requeridos antes de enviar formularios
- Prevenir edición/eliminación de solicitudes aprobadas

#### Cálculos
- Calcular diferencia horaria entre inicio y fin (en minutos)
- Convertir minutos a formato HH:MM
- Sumar horas a favor y en contra
- Calcular balance neto

#### Integración con Backend
- Consultar horarios programados por RPC
- Sincronizar estados con Supabase en tiempo real
- Cargar fotos desde Storage con URLs públicas

#### PWA
- Registrar Service Worker
- Manejar actualizaciones automáticas
- Cachear assets estáticos

---

## 🔮 Roles Futuros (Propuestos)

### Supervisor
- Aprobar/rechazar solicitudes de su equipo
- Ver reportes de su sección
- No acceso a otras secciones

### Recursos Humanos
- Ver reportes globales
- Exportar nómina
- Gestionar datos de personal
- Configurar tipos de compensación

### Auditor
- Solo lectura de todos los datos
- Exportar logs de auditoría
- Ver histórico completo

---

## 📊 Matriz de Permisos

| Acción | Empleado | Admin | Sistema |
|--------|----------|-------|---------|
| Ver propios registros | ✅ | ✅ | - |
| Ver todos los registros | ❌ | ✅ | - |
| Crear solicitud | ✅ | ❌ | - |
| Editar solicitud (Pendiente/Rechazado) | ✅ (propias) | ❌ | - |
| Eliminar solicitud (Pendiente/Rechazado) | ✅ (propias) | ❌ | - |
| Aprobar/Rechazar solicitud | ❌ | ✅ | - |
| Ver directorio de personal | ❌ | ✅ | - |
| Exportar a Excel | ✅ (propios) | ✅ (todos) | - |
| Cambiar datos de perfil | ❌ | ❌ | - |
| Calcular balance de horas | - | - | ✅ |
| Validar formularios | - | - | ✅ |
| Mostrar notificaciones | - | - | ✅ |

---

**Nota:** Los roles y permisos están sujetos a evolución según las necesidades del negocio.
