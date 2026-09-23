export default function ExportarRelatorio({ hoje }: { hoje: string }) {
  return (
    <form
      action="/atendente/relatorios/exportar"
      method="GET"
      className="flex flex-wrap items-end gap-2.5 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_2px_9px_rgba(7,31,61,.045)]"
    >
      <div>
        <label
          htmlFor="data-relatorio"
          className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"
        >
          Relatório do dia
        </label>
        <input
          id="data-relatorio"
          type="date"
          name="data"
          defaultValue={hoje}
          max={hoje}
          className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-brand-navy-dark focus:border-brand-gold focus:bg-white focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-extrabold text-white hover:bg-brand-navy-dark"
      >
        Exportar Excel
      </button>
    </form>
  );
}
