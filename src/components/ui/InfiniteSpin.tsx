// InfiniteSpin.tsx
import React from "react";
import { useTheme } from "next-themes";

type Props = {
  width?: number;
  height?: number;
  color?: string;
  trailColor?: string;
  strokeWidth?: number;
  speed?: number;
  segment?: number;
};

const InfiniteSpin: React.FC<Props> = ({
  width = 80,
  height = 80,
  color,
  trailColor,
  strokeWidth = 5,
  speed = 1.8,
  segment = 0.1,
}) => {
  const { theme } = useTheme();

  // Default colors depending on theme
  const activeColor = color || (theme === "dark" ? "#4F46E5" : "#4F46E5"); // blue-400 / indigo-600
  const baseColor = trailColor || (theme === "dark" ? "#1E293B" : "#EEF2FF"); // slate-800 / light indigo

  const PATH_LEN = 1000;
  const visible = Math.max(
    1,
    Math.min(PATH_LEN - 1, Math.round(PATH_LEN * segment))
  );
  const gap = PATH_LEN - visible;

  const d =
    "M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z";

  return (
    <svg
      role="img"
      aria-label="Loading"
      width={width}
      height={height}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Base faint loop */}
      <path
        d={d}
        fill="none"
        stroke={baseColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Animated segment */}
      <path
        d={d}
        fill="none"
        stroke={activeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={PATH_LEN}
        strokeDasharray={`${visible} ${gap}`}
        strokeDashoffset="0"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to={`-${PATH_LEN}`}
          dur={`${speed}s`}
          repeatCount="indefinite"
          calcMode="linear"
        />
      </path>
    </svg>
  );
};

export default InfiniteSpin;
