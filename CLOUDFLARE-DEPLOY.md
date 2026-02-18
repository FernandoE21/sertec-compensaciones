# Guía de Despliegue Público con Cloudflare

Este documento explica cómo hacer público el Portal de Compensaciones usando Cloudflare.

---

## 🌐 Opciones de Despliegue

### Opción 1️⃣: Cloudflare Pages (Recomendado - Más Fácil)

**Ideal para:** Pruebas rápidas, compartir con equipo, demo a clientes

**Características:**
- ✅ Totalmente gratis
- ✅ SSL/HTTPS automático
- ✅ Deploy automático desde GitHub
- ✅ CDN global (ultra rápido)
- ✅ URL: `https://compensaciones.pages.dev`
- ⚠️ Solo frontend (funciona porque usas Supabase como backend)

**Pasos:**

1. **Crear repositorio en GitHub** (si no lo tienes):
   ```bash
   cd /root/compensaciones
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/tu-usuario/compensaciones.git
   git push -u origin main
   ```

2. **Ir a Cloudflare Pages:**
   - https://dash.cloudflare.com/
   - Crear cuenta gratis
   - Ir a **Workers & Pages** → **Create application** → **Pages**

3. **Conectar GitHub:**
   - Conecta tu repositorio de GitHub
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: 20

4. **Deploy:**
   - Cloudflare compilará y desplegará automáticamente
   - URL disponible en 2-3 minutos
   - Cada push a `main` despliega automáticamente

**Dominio personalizado (opcional):**
```
Cloudflare Pages → Custom domains → Add custom domain
Ejemplo: compensaciones.tuempresa.com
```

---

### Opción 2️⃣: Cloudflare Tunnel (Para tu LXC)

**Ideal para:** Producción en servidor propio, sin IP pública, sin abrir puertos

**Características:**
- ✅ Gratis (hasta tráfico moderado)
- ✅ Expone tu LXC local a internet de forma segura
- ✅ Sin abrir puertos en router (sin riesgo de seguridad)
- ✅ SSL automático
- ✅ URL: `https://compensaciones.tudominio.com`
- ✅ Logs y analytics en dashboard Cloudflare

**Requisitos:**
- Dominio propio (puede ser de cualquier registrador)
- Nombre servers apuntando a Cloudflare

**Pasos:**

#### 1. Instalar `cloudflared` en tu LXC

```bash
# Descargar cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# Instalar
dpkg -i cloudflared-linux-amd64.deb

# Verificar instalación
cloudflared --version
```

#### 2. Autenticar con Cloudflare

```bash
cloudflared tunnel login
```

Esto abrirá un navegador para autenticarte. Selecciona tu dominio.

#### 3. Crear el Tunnel

```bash
# Crear tunnel
cloudflared tunnel create compensaciones

# Copiar el UUID que te devuelve (ejemplo: abc123-def456-ghi789)
```

#### 4. Configurar el Tunnel

Crear archivo de configuración:

```bash
nano ~/.cloudflared/config.yml
```

Pegar este contenido:

```yaml
tunnel: abc123-def456-ghi789  # Reemplaza con tu UUID
credentials-file: /root/.cloudflared/abc123-def456-ghi789.json

ingress:
  - hostname: compensaciones.tudominio.com
    service: http://localhost:80
  - service: http_status:404
```

#### 5. Crear registro DNS

```bash
cloudflared tunnel route dns compensaciones compensaciones.tudominio.com
```

#### 6. Iniciar el Tunnel

```bash
# Probar primero
cloudflared tunnel run compensaciones

# Si funciona, instalar como servicio
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared
```

#### 7. Verificar

```bash
systemctl status cloudflared

# Abrir en navegador:
# https://compensaciones.tudominio.com
```

**Troubleshooting:**
```bash
# Ver logs
journalctl -u cloudflared -f

# Reiniciar servicio
systemctl restart cloudflared

# Detener tunnel
systemctl stop cloudflared
```

---

### Opción 3️⃣: Cloudflare como Proxy (Tradicional)

**Ideal para:** Si ya tienes IP pública y dominio configurado

**Requisitos:**
- IP pública estática
- Dominio propio
- Puerto 80/443 abierto en router → LXC

**Pasos:**

1. **Configurar DNS en Cloudflare:**
   - Tipo: `A`
   - Name: `compensaciones` (o `@` para raíz)
   - IPv4 address: `TU_IP_PUBLICA`
   - Proxy status: ✅ Proxied (naranja)

2. **Configurar Nginx en LXC para aceptar el dominio:**

```bash
nano /etc/nginx/sites-available/compensaciones
```

Cambiar:
```nginx
server_name _;  # Quitar esto
```

Por:
```nginx
server_name compensaciones.tudominio.com;
```

3. **Recargar Nginx:**
```bash
nginx -t
systemctl reload nginx
```

4. **SSL automático:**
Cloudflare maneja SSL automáticamente. En tu Nginx ya no necesitas configurar Let's Encrypt.

---

## 📊 Comparativa

| Característica | Cloudflare Pages | Cloudflare Tunnel | Proxy Tradicional |
|---------------|------------------|-------------------|-------------------|
| **Precio** | Gratis | Gratis | Gratis (+ costo IP pública) |
| **SSL automático** | ✅ | ✅ | ✅ |
| **Deploy automático** | ✅ GitHub | ❌ Manual | ❌ Manual |
| **Necesita servidor** | ❌ | ✅ Tu LXC | ✅ Tu LXC |
| **IP pública requerida** | ❌ | ❌ | ✅ |
| **Abrir puertos router** | ❌ | ❌ | ✅ |
| **Velocidad** | ⚡⚡⚡ CDN global | ⚡⚡ Depende ubicación | ⚡ Depende ISP |
| **Seguridad** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Facilidad setup** | ⚡ Muy fácil | ⚡ Fácil | ⚙️ Medio |

---

## 🎯 Recomendación

### Para **pruebas y demos:**
→ **Cloudflare Pages** (5 minutos de setup)

### Para **producción interna** (solo empleados de la empresa):
→ **Cloudflare Tunnel** (expone tu LXC sin riesgos)

### Para **alta disponibilidad** y **escalabilidad:**
→ **Cloudflare Pages** + Supabase (arquitectura serverless)

---

## 🔒 Seguridad Adicional

Si usas Cloudflare Tunnel o Proxy, puedes configurar:

### 1. Cloudflare Access (Proteger la app)

```bash
# En Cloudflare Dashboard:
Zero Trust → Access → Applications → Add an application

- Application name: Portal Compensaciones
- Subdomain: compensaciones
- Domain: tudominio.com
- Policy: 
  - Allow emails ending in: @tuempresa.com
  - O require login con Google/Microsoft
```

Esto agrega autenticación ANTES de llegar a tu app.

### 2. Rate Limiting

```bash
# Cloudflare Dashboard:
Security → WAF → Rate limiting rules

- Protege contra fuerza bruta en /admin
- Limita requests por IP
```

---

## 📝 Próximos pasos

1. Elige la opción que prefieras
2. Sigue los pasos de la sección correspondiente
3. Actualiza `CHANGELOG.md` con el método elegido
4. Documenta la URL final en `AI-CONTEXT.md`

---

**Última actualización:** 18-Feb-2026
