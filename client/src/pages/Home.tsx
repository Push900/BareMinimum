import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleHelp,
  Clock3,
  CloudSun,
  Command,
  Home as HomeIcon,
  LayoutGrid,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Settings2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { ActivityStack } from "../app/components/ActivityStack";
import { AdaptiveSlider } from "../app/components/AdaptiveSlider";
import { BrandMark } from "../app/components/BrandMark";
import { DemoStack } from "../app/components/DemoStack";
import { DashboardActionDialog, type DashboardDialog } from "../app/components/DashboardActionDialog";
import { ProfileCard } from "../app/components/ProfileCard";
import { SdgSynergy } from "../app/components/SdgSynergy";
import { HealthcareWorkspace } from "../app/components/HealthcareWorkspace";
import type { DashboardSnapshot } from "../app/models/dashboard";
import { Link } from "wouter";
import { useAuth } from "../_core/hooks/useAuth";
import { dashboardSnapshot } from "../app/models/dashboard";

const navItems = [
  { label: "Overview", icon: HomeIcon, target: "overview" },
  { label: "Health & wellness", icon: TrendingUp, target: "personal-wellness" },
  { label: "Worker well-being", icon: Target, target: "worker-wellbeing" },
  { label: "Healthcare sustainability", icon: LayoutGrid, target: "healthcare-sustainability" },
  { label: "Trends / reports", icon: Target, target: "trends-reports" },
];

const quickActions = [
  { label: "Log a reset", icon: Sparkles, tone: "mint" },
  { label: "Start focus", icon: Zap, tone: "blue" },
  { label: "Add signal", icon: Plus, tone: "gold" },
];

