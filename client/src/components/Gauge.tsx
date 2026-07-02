import { useEffect, useState } from 'react';

interface GaugeProps {
  /** Normalized position from 0 (left end of the dial) to 1 (right end). */
  value: number;
  /** Short numeric readout shown under the needle, e.g. "+0.42" or "61%". */
  readout: string;
  /** Word label for the current reading, e.g. "Center-left" or "Charged". */
  label: string;
  leftCaption: string;
  rightCaption: string;
  colorFrom: string;
  colorTo: string;
  colorMid?: string;
}

const CX = 120;
const CY = 120;
const R = 92;

function polar(t: number, radius: number) {
  const angle = Math.PI - t * Math.PI;
  return {
    x: CX + radius * Math.cos(angle),
    y: CY - radius * Math.sin(angle),
  };
}

export default function Gauge({
  value,
  readout,
  label,
  leftCaption,
  rightCaption,
  colorFrom,
  colorTo,
  colorMid,
}: GaugeProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const [animated, setAnimated] = useState(0);
  const gradientId = `gauge-grad-${leftCaption}-${rightCaption}`.replace(/\s+/g, '');

  // Sweep the needle into place shortly after mount rather than snapping to
  // its final position instantly — the dial should feel like it's settling.
  useEffect(() => {
    const id = window.setTimeout(() => setAnimated(clamped), 120);
    return () => window.clearTimeout(id);
  }, [clamped]);

  const needleAngleDeg = (animated - 0.5) * 180;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    t,
    inner: polar(t, R + 3),
    outer: polar(t, R + 13),
  }));

  return (
    <div className="gauge">
      <svg viewBox="0 0 240 150" className="gauge-svg" role="img" aria-label={`${label}, reading ${readout}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorFrom} />
            {colorMid && <stop offset="50%" stopColor={colorMid} />}
            <stop offset="100%" stopColor={colorTo} />
          </linearGradient>
        </defs>

        <path d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`} className="gauge-track-bg" />
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          stroke={`url(#${gradientId})`}
          className="gauge-track"
        />

        {ticks.map((tick) => (
          <line
            key={tick.t}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
            className="gauge-tick"
          />
        ))}

        <line
          x1={CX}
          y1={CY}
          x2={CX}
          y2={CY - R + 24}
          className="gauge-needle"
          style={{
            transform: `rotate(${needleAngleDeg}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
          }}
        />
        <circle cx={CX} cy={CY} r="7" className="gauge-pivot" />

        <text x={CX} y={CY - 38} textAnchor="middle" className="gauge-readout">
          {readout}
        </text>
        <text x={CX} y={CY - 18} textAnchor="middle" className="gauge-readout-label">
          {label.toUpperCase()}
        </text>
        <text x={CX - R + 4} y={CY + 26} textAnchor="start" className="gauge-caption">
          {leftCaption.toUpperCase()}
        </text>
        <text x={CX + R - 4} y={CY + 26} textAnchor="end" className="gauge-caption">
          {rightCaption.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}