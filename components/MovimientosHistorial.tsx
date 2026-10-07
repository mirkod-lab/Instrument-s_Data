"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type InstrumentoSnapshot = {
  persona_carga: string;
  nombre_instrumento: string;
  numero_parte: string;
  numero_serie: string;
  foto_url: string | null;
};

type Movimiento = {
  id: number;
  instrumento_id: number;
  accion: "creado" | "editado" | "eliminado";
  datos_anteriores: InstrumentoSnapshot | null;
  datos_nuevos: InstrumentoSnapshot | null;
  fecha: string;
};

type HistoryResponse = {
  movimientos: Movimiento[];
  siguienteCursor: string | null;
};

const labels: Record<keyof InstrumentoSnapshot, string> = {
  persona_carga: "Persona que carga",
  nombre_instrumento: "Instrumento",
  numero_parte: "N.º de parte",
  numero_serie: "N.º de serie",
  foto_url: "Fotografía",
};

const actions: Record<Movimiento["accion"], string> = {
  creado: "Instrumento creado",
  editado: "Instrumento editado",
  eliminado: "Instrumento eliminado",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function describeChange(previous: InstrumentoSnapshot | null, current: InstrumentoSnapshot | null) {
  const values = current ?? previous;
  if (!values) return [];

  if (!previous || !current) {
    return (Object.keys(labels) as (keyof InstrumentoSnapshot)[])
      .filter((key) => key !== "foto_url" || values[key])
      .map((key) => ({ label: labels[key], value: values[key] || "Sin fotografía" }));
  }

  return (Object.keys(labels) as (keyof InstrumentoSnapshot)[])
    .filter((key) => previous[key] !== current[key])
    .map((key) => ({
      label: labels[key],
      value: `${previous[key] || "Sin fotografía"} → ${current[key] || "Sin fotografía"}`,
    }));
}

export default function MovimientosHistorial() {
  const [items, setItems] = useState<Movimiento[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  async function loadHistory(before?: string) {
    setError("");
    if (before) setLoadingMore(true);
    else setLoading(true);
    try {
      const response = await fetch(`/api/movimientos${before ? `?before=${before}` : ""}`);
      const data = await response.json() as HistoryResponse & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo consultar el historial.");
      setItems((current) => before ? [...current, ...data.movimientos] : data.movimientos);
      setCursor(data.siguienteCursor);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo consultar el historial.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  return (
    <main className="page-shell narrow-shell history-shell">
      <Link className="back-link" href="/">← Volver al listado</Link>
      <div className="page-heading">
        <span className="eyebrow">TRAZABILIDAD</span>
        <h1>Historial de movimientos</h1>
        <p>Registro de instrumentos creados, editados y eliminados.</p>
      </div>

      {error && <div className="notice error-notice" role="alert">{error}<button className="text-button" onClick={() => void loadHistory()}>Reintentar</button></div>}

      {loading ? (
        <div className="panel loading-panel">Cargando historial…</div>
      ) : items.length === 0 ? (
        <div className="panel history-empty">
          <strong>Aún no hay movimientos registrados</strong>
          <span>Los cambios que se realicen a partir de ahora aparecerán aquí.</span>
        </div>
      ) : (
        <section className="history-list" aria-label="Movimientos recientes">
          {items.map((movement) => {
            const changed = describeChange(movement.datos_anteriores, movement.datos_nuevos);
            return (
              <article className={`panel history-card history-${movement.accion}`} key={movement.id}>
                <div className="history-card-heading">
                  <span className={`history-badge badge-${movement.accion}`}>{actions[movement.accion]}</span>
                  <time dateTime={movement.fecha}>{formatDate(movement.fecha)}</time>
                </div>
                <h2>
                  {movement.datos_nuevos?.nombre_instrumento ?? movement.datos_anteriores?.nombre_instrumento ?? "Instrumento"}
                  <span> · ID #{movement.instrumento_id}</span>
                </h2>
                <dl className="history-values">
                  {changed.map(({ label, value }) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            );
          })}
          {cursor && (
            <button className="button button-secondary history-more" onClick={() => void loadHistory(cursor)} disabled={loadingMore}>
              {loadingMore ? "Cargando…" : "Cargar movimientos anteriores"}
            </button>
          )}
        </section>
      )}

      <p className="history-note">El historial conserva los cambios realizados desde que se habilitó esta función. No identifica quién hizo cada cambio porque la aplicación aún no tiene inicio de sesión.</p>
    </main>
  );
}
