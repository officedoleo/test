import { Reveal } from "@/components/Reveal";

const STEPS = [
  {
    n: "01",
    title: "Escolha o serviço",
    desc: "Aula, consultoria ou palestra — e o tema exato que você precisa.",
  },
  {
    n: "02",
    title: "Selecione data e horário",
    desc: "Veja em tempo real os horários livres na agenda e reserve o seu.",
  },
  {
    n: "03",
    title: "Confirme pelo WhatsApp",
    desc: "Sua reserva é registrada e o WhatsApp abre com a mensagem pronta.",
  },
  {
    n: "04",
    title: "Bora evoluir",
    desc: "Sessão prática e objetiva, online ou presencial, no seu ritmo.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="relative py-24 md:py-32 border-t border-slate-800/60">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-neon">Como funciona</p>
          <h2 className="mt-4 font-display font-extrabold tracking-tight text-3xl md:text-4xl lg:text-5xl max-w-xl">
            Do clique ao <span className="text-gradient">horário reservado</span> em minutos.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1} className="h-full">
              <div
                data-testid={`how-step-${s.n}`}
                className="h-full rounded-2xl border border-slate-800 bg-surface p-7 hover:border-neon/40 hover:-translate-y-1 transition-all duration-300"
              >
                <span className="font-mono text-3xl font-bold text-transparent" style={{ WebkitTextStroke: "1px #00E5FF" }}>
                  {s.n}
                </span>
                <h3 className="mt-5 font-display font-bold text-lg text-slate-100">{s.title}</h3>
                <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
