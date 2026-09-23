import NovoPedidoForm from "@/components/atendente/NovoPedidoForm";

export default function NovoPedidoPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-slate-200/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-gold-dark">
            Operação
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.045em] text-brand-navy-dark">
            Novo pedido
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Cadastre a entrega com clareza para que o pedido siga sem ruídos até o cliente.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Dados salvos ao criar
        </div>
      </header>

      <NovoPedidoForm />
    </div>
  );
}
