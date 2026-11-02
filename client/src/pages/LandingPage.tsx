import { Activity, ArrowRight, HeartPulse, MoonStar, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { BrandMark } from "../app/components/BrandMark";

export default function LandingPage() {
  return <main className="landing-page">
    <header className="landing-nav"><Link href="/" aria-label="BareMinimum home"><BrandMark /></Link><nav><Link href="/login">Sign in</Link><Link className="landing-nav__cta" href="/signup">Get started <ArrowRight size={14} /></Link></nav></header>
    <section className="landing-hero">
      <div className="landing-hero__copy"><p className="landing-eyebrow"><span /> A calmer way to check in with yourself</p><h1>Small steps.<br/><em>More balanced days.</em></h1><p className="landing-lead">Track a few everyday wellness habits, see how they compare with public health guidance, and build a rhythm that works for you.</p><div className="landing-actions"><Link className="landing-button landing-button--primary" href="/signup">Create your free account <ArrowRight size={16}/></Link><Link className="landing-button landing-button--quiet" href="/dashboard">Explore the dashboard</Link></div><p className="landing-footnote"><ShieldCheck size={14}/> Your health entries are self-reported. This is a wellness tool, not medical advice.</p></div>
      <div className="landing-preview" aria-label="Example wellness summary"><div className="landing-preview__top"><span><i/> YOUR WEEKLY CHECK-IN</span><span>EXAMPLE</span></div><div className="landing-preview__main"><div className="landing-preview__icon"><HeartPulse size={20}/></div><div><small>HEALTH BASELINE</small><strong>One step at a time</strong></div></div><div className="landing-preview__rows"><div><MoonStar size={16}/><span>Sleep</span><b>Log your hours</b></div><div><Activity size={16}/><span>Movement</span><b>Track your minutes</b></div></div><p>Compare your own entries with linked CDC and WHO guidance.</p></div>
    </section>
    <section className="landing-features"><div><span>01</span><h2>Notice your habits</h2><p>Record sleep and weekly movement yourself. No wearable or account integration is claimed.</p></div><div><span>02</span><h2>Use trusted references</h2><p>See general sleep and activity guidance with direct links to CDC and WHO sources.</p></div><div><span>03</span><h2>Keep it manageable</h2><p>Use a focused baseline to support small, sustainable check-ins instead of chasing a score.</p></div></section>
    <footer className="landing-footer"><span>BAREMINIMUM · WELLNESS CHECK-INS</span><div><Link href="/login">Sign in</Link><Link href="/signup">Create account</Link><Link href="/dashboard">Dashboard preview</Link></div></footer>
  </main>;
}
