import { useMemo, useState } from "react";
import { ArrowRight, Heart, Leaf, Search, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DashboardSnapshot } from "../models/dashboard";
import { HealthTracker } from "./HealthTracker";

export type DashboardDialog = "team" | "help" | "settings" | "notifications" | "quick-find" | "signal" | "community" | "privacy" | "sdg" | "integrations";

interface Props {
  action: DashboardDialog | null;
  snapshot: DashboardSnapshot;
  boundary: number;
  quietMode: boolean;
  screenReaderEnabled: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (label: string, target: string) => void;
  onQuickAction: (label: string) => void;
  onQuietModeToggle: () => void;
  onScreenReaderToggle: () => void;
  onMarkRead: () => void;
}

const headings: Record<DashboardDialog, { title: string; description: string }> = {
  team: { title: "Team signals", description: "Small habits from your circle, shared without performance pressure." },
  help: { title: "Help centre", description: "A quick guide to the dashboard and its controls." },
  settings: { title: "Dashboard settings", description: "Adjust the way BareMinimum feels and communicates." },
  notifications: { title: "Notifications", description: "A quiet summary of recent activity." },
  "quick-find": { title: "Quick find", description: "Search dashboard sections and actions." },
  signal: { title: "Your daily signal", description: "A practical read on your current balance across health, work, and consumption." },
  community: { title: "Community signals", description: "Your circle is building healthier work rhythms together." },
  privacy: { title: "Your data stays yours", description: "Your dashboard snapshot is stored in your configured MongoDB database. A local preview is used when the database is unavailable." },
  sdg: { title: "SDG synergy", description: "Your daily actions connect to three UN Sustainable Development Goals." },
  integrations: { title: "Connected spaces", description: "Integration status for the sample profile." },
};

