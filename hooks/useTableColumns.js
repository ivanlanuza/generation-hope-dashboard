"use client";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronRight } from "lucide-react";
import { formatInt, formatMoney0 } from "@/lib/formatters";
import { normalize } from "@/lib/normalize";

export function useSchoolColumns({ onMap, onOpenSheet }) {
  return useMemo(() => [
    {
      accessorKey: "schoolName",
      header: "School",
      cell: ({ getValue }) => (
        <span className="font-medium">{String(getValue() || "")}</span>
      ),
    },
    { accessorKey: "municipality", header: "Municipality" },
    { accessorKey: "province", header: "Province" },
    { accessorKey: "region", header: "Region" },
    { accessorKey: "island", header: "Island Group" },
    {
      accessorKey: "classroomsBuiltCount",
      header: "Classrooms Built",
      cell: ({ getValue }) => formatInt(getValue()),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMap?.(row.original)}
          >
            <MapPin className="h-4 w-4 mr-1" /> Map
          </Button>
          <Button size="sm" onClick={() => onOpenSheet?.(row.original)}>
            Full Info
          </Button>
        </div>
      ),
    },
  ], [onMap, onOpenSheet]);
}

export function useDonorColumns({ onOpenSheet, donationsByDonor }) {
  return useMemo(() => [
    {
      accessorKey: "name",
      header: "Donor",
      cell: ({ getValue }) => (
        <span className="font-medium">{String(getValue() || "")}</span>
      ),
    },
    { accessorKey: "donorType", header: "Donor Type" },
    {
      accessorKey: "classroomsCount",
      header: "Classrooms Donated",
      cell: ({ getValue }) => formatInt(getValue()),
    },
    {
      accessorKey: "schoolsCount",
      header: "Schools Helped",
      cell: ({ getValue }) => formatInt(getValue()),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenSheet?.({
              name: row.original.name,
              isCorporate: row.original.isCorporate,
            })}
          >
            View Info <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [onOpenSheet, donationsByDonor]);
}

export function useBuildsColumns() {
  return useMemo(() => [
    {
      accessorKey: "contractorName",
      header: "Contractor",
      cell: ({ getValue }) => (
        <span className="font-medium">{String(getValue() || "")}</span>
      ),
    },
    { accessorKey: "schoolName", header: "School" },
    { accessorKey: "buildEndYear", header: "Year Completed" },
    {
      accessorKey: "constructionCost",
      header: "Construction Cost",
      cell: ({ getValue }) => formatMoney0(getValue() || 0),
    },
    {
      accessorKey: "nicra",
      header: "NICRA",
      cell: ({ getValue }) => formatMoney0(getValue() || 0),
    },
    {
      accessorKey: "classroomsBuiltCount",
      header: "Classrooms Built",
      cell: ({ getValue }) => formatInt(getValue()),
    },
  ], []);
}
