import type { ReactNode } from "react";
import { requireUser } from "@/lib/session";
import { PlannerNav, SiteHeader } from "@/components/site-header";
export const dynamic = "force-dynamic";
export default async function PlannerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  return (
    <>
      <SiteHeader user={{ name: user.name, email: user.email }} />
      <div className="workspace">
        <PlannerNav />
        <main id="main-content" className="workspace-main">
          {children}
        </main>
      </div>
    </>
  );
}
