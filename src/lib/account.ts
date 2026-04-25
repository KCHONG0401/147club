/**
 * 账号 ID ↔ 内部邮箱 映射工具
 * 网站对外只展示账号 ID（如 admin147），认证层走虚拟邮箱 {id}@147snooker.local
 */
export const ACCOUNT_DOMAIN = "147snooker.local";

/** 账号 ID 规则：6-12 位，字母+数字组合，必须以字母开头，必须同时包含字母与数字 */
export const ACCOUNT_ID_REGEX = /^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z][a-zA-Z0-9]{5,11}$/;
export const ACCOUNT_ID_HINT = "6-12 位，字母+数字组合，字母开头";

/** 密码规则：8-72 位，必须同时包含字母、数字、标点符号 */
export const PASSWORD_REGEX =
  /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!-/:-@[-`{-~])[A-Za-z0-9!-/:-@[-`{-~]{8,72}$/;
export const PASSWORD_HINT = "8 位以上，需包含字母、数字、标点符号";

export function accountIdToEmail(accountId: string): string {
  return `${accountId.toLowerCase().trim()}@${ACCOUNT_DOMAIN}`;
}

export function emailToAccountId(email: string): string {
  return email.split("@")[0] ?? "";
}
