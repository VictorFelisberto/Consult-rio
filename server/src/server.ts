import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Resend } from "resend";

dayjs.extend(customParseFormat);

const prisma = new PrismaClient();
const app = express();

const port = Number(process.env.PORT) || 3001;
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
const jwtSecret = process.env.JWT_SECRET || "change-me";

const resendApiKey = process.env.RESEND_API_KEY || "";
const emailFrom = process.env.EMAIL_FROM || "";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

const appointmentLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10
});

const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5
});

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const healthPlanOptions = ["UNIMED FRANCA", "Outras UNIMEDS", "Particular"] as const;

const appointmentSchema = z.object({
  patientName: z.string().min(2),
  patientAge: z.number().int().min(0).max(120),
  patientEmail: z.string().email(),
  healthPlan: z.enum(healthPlanOptions),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

const adminUpdateSchema = z.object({
  patientName: z.string().min(2).optional(),
  patientAge: z.number().int().min(0).max(120).optional(),
  patientEmail: z.string().email().optional(),
  healthPlan: z.enum(healthPlanOptions).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  status: z.enum(["scheduled", "rescheduled", "cancelled"]).optional()
});

function getWorkingHours(date: string) {
  const day = dayjs(date, "YYYY-MM-DD").day();
  if (day === 0) {
    return null;
  }
  if (day === 6) {
    return { start: "09:00", end: "13:00" };
  }
  return { start: "09:00", end: "19:00" };
}

function buildSlots(date: string) {
  const hours = getWorkingHours(date);
  if (!hours) {
    return [] as string[];
  }
  const slots: string[] = [];
  let cursor = dayjs(`${date} ${hours.start}`, "YYYY-MM-DD HH:mm");
  const end = dayjs(`${date} ${hours.end}`, "YYYY-MM-DD HH:mm");

  while (cursor.isBefore(end)) {
    slots.push(cursor.format("HH:mm"));
    cursor = cursor.add(30, "minute");
  }

  return slots;
}

function isSlotInPast(date: string, startTime: string) {
  const slot = dayjs(`${date} ${startTime}`, "YYYY-MM-DD HH:mm");
  return slot.isBefore(dayjs());
}

function isSlotValid(date: string, startTime: string) {
  const slots = buildSlots(date);
  return slots.includes(startTime) && !isSlotInPast(date, startTime);
}

async function sendAppointmentEmails(payload: {
  patientName: string;
  patientAge: number;
  patientEmail: string;
  healthPlan: string;
  date: string;
  startTime: string;
}) {
  if (!resend || !emailFrom) {
    console.warn("Resend not configured. Skipping email sending.");
    return;
  }

  const clinicAddress = "R. do Comércio, 1650 - sala 44 - Centro, Franca - SP, 14400-660";
  const clinicPhone = "(16) 3721-2494";

  await resend.emails.send({
    from: emailFrom,
    to: "victorhugofsantos@gmail.com",
    subject: "Consulta agendada - Consultório Dra. Marília Pedrucci",
    html: `
      <h2>Consulta confirmada</h2>
      <p>Olá, ${payload.patientName}!</p>
      <p>Sua consulta foi agendada para <strong>${payload.date}</strong> às <strong>${payload.startTime}</strong>.</p>
      <p>Endereço: ${clinicAddress}</p>
      <p>Telefone: ${clinicPhone}</p>
      <p>Chegue 10 minutos antes do horário marcado.</p>
    `
  });

  await resend.emails.send({
    from: emailFrom,
    to: "victorhugosantosfelisberto@gmail.com",
    subject: `Novo agendamento - ${payload.date} ${payload.startTime}`,
    html: `
      <h2>Novo agendamento</h2>
      <p>Nome: ${payload.patientName}</p>
      <p>Idade: ${payload.patientAge}</p>
      <p>Plano: ${payload.healthPlan}</p>
      <p>Email do paciente: ${payload.patientEmail}</p>
      <p>Data: ${payload.date}</p>
      <p>Hora: ${payload.startTime}</p>
    `
  });
}

function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token ausente." });
  }
  const token = header.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, jwtSecret) as { adminId: string; email: string };
    (req as express.Request & { admin?: { adminId: string; email: string } }).admin = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido." });
  }
}

