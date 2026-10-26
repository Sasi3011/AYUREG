import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TONES } from "./ui";

// Horizontal bar list — single series, direct-labelled, one hue (magnitude).
export function BarList({ data, valueKey = "count", labelKey = "label", tone = "indigo", format = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey]) || 0));
  if (!data.length) return <p className="py-6 text-center text-sm text-slate-400">No data yet.</p>;
  return (
    <ul className="space-y-3.5">
      {data.map((d) => {
        const v = Number(d[valueKey]) || 0;
        return (
          <li key={d[labelKey]} title={`${d[labelKey]}: ${format(v)}`}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium capitalize text-slate-700">{d[labelKey]}</span>
              <span className="font-semibold tabular-nums text-ink">{format(v)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full transition-all duration-500 hover:opacity-80 ${TONES[tone].solid}`} style={{ width: `${(v / max) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Proportion bar for a small set of states — status colours, always paired with a text label.
export function SplitBar({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-slate-100">
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => <div key={s.label} title={`${s.label}: ${s.value}`} className={`h-full first:rounded-l-full last:rounded-r-full ${TONES[s.tone].solid}`} style={{ width: `${(s.value / total) * 100}%` }} />)}
      </div>
      <ul className="mt-5 space-y-3">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${TONES[s.tone].solid}`} />
            <span className="text-slate-600">{s.label}</span>
            <span className="ml-auto font-semibold tabular-nums text-ink">
              {s.value}
              <span className="ml-1 text-xs font-normal text-slate-400">{total ? Math.round((s.value / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lift">
      <p className="font-semibold text-ink">{label}</p>
      <p className="mt-0.5 text-slate-500">
        {payload[0].value} {unit}
      </p>
    </div>
  );
}

// Vertical column chart over time — single series.
export function ColumnChart({ data, xKey, yKey, unit = "", height = 240 }) {
  if (!data.some((d) => Number(d[yKey]) > 0)) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400" style={{ height }}>
        No {unit || "activity"} in this period.
      </div>
    );
  }
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
          <Tooltip cursor={{ fill: "#eef2ff" }} content={<ChartTooltip unit={unit} />} />
          <Bar dataKey={yKey} fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Fill the last `days` calendar days so gaps show as zero rather than disappearing.
export function fillDays(rows, days = 14, dayKey = "day", valueKey = "count") {
  const byDay = Object.fromEntries(rows.map((r) => [r[dayKey], Number(r[valueKey]) || 0]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ day: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), count: byDay[key] || 0 });
  }
  return out;
}
