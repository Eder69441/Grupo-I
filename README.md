# Tu Pharmacy

Aplicación de inventario de farmacia con React, Express y MongoDB Atlas.

## Preparación

Requiere Node.js >=22.14 y un clúster de Atlas.

1. En Atlas, crea un usuario en **Database Access** con permiso `readWrite` sobre `tu_pharmacy`.
2. En **Network Access**, autoriza la IP del equipo que ejecuta el backend.
3. En **Connect → Drivers → Node.js**, copia la URI del clúster.
4. Completa `backend/.env` usando `backend/.env.example` como referencia:

```dotenv
DATABASE_DRIVER=mongodb
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@TU_CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=tu_pharmacy
ADMIN_NAME=Administrador
ADMIN_USERNAME=admin
ADMIN_PASSWORD=TU_CLAVE_DE_ACCESO
```

La contraseña de Atlas y la contraseña del administrador de la aplicación son independientes. Codifica los caracteres especiales de las credenciales en la URI. No pongas la URI en el frontend ni publiques `.env`.

## Ejecutar

En una terminal desde la raíz:

```powershell
cd backend
npm ci
npm run check-db
npm run bootstrap-admin
npm run dev
```

La inicialización solo funciona con una base sin usuarios. Después, elimina `ADMIN_PASSWORD` de `.env`. Las colecciones y los índices se crean automáticamente al conectar. `check-db` verifica la conexión y prepara los índices, sin insertar usuarios ni productos.

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173 e inicia sesión con el administrador creado. `frontend/.env.example` contiene la dirección de la API. Si cambias el puerto del frontend, actualiza `CORS_ORIGINS` en el backend.

## Verificación

```powershell
npm test --prefix backend
npm run lint --prefix frontend
npm run build --prefix frontend
```

Las pruebas MongoDB usan un replica set temporal aislado y no acceden a Atlas. La primera ejecución descarga el servidor MongoDB y necesita conexión a Internet. Comprueban persistencia, permisos, rollback, salidas simultáneas y protección del último administrador.

## Funcionalidad

- Inicio y cierre de sesión, usuarios y roles.
- Productos, búsquedas, categorías y alertas de inventario.
- Entradas y salidas con historial y actualización transaccional del stock.
- Contraseñas con scrypt y sesiones persistentes con token almacenado como hash.

Consulta [la configuración del backend](backend/README.md) y [el contrato de la API](backend/API.md).
# Grupo-I
