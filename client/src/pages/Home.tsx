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
import { ProfileCard } from "../app/components/ProfileCard";
import { SdgSynergy } from "../app/components/SdgSynergy";
import { getDashboardSnapshot, saveDashboardSnapshot } from "../app/lib/dashboardStore";
import type { DashboardSnapshot } from "../app/models/dashboard";

const navItems = [
  { label: "Overview", icon: HomeIcon, active: true },
  { label: "My rhythm", icon: TrendingUp },
  { label: "Impact log", icon: Target },
  { label: "Integrations", icon: LayoutGrid },
];

const quickActions = [
  { label: "Log a reset", icon: Sparkles, tone: "mint" },
  { label: "Start focus", icon: Zap, tone: "blue" },
  { label: "Add signal", icon: Plus, tone: "gold" },
];

export default function Home() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(() => getDashboardSnapshot());
  const [profileOpen, setProfileOpen] = useState(false);
  const [quietMode, setQuietMode] = useState(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(snapshot.profile.screenReaderEnabled);
  const [boundary, setBoundary] = useState(5);
  const [activeActivity, setActiveActivity] = useState(0);
  const [announcement, setAnnouncement] = useState("BareMinimum dashboard loaded");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastAction, setLastAction] = useState("Ready when you are");

  useEffect(() => {
    saveDashboardSnapshot(snapshot);
  }, [snapshot]);

  const announce = (message: string) => {
    setAnnouncement(message);
    setLastAction(message);
  };

  const updateMetricFor = (category: string) => snapshot.metrics.map((metric) => metric.key === category ? { ...metric, progress: Math.min(100, metric.progress + 4) } : metric);

  const handleComplete = (activityId: string) => {
    const completed = snapshot.activities.find((item) => item.id === activityId);
    if (!completed || completed.completed) return;
    const nextActivities = snapshot.activities.map((item) => item.id === activityId ? { ...item, completed: true } : item);
    setSnapshot({ ...snapshot, activities: nextActivities, metrics: updateMetricFor(completed.category), summary: { ...snapshot.summary, impactScore: snapshot.summary.impactScore + 2 } });
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
          {navItems.map(({ label, icon: Icon, active }) => <button key={label} className={`rail-link ${active ? "is-active" : ""}`} onClick={() => announce(`${label} selected`)}><Icon size={17} /><span>{label}</span>{active && <span className="rail-link__pulse" />}</button>)}
        </nav>
        <div className="rail-divider" />
        <div className="rail-label">Shortcuts</div>
        <button className="rail-link" onClick={() => announce("Team signals selected")}><Users size={17} /><span>Team signals</span><span className="rail-link__badge">4</span></button>
        <button className="rail-link" onClick={() => announce("Help centre selected")}><CircleHelp size={17} /><span>Help centre</span></button>
        <div className="rail-spacer" />
        <div className="rail-tip"><span className="rail-tip__icon"><CloudSun size={16} /></span><div><strong>Good morning, Alex.</strong><span>Your energy is steady.</span></div></div>
        <button className="rail-link rail-link--muted" onClick={() => announce("Settings selected")}><Settings2 size={17} /><span>Settings</span></button>
        <div className="rail-footer"><span className="system-dot" /> All systems calm <span>v1.0</span></div>
      </aside>
      {sidebarOpen && <button className="mobile-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}

      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar__left"><button className="mobile-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation" aria-expanded={sidebarOpen} aria-controls="primary-navigation"><Menu size={19} /></button><div className="breadcrumb"><span>Workspace</span><ChevronDown size={13} /><strong>Overview</strong></div></div>
          <div className="top-bar__right">
            <div className="sync-pill"><span className="sync-pill__dot" /> synced 2 min ago</div>
            <button className="top-icon-button" aria-label="Open notifications" onClick={() => announce("Notifications are clear")}><Bell size={17} /><span className="notification-dot" /></button>
            <ProfileCard profile={snapshot.profile} open={profileOpen} onToggle={() => setProfileOpen(!profileOpen)} screenReaderEnabled={screenReaderEnabled} onScreenReaderToggle={() => { setScreenReaderEnabled(!screenReaderEnabled); announce(`Screen reader support ${!screenReaderEnabled ? "on" : "off"}`); }} quietMode={quietMode} onQuietModeToggle={() => { setQuietMode(!quietMode); announce(`Quiet motion ${!quietMode ? "on" : "off"}`); }} />
          </div>
        </header>

        <div className="content-wrap">
          <div className="page-intro">
            <div>
              <div className="date-line"><Clock3 size={14} /> Tuesday, November 4, 2026 <span>•</span> Week 45</div>
              <h1>Keep the minimum.<br /><em>Feel the difference.</em></h1>
              <p className="page-intro__copy">A quiet view of the habits making your work, health, and world a little better.</p>
            </div>
            <div className="intro-actions"><button className="secondary-button" onClick={() => announce("Quick find is ready for your next signal")}><Command size={15} /> <span>Quick find</span><kbd>⌘ K</kbd></button><button className="primary-button" onClick={() => handleQuickAction("One good thing")}><Plus size={16} /> One good thing</button></div>
          </div>

          <div className="dashboard-grid">
            <section className="hero-card card-surface">
              <div className="hero-card__noise" aria-hidden="true" />
              <div className="hero-card__topline"><span className="live-tag"><i /> LIVE SIGNAL</span><span className="hero-card__time">08:42 <span>local time</span></span></div>
              <div className="hero-card__main">
                <div className="hero-card__copy"><p className="eyebrow eyebrow--mint">YOUR DAILY SIGNAL</p><h2>Good rhythm,<br /><span>not perfect rhythm.</span></h2><p>You've kept your energy in the green while moving the work that matters forward.</p><button className="text-button" onClick={() => announce("Your daily signal details opened")}>See your signal <ArrowUpRight size={15} /></button></div>
                <div className="impact-orbit" aria-label={`Impact score ${snapshot.summary.impactScore} out of 100`}><div className="impact-orbit__ring"><span>{snapshot.summary.impactScore}</span><small>impact<br />score</small></div><span className="orbit-dot orbit-dot--one" /><span className="orbit-dot orbit-dot--two" /></div>
              </div>
              <div className="hero-card__stats"><div><span>Streak</span><strong>{snapshot.summary.streak} <small>days</small></strong><em>+1 this week</em></div><div><span>Deep work</span><strong>{snapshot.summary.deepWork}</strong><em>{snapshot.summary.deepWorkDelta} vs avg</em></div><div><span>Carbon avoided</span><strong>{snapshot.summary.carbonSaved}</strong><em>{snapshot.summary.carbonDelta} this week</em></div></div>
              <div className="hero-card__bottom"><span><span className="mini-avatars"><i>JR</i><i>NK</i><i>+8</i></span> Your circle is in rhythm too</span><button className="icon-button icon-button--light" aria-label="Open community signals" onClick={() => announce("Community signals opened")}><ArrowUpRight size={15} /></button></div>
            </section>

            <SdgSynergy metrics={snapshot.metrics} />
            <AdaptiveSlider value={boundary} onChange={(value) => { setBoundary(value); announce(`Deep work boundary set to ${value} hours`); }} />
            <DemoStack />
            <ActivityStack activities={snapshot.activities} activeIndex={activeActivity} onIndexChange={(index) => { setActiveActivity(index); announce(`Showing activity ${index + 1} of ${snapshot.activities.length}`); }} onComplete={handleComplete} />

            <section className="quick-card card-surface" aria-labelledby="quick-title">
              <div className="card-heading-row"><div><p className="eyebrow">LOW-FRICTION ACTIONS</p><h2 id="quick-title">What feels useful now?</h2></div><MoreHorizontal size={17} className="muted-icon" /></div>
              <div className="quick-actions">{quickActions.map(({ label, icon: Icon, tone }) => <button key={label} className="quick-action" onClick={() => handleQuickAction(label)}><span className={`quick-action__icon quick-action__icon--${tone}`}><Icon size={16} /></span><span>{label}</span><ArrowUpRight size={14} /></button>)}</div>
              <div className="quick-card__note"><MessageCircle size={14} /> {lastAction}</div>
            </section>
          </div>

          <footer className="content-footer"><div className="footer-status"><span className="system-dot" /> Your data stays yours <span className="footer-divider" /> Local preview data <span className="footer-divider" /> <button onClick={() => announce("Privacy details opened")}>Privacy</button></div><div className="footer-links"><span>Made for better days</span><span className="footer-mark">✳</span></div></footer>
        </div>
      </main>
      <div className="sr-only" aria-live="polite">{announcement}</div>
    </div>
  );
}