export function DashboardActionDialog({ action, snapshot, boundary, quietMode, screenReaderEnabled, onOpenChange, onNavigate, onQuickAction, onQuietModeToggle, onScreenReaderToggle, onMarkRead }: Props) {
  const [query, setQuery] = useState("");
  const options = [
    { label: "Overview", target: "overview", icon: Heart },
    { label: "My rhythm", target: "rhythm", icon: Target },
    { label: "Impact log", target: "impact-log", icon: Leaf },
  ];
  const filteredOptions = useMemo(() => options.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())), [query]);
  const close = () => onOpenChange(false);
  const goTo = (label: string, target: string) => { close(); onNavigate(label, target); };
  const title = action ? headings[action] : null;

  return (
    <Dialog open={Boolean(action)} onOpenChange={onOpenChange}>
      <DialogContent className="action-dialog">
        {title && <DialogHeader className="action-dialog__header">
          <DialogTitle>{title.title}</DialogTitle>
          <DialogDescription>{title.description}</DialogDescription>
        </DialogHeader>}
        {action === "quick-find" && <div className="action-dialog__search"><Search size={16} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sections…" aria-label="Search dashboard" /></div>}
        <div className="action-dialog__body">
          {action === "quick-find" && <div className="action-dialog__list">{filteredOptions.map(({ label, target, icon: Icon }) => <button key={target} onClick={() => goTo(label, target)}><Icon size={16} /><span>{label}</span><ArrowRight size={14} /></button>)}
            {query.trim() && "reset focus signal".includes(query.toLowerCase()) && <button onClick={() => { close(); onQuickAction(query.toLowerCase().includes("focus") ? "Start focus" : query.toLowerCase().includes("signal") ? "Add signal" : "Log a reset"); }}><Sparkles size={16} /><span>Log a quick action</span><ArrowRight size={14} /></button>}
            {!filteredOptions.length && !(query.trim() && "reset focus signal".includes(query.toLowerCase())) && <p className="action-dialog__empty">No matching sections. Try “rhythm” or “impact”.</p>}
          </div>}
          {(action === "team" || action === "community") && <>
            <div className="action-dialog__stat-row"><div><strong>12</strong><span>in your circle</span></div><div><strong>18h</strong><span>focus protected</span></div><div><strong>34</strong><span>resets logged</span></div></div>
            <div className="action-dialog__feed"><p><span className="action-dot action-dot--mint" /> Jamie took a 5 minute reset <small>8 min ago</small></p><p><span className="action-dot action-dot--blue" /> Noor protected a focus block <small>24 min ago</small></p><p><span className="action-dot action-dot--gold" /> Alex chose a paperless receipt <small>1 hr ago</small></p></div>
            <button className="action-dialog__primary" onClick={() => { close(); onQuickAction("Log a reset"); }}><Sparkles size={15} /> Add your own signal</button>
          </>}
          {action === "help" && <div className="action-dialog__list">
            <button onClick={() => goTo("My rhythm", "rhythm")}><Target size={16} /><span><strong>Set a healthy work boundary</strong><small>Move the slider to set your daily deep-work target.</small></span><ArrowRight size={14} /></button>
            <button onClick={() => goTo("Impact log", "impact-log")}><Sparkles size={16} /><span><strong>Log or complete an activity</strong><small>Use the activity stack or quick actions.</small></span><ArrowRight size={14} /></button>
            <p className="action-dialog__hint"><kbd>⌘ K</kbd> or <kbd>Ctrl K</kbd> opens Quick find. Use arrow keys to move through DemoStack widgets.</p>
          </div>}
          {action === "settings" && <div className="action-dialog__settings">
            <button aria-pressed={quietMode} onClick={onQuietModeToggle}><span><strong>Quiet motion</strong><small>Reduce movement across the dashboard</small></span><i className={quietMode ? "is-on" : ""} /></button>
            <button aria-pressed={screenReaderEnabled} onClick={onScreenReaderToggle}><span><strong>Screen reader support</strong><small>Announce dashboard updates as they happen</small></span><i className={screenReaderEnabled ? "is-on" : ""} /></button>
            <p className="action-dialog__hint">Preferences sync to your account when signed in; otherwise they stay in this browser.</p>
          </div>}
          {action === "notifications" && <div className="action-dialog__feed"><p><span className="action-dot action-dot--mint" /> Your dashboard is ready for today <small>Just now</small></p><p><span className="action-dot action-dot--blue" /> Your focus boundary is set to {boundary} hours <small>Today</small></p><p><span className="action-dot action-dot--gold" /> {snapshot.activities.filter((item) => !item.completed).length} suggested actions are waiting <small>Today</small></p><button className="action-dialog__text-button" onClick={() => { onMarkRead(); close(); }}>Mark all as read</button></div>}
          {action === "signal" && <>
            <div className="action-dialog__score"><strong>{snapshot.summary.impactScore}</strong><span>impact score · {snapshot.summary.impactDelta} this week</span></div>
            <div className="action-dialog__stat-row"><div><strong>{snapshot.summary.deepWork}</strong><span>deep work</span></div><div><strong>{snapshot.summary.streak} days</strong><span>steady streak</span></div><div><strong>{snapshot.summary.carbonSaved}</strong><span>carbon avoided</span></div></div>
            <button className="action-dialog__primary" onClick={() => goTo("My rhythm", "rhythm")}><Target size={15} /> Review your boundary</button>
          </>}
          {action === "sdg" && <><div className="action-dialog__sdgs">{snapshot.metrics.map((metric) => <div key={metric.key}><span className={`action-sdg-icon action-sdg-icon--${metric.accent}`}>{metric.key === "health" ? <Heart size={16} /> : metric.key === "work" ? <Target size={16} /> : <Leaf size={16} />}</span><span><strong>{metric.goal} · {metric.label}</strong><small>{metric.value} {metric.detail}</small></span><b>{metric.progress}%</b></div>)}</div><HealthTracker /></>}
          {action === "privacy" && <div className="action-dialog__privacy"><ShieldCheck size={20} /><p>The dashboard sends your snapshot to this app server for MongoDB storage. If storage is offline, this browser keeps a local preview copy. Provider OAuth tokens are not collected by this demo.</p></div>}
          {action === "integrations" && <div className="action-dialog__integrations"><div className="action-dialog__feed">{snapshot.profile.integrations.map((item) => <p key={item.id}><span className={`action-dot action-dot--${item.tone === "gold" ? "gold" : item.status === "connected" ? "mint" : "blue"}`} /> {item.label}<small>{item.status === "connected" ? "Sample connection" : "Not connected"}</small></p>)}</div><p className="action-dialog__hint">Live OAuth syncing requires provider application credentials and redirect URLs. This preview does not claim to connect accounts or store provider tokens.</p></div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
