import { useState, type FormEvent } from "react";
import { ArrowLeft, HeartPulse } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const isSignup = location === "/signup";
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
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
      <p className="auth-copy">{isSignup ? "Create a BareMinimum account to keep your wellness records private and synced." : "Sign in to access your private dashboard and wellness history."}</p>
      <p className="auth-config-note">Accounts are stored in MongoDB. Passwords are stored as salted hashes.</p>
      <form className="auth-form" onSubmit={submit}>
        {isSignup && <label>Your name<input autoComplete="name" value={name} onChange={e => setName(e.target.value)} required maxLength={80} /></label>}
        <label>Email address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={320} /></label>
        <label>Password<input type="password" autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={256} /></label>
        {isSignup && <small>Use at least 8 characters.</small>}
        <button className="auth-primary" disabled={busy}>{busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}</button>
      </form>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <p className="auth-switch">{isSignup ? "Already have an account?" : "New to BareMinimum?"} <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create account"}</Link></p>
      <p className="auth-disclaimer">Health entries are self-reported and are not medical advice.</p>
    </section>
  </main>;
}
