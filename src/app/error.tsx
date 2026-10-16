"use client";
import { Button } from "@ryy1109/web-components";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="message-page">
      <h1>Something interrupted your flow.</h1>
      <p>Your page couldn't load. Please try again.</p>
      <Button label="Try again" variant="Primary" onClick={reset} />
    </main>
  );
}
