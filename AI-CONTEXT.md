# AI Context - Copiar y Pegar

---

## 📥 AL INICIAR (Copiar esto)

``
Portal de Compensaciones - CIPSA: Sistema web React 19.2 + Vite 7.2 + Supabase para gestión de horas extras. Empleados registran compensaciones (traslados, sobretiempos, salidas), administradores aprueban/rechazan. PWA desplegable en LXC/Proxmox (local) o Cloudflare Pages (público gratis).

📚 Lee en orden: [CHANGELOG.md](CHANGELOG.md) → [llms.txt](llms.txt) → consulta [skills.md](skills.md), [agents.md](agents.md), [architecture.md](architecture.md) según necesidad.

⚡ Stack: React 19.2, Vite 7.2, Supabase (PostgreSQL+Storage), React Router. Auth dual: empleados (código+DNI), admin (hardcoded en DB/RPC). BD: personal, egistro_horas, grupos_horarios.

🚀 Novedades recientes: Implementación completa de "Horarios" agrupados en DB (id_grupo_horario) asignables en frontend AdminAddPersonal y visualizables en AdminHorarios. Validaciones de formularios corregidas de un crash de JSX. Ramas de Git sincronizadas (main, production, 	rial, proxmox, eature/*). 
Última actualización: 21-Mar-2026.
``

---

## 📤 AL FINALIZAR (Copiar esto)

``
✅ Cambios completados.

📝 SIGUIENTE PASO: Actualiza [CHANGELOG.md](CHANGELOG.md) con:
- Fecha: [DD-MMM-YYYY]
- Agregados: [lista]
- Modificados: [lista]
- Eliminados: [lista]
- Pendientes: [lista]

Si hay cambios significativos en arquitectura o tecnologías, actualiza también este archivo (AI-CONTEXT.md) en la sección "AL INICIAR".
``

---

## 💡 Notas Rápidas

**Archivos clave:**
- CHANGELOG.md - Historial de cambios (actualizar siempre al finalizar)
- llms.txt - Índice completo de documentación
- CLOUDFLARE-PAGES-SIMPLE.md - Deploy público gratis SIN servidor
- skills.md - Capacidades del sistema
- gents.md - Roles y permisos
- rchitecture.md - Modelos de datos y flujos

**Pendientes actuales:**
- [ ] Migrar auth admin a Supabase Auth por completo si es requerido
- [ ] Implementar RLS en Supabase
- [ ] Roles granulares (Supervisor, RRHH, Auditor)
- [ ] Notificaciones push PWA
- [ ] Dashboard analytics admin
