import { Suspense } from "react";
import InstrumentosListado from "@/components/InstrumentosListado";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ creado?: string }>;
}) {
  const { creado } = await searchParams;
  return (
    <Suspense fallback={<main className="page-shell"><div className="panel loading-panel">Cargando registro…</div></main>}>
      <InstrumentosListado created={Boolean(creado)} />
    </Suspense>
  );
}
