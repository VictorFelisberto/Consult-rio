import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import { apiFetch } from "../lib/api";

const healthPlans = ["UNIMED FRANCA", "Outras UNIMEDS", "Particular"] as const;

const formSchema = z.object({
  patientName: z.string().min(2, "Informe o nome"),
  patientAge: z.coerce.number().int().min(0).max(120),
  patientEmail: z.string().email("Email inválido"),
  healthPlan: z.enum(healthPlans),
  privacy: z.literal(true, { errorMap: () => ({ message: "Obrigatório" }) })
});

type FormValues = z.infer<typeof formSchema>;

type Slot = {
  time: string;
  status: "available" | "occupied";
};

type AvailabilityResponse = {
  date: string;
  slots: Slot[];
};

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const minDate = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  useEffect(() => {
    async function loadAvailability() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch<AvailabilityResponse>(`/api/availability?date=${selectedDate}`);
        setSlots(response.slots);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadAvailability();
  }, [selectedDate]);

  const onSubmit = async (data: FormValues) => {
    setError(null);
    setMessage(null);
    if (!selectedTime) {
      setError("Selecione um horário disponível.");
      return;
    }

    try {
      const appointment = await apiFetch<{ date: string; startTime: string }>("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          date: selectedDate,
          startTime: selectedTime
        })
      });
      setMessage(
        `Consulta confirmada para ${appointment.date} às ${appointment.startTime}. Endereço: R. do Comércio, 1650 - sala 44. Telefone: (16) 3721-2494.`
      );
      reset();
      setSelectedTime(null);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 409) {
        setError("Ops! Esse horário já foi ocupado. Escolha outro.");
      } else {
        setError((err as Error).message);
      }
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold text-secondary">Agendar consulta</h1>
      <p className="mt-2 text-slate-600">
        Escolha uma data, selecione o horário e preencha seus dados para confirmar o atendimento.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="text-sm font-semibold text-slate-700">Selecione a data</label>
          <input
            type="date"
            min={minDate}
            value={selectedDate}
            onChange={(event) => {
              setSelectedDate(event.target.value);
              setSelectedTime(null);
            }}
            className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-700">Horários disponíveis</p>
            {loading && <p className="mt-2 text-sm text-slate-500">Carregando horários...</p>}
            {!loading && slots.length === 0 && (
              <p className="mt-2 text-sm text-slate-500">Não há horários para esta data.</p>
            )}
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => {
                const isSelected = selectedTime === slot.time;
                const isDisabled = slot.status === "occupied";
                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedTime(slot.time)}
                    disabled={isDisabled}
                    className={`rounded-md border px-2 py-2 text-sm font-medium transition ${
                      isDisabled
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                        : isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-primary"
                    }`}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-secondary">Seus dados</h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Nome</label>
              <input
                {...register("patientName")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Digite seu nome"
              />
              {errors.patientName && (
                <p className="mt-1 text-xs text-red-600">{errors.patientName.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Idade</label>
              <input
                type="number"
                {...register("patientAge")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Digite sua idade"
              />
              {errors.patientAge && (
                <p className="mt-1 text-xs text-red-600">{errors.patientAge.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">E-mail</label>
              <input
                type="email"
                {...register("patientEmail")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="seu@email.com"
              />
              {errors.patientEmail && (
                <p className="mt-1 text-xs text-red-600">{errors.patientEmail.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Plano de saúde</label>
              <select
                {...register("healthPlan")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  Selecione
                </option>
                {healthPlans.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
              {errors.healthPlan && <p className="mt-1 text-xs text-red-600">{errors.healthPlan.message}</p>}
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" {...register("privacy")} className="mt-1" />
              <label className="text-sm text-slate-600">
                Concordo com a Política de Privacidade
              </label>
            </div>
            {errors.privacy && <p className="text-xs text-red-600">{errors.privacy.message}</p>}
          </div>

          {message && <p className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</p>}
          {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            className="mt-6 w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Confirmar agendamento
          </button>
        </form>
      </div>
    </div>
  );
}
