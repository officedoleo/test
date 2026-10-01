const ITEMS = [
  "Excel avançado",
  "Power BI dashboards",
  "Consultoria financeira",
  "Planejamento estratégico",
  "Palestras de gestão e tech",
  "PowerPoint executivo",
  "Word para negócios",
  "Aulas individuais",
];

export default function Marquee() {
  return (
    <div
      data-testid="editorial-marquee"
      className="relative border-y border-slate-800/80 bg-surface py-5 overflow-hidden"
      aria-hidden="true"
    >
      <div className="flex w-max animate-marquee">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0">
            {ITEMS.map((item) => (
              <span
                key={`${copy}-${item}`}
                className="mx-6 flex items-center gap-6 font-mono text-xs md:text-sm uppercase tracking-[0.25em] text-slate-400 whitespace-nowrap"
              >
                {item}
                <span className="w-1.5 h-1.5 rounded-full bg-mint/70 inline-block" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
