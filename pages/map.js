"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MapNoSSR = dynamic(() => import("@/components/map/LeafletMap"), {
  ssr: false,
});

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const metrics = (data?.Builds || []).map((r) => ({
    date: r.buildId,
    value: Number(r.constructionCost),
  }));

  useEffect(() => {
    fetch("/api/data")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  // Example: assume a "Schools" sheet with columns: name, lat, lng, extra
  const points = useMemo(() => {
    const rows = data?.School || [];
    return rows
      .map((r) => ({
        name: r.schoolName || "School",
        lat: Number(r.latitude),
        lng: Number(r.longitude),
        extra: `Principal: ${r.principalName || "N/A"}`,
      }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  }, [data]);

  return (
    <div className="p-6 grid gap-6">
      <Card className="p-4">
        {error && <div className="text-red-600">Error: {error}</div>}
        {!error && (data ? "Sheets loaded ✔︎" : "Loading data…")}
      </Card>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-2">Schools Map</h2>
        <MapNoSSR points={points} />
      </Card>

      <card className="p-4">
        <h2 className="text-xl font-semibold mb-2">Sample Metric</h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={metrics}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </card>
    </div>
  );
}
