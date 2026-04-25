import { createServerFn } from "@tanstack/react-start";
import { setHeaders } from "@tanstack/react-start/server";

export const applySecurityHeaders = createServerFn({ method: "GET" }).handler(async () => {
  setHeaders({
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  });
});
