"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Instrumento, InstrumentoInput, MAX_IMAGE_SIZE } from "@/lib/instrumentos";

type Props = { id?: string };

export default function InstrumentoForm({ id }: Props) {
  const router = useRouter();
  const editing = Boolean(id);
  const [values, setValues] = useState<InstrumentoInput>({
    persona_carga: "",
    nombre_instrumento: "",
    numero_parte: "",
    numero_serie: "",
  });
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const previewUrl = useRef<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
  }, []);

  useEffect(() => {
    if (!id) return;
    let active = true;
    fetch(`/api/instrumentos/${id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "No se pudo cargar el instrumento.");
        return data as Instrumento;
      })
      .then((instrumento) => {
        if (!active) return;
        setValues({
          persona_carga: instrumento.persona_carga,
          nombre_instrumento: instrumento.nombre_instrumento,
          numero_parte: instrumento.numero_parte,
          numero_serie: instrumento.numero_serie,
        });
        setExistingPhoto(instrumento.foto_url);
      })
      .catch((fetchError: unknown) => {
        if (active) setError(fetchError instanceof Error ? fetchError.message : "No se pudo cargar el instrumento.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  function updateField(field: keyof InstrumentoInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function selectPhoto(selected: File | undefined) {
    setError("");
    clearSelectedPhoto();
    if (!selected) return;
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(selected.type)) {
      setError("Selecciona una imagen JPEG, PNG, GIF o WebP.");
      return;
    }
    if (selected.size > MAX_IMAGE_SIZE) {
      setError("La imagen no puede superar los 4 MB.");
      return;
    }
    const objectUrl = URL.createObjectURL(selected);
    previewUrl.current = objectUrl;
    setPreview(objectUrl);
    setFile(selected);
  }

  function clearSelectedPhoto() {
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }
    setPreview(null);
    setFile(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    for (const [field, label] of [
      ["persona_carga", "la persona que carga"],
      ["nombre_instrumento", "el nombre del instrumento"],
      ["numero_parte", "el número de parte"],
      ["numero_serie", "el número de serie"],
    ] as const) {
      if (!values[field].trim()) {
        setError(`Completa ${label}.`);
        return;
      }
    }

    setSaving(true);
    const body = new FormData();
    Object.entries(values).forEach(([key, value]) => body.append(key, value));
    if (file) body.append("foto", file);

    try {
      const response = await fetch(id ? `/api/instrumentos/${id}` : "/api/instrumentos", {
        method: id ? "PUT" : "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No se pudo guardar el instrumento.");
      router.push(id ? `/instrumentos/${id}?actualizado=1` : `/?creado=${result.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ocurrió un error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="panel loading-panel">Cargando instrumento…</div>;
  if (editing && error && !values.persona_carga) {
    return (
      <div className="panel">
        <div className="notice error-notice" role="alert">{error}</div>
        <Link className="button button-secondary" href="/">Volver al listado</Link>
      </div>
    );
  }

  const photoToShow = preview ?? existingPhoto;

  return (
    <form className="panel instrument-form" onSubmit={submit} noValidate>
      {error && <div className="notice error-notice" role="alert">{error}</div>}
      <div className="form-grid">
        <label className="field">
          <span>Persona que carga <b>*</b></span>
          <input required maxLength={160} autoComplete="name" value={values.persona_carga} onChange={(event) => updateField("persona_carga", event.target.value)} placeholder="Nombre y apellido" />
        </label>
        <label className="field">
          <span>Nombre del instrumento <b>*</b></span>
          <input required maxLength={200} value={values.nombre_instrumento} onChange={(event) => updateField("nombre_instrumento", event.target.value)} placeholder="Ej. Altímetro" />
        </label>
        <label className="field">
          <span>Número de parte <b>*</b></span>
          <input required maxLength={120} value={values.numero_parte} onChange={(event) => updateField("numero_parte", event.target.value)} placeholder="Ej. AL-42/B" />
        </label>
        <label className="field">
          <span>Número de serie <b>*</b></span>
          <input required maxLength={120} value={values.numero_serie} onChange={(event) => updateField("numero_serie", event.target.value)} placeholder="Ej. SN-00814" />
        </label>
      </div>

      <div className="field photo-field">
        <label htmlFor="photo">Fotografía <span className="optional-label">{editing ? "Opcional · deja vacío para conservar la actual" : "Opcional"}</span></label>
        <label className="upload-box" htmlFor="photo">
          <span className="upload-icon" aria-hidden="true">↑</span>
          <span><strong>Seleccionar fotografía</strong><small>JPEG, PNG, GIF o WebP · máximo 4 MB</small></span>
          <input id="photo" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(event) => selectPhoto(event.target.files?.[0])} />
        </label>
        {photoToShow && (
          <div className="preview-wrap">
            <img className="photo-preview" src={photoToShow} alt="Vista previa del instrumento" />
            {file && <button className="text-button" type="button" onClick={clearSelectedPhoto}>Quitar selección</button>}
          </div>
        )}
      </div>

      <div className="form-actions">
        <Link className="button button-secondary" href={id ? `/instrumentos/${id}` : "/"}>Cancelar</Link>
        <button className="button button-primary" type="submit" disabled={saving}>
          {saving ? "Guardando…" : editing ? "Guardar cambios" : "Guardar instrumento"}
        </button>
      </div>
    </form>
  );
}
