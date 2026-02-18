# Production Checklist - Portal de Compensaciones

Lista de verificación para poner el Portal de Compensaciones en producción.

---

## ✅ Checklist Pre-Producción

### 1. Backend (Supabase)

- [ ] **Revisar límites del plan:**
  - Plan Free: 500 MB DB, 1 GB Storage, 2 GB bandwidth/mes
  - Plan Pro: $25/mes para más recursos
  - [Ver planes](https://supabase.com/pricing)

- [ ] **Configurar Row Level Security (RLS):**
  ```sql
  -- Habilitar RLS en tabla personal
  ALTER TABLE personal ENABLE ROW LEVEL SECURITY;
  
  -- Habilitar RLS en tabla registro_horas
  ALTER TABLE registro_horas ENABLE ROW LEVEL SECURITY;
  
  -- Política: Empleados solo ven sus propios registros
  CREATE POLICY "Empleados ven sus registros"
  ON registro_horas FOR SELECT
  USING (auth.uid() = codigo_trabajador);
  ```

- [ ] **Backup automático:**
  - Supabase hace backups diarios automáticos (plan Pro)
  - Plan Free: Hacer backups manuales semanalmente

- [ ] **Variables de entorno seguras:**
  - NO incluir `supabaseKey` anónimo en código si es secreto
  - Usar `SUPABASE_ANON_KEY` como variable de entorno

### 2. Frontend (Cloudflare Pages)

- [ ] **Build optimizado:**
  ```bash
  npm run build
  # Verificar tamaño: dist/ debe ser < 25 MB
  ```

- [ ] **Variables de entorno:**
  - Configurar en Cloudflare Pages Dashboard
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

- [ ] **Dominio personalizado (opcional):**
  - Agregar en Cloudflare Pages → Custom domains
  - SSL automático

- [ ] **Headers de seguridad:**
  - Cloudflare agrega automáticamente:
    - `X-Frame-Options`
    - `X-Content-Type-Options`
    - `Strict-Transport-Security`

### 3. Seguridad

- [ ] **Autenticación:**
  - ⚠️ **CRÍTICO:** Migrar admin de hardcoded a Supabase Auth
  - Implementar JWT tokens
  - Timeouts de sesión

- [ ] **Rate Limiting:**
  - Configurar en Cloudflare:
    - Max 10 login attempts por IP/hora
    - Max 100 requests por usuario/minuto

- [ ] **CORS:**
  - Configurar en Supabase allowed origins:
    - `https://tu-app.pages.dev`
    - `https://tu-dominio.com` (si aplica)

- [ ] **Audit logging:**
  - Implementar tabla `audit_log` en Supabase
  - Registrar cambios críticos (aprobaciones, rechazos)

### 4. Rendimiento

- [ ] **Imágenes optimizadas:**
  - Fotos de perfil en Storage: max 200 KB c/u
  - Formato: WebP (mejor compresión)

- [ ] **Lazy loading:**
  - Implementar en listas largas (react-window)

- [ ] **Caché:**
  - Cloudflare cachea automáticamente assets estáticos
  - Configurar `Cache-Control` headers

- [ ] **Code splitting:**
  - Vite lo hace automáticamente
  - Verificar chunks en build

### 5. Monitoreo

- [ ] **Analytics:**
  - Cloudflare Pages Analytics (incluido)
  - Google Analytics (opcional)

- [ ] **Error tracking:**
  - Sentry (gratis hasta 5k errores/mes)
  - LogRocket para sesiones

- [ ] **Uptime monitoring:**
  - UptimeRobot (gratis, 50 monitores)
  - Pingdom

- [ ] **Logs:**
  - Logs de Supabase (plan Pro)
  - Cloudflare Logs (plan Pro)

### 6. Testing

- [ ] **Pruebas funcionales:**
  - Login empleado
  - Login admin
  - Crear solicitud
  - Aprobar/rechazar
  - Exportar Excel
  - Filtros por fecha

- [ ] **Pruebas de carga:**
  - Simular 50-100 usuarios concurrentes
  - k6.io (gratis, open source)

- [ ] **Pruebas en navegadores:**
  - Chrome ✅
  - Firefox ✅
  - Safari ✅
  - Edge ✅
  - Mobile (iOS/Android) ✅

- [ ] **PWA:**
  - Probar instalación en móvil
  - Modo offline
  - Notificaciones

### 7. Documentación

- [ ] **Para usuarios finales:**
  - Manual de empleado (cómo registrar horas)
  - Manual de admin (cómo aprobar)
  - FAQs

- [ ] **Para soporte IT:**
  - Troubleshooting común
  - Acceso a logs
  - Procedimiento de rollback

- [ ] **README actualizado:**
  - URL de producción
  - Credenciales de emergencia
  - Contactos de soporte

### 8. Legal y Compliance

- [ ] **Política de privacidad:**
  - Qué datos se recopilan
  - Cómo se usan
  - Dónde se almacenan (Supabase/Cloudflare)

- [ ] **Términos de uso:**
  - Responsabilidades del usuario
  - Uso aceptable

- [ ] **GDPR/LOPD (si aplica):**
  - Consentimiento de datos
  - Derecho al olvido
  - Exportación de datos

### 9. Comunicación

- [ ] **Anuncio a empleados:**
  - Email de lanzamiento
  - Capacitación (demo)
  - Soporte durante primeros días

- [ ] **Plan de rollout:**
  - Fase 1: Prueba con 10 empleados (1 semana)
  - Fase 2: 50 empleados (1 semana)
  - Fase 3: Todos los empleados

### 10. Post-Lanzamiento

- [ ] **Monitorear primeros 7 días:**
  - Errores críticos
  - Tiempos de respuesta
  - Feedback de usuarios

- [ ] **Iterar:**
  - Recopilar feedback
  - Priorizar mejoras
  - Deploy incremental

---

## 📊 Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| **Uptime** | > 99.9% |
| **Tiempo de carga** | < 2 segundos |
| **Errores** | < 0.1% requests |
| **Adopción** | > 80% empleados en 30 días |
| **Satisfacción** | > 4/5 estrellas |

---

## 🚨 Plan de Contingencia

### Si Cloudflare Pages falla:

1. **Opción A: Rollback**
   ```bash
   # En Cloudflare Dashboard
   Deployments → Historial → Rollback a versión anterior
   ```

2. **Opción B: Servidor local de emergencia**
   ```bash
   # Levantar LXC backup
   ssh root@proxmox
   pct start 100
   # Redirigir DNS temporal
   ```

### Si Supabase falla:

1. **Backup de base de datos:**
   ```bash
   # Restaurar desde backup más reciente
   # (Supabase plan Pro: point-in-time recovery)
   ```

2. **Migrar a PostgreSQL local:**
   ```bash
   # Si es crítico y Supabase tiene downtime prolongado
   # (Poco probable, uptime > 99.99%)
   ```

---

## 📞 Contactos de Emergencia

- **Cloudflare Support:** https://support.cloudflare.com
- **Supabase Support:** https://supabase.com/support
- **IT Interno:** [Agregar contacto]
- **Desarrollador:** [Agregar contacto]

---

**Última actualización:** 18-Feb-2026
