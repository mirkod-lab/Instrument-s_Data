import postgres from "postgres";

let sql: ReturnType<typeof postgres> | undefined;
let schemaReady: Promise<void> | undefined;

export async function ensureDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("Falta configurar la variable de entorno DATABASE_URL.");
  }

  sql ??= postgres(process.env.DATABASE_URL, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: "require",
  });

  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS instrumentos (
        id SERIAL PRIMARY KEY,
        persona_carga VARCHAR(160) NOT NULL,
        nombre_instrumento VARCHAR(200) NOT NULL,
        numero_parte VARCHAR(120) NOT NULL,
        numero_serie VARCHAR(120) NOT NULL,
        foto_url TEXT,
        fecha_carga TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.then(() => undefined);
    schemaReady = schemaReady.catch((error: unknown) => {
      schemaReady = undefined;
      throw error;
    });
  }

  await schemaReady;
}

export function getSql(): ReturnType<typeof postgres> {
  if (!sql) {
    throw new Error("La conexión a la base de datos aún no está inicializada.");
  }
  return sql;
}
