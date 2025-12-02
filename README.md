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

## 📚 Documentación

- [Admin Panel Guide](../plan/admin/README.md)
- [Architecture](../plan/architecture/README.md)
