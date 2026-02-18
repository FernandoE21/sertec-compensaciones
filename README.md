# Portal de Compensaciones - CIPSA

Sistema web para gestión de horas extras y compensaciones laborales.

## 🚀 Tecnologías

- **Frontend:** React 19.2.0 + Vite
- **Routing:** React Router DOM 7.12.0
- **Backend:** Supabase (BaaS)
- **UI:** SweetAlert2
- **Exportación:** XLSX

## 📋 Características

- ✅ Portal de empleados para registro de horas extras
- ✅ Panel administrativo para aprobación y gestión
- ✅ Tipos de compensación: traslados, sobretiempos, salidas anticipadas
- ✅ Exportación a Excel
- ✅ Notificaciones de cierre de mes
- ✅ Autenticación segura con Supabase

## 🏃 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa del build
npm run preview

# Lint
npm run lint
```

## 🐳 Despliegue en Proxmox

### ⚡ Instalación Rápida (5 minutos)

```bash
# En tu LXC container de Proxmox
curl -o deploy.sh https://raw.githubusercontent.com/FernandoE21/compensaciones/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### 📚 Documentación de Despliegue

- **[Guía Rápida Proxmox](./PROXMOX-QUICKSTART.md)** - Setup en 5 minutos
- **[Guía Completa de Despliegue](./DEPLOYMENT.md)** - Análisis LXC vs VM, configuración detallada

**¿LXC o VM?** → **LXC es la opción recomendada** (4x más eficiente para apps React)

## 🔐 Credenciales

- **Usuario:** Código empleado + DNI (base de datos)
- **Admin:** `admin` / `Cipsa419`

## 📁 Estructura del Proyecto

```
src/
├── App.jsx              # Login principal
├── UserRecords.jsx      # Registros de usuario
├── NewRequest.jsx       # Formulario de solicitud
├── AdminLogin.jsx       # Login admin
├── AdminDashboard.jsx   # Panel admin
├── AdminUserRecords.jsx # Gestión de registros
├── supabaseClient.js    # Cliente Supabase
└── main.jsx             # Routing principal
```

## 🛠️ Configuración

La aplicación usa Supabase como backend. Verifica las credenciales en `src/supabaseClient.js`.

## 📞 Soporte

- 📖 [Documentación de despliegue](./DEPLOYMENT.md)
- 🐛 [Reportar un problema](https://github.com/FernandoE21/compensaciones/issues)