app.get("/api/availability", async (req, res) => {
  const date = String(req.query.date || "");
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date);

  if (!isValidDate) {
    return res.status(400).json({ message: "Data inválida." });
  }

  const slots = buildSlots(date);
  if (slots.length === 0) {
    return res.json({ date, slots: [] });
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      date,
      status: { in: ["scheduled", "rescheduled"] }
    },
    select: { startTime: true }
  });

  const occupied = new Set(appointments.map((item) => item.startTime));
  const responseSlots = slots.map((slot) => {
    const inPast = isSlotInPast(date, slot);
    return {
      time: slot,
      status: occupied.has(slot) || inPast ? "occupied" : "available"
    };
  });

  return res.json({ date, slots: responseSlots });
});

app.post("/api/appointments", appointmentLimiter, async (req, res) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Dados inválidos.", errors: parsed.error.flatten() });
  }

  const { patientName, patientAge, patientEmail, healthPlan, date, startTime } = parsed.data;

  if (!isSlotValid(date, startTime)) {
    return res.status(400).json({ message: "Horário inválido ou no passado." });
  }

  const endTime = dayjs(`${date} ${startTime}`, "YYYY-MM-DD HH:mm").add(30, "minute").format("HH:mm");

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientName,
        patientAge,
        patientEmail,
        healthPlan,
        date,
        startTime,
        endTime,
        status: "scheduled"
      }
    });

    await sendAppointmentEmails({
      patientName,
      patientAge,
      patientEmail,
      healthPlan,
      date,
      startTime
    });

    return res.status(201).json(appointment);
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return res.status(409).json({ message: "Horário já ocupado." });
    }
    return res.status(500).json({ message: "Erro ao criar consulta." });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Credenciais inválidas." });
  }

  const { email, password } = parsed.data;

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    return res.status(401).json({ message: "Credenciais inválidas." });
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: "Credenciais inválidas." });
  }

  const token = jwt.sign({ adminId: admin.id, email: admin.email }, jwtSecret, { expiresIn: "2h" });

  return res.json({ token });
});

app.get("/api/admin/appointments", authenticateToken, async (req, res) => {
  const date = String(req.query.date || "");
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
  if (!isValidDate) {
    return res.status(400).json({ message: "Data inválida." });
  }

  const appointments = await prisma.appointment.findMany({
    where: { date },
    orderBy: [{ startTime: "asc" }]
  });

  return res.json({ date, appointments });
});

app.patch("/api/admin/appointments/:id", authenticateToken, async (req, res) => {
  const parsed = adminUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Dados inválidos.", errors: parsed.error.flatten() });
  }

  const updateData = parsed.data;
  if (updateData.date && updateData.startTime && !isSlotValid(updateData.date, updateData.startTime)) {
    return res.status(400).json({ message: "Horário inválido ou no passado." });
  }
  if (updateData.date && !updateData.startTime) {
    return res.status(400).json({ message: "startTime é obrigatório ao alterar a data." });
  }
  if (updateData.startTime && !updateData.date) {
    return res.status(400).json({ message: "date é obrigatório ao alterar o horário." });
  }

  const data: Record<string, unknown> = { ...updateData };
  if (updateData.date && updateData.startTime) {
    data.endTime = dayjs(`${updateData.date} ${updateData.startTime}`, "YYYY-MM-DD HH:mm")
      .add(30, "minute")
      .format("HH:mm");
  }

  try {
    const existing = await prisma.appointment.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: "Consulta não encontrada." });
    }

    const changedSlot =
      updateData.date && updateData.startTime
        ? updateData.date !== existing.date || updateData.startTime !== existing.startTime
        : false;

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        ...data,
        status: updateData.status
          ? updateData.status
          : changedSlot
          ? "rescheduled"
          : existing.status
      }
    });

    return res.json(appointment);
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return res.status(409).json({ message: "Horário já ocupado." });
    }
    return res.status(500).json({ message: "Erro ao atualizar consulta." });
  }
});

app.delete("/api/admin/appointments/:id", authenticateToken, async (req, res) => {
  try {
    await prisma.appointment.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch {
    return res.status(404).json({ message: "Consulta não encontrada." });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
