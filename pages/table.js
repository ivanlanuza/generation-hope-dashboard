import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Helper: best-effort detection of x/y keys for charting
function pickChartKeys(rows) {
  if (!rows?.length) return { xKey: null, yKey: null };
  const sample = rows[0] || {};
  const keys = Object.keys(sample);

  // Prefer obvious x candidates
  const xCandidates = ["date", "month", "day", "year", "label", "name"];
  let xKey = keys.find((k) => xCandidates.includes(String(k).toLowerCase()));
  if (!xKey) {
    // fallback: first non-numeric-like field
    xKey = keys.find((k) => isNaN(Number(sample[k]))) || keys[0];
  }

  // Prefer obvious y candidates
  const yCandidates = ["value", "count", "total", "amount", "score", "qty"];
  let yKey = keys.find((k) => yCandidates.includes(String(k).toLowerCase()));
  if (!yKey) {
    // fallback: first numeric-like field
    yKey = keys.find((k) => Number.isFinite(Number(sample[k])));
  }

  return { xKey, yKey };
}

// Build TanStack columns dynamically from row keys
function useColumns(rows) {
  return useMemo(() => {
    const first = rows?.[0];
    if (!first) return [];
    const keys = Object.keys(first);
    /** @type {ColumnDef<any, any>[]} */
    const cols = keys.map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ getValue }) => {
        const v = getValue();
        // pretty-print numbers
        if (v === null || v === undefined) return "";
        const n = Number(v);
        if (Number.isFinite(n) && String(v).trim() !== "")
          return n.toLocaleString();
        return String(v);
      },
    }));
    return cols;
  }, [rows]);
}

export default function TablePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    fetch("/api/data")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((json) => {
        setData(json);
        const keys = Object.keys(json || {});
        // default to first non-empty sheet
        const firstNonEmpty = keys.find(
          (k) => Array.isArray(json[k]) && json[k].length
        );
        setSelectedSheet(firstNonEmpty || keys[0] || "");
      })
      .catch((e) => setError(String(e)));
  }, []);

  const sheetNames = useMemo(() => Object.keys(data || {}), [data]);
  const rows = useMemo(
    () => (data && selectedSheet ? data[selectedSheet] || [] : []),
    [data, selectedSheet]
  );
  const columns = useColumns(rows);

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { xKey, yKey } = useMemo(() => pickChartKeys(rows), [rows]);
  const chartData = useMemo(() => {
    if (!xKey || !yKey) return [];
    return rows
      .map((r) => ({
        [xKey]: r[xKey],
        [yKey]: Number(r[yKey]),
      }))
      .filter((d) => Number.isFinite(d[yKey]));
  }, [rows, xKey, yKey]);

  return (
    <div className="p-6 space-y-6">
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Data Table & Line Chart</h1>
            <p className="text-sm text-muted-foreground">
              Bound to your Google Sheet via <code>/api/data</code>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="grid gap-1">
              <Label htmlFor="sheet">Sheet</Label>
              <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                <SelectTrigger id="sheet" className="w-60">
                  <SelectValue placeholder="Choose sheet" />
                </SelectTrigger>
                <SelectContent>
                  {sheetNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Filter rows…"
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-60"
              />
            </div>
          </div>
        </div>
        {error && <div className="text-red-600 mt-3">Error: {error}</div>}
      </Card>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-3">Line Chart</h2>
        {!xKey || !yKey ? (
          <div className="text-sm text-muted-foreground">
            Unable to auto-detect chart fields. Ensure the sheet has an X column
            like <code>date</code> or <code>name</code> and a numeric Y column
            like <code>value</code> or <code>total</code>.
          </div>
        ) : (
          <div style={{ width: "100%", height: 360 }}>
            <ResponsiveContainer>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey={yKey} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="p-2">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="cursor-pointer select-none"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: " \u2191",
                        desc: " \u2193",
                      }[header.column.getIsSorted()] || null}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center text-sm text-muted-foreground py-8"
                  >
                    No rows to display.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
