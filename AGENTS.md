# AGENTS.md — instruções do projeto

- Este repo é um monorepo com /client (React) e /server (Node/Express).
- Sempre mantenha:
  - Trava anti-dupla marcação: @@unique([date, startTime]) em Appointment
  - Resend enviando para:
    - victorhugofsantos@gmail.com
    - victorhugosantosfelisberto@gmail.com
- Priorize TypeScript.
- Antes de finalizar, rode migrations/seed e verifique que `npm run dev` funciona.
