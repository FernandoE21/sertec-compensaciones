# 📦 Guía Rápida de Despliegue en Proxmox LXC

## ⚡ Instalación Rápida (5 minutos)

### 1️⃣ Crear LXC Container en Proxmox

**Especificaciones mínimas:**
- Template: `ubuntu-22.04-standard`
- Disco: `8 GB`
- RAM: `1 GB`
- CPU: `1 core`
- Network: Bridge con IP estática

### 2️⃣ Ejecutar Script de Instalación

```bash
# Acceder al container
pct enter [ID_CONTAINER]

# Descargar y ejecutar el script de deploy
curl -o deploy.sh https://raw.githubusercontent.com/FernandoE21/compensaciones/main/deploy
chmod +x deploy.sh
./deploy.sh
```

Selecciona la opción `1` (Instalación completa) y espera ~5 minutos.

### 3️⃣ Acceder a la Aplicación

Una vez completada la instalación, accede desde tu navegador:

```
http://[IP_DEL_CONTAINER]
```

**Credenciales de prueba:**
- **Usuario:** Código de empleado + DNI (desde base de datos Supabase)
- **Admin:** `admin` / `Cipsa419`

---

## 🔄 Actualizaciones

```bash
# Dentro del container LXC
/root/update-compensaciones.sh
```

Este script automáticamente:
1. ✅ Hace backup de la versión actual
2. ✅ Descarga últimos cambios de Git
3. ✅ Recompila la aplicación
4. ✅ Recarga Nginx
5. ✅ Limpia backups antiguos

---

## 📚 Documentación Completa

Para información detallada sobre:
- Comparación LXC vs VM (con análisis objetivo)
- Configuración manual paso a paso
- Seguridad y firewall
- SSL/HTTPS con Certbot
- Troubleshooting
- Monitoreo y logs

👉 Lee el archivo [`DEPLOYMENT.md`](./DEPLOYMENT.md)

---

## 🏗️ Arquitectura del Despliegue

```
┌─────────────────────────────────────┐
│      Proxmox VE (Host)              │
│  ┌───────────────────────────────┐  │
│  │   LXC Container (Ubuntu)      │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   Nginx (Puerto 80)     │  │  │
│  │  │   ↓                     │  │  │
│  │  │   /dist/* (Static)      │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  │  Node.js (solo para build)    │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
              ↓
    Internet → Supabase API
```

---

## 🆚 ¿Por qué LXC y no VM?

| Métrica | LXC | VM |
|---------|-----|-----|
| RAM usada | **512 MB** | 2 GB+ |
| Tiempo de inicio | **3 seg** | 45 seg |
| Overhead | **5%** | 25% |
| Rendimiento web | **★★★★★** | ★★★★ |

**Conclusión:** Para una aplicación React + Supabase, LXC es 4x más eficiente.

Ver análisis completo en [`DEPLOYMENT.md`](./DEPLOYMENT.md)

---

## 🔧 Comandos Útiles

```bash
# Ver logs en tiempo real
tail -f /var/log/nginx/compensaciones-access.log

# Reiniciar Nginx
systemctl restart nginx

# Ver uso de recursos
htop

# Compilar manualmente
cd /var/www/compensaciones
npm run build

# Ver estado del firewall
ufw status
```

---

## 📞 Soporte

- 📖 Documentación completa: [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- 🐛 Issues: [GitHub Issues](https://github.com/FernandoE21/compensaciones/issues)
- 📧 Contacto: [Agregar email de soporte]

---

## ✅ Checklist Post-Instalación

- [ ] Aplicación accesible desde el navegador
- [ ] Login funciona correctamente
- [ ] Conexión a Supabase establecida
- [ ] Firewall configurado (puertos 80, 443, 22)
- [ ] Backup automático configurado
- [ ] SSL/HTTPS configurado (opcional pero recomendado)
- [ ] Script de actualización probado

---

**¡Listo para producción! 🚀**
