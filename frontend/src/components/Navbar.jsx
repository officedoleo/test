import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, CalendarClock } from "lucide-react";
import { Logo } from "@/components/Logo";

const LINKS = [
  { href: "#servicos", label: "Serviços" },
  { href: "#valores", label: "Valores" },
  { href: "#como-funciona", label: "Como funciona" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="navbar"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b border-slate-800/60" : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between">
        <a href="#" data-testid="nav-home-link" aria-label="Office do Léo — início">
          <Logo />
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-slate-300 hover:text-neon transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#agendar"
            data-testid="nav-cta"
            className="inline-flex items-center gap-2 rounded-full bg-mint px-5 py-2.5 text-sm font-semibold text-obsidian hover:shadow-[0_0_28px_rgba(0,255,135,0.4)] hover:-translate-y-0.5 transition-all duration-200"
          >
            <CalendarClock className="w-4 h-4" />
            Agendar horário
          </a>
        </nav>

        <button
          data-testid="nav-mobile-toggle"
          className="md:hidden text-slate-200 p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden glass border-b border-slate-800/60 overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-5">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-base text-slate-200"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="#agendar"
                onClick={() => setOpen(false)}
                data-testid="nav-mobile-cta"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-mint px-5 py-3 text-sm font-semibold text-obsidian"
              >
                <CalendarClock className="w-4 h-4" />
                Agendar horário
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
