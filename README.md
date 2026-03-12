# Admin Panel — SaaS Management Interface

Panel de administración web para que los tenants gestionen su configuración, servicios y reservas.

## 📁 Estructura del proyecto

```
admin-panel/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   ├── services/
│   │   ├── providers/
│   │   ├── bookings/
│   │   ├── settings/
│   │   └── api-keys/
│   │
│   ├── components/
│   │   ├── Layout/
│   │   ├── ServiceForm/
│   │   ├── ProviderForm/
│   │   ├── AvailabilityCalendar/
│   │   └── BookingsList/
│   │
│   ├── lib/
│   │   ├── graphql/
│   │   │   ├── client.ts
│   │   │   ├── queries.ts
│   │   │   └── mutations.ts
│   │   ├── auth/
│   │   │   └── cognito.ts
│   │   └── utils/
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── styles/
│       └── globals.css
│
├── public/
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.local.example
```

## 🛠️ Desarrollo local

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm start
```

## 🔐 Autenticación

Cognito User Pools con JWT.

Ver `.env.local.example` para configuración.

## 🏗️ Infraestructura y Despliegue

### Arquitectura de Hosting (S3 + CloudFront)

Este proyecto usa **Next.js con `output: 'export'`** para generar archivos HTML estáticos que se despliegan en:

- **S3**: Almacenamiento de archivos estáticos (.html, .js, .css)
- **CloudFront**: CDN global con función de reescritura de URLs
- **OAC (Origin Access Control)**: Seguridad S3-CloudFront

#### CloudFront Function para Ruteo y 404s en Next.js App Router

**Problema**: Next.js App Router con `output: 'export'` genera rutas estáticas complejas. Si un usuario entra a `/bookings/` y refresca la página (F5), S3 y CloudFront devolverán un 404 si no están configurados para entender que deben servir `/bookings/index.html`. Además, Next.js se marea (hydration error/404 client-side) si las rutas del navegador no coinciden exactamente con la convención exportada.

**Solución Implementada**:
1. **Configuración de Next.js**: Habilitar `trailingSlash: true` en `next.config.js`. Esto obliga a Next.js a exportar todas las rutas como directorios con un `index.html` dentro (ej. `out/bookings/index.html`).
2. **CloudFront Function (Modo Router)**: Intercepta todas las peticiones entrantes:
   - Resuelve el root (`/`) apuntando a `/index.html`.
   - Si la ruta no tiene extensión y no termina en `/`, emite un **Redirect 301** hacia la ruta con slash al final (ej. `/bookings` → `/bookings/`).
   - Si la ruta termina en `/`, le agrega internamente `index.html` para consultar a S3 (ej. `/bookings/` → `/bookings/index.html`).
3. **Restricción Crítica (ES5)**: Las CloudFront Functions operan en un motor JavaScript muy restrictivo (ES5.1). El uso de métodos de ES6 como `String.prototype.includes()` o `String.prototype.endsWith()` causarán **crasheos en tiempo de ejecución** en CloudFront, resultando en errores 404 persistentes. La función debe escribirse estrictamente con métodos antiguos (ej. `indexOf` y `slice`).
4. **Caché de Errores TTL**: Se configuró TTL de 10 segundos en los `errorResponses` del stack de CDK para evitar que los 404 accidentales queden cacheados por 5 minutos en el Edge.

**Código**: Ver `infra/lib/admin-stack.ts` para la lógica exacta de la función.

### Despliegue

```bash
cd infra
npm install
cdk deploy ChatBooking-Admin
```

La URL de CloudFront se muestra en los outputs del stack.

## 📚 Documentación

- [Admin Panel Guide](../plan/admin/README.md)
- [Architecture](../plan/architecture/README.md)
