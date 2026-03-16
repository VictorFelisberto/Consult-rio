import { Link, NavLink, Outlet } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium ${isActive ? "text-primary" : "text-slate-600 hover:text-primary"}`;

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold text-secondary">
            Consultório Dra. Marília Pedrucci
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/agendar" className={navLinkClass}>
              Agendar
            </NavLink>
            <NavLink to="/privacidade" className={navLinkClass}>
              Privacidade
            </NavLink>
            <NavLink to="/admin/login" className={navLinkClass}>
              Admin
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm">
          <p>Consultório Dra. Marília Pedrucci · R. do Comércio, 1650 - sala 44 - Centro, Franca - SP</p>
          <p>Telefone: (16) 3721-2494 · Atendimento até 19:00</p>
        </div>
      </footer>
    </div>
  );
}
