import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="prose">
        <span className="eyebrow">YOUR INFORMATION</span>
        <h1>Privacy Policy</h1>
        <p>Last updated: 16 October 2026.</p>
        <h2>What Alkali stores</h2>
        <p>
          When you register, Alkali stores your full name, normalized email
          address, password hash, and your Privacy Policy acknowledgement and
          its timestamp. Your password is hashed using Better Auth's scrypt
          implementation; your original password is not stored.
        </p>
        <h2>Your study information</h2>
        <p>
          Alkali stores subjects, optional subject codes, task titles and
          descriptions, subject associations, due dates, priorities, statuses,
          and record timestamps. These records are associated with your account
          and used to provide your planner and dashboard.
        </p>
        <h2>Sessions and security</h2>
        <p>
          Essential HttpOnly cookies keep you signed in. Sessions last up to
          seven days and can renew with activity. Logging out revokes the
          current session. Session records may include your IP address and
          browser information. Rate-limit records help restrict repeated
          authentication requests. HTTPS deployments use Secure cookies. No
          authentication tokens are stored in localStorage.
        </p>
        <h2>Other services</h2>
        <p>
          This implementation does not send verification emails, use
          advertising, or include analytics. An email-format check does not
          verify an address or establish who owns it.
        </p>
        <h2>Deletion and retention</h2>
        <p>
          Deleting a subject preserves its tasks and removes their subject
          association. Deleting a task removes that task. There is currently no
          self-service account deletion or data-export feature. Session and
          rate-limit records are retained in the database until maintained by
          the operator; expiry prevents expired sessions from being used.
        </p>
        <h2>Contact</h2>
        <p>
          Privacy contact: [CONTACT EMAIL TO BE PROVIDED]. Operator and hosting
          details must be supplied before a public release.
        </p>
        <Link href="/">Back to Alkali</Link>
      </main>
    </>
  );
}
