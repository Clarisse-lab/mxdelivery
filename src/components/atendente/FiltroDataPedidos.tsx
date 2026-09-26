export default function FiltroDataPedidos({
  hoje,
  dataSelecionada,
}: {
  hoje: string;
  dataSelecionada: string;
}) {
  const vendoOutroDia = dataSelecionada !== hoje;

  return (
    <div className="flex flex-wrap items-end gap-2.5 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_2px_9px_rgba(7,31,61,.045)]">
      <form method="GET" className="flex flex-wrap items-end gap-2.5">
        <div>
          <label
            htmlFor="data-historico"
            className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"
          >
            Filtrar por dia
          </label>
          <input
            id="data-historico"
            type="date"
            name="data"
            defaultValue={dataSelecionada}
            max={hoje}
            className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-brand-navy-dark focus:border-brand-gold focus:bg-white focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-extrabold text-white hover:bg-brand-navy-dark"
        >
          Consultar
        </button>
      </form>

      {vendoOutroDia && (
        <a
          href="/atendente/dashboard"
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold text-slate-600 hover:bg-slate-50"
        >
          Voltar pra hoje
        </a>
      )}
    </div>
  );
}
