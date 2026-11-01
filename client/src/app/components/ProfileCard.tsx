import { useEffect, useRef } from "react";
import {
  Accessibility,
  CalendarDays,
  Check,
  ChevronDown,
  Github,
  Link2,
  Moon,
  Radio,
  Sparkles,
  SunMedium,
  Unplug,
  Volume2,
} from "lucide-react";
import type { BareMinimumProfile } from "../models/dashboard";

interface ProfileCardProps {
  profile: BareMinimumProfile;
  open: boolean;
  onToggle: () => void;
  screenReaderEnabled: boolean;
  onScreenReaderToggle: () => void;
  quietMode: boolean;
  onQuietModeToggle: () => void;
}

const integrationIcon = (id: string) => {
  if (id === "calendar") return <CalendarDays size={14} />;
  if (id === "github") return <Github size={14} />;
  return <Radio size={14} />;
};

export function ProfileCard({
  profile,
  open,
  onToggle,
  screenReaderEnabled,
  onScreenReaderToggle,
  quietMode,
  onQuietModeToggle,
}: ProfileCardProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (open) {
      requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("#profile-details button, #profile-details [href], #profile-details input")?.focus());
    } else {
      triggerRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onToggle();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>("#profile-details button, #profile-details [href], #profile-details input, #profile-details [tabindex]:not([tabindex='-1'])");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onToggle, open]);

  return (
    <div className={`profile-wrap ${open ? "is-open" : ""}`} ref={panelRef}>
      {open && <button className="profile-backdrop" tabIndex={-1} aria-label="Close profile card" onClick={onToggle} />}
      <button
        ref={triggerRef}
        className="profile-trigger"
        aria-expanded={open}
        aria-controls="profile-details"
        onClick={onToggle}
      >
        <span className="avatar avatar--small">{profile.initials}</span>
        <span className="profile-trigger__copy">
          <strong>{profile.name}</strong>
          <span><i className="status-dot" /> {profile.tier} member</span>
        </span>
        <ChevronDown size={16} className={`profile-trigger__chevron ${open ? "rotate" : ""}`} aria-hidden="true" />
      </button>

      <div id="profile-details" className="profile-panel" hidden={!open}>
        <div className="profile-panel__header">
          <div>
            <p className="eyebrow">YOUR SIGNAL</p>
            <h2>Make space for what matters.</h2>
          </div>
          <div className="alignment-badge" aria-label={`${profile.alignmentScore}% SDG alignment`}>
            <span>{profile.alignmentScore}%</span>
            <small>aligned</small>
          </div>
        </div>
        <p className="profile-bio">{profile.bio}</p>
        <div className="profile-focus"><Sparkles size={14} /> Focus: <strong>{profile.focusArea}</strong></div>

        <div className="profile-section">
          <div className="profile-section__label"><span>Connected spaces</span><button className="link-button"><Link2 size={13} /> Manage</button></div>
          <div className="integration-list">
            {profile.integrations.map((integration) => (
              <div className="integration-row" key={integration.id}>
                <span className={`integration-icon integration-icon--${integration.tone}`}>{integrationIcon(integration.id)}</span>
                <span>{integration.label}</span>
                {integration.status === "connected" ? <Check size={14} className="success-icon" /> : <Unplug size={14} className="muted-icon" />}
              </div>
            ))}
          </div>
        </div>

        <div className="profile-section profile-controls">
          <div className="profile-section__label"><span>Preferences</span><span className="profile-section__meta">Saved locally</span></div>
          <button className="preference-row" onClick={onQuietModeToggle} aria-pressed={quietMode}>
            <span className="preference-row__icon"><Moon size={15} /></span>
            <span><strong>Quiet motion</strong><small>Reduce movement across the dashboard</small></span>
            <span className={`toggle ${quietMode ? "is-on" : ""}`} aria-hidden="true"><i /></span>
          </button>
          <button className="preference-row" onClick={onScreenReaderToggle} aria-pressed={screenReaderEnabled}>
            <span className="preference-row__icon"><Accessibility size={15} /></span>
            <span><strong>Screen reader support</strong><small>{screenReaderEnabled ? "Announcements are on" : "Announcements are off"}</small></span>
            <span className={`toggle ${screenReaderEnabled ? "is-on" : ""}`} aria-hidden="true"><i /></span>
          </button>
        </div>

        <div className="profile-panel__footer">
          <button className="ghost-icon-button" aria-label="Switch to light theme"><SunMedium size={15} /></button>
          <span>Theme adapts to your workday</span>
          <Volume2 size={14} className="profile-panel__footer-icon" />
        </div>
      </div>
    </div>
  );
}
