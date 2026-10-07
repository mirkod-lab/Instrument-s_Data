import Link from "next/link";
import InstrumentoForm from "@/components/InstrumentoForm";

export default function NuevoInstrumentoPage() {
  return (
    <main className="page-shell narrow-shell">
      <Link className="back-link" href="/">← Volver al listado</Link>
      <div className="page-heading">
        <span className="eyebrow">REGISTRO</span>
        <h1>Nuevo instrumento</h1>
        <p>Completa los datos para agregar un instrumento al registro.</p>
      </div>
      <InstrumentoForm />
    </main>
  );
}
