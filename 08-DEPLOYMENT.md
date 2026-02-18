# Guía de Despliegue en Proxmox - Portal de Compensaciones

## 📊 Análisis: LXC vs VM

### ✅ **Recomendación: LXC Container**

**Razones Objetivas:**

#### **Por qué LXC es la mejor opción para este proyecto:**

1. **Naturaleza de la Aplicación**
   - Aplicación web estática (React compilado a HTML/CSS/JS)
   - No requiere kernel personalizado ni drivers especiales
   - Backend completamente externo (Supabase)
   - Cero dependencias de servicios de base de datos local

2. **Recursos y Rendimiento**
   ```
   LXC Container:
   - RAM necesaria: 512MB - 1GB
   - CPU: 1-2 cores compartidos
   - Disco: 2-4GB
   - Inicio: 2-5 segundos
   - Overhead: ~5-10MB RAM
   
   VM Completa:
   - RAM necesaria: 2GB+ (SO + App)
   - CPU: 2+ cores dedicados
   - Disco: 10-20GB (OS + App)
   - Inicio: 30-60 segundos
   - Overhead: ~500MB-1GB RAM
   ```

3. **Ventajas Técnicas del LXC**
   - ✅ Compartición directa del kernel del host (mejor rendimiento)
   - ✅ Menor consumo de recursos (80% menos que VM)
   - ✅ Arranque instantáneo
   - ✅ Snapshots más rápidos y eficientes
   - ✅ Fácil backup y migración
   - ✅ Ideal para aplicaciones containerizadas/web

4. **Casos donde usarías VM en su lugar**
   - ❌ Si necesitaras Windows Server
   - ❌ Si requirieras módulos de kernel personalizados
   - ❌ Si necesitaras aislamiento total de seguridad
   - ❌ Si ejecutaras servicios de sistema críticos
   
   **Ninguno aplica a este proyecto.**

---

## 🚀 Guía de Despliegue en LXC Container

### Paso 1: Crear el LXC Container en Proxmox

```bash
# Desde la interfaz web de Proxmox o CLI:
# Usar Ubuntu 22.04 LTS como base

# Especificaciones recomendadas:
- Template: ubuntu-22.04-standard
- Disco: 8GB (suficiente para SO + Node + App)
- RAM: 1GB (512MB mínimo)
- CPU: 1 core (2 cores recomendado)
- Red: Bridge (vmbr0 o según tu configuración)
- IP: Estática recomendada
```

### Paso 2: Configuración Inicial del Container

```bash
# 1. Acceder al container
pct enter [ID_CONTAINER]

# 2. Actualizar el sistema
apt update && apt upgrade -y

# 3. Instalar dependencias básicas
apt install -y curl wget git nano
```

### Paso 3: Instalar Node.js (vía nvm - recomendado)

```bash
# Instalar NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recargar la shell
source ~/.bashrc

# Instalar Node.js LTS (versión 20.x recomendada)
nvm install 20
nvm use 20
nvm alias default 20

# Verificar instalación
node --version  # debe mostrar v20.x.x
npm --version   # debe mostrar 10.x.x
```

### Paso 4: Instalar Nginx como servidor web

```bash
# Instalar Nginx
apt install -y nginx

# Habilitar e iniciar Nginx
systemctl enable nginx
systemctl start nginx

# Verificar que funciona
systemctl status nginx
```

### Paso 5: Configurar Nginx para la aplicación

```bash
# Crear archivo de configuración
nano /etc/nginx/sites-available/compensaciones
```

**Contenido del archivo de configuración:**

```nginx
server {
    listen 80;
    server_name tu-dominio.com;  # O la IP del container
    
    root /var/www/compensaciones/dist;
    index index.html;
    
    # Logs
    access_log /var/log/nginx/compensaciones-access.log;
    error_log /var/log/nginx/compensaciones-error.log;
    
    # Compresión gzip para mejor rendimiento
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_comp_level 6;
    
    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Manejar rutas de React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # No cachear index.html
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
```

```bash
# Habilitar el sitio
ln -s /etc/nginx/sites-available/compensaciones /etc/nginx/sites-enabled/

# Eliminar sitio por defecto (opcional)
rm /etc/nginx/sites-enabled/default

# Verificar configuración
nginx -t

# Recargar Nginx
systemctl reload nginx
```

### Paso 6: Clonar y Compilar la Aplicación

```bash
# Crear directorio para la aplicación
mkdir -p /var/www/compensaciones
cd /var/www/compensaciones

# Clonar el repositorio
git clone https://github.com/FernandoE21/compensaciones.git .

# Instalar dependencias
npm install

# Compilar para producción
npm run build

# Verificar que se creó la carpeta dist/
ls -la dist/
```

### Paso 7: Configurar SSL/HTTPS (Opcional pero Recomendado)

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL (requiere dominio apuntando al servidor)
certbot --nginx -d tu-dominio.com

