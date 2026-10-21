"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button, Card, Checkbox, Input } from "@ryy1109/web-components";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import { authClient } from "@/lib/auth-client";
import {
  emailSchema,
  loginSchema,
  passwordRules,
  signupSchema,
} from "@/lib/validation";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  const [fields, setFields] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    privacyAccepted: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<Record<string, string>>({});
  function change(name: string, value: string | boolean) {
    setFields((prev) => ({ ...prev, [name]: value }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const parsed = signup
      ? signupSchema.safeParse(fields)
      : loginSchema.safeParse(fields);
    if (!parsed.success) {
      setIssues(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ]),
        ),
      );
      return;
    }
    setIssues({});
    setBusy(true);
    try {
      const result = signup
        ? await authClient.signUp.email({
            ...signupSchema.parse(fields),
            callbackURL: "/dashboard",
          })
        : await authClient.signIn.email({
            ...loginSchema.parse(fields),
            callbackURL: "/dashboard",
          });
      if (result.error) {
        const status = result.error.status;
        setError(
          status === 429
            ? "Too many attempts. Wait a minute and try again."
            : signup && status === 422
              ? "We couldn't create that account. Try logging in if you already registered."
              : status === 401
                ? "The email or password is incorrect."
                : "We couldn't complete your request. Check your details and try again.",
        );
        return;
      }
      // Load the new session in a fresh document without a competing refresh.
      window.location.replace("/dashboard");
    } catch {
      setError("We couldn't connect. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-intro">
        <span className="eyebrow">A CALMER WAY TO STUDY</span>
        <h1>
          {signup
            ? "Make room for your best work."
            : "Welcome back to your flow."}
        </h1>
        <p>
          Your subjects, deadlines, and next steps. Together in one thoughtful
          space.
        </p>
        <div className="auth-points">
          <p>
            <CheckCircleOutlineRounded />
            Know what needs your attention.
          </p>
          <p>
            <CheckCircleOutlineRounded />
            Turn small steps into steady progress.
          </p>
        </div>
        <div className="auth-art" aria-hidden="true">
          <span>
            One thing
            <br />
            at a time.
          </span>
          <span className="art-check">✓</span>
        </div>
      </section>
      <Card
        className="auth-card"
        variant="outlined"
        size="large"
        content={
          <>
            <h2>{signup ? "Create your account" : "Good to see you"}</h2>
            <p className="muted">
              {signup
                ? "Start planning your next chapter."
                : "Log in to pick up where you left off."}
            </p>
            <form
              onSubmit={submit}
              noValidate
              className="form-stack"
              aria-busy={busy}
            >
              {signup && (
                <Input
                  id="full-name"
                  label="Full name"
                  autoComplete="name"
                  required
                  fullWidth
                  value={fields.name}
                  onChange={(e) => change("name", e.target.value)}
                  error={!!issues.name}
                  helperText={issues.name}
                  disabled={busy}
                />
              )}
              <Input
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                required
                fullWidth
                value={fields.email}
                onChange={(e) => change("email", e.target.value)}
                error={
                  !!issues.email ||
                  (!!fields.email &&
                    !emailSchema.safeParse(fields.email).success)
                }
                helperText={
                  issues.email ||
                  (fields.email
                    ? emailSchema.safeParse(fields.email).success
                      ? "Email format looks valid."
                      : "Enter a valid email address."
                    : undefined)
                }
                disabled={busy}
              />
              <Input
                id="password"
                label="Password"
                type="password"
                autoComplete={signup ? "new-password" : "current-password"}
                showPasswordToggle
                required
                fullWidth
                value={fields.password}
                onChange={(e) => change("password", e.target.value)}
                error={!!issues.password}
                helperText={
                  issues.password ||
                  (signup ? "Maximum 128 characters." : undefined)
                }
                disabled={busy}
              />
              {signup && (
                <>
                  <ul
                    className="password-checklist"
                    aria-label="Password requirements"
                  >
                    {passwordRules.map((rule) => (
                      <li
                        key={rule.label}
                        className={rule.test(fields.password) ? "met" : ""}
                      >
                        <span aria-hidden="true">
                          {rule.test(fields.password) ? "✓" : "○"}
                        </span>{" "}
                        {rule.label}
                        <span className="sr-only">
                          {rule.test(fields.password) ? " met" : " not met"}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Input
                    id="confirm-password"
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    showPasswordToggle
                    required
                    fullWidth
                    value={fields.confirmPassword}
                    onChange={(e) => change("confirmPassword", e.target.value)}
                    error={
                      !!issues.confirmPassword ||
                      (!!fields.confirmPassword &&
                        fields.password !== fields.confirmPassword)
                    }
                    helperText={
                      issues.confirmPassword ||
                      (fields.confirmPassword
                        ? fields.password === fields.confirmPassword
                          ? "Passwords match."
                          : "Passwords must match."
                        : undefined)
                    }
                    disabled={busy}
                  />
                  <Checkbox
                    id="privacy"
                    label="I have read the"
                    linkText="Privacy Policy"
                    linkHref="/privacy"
                    size="small"
                    required
                    checked={fields.privacyAccepted}
                    onChange={(_, checked) =>
                      change("privacyAccepted", checked)
                    }
                    error={!!issues.privacyAccepted}
                    helperText={issues.privacyAccepted}
                    disabled={busy}
                    wrapperClassName="compact-checkbox"
                  />
                </>
              )}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                label={signup ? "Create account" : "Log in"}
                variant="Primary"
                fullWidth
                states={busy ? "Loading" : "Default"}
                disabled={busy}
              />
            </form>
            <p className="auth-switch">
              {signup ? "Already have an account? " : "New to Alkali? "}
              <Link href={signup ? "/login" : "/signup"}>
                {signup ? "Log in" : "Create an account"}
              </Link>
            </p>
          </>
        }
      />
    </div>
  );
}
