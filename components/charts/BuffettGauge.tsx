"use client";

import { BuffettIndex } from "@/types/stock";

interface BuffettGaugeProps {
  index: BuffettIndex;
  size?: number;
}

export function BuffettGauge({ index, size = 200 }: BuffettGaugeProps) {
  const { value } = index;

  // ゲージの角度計算 (0-200% を -135度 〜 135度 にマップ)
  const minValue = 0;
  const maxValue = 200;
  const minAngle = -135;
  const maxAngle = 135;

  const clampedValue = Math.min(Math.max(value, minValue), maxValue);
  const angle =
    minAngle + ((clampedValue - minValue) / (maxValue - minValue)) * (maxAngle - minAngle);

  // 色の決定
  const getColor = (val: number) => {
    if (val < 50) return "#22c55e";
    if (val < 75) return "#4ade80";
    if (val < 100) return "#d4af37";
    if (val < 125) return "#f59e0b";
    return "#ef4444";
  };

  const color = getColor(value);

  // SVGの中心
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;

  // 針の位置計算
  const needleLength = radius * 0.9;
  const needleAngleRad = (angle * Math.PI) / 180;
  const needleX = cx + needleLength * Math.cos(needleAngleRad - Math.PI / 2);
  const needleY = cy + needleLength * Math.sin(needleAngleRad - Math.PI / 2);

  // アーク描画のためのパス生成
  const createArc = (startAngle: number, endAngle: number, r: number) => {
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  // ゾーンの定義
  const zones = [
    { start: -135, end: -81, color: "#22c55e", label: "割安" },
    { start: -81, end: -27, color: "#4ade80", label: "やや割安" },
    { start: -27, end: 27, color: "#d4af37", label: "適正" },
    { start: 27, end: 81, color: "#f59e0b", label: "やや割高" },
    { start: 81, end: 135, color: "#ef4444", label: "割高" },
  ];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        {/* 背景アーク */}
        {zones.map((zone, i) => (
          <path
            key={i}
            d={createArc(zone.start, zone.end, radius)}
            fill="none"
            stroke={zone.color}
            strokeWidth={size * 0.08}
            strokeLinecap="round"
            opacity={0.3}
          />
        ))}

        {/* 現在値までの塗り */}
        <path
          d={createArc(-135, angle, radius)}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.08}
          strokeLinecap="round"
        />

        {/* 針 */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#ffffff"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* 中心円 */}
        <circle cx={cx} cy={cy} r={size * 0.05} fill="#d4af37" />

        {/* 目盛りラベル */}
        <text
          x={size * 0.1}
          y={cy + 10}
          fill="#6b6b6b"
          fontSize={size * 0.06}
          textAnchor="middle"
        >
          0%
        </text>
        <text
          x={cx}
          y={size * 0.12}
          fill="#6b6b6b"
          fontSize={size * 0.06}
          textAnchor="middle"
        >
          100%
        </text>
        <text
          x={size * 0.9}
          y={cy + 10}
          fill="#6b6b6b"
          fontSize={size * 0.06}
          textAnchor="middle"
        >
          200%
        </text>
      </svg>

      {/* 現在値表示 */}
      <div className="text-center -mt-4">
        <div className="text-3xl font-bold mono-number" style={{ color }}>
          {value.toFixed(1)}%
        </div>
        <div className="text-sm text-text-secondary mt-1">
          {index.statusLabel}
        </div>
      </div>
    </div>
  );
}
