"use client";
import React from "react";
import { ResponsiveContainer, Treemap, Tooltip } from "recharts";

const Cell = (props) => {
  const { x, y, width, height, name, depth, fill } = props;
  if (width <= 0 || height <= 0) return null;
  const rect = (
    <rect x={x} y={y} width={width} height={height} style={{ fill: fill || "#E5E7EB", stroke: "#FFFFFF" }} />
  );
  if (depth >= 1 && width > 60 && height > 18) {
    return (
      <g>
        {rect}
        <text x={x + 6} y={y + 14} fontSize={10} stroke="#000" fontWeight={100} fontFamily="Geist, Inter, sans-serif" fill="#000">
          {name}
        </text>
      </g>
    );
  }
  return rect;
};

function tooltipFormatter(value, name) {
  const label = value === 1 ? "classroom" : "classrooms";
  return [`${value} ${label}`, name];
}

export default function DonationTreemap({ data }) {
  // `data` is a flat list: [{ name, value, fill }]
  return (
    <div className="h-[380px] ml-12 mr-4 rounded-md">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data || []}
          dataKey="value"
          aspectRatio={4 / 3}
          isAnimationActive={false}
          stroke="#FFFFFF"
          style={{ fontFamily: "Geist, Inter, sans-serif", fontSize: 12 }}
          content={<Cell />}
        >
          <Tooltip formatter={tooltipFormatter} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}