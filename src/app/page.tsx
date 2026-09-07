import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, ROLE_HOME } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = (session!.user as any).role as string;
  redirect(ROLE_HOME[role] || "/login");
}
