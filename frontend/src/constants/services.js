export const CATEGORIES = [
  {
    id: "aulas",
    label: "Aulas",
    price: 60,
    accent: "cyan",
    description:
      "Aulas individuais e personalizadas, do básico ao avançado, com prática no seu trabalho real.",
    services: [
      { id: "aula-excel", name: "Excel" },
      { id: "aula-word", name: "Word" },
      { id: "aula-power-bi", name: "Power BI" },
      { id: "aula-power-point", name: "PowerPoint" },
    ],
  },
  {
    id: "consultorias",
    label: "Consultorias",
    price: 100,
    accent: "mint",
    description:
      "Diagnóstico completo, otimização de processos, dashboards executivos e automação de relatórios.",
    services: [
      { id: "cons-empresarial", name: "Consultoria Empresarial" },
      { id: "cons-excel", name: "Excel" },
      { id: "cons-power-bi", name: "Power BI" },
      { id: "cons-power-point", name: "PowerPoint" },
      { id: "cons-word", name: "Word" },
      { id: "cons-financeiro", name: "Financeiro" },
      { id: "cons-planejamento", name: "Planejamento Estratégico" },
    ],
  },
  {
    id: "palestras",
    label: "Palestras",
    price: 120,
    accent: "laser",
    description:
      "Palestras educativas para empresas e escolas, com foco em tecnologia e pensamento de gestão.",
    services: [
      { id: "palestra-tecnologia", name: "Tecnologia" },
      { id: "palestra-gestao", name: "Pensamento de Gestão" },
    ],
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export function serviceById(id) {
  if (!id) return null;
  for (const cat of CATEGORIES) {
    const s = cat.services.find((s) => s.id === id);
    if (s) return { ...s, category: cat };
  }
  return null;
}

export const ACCENTS = {
  cyan: { text: "text-neon", border: "hover:border-neon/50", glow: "shadow-[0_0_50px_rgba(0,229,255,0.12)]", chip: "bg-neon/10 text-neon border-neon/30" },
  mint: { text: "text-mint", border: "hover:border-mint/50", glow: "shadow-[0_0_50px_rgba(0,255,135,0.12)]", chip: "bg-mint/10 text-mint border-mint/30" },
  laser: { text: "text-laser", border: "hover:border-laser/50", glow: "shadow-[0_0_50px_rgba(0,245,212,0.12)]", chip: "bg-laser/10 text-laser border-laser/30" },
};

export function isoToBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
