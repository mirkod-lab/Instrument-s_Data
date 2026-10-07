# Registro de Instrumentos Aeronáuticos

Aplicación web para registrar, consultar, buscar, editar y eliminar instrumentos aeronáuticos. Está construida con Next.js y preparada para desplegar en Vercel. Los registros se guardan en Neon/Postgres y las fotografías en Vercel Blob.

## Requisitos

- Node.js 20.9 o superior y npm.
- Una base de datos PostgreSQL compatible con Neon.
- Un almacén Vercel Blob para las fotografías.

## 1. Instalar dependencias

Desde la carpeta del proyecto:

```bash
npm install
```

## 2. Configurar base de datos y almacenamiento

1. Crea un proyecto PostgreSQL en [Neon](https://neon.tech/).
2. Copia la cadena de conexión de Neon. Usa una URL segura con `sslmode=require`.
3. En el panel de Vercel, crea un almacén desde **Storage → Create → Blob** y conéctalo al proyecto. Vercel configura `BLOB_READ_WRITE_TOKEN` en el entorno conectado.
4. La aplicación crea automáticamente la tabla `instrumentos` la primera vez que se consulta la API; no hace falta ejecutar migraciones manuales.

La tabla incluye `id` autoincremental, `persona_carga`, `nombre_instrumento`, `numero_parte`, `numero_serie`, `foto_url` y `fecha_carga`.

## 3. Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

`DATABASE_URL` es obligatoria. `BLOB_READ_WRITE_TOKEN` es necesaria para cargar, reemplazar o eliminar fotografías. Si el proyecto usa fotos, mantén ambas variables configuradas en todos los entornos. No publiques `.env.local` ni compartas estos valores.

## 4. Ejecutar localmente

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Para cargar fotos en desarrollo, genera un token de lectura y escritura de Blob desde el panel de Vercel y colócalo en `.env.local`.

## 5. Conectar el proyecto con Vercel

1. Importa el repositorio desde el panel de Vercel; selecciona la carpeta del proyecto si el repositorio contiene otros archivos.
2. Vincula el almacenamiento de Vercel Blob al proyecto.
3. En **Settings → Environment Variables**, agrega `DATABASE_URL` para Production, Preview y Development según corresponda. Comprueba que `BLOB_READ_WRITE_TOKEN` esté disponible en esos mismos entornos después de conectar Blob.
4. No hace falta configurar comandos de build adicionales: Vercel detecta Next.js y ejecuta `npm run build`.

## 6. Desplegar

Envía los cambios al repositorio conectado o ejecuta:

```bash
npx vercel
npx vercel --prod
```

La base de datos Neon debe permitir conexiones desde el despliegue de Vercel. Configura las variables en Vercel antes del primer deploy y vuelve a desplegar después de modificarlas.

## API

| Método | Ruta | Operación |
| --- | --- | --- |
| GET | `/api/instrumentos` | Listar registros. Acepta `?q=` para buscar por persona, instrumento, parte o serie. |
| GET | `/api/instrumentos/[id]` | Consultar un registro. |
| POST | `/api/instrumentos` | Crear registro con `multipart/form-data`; foto opcional en el campo `foto`. |
| PUT | `/api/instrumentos/[id]` | Actualizar los campos y, opcionalmente, reemplazar la foto con `multipart/form-data`. |
| DELETE | `/api/instrumentos/[id]` | Eliminar registro y su foto asociada. |

Los campos de texto son obligatorios. La fotografía es opcional; se aceptan JPEG, PNG, GIF y WebP de hasta 4 MB. Las entradas se validan en el servidor y las consultas SQL usan parámetros.
