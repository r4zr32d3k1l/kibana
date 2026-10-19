import React from 'react';
import { css } from '@emotion/react';
import { EuiText, useEuiTheme } from '@elastic/eui';

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

/** Hand-drawn SVG donut (stand-in for @elastic/charts `Partition`). */
export const DonutChart: React.FC<{ slices: DonutSlice[]; size?: number; title?: string; subtitle?: string }> = ({
  slices,
  size = 140,
  title,
  subtitle,
}) => {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const radius = size / 2;
  const stroke = size * 0.16;
  const r = radius - stroke / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title ?? 'Donut chart'}>
      <circle cx={radius} cy={radius} r={r} fill="none" stroke="#e9edf3" strokeWidth={stroke} />
      {total > 0 &&
        slices.map((slice) => {
          const length = (slice.value / total) * circumference;
          const dasharray = `${length} ${circumference - length}`;
          const el = (
            <circle
              key={slice.key}
              cx={radius}
              cy={radius}
              r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth={stroke}
              strokeDasharray={dasharray}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${radius} ${radius})`}
            >
              <title>{`${slice.label}: ${slice.value}`}</title>
            </circle>
          );
          offset += length;
          return el;
        })}
      <text x={radius} y={radius - (subtitle ? 2 : -6)} textAnchor="middle" fontSize={size * 0.19} fontWeight={700} fill="#1a1c21">
        {title ?? total}
      </text>
      {subtitle && (
        <text x={radius} y={radius + size * 0.12} textAnchor="middle" fontSize={size * 0.085} fill="#69707d">
          {subtitle}
        </text>
      )}
    </svg>
  );
};

export interface StackedSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

/** Hand-drawn stacked bar histogram (stand-in for @elastic/charts `BarSeries`). */
export const StackedBars: React.FC<{
  series: StackedSeries[];
  labels: string[];
  height?: number;
  ariaLabel?: string;
}> = ({ series, labels, height = 160, ariaLabel }) => {
  const { euiTheme } = useEuiTheme();
  const buckets = labels.length;
  const totals = labels.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
  const max = Math.max(1, ...totals);
  const width = 600;
  const padL = 28;
  const padB = 20;
  const chartH = height - padB - 8;
  const slot = (width - padL) / buckets;
  const barW = Math.max(2, slot * 0.72);
  const ticks = [0, Math.ceil(max / 2), max];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label={ariaLabel ?? 'Histogram'}>
      {ticks.map((tick) => {
        const y = 8 + chartH - (tick / max) * chartH;
        return (
          <g key={tick}>
            <line x1={padL} x2={width} y1={y} y2={y} stroke="#e9edf3" strokeWidth={1} />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#69707d">
              {tick}
            </text>
          </g>
        );
      })}
      {labels.map((label, i) => {
        let yCursor = 8 + chartH;
        const x = padL + i * slot + (slot - barW) / 2;
        return (
          <g key={label + i}>
            {series.map((s) => {
              const v = s.values[i] ?? 0;
              const h = (v / max) * chartH;
              yCursor -= h;
              return v > 0 ? (
                <rect key={s.key} x={x} y={yCursor} width={barW} height={h} fill={s.color}>
                  <title>{`${label} · ${s.label}: ${v}`}</title>
                </rect>
              ) : null;
            })}
            {i % Math.ceil(buckets / 6) === 0 && (
              <text x={x + barW / 2} y={height - 4} textAnchor="middle" fontSize={9} fill="#69707d" fontFamily={euiTheme.font.family}>
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export const ChartLegend: React.FC<{ items: Array<{ key: string; label: string; color: string; value?: number }> }> = ({ items }) => (
  <div
    css={css`
      display: flex;
      flex-wrap: wrap;
      gap: 4px 16px;
    `}
  >
    {items.map((item) => (
      <EuiText size="xs" key={item.key} css={css`display: inline-flex; align-items: center; gap: 6px;`}>
        <span css={css`display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${item.color};`} />
        <span>{item.label}</span>
        {item.value !== undefined && <strong>{item.value}</strong>}
      </EuiText>
    ))}
  </div>
);

/** Tiny sparkline used by AlertZero trend cards. */
export const Sparkline: React.FC<{ values: number[]; color: string; width?: number; height?: number }> = ({ values, color, width = 160, height = 36 }) => {
  const max = Math.max(1, ...values);
  const step = width / Math.max(1, values.length - 1);
  const points = values.map((v, i) => `${i * step},${height - (v / max) * (height - 4) - 2}`).join(' ');
  const area = `0,${height} ${points} ${(values.length - 1) * step},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Trend">
      <polygon points={area} fill={color} opacity={0.15} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};
