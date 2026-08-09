import { redirect } from "next/navigation";
import { getOrtuSession } from "../actions";
import { LoginOrtuClient } from "./LoginOrtuClient";

export const dynamic = "force-dynamic";

export default async function OrtuLoginPage() {
  const profil = await getOrtuSession();

  if (profil) {
    redirect("/portal-ortu");
  }

  return <LoginOrtuClient />;
}
