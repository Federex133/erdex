
# 🚀 Instrucciones para Construir y Desplegar en tiiny.host

## ✅ PASOS EXACTOS PARA TIINY.HOST:

### 1. Construye el proyecto:
```bash
npm install
npm run build
```

### 2. Prepara el ZIP para tiiny.host:
1. **Ve a la carpeta `dist/` que se creó**
2. **IMPORTANTE**: Selecciona TODO EL CONTENIDO de `dist/` (NO la carpeta dist)
   - Debe incluir: `index.html`, carpeta `assets/`, `.htaccess`, `web.config`, etc.
3. **Crea un ZIP** con ese contenido (el `index.html` DEBE estar en la raíz del ZIP)
4. **Sube ese ZIP a tiiny.host**

### 📁 Estructura correcta del ZIP:
```
tu-proyecto.zip
├── index.html          ← EN LA RAÍZ
├── assets/
│   ├── index-abc123.js
│   ├── index-def456.css
│   └── ...otros assets
├── .htaccess
├── web.config
└── favicon.ico
```

### ⚠️ ERRORES COMUNES (EVITAR):
- ❌ NO subas todo el proyecto (src/, package.json, node_modules/, etc.)
- ❌ NO subas la carpeta `dist` como carpeta
- ❌ NO olvides que `index.html` debe estar en la raíz del ZIP
- ❌ NO uses rutas absolutas (ya configurado automáticamente)

## 🔧 Para desarrollo local:
```bash
npm install
npm run dev
```

## 📦 Para construir para producción:
```bash
npm install
npm run build
```

## 👀 Para previsualizar la construcción:
```bash
npm run preview
```

## 🌐 COMPATIBILIDAD GARANTIZADA:

### ✅ Optimizaciones incluidas:
- Rutas relativas configuradas (`base: "./"`)
- Assets optimizados y hasheados
- CSS crítico inline para evitar flash blanco
- Configuración para Apache (`.htaccess`)
- Configuración para IIS (`web.config`)
- Minificación y compresión automática
- PWA ready

### 🎯 Hostings compatibles:
- ✅ tiiny.host
- ✅ Netlify
- ✅ Vercel
- ✅ GitHub Pages
- ✅ Cualquier hosting estático

## 🆘 ¿Sigue en blanco?

Si después de seguir estos pasos exactos sigue viéndose en blanco:

1. **Verifica la estructura del ZIP**: Asegúrate que `index.html` está en la raíz
2. **Comprueba la consola del navegador**: F12 → Console para ver errores
3. **Verifica el archivo**: Abre el ZIP y confirma que contiene `index.html` en la raíz

## 📱 Resultado esperado:
- ✅ Sitio web funcionando 100%
- ✅ Todos los estilos cargando
- ✅ Navegación funcionando
- ✅ Responsive design
- ✅ Sin errores en consola

---

**¡Listo para compartir tu proyecto! 🎉**
