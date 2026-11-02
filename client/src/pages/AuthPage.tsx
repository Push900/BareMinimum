import { useState, type FormEvent } from "react";
import { ArrowLeft, HeartPulse, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { startLogin } from "@/const";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const isSignup = location === "/signup";
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const configured = Boolean(window.__MANUS_CONFIG__?.oauthPortalUrl && window.__MANUS_CONFIG__?.projectId);
  const begin = () => {
    setError("");
    try { startLogin(); } catch {
      setError("Sign-in is not configured for this local installation yet. Set MANUS_OAUTH_PORTAL_URL and MANUS_PROJECT_ID in the server environment, then restart the app.");
    }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const response = await fetch(`/api/auth/local/${isSignup ? "signup" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ email, name, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to continue");
      setLocation("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reach the local account service. Is MongoDB running?");
    } finally { setBusy(false); }
  };

  return <main className="auth-page">
    <section className="auth-card" aria-labelledby="auth-title">
      <Link href="/" className="auth-back"><ArrowLeft size={15} /> Back to home</Link>
      <div className="auth-brand"><span><HeartPulse size={22} /></span><strong>BareMinimum</strong></div>
      <p className="auth-eyebrow">YOUR WELLNESS, YOUR PACE</p>
      <h1 id="auth-title">{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p className="auth-copy">{isSignup ? "Create an account with the secure sign-in provider to keep your personal health baseline private and synced." : "Sign in to access your private dashboard and sync your self-reported health baseline."}</p>
      {configured ? <>
        <button className="auth-primary" onClick={begin}>{isSignup ? "Continue to create account" : "Continue to sign in"}</button>
        <div className="auth-note"><ShieldCheck size={16} /><span>Authentication is handled by the configured sign-in provider. BareMinimum does not store your password.</span></div>
      </> : <>
        <p className="auth-config-note">External OAuth is not configured. Use a local development account below; its password is stored as a salted hash in MongoDB.</p>
        <form className="auth-form" onSubmit={submit}>
          {isSignup && <label>Your name<input autoComplete="name" value={name} onChange={e => setName(e.target.value)} required maxLength={80} /></label>}
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={320} /></label>
          <label>Password<input type="password" autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={256} /></label>
          {isSignup && <small>Use at least 8 characters. This local account is for development on this app.</small>}
          <button className="auth-primary" disabled={busy}>{busy ? "Please wait…" : isSignup ? "Create local account" : "Sign in"}</button>
        </form>
      </>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <p className="auth-switch">{isSignup ? "Already have an account?" : "New to BareMinimum?"} <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create account"}</Link></p>
      <p className="auth-disclaimer">Health entries are self-reported and are not medical advice.</p>
    </section>
  </main>;
}
