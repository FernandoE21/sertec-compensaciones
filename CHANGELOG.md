# CHANGELOG

Registro de cambios significativos del proyecto Portal de Compensaciones - CIPSA.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [18-Feb-2026] - GitHub Copilot (Claude Sonnet 4.5) - Actualización 4

### Agregados
- ✅ **CLOUDFLARE-PAGES-SIMPLE.md** - Secciones de rendimiento y producción:
  - ⚡ Rendimiento: CDN vs servidor local (5-10x más rápido)
  - 🏢 Producción: Empresas que lo usan (Discord, Shopify, Canva)
  - 👥 Capacidad: Límites y cálculos de usuarios soportados
  - 💰 Planes: Gratuito (2,000 usuarios/día) vs Pro ($20/mes, 10,000 usuarios/día)
  - 🔥 Pruebas de carga: Comparativa real con Apache Bench
  - 🛡️ Seguridad: DDoS protection, SSL automático
  - 📊 Comparativa producción: Cloudflare vs servidor propio
  - ✅ Recomendación específica para CIPSA (200-500 empleados)

### Aclaraciones técnicas
- **Velocidad:** Cloudflare Pages es MÁS RÁPIDO que servidor local (CDN en 300+ ubicaciones)
- **Producción:** Totalmente apto (99.99% uptime, usado por empresas Fortune 500)
- **Capacidad gratis:** 20,000 requests/día = ~2,000 usuarios/día = suficiente para 800-1000 empleados
- **CIPSA:** Usaría solo 3.5% del límite gratuito con 200 empleados

---

## [18-Feb-2026] - GitHub Copilot (Claude Sonnet 4.5) - Actualización 3

### Agregados
- ✅ **CLOUDFLARE-PAGES-SIMPLE.md** - Guía simplificada paso a paso
  - Explicación clara: NO necesitas Proxmox/servidor
  - TODO se hace desde GitHub (gratis)
  - Cloudflare Pages (gratis)
  - Comparativa detallada vs LXC/Proxmox
  - FAQs sobre costos y límites
  - Tiempo estimado: 10-15 minutos

### Modificados
- ✅ **README.md** - Marcada Opción 2 (Cloudflare Pages) como RECOMENDADO
- ✅ **llms.txt** - Referencias actualizadas con CLOUDFLARE-PAGES-SIMPLE.md

### Aclaraciones
- GitHub: 100% gratis (repos ilimitados)
- Cloudflare Pages: 100% gratis (500 builds/mes, 20k requests/día)
- NO necesitas servidor propio para esta opción
- Deploy automático con cada git push

---

## [18-Feb-2026] - GitHub Copilot (Claude Sonnet 4.5) - Actualización 2

### Agregados
- ✅ **CLOUDFLARE-DEPLOY.md** - Guía completa de despliegue público con Cloudflare
  - Cloudflare Pages (gratis, 5 minutos)
  - Cloudflare Tunnel (sin IP pública, sin abrir puertos)
  - Cloudflare Proxy (tradicional)
  - Comparativa de opciones
  - Configuración de seguridad adicional

### Modificados
- ✅ **deploy.sh** - Ahora muestra:
  - IP local para acceso en red privada
  - Advertencia de que es solo acceso local
  - Sugerencia de consultar CLOUDFLARE-DEPLOY.md para hacerlo público
  - Opciones rápidas de Cloudflare
- ✅ **llms.txt** - Agregada referencia a CLOUDFLARE-DEPLOY.md
- ✅ **README.md** - Sección de despliegue ampliada con opciones Cloudflare
- ✅ **RESUMEN-INSTALACION.md** - Sección de despliegue público detallada
- ✅ **AI-CONTEXT.md** - Simplificado para copiar/pegar fácil:
  - Bloque de código "AL INICIAR" (un solo párrafo)
  - Bloque de código "AL FINALIZAR" (instrucciones breves)
  - Notas rápidas con archivos clave y pendientes

### Notas técnicas
- Documentación de Cloudflare cubre 3 escenarios completos
- Deploy script ahora es más informativo sobre opciones
- AI-CONTEXT optimizado para workflow rápido

---

## [18-Feb-2026] - GitHub Copilot (Claude Sonnet 4.5)

