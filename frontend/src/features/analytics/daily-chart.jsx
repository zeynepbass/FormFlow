import { formatNumber } from '@/lib/format';

const WIDTH = 720;
const HEIGHT = 220;
const PAD = { top: 12, right: 8, bottom: 28, left: 36 };
const GAP = 2;
const RADIUS = 4;

const dayFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
const formatDay = (date) => dayFormatter.format(new Date(`${date}T00:00:00Z`));

function niceMax(value) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude * 4 >= value);
  return step * magnitude * 4;
}

function barPath(x, y, width, height) {
  const r = Math.min(RADIUS, width / 2, height);
  const base = y + height;
  return `M${x},${base}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${base}Z`;
}

export function DailyChart({ daily }) {
  const max = niceMax(Math.max(...daily.map((point) => point.submissions), 0));
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const slot = plotWidth / daily.length;
  const barWidth = Math.max(slot - GAP, 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(max * ratio));
  const labelEvery = Math.ceil(daily.length / 6);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full"
      role="img"
      aria-labelledby="daily-chart-title"
    >
      <title id="daily-chart-title">
        {`Daily submissions from ${formatDay(daily[0].date)} to ${formatDay(daily.at(-1).date)}`}
      </title>

      {ticks.map((tick) => {
        const y = PAD.top + plotHeight - (tick / max) * plotHeight;
        return (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y}
              y2={y}
              className="stroke-border"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-strong text-[11px] tabular-nums"
            >
              {formatNumber(tick)}
            </text>
          </g>
        );
      })}

      {daily.map((point, index) => {
        const x = PAD.left + index * slot + GAP / 2;
        const height = (point.submissions / max) * plotHeight;
        const y = PAD.top + plotHeight - height;
        return (
          <g key={point.date}>
            <rect
              x={PAD.left + index * slot}
              y={PAD.top}
              width={slot}
              height={plotHeight}
              fill="transparent"
            >
              <title>{`${formatDay(point.date)}: ${formatNumber(point.submissions)} submissions`}</title>
            </rect>
            {height > 0 ? (
              <path
                d={barPath(x, y, barWidth, height)}
                className="pointer-events-none fill-primary"
              />
            ) : null}
            {index % labelEvery === 0 ? (
              <text
                x={x + barWidth / 2}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-muted-strong text-[11px]"
              >
                {formatDay(point.date)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function DailyTable({ daily }) {
  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-sm font-medium text-primary-dark">
        Show data table
      </summary>
      <div className="mt-3 max-h-80 overflow-auto rounded-md border border-border">
        <table className="w-full text-sm tabular-nums">
          <caption className="sr-only">Daily views, starts and submissions</caption>
          <thead className="sticky top-0 bg-surface text-left text-muted-strong">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                Date
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Views
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Starts
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Submissions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {daily.map((point) => (
              <tr key={point.date}>
                <th scope="row" className="px-3 py-2 text-left font-normal">
                  {formatDay(point.date)}
                </th>
                <td className="px-3 py-2 text-right">{formatNumber(point.views)}</td>
                <td className="px-3 py-2 text-right">{formatNumber(point.starts)}</td>
                <td className="px-3 py-2 text-right">{formatNumber(point.submissions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
