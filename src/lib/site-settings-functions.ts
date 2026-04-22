import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("site_settings").select("*");

  if (error) throw new Error(error.message);
  return data;
});

const UpdateSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const updateSiteSetting = createServerFn({ method: "POST" })
  .handler(async ({ data: rawData, context }) => {
    const data = UpdateSettingSchema.parse(rawData);
    // Note: Admin check should be added here via middleware if available
    const { error } = await supabaseAdmin.from("site_settings").upsert({
      key: data.key,
      value: data.value,
      updated_at: new Date().toISOString(),
    });

    if (error) throw new Error(error.message);
    return { success: true };
  });
