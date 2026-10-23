import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";
export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <AuthForm mode="login" />
      </main>
    </>
  );
}
