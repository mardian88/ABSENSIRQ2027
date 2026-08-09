import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LoginOrtuClient } from "./LoginOrtuClient";

export const dynamic = "force-dynamic";

export default async function OrtuLoginPage() {
  const c = await cookies();
  const session = c.get("ortu_session")?.value;

  if (session) {
    redirect("/portal-ortu");
  }

  return <LoginOrtuClient />;
}
