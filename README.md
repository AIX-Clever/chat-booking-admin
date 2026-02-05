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

#### CloudFront Function para Ruteo

**Problema**: Next.js genera archivos como `bookings.html`, pero las URLs son `/bookings` (sin extensión). Al refrescar (F5), CloudFront busca un archivo literal "bookings" que no existe → 404.

**Solución**: Una CloudFront Function intercepta requests y agrega `.html`:
- `/bookings` → `/bookings.html`
- `/` → `/index.html`

**Código**: Ver `infra/lib/admin-stack.ts` para detalles de implementación y consideraciones de seguridad.

**Alternativas evaluadas**:
- ❌ AWS Amplify Hosting: Rompe cohesión multi-stack CDK, más caro en tráfico alto
- ❌ `trailingSlash: true`: Cambia URLs a `/bookings/`, no elimina necesidad de reescritura
- ❌ S3 Static Website Hosting: Requiere bucket público (riesgo de seguridad)

**Decisión**: Mantener CloudFront Function por ser la solución más segura y económica para nuestra arquitectura multi-stack.

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
