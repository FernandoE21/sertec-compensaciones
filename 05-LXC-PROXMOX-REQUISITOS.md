# 🚀 Configuración LXC para Proxmox - Portal de Compensaciones

## 📌 Nombre de la Rama Separada

```
copilot/view-compensation-project-content
```

Esta rama contiene toda la documentación de despliegue sin afectar el código original.

---

## ⚙️ Requerimientos Exactos para LXC en Proxmox

### 📋 Especificaciones del Container

```yaml
Sistema Operativo: Ubuntu 22.04 LTS (template)
Tipo: LXC Container (NO VM)
ID Container: [Asignar según tu Proxmox]
```

### 💾 Recursos Recomendados

#### Configuración Mínima (Desarrollo/Testing)
```
CPU:        1 vCore
RAM:        512 MB
Swap:       256 MB
Disco:      4 GB
Red:        vmbr0 (bridge)
IP:         Estática recomendada
```

#### Configuración Recomendada (Producción)
```
CPU:        1-2 vCores
RAM:        1 GB
Swap:       512 MB
Disco:      8 GB
Red:        vmbr0 (bridge)
IP:         Estática recomendada
Hostname:   compensaciones-app
```

#### Configuración Óptima (Alta Disponibilidad)
```
CPU:        2 vCores
RAM:        2 GB
Swap:       1 GB
Disco:      16 GB
Red:        vmbr0 (bridge)
IP:         Estática recomendada
Backup:     Programado diario
Snapshot:   Antes de cambios
```

---

## 🖥️ Crear el LXC desde Proxmox Web UI

### Paso 1: Descargar Template Ubuntu

```bash
# Desde shell de Proxmox (nodo)
pveam update
pveam available | grep ubuntu
pveam download local ubuntu-22.04-standard_22.04-1_amd64.tar.zst
```

### Paso 2: Crear Container desde Web UI

1. **Botón "Create CT"** en Proxmox Web UI

2. **General**
   ```
   Node:          [Tu nodo]
   CT ID:         [Auto o manual, ej: 100]
   Hostname:      compensaciones-app
   Password:      [Tu contraseña segura]
   SSH Key:       [Opcional]
   Unprivileged:  ☑ Checked (recomendado)
   ```

3. **Template**
   ```
   Storage:       local
   Template:      ubuntu-22.04-standard_22.04-1_amd64.tar.zst
   ```

4. **Disks**
   ```
   Storage:       local-lvm (o tu storage)
   Disk size:     8 GB (mínimo 4 GB)
   ```

5. **CPU**
   ```
   Cores:         1 (o 2 para mejor rendimiento)
   CPU limit:     1 (o 2)
   CPU units:     1024 (default)
   ```

6. **Memory**
   ```
   Memory (MB):   1024 (mínimo 512)
   Swap (MB):     512 (mínimo 256)
   ```

7. **Network**
   ```
   Bridge:        vmbr0
   IPv4:          Static
   IPv4/CIDR:     192.168.1.XXX/24 (tu red)
   Gateway:       192.168.1.1 (tu gateway)
   IPv6:          SLAAC (o según tu red)
   
   # Importante: Anota la IP asignada
   ```

8. **DNS**
   ```
   DNS domain:    [tu dominio local, opcional]
   DNS servers:   8.8.8.8, 8.8.4.4 (o tus DNS)
   ```

9. **Confirm**
   - Revisar configuración
   - **☑ Start after created**
   - Click "Finish"

---

## 🔧 Crear LXC desde CLI (Alternativa)

```bash
# Desde shell de Proxmox
pct create 100 local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst \
  --hostname compensaciones-app \
  --password [TU_PASSWORD] \
  --cores 1 \
  --memory 1024 \
  --swap 512 \
  --rootfs local-lvm:8 \
  --net0 name=eth0,bridge=vmbr0,ip=192.168.1.XXX/24,gw=192.168.1.1 \
  --nameserver 8.8.8.8 \
  --unprivileged 1 \
  --features nesting=1

# Iniciar el container
pct start 100
```

---

## 📝 Configuración Post-Creación

### 1. Acceder al Container

```bash
# Opción A: Desde Proxmox
pct enter 100

# Opción B: SSH (después de configurar)
ssh root@192.168.1.XXX
```

### 2. Actualizar Sistema

```bash
apt update && apt upgrade -y
```

### 3. Instalar Deploy Script (Método Automático)

```bash
# Descargar e instalar todo automáticamente
curl -o deploy.sh https://raw.githubusercontent.com/FernandoE21/compensaciones/copilot/view-compensation-project-content/deploy.sh
chmod +x deploy.sh
./deploy.sh

# Seleccionar opción 1 (Instalación completa)
```

El script instalará automáticamente:
- Node.js (vía nvm)
- Nginx
- Firewall (UFW)
- La aplicación compilada
- Configuración completa

---

## 🔒 Configuración de Firewall (Proxmox)

### En el Nodo Proxmox

```bash
# Permitir tráfico HTTP/HTTPS al container
iptables -I FORWARD -d 192.168.1.XXX -p tcp --dport 80 -j ACCEPT
iptables -I FORWARD -d 192.168.1.XXX -p tcp --dport 443 -j ACCEPT
```

