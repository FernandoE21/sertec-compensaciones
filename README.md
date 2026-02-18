# Portal de Compensaciones - CIPSA

Sistema web de gestión de horas extras y compensaciones laborales desarrollado con React 19 + Vite y Supabase.

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ECF8E?logo=supabase&logoColor=white)

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Producción
npm run build
```

## 📚 Documentación

**Para IAs y LLMs:**
- 🤖 **[AI-CONTEXT.md](AI-CONTEXT.md)** - Párrafos de inicio/final (EMPEZAR AQUÍ)
- 📝 **[CHANGELOG.md](CHANGELOG.md)** - Registro de cambios
- 📄 **[llms.txt](llms.txt)** - Índice estructurado (estándar llms.txt)
- 🔌 **[MCP.md](MCP.md)** - Model Context Protocol (estándar Anthropic)

**Para Desarrolladores:**
- 📖 **[RESUMEN-INSTALACION.md](RESUMEN-INSTALACION.md)** - Guía de instalación completa
- 🎯 **[skills.md](skills.md)** - Capacidades del sistema
- 👥 **[agents.md](agents.md)** - Roles y permisos
- 🏗️ **[architecture.md](architecture.md)** - Arquitectura técnica

## 🛠️ Stack Tecnológico

- **Frontend:** React 19.2.0, Vite 7.2.4
- **Routing:** React Router DOM 7.12.0
- **Backend:** Supabase (PostgreSQL + Storage + RPC)
- **UI/UX:** SweetAlert2, CSS personalizado
- **Exportación:** SheetJS (xlsx)
- **PWA:** vite-plugin-pwa

## 🐳 Despliegue

### Opción 1: LXC Container (Proxmox) - Red Local
```bash
chmod +x deploy.sh
./deploy.sh
# Acceso: http://IP_LOCAL (se muestra al finalizar)
```

### Opción 2: Cloudflare Pages - Público y Gratis ⭐ RECOMENDADO
```bash
# NO necesitas servidor, NO necesitas Proxmox
# Todo gratis: GitHub + Cloudflare Pages
# Ver: CLOUDFLARE-PAGES-SIMPLE.md para guía completa
```
**Resultado:** `https://tu-app.pages.dev` (SSL automático, CDN global)

### Opción 3: Cloudflare Tunnel - LXC Público
```bash
# Expone tu LXC a internet sin IP pública
# Ver: CLOUDFLARE-DEPLOY.md
```

### Opción 4: Otras Plataformas Cloud
```bash
npm run build
# Subir carpeta dist/ a Vercel/Netlify
```

**📖 Guía completa:** [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md)

## 📝 Características

- ✅ Autenticación dual (empleados y administradores)
- ✅ Gestión de horas extras y compensaciones
- ✅ Sistema de aprobación/rechazo
- ✅ Exportación a Excel
- ✅ Filtros por fecha y tipo
- ✅ Balance de horas (favor/contra)
- ✅ PWA con soporte offline
- ✅ UI responsive

## 🔐 Seguridad

- Headers de seguridad en Nginx
- Validaciones en formularios
- Confirmación de acciones críticas
- Firewall UFW configurado

## 📄 Licencia

Proyecto privado - CIPSA

## 🤝 Contribución

Consulta la documentación en [llms.txt](llms.txt) o [MCP.md](MCP.md) para entender el proyecto completo.
