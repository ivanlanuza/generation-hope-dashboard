"use client";
import DataTable from "./DataTable";
import { useSchoolColumns } from "@/hooks/useTableColumns";

export default function SchoolTable({ data, filter, onFilter, onMap, onOpenSheet }) {
  const columns = useSchoolColumns({ onMap, onOpenSheet });
  return <DataTable data={data} columns={columns} pageSize={5} filter={filter} onFilter={onFilter} />;
}
