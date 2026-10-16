import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";
export default function SignupPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <AuthForm mode="signup" />
      </main>
    </>
  );
}
