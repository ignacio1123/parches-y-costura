# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a **Parches y Costura**! Este documento te guiará a través del proceso.

## 📋 Código de Conducta

- Sé respetuoso y profesional
- Acepta críticas constructivas
- Enfócate en lo mejor para la comunidad
- Muestra empatía hacia otros colaboradores

## 🚀 ¿Cómo Puedo Contribuir?

### Reportar Bugs 🐛

Si encuentras un bug, crea un [Issue](https://github.com/ignacio1123/parches-y-costura/issues) incluyendo:

- **Título claro** del problema
- **Descripción detallada** del bug
- **Pasos para reproducir** el error
- **Comportamiento esperado** vs **comportamiento actual**
- **Screenshots** si es aplicable
- **Navegador y versión** (ej: Chrome 121, Firefox 122)
- **Sistema operativo** (Windows, Mac, Linux, móvil)

### Sugerir Mejoras 💡

Para nuevas características:

1. Crea un [Issue](../../issues) con el tag `enhancement`
2. Describe claramente la funcionalidad propuesta
3. Explica por qué sería útil
4. Si es posible, incluye mockups o ejemplos

### Pull Requests 🔧

#### Antes de Empezar

1. **Busca Issues existentes** para evitar trabajo duplicado
2. **Comenta en el Issue** que trabajarás en él
3. **Haz fork** del repositorio

#### Proceso de Desarrollo

```bash
# 1. Clona tu fork
git clone https://github.com/TU-USUARIO/parches-y-costura.git
cd parches-y-costura

# 2. Crea una rama para tu feature
git checkout -b feature/nombre-descriptivo

# 3. Realiza tus cambios
# Edita archivos, prueba localmente

# 4. Commitea con mensajes claros
git add .
git commit -m "feat: añade validación de email en formulario"

# 5. Push a tu fork
git push origin feature/nombre-descriptivo

# 6. Abre un Pull Request en GitHub
```

#### Convenciones de Commits

Usa [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (espacios, comas, etc.)
- `refactor:` Refactorización de código
- `test:` Añadir tests
- `chore:` Tareas de mantenimiento

**Ejemplos:**
```
feat: añade filtro por fecha en búsqueda
fix: corrige error en cálculo de descuento
docs: actualiza README con nuevas instrucciones
style: mejora espaciado en botones móviles
```

#### Guía de Estilo

**JavaScript:**
- Usa `const` y `let`, no `var`
- Nombres descriptivos de variables (`totalOrders` en lugar de `t`)
- Funciones pequeñas con un propósito claro
- Comentarios solo cuando sea necesario para claridad
- Arrow functions para callbacks

**CSS:**
- BEM naming cuando sea apropiado
- Variables CSS para colores y tamaños reutilizables
- Mobile-first approach con media queries
- Prefijos vendor cuando sea necesario

**HTML:**
- Semántico (usa `<section>`, `<article>`, `<nav>`)
- Accesibilidad (atributos `aria-*`, `alt`, `role`)
- IDs únicos, classnames reutilizables

#### Testing

Antes de enviar tu PR:

1. ✅ Prueba en Chrome, Firefox y Safari
2. ✅ Verifica responsive en móvil (320px, 768px, 1024px)
3. ✅ Comprueba que no hay errores en la consola
4. ✅ Valida que todas las funcionalidades existentes funcionan
5. ✅ Prueba tu nuevo código exhaustivamente

## 📝 Estructura de Pull Request

Tu PR debe incluir:

```markdown
## Descripción
Breve descripción de los cambios

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Documentación

## ¿Cómo se ha probado?
Describe las pruebas realizadas

## Screenshots (si aplica)
Añade capturas de pantalla

## Checklist
- [ ] Mi código sigue el estilo del proyecto
- [ ] He revisado mi propio código
- [ ] He comentado código complejo
- [ ] He actualizado la documentación
- [ ] Mis cambios no generan warnings
- [ ] He probado en múltiples navegadores
```

## 🎨 Áreas de Mejora

Ideas donde puedes contribuir:

### Alta Prioridad 🔴
- [ ] Tests unitarios con Jest
- [ ] Internacionalización (i18n)
- [ ] Modo oscuro
- [ ] PWA (Progressive Web App)
- [ ] Sincronización en la nube

### Media Prioridad 🟡
- [ ] Export a Excel/CSV
- [ ] Gráficos y estadísticas avanzadas
- [ ] Notificaciones push
- [ ] Búsqueda avanzada con filtros múltiples
- [ ] Historial de cambios por pedido

### Mejoras de UX 🟢
- [ ] Animaciones más suaves
- [ ] Mejores mensajes de error
- [ ] Tutorial interactivo para nuevos usuarios
- [ ] Atajos de teclado
- [ ] Drag & drop para ordenar

## 🏆 Reconocimiento

Los contribuidores serán listados en:
- README.md (sección de agradecimientos)
- Archivo CONTRIBUTORS.md
- Release notes

## ❓ Preguntas

Si tienes dudas:
- 💬 Abre un [Discussion](../../discussions)
- 📧 Contacta: [tu-email@ejemplo.com](mailto:tu-email@ejemplo.com)

---

**¡Gracias por hacer este proyecto mejor! 🎉**
