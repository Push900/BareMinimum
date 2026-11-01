import { useMemo, type CSSProperties } from "react";
import { ArrowRight, Brain, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";

interface AdaptiveSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function AdaptiveSlider({ value, onChange }: AdaptiveSliderProps) {
  const feedback = useMemo(() => {
    if (value <= 4) return { label: "Gentle pace", copy: "Enough room to stay sharp without pushing past your edge.", tone: "low" };
    if (value <= 6) return { label: "Healthy stretch", copy: "A focused window with a soft landing built in.", tone: "balanced" };
    return { label: "High output", copy: "Pair this with a reset so productivity stays sustainable.", tone: "high" };
  }, [value]);

  return (
    <section className="boundary-card card-surface" aria-labelledby="boundary-title">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow eyebrow--blue">WORK / GOAL 8</p>
          <h2 id="boundary-title">Protect your best hours.</h2>
        </div>
        <span className="icon-chip icon-chip--blue"><Brain size={17} /></span>
      </div>
      <p className="card-description">Set a daily deep-work boundary that protects focus without normalising burnout.</p>
      <div className="slider-readout">
        <div><span className="slider-value">{value}h</span><span className={`slider-status slider-status--${feedback.tone}`}><CheckCircle2 size={13} /> {feedback.label}</span></div>
        <span className="slider-limit"><Clock3 size={13} /> 8h max</span>
      </div>
      <div className="range-wrap">
        <input
          aria-label="Daily deep work boundary in hours"
          aria-describedby="boundary-feedback"
          aria-valuetext={`${value} hours, ${feedback.label}`}
          type="range"
          min="2"
          max="8"
          step="1"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          style={{ "--range-progress": `${((value - 2) / 6) * 100}%` } as CSSProperties}
        />
        <div className="range-labels"><span>2h · gentle</span><span>5h · steady</span><span>8h · max</span></div>
      </div>
      <div id="boundary-feedback" className={`slider-feedback slider-feedback--${feedback.tone}`} aria-live="polite">
        <ShieldCheck size={15} />
        <span>{feedback.copy}</span>
        <ArrowRight size={14} />
      </div>
    </section>
  );
}
