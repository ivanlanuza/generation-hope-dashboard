"use client";
import DataTable from "./DataTable";
import { useDonorColumns } from "@/hooks/useTableColumns";

export default function DonorTable({ data, filter, onFilter, onOpenSheet, donationsByDonor }) {
  const columns = useDonorColumns({ onOpenSheet, donationsByDonor });
  return <DataTable data={data} columns={columns} pageSize={8} filter={filter} onFilter={onFilter} />;
}
