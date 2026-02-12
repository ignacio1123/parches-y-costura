# 🧵 Parches y Costura - Sistema de Gestión de Pedidos

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

*Sistema moderno y completo para gestionar pedidos de parches y costuras*

[🚀 Ver Demo](https://ignacio1123.github.io/parches-y-costura) • [Características](#características) • [Instalación](#instalación) • [Uso](#uso) • [Contribuir](#contribuir)

</div>

---

## 📋 Descripción

**Parches y Costura** es una aplicación web completa diseñada para gestionar pedidos de parches personalizados. Permite llevar un control detallado de clientes, pedidos, estados, inventario y generar reportes en PDF. Todo funciona 100% en el navegador, sin necesidad de servidor ni base de datos externa.

### 🎯 Características Principales

#### ✨ Gestión Integral de Pedidos
- **Registro completo** de pedidos con múltiples campos (cliente, rango, región, cantidad, precio, descuento, estado)
- **Búsqueda avanzada** en tiempo real por cualquier campo
- **Estados dinámicos** (Pendiente, En curso, Confirmado, Entregado)
- **Edición y eliminación** con función de deshacer
- **Paginación** automática para manejar grandes cantidades de datos

#### 📊 Dashboard Analítico
- **Totales en tiempo real**: Total de pedidos, valor total, pedidos pendientes, entregados
- **Tarjetas visuales** con codificación por colores
- **Actualización instantánea** al modificar pedidos

#### 📄 Generación de PDFs
- **Reportes personalizados** con selección de pedidos específicos
- **Formatos predefinidos** (Tienda e Individual)
- **Descarga de plantillas vacías** para rellenar manualmente
- **Importación de PDFs** para cargar datos automáticamente (OCR)

#### 💾 Backup y Restauración
- **Exportación JSON** de todos los datos
- **Importación segura** con validación de formato
- **Mensajes claros** de éxito/error con conteo de registros
- **Compatible** entre dispositivos

#### 📱 100% Responsive
- **Diseño adaptativo** para móviles, tablets y escritorio
- **Optimización móvil**: 
  - Scroll horizontal suave para tablas
  - Menú hamburguesa para acciones
  - Tooltips deshabilitados en pantallas pequeñas
  - Botones y controles adaptados

#### 🎨 Interfaz Moderna
- **Material Design** con animaciones suaves
- **Paleta de colores** profesional y consistente
- **Tipografía** Space Grotesk para legibilidad
- **Feedback visual** en cada acción

---

## 🚀 Tecnologías

| Tecnología | Uso |
|-----------|-----|
| **HTML5** | Estructura semántica |
| **CSS3** | Estilos modernos, Flexbox, Grid, Media Queries |
| **JavaScript (Vanilla)** | Lógica de negocio, manipulación del DOM |
| **localStorage** | Persistencia de datos en el navegador |
| **jsPDF** | Generación de archivos PDF |
| **PDF.js** | Lectura e importación de PDFs |

> **Sin dependencias de frameworks** como React, Vue o Angular. Todo es código nativo del navegador para máxima compatibilidad y velocidad.

---

## 📦 Instalación

### Opción 1: Descargar y Usar Localmente

```bash
# Clona el repositorio
git clone https://github.com/ignacio1123/parches-y-costura.git

# Entra al directorio
cd parches-y-costura

# Abre el archivo en tu navegador
# Windows
start parches.html

# macOS
open parches.html

# Linux
xdg-open parches.html
```

### Opción 2: Desarrollo con Live Server

```bash
# Instala Live Server globalmente (requiere Node.js)
npm install -g live-server

# Ejecuta en el directorio del proyecto
live-server
```

### Opción 3: GitHub Pages (Hosting Gratuito)

1. Ve a **Settings** → **Pages** en tu repositorio
2. Selecciona la rama `main` y carpeta `/ (root)`
3. Tu app estará disponible en `https://ignacio1123.github.io/parches-y-costura`

---

## 💻 Uso

### Versiones Disponibles

El proyecto incluye dos versiones:

| Archivo | Descripción | Uso Recomendado |
|---------|-------------|-----------------|
| **`parches.html`** | Versión standalone (todo en un archivo) | Distribución, enviar por email, uso offline |
| **`parches-y-costura.html`** + `app.js` + `styles.css` | Versión modular (3 archivos) | Desarrollo, mantenimiento, colaboración |

### Funcionalidades Básicas

#### 1️⃣ Agregar un Pedido

1. Click en **"+ Agregar Pedido"**
2. Rellena el formulario con los datos del cliente
3. Click en **"Guardar Pedido"**

#### 2️⃣ Buscar Pedidos

- Usa la **barra de búsqueda** en la tabla
- Escribe cualquier dato: nombre, región, fecha, estado, rango
- Los resultados se filtran automáticamente

#### 3️⃣ Editar/Eliminar Pedidos

- Click en **"Editar"** junto al pedido → Modifica → Guarda
- Click en **"Eliminar"** → Confirma → Usa **"Deshacer"** si te equivocas

#### 4️⃣ Descargar Respaldo

- Click en **"Descargar Respaldo"** (header)
- Se descarga un archivo `respaldo-parche.json`
- Guárdalo en lugar seguro

#### 5️⃣ Cargar Respaldo

- Click en **"Cargar Respaldo"**
- Selecciona el archivo `respaldo-parche.json`
- Se importan todos los pedidos

#### 6️⃣ Generar Reporte PDF

- Click en **"Descargar Reporte"**
- Selecciona los pedidos a incluir
- Click en **"Descargar Reporte"**
- Se descarga un PDF con todos los detalles

#### 7️⃣ Descargar Formato Vacío

- Click en **"Descargar Formato"** (en versión 3 archivos)
- Elige **Formato Tienda** o **Formato Individual**
- Rellena el PDF manualmente
- Imporátalo con **"Cargar PDF"**

---

## 📱 Características Móviles

### Optimizaciones para Smartphones

| Característica | Descripción |
|---------------|-------------|
| **Menu Hamburguesa** | Botones agrupados en pantallas < 768px |
| **Scroll Horizontal** | Tablas se desplazan suavemente con el dedo |
| **Momentum Scrolling** | Scroll iOS nativo con `-webkit-overflow-scrolling: touch` |
| **Tooltips Ocultos** | No aparecen en móvil para evitar romper el layout |
| **Columnas Reducidas** | Tamaños adaptados (35px-120px) |
| **Fuentes Pequeñas** | 10px-11px para máxima legibilidad |

---

## 🗂️ Estructura del Proyecto

```
parches-y-costura/
│
├── parches.html                      # Versión completa standalone
├── parches-y-costura.html            # Versión modular (HTML)
├── app.js                            # Lógica de la aplicación
├── styles.css                        # Estilos globales
├── INSTRUCCIONES_PARA_TUS_TIOS.txt   # Guía para usuarios no técnicos
├── README.md                         # Este archivo
├── LICENSE                           # Licencia MIT
└── .gitignore                        # Archivos ignorados por Git
```

---

## 🔧 Configuración

### Personalización

Puedes personalizar la aplicación editando:

#### **Colores** (`styles.css` líneas 1-20)
```css
:root {
	--primary: #4f46e5;      /* Color principal */
	--primary-light: #e0e7ff; /* Fondo hover */
	--text: #0f172a;          /* Texto principal */
	--muted: #64748b;         /* Texto secundario */
}
```

#### **Estados de Pedidos** (`app.js` línea ~150)
```javascript
const estados = ["Pendiente", "En curso", "Confirmado", "Entregado"];
```

#### **Rangos** (`app.js` línea ~160)
```javascript
const rangos = ["VIP", "Capitán", "Mayorista", "Tienda", "Suboficial", "Cabo Primero"];
```

#### **Regiones/Comunas** (`app.js` línea ~170)
```javascript
const regiones = ["Santiago", "Viña del Mar", "Concepción", ...];
```

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! 

### Pasos para Contribuir

1. **Haz fork** del repositorio
2. **Crea una rama** para tu feature:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. **Commitea** tus cambios:
   ```bash
   git commit -am 'Agrega nueva funcionalidad'
   ```
4. **Push** a la rama:
   ```bash
   git push origin feature/nueva-funcionalidad
   ```
5. **Abre un Pull Request**

### Reportar Bugs

Usa [GitHub Issues](../../issues) para reportar bugs. Incluye:
- Descripción del problema
- Pasos para reproducir
- Navegador y versión
- Screenshots si es posible

---

## 📝 Changelog

### v1.0.0 (Febrero 2026)
- ✨ Lanzamiento inicial
- ✅ Gestión completa de pedidos
- ✅ Dashboard con totales en tiempo real
- ✅ Generación de PDFs
- ✅ Backup/Restore con validación
- ✅ 100% Responsive (móvil optimizado)
- ✅ Menu hamburguesa en móvil
- ✅ Tooltips adaptativos
- ✅ Smooth scrolling en tablas

---

## 📄 Licencia

Este proyecto está licenciado bajo la **Licencia MIT** - ver el archivo [LICENSE](LICENSE) para más detalles.

```
Copyright (c) 2026 Parches y Costura

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 👨‍💻 Autor

**Ignacio**  
- 💼 GitHub: [@ignacio1123](https://github.com/ignacio1123)
- 🔗 Proyecto: [Parches y Costura](https://github.com/ignacio1123/parches-y-costura)

---

## 🙏 Agradecimientos

- [jsPDF](https://github.com/parallax/jsPDF) - Generación de PDFs
- [PDF.js](https://mozilla.github.io/pdf.js/) - Lectura de PDFs
- [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) - Tipografía
- [Shields.io](https://shields.io/) - Badges del README

---

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:

1. 📖 Lee las [Instrucciones para Usuarios](INSTRUCCIONES_PARA_TUS_TIOS.txt)
2. 🐛 Reporta bugs en [GitHub Issues](https://github.com/ignacio1123/parches-y-costura/issues)
3. 💬 Discusiones en [GitHub Discussions](https://github.com/ignacio1123/parches-y-costura/discussions)

---

<div align="center">

Hecho con ❤️ por [Ignacio](https://github.com/ignacio1123)

⭐ Si este proyecto te fue útil, [dale una estrella en GitHub](https://github.com/ignacio1123/parches-y-costura)

</div>
