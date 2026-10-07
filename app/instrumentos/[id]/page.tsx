import InstrumentoDetalle from "@/components/InstrumentoDetalle";

export default async function InstrumentoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ actualizado?: string }>;
}) {
  const [{ id }, { actualizado }] = await Promise.all([params, searchParams]);
  return <InstrumentoDetalle id={id} updated={Boolean(actualizado)} />;
}
