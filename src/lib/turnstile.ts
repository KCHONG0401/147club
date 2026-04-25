import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const verifyTurnstile = createServerFn({ method: "POST" }).handler(
  async ({ data: token }) => {
    z.string().min(1).parse(token);

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) throw new Error("Turnstile 未配置，请联系管理员");

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token }),
      },
    );

    const result = (await res.json()) as { success: boolean };
    if (!result.success) throw new Error("人机验证失败，请重试");
    return { ok: true };
  },
);
