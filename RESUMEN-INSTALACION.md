
# RESUMEN DE INSTALACIÓN Y USO RÁPIDO

Este documento resume los pasos esenciales para instalar, probar y desplegar el proyecto **Portal de Compensaciones - CIPSA**.

---

## 📚 Documentación del Proyecto

Para entender rápidamente el contexto y capacidades del proyecto, consulta estos archivos en orden:

**Para IAs:**
1. **[AI-CONTEXT.md](AI-CONTEXT.md)** - Párrafos de inicio/final (EMPEZAR AQUÍ)
2. **[CHANGELOG.md](CHANGELOG.md)** - Registro de cambios recientes
3. **[llms.txt](llms.txt)** - Índice principal para LLMs (formato estándar)

**Para Desarrolladores:**
1. **[README.md](README.md)** - README principal (EMPEZAR AQUÍ)
2. **[MCP.md](MCP.md)** - Model Context Protocol: Contexto inicial y estado actual
3. **[skills.md](skills.md)** - Capacidades y funcionalidades del sistema
4. **[agents.md](agents.md)** - Roles, permisos y tipos de usuarios
5. **[architecture.md](architecture.md)** - Modelos de datos, flujos y arquitectura técnica

---

## 🚀 Tecnologías Principales

- **Frontend:** React 19.2.0 + Vite 7.2.4
- **Routing:** React Router DOM 7.12.0
- **Backend:** Supabase (PostgreSQL + Storage + RPC)
- **UI:** SweetAlert2, CSS personalizado
- **Exportación:** SheetJS (xlsx)
- **PWA:** vite-plugin-pwa 1.2.0

---

## 💻 Instalación Local (Desarrollo)

```bash
# 1. Clona el repositorio
# 2. Instala dependencias
npm install

# 3. Inicia el servidor de desarrollo
npm run dev

# 4. (Opcional) Lint del código
npm run lint
```

**Acceso:** http://localhost:5173

---

## 🐳 Despliegue en Contenedor LXC (Proxmox)

Utiliza el script automatizado para despliegue completo:

```bash
# 1. Ejecuta como root
chmod +x deploy.sh
./deploy.sh

# 2. Selecciona opción 1 (Instalación completa)
```

**El script instalará:**
- Dependencias del sistema (curl, git, nginx, ufw, build-essential)
- Node.js 20 (vía nvm)
- Clonará el repositorio en `/var/www/compensaciones`
- Compilará la aplicación
- Configurará Nginx con headers de seguridad
- Configurará firewall UFW
- Creará script de actualización en `/root/update-compensaciones.sh`

**Actualizaciones futuras:**
```bash
/root/update-compensaciones.sh
```

**Acceso:**
- Red local: `http://IP_DEL_CONTENEDOR` (se muestra al finalizar)
- Ver [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md) para hacerlo público

---

## ☁️ Despliegue Público (Cloudflare)

```bash
# 1. Compila el proyecto
npm run build

# 2. El directorio dist/ contiene los archivos estáticos
# 3. Sube dist/ a tu plataforma preferida
```

**Configuración recomendada:**
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 20

---

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo con HMR
npm run build            # Compilar para producción
npm run preview          # Vista previa del build
npm run lint             # Verificar código con ESLint

# Producción (LXC)
systemctl status nginx   # Ver estado de Nginx
systemctl reload nginx   # Recargar configuración de Nginx
tail -f /var/log/nginx/compensaciones-access.log  # Ver logs en tiempo real
```

---

## 📖 Para Colaboradores (IA o Humanos)

### Si eres una IA
1. Lee **[AI-CONTEXT.md](AI-CONTEXT.md)** primero (párrafos de inicio/final)
2. Revisa **[CHANGELOG.md](CHANGELOG.md)** para cambios recientes
3. Consulta **[llms.txt](llms.txt)** para índice estructurado
4. Lee **[MCP.md](MCP.md)** para contexto completo del proyecto
5. Revisa **[skills.md](skills.md)** para entender capacidades
6. Estudia **[agents.md](agents.md)** para conocer roles y permisos
7. Analiza **[architecture.md](architecture.md)** para arquitectura y flujos de datos

### Si eres un desarrollador
1. Instala el proyecto localmente (`npm install && npm run dev`)
2. Explora los componentes en `src/`
3. Revisa la configuración de Supabase en `src/supabaseClient.js`
4. Consulta la documentación para entender el modelo de datos

---

## 🛡️ Seguridad

- ⚠️ La autenticación de admin está hardcoded (migrar a Supabase Auth)
- ⚠️ No hay Row Level Security (RLS) configurado en Supabase
- ✅ Headers de seguridad configurados en Nginx
- ✅ Firewall UFW habilitado en producción

---

## 📞 Soporte

¿Dudas? Consulta los archivos de documentación mencionados o contacta al responsable del proyecto.
