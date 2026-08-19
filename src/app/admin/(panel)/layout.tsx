import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/route-helpers";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "ADMIN") redirect("/");

  return <AdminShell>{children}</AdminShell>;
}
