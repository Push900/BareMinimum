import { useState } from "react";
import { Activity, CalendarDays, ChartNoAxesColumn, HeartPulse, Home as HomeIcon, LayoutGrid, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { BrandMark } from "../app/components/BrandMark";
import { ProfileCard } from "../app/components/ProfileCard";
import { HealthcareWorkspace, type WorkspaceView } from "../app/components/HealthcareWorkspace";
import { useAuth } from "../_core/hooks/useAuth";
import { Link } from "wouter";

const navigation: { label: string; view: WorkspaceView; icon: typeof HomeIcon }[] = [
  { label: "Overview", view: "overview", icon: HomeIcon },
  { label: "SDG 3 · Health & Wellness", view: "sdg3", icon: HeartPulse },
  { label: "SDG 8 · Worker Well-being", view: "sdg8", icon: Activity },
  { label: "SDG 12 · Healthcare Sustainability", view: "sdg12", icon: LayoutGrid },
  { label: "Timetable", view: "timetable", icon: CalendarDays },
  { label: "Trends / Reports", view: "trends", icon: ChartNoAxesColumn },
];

export default function Home() {
  const { user, logout } = useAuth();
  const [view, setView] = useState<WorkspaceView>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const name = user?.name || user?.email || "Account";
  const initials = name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  return <div className="app-shell">
    <aside id="primary-navigation" className={`side-rail ${sidebarOpen ? "side-rail--open" : ""}`} aria-label="Primary navigation">
      <div className="side-rail__top"><BrandMark /><button className="mobile-close-button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={17} /></button></div>
      <div className="rail-label">Workspace</div><nav className="rail-nav">{navigation.map(({ label, view: target, icon: Icon }) => <button key={target} className={`rail-link ${view === target ? "is-active" : ""}`} aria-current={view === target ? "page" : undefined} onClick={() => { setView(target); setSidebarOpen(false); }}><Icon size={17} /><span>{label}</span>{view === target && <span className="rail-link__pulse" />}</button>)}</nav>
      <div className="rail-spacer" /><div className="rail-tip"><span className="rail-tip__icon"><ShieldCheck size={16} /></span><div><strong>Private measurements</strong><span>Visible to this account only.</span></div></div>
      <div className="rail-footer"><span className="system-dot" /> MongoDB account records <span>v1.0</span></div>
    </aside>
    {sidebarOpen && <button className="mobile-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}
    <main className="main-content"><header className="top-bar"><div className="top-bar__left"><button className="mobile-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={19} /></button><div className="breadcrumb"><span>BareMinimum</span><span>›</span><strong>{navigation.find(item => item.view === view)?.label}</strong></div></div><div className="top-bar__right"><div className="sync-pill" role="status"><span className="sync-pill__dot" /> MongoDB account</div>{!user && <div className="account-links"><Link href="/login">Sign in</Link><Link href="/signup">Create account</Link></div>}<ProfileCard profile={{ name, initials, integrations: [] } as any} accountEmail={user?.email ?? undefined} signedIn={Boolean(user)} onLogout={() => { void logout().then(() => { window.location.href = "/"; }); }} open={profileOpen} onToggle={() => setProfileOpen(!profileOpen)} screenReaderEnabled={false} onScreenReaderToggle={() => undefined} quietMode={false} onQuietModeToggle={() => undefined} onManageIntegrations={() => undefined} /></div></header>
      <div className="content-wrap"><div className="page-intro"><div><div className="date-line">{new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date())}</div><h1>Measure what matters.<br /><em>Keep it grounded.</em></h1><p className="page-intro__copy">Your dated inputs, transparent calculations, and monitoring history.</p></div></div>{user ? <HealthcareWorkspace key={user.openId} userId={user.openId} view={view} onNavigate={setView} /> : <section className="card-surface" style={{ padding: 28, maxWidth: 680 }}><p className="eyebrow eyebrow--mint">PRIVATE DASHBOARD</p><h2>Sign in to view or save measurements</h2><p className="page-intro__copy">Your personal records, calculations, timetable and history are available only after signing in. The public guide explains the metrics without asking for health information.</p><div className="intro-actions"><Link className="primary-button" href="/login">Sign in</Link><Link className="secondary-button" href="/signup">Create account</Link></div></section>}<footer className="content-footer"><div className="footer-status"><span className="system-dot" /> Your data stays yours <span className="footer-divider" /> Private account history</div><div className="footer-links"><span>Wellness monitoring · not medical care</span></div></footer></div>
    </main>
  </div>;
}
