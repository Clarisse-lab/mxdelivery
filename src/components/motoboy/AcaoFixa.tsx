export default function AcaoFixa({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-brand-navy/8 bg-white/92 p-4 shadow-[0_-12px_32px_rgba(7,31,61,.10)] backdrop-blur-xl">
      <div className="mx-auto max-w-2xl">{children}</div>
    </div>
  );
}
