import NovoPedidoForm from "@/components/atendente/NovoPedidoForm";

export default function NovoPedidoPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Novo pedido</h1>
      <NovoPedidoForm />
    </div>
  );
}
