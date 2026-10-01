import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";

export default function Footer() {
  const [wa, setWa] = useState("");

  useEffect(() => {
    api.get("/config").then(({ data }) => setWa((data.whatsapp_number || "").replace(/\D/g, ""))).catch(() => {});
  }, []);

  return (
    <footer className="relative border-t border-slate-800/80 bg-[#040508] pt-16 pb-10 px-5 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <Logo size="text-xl" />
            <p className="mt-4 max-w-xs text-sm text-slate-400 leading-relaxed">
              Aulas, consultorias e palestras com metodologia prática e direta
              ao ponto. Online ou presencial.
            </p>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon">Navegação</p>
            <nav className="mt-5 flex flex-col gap-3 text-sm text-slate-300">
              <a href="#servicos" className="hover:text-neon transition-colors w-fit">Serviços</a>
              <a href="#valores" className="hover:text-neon transition-colors w-fit">Valores</a>
              <a href="#como-funciona" className="hover:text-neon transition-colors w-fit">Como funciona</a>
              <a href="#agendar" className="hover:text-neon transition-colors w-fit">Agendar</a>
              <a href="/admin" data-testid="footer-admin-link" className="hover:text-mint transition-colors w-fit text-slate-500">
                Painel do Léo
              </a>
            </nav>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-mint">Atendimento</p>
            <p className="mt-5 text-sm text-slate-300 leading-relaxed">
              Horários de 1 hora, das 08h às 21h.
              <br />
              Agenda atualizada em tempo real.
            </p>
            {wa && (
              <a
                data-testid="footer-whatsapp"
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-mint/40 px-5 py-2.5 text-sm font-semibold text-mint hover:bg-mint/10 transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp do Léo
              </a>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-t border-slate-800/60 pt-6">
          <p className="font-mono text-xs text-slate-500">
            © {new Date().getFullYear()} Office do Léo — Todos os direitos reservados.
          </p>
          <p className="font-mono text-xs text-slate-600">Feito com tecnologia e pensamento de gestão.</p>
        </div>
      </div>
    </footer>
  );
}