function getWeekNumber(date: Date) {
  const day = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  return Math.ceil(((day.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function Home() {
  const { user, logout } = useAuth();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(dashboardSnapshot);
  const [storageReady, setStorageReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"connecting" | "saving" | "synced" | "local">("connecting");
  const [profileOpen, setProfileOpen] = useState(false);
  const [quietMode, setQuietMode] = useState(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(snapshot.profile.screenReaderEnabled);
  const [boundary, setBoundary] = useState(5);
  const [activeActivity, setActiveActivity] = useState(0);
  const [announcement, setAnnouncement] = useState("BareMinimum dashboard loaded");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastAction, setLastAction] = useState("Ready when you are");
  const [activeNav, setActiveNav] = useState("Overview");
  const [dialog, setDialog] = useState<DashboardDialog | null>(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [snapshotTouched, setSnapshotTouched] = useState(false);
  const accountName = user?.name || user?.email || "Account";
  const accountInitials = accountName.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    setQuietMode(snapshot.profile.quietMode ?? false);
    setScreenReaderEnabled(snapshot.profile.screenReaderEnabled);
  }, [snapshot.profile.quietMode, snapshot.profile.screenReaderEnabled]);

  const toggleQuietMode = () => {
    const next = !quietMode;
    setQuietMode(next);
    setSnapshot(current => ({ ...current, profile: { ...current.profile, quietMode: next } }));
    if (user) setSnapshotTouched(true);
    announce(`Quiet motion ${next ? "on" : "off"}`);
  };
  const toggleScreenReader = () => {
    const next = !screenReaderEnabled;
    setScreenReaderEnabled(next);
    setSnapshot(current => ({ ...current, profile: { ...current.profile, screenReaderEnabled: next } }));
    if (user) setSnapshotTouched(true);
    announce(`Screen reader support ${next ? "on" : "off"}`);
  };

  useEffect(() => {
    let active = true;
    setStorageReady(false);
    if (!user) {
      setSyncStatus("local");
      setStorageReady(true);
      return () => { active = false; };
    }
    setSnapshot({ ...dashboardSnapshot, profile: { ...dashboardSnapshot.profile, id: user.openId, name: accountName, initials: accountInitials, integrations: [] }, activities: [] });
    setSyncStatus("connecting");
    fetch("/api/dashboard", { credentials: "include" }).then(async response => {
      if (!response.ok) throw new Error("Could not load account dashboard");
      const data = await response.json() as { snapshot: DashboardSnapshot | null };
      if (!active) return;
      if (data.snapshot) setSnapshot(data.snapshot);
      setSyncStatus("synced");
      setSnapshotTouched(false);
      setStorageReady(true);
    }).catch(() => {
      if (!active) return;
      setSyncStatus("local");
      setStorageReady(true);
    });
    return () => { active = false; };
  }, [user?.openId]);

  useEffect(() => {
    if (!storageReady || !snapshotTouched || !user) return;
    setSyncStatus("saving");
    const timer = window.setTimeout(() => {
      fetch("/api/dashboard", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ snapshot }) })
        .then(response => {
          if (!response.ok) throw new Error("Dashboard sync failed");
          setSyncStatus("synced");
          setSnapshotTouched(false);
        })
        .catch(() => setSyncStatus("local"));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [snapshot, snapshotTouched, storageReady, user?.openId]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setDialog("quick-find");
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const announce = (message: string) => {
    setAnnouncement(message);
    setLastAction(message);
  };

  const navigateTo = (label: string, target: string) => {
    setActiveNav(label);
    if (target === "integrations") {
      setProfileOpen(true);
      announce("Integration settings opened");
      return;
    }
    document.getElementById(target)?.scrollIntoView({ behavior: quietMode ? "auto" : "smooth", block: "center" });
    announce(`${label} selected`);
    setSidebarOpen(false);
  };

  const updateMetricFor = (category: string) => snapshot.metrics.map((metric) => metric.key === category ? { ...metric, progress: Math.min(100, metric.progress + 4) } : metric);

  const handleComplete = (activityId: string) => {
    const completed = snapshot.activities.find((item) => item.id === activityId);
    if (!completed || completed.completed) return;
    const nextActivities = snapshot.activities.map((item) => item.id === activityId ? { ...item, completed: true } : item);
    setSnapshot({ ...snapshot, activities: nextActivities, metrics: updateMetricFor(completed.category), summary: { ...snapshot.summary, impactScore: snapshot.summary.impactScore + 2 } });
    setSnapshotTouched(true);
    announce(`${completed.title} marked done. Your impact score is now ${snapshot.summary.impactScore + 2}.`);
  };

  const handleQuickAction = (label: string) => {
    const category = label.includes("focus") ? "work" : label.includes("signal") ? "consumption" : "health";
    const categoryLabel = category === "work" ? "Goal 8 · Decent work" : category === "consumption" ? "Goal 12 · Less waste" : "Goal 3 · Well-being";
    const accent = category === "work" ? "blue" : category === "consumption" ? "gold" : "mint";
    const newActivity = {
      id: `activity-${Date.now()}`,
      title: label,
      category,
      categoryLabel,
      impact: 6,
      time: "Just now",
      detail: "Logged from your low-friction actions.",
      accent,
      completed: true,
    };
    setSnapshot({ ...snapshot, activities: [newActivity, ...snapshot.activities].slice(0, 6), metrics: updateMetricFor(category), summary: { ...snapshot.summary, impactScore: snapshot.summary.impactScore + 6 } });
    setSnapshotTouched(true);
    setActiveActivity(0);
    announce(`${label} logged. Your ${categoryLabel.toLowerCase()} signal is stronger.`);
  };

  return (
    <div className={`app-shell ${quietMode ? "quiet-mode" : ""}`}>
      <aside id="primary-navigation" className={`side-rail ${sidebarOpen ? "side-rail--open" : ""}`} aria-label="Primary navigation" onKeyDown={(event) => { if (event.key === "Escape") setSidebarOpen(false); }}>
        <div className="side-rail__top">
          <BrandMark />
          <button className="mobile-close-button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={17} /></button>
        </div>
        <div className="rail-label">Workspace</div>
        <nav className="rail-nav">
          {navItems.map(({ label, icon: Icon, target }) => <button key={label} className={`rail-link ${activeNav === label ? "is-active" : ""}`} aria-current={activeNav === label ? "page" : undefined} onClick={() => navigateTo(label, target)}><Icon size={17} /><span>{label}</span>{activeNav === label && <span className="rail-link__pulse" />}</button>)}
        </nav>
        <div className="rail-divider" />
        <div className="rail-label">Shortcuts</div>
        <button className="rail-link" onClick={() => setDialog("team")}><Users size={17} /><span>Team signals</span><span className="rail-link__badge">4</span></button>
        <button className="rail-link" onClick={() => setDialog("help")}><CircleHelp size={17} /><span>Help centre</span></button>
        <div className="rail-spacer" />
        <div className="rail-tip"><span className="rail-tip__icon"><CloudSun size={16} /></span><div><strong>{user ? `Welcome, ${accountName.split(" ")[0]}.` : "Good morning."}</strong><span>{user ? "Your account is signed in." : "Explore the sample preview."}</span></div></div>
        <button className="rail-link rail-link--muted" onClick={() => setDialog("settings")}><Settings2 size={17} /><span>Settings</span></button>
        <div className="rail-footer"><span className="system-dot" /> All systems calm <span>v1.0</span></div>
      </aside>
      {sidebarOpen && <button className="mobile-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}

      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar__left"><button className="mobile-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation" aria-expanded={sidebarOpen} aria-controls="primary-navigation"><Menu size={19} /></button><div className="breadcrumb"><span>Workspace</span><ChevronDown size={13} /><strong>Overview</strong></div></div>
          <div className="top-bar__right">
            <div className="sync-pill" role="status"><span className="sync-pill__dot" /> {syncStatus === "synced" ? "MongoDB synced" : syncStatus === "saving" ? "Saving changes" : syncStatus === "local" ? "Local preview" : "Connecting"}</div>
            {!user && <div className="account-links"><Link href="/login">Sign in</Link><Link href="/signup">Create account</Link></div>}
            <button className="top-icon-button" aria-label="Open notifications" onClick={() => setDialog("notifications")}><Bell size={17} />{hasUnreadNotifications && <span className="notification-dot" />}</button>
            <ProfileCard profile={user ? { ...snapshot.profile, name: accountName, initials: accountInitials, integrations: [] } : { ...snapshot.profile, name: "Guest preview", initials: "BM", integrations: [] }} accountEmail={user?.email ?? undefined} signedIn={Boolean(user)} onLogout={() => { void logout().then(() => { window.location.href = "/"; }).catch(() => announce("Sign out failed because the session service is unavailable.")); }} open={profileOpen} onToggle={() => setProfileOpen(!profileOpen)} screenReaderEnabled={screenReaderEnabled} onScreenReaderToggle={toggleScreenReader} quietMode={quietMode} onQuietModeToggle={toggleQuietMode} onManageIntegrations={() => setDialog("settings")} />
          </div>
        </header>

        <div className="content-wrap">
          <div className="page-intro">
            <div>
              <div className="date-line"><Clock3 size={14} /> {new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date())} <span>•</span> Week {getWeekNumber(new Date())}</div>
              <h1>Keep the minimum.<br /><em>Feel the difference.</em></h1>
              <p className="page-intro__copy">A quiet view of the habits making your work, health, and world a little better.</p>
            </div>
            <div className="intro-actions"><button className="secondary-button" onClick={() => setDialog("quick-find")}><Command size={15} /> <span>Quick find</span><kbd>⌘ K</kbd></button><button className="primary-button" onClick={() => handleQuickAction("One good thing")}><Plus size={16} /> One good thing</button></div>
          </div>

          <p className="sample-preview-note"><strong>Sample dashboard preview.</strong> Tiles below are illustrative only; they are not personal measurements or SDG scores. Your dated records and calculated indicators appear in Healthcare wellness &amp; sustainability.</p>

          <div className="dashboard-grid">
            <section id="overview" className="hero-card card-surface">
              <div className="hero-card__noise" aria-hidden="true" />
              <div className="hero-card__topline"><span className="live-tag"><i /> SAMPLE PREVIEW</span><span className="hero-card__time">DEMO <span>not live data</span></span></div>
              <div className="hero-card__main">
                <div className="hero-card__copy"><p className="eyebrow eyebrow--mint">DEMO DASHBOARD</p><h2>A clear view<br /><span>of what matters.</span></h2><p>Illustrative sample values show the layout. Add your own dated entries below to see personal status and history.</p><button className="text-button" onClick={() => navigateTo("Health & wellness", "personal-wellness")}>Add a wellness entry <ArrowUpRight size={15} /></button></div>
                <div className="impact-orbit" aria-label="Sample preview only"><div className="impact-orbit__ring"><span>—</span><small>no score<br />calculated</small></div><span className="orbit-dot orbit-dot--one" /><span className="orbit-dot orbit-dot--two" /></div>
              </div>
              <div className="hero-card__stats"><div><span>Streak · sample</span><strong>—</strong><em>Not tracked</em></div><div><span>Work hours · sample</span><strong>—</strong><em>Not connected</em></div><div><span>Waste · sample</span><strong>—</strong><em>Not connected</em></div></div>
              <div className="hero-card__bottom"><span>Private dated records are shown in the sections below.</span><button className="icon-button icon-button--light" aria-label="Open data and privacy details" onClick={() => setDialog("privacy")}><ArrowUpRight size={15} /></button></div>
            </section>

            <SdgSynergy metrics={snapshot.metrics} onDetails={() => setDialog("sdg")} />
            <AdaptiveSlider value={boundary} onChange={(value) => { setBoundary(value); announce(`Deep work boundary set to ${value} hours`); }} />
            <DemoStack />
            <ActivityStack activities={snapshot.activities} activeIndex={activeActivity} onIndexChange={(index) => { setActiveActivity(index); announce(`Showing activity ${index + 1} of ${snapshot.activities.length}`); }} onComplete={handleComplete} />

            <section className="quick-card card-surface" aria-labelledby="quick-title">
              <div className="card-heading-row"><div><p className="eyebrow">LOW-FRICTION ACTIONS</p><h2 id="quick-title">What feels useful now?</h2></div><MoreHorizontal size={17} className="muted-icon" /></div>
              <div className="quick-actions">{quickActions.map(({ label, icon: Icon, tone }) => <button key={label} className="quick-action" onClick={() => handleQuickAction(label)}><span className={`quick-action__icon quick-action__icon--${tone}`}><Icon size={16} /></span><span>{label}</span><ArrowUpRight size={14} /></button>)}</div>
              <div className="quick-card__note"><MessageCircle size={14} /> {lastAction}</div>
            </section>
          </div>

          <HealthcareWorkspace key={user?.openId ?? "anonymous"} userId={user?.openId ?? null} />

          <footer className="content-footer"><div className="footer-status"><span className="system-dot" /> Your data stays yours <span className="footer-divider" /> {syncStatus === "synced" ? "MongoDB sync" : "Local preview"} <span className="footer-divider" /> <button onClick={() => setDialog("privacy")}>Privacy</button></div><div className="footer-links"><span>Made for better days</span><span className="footer-mark">✳</span></div></footer>
        </div>
      </main>
      <div className="sr-only" aria-live="polite">{announcement}</div>
      <DashboardActionDialog action={dialog} snapshot={snapshot} boundary={boundary} quietMode={quietMode} screenReaderEnabled={screenReaderEnabled} onOpenChange={(open) => setDialog(open ? dialog : null)} onNavigate={navigateTo} onQuickAction={handleQuickAction} onQuietModeToggle={toggleQuietMode} onScreenReaderToggle={toggleScreenReader} onMarkRead={() => { setHasUnreadNotifications(false); announce("Notifications marked as read"); }} />
    </div>
  );
}
