"use client";

import { DetailedStats } from "@/lib/storage";

interface StatsViewProps {
  stats: DetailedStats;
  wordsTyped: number;
  totalWords: number;
  accuracy: number;
  onClose: () => void;
}

export default function StatsView({
  stats,
  wordsTyped,
  totalWords,
  accuracy,
  onClose,
}: StatsViewProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Calculate graph dimensions
  const graphHeight = 200;
  const graphWidth = 600;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = graphWidth - padding.left - padding.right;
  const innerHeight = graphHeight - padding.top - padding.bottom;

  // Get data for the graph
  const samples = stats.wpmSamples;
  const maxWpm = Math.max(stats.peakWpm, 100);
  const maxTime = samples.length > 0 ? samples[samples.length - 1].timestamp : 60000;

  // Scale functions
  const xScale = (timestamp: number) => (timestamp / maxTime) * innerWidth;
  const yScale = (wpm: number) => innerHeight - (wpm / maxWpm) * innerHeight;

  // Generate path for WPM line
  const linePath = samples.length > 1
    ? samples
        .map((s, i) => `${i === 0 ? "M" : "L"} ${xScale(s.timestamp)} ${yScale(s.wpm)}`)
        .join(" ")
    : "";

  // Generate Y-axis ticks
  const yTicks = [0, 25, 50, 75, 100].filter((t) => t <= maxWpm);
  if (maxWpm > 100) {
    yTicks.push(Math.ceil(maxWpm / 25) * 25);
  }

  // Generate X-axis ticks (every 30 seconds or minute)
  const xTicks: number[] = [];
  const tickInterval = maxTime > 120000 ? 60000 : 30000;
  for (let t = 0; t <= maxTime; t += tickInterval) {
    xTicks.push(t);
  }

  return (
    <div className="fixed inset-0 bg-[var(--background)] z-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Typing Statistics</h2>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            ✕ Close
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-[var(--foreground)]/5">
            <div className="text-3xl font-bold">{stats.averageWpm || 0}</div>
            <div className="text-sm text-[var(--muted)]">Average WPM</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--foreground)]/5">
            <div className="text-3xl font-bold">{stats.peakWpm || 0}</div>
            <div className="text-sm text-[var(--muted)]">Peak WPM</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--foreground)]/5">
            <div className="text-3xl font-bold">{accuracy}%</div>
            <div className="text-sm text-[var(--muted)]">Accuracy</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--foreground)]/5">
            <div className="text-3xl font-bold">{wordsTyped}</div>
            <div className="text-sm text-[var(--muted)]">/ {totalWords} words</div>
          </div>
        </div>

        {/* Time Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-[var(--foreground)]/5">
            <div className="text-2xl font-bold">{formatTime(stats.totalActiveTime)}</div>
            <div className="text-sm text-[var(--muted)]">Active Time</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--foreground)]/5">
            <div className="text-2xl font-bold">{formatTime(stats.totalPauseTime)}</div>
            <div className="text-sm text-[var(--muted)]">Pause Time</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--foreground)]/5">
            <div className="text-2xl font-bold">{stats.pauses.length}</div>
            <div className="text-sm text-[var(--muted)]">Pauses</div>
          </div>
        </div>

        {/* WPM Graph */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">WPM Over Time</h3>
          <div className="p-4 rounded-xl bg-[var(--foreground)]/5 overflow-x-auto">
            {samples.length > 1 ? (
              <svg
                width={graphWidth}
                height={graphHeight}
                className="mx-auto"
                style={{ minWidth: graphWidth }}
              >
                {/* Y-axis */}
                <line
                  x1={padding.left}
                  y1={padding.top}
                  x2={padding.left}
                  y2={padding.top + innerHeight}
                  stroke="currentColor"
                  strokeOpacity={0.2}
                />
                {/* X-axis */}
                <line
                  x1={padding.left}
                  y1={padding.top + innerHeight}
                  x2={padding.left + innerWidth}
                  y2={padding.top + innerHeight}
                  stroke="currentColor"
                  strokeOpacity={0.2}
                />

                {/* Y-axis ticks and labels */}
                {yTicks.map((tick) => (
                  <g key={tick}>
                    <line
                      x1={padding.left - 5}
                      y1={padding.top + yScale(tick)}
                      x2={padding.left}
                      y2={padding.top + yScale(tick)}
                      stroke="currentColor"
                      strokeOpacity={0.3}
                    />
                    <text
                      x={padding.left - 10}
                      y={padding.top + yScale(tick) + 4}
                      textAnchor="end"
                      fontSize={12}
                      fill="currentColor"
                      fillOpacity={0.5}
                    >
                      {tick}
                    </text>
                    {/* Grid line */}
                    <line
                      x1={padding.left}
                      y1={padding.top + yScale(tick)}
                      x2={padding.left + innerWidth}
                      y2={padding.top + yScale(tick)}
                      stroke="currentColor"
                      strokeOpacity={0.05}
                    />
                  </g>
                ))}

                {/* X-axis ticks and labels */}
                {xTicks.map((tick) => (
                  <g key={tick}>
                    <line
                      x1={padding.left + xScale(tick)}
                      y1={padding.top + innerHeight}
                      x2={padding.left + xScale(tick)}
                      y2={padding.top + innerHeight + 5}
                      stroke="currentColor"
                      strokeOpacity={0.3}
                    />
                    <text
                      x={padding.left + xScale(tick)}
                      y={padding.top + innerHeight + 20}
                      textAnchor="middle"
                      fontSize={12}
                      fill="currentColor"
                      fillOpacity={0.5}
                    >
                      {Math.floor(tick / 60000)}:{((tick % 60000) / 1000).toString().padStart(2, "0")}
                    </text>
                  </g>
                ))}

                {/* Pause regions */}
                {stats.pauses.map((pause, i) => (
                  <rect
                    key={i}
                    x={padding.left + xScale(pause.startTime)}
                    y={padding.top}
                    width={xScale(pause.duration)}
                    height={innerHeight}
                    fill="currentColor"
                    fillOpacity={0.05}
                  />
                ))}

                {/* WPM line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  transform={`translate(${padding.left}, ${padding.top})`}
                />

                {/* Data points */}
                {samples.map((s, i) => (
                  <circle
                    key={i}
                    cx={padding.left + xScale(s.timestamp)}
                    cy={padding.top + yScale(s.wpm)}
                    r={3}
                    fill="var(--background)"
                    stroke="currentColor"
                    strokeWidth={2}
                  />
                ))}

                {/* Axis labels */}
                <text
                  x={padding.left + innerWidth / 2}
                  y={graphHeight - 5}
                  textAnchor="middle"
                  fontSize={12}
                  fill="currentColor"
                  fillOpacity={0.5}
                >
                  Time
                </text>
                <text
                  x={15}
                  y={padding.top + innerHeight / 2}
                  textAnchor="middle"
                  fontSize={12}
                  fill="currentColor"
                  fillOpacity={0.5}
                  transform={`rotate(-90, 15, ${padding.top + innerHeight / 2})`}
                >
                  WPM
                </text>
              </svg>
            ) : (
              <div className="text-center py-8 text-[var(--muted)]">
                Not enough data yet. Keep typing to see your WPM graph!
              </div>
            )}
          </div>
        </div>

        {/* WPM by Minute */}
        {stats.wordsPerMinuteByMinute.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Words Per Minute Breakdown</h3>
            <div className="space-y-2">
              {stats.wordsPerMinuteByMinute.map((m) => (
                <div key={m.minute} className="flex items-center gap-4">
                  <span className="text-sm text-[var(--muted)] w-20">
                    Minute {m.minute + 1}
                  </span>
                  <div className="flex-1 h-6 bg-[var(--foreground)]/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--foreground)]/30 rounded-full"
                      style={{ width: `${Math.min(100, (m.wpm / (stats.peakWpm || 100)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">{m.wpm} WPM</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pause History */}
        {stats.pauses.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-4">Pause History</h3>
            <div className="space-y-2">
              {stats.pauses.map((pause, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--foreground)]/5"
                >
                  <span className="text-sm">
                    Pause {i + 1} at {formatTime(pause.startTime)}
                  </span>
                  <span className="text-sm text-[var(--muted)]">
                    {formatTime(pause.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
