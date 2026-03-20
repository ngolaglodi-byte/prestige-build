import { redirect } from "next/navigation";
import OnboardingModal from "@/components/OnboardingModal";
import DashboardShell from "@/components/DashboardShell";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    redirect("/login");
  }
  return (
    <DashboardShell>
      <OnboardingModal />
      {children}
    </DashboardShell>
  );
}
