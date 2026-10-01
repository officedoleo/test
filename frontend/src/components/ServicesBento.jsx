import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CATEGORIES, ACCENTS } from "@/constants/services";

const IMAGES = {
  aulas: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  consultorias: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  palestras: "https://images.unsplash.com/photo-1627931539006-d5c4677e05ea?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
};

const LAYOUT = [
  "md:col-span-5",
  "md:col-span-7",
  "md:col-span-12",
];

function Card({ cat, index, onBook }) {
  const a = ACCENTS[cat.accent];
  const wide = index === 2;
  return (
    <article
      data-testid={`bento-card-${cat.id}`}
      className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-surface ${a.border} hover:-translate-y-1 ${a.glow} transition-all duration-300 ${LAYOUT[index]}`}
    >
      <div className={`grid ${wide ? "md:grid-cols-2" : "h-full"} h-full`}>
        <div className="p-7 md:p-9 flex flex-col">
          <div className="flex items-center justify-between gap-4">
            <span className={`font-mono text-[11px] uppercase tracking-[0.25em] ${a.text}`}>
              0{index + 1} · {cat.label}
            </span>
            <span className={`font-mono text-xl md:text-2xl font-bold ${a.text}`}>
              R$ {cat.price}<span className="text-xs text-slate-500 font-medium">/hora</span>
            </span>
          </div>

          <h3 className="mt-5 font-display font-bold text-xl md:text-2xl text-slate-100">
            {cat.label === "Aulas" && "Aulas individuais de Office & BI"}
            {cat.label === "Consultorias" && "Consultoria empresarial & tech"}
            {cat.label === "Palestras" && "Palestras & workshops corporativos"}
          </h3>
          <p className="mt-3 text-sm md:text-base text-slate-400 leading-relaxed">{cat.description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {cat.services.map((s) => (
              <span
                key={s.id}
                className={`rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-wide ${a.chip}`}
              >
                {s.name}
              </span>
            ))}
          </div>

          <button
            data-testid={`bento-cta-${cat.id}`}
            onClick={() => onBook(cat.id)}
            className={`mt-auto pt-7 inline-flex items-center gap-2 text-sm font-semibold ${a.text} self-start group/btn`}
          >
            Agendar {cat.label.toLowerCase()}
            <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </button>
        </div>

        <div className={`relative min-h-[220px] md:min-h-0 ${wide ? "" : "h-full"}`}>
          <img
            src={IMAGES[cat.id]}
            alt={cat.label}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            style={{ filter: "saturate(0.85) contrast(1.08) brightness(0.9)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent md:bg-gradient-to-r md:from-surface md:via-surface/30 md:to-transparent" />
        </div>
      </div>
    </article>
  );
}

export default function ServicesBento({ onBook }) {
  return (
    <section id="servicos" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-neon">Serviços</p>
          <h2 className="mt-4 font-display font-extrabold tracking-tight text-3xl md:text-4xl lg:text-5xl max-w-2xl">
            Três formas de <span className="text-gradient">evoluir</span> — pessoa, empresa ou plateia.
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-5">
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.id} delay={i * 0.1} className={LAYOUT[i]}>
              <Card cat={cat} index={i} onBook={onBook} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
