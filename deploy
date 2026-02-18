#!/bin/bash

###############################################################################
# Script de Despliegue Automatizado - Portal de Compensaciones
# Para uso en LXC Container de Proxmox
###############################################################################

set -e  # Salir si hay algún error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🚀 Deploy Script - Portal de Compensaciones             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
APP_DIR="/var/www/compensaciones"
NGINX_SITE="compensaciones"
BACKUP_DIR="/var/backups/compensaciones"

# Funciones auxiliares
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    print_error "Este script debe ejecutarse como root"
    exit 1
fi

# Función para instalar dependencias
install_dependencies() {
    print_status "Instalando dependencias del sistema..."
    
    apt update
    apt install -y curl wget git nano nginx ufw
    
    print_success "Dependencias instaladas"
}

# Función para instalar Node.js
install_nodejs() {
    print_status "Verificando instalación de Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js ya instalado: $NODE_VERSION"
        return
    fi
    
    print_status "Instalando Node.js vía nvm..."
    
    # Instalar nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Instalar Node.js LTS
    nvm install 20
    nvm use 20
    nvm alias default 20
    
    NODE_VERSION=$(node -v)
    print_success "Node.js instalado: $NODE_VERSION"
}

# Función para clonar repositorio
clone_repository() {
    print_status "Clonando repositorio..."
    
    if [ -d "$APP_DIR" ]; then
        print_warning "El directorio $APP_DIR ya existe"
        read -p "¿Desea eliminarlo y clonar de nuevo? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$APP_DIR"
        else
            print_status "Saltando clonación..."
            return
        fi
    fi
    
    mkdir -p /var/www
    cd /var/www
    git clone https://github.com/FernandoE21/compensaciones.git
    
    print_success "Repositorio clonado en $APP_DIR"
}

# Función para compilar la aplicación
build_application() {
    print_status "Compilando aplicación..."
    
    cd "$APP_DIR"
    
    # Crear backup si existe dist
    if [ -d "dist" ]; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        mkdir -p "$BACKUP_DIR"
        cp -r dist "$BACKUP_DIR/dist.backup.$TIMESTAMP"
        print_success "Backup creado: dist.backup.$TIMESTAMP"
    fi
    
    # Instalar dependencias
    print_status "Instalando dependencias npm..."
    npm install
    
    # Compilar
    print_status "Ejecutando build de producción..."
    npm run build
    
    if [ ! -d "dist" ]; then
        print_error "Falló la compilación - directorio dist no encontrado"
        exit 1
    fi
    
    print_success "Aplicación compilada exitosamente"
}

# Función para configurar Nginx
configure_nginx() {
    print_status "Configurando Nginx..."
    
    # Crear configuración de sitio
    cat > /etc/nginx/sites-available/$NGINX_SITE << 'EOF'
server {
    listen 80;
    server_name _;
    
    root /var/www/compensaciones/dist;
    index index.html;
    
    access_log /var/log/nginx/compensaciones-access.log;
    error_log /var/log/nginx/compensaciones-error.log;
    
    # Compresión
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_comp_level 6;
    
    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache para assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # No cachear index.html
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
EOF
    
    # Habilitar sitio
    ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/
    
    # Deshabilitar sitio por defecto
    rm -f /etc/nginx/sites-enabled/default
    
    # Verificar configuración
    if nginx -t; then
        print_success "Configuración de Nginx válida"
        systemctl reload nginx
        print_success "Nginx recargado"
    else
        print_error "Error en configuración de Nginx"
        exit 1
    fi
}

# Función para configurar firewall
configure_firewall() {
    print_status "Configurando firewall UFW..."
    
    # Permitir SSH
    ufw allow 22/tcp
    
    # Permitir HTTP/HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Habilitar UFW
    ufw --force enable
    
    print_success "Firewall configurado"
    ufw status
}

# Función para crear script de actualización
create_update_script() {
    print_status "Creando script de actualización..."
    
    cat > /root/update-compensaciones.sh << 'EOF'
#!/bin/bash

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Actualizando Portal de Compensaciones...${NC}"

cd /var/www/compensaciones

# Backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp -r dist dist.backup.$TIMESTAMP
echo -e "${GREEN}✓${NC} Backup creado"

# Actualizar código
git pull origin main
echo -e "${GREEN}✓${NC} Código actualizado"

# Reinstalar dependencias
npm install
echo -e "${GREEN}✓${NC} Dependencias instaladas"

# Recompilar
npm run build
echo -e "${GREEN}✓${NC} Aplicación compilada"

# Limpiar backups antiguos (mantener últimos 3)
ls -t dist.backup.* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true

# Recargar Nginx
systemctl reload nginx
echo -e "${GREEN}✓${NC} Nginx recargado"

echo -e "${GREEN}✅ Actualización completada${NC}"
EOF
    
    chmod +x /root/update-compensaciones.sh
    print_success "Script de actualización creado: /root/update-compensaciones.sh"
}

# Función para mostrar información final
show_final_info() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              ✅ DESPLIEGUE COMPLETADO                      ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    print_success "Portal de Compensaciones desplegado exitosamente"
    echo ""
    echo "📍 Información importante:"
    echo "   • Directorio de la app: $APP_DIR"
    echo "   • Archivos servidos desde: $APP_DIR/dist"
    echo "   • Logs de acceso: /var/log/nginx/compensaciones-access.log"
    echo "   • Logs de errores: /var/log/nginx/compensaciones-error.log"
    echo ""
    
    # Obtener IP del container
    IP_ADDRESS=$(hostname -I | awk '{print $1}')
    echo "🌐 Accede a tu aplicación en:"
    echo "   http://$IP_ADDRESS"
    echo ""
    
    echo "🔄 Para actualizar la aplicación en el futuro:"
    echo "   /root/update-compensaciones.sh"
    echo ""
    
    echo "📊 Comandos útiles:"
    echo "   • Ver logs en tiempo real: tail -f /var/log/nginx/compensaciones-access.log"
    echo "   • Reiniciar Nginx: systemctl restart nginx"
    echo "   • Ver estado del sistema: htop"
    echo ""
}

# Menú principal
show_menu() {
    echo "Selecciona el tipo de instalación:"
    echo ""
    echo "  1) Instalación completa (recomendado para primera vez)"
    echo "  2) Solo compilar aplicación"
    echo "  3) Solo configurar Nginx"
    echo "  4) Actualizar aplicación desde Git"
    echo "  5) Salir"
    echo ""
    read -p "Opción [1-5]: " option
    
    case $option in
        1)
            print_status "Iniciando instalación completa..."
            install_dependencies
            install_nodejs
            clone_repository
            build_application
            configure_nginx
            configure_firewall
            create_update_script
            show_final_info
            ;;
        2)
            build_application
            systemctl reload nginx
            print_success "Aplicación compilada y Nginx recargado"
            ;;
        3)
            configure_nginx
            print_success "Nginx configurado"
            ;;
        4)
            cd "$APP_DIR"
            git pull origin main
            build_application
            systemctl reload nginx
            print_success "Aplicación actualizada"
            ;;
        5)
            print_status "Saliendo..."
            exit 0
            ;;
        *)
            print_error "Opción inválida"
            exit 1
            ;;
    esac
}

# Ejecutar menú
show_menu
