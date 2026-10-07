"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Instrumento } from "@/lib/instrumentos";
type Props = { created: boolean };

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function InstrumentosListado({ created }: Props) {
  const [items, setItems] = useState<Instrumento[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const notice = created ? "El instrumento se guardó correctamente." : "";

  const loadItems = useCallback(async (search: string) => {
    setError("");
    try {
      const response = await fetch(`/api/instrumentos${search ? `?q=${encodeURIComponent(search)}` : ""}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo cargar el listado.");
      setItems(data as Instrumento[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el listado.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadItems(query.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [query, loadItems]);

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Inicio">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>AER<span className="brand-light">O</span>REGISTRO</span>
        </Link>
        <span className="topbar-caption">CONTROL DE INSTRUMENTOS</span>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">GESTIÓN DE INVENTARIO</span>
          <h1>Registro de Instrumentos<br className="desktop-break" /> Aeronáuticos</h1>
          <p>Consulta y administra los instrumentos en un solo lugar.</p>
        </div>
        <Link className="button button-primary new-button" href="/instrumentos/nuevo"><span aria-hidden="true">＋</span> Nuevo instrumento</Link>
      </section>

      {notice && <div className="notice success-notice" role="status">{notice}</div>}
      <section className="panel list-panel" aria-labelledby="list-heading">
        <div className="list-toolbar">
          <div>
            <h2 id="list-heading">Instrumentos registrados</h2>
            <p>{loading ? "Cargando registros…" : `${items.length} ${items.length === 1 ? "instrumento" : "instrumentos"}`}</p>
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, P/N, S/N o persona…" aria-label="Buscar instrumentos" />
          </label>
        </div>

        {error && <div className="notice error-notice list-error" role="alert">{error}<button className="text-button" onClick={() => void loadItems(query)}>Reintentar</button></div>}
        {loading && <div className="empty-state">Cargando instrumentos…</div>}
        {!loading && !error && items.length === 0 && (
          <div className="empty-state">
            <span className="empty-mark" aria-hidden="true">⌁</span>
            <strong>{query ? "No encontramos coincidencias" : "Todavía no hay instrumentos"}</strong>
            <span>{query ? "Prueba con otro término de búsqueda." : "Registra el primero para comenzar el inventario."}</span>
            {!query && <Link className="button button-secondary" href="/instrumentos/nuevo">Registrar instrumento</Link>}
          </div>
        )}
        {!loading && items.length > 0 && (
          <div className="instrument-list">
            {items.map((item) => (
              <Link className="instrument-row" href={`/instrumentos/${item.id}`} key={item.id}>
                <div className="row-photo">
                  {item.foto_url ? (
                    <img src={item.foto_url} alt="" />
                  ) : <span aria-hidden="true">✦</span>}
                </div>
                <div className="row-main">
                  <strong>{item.nombre_instrumento}</strong>
                  <span>Parte <b>{item.numero_parte}</b><i>·</i> Serie <b>{item.numero_serie}</b></span>
                </div>
                <div className="row-person">
                  <small>CARGADO POR</small>
                  <span>{item.persona_carga}</span>
                </div>
                <div className="row-date">
                  <small>FECHA DE CARGA</small>
                  <span>{formatDate(item.fecha_carga)}</span>
                </div>
                <span className="row-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>
      <footer className="page-footer"><span>Registro interno · Instrumentación aeronáutica</span><span>REGISTRO DIGITAL</span></footer>
    </main>
  );
}
