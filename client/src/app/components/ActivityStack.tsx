import { useMemo } from "react";
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, CircleCheck, Sparkles } from "lucide-react";
import type { ActivityItem } from "../models/dashboard";

interface ActivityStackProps {
  activities: ActivityItem[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  onComplete: (activityId: string) => void;
}

export function ActivityStack({ activities, activeIndex, onIndexChange, onComplete }: ActivityStackProps) {
  const active = activities[activeIndex] ?? activities[0];
  const visible = useMemo(() => [0, 1, 2].map((offset) => activities[(activeIndex + offset) % activities.length]), [activities, activeIndex]);

  return (
    <section className="activity-card card-surface" aria-labelledby="activity-title">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow eyebrow--mint">ACTIVITY STACK</p>
          <h2 id="activity-title">Proof of a good day.</h2>
        </div>
        <span className="activity-count"><CircleCheck size={13} /> {activities.filter(item => item.completed).length} done</span>
      </div>
      <div className="activity-stack">
        {visible.map((item, position) => item && (
          <article className={`activity-item activity-item--${position} activity-item--${item.accent}`} key={`${item.id}-${position}`}>
            <div className="activity-item__topline"><span className="activity-tag"><i /> {item.categoryLabel}</span><span>{item.time}</span></div>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
            <div className="activity-item__footer"><span className="impact-pill"><Sparkles size={12} /> +{item.impact} impact</span>{item.completed ? <span className="completed-label"><Check size={13} /> done</span> : <button className="complete-button" onClick={() => onComplete(item.id)}>Mark done <ArrowUpRight size={13} /></button>}</div>
          </article>
        ))}
      </div>
      <div className="activity-controls">
        <span className="activity-pagination"><strong>{activeIndex + 1}</strong> / {activities.length} · {active?.title}</span>
        <div className="activity-control-buttons">
          <button className="icon-button" aria-label="Previous activity" onClick={() => onIndexChange((activeIndex - 1 + activities.length) % activities.length)}><ChevronLeft size={16} /></button>
          <button className="icon-button" aria-label="Next activity" onClick={() => onIndexChange((activeIndex + 1) % activities.length)}><ChevronRight size={16} /></button>
        </div>
      </div>
    </section>
  );
}
