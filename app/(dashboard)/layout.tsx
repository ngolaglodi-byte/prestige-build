import { SignedIn, SignedOut, redirect } from "@clerk/nextjs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedOut>
        {redirect("/sign-in")}
      </SignedOut>

      <SignedIn>
        {children}
      </SignedIn>
    </>
  );
}
