import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Assistant } from "@/components/Assistant";
import { getCurrentUser } from "@/lib/access";
import { permsFor } from "@/lib/roles";
import { newLeadCount } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Patty · Service Physics",
  description: "Patty, the Service Physics client hub: clients, contacts, emails, meetings, documents, and engagements in one place.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  const perms = permsFor(current.role);
  const user = { name: current.name, email: current.email };
  const leadCount = newLeadCount();

  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Sidebar user={user} authed={!current.preview} leadCount={leadCount} perms={perms} />
          <div className="content">
            <Topbar user={user} role={current.role} preview={current.preview} />
            <main className="main">{children}</main>
          </div>
        </div>
        <Assistant />
      </body>
    </html>
  );
}
