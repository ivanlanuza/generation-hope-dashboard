"use client";
import React, { memo } from "react";
import { ResponsiveContainer, Treemap, Tooltip } from "recharts";

// Fixed colors per island group (lighter, more muted shades)
const ISLAND_COLORS = {
  luzon: "#FCD34D",     // amber-300 (light yellowish)
  visayas: "#FCA5A5",   // red-300 (light reddish)
  mindanao: "#93C5FD",  // blue-300 (light blueish)
};

function getIslandColor(islandName) {
  const key = String(islandName || "unknown").trim().toLowerCase();
  if (key.includes("luzon")) return ISLAND_COLORS.luzon;
  if (key.includes("visayas")) return ISLAND_COLORS.visayas;
  if (key.includes("mindanao")) return ISLAND_COLORS.mindanao;
  // fallback color for unknown island group
  return "#9CA3AF"; // gray-400
}

function tooltipFormatter(value, name, props) {
  const region = props?.payload?.name || "";
  const island = props?.payload?._island || props?.payload?.parent?.name || "";
  const label = value === 1 ? "classroom" : "classrooms";
  return [`${value} ${label}`, `${region} — ${island}`];
}

const CustomCell = (props) => {
  const { x, y, width, height, name, depth, fill } = props;
  if (width <= 0 || height <= 0) return null;

  // Draw the rect first with a white stroke (leafs and non-leafs)
  const rect = (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      style={{ fill: fill || "#9CA3AF", stroke: "#FFFFFF" }}
    />
  );

  // Only render labels for leaf nodes with enough space
  if (depth >= 2 && width > 44 && height > 16) {
    return (
      <g>
        {rect}
        <text x={x + 8} y={y + 20} fontSize={10} stroke="#000" fontWeight={100} fontFamily="Geist, Inter, sans-serif" fill="#000">
          {name}
        </text>
      </g>
    );
  }

  return rect;
};

export function BuildsTreemap({ data }) {
  // expected `data`: [{ name: island, children: [{ name: region, value }] }]
  return (
    <div className="h-[380px] ml-12 mr-4 rounded-md">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data || []}
          dataKey="value"
          aspectRatio={4 / 3}
          isAnimationActive={false}
          stroke="#FFFFFF"
          content={<CustomCell />}
          style={{ fontFamily: "Geist, Inter, sans-serif", fontSize: 12 }}
        >
          <Tooltip formatter={tooltipFormatter} />
        </Treemap>
      </ResponsiveContainer>
      <div className="flex gap-4 justify-center mt-2 text-xs text-gray-900">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 inline-block rounded-sm" style={{ backgroundColor: ISLAND_COLORS.mindanao }}></span>
          <span>Mindanao</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 inline-block rounded-sm" style={{ backgroundColor: ISLAND_COLORS.luzon }}></span>
          <span>Luzon</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 inline-block rounded-sm" style={{ backgroundColor: ISLAND_COLORS.visayas }}></span>
          <span>Visayas</span>
        </div>
      </div>
    </div>
  );
}

export default memo(BuildsTreemap);