export const LogoMark = ({ className = "w-9 h-9" }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
    <rect width="64" height="64" rx="16" fill="#0C1017" />
    <circle cx="29" cy="33" r="15" stroke="#00E5FF" strokeWidth="3.5" />
    <path d="M40 19v25H26" stroke="#00FF87" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="40" cy="19" r="3.4" fill="#00FF87" className="animate-pulse-node" />
  </svg>
);

export const Logo = ({ size = "text-lg" }) => (
  <span className="flex items-center gap-2.5">
    <LogoMark className="w-9 h-9 shrink-0" />
    <span className={`font-display font-extrabold tracking-tight ${size}`}>
      Office do <span className="text-gradient">Léo</span>
    </span>
  </span>
);
