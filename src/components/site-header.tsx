"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Header, Button, Modal } from "@ryy1109/web-components";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import MenuBookRounded from "@mui/icons-material/MenuBookRounded";
import ChecklistRounded from "@mui/icons-material/ChecklistRounded";
import { authClient } from "@/lib/auth-client";

export function SiteHeader({
  user,
}: {
  user?: { name: string; email: string };
}) {
  const [profile, setProfile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error();
      // Discard the authenticated router cache when ending this session.
      window.location.replace("/login");
    } catch {
      setError("We couldn't log you out. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header
        logoSrc="/alkali-logo.png"
        logoAlt="Alkali"
        brandText=""
        variant="with-actions"
        actions={
          user ? (
            <Button
              variant="Ghost"
              withIcon="Icon-only button"
              startIcon={<PersonOutlineRounded />}
              aria-label="Open profile"
              onClick={() => setProfile(true)}
            />
          ) : (
            <div className="inline-actions">
              <Link href="/login">Log in</Link>
              <Button label="Get started" variant="Primary" href="/signup" />
            </div>
          )
        }
      />
      {user && (
        <Modal
          open={profile}
          onClose={() => {
            if (!busy) setProfile(false);
          }}
          title="Your profile"
          size="small"
          footer={
            <Button
              label="Log out"
              variant="Outline"
              startIcon={<LogoutRounded />}
              states={busy ? "Loading" : "Default"}
              onClick={logout}
            />
          }
        >
          <p className="profile-name">{user.name}</p>
          <p>{user.email}</p>
          <p className="muted">
            Sessions last up to seven days and renew with activity. Logging out
            ends this browser's session.
          </p>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
const links = [
  { href: "/dashboard", label: "Overview", icon: DashboardRounded },
  { href: "/subjects", label: "Subjects", icon: MenuBookRounded },
  { href: "/tasks", label: "Tasks", icon: ChecklistRounded },
];
export function PlannerNav() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="sidebar-heading">YOUR WORKSPACE</div>
      <nav aria-label="Study planner">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={
              pathname === href || pathname.startsWith(href + "/")
                ? "page"
                : undefined
            }
            className={
              pathname === href || pathname.startsWith(href + "/")
                ? "nav-link active"
                : "nav-link"
            }
          >
            <Icon fontSize="small" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-note">
        <span className="note-dot" />A little progress, every day.
      </div>
    </aside>
  );
}
