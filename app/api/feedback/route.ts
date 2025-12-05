// app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

type FeedbackType = "bug" | "feature" | "other";

const typeLabel: Record<FeedbackType, string> = {
  bug: "bug",
  feature: "nova funcionalidade",
  other: "outro",
};

export async function POST(req: NextRequest) {
  try {
    const { name, type, message } = (await req.json()) as {
      name?: string;
      type: FeedbackType;
      message: string;
    };

    if (!message || !type) {
      return NextResponse.json(
        { error: "Dados inválidos." },
        { status: 400 }
      );
    }

    // Configura o transporter (ajuste para seu SMTP)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const subject = `Feedback - ${typeLabel[type]}`;
    const body = [
      `Nome: ${name || "não informado"}`,
      `Tipo: ${typeLabel[type]}`,
      "",
      "Mensagem:",
      message,
    ].join("\n");

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: "projetoia@digitalconect.com.br",
      subject,
      text: body,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao enviar feedback:", err);
    return NextResponse.json(
      { error: "Erro ao enviar feedback." },
      { status: 500 }
    );
  }
}
