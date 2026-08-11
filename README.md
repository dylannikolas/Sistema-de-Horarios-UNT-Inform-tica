# 🎓 Sistema de Gestión de Horarios - UNT Informática

Sistema web fullstack para la gestión de horarios académicos, asignación de carga lectiva y disponibilidad de docentes de la Universidad Nacional de Trujillo.

---

## 🚀 Inicio Rápido

### **1. Requisitos Previos**
- Node.js (v18 o superior)
- MySQL Server (v8.0 o superior)

### **2. Configuración de Variables de Entorno**
Crea el archivo `server/.env` tomando como base `server/.env.example`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=sistema_horarios
PORT=3001
```

### **3. Instalación Automática**
Ejecuta el script de instalación completa en Windows:
```cmd
.\install.bat
```
*(Este script instalará las dependencias de Node.js, creará el schema de la base de datos e insertará los datos iniciales y usuarios de prueba).*

---

## 💻 Ejecución Manual de Servidores

Si prefieres levantar los servidores manualmente en 2 terminales separadas:

### **Backend (Puerto 3001):**
```bash
cd server
npm run dev
```

### **Frontend (Puerto 3000):**
```bash
npm run dev
```

Abre tu navegador en: **http://localhost:3000**

---

## 🔐 Credenciales de Prueba

### **Usuario Administrador / Director:**
```
Usuario: admin
Contraseña: admin123
```

### **Usuario Docente (ejemplo):**
```
Usuario: jgutierrez
Contraseña: DOC-01
```

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Base de Datos:** MySQL
- **Autenticación:** JWT (JSON Web Tokens)

---

## 📁 Estructura del Proyecto

```
├── components/       # Componentes React (Layouts, UI, Formularios)
├── pages/           # Vistas de la aplicación (Admin, Docentes, Login)
├── server/          # API REST Backend (Rutas, Controlador, Scripts BD)
├── services/        # Servicios API del Frontend
├── database_complete_schema.sql  # Schema completo de la base de datos
└── *.bat            # Scripts de automatización en Windows
```

---

## 📝 Licencia

Proyecto desarrollado para la Escuela de Ingeniería de Sistemas - UNT.
