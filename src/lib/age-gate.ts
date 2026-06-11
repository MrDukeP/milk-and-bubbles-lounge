import { cookies } from "next/headers";

export const AGE_GATE_COOKIE = "milk-bubbles-age-verified";

export async function isAgeVerified() {
  const cookieStore = await cookies();
  return cookieStore.get(AGE_GATE_COOKIE)?.value === "true";
}
