import { Activity, ArrowUpRight, Leaf, Target } from "lucide-react";
import type { SdgMetric } from "../models/dashboard";

interface SdgSynergyProps {
  metrics: SdgMetric[];
  onDetails: () => void;
}

const metricIcon = (key: SdgMetric["key"]) => {
  if (key === "health") return <Activity size={15} />;
  if (key === "work") return <Target size={15} />;
  return <Leaf size={15} />;
};

export function SdgSynergy({ metrics, onDetails }: SdgSynergyProps) {
  return (
    <section id="impact" className="synergy-card card-surface" aria-labelledby="synergy-title">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow eyebrow--gold">YOUR SYNERGY</p>
          <h2 id="synergy-title">Small signals. Shared impact.</h2>
        </div>
        <button className="icon-button" aria-label="Open SDG impact details" onClick={onDetails}><ArrowUpRight size={16} /></button>
      </div>
      <p className="card-description">Health tracking is self-reported. Work and consumption tiles are sample data until connected to real sources.</p>
      <div className="synergy-list">
        {metrics.map((metric) => (
          <div className="synergy-row" key={metric.key}>
            <div className={`synergy-icon synergy-icon--${metric.accent}`}>{metricIcon(metric.key)}</div>
            <div className="synergy-row__copy">
              <div className="synergy-row__topline"><span>{metric.goal} · {metric.label}</span><strong>{metric.value}</strong></div>
              <div className="progress-track" aria-label={`${metric.progress}% progress for ${metric.label}`}><span className={`progress-fill progress-fill--${metric.accent}`} style={{ width: `${metric.progress}%` }} /></div>
              <span className="synergy-detail">{metric.detail}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="synergy-note"><span className="pulse-dot" /> Open details to record your health baseline and review sources</div>
    </section>
  );
}
