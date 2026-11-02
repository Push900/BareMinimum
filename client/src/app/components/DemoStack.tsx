import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDown, ArrowUp, Check, ChevronDown, HeartPulse, MoreHorizontal, Pin, PinOff, TimerReset } from "lucide-react";

const stackItems = [
  { id: "focus", title: "Deep work", value: "04:16", note: "of 05:00 goal", icon: <TimerReset size={16} />, tone: "blue" },
  { id: "posture", title: "Posture reset", value: "03", note: "breaks today", icon: <HeartPulse size={16} />, tone: "mint" },
  { id: "signal", title: "Signal quality", value: "88%", note: "aligned rhythm", icon: <Activity size={16} />, tone: "gold" },
];

const ORDER_KEY = "bareminimum.widgetOrder";
const PINNED_KEY = "bareminimum.pinnedWidgets";

function readList(key: string, fallback: string[]) {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return [...new Set([...parsed.filter((id) => fallback.includes(id)), ...fallback])];
    }
  } catch { /* Use the default dashboard layout. */ }
  return fallback;
}

export function DemoStack() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("focus");
  const [order, setOrder] = useState(() => readList(ORDER_KEY, stackItems.map((item) => item.id)));
  const [pinned, setPinned] = useState(() => readList(PINNED_KEY, ["focus"]));
  const [postureBreaks, setPostureBreaks] = useState(3);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [announcement, setAnnouncement] = useState("Dashboard widgets ready");
  const orderedItems = useMemo(() => [...stackItems].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)), [order]);
  const activeItem = orderedItems.find((item) => item.id === active) ?? orderedItems[0];
  const displayValue = active === "posture" ? String(postureBreaks).padStart(2, "0") : active === "focus" && elapsed > 0
    ? `${String(4 + Math.floor((16 * 60 + elapsed) / 3600)).padStart(2, "0")}:${String(Math.floor(((16 * 60 + elapsed) % 3600) / 60)).padStart(2, "0")}`
    : activeItem.value;

  useEffect(() => {
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(order));
      localStorage.setItem(PINNED_KEY, JSON.stringify(pinned));
    } catch { /* The current session remains interactive if storage is unavailable. */ }
  }, [order, pinned]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const moveTab = (index: number, key: string) => {
    let nextIndex = index;
    if (key === "ArrowRight" || key === "ArrowDown") nextIndex = (index + 1) % orderedItems.length;
    if (key === "ArrowLeft" || key === "ArrowUp") nextIndex = (index - 1 + orderedItems.length) % orderedItems.length;
    if (key === "Home") nextIndex = 0;
    if (key === "End") nextIndex = orderedItems.length - 1;
    if (nextIndex === index) return;
    const nextId = orderedItems[nextIndex].id;
    setActive(nextId);
    document.getElementById(`demostack-tab-${nextId}`)?.focus();
  };

  const moveActive = (direction: -1 | 1) => {
    const index = order.indexOf(active);
    const nextIndex = Math.max(0, Math.min(order.length - 1, index + direction));
    if (nextIndex === index) return;
    const next = [...order];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setOrder(next);
    setAnnouncement(`${activeItem.title} moved ${direction < 0 ? "up" : "down"}`);
  };

  const togglePin = () => {
    const next = pinned.includes(active) ? pinned.filter((id) => id !== active) : [...pinned, active];
    setPinned(next);
    setAnnouncement(`${activeItem.title} ${next.includes(active) ? "pinned" : "unpinned"}`);
  };

  const runWidgetAction = () => {
    if (active === "focus") {
      setRunning((value) => !value);
      setAnnouncement(running ? "Focus timer paused" : "Focus timer started");
    } else if (active === "posture") {
      setPostureBreaks((value) => value + 1);
      setAnnouncement("Posture reset logged");
    } else {
      setAnnouncement("Signal quality is up to date");
    }
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
          {orderedItems.map((item, index) => <button id={`demostack-tab-${item.id}`} key={item.id} className={active === item.id ? "is-active" : ""} onClick={() => setActive(item.id)} onKeyDown={(event) => moveTab(index, event.key)} role="tab" aria-selected={active === item.id} aria-controls="demostack-panel" tabIndex={active === item.id ? 0 : -1}>{item.title}{pinned.includes(item.id) && <Pin size={10} aria-label="Pinned" />}</button>)}
        </div>
        {!collapsed && <div id="demostack-panel" className="stack-widget" role="tabpanel" aria-labelledby={`demostack-tab-${activeItem.id}`} tabIndex={0}>
          <div className={`stack-widget__icon stack-widget__icon--${activeItem.tone}`}>{activeItem.icon}</div>
          <div className="stack-widget__copy"><span>{activeItem.title}{active === "focus" && running ? " · running" : ""}</span><strong>{displayValue}</strong><small>{activeItem.note}</small></div>
          <button className="widget-action" aria-label={active === "focus" ? `${running ? "Pause" : "Start"} focus timer` : active === "posture" ? "Log a posture reset" : "Refresh signal quality"} onClick={runWidgetAction}>{active === "focus" && running ? <Check size={14} /> : active === "posture" ? <Check size={14} /> : <MoreHorizontal size={14} />}</button>
        </div>}
        {!collapsed && <div className="stack-window__footer stack-window__controls">
          <button className="widget-control" onClick={togglePin} aria-pressed={pinned.includes(active)}>{pinned.includes(active) ? <PinOff size={13} /> : <Pin size={13} />}{pinned.includes(active) ? "Unpin" : "Pin"}</button>
          <button className="widget-control" onClick={() => moveActive(-1)} disabled={order.indexOf(active) === 0} aria-label={`Move ${activeItem.title} up`}><ArrowUp size={13} /> Move up</button>
          <button className="widget-control" onClick={() => moveActive(1)} disabled={order.indexOf(active) === order.length - 1} aria-label={`Move ${activeItem.title} down`}><ArrowDown size={13} /> Move down</button>
          <span className="widget-control-hint">Layout saved on this device</span>
        </div>}
        <div className="sr-only" aria-live="polite">{announcement}</div>
      </div>
    </section>
  );
}
