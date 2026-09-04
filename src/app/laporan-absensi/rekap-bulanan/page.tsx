import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RekapBulananClient } from "./RekapBulananClient";

export default async function RekapBulananPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect('/login');
  }

  return <RekapBulananClient />;
}
