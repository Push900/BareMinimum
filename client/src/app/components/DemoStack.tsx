import { useState } from "react";
import { Activity, ChevronDown, Grip, HeartPulse, MoreHorizontal, MoveUpRight, TimerReset } from "lucide-react";

const stackItems = [
  { id: "focus", title: "Deep work", value: "04:16", note: "of 05:00 goal", icon: <TimerReset size={16} />, tone: "blue" },
  { id: "posture", title: "Posture reset", value: "03", note: "breaks today", icon: <HeartPulse size={16} />, tone: "mint" },
  { id: "signal", title: "Signal quality", value: "88%", note: "aligned rhythm", icon: <Activity size={16} />, tone: "gold" },
];

export function DemoStack() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("focus");
  const activeItem = stackItems.find((item) => item.id === active) ?? stackItems[0];

  const moveTab = (index: number, key: string) => {
    let nextIndex = index;
    if (key === "ArrowRight" || key === "ArrowDown") nextIndex = (index + 1) % stackItems.length;
    if (key === "ArrowLeft" || key === "ArrowUp") nextIndex = (index - 1 + stackItems.length) % stackItems.length;
    if (key === "Home") nextIndex = 0;
    if (key === "End") nextIndex = stackItems.length - 1;
    if (nextIndex === index) return;
    const nextId = stackItems[nextIndex].id;
    setActive(nextId);
    document.getElementById(`demostack-tab-${nextId}`)?.focus();
  };

  return (
    <section className="demostack-card card-surface" aria-labelledby="demostack-title">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow eyebrow--mint">DEMOSTACK / LIVE VIEW</p>
          <h2 id="demostack-title">A calmer command centre.</h2>
        </div>
        <button className="icon-button" aria-label={collapsed ? "Expand DemoStack" : "Collapse DemoStack"} onClick={() => setCollapsed(!collapsed)}><ChevronDown size={16} className={collapsed ? "rotate-180" : ""} /></button>
      </div>
      <p className="card-description">Pin the signals that help you work like a human, not a machine.</p>
      <div className={`stack-window ${collapsed ? "stack-window--collapsed" : ""}`}>
        <div className="stack-window__bar"><span className="window-dots"><i /><i /><i /></span><span>today / signals</span><MoreHorizontal size={15} /></div>
        <div className="stack-tabs" role="tablist" aria-label="DemoStack widgets">
          {stackItems.map((item, index) => <button id={`demostack-tab-${item.id}`} key={item.id} className={active === item.id ? "is-active" : ""} onClick={() => setActive(item.id)} onKeyDown={(event) => moveTab(index, event.key)} role="tab" aria-selected={active === item.id} aria-controls="demostack-panel" tabIndex={active === item.id ? 0 : -1}>{item.title}</button>)}
        </div>
        {!collapsed && <div id="demostack-panel" className="stack-widget" role="tabpanel" aria-labelledby={`demostack-tab-${activeItem.id}`} tabIndex={0}>
          <div className={`stack-widget__icon stack-widget__icon--${activeItem.tone}`}>{activeItem.icon}</div>
          <div className="stack-widget__copy"><span>{activeItem.title}</span><strong>{activeItem.value}</strong><small>{activeItem.note}</small></div>
          <button className="widget-action" aria-label={`Open ${activeItem.title} widget`}><MoveUpRight size={14} /></button>
        </div>}
        <div className="stack-window__footer"><Grip size={14} /> drag to rearrange <span>•</span> updates every 15 min</div>
      </div>
    </section>
  );
}
