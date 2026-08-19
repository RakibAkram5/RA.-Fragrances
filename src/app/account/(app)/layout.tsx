import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/route-helpers";
import { AccountShell } from "@/components/account/account-shell";

export const dynamic = "force-dynamic";

export default async function AccountAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login");

  return <AccountShell name={user.name}>{children}</AccountShell>;
}
