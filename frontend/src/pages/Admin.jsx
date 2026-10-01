import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, LogOut, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { LogoMark } from "@/components/Logo";
import { isoToBR } from "@/constants/services";

const STATUS_STYLE = {
  pending: "bg-amber-400/10 text-amber-300 border-amber-400/30",
  confirmed: "bg-mint/10 text-mint border-mint/30",
  cancelled: "bg-rose-400/10 text-rose-300 border-rose-400/30",
};
const STATUS_LABEL = { pending: "Pendente", confirmed: "Confirmado", cancelled: "Cancelado" };

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      onLogin(data);
    } catch (err) {
      toast.error(formatApiError(err, "Falha no login."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center px-5">
      <form
        onSubmit={submit}
        data-testid="admin-login-form"
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-surface p-8"
      >
        <LogoMark className="w-12 h-12 mx-auto" />
        <h1 className="mt-5 text-center font-display font-extrabold text-xl">Painel do Léo</h1>
        <p className="mt-2 text-center text-sm text-slate-400">Acesso restrito à administração</p>
        <input
          data-testid="admin-email-input"
          className="input-dark mt-7"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          data-testid="admin-password-input"
          className="input-dark mt-3"
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          data-testid="admin-login-button"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-mint py-3 font-semibold text-obsidian hover:shadow-[0_0_28px_rgba(0,255,135,0.4)] transition-all disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

function BookingsTab() {
  const [bookings, setBookings] = useState(null);

  const load = () => api.get("/admin/bookings").then(({ data }) => setBookings(data)).catch(() => setBookings([]));
  useEffect(() => { load(); }, []);

  const act = async (id, fn, msg) => {
    try {
      await fn();
      toast.success(msg);
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  if (!bookings) return <p className="text-slate-400 text-sm py-8">Carregando...</p>;
  if (!bookings.length)
    return <p className="text-slate-400 text-sm py-8">Nenhum agendamento ainda. Assim que um cliente reservar, aparece aqui.</p>;

  return (
    <div className="space-y-3" data-testid="admin-bookings-list">
      {bookings.map((b) => (
        <div key={b.id} data-testid={`admin-booking-${b.booking_code}`} className="rounded-xl border border-slate-800 bg-obsidian/50 p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-mono text-xs text-slate-500">{b.booking_code}</span>
            <span className={`rounded-full border px-3 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STATUS_STYLE[b.status]}`}>
              {STATUS_LABEL[b.status]}
            </span>
            <span className="ml-auto font-mono text-sm text-neon font-bold">
              {isoToBR(b.date)} · {b.time}
            </span>
          </div>
          <p className="mt-2.5 text-sm text-slate-200">
            <span className="font-semibold">{b.name}</span> — {b.service_name}{" "}
            <span className="text-slate-500">({b.category_name}, R$ {b.price_per_hour}/h)</span>
          </p>
          <p className="mt-1 font-mono text-xs text-slate-400">
            {b.phone} · {b.email} {b.notes && `· "${b.notes}"`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {b.status === "pending" && (
              <button
                data-testid={`admin-confirm-${b.booking_code}`}
                onClick={() => act(b.id, () => api.patch(`/admin/bookings/${b.id}`, { status: "confirmed" }), "Agendamento confirmado")}
                className="rounded-full bg-mint/15 border border-mint/40 px-4 py-1.5 text-xs font-semibold text-mint hover:bg-mint/25 transition-colors"
              >
                Confirmar
              </button>
            )}
            {b.status !== "cancelled" && (
              <button
                data-testid={`admin-cancel-${b.booking_code}`}
                onClick={() => act(b.id, () => api.patch(`/admin/bookings/${b.id}`, { status: "cancelled" }), "Agendamento cancelado")}
                className="rounded-full bg-amber-400/10 border border-amber-400/30 px-4 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              data-testid={`admin-delete-${b.booking_code}`}
              onClick={() => act(b.id, () => api.delete(`/admin/bookings/${b.id}`), "Agendamento excluído")}
              className="rounded-full border border-slate-700 px-4 py-1.5 text-xs text-slate-400 hover:border-rose-400/50 hover:text-rose-300 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SlotsTab() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState(null);

  const load = (d) =>
    api.get("/admin/slots", { params: { date: d } }).then(({ data }) => setSlots(data.slots)).catch(() => setSlots([]));

  useEffect(() => { load(date); }, [date]);

  const toggle = async (s) => {
    const endpoint = s.status === "blocked" ? "unblock" : "block";
    try {
      await api.post(`/admin/slots/${endpoint}`, { date, time: s.time });
      toast.success(s.status === "blocked" ? `Horário ${s.time} liberado` : `Horário ${s.time} bloqueado`);
      load(date);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const cancelBooking = async (s) => {
    try {
      await api.patch(`/admin/bookings/${s.booking.id}`, { status: "cancelled" });
      toast.success(`Reserva de ${s.booking.name} cancelada`);
      load(date);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  return (
    <div data-testid="admin-slots-panel">
      <div className="flex flex-wrap items-center gap-4">
        <label className="font-mono text-xs uppercase tracking-wider text-slate-400">Data</label>
        <input
          data-testid="admin-slot-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-dark w-auto [color-scheme:dark]"
        />
        <p className="text-xs text-slate-500">Clique em um horário livre para bloquear, ou em um bloqueado para liberar.</p>
      </div>

      {!slots ? (
        <p className="mt-6 text-sm text-slate-400">Carregando...</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3" data-testid="admin-slots-grid">
          {slots.map((s) => {
            const blocked = s.status === "blocked";
            const booked = s.status === "booked";
            const past = s.status === "past";
            return (
              <div key={s.time} className="rounded-xl border border-slate-800 bg-obsidian/50 p-3">
                <p className="font-mono text-sm font-bold text-slate-200">{s.time}</p>
                {booked && s.booking ? (
                  <>
                    <p className="mt-1 text-xs text-slate-400 truncate" data-testid={`admin-slot-booked-${s.time}`}>
                      {s.booking.name} · {s.booking.service_name}
                    </p>
                    <button
                      data-testid={`admin-slot-cancel-booking-${s.time}`}
                      onClick={() => cancelBooking(s)}
                      className="mt-2.5 w-full rounded-md border border-amber-400/30 bg-amber-400/10 py-1.5 text-[11px] font-semibold text-amber-300 hover:bg-amber-400/20 transition-colors"
                    >
                      Cancelar reserva
                    </button>
                  </>
                ) : (
                  <>
                    <p className={`mt-1 text-xs ${blocked ? "text-rose-300" : past ? "text-slate-600" : "text-mint"}`}>
                      {blocked ? "Bloqueado" : past ? "Passou" : "Livre"}
                    </p>
                    <button
                      data-testid={`admin-slot-toggle-${s.time}`}
                      disabled={past}
                      onClick={() => toggle(s)}
                      className={`mt-2.5 w-full rounded-md border py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        blocked
                          ? "border-mint/40 bg-mint/10 text-mint hover:bg-mint/20"
                          : "border-rose-400/30 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20"
                      }`}
                    >
                      {blocked ? "Liberar" : "Bloquear"}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const [wa, setWa] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/settings")
      .then(({ data }) => {
        setWa(data.whatsapp_number || "");
        setOwnerEmail(data.owner_email || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    try {
      await api.put("/admin/settings", { whatsapp_number: wa, owner_email: ownerEmail });
      toast.success("Configurações salvas!");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  if (loading) return <p className="text-slate-400 text-sm py-8">Carregando...</p>;

  return (
    <div className="max-w-md space-y-5" data-testid="admin-settings-panel">
      <div>
        <label className="font-mono text-[11px] uppercase tracking-wider text-slate-400">WhatsApp de atendimento</label>
        <input
          data-testid="settings-whatsapp-input"
          className="input-dark mt-2"
          placeholder="5511999999999 (com código do país)"
          value={wa}
          onChange={(e) => setWa(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-slate-500">Usado no botão de confirmação dos agendamentos.</p>
      </div>
      <div>
        <label className="font-mono text-[11px] uppercase tracking-wider text-slate-400">E-mail para receber avisos</label>
        <input
          data-testid="settings-owner-email-input"
          className="input-dark mt-2"
          type="email"
          placeholder="seu@email.com"
          value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-slate-500">Você recebe um aviso por e-mail a cada nova reserva. Vazio = sem avisos.</p>
      </div>
      <button
        data-testid="settings-save-button"
        onClick={save}
        className="rounded-full bg-neon px-7 py-3 font-semibold text-obsidian hover:shadow-[0_0_28px_rgba(0,229,255,0.4)] transition-all"
      >
        Salvar configurações
      </button>
    </div>
  );
}

export default function Admin() {
  const [user, setUser] = useState(undefined);
  const [tab, setTab] = useState("bookings");

  useEffect(() => {
    api.get("/auth/me").then(({ data }) => setUser(data)).catch(() => setUser(null));
  }, []);

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
  };

  if (user === undefined)
    return <div className="min-h-screen bg-obsidian flex items-center justify-center"><p className="font-mono text-sm text-slate-400">Carregando...</p></div>;

  if (!user) return <Login onLogin={setUser} />;

  const TABS = [
    { id: "bookings", label: "Agendamentos", icon: Users },
    { id: "slots", label: "Horários", icon: CalendarClock },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-obsidian text-slate-100" data-testid="admin-dashboard">
      <header className="glass border-b border-slate-800/60 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="w-8 h-8" />
            <span className="font-display font-bold">Painel do Léo</span>
          </div>
          <button
            data-testid="admin-logout"
            onClick={logout}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-rose-300 transition-colors"
          >
            Sair
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 md:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex flex-wrap gap-2" data-testid="admin-tabs">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                data-testid={`admin-tab-${id}`}
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  tab === id
                    ? "border-neon text-neon bg-neon/10"
                    : "border-slate-800 text-slate-400 hover:border-slate-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {tab === "bookings" && <BookingsTab />}
            {tab === "slots" && <SlotsTab />}
            {tab === "settings" && <SettingsTab />}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
