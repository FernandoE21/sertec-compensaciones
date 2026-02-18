# Flujo de Trabajo: Fernando (Dev) & Jorge (Prod)

Este documento explica cómo Fernando (quien hace los cambios) y Jorge (dueño del desplege) deben colaborar.

## 👥 1. Roles
*   **Fernando (Dev):** Trabaja en la rama **`main`**. Sube actualizaciones constantes.
*   **Jorge (Prod):** Dueño del repositorio `Jorge-cip/portal-compensaciones`. Jorge es quien "da el paso" a producción.

---

## 🛠️ 2. Configuración Inicial (Fernando)
Fernando debe ejecutar estos comandos en su computadora para conectarse al nuevo repositorio de Jorge:

```bash
# 1. Cambiar la dirección del repositorio remoto
git remote set-url origin https://github.com/Jorge-cip/portal-compensaciones.git

# 2. Asegurarse de estar en main
git checkout main
git pull origin main
```

*(Nota: Jorge debe agregar a Fernando como **Collaborator** en GitHub para que Fernando tenga permiso de subir código).*

---

## 🔄 3. El Ciclo de Desarrollo Diario

### Paso A: Fernando hace cambios
Fernando programa, guarda y sube sus avances:
```bash
git checkout main
git add .
git commit -m "Mejora: Actualización del Dashboard"
git push origin main
```

### Paso B: Jorge prueba y despliega (PASO A PRODUCCIÓN)
Una vez que Fernando termina, Jorge une el código nuevo de `main` hacia la rama estable `production`:
```bash
# Jorge desde su terminal (o Proxmox):
git checkout production
git pull origin production # Asegurar que está al día
git merge main             # Traer los cambios de Fernando
git push origin production # ESTO DISPARA EL DESPLIEGUE EN CLOUDFLARE
```

---

## 🚀 4. ¿Por qué hacerlo así?
1.  **Seguridad:** Si Fernando rompe algo accidentalmente en `main`, **NO se rompe la web en producción**.
2.  **Control:** Jorge revisa que todo esté listo antes de "darle al botón" de subir a producción (con el último `git push`).
3.  **Automatización:** Cloudflare Pages solo mira la rama `production`. En cuanto Jorge hace el `push`, el sitio se actualiza solo en la nube en segundos.

---

## ⚠️ Variables de Entorno
*   Fernando las tiene en su `.env`.
*   Jorge las pone en el panel de Cloudflare (Settings > Environment Variables).