### En el Container (automático con deploy.sh)

```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

---

## 📊 Verificación del Container

```bash
# Estado del container
pct status 100

# Uso de recursos
pct status 100 -verbose

# Logs del container
pct console 100
```

---

## 🌐 Acceso a la Aplicación

Después de la instalación:

```
URL:           http://[IP_DEL_CONTAINER]
Con SSL:       https://[TU_DOMINIO] (después de configurar Certbot)

Credenciales Usuario:
- Código: [Desde base de datos]
- DNI: [Desde base de datos]

Credenciales Admin:
- Usuario: admin
- Password: Cipsa419
```

---

## 📦 Opciones de Storage en Proxmox

### Opción 1: local-lvm (Recomendado)
```
Ventajas:
- Rendimiento excelente
- Snapshots rápidos
- Ideal para containers

Uso:
Storage: local-lvm
```

### Opción 2: local
```
Ventajas:
- Más simple
- Backups directos

Uso:
Storage: local
```

### Opción 3: NFS/CIFS (Si tienes)
```
Ventajas:
- Compartido entre nodos
- Migración en caliente

Uso:
Storage: [tu-storage-nfs]
```

---

## 🔄 Características LXC Recomendadas

```bash
# Editar container después de crear
# /etc/pve/lxc/100.conf

# Agregar estas características:
features: nesting=1,keyctl=1

# Para Docker (si necesitas en futuro):
# features: nesting=1,keyctl=1,fuse=1
```

### Explicación de Features

- **nesting=1**: Permite containers dentro del container
- **keyctl=1**: Mejora compatibilidad con systemd
- **fuse=1**: Permite montar filesystems FUSE (opcional)

---

## 🎯 Checklist de Configuración

### Antes de Crear el LXC
- [ ] Template Ubuntu 22.04 descargado
- [ ] IP estática disponible en tu red
- [ ] Storage con al menos 8 GB libre
- [ ] Acceso a Proxmox Web UI o SSH

### Durante la Creación
- [ ] Container ID asignado
- [ ] Hostname: compensaciones-app
- [ ] RAM: 1 GB (mínimo 512 MB)
- [ ] CPU: 1-2 cores
- [ ] Disco: 8 GB
- [ ] Red configurada con IP estática
- [ ] DNS configurado
- [ ] Unprivileged container habilitado

### Después de Crear
- [ ] Container iniciado
- [ ] Acceso SSH funcional
- [ ] Sistema actualizado
- [ ] Deploy script ejecutado
- [ ] Aplicación accesible en navegador
- [ ] Firewall configurado
- [ ] Backup programado (opcional)

---

## 🚨 Troubleshooting Común

### Container no inicia
```bash
# Ver logs
pct status 100 -verbose
journalctl -xe

# Verificar configuración
cat /etc/pve/lxc/100.conf
```

### No hay conexión de red
```bash
# Dentro del container
ip addr show
ping 8.8.8.8

# Verificar bridge en Proxmox
brctl show
```

### Aplicación no accesible
```bash
# Dentro del container
systemctl status nginx
curl localhost

# Ver logs
tail -f /var/log/nginx/error.log
```

---

## 📈 Monitoreo del Container

### Desde Proxmox Web UI
- Summary → Ver gráficos de CPU, RAM, red
- Monitor → Logs en tiempo real

### Desde CLI
```bash
# Uso actual de recursos
pct status 100 -verbose

# Entrar al container
pct enter 100

# Ver procesos
htop

# Ver uso de disco
df -h
```

---

## 💾 Backup y Snapshots

### Crear Snapshot
```bash
# Desde Proxmox
pct snapshot 100 pre-update --description "Antes de actualización"
```

### Backup Programado
```bash
# En Proxmox Web UI:
# Datacenter → Backup → Add
# 
# Configuración:
# - Selection: CT 100
# - Schedule: Daily 02:00
# - Mode: Snapshot
# - Compression: ZSTD
```

---

## 🎓 Recursos Adicionales

### Documentación en este Repositorio
- **08-DEPLOYMENT.md**: Guía completa de despliegue
- **04-PROXMOX-QUICKSTART.md**: Inicio rápido
- **09-LXC-VS-VM-ANALYSIS.md**: Análisis técnico detallado
- **GIT-WORKFLOW-EXPLICACION.md**: Explicación de Git

### Enlaces Útiles
- [Proxmox LXC Documentation](https://pve.proxmox.com/wiki/Linux_Container)
- [Ubuntu LXC Templates](https://images.linuxcontainers.org/)

---

## ✅ Resumen Ejecutivo

```
Rama Separada:  copilot/view-compensation-project-content

LXC Ideal:
├─ OS:          Ubuntu 22.04 LTS
├─ RAM:         1 GB (mín: 512 MB)
├─ CPU:         1-2 vCores
├─ Disco:       8 GB (mín: 4 GB)
├─ Red:         Bridge vmbr0, IP estática
├─ Features:    nesting=1, keyctl=1
└─ Deploy:      Script automático disponible

Tiempo Total:   ~10 minutos
Dificultad:     Fácil ⭐⭐☆☆☆
```

---

**¡Listo para desplegar!** 🚀

Para cualquier duda, consulta los archivos de documentación en el repositorio.
