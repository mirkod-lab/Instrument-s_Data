"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Instrumento } from "@/lib/instrumentos";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

export default function InstrumentoDetalle({ id, updated }: { id: string; updated: boolean }) {
  const router = useRouter();
  const [instrumento, setInstrumento] = useState<Instrumento | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const notice = updated ? "Los cambios se guardaron correctamente." : "";

  useEffect(() => {
    let active = true;
    fetch(`/api/instrumentos/${id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "No se pudo cargar el instrumento.");
        return data as Instrumento;
      })
      .then((data) => { if (active) setInstrumento(data); })
      .catch((fetchError: unknown) => { if (active) setError(fetchError instanceof Error ? fetchError.message : "No se pudo cargar el instrumento."); });
    return () => { active = false; };
  }, [id]);

  async function removeInstrument() {
    if (!instrumento || !window.confirm(`¿Eliminar "${instrumento.nombre_instrumento}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/instrumentos/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No se pudo eliminar el instrumento.");
      router.push("/");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el instrumento.");
      setDeleting(false);
    }
  }

  return (
    <main className="page-shell narrow-shell">
      <Link className="back-link" href="/">← Volver al listado</Link>
      {notice && <div className="notice success-notice" role="status">{notice}</div>}
      {error && <div className="notice error-notice" role="alert">{error}</div>}
      {!instrumento && !error && <div className="panel loading-panel">Cargando instrumento…</div>}
      {instrumento && (
        <>
          <div className="detail-heading">
            <div>
              <span className="eyebrow">INSTRUMENTO #{instrumento.id}</span>
              <h1>{instrumento.nombre_instrumento}</h1>
              <p>Registrado el {formatDate(instrumento.fecha_carga)}</p>
            </div>
            <div className="detail-actions">
              <Link className="button button-secondary" href={`/instrumentos/${id}/editar`}>Editar</Link>
              <button className="button button-danger" onClick={() => void removeInstrument()} disabled={deleting}>{deleting ? "Eliminando…" : "Eliminar"}</button>
            </div>
          </div>
          <section className="panel detail-panel">
            <div className="detail-photo">
              {instrumento.foto_url ? (
                <img src={instrumento.foto_url} alt={`Fotografía de ${instrumento.nombre_instrumento}`} />
              ) : <div className="photo-placeholder"><span aria-hidden="true">✦</span><small>SIN FOTOGRAFÍA</small></div>}
            </div>
            <div className="detail-data">
              <div className="detail-field"><span>PERSONA QUE CARGA</span><strong>{instrumento.persona_carga}</strong></div>
              <div className="detail-field"><span>NOMBRE DEL INSTRUMENTO</span><strong>{instrumento.nombre_instrumento}</strong></div>
              <div className="detail-field"><span>NÚMERO DE PARTE</span><strong>{instrumento.numero_parte}</strong></div>
              <div className="detail-field"><span>NÚMERO DE SERIE</span><strong>{instrumento.numero_serie}</strong></div>
              <div className="detail-field"><span>ID DE REGISTRO</span><strong>#{instrumento.id}</strong></div>
              <div className="detail-field"><span>FECHA DE CARGA</span><strong>{formatDate(instrumento.fecha_carga)}</strong></div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
