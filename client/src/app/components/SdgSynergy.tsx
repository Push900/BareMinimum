import { Activity, ArrowUpRight, Leaf, Target } from "lucide-react";
import type { SdgMetric } from "../models/dashboard";

interface SdgSynergyProps {
  metrics: SdgMetric[];
}

const metricIcon = (key: SdgMetric["key"]) => {
  if (key === "health") return <Activity size={15} />;
  if (key === "work") return <Target size={15} />;
  return <Leaf size={15} />;
};

export function SdgSynergy({ metrics }: SdgSynergyProps) {
  return (
    <section className="synergy-card card-surface" aria-labelledby="synergy-title">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow eyebrow--gold">YOUR SYNERGY</p>
          <h2 id="synergy-title">Small signals. Shared impact.</h2>
        </div>
        <button className="icon-button" aria-label="Open SDG impact details"><ArrowUpRight size={16} /></button>
      </div>
      <p className="card-description">Today’s habits are building a healthier rhythm across three goals.</p>
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
      <div className="synergy-note"><span className="pulse-dot" /> Updating from your recent signals</div>
    </section>
  );
}
