import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, MessageCircle, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { CATEGORIES, CATEGORY_BY_ID, serviceById, isoToBR } from "@/constants/services";
import { Reveal } from "@/components/Reveal";

const STEPS = ["Categoria", "Serviço", "Data", "Horário", "Contato", "Confirmação"];

const PT_DAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function nextDays(n = 14) {
  const out = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    out.push(d);
  }
  return out;
}

function fmtIso(d) {
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function BookingWizard({ preset }) {
  const [step, setStep] = useState(0);
  const [categoryId, setCategoryId] = useState(null);
  const [serviceId, setServiceId] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [slots, setSlots] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [waNumber, setWaNumber] = useState("");

  const days = useMemo(() => nextDays(14), []);
  const category = categoryId ? CATEGORY_BY_ID[categoryId] : null;
  const service = serviceById(serviceId);

  useEffect(() => {
    api.get("/config").then(({ data }) => setWaNumber(data.whatsapp_number || "")).catch(() => {});
  }, []);

  useEffect(() => {
    if (preset) {
      setCategoryId(preset.category);
      setServiceId(null);
      setDate(null);
      setTime(null);
      setDone(null);
      setStep(1);
    }
  }, [preset]);

  useEffect(() => {
    if (!date || step < 3) return;
    let active = true;
    setLoadingSlots(true);
    api
      .get("/availability", { params: { date } })
      .then(({ data }) => {
        if (active) setSlots(data.slots || []);
      })
      .catch(() => {
        if (active) {
          setSlots([]);
          toast.error("Não foi possível carregar os horários.");
        }
      })
      .finally(() => active && setLoadingSlots(false));
    return () => {
      active = false;
    };
  }, [date, step]);

  const formValid =
    form.name.trim().length >= 2 &&
    form.phone.replace(/\D/g, "").length >= 10 &&
    /\S+@\S+\.\S+/.test(form.email.trim());

  const canAdvance = [!!categoryId, !!serviceId, !!date, !!time, formValid, true][step];

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post("/bookings", {
        service_id: serviceId,
        date,
        time,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
      });
      setDone(data.booking);
      const msg = [
        `Olá Léo! Quero confirmar meu agendamento:`,
        `• Serviço: ${data.booking.service_name} (${data.booking.category_name})`,
        `• Valor: R$ ${data.booking.price_per_hour}/hora`,
        `• Data: ${isoToBR(data.booking.date)} às ${data.booking.time}`,
        `• Nome: ${form.name.trim()}`,
        `• Código: ${data.booking.booking_code}`,
        form.notes.trim() ? `• Obs: ${form.notes.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      const link = `https://wa.me/${waNumber.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
      window.open(link, "_blank", "noopener");
    } catch (e) {
      toast.error(formatApiError(e, "Erro ao registrar agendamento."));
      const detail = e?.response?.data?.detail;
      if (typeof detail === "string" && (detail.includes("bloqueado") || detail.includes("reservado") || detail.includes("passou"))) {
        setStep(3);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(0);
    setCategoryId(null);
    setServiceId(null);
    setDate(null);
    setTime(null);
    setDone(null);
    setForm({ name: "", phone: "", email: "", notes: "" });
  };

  const labelCls = "font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400";

  if (done) {
    return (
      <section id="agendar" className="py-24 md:py-32 border-t border-slate-800/60">
        <div className="max-w-2xl mx-auto px-5 md:px-10">
          <div data-testid="booking-success" className="rounded-2xl border border-mint/30 bg-surface p-8 md:p-12 text-center glow-ring">
            <PartyPopper className="w-12 h-12 text-mint mx-auto" />
            <h3 className="mt-6 font-display font-extrabold text-2xl md:text-3xl">
              Reserva registrada!
            </h3>
            <p className="mt-3 text-slate-400">
              {service?.name} · {isoToBR(done.date)} às {done.time}
            </p>
            <p className="mt-6 font-mono text-sm text-slate-300">
              Código da reserva <span data-testid="booking-code" className="font-bold text-neon">{done.booking_code}</span>
            </p>
            <p className="mt-6 text-sm text-slate-400 leading-relaxed">
              Se o WhatsApp não abriu automaticamente, confirme sua sessão no botão abaixo:
            </p>
            <a
              data-testid="booking-whatsapp-button"
              href={`https://wa.me/${waNumber.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-mint px-7 py-3.5 font-semibold text-obsidian hover:shadow-[0_0_36px_rgba(0,255,135,0.45)] transition-all duration-200"
            >
              <MessageCircle className="w-5 h-5" />
              Falar com o Léo no WhatsApp
            </a>
            <button
              data-testid="booking-new"
              onClick={reset}
              className="mt-6 block mx-auto text-sm text-slate-400 hover:text-neon transition-colors"
            >
              Fazer novo agendamento
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="agendar" className="relative py-24 md:py-32 border-t border-slate-800/60">
      <div className="max-w-4xl mx-auto px-5 md:px-10">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-mint">Agendamento</p>
          <h2 className="mt-4 font-display font-extrabold tracking-tight text-3xl md:text-4xl lg:text-5xl">
            Reserve seu <span className="text-gradient">horário</span>.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 rounded-2xl border border-slate-800 bg-surface p-6 md:p-10">
            <div className="flex items-center gap-2 overflow-x-auto pb-2" data-testid="wizard-steps">
              {STEPS.map((label, i) => (
                <button
                  key={label}
                  data-testid={`wizard-step-${i}`}
                  onClick={() => i < step && setStep(i)}
                  className={`shrink-0 rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider border transition-all duration-200 ${
                    i === step
                      ? "border-neon text-neon bg-neon/10"
                      : i < step
                      ? "border-mint/40 text-mint cursor-pointer"
                      : "border-slate-800 text-slate-500"
                  }`}
                >
                  {i + 1} · {label}
                </button>
              ))}
            </div>

            <div className="mt-8 min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {step === 0 && (
                    <div data-testid="wizard-step-category">
                      <p className={labelCls}>O que você procura?</p>
                      <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        {CATEGORIES.map((c) => (
                          <button
                            key={c.id}
                            data-testid={`wizard-category-${c.id}`}
                            onClick={() => { setCategoryId(c.id); setStep(1); }}
                            className={`rounded-xl border p-5 text-left transition-all duration-200 hover:-translate-y-1 ${
                              categoryId === c.id
                                ? "border-neon bg-neon/5"
                                : "border-slate-800 bg-obsidian/50 hover:border-neon/40"
                            }`}
                          >
                            <span className="font-display font-bold text-lg text-slate-100">{c.label}</span>
                            <span className="mt-1 block font-mono text-sm font-bold text-mint">
                              R$ {c.price}/hora
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div data-testid="wizard-step-service">
                      <p className={labelCls}>
                        {category?.label} · R$ {category?.price}/hora — escolha o tema
                      </p>
                      <div className="mt-5 flex flex-wrap gap-3">
                        {category?.services.map((s) => (
                          <button
                            key={s.id}
                            data-testid={`wizard-service-${s.id}`}
                            onClick={() => { setServiceId(s.id); setStep(2); }}
                            className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                              serviceId === s.id
                                ? "border-mint text-mint bg-mint/10"
                                : "border-slate-700 text-slate-300 hover:border-mint/50 hover:text-mint"
                            }`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div data-testid="wizard-step-date">
                      <p className={labelCls}>Escolha o dia</p>
                      <div className="mt-5 flex gap-3 overflow-x-auto pb-3 -mx-2 px-2">
                        {days.map((d) => {
                          const iso = fmtIso(d);
                          const selected = date === iso;
                          return (
                            <button
                              key={iso}
                              data-testid={`wizard-date-${iso}`}
                              onClick={() => { setDate(iso); setStep(3); }}
                              className={`shrink-0 w-[76px] rounded-xl border py-4 text-center transition-all duration-200 ${
                                selected
                                  ? "border-neon bg-neon/10 text-neon"
                                  : "border-slate-800 bg-obsidian/50 text-slate-300 hover:border-neon/40"
                              }`}
                            >
                              <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">
                                {d.getDate() === 1 || iso === fmtIso(days[0]) ? PT_DAYS[d.getDay()] : PT_DAYS[d.getDay()]}
                              </span>
                              <span className="mt-1 block font-display text-xl font-bold">{d.getDate()}</span>
                              <span className="block font-mono text-[10px] text-slate-500">
                                {d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div data-testid="wizard-step-time">
                      <p className={labelCls}>
                        Horários livres · {isoToBR(date)}
                      </p>
                      {loadingSlots ? (
                        <div className="mt-5 grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="h-11 rounded-lg bg-elevated animate-pulse" />
                          ))}
                        </div>
                      ) : slots?.length ? (
                        <div className="mt-5 grid grid-cols-3 sm:grid-cols-5 gap-3" data-testid="wizard-slots">
                          {slots.map((s) => {
                            const disabled = s.status !== "available";
                            const selected = time === s.time;
                            return (
                              <button
                                key={s.time}
                                data-testid={`wizard-slot-${s.time}`}
                                disabled={disabled}
                                onClick={() => { setTime(s.time); setStep(4); }}
                                title={
                                  s.status === "blocked" ? "Bloqueado pelo Léo" :
                                  s.status === "booked" ? "Já reservado" :
                                  s.status === "past" ? "Horário passou" : "Disponível"
                                }
                                className={`rounded-lg border py-3 font-mono text-sm transition-all duration-200 ${
                                  selected
                                    ? "border-mint bg-mint/10 text-mint font-bold"
                                    : disabled
                                    ? "border-slate-800/60 bg-obsidian/40 text-slate-600 line-through cursor-not-allowed"
                                    : "border-slate-700 text-slate-200 hover:border-mint/60 hover:text-mint"
                                }`}
                              >
                                {s.time}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-5 text-sm text-slate-400">Nenhum horário para este dia. Escolha outra data.</p>
                      )}
                    </div>
                  )}

                  {step === 4 && (
                    <div data-testid="wizard-step-contact">
                      <p className={labelCls}>Seus dados</p>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <input
                          data-testid="wizard-input-name"
                          className="input-dark sm:col-span-2"
                          placeholder="Seu nome completo *"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                        <input
                          data-testid="wizard-input-phone"
                          className="input-dark"
                          placeholder="Seu WhatsApp com DDD *"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                        <input
                          data-testid="wizard-input-email"
                          className="input-dark"
                          type="email"
                          placeholder="Seu e-mail *"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                        <textarea
                          data-testid="wizard-input-notes"
                          className="input-dark sm:col-span-2 min-h-[96px] resize-y"
                          placeholder="Conte rapidamente sua necessidade (opcional)"
                          value={form.notes}
                          onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div data-testid="wizard-step-review">
                      <p className={labelCls}>Confira sua reserva</p>
                      <div className="mt-5 rounded-xl border border-slate-800 bg-obsidian/50 divide-y divide-slate-800">
                        {[
                          ["Serviço", `${service?.name} (${category?.label})`],
                          ["Valor", `R$ ${category?.price}/hora`],
                          ["Data", `${isoToBR(date)} às ${time}`],
                          ["Nome", form.name],
                          ["Contato", `${form.phone} · ${form.email}`],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between gap-4 px-5 py-3.5">
                            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">{k}</span>
                            <span className="text-sm text-slate-200 text-right" data-testid={`wizard-review-${k.toLowerCase()}`}>{v}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        data-testid="wizard-confirm-button"
                        onClick={submit}
                        disabled={submitting}
                        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-mint px-7 py-4 font-semibold text-obsidian hover:shadow-[0_0_36px_rgba(0,255,135,0.45)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60"
                      >
                        {submitting ? (
                          "Registrando..."
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            Confirmar e abrir WhatsApp
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {step > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  data-testid="wizard-back"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-neon transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
                {step < 5 && (
                  <button
                    data-testid="wizard-next"
                    disabled={!canAdvance}
                    onClick={() => setStep((s) => Math.min(5, s + 1))}
                    className={`inline-flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      canAdvance
                        ? "bg-neon text-obsidian hover:shadow-[0_0_24px_rgba(0,229,255,0.4)]"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    Avançar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