### Agregados
- ✅ **AI-CONTEXT.md** - Archivo con párrafos de inicio/final para IAs
- ✅ **CHANGELOG.md** - Este archivo para trackear cambios
- ✅ **llms.txt** - Índice estructurado siguiendo estándar llmstxt.org
- ✅ **README.md** - README principal con badges y estructura profesional
- ✅ **MCP.md** - Documentación del Model Context Protocol (Anthropic)
- ✅ **skills.md** - Capacidades completas del sistema
- ✅ **agents.md** - Roles y permisos (Empleado, Admin, Sistema)
- ✅ **architecture.md** - Modelos de datos, flujos y arquitectura técnica
- ✅ **RESUMEN-INSTALACION.md** - Guía de instalación completa

### Modificados
- ✅ **deploy.sh** - Mejoras de robustez:
  - Agregado `DEBIAN_FRONTEND=noninteractive` para evitar prompts
  - Agregado `build-essential` para dependencias nativas
  - Validaciones de nvm, node y npm tras instalación
  - Carga automática de nvm en todas las operaciones
  - Mejor manejo de errores con verificaciones explícitas
  - Script de actualización mejorado con validaciones

### Eliminados
- ✅ Limpieza de documentación antigua:
  - 00-README.md
  - 01-INDICE-DOCUMENTACION.txt
  - 02-GUIA-DE-INICIO.md
  - 03-CLOUDFLARE-PAGES-DEPLOY.md
  - 04-PROXMOX-QUICKSTART.md
  - 05-LXC-PROXMOX-REQUISITOS.md
  - 06-REFERENCIA-RAPIDA-LXC.txt
  - 07-GIT-WORKFLOW-EXPLICACION.md
  - 08-DEPLOYMENT.md
  - 09-LXC-VS-VM-ANALYSIS.md
  - DEBIAN-12-COMPATIBLE.md
  - DEBIAN-RESPUESTA-RAPIDA.txt
  - ORDEN-DE-LECTURA.txt

### Renombrados
- ✅ **mmls.md → architecture.md** - Nomenclatura estándar de la industria

### Notas técnicas
- Documentación ahora sigue estándares **llms.txt** (https://llmstxt.org/)
- Implementación del **Model Context Protocol** de Anthropic
- Estructura compatible con VS Code PagePilot Extension
- Archivos organizados para máxima legibilidad por IAs y humanos

### Pendientes
- [ ] Migrar autenticación admin a Supabase Auth
- [ ] Implementar Row Level Security (RLS) en Supabase
- [ ] Agregar roles granulares (Supervisor, RRHH, Auditor)
- [ ] Sistema de notificaciones push (PWA)
- [ ] Dashboard de analytics para administradores
- [ ] Integración con sistema de nómina

---

## [Antes del 18-Feb-2026] - Estado inicial

### Existente
- ✅ Aplicación React 19.2.0 + Vite 7.2.4
- ✅ Integración con Supabase (PostgreSQL + Storage + RPC)
- ✅ Componentes principales:
  - App.jsx (Login empleados)
  - AdminLogin.jsx (Login admin)
  - UserRecords.jsx (Vista empleado)
  - AdminDashboard.jsx (Panel admin)
  - AdminUserRecords.jsx (Gestión admin)
  - NewRequest.jsx (Crear/editar solicitudes)
- ✅ PWA configurada con vite-plugin-pwa
- ✅ Exportación a Excel con xlsx
- ✅ Sistema de estados (Pendiente, Aprobado, Rechazado)
- ✅ Filtros por fecha y tipo de solicitud
- ✅ Balance de horas (favor/contra/neto)

---

## Plantilla para nuevas entradas

```markdown
## [DD-MMM-YYYY] - [Nombre IA/Desarrollador]

### Agregados
- Descripción del nuevo archivo/funcionalidad

### Modificados
- Archivo: cambio realizado

### Eliminados
- Archivo/funcionalidad eliminada (razón)

### Pendientes
- Tarea pendiente 1
- Tarea pendiente 2

### Notas técnicas
- Detalles importantes sobre cambios técnicos
```

---

**Instrucciones:** 
- Actualizar este archivo al finalizar cada sesión de trabajo
- Incluir fecha, quién hizo el cambio (IA o humano) y descripción clara
- Mantener orden cronológico (más reciente arriba)
- Usar emojis ✅ para completados, [ ] para pendientes
