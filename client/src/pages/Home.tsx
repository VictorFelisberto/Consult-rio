import { Link } from "react-router-dom";

const services = [
  "Clareamento dental",
  "Limpeza e prevenção",
  "Avaliação completa",
  "Tratamentos estéticos"
];

const testimonials = [
  "Clínica excelente com ótimas profissionais!",
  "Experiência incrível no atendimento!",
  "Profissional excelente e consultório moderno!"
];

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-r from-blue-50 to-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Dentista</p>
            <h1 className="mt-3 text-3xl font-bold text-secondary md:text-4xl">
              Consultório Dra. Marília Pedrucci
            </h1>
            <p className="mt-4 text-slate-600">
              Atendimento humanizado, tecnologia moderna e cuidado integral para o seu sorriso.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                to="/agendar"
                className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Agendar consulta
              </Link>
              <a
                href="#contato"
                className="rounded-md border border-primary px-5 py-3 text-sm font-semibold text-primary"
              >
                Falar com a clínica
              </a>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <p className="text-sm font-semibold text-slate-500">Atendimento até 19:00</p>
            <p className="mt-2 text-xl font-semibold text-secondary">Avaliação 5,0</p>
            <p className="text-sm text-slate-500">(22 avaliações)</p>
            <div className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-600">
              <p>R. do Comércio, 1650 - sala 44</p>
              <p>Centro, Franca - SP, 14400-660</p>
              <p>(16) 3721-2494</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" id="sobre">
        <h2 className="text-2xl font-semibold text-secondary">Sobre</h2>
        <p className="mt-4 text-slate-600">
          A clínica é especializada em odontologia preventiva e estética, com foco em oferecer conforto,
          acolhimento e tratamentos personalizados para cada paciente.
        </p>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold text-secondary">Serviços</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <div key={service} className="rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-secondary">{service}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Atendimento personalizado com foco em saúde bucal e estética.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" id="depoimentos">
        <h2 className="text-2xl font-semibold text-secondary">Depoimentos</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial} className="rounded-xl bg-blue-50 p-5 text-sm text-slate-700">
              “{testimonial}”
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white" id="contato">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold text-secondary">Contato</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-600">Telefone</p>
              <p className="text-lg font-semibold text-secondary">(16) 3721-2494</p>
              <p className="mt-4 text-sm text-slate-600">Endereço</p>
              <p className="text-slate-700">R. do Comércio, 1650 - sala 44</p>
              <p className="text-slate-700">Centro, Franca - SP, 14400-660</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-600">Horário de atendimento</p>
              <p className="text-slate-700">Segunda a sexta: 09:00 - 19:00</p>
              <p className="text-slate-700">Sábado: 09:00 - 13:00</p>
              <p className="text-slate-700">Domingo: Fechado</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" id="localizacao">
        <h2 className="text-2xl font-semibold text-secondary">Localização</h2>
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <iframe
            title="Mapa do consultório"
            src="https://maps.google.com/maps?q=R.%20do%20Com%C3%A9rcio%2C%201650%20-%20sala%2044%20-%20Centro%2C%20Franca%20-%20SP%2C%2014400-660&output=embed"
            className="h-80 w-full"
            loading="lazy"
          ></iframe>
        </div>
      </section>
    </div>
  );
}
