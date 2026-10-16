import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="message-page">
      <span className="eyebrow">404</span>
      <h1>A little off track.</h1>
      <p>We couldn't find that page.</p>
      <Link href="/dashboard">Back to your workspace</Link>
    </main>
  );
}
