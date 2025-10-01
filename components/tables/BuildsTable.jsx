"use client";
import DataTable from "./DataTable";
import { useBuildsColumns } from "@/hooks/useTableColumns";

export default function BuildsTable({ data, filter, onFilter }) {
  const columns = useBuildsColumns();
  return <DataTable data={data} columns={columns} pageSize={8} filter={filter} onFilter={onFilter} />;
}
