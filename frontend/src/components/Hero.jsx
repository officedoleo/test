import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDownRight, Clock3 } from "lucide-react";
import { api } from "@/lib/api";

const HERO_IMG =
  "https://images.unsplash.com/photo-1758876204300-7adfdec6579f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

function MaskedLine({ children, delay = 0, className = "" }) {
  return (
    <span className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
      <motion.span
        className={`block ${className}`}
        initial={{ y: "115%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export default function Hero({ onBook }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const glowY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const [nextSlot, setNextSlot] = useState(null);

  useEffect(() => {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    api
      .get("/availability", { params: { date: iso } })
      .then(({ data }) => {
        const free = data.slots?.find((s) => s.status === "available");
        setNextSlot(free ? free.time : null);
      })
      .catch(() => {});
  }, []);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 grid-bg mask-fade-b" />
      <motion.div
        style={{ y: glowY }}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[520px] rounded-full blur-3xl opacity-70"
          style={{ background: "radial-gradient(circle at 50% 30%, rgba(0,229,255,0.14) 0%, rgba(0,255,135,0.07) 40%, transparent 70%)" }}
        />
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-5 md:px-10 pt-28 pb-16 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">
        <div className="lg:col-span-7">
          <MaskedLine delay={0.05}>
            <span className="font-mono text-[11px] md:text-xs uppercase tracking-[0.28em] text-neon inline-flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-mint animate-pulse-node inline-block" />
              Office do Léo · Agendamento online
            </span>
          </MaskedLine>

          <h1 className="mt-6 font-display font-extrabold tracking-tight leading-[1.02] text-[1.9rem] sm:text-5xl lg:text-[3.1rem] xl:text-[3.5rem]">
            <MaskedLine delay={0.15}>Aulas,</MaskedLine>
            <MaskedLine delay={0.25}>consultoria e</MaskedLine>
            <MaskedLine delay={0.35}>
              <span className="text-gradient">palestras</span> que
            </MaskedLine>
            <MaskedLine delay={0.45}>
              <span className="text-slate-400">aceleram</span>
            </MaskedLine>
            <MaskedLine delay={0.55}>
              <span className="text-slate-400">resultados.</span>
            </MaskedLine>
          </h1>

          <MaskedLine delay={0.55}>
            <p className="mt-6 max-w-xl text-base md:text-lg text-slate-300 leading-relaxed">
              Excel, Word, Power BI e PowerPoint em aulas individuais. Consultoria
              empresarial, financeira e estratégica. Palestras educativas para
              empresas e escolas.
            </p>
          </MaskedLine>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <button
              data-testid="hero-cta-book"
              onClick={() => onBook()}
              className="inline-flex items-center gap-2 rounded-full bg-mint px-7 py-3.5 font-semibold text-obsidian hover:shadow-[0_0_36px_rgba(0,255,135,0.45)] hover:-translate-y-0.5 transition-all duration-200"
            >
              Agendar sessão agora
              <ArrowDownRight className="w-4 h-4" />
            </button>
            <a
              href="#servicos"
              data-testid="hero-cta-prices"
              className="inline-flex items-center gap-2 rounded-full border border-neon/40 px-7 py-3.5 font-medium text-neon hover:bg-neon/10 hover:-translate-y-0.5 transition-all duration-200"
            >
              Ver categorias e preços
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            {[
              ["R$ 60", "/hora · Aulas"],
              ["R$ 100", "/hora · Consultorias"],
              ["R$ 120", "/hora · Palestras"],
            ].map(([v, l]) => (
              <div
                key={l}
                data-testid="hero-price-chip"
                className="rounded-xl border border-slate-800 bg-surface/70 px-4 py-2.5"
              >
                <span className="font-mono font-bold text-mint">{v}</span>
                <span className="ml-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-400">{l}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5 relative"
        >
          <motion.div style={{ y: imgY }} className="relative">
            <div className="absolute -inset-6 rounded-full blur-3xl opacity-60"
              style={{ background: "radial-gradient(circle, rgba(0,229,255,0.16), transparent 65%)" }}
            />
            <div className="relative clip-frame overflow-hidden border border-slate-800">
              <img
                src={HERO_IMG}
                alt="Consultoria de tecnologia e gestão"
                className="w-full h-[380px] md:h-[500px] object-cover"
                style={{ filter: "saturate(0.9) contrast(1.05)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian/85 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neon">Atendimento</p>
                  <p className="font-display font-bold text-lg text-slate-100">Online e presencial</p>
                </div>
                <div
                  data-testid="hero-next-slot"
                  className="glass rounded-xl border border-mint/30 px-4 py-2.5 flex items-center gap-2"
                >
                  <Clock3 className="w-4 h-4 text-mint" />
                  <div className="leading-tight">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Próximo horário hoje</p>
                    <p className="font-mono text-sm font-bold text-mint">{nextSlot || "Consulte agenda"}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