# Certbot configurará automáticamente Nginx para HTTPS
# Los certificados se renovarán automáticamente
```

---

## 🔄 Proceso de Actualización

### Script de actualización automatizada

Crear archivo `/root/update-compensaciones.sh`:

```bash
#!/bin/bash

echo "🔄 Actualizando Portal de Compensaciones..."

cd /var/www/compensaciones

# Hacer backup de la versión actual
cp -r dist dist.backup.$(date +%Y%m%d_%H%M%S)

# Obtener últimos cambios
git pull origin main

# Reinstalar dependencias (por si hay cambios)
npm install

# Recompilar
npm run build

# Verificar que la compilación fue exitosa
if [ -d "dist" ]; then
    echo "✅ Compilación exitosa"
    
    # Limpiar backups antiguos (mantener solo últimos 3)
    ls -t dist.backup.* | tail -n +4 | xargs rm -rf
    
    # Recargar Nginx
    systemctl reload nginx
    
    echo "✅ Actualización completada"
else
    echo "❌ Error en compilación, restaurando backup..."
    mv dist.backup.$(ls -t dist.backup.* | head -n1) dist
fi
```

```bash
# Dar permisos de ejecución
chmod +x /root/update-compensaciones.sh

# Ejecutar cuando necesites actualizar
/root/update-compensaciones.sh
```

---

## 🔒 Configuración de Seguridad

### 1. Firewall básico (UFW)

```bash
# Instalar UFW
apt install -y ufw

# Permitir SSH (importante para no perder acceso)
ufw allow 22/tcp

# Permitir HTTP y HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Habilitar firewall
ufw enable

# Verificar estado
ufw status
```

### 2. Límites de recursos del LXC (desde Proxmox host)

```bash
# Editar archivo de configuración del container
nano /etc/pve/lxc/[ID_CONTAINER].conf

# Agregar límites:
# memory: 1024      # RAM máxima en MB
# swap: 512         # Swap en MB
# cores: 2          # Número de cores
# cpulimit: 1       # Límite de CPU (1 = 100% de 1 core)
```

### 3. Actualizaciones automáticas de seguridad

```bash
# Instalar unattended-upgrades
apt install -y unattended-upgrades

# Configurar
dpkg-reconfigure -plow unattended-upgrades
```

---

## 📈 Monitoreo y Logs

### Ver logs de Nginx

```bash
# Logs de acceso
tail -f /var/log/nginx/compensaciones-access.log

# Logs de errores
tail -f /var/log/nginx/compensaciones-error.log
```

### Monitoreo de recursos

```bash
# Ver uso de CPU y RAM
htop

# Ver uso de disco
df -h

# Ver estadísticas del container (desde Proxmox host)
pct status [ID_CONTAINER]
```

---

## 🔧 Troubleshooting

### La aplicación no carga

```bash
# Verificar que Nginx está corriendo
systemctl status nginx

# Verificar que el build existe
ls -la /var/www/compensaciones/dist/

# Ver logs de error
tail -n 50 /var/log/nginx/compensaciones-error.log
```

### Problemas con React Router (404 en rutas)

Asegúrate de que la configuración de Nginx incluye:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Error de conexión a Supabase

Verifica en el navegador la consola de desarrollador:
- Problemas de CORS
- Credenciales de Supabase incorrectas
- Firewall bloqueando conexiones salientes

---

## 📊 Comparación Final: LXC vs VM

| Característica | LXC Container | VM Completa |
|---------------|---------------|-------------|
| **Consumo RAM** | 512MB - 1GB | 2GB - 4GB |
| **Consumo Disco** | 4GB - 8GB | 15GB - 30GB |
| **Tiempo de inicio** | 2-5 segundos | 30-60 segundos |
| **Rendimiento** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Facilidad de backup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Overhead** | Mínimo (~5%) | Alto (~20-30%) |
| **Ideal para** | Web apps, microservicios | Apps con SO específico |
| **Recomendado para este proyecto** | ✅ **SÍ** | ❌ NO |

---

## 🎯 Conclusión

**Para el Portal de Compensaciones, un LXC Container es objetivamente la mejor opción porque:**

1. ✅ Menor consumo de recursos (puedes tener múltiples containers en el mismo servidor)
2. ✅ Rendimiento superior para aplicaciones web
3. ✅ Despliegue y actualizaciones más rápidas
4. ✅ Backups más eficientes
5. ✅ Costos operativos menores
6. ✅ Perfectamente adecuado para la arquitectura React + Supabase

**Usa VM solo si en el futuro necesitas:**
- Ejecutar Windows Server
- Kernel personalizado
- Aislamiento de seguridad nivel hardware
- Servicios críticos de infraestructura

Para una aplicación web moderna como esta, LXC es la elección profesional correcta.

---

## 📞 Soporte

Para dudas sobre la implementación:
- Revisa los logs: `/var/log/nginx/`
- Documentación de Nginx: https://nginx.org/en/docs/
- Documentación de Proxmox LXC: https://pve.proxmox.com/wiki/Linux_Container
