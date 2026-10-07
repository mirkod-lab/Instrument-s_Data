import Link from "next/link";
import InstrumentoForm from "@/components/InstrumentoForm";

export default async function EditarInstrumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="page-shell narrow-shell">
      <Link className="back-link" href={`/instrumentos/${id}`}>← Volver al detalle</Link>
      <div className="page-heading">
        <span className="eyebrow">EDICIÓN</span>
        <h1>Editar instrumento</h1>
        <p>Actualiza los datos y guarda los cambios.</p>
      </div>
      <InstrumentoForm id={id} />
    </main>
  );
}
