import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CATEGORIES, CATEGORY_BY_ID } from "@/constants/services";

export default function Calculator({ onBook }) {
  const [categoryId, setCategoryId] = useState("aulas");
  const [hours, setHours] = useState(2);

  const total = useMemo(() => CATEGORY_BY_ID[categoryId].price * hours, [categoryId, hours]);

  return (
    <section id="valores" className="relative py-24 md:py-32 border-t border-slate-800/60">
      <div className="max-w-7xl mx-auto px-5 md:px-10 grid lg:grid-cols-2 gap-12 items-center">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-mint">Simulador</p>
          <h2 className="mt-4 font-display font-extrabold tracking-tight text-3xl md:text-4xl lg:text-5xl">
            Quanto você <span className="text-gradient">investe</span> na sua evolução?
          </h2>
          <p className="mt-5 text-slate-400 max-w-md leading-relaxed">
            Escolha a categoria e o número de horas para estimar o valor total.
            Depois envie direto para a reserva com esses dados.
          </p>

          <div className="mt-8 flex flex-wrap gap-2" data-testid="calculator-categories">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                data-testid={`calc-category-${c.id}`}
                onClick={() => setCategoryId(c.id)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold border transition-all duration-200 ${
                  categoryId === c.id
                    ? "bg-mint text-obsidian border-mint"
                    : "border-slate-700 text-slate-300 hover:border-neon/50 hover:text-neon"
                }`}
              >
                {c.label} · R$ {c.price}/h
              </button>
            ))}
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-slate-400">
              <span>Horas de sessão</span>
              <span data-testid="calc-hours-value" className="text-neon font-bold text-base">{hours}h</span>
            </div>
            <input
              data-testid="calc-hours-slider"
              type="range"
              min="1"
              max="40"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="mt-4 w-full accent-[#00FF87] cursor-pointer"
              aria-label="Quantidade de horas"
            />
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative rounded-2xl border border-slate-800 bg-surface p-8 md:p-12 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-50"
              style={{ background: "radial-gradient(circle, rgba(0,255,135,0.16), transparent 70%)" }}
            />
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-400">
              Investimento estimado
            </p>
            <p
              data-testid="calc-total"
              className="mt-4 font-mono font-bold text-5xl md:text-6xl text-mint tabular-nums transition-all"
            >
              R$ {total.toLocaleString("pt-BR")}
            </p>
            <p className="mt-3 font-mono text-xs text-slate-500">
              {CATEGORY_BY_ID[categoryId].label} · {hours}h × R$ {CATEGORY_BY_ID[categoryId].price}/hora
            </p>

            <div className="mt-8 rounded-xl border border-slate-800 bg-obsidian/60 p-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                <span className="text-mint font-semibold">Importante:</span> cada horário
                reservado corresponde a 1 hora de sessão. Use o simulador como referência
                para planos com mais horas.
              </p>
            </div>

            <button
              data-testid="calc-cta"
              onClick={() => onBook(categoryId)}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-neon px-7 py-3.5 font-semibold text-obsidian hover:shadow-[0_0_36px_rgba(0,229,255,0.4)] hover:-translate-y-0.5 transition-all duration-200"
            >
              Continuar para o agendamento
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
