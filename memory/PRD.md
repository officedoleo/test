# PRD — Office do Léo

## Problema original
Criar um site de agendamento online de palestra, aula e consultoria. Aulas de Excel, Word, Power BI e PowerPoint a R$ 60/hora. Consultorias (empresarial, Excel, Power BI, PowerPoint, Word, financeiro, planejamento estratégico) a R$ 100/hora. Palestras a R$ 120/hora para empresas e escolas, com foco em tecnologia e pensamento de gestão.

## Requisitos do usuário (coletados via ask_human)
- Finalização por WhatsApp com mensagem pronta + formulário que registra a reserva
- Visual escuro com detalhes em azul e verde, moderno
- Sem login de clientes; agendamento direto
- Nome: Office do Léo; autonomia total para liberar/bloquear horários do dia

## Arquitetura
- Frontend: React (CRA + craco), Tailwind, framer-motion, lenis, sonner, axios
- Backend: FastAPI (server.py único), MongoDB via motor, JWT httpOnly para admin, bcrypt, brute-force lockout (login_attempts)
- Email: Resend gerenciado Emergent (integrations proxy), notifica owner em nova reserva se owner_email configurado
- Fuso dos horários: America/Sao_Paulo; slots de 1h das 08:00 às 21:00 (inícios 08:00–20:00)

## Entregue (2026-10-01)
- Landing dark-tech: hero cinético com reveal mascarado linha a linha + parallax, chip de "próximo horário livre hoje" ao vivo, marquee editorial lento, bento 3 categorias com fotos tratadas, simulador de investimento, como funciona, wizard de agendamento 6 passos, footer
- Logo SVG original (O + L entrelaçados com nó verde) + favicon
- Wizard: categoria → serviço → data (14 dias) → horário (disponibilidade real) → contato → confirmação; salva no Mongo e abre WhatsApp com mensagem formatada + código ODL-XXXXXX
- Painel do Léo (/admin): login JWT, lista de agendamentos (confirmar/cancelar/excluir), grade de horários por data (bloquear/liberar com 1 clique), configurações (WhatsApp + e-mail de avisos)
- APIs: GET /api/config, GET /api/services, GET /api/availability, POST /api/bookings, /api/auth/*, /api/admin/bookings, /api/admin/slots/{block,unblock}, /api/admin/settings

## Verificado (curl + screenshots + E2E Playwright)
- Reserva E2E completa criada (ODL-A87A1B), 409 em slot duplicado, 422 inválidos, 401 sem auth, bloqueio/liberação de slot reflete na disponibilidade pública, e-mail 202 Accepted, mobile 390px e desktop 1440px sem overflow

## Backlog / Pendências
- P0: Léo informar número real de WhatsApp e e-mail (pode ser pelo próprio painel > Configurações)
- P1: páginas separadas por categoria; avaliações reais de clientes
- P2: lembrete automático por e-mail/WhatsApp antes da sessão; pacotes com desconto (requer aprovação de preço)

## Personas
- Cliente final (aluno/empresa/escola): agenda sem cadastro em ~1 minuto
- Léo (dono): gerencia agenda e reservas no painel sem depender de código
