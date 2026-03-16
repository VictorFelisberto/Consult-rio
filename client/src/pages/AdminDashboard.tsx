import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { apiFetch } from "../lib/api";
import { clearToken, getToken } from "../lib/auth";
import { useNavigate } from "react-router-dom";

const healthPlans = ["UNIMED FRANCA", "Outras UNIMEDS", "Particular"] as const;

type Appointment = {
  id: string;
  patientName: string;
  patientAge: number;
  patientEmail: string;
  healthPlan: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
};

type AppointmentResponse = {
  date: string;
  appointments: Appointment[];
};

export default function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Partial<Appointment>>({});
  const navigate = useNavigate();

  const token = getToken();

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<AppointmentResponse>(`/api/admin/appointments?date=${selectedDate}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAppointments(response.appointments);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const startEdit = (appointment: Appointment) => {
    setEditingId(appointment.id);
    setFormState({ ...appointment });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormState({});
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setError(null);
    try {
      await apiFetch(`/api/admin/appointments/${editingId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patientName: formState.patientName,
          patientAge: formState.patientAge,
          patientEmail: formState.patientEmail,
          healthPlan: formState.healthPlan,
          date: formState.date,
          startTime: formState.startTime
        })
      });
      cancelEdit();
      await loadAppointments();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja cancelar esta consulta?")) return;
    setError(null);
    try {
      await apiFetch(`/api/admin/appointments/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      await loadAppointments();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleLogout = () => {
    clearToken();
    navigate("/admin/login");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-secondary">Painel administrativo</h1>
          <p className="text-sm text-slate-600">Gerencie as consultas agendadas.</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
        >
          Sair
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-700">Filtrar por data</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          onClick={loadAppointments}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Atualizar
        </button>
      </div>

      {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 space-y-4">
        {loading && <p className="text-sm text-slate-500">Carregando consultas...</p>}
        {!loading && appointments.length === 0 && (
          <p className="text-sm text-slate-500">Nenhuma consulta encontrada para esta data.</p>
        )}

        {appointments.map((appointment) => (
          <div key={appointment.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {editingId === appointment.id ? (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={formState.patientName || ""}
                    onChange={(event) => setFormState({ ...formState, patientName: event.target.value })}
                  />
                  <input
                    type="number"
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={formState.patientAge ?? 0}
                    onChange={(event) =>
                      setFormState({ ...formState, patientAge: Number(event.target.value) })
                    }
                  />
                  <input
                    type="email"
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={formState.patientEmail || ""}
                    onChange={(event) => setFormState({ ...formState, patientEmail: event.target.value })}
                  />
                  <select
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={formState.healthPlan || ""}
                    onChange={(event) => setFormState({ ...formState, healthPlan: event.target.value })}
                  >
                    {healthPlans.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={formState.date || ""}
                    onChange={(event) => setFormState({ ...formState, date: event.target.value })}
                  />
                  <input
                    type="time"
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={formState.startTime || ""}
                    onChange={(event) => setFormState({ ...formState, startTime: event.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-secondary">
                    {appointment.patientName} · {appointment.startTime} - {appointment.endTime}
                  </p>
                  <p className="text-sm text-slate-600">
                    {appointment.patientEmail} · {appointment.healthPlan} · {appointment.patientAge} anos
                  </p>
                  <p className="text-xs text-slate-500">Status: {appointment.status}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(appointment)}
                    className="rounded-md border border-primary px-3 py-2 text-sm font-semibold text-primary"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(appointment.id)}
                    className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
