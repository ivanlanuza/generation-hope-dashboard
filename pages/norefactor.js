"use client";
import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { School, Building2, Users, HandCoins, MapPin } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChevronRight } from "lucide-react";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";

// Donor detail slide-out (top-level, not nested)
function DonorDetailSheet({ open, onOpenChange, donor, donations }) {
  const nf = new Intl.NumberFormat("en-US");
  const type = donor?.isCorporate ? "Corporate" : "Individual";

  // Group donations by school for a concise list
  const grouped = Array.from(
    (donations || []).reduce((map, r) => {
      const key = (r.schoolName || "").toString().trim().toLowerCase();
      if (!key) return map;
      const cur = map.get(key) || {
        schoolName: r.schoolName || "—",
        municipality: r.municipality || "—",
        province: r.province || "—",
        classrooms: 0,
      };
      cur.classrooms += 1;
      map.set(key, cur);
      return map;
    }, new Map())
  ).map(([, v]) => v);

  const totalClassrooms = (donations || []).length;
  const uniqueSchools = grouped.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-4 z-[2000] overflow-auto"
      >
        <SheetHeader>
          <SheetTitle className="-ml-4 -mb-12">
            {donor?.name || "Donor Details"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6 text-sm">
          {/* Quick facts */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Donor Type</div>
              <div className="text-lg font-semibold">{type}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">
                Classrooms Donated
              </div>
              <div className="text-2xl font-semibold">
                {nf.format(totalClassrooms)}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">
                Schools Helped
              </div>
              <div className="text-2xl font-semibold">
                {nf.format(uniqueSchools)}
              </div>
            </div>
          </div>

          {/* Schools list */}
          <div>
            <div className="text-sm font-medium mb-2">
              Schools & Classrooms Donated
            </div>
            {grouped.length ? (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2">School</th>
                      <th className="text-right px-3 py-2">Classrooms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped.map((g, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{g.schoolName}</td>
                        <td className="px-3 py-2 text-right">
                          {nf.format(g.classrooms)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted-foreground">
                No donation records found for this donor.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SchoolDetailSheet({
  open,
  onOpenChange,
  school,
  buildsMap,
  impactsMap,
  classroomsMap,
  onViewMap,
}) {
  const nf = new Intl.NumberFormat("en-US");
  const currencyPH = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });

  const key = (school?.schoolName || "").toString().trim().toLowerCase();
  const builds = buildsMap.get(key) || [];
  const classrooms = classroomsMap.get(key) || [];
  const impacts = impactsMap.get(key) || [];

  const totalRooms = builds.reduce(
    (s, r) => s + Number(r.classroomsBuiltCount || 0),
    0
  );
  const totalStudents = impacts.reduce(
    (s, r) => s + Number(r.impactedStudentCount || 0),
    0
  );
  const totalCost = builds.reduce(
    (s, r) => s + Number(r.constructionCost || 0),
    0
  );
  const latestYear =
    builds.reduce((m, r) => Math.max(m, Number(r.buildEndYear || 0)), 0) || "";
  const contractors = Array.from(
    new Set(
      builds
        .map((b) => (b.contractorName || "").toString().trim())
        .filter(Boolean)
    )
  );

  // Students per year aggregation
  const studentsByYear = Array.from(
    impacts.reduce((map, r) => {
      const y = String(r.yearOfImpact ?? r.year ?? "").trim();
      if (!y) return map;
      const c = Number(r.impactedStudentCount || 0);
      map.set(y, (map.get(y) || 0) + (Number.isFinite(c) ? c : 0));
      return map;
    }, new Map())
  ).sort((a, b) => Number(a[0]) - Number(b[0]));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-4 z-[2000]">
        <SheetHeader>
          <SheetTitle className="-ml-4">
            {school?.schoolName || "School Details"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-0 space-y-8 text-sm">
          {/* Donated by */}
          <div>
            <div className="text-sm font-medium mb-2">Donated by</div>
            {(() => {
              const donors = Array.from(
                new Set(
                  (classrooms || [])
                    .map(
                      (c) =>
                        c.donatedBy ||
                        c.donorName ||
                        c.donor ||
                        c.sponsor ||
                        c.sponsorName ||
                        ""
                    )
                    .filter(Boolean)
                )
              );
              return donors.length ? (
                <div className="flex flex-wrap gap-2">
                  {donors.map((d, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs bg-blue-200"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">No donor data.</div>
              );
            })()}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">
                Students Impacted
              </div>
              <div className="text-2xl font-semibold">
                {nf.format(totalStudents)}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Built On</div>
              <div className="text-xl font-semibold">{latestYear || "—"}</div>
            </div>
          </div>

          {/* Builds table */}
          <div>
            {builds.length ? (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2">Contractor</th>
                      <th className="text-right px-3 py-2">Classrooms</th>
                      <th className="text-right px-3 py-2">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {builds.map((b, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{b.contractorName || "—"}</td>
                        <td className="px-3 py-2 text-right">
                          {nf.format(Number(b.classroomsBuiltCount || 0))}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {currencyPH.format(Number(b.constructionCost || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted-foreground">No builds recorded.</div>
            )}
          </div>

          {/* Location & contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-muted-foreground">Principal</div>
              <div>{school?.principalName || "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Mobile</div>
              <div>{school?.mobileNumber || "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Contact</div>
              <div className="break-words">{school?.contactInfo || "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Municipality</div>
              <div>{school?.municipality || "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Province</div>
              <div>{school?.province || "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Region</div>
              <div>{school?.region || "—"}</div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

const MapNoSSR = dynamic(() => import("@/components/map/LeafletMap"), {
  ssr: false,
});

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("yearly"); // 'yearly' | 'schools' | 'donors' | 'construction'

  const [schoolFilter, setSchoolFilter] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState([14.5995, 120.9842]);
  const [mapZoom, setMapZoom] = useState(6);

  // Donors panel state
  const [donorFilter, setDonorFilter] = useState("");
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isDonorSheetOpen, setIsDonorSheetOpen] = useState(false);
  // Construction data (Builds) panel state
  const [buildsFilter, setBuildsFilter] = useState("");
  // Donors and donations helpers
  const donors = Array.isArray(data?.Donor) ? data.Donor : [];
  const classroomRows = Array.isArray(data?.Classroom) ? data.Classroom : [];

  const normalize = (v) =>
    String(v || "")
      .trim()
      .toLowerCase();
  const getDonorNameFromClassroom = (c) =>
    c.donatedBy || c.donorName || c.donor || c.sponsor || c.sponsorName || "";

  // Map donor name -> list of classrooms donated (rows from Classroom)
  const donationsByDonor = useMemo(() => {
    const map = new Map();
    for (const c of classroomRows) {
      const donorName = normalize(getDonorNameFromClassroom(c));
      if (!donorName) continue;
      const list = map.get(donorName) || [];
      list.push(c);
      map.set(donorName, list);
    }
    return map;
  }, [classroomRows]);

  // Build donor rows with counts
  const donorRows = useMemo(() => {
    return donors.map((d) => {
      const key = normalize(d.donorName);
      const donatedClassrooms = donationsByDonor.get(key) || [];
      const schoolsSet = new Set(
        donatedClassrooms.map((r) => normalize(r.schoolName))
      );
      return {
        name: d.donorName,
        isCorporate: !!d.isCorporate,
        donorType: d.isCorporate ? "Corporate" : "Individual",
        classroomsCount: donatedClassrooms.length,
        schoolsCount: Array.from(schoolsSet).filter(Boolean).length,
      };
    });
  }, [donors, donationsByDonor]);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  const classrooms = Array.isArray(data?.Classroom) ? data.Classroom : [];
  const classroomCount = classrooms.length;
  const nf = new Intl.NumberFormat("en-US");

  const schools = Array.isArray(data?.School) ? data.School : [];
  const schoolsCount = schools.length;

  const studentImpactRows = Array.isArray(data?.StudentImpact)
    ? data.StudentImpact
    : [];
  const studentsImpacted = studentImpactRows.reduce(
    (sum, r) => sum + Number(r.impactedStudentCount || 0),
    0
  );

  const buildRows = Array.isArray(data?.Builds) ? data.Builds : [];
  const currencyPHP0 = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });
  // Builds table rows (Construction Data)
  const buildsRows = useMemo(() => {
    const rows = Array.isArray(data?.Builds) ? data.Builds : [];
    return rows.map((r) => ({
      contractorName: r.contractorName,
      schoolName: r.schoolName,
      buildEndYear: r.buildEndYear,
      constructionCost: Number(r.constructionCost || 0),
      nicra: Number(r.nicra || 0),
      classroomsBuiltCount: Number(r.classroomsBuiltCount || 0),
    }));
  }, [data]);
  const totalConstructionCost = buildRows.reduce(
    (sum, r) => sum + Number(r.constructionCost || 0),
    0
  );
  const pesoMillions = totalConstructionCost / 1_000_000;
  const currencyPH = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  });

  const builds = Array.isArray(data?.Builds) ? data.Builds : [];
  const yearlyImpactData = useMemo(() => {
    const byYear = new Map();
    for (const r of builds) {
      const yearRaw = r.buildEndYear ?? r.year;
      const year =
        yearRaw !== undefined && yearRaw !== null ? String(yearRaw).trim() : "";
      if (!year) continue;
      const classrooms = Number(r.classroomsBuiltCount ?? 0);
      const prev = byYear.get(year) ?? 0;
      byYear.set(year, prev + (Number.isFinite(classrooms) ? classrooms : 0));
    }
    return Array.from(byYear.entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, classrooms]) => ({ year, classrooms }));
  }, [builds]);

  const studentImpacts = Array.isArray(data?.StudentImpact)
    ? data.StudentImpact
    : [];
  const yearlyStudentsData = useMemo(() => {
    const byYear = new Map();
    for (const r of studentImpacts) {
      const yearRaw = r.yearOfImpact ?? r.year;
      const year =
        yearRaw !== undefined && yearRaw !== null ? String(yearRaw).trim() : "";
      if (!year) continue;
      const count = Number(r.impactedStudentCount ?? 0);
      const prev = byYear.get(year) ?? 0;
      byYear.set(year, prev + (Number.isFinite(count) ? count : 0));
    }
    return Array.from(byYear.entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, students]) => ({ year, students }));
  }, [studentImpacts]);

  const schoolsRows = useMemo(() => {
    const schools = Array.isArray(data?.School) ? data.School : [];
    const builds = Array.isArray(data?.Builds) ? data.Builds : [];
    const buildsBySchool = new Map();
    for (const b of builds) {
      const key = (b.schoolName || "").toString().trim().toLowerCase();
      if (!key) continue;
      const arr = buildsBySchool.get(key) || [];
      arr.push(b);
      buildsBySchool.set(key, arr);
    }
    return schools.map((s) => {
      const key = (s.schoolName || "").toString().trim().toLowerCase();
      const related = buildsBySchool.get(key) || [];
      const contractorName = related[0]?.contractorName || "";
      const classroomsBuiltCount = related.reduce(
        (sum, r) => sum + Number(r.classroomsBuiltCount || 0),
        0
      );
      return {
        ...s,
        contractorName,
        classroomsBuiltCount,
      };
    });
  }, [data]);

  const buildsBySchoolMap = useMemo(() => {
    const map = new Map();
    const arr = Array.isArray(data?.Builds) ? data.Builds : [];
    for (const b of arr) {
      const k = (b.schoolName || "").toString().trim().toLowerCase();
      if (!k) continue;
      const list = map.get(k) || [];
      list.push(b);
      map.set(k, list);
    }
    return map;
  }, [data]);

  const classroomsBySchoolMap = useMemo(() => {
    const map = new Map();
    const arr = Array.isArray(data?.Classroom) ? data.Classroom : [];
    for (const c of arr) {
      const k = (c.schoolName || "").toString().trim().toLowerCase();
      if (!k) continue;
      const list = map.get(k) || [];
      list.push(c);
      map.set(k, list);
    }
    return map;
  }, [data]);

  const impactsBySchoolMap = useMemo(() => {
    const map = new Map();
    const arr = Array.isArray(data?.StudentImpact) ? data.StudentImpact : [];
    for (const s of arr) {
      const k = (s.schoolName || "").toString().trim().toLowerCase();
      if (!k) continue;
      const list = map.get(k) || [];
      list.push(s);
      map.set(k, list);
    }
    return map;
  }, [data]);

  // School table columns
  const columns = useMemo(
    () => [
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
        cell: ({ getValue }) => {
          const n = Number(getValue());
          return Number.isFinite(n) ? n.toLocaleString() : "";
        },
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
              onClick={() => {
                const lat = Number(row.original.latitude);
                const lng = Number(row.original.longitude);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                  setMapCenter([lat, lng]);
                  setMapZoom(13);
                  setSelectedSchool(row.original);
                  setActiveTab("schoolmap");
                } else {
                  setSelectedSchool(row.original);
                  setIsSheetOpen(true);
                }
              }}
            >
              <MapPin className="h-4 w-4 mr-1" /> Map
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSelectedSchool(row.original);
                setIsSheetOpen(true);
              }}
            >
              Full Info
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  // Donor table columns
  // Construction Data (Builds) table columns
  const buildsColumns = useMemo(
    () => [
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
        cell: ({ getValue }) => currencyPHP0.format(Number(getValue() || 0)),
      },
      {
        accessorKey: "nicra",
        header: "NICRA",
        cell: ({ getValue }) => currencyPHP0.format(Number(getValue() || 0)),
      },
      {
        accessorKey: "classroomsBuiltCount",
        header: "Classrooms Built",
        cell: ({ getValue }) => {
          const n = Number(getValue());
          return Number.isFinite(n) ? n.toLocaleString() : "";
        },
      },
    ],
    []
  );
  const donorColumns = useMemo(
    () => [
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
        cell: ({ getValue }) => {
          const n = Number(getValue());
          return Number.isFinite(n) ? n.toLocaleString() : "";
        },
      },
      {
        accessorKey: "schoolsCount",
        header: "Schools Helped",
        cell: ({ getValue }) => {
          const n = Number(getValue());
          return Number.isFinite(n) ? n.toLocaleString() : "";
        },
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
              onClick={() => {
                const donorName = row.original.name;
                const donations =
                  donationsByDonor.get(normalize(donorName)) || [];
                setSelectedDonor({
                  name: donorName,
                  isCorporate: row.original.isCorporate,
                });
                setIsDonorSheetOpen(true);
              }}
            >
              View Info <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [donationsByDonor]
  );

  const donorTable = useReactTable({
    data: donorRows,
    columns: donorColumns,
    state: { globalFilter: donorFilter },
    onGlobalFilterChange: setDonorFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });

  const buildsTable = useReactTable({
    data: buildsRows,
    columns: buildsColumns,
    state: { globalFilter: buildsFilter },
    onGlobalFilterChange: setBuildsFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  const selectedDonorDonations = useMemo(() => {
    if (!selectedDonor) return [];
    return donationsByDonor.get(normalize(selectedDonor.name)) || [];
  }, [selectedDonor, donationsByDonor]);

  const table = useReactTable({
    data: schoolsRows,
    columns,
    state: { globalFilter: schoolFilter },
    onGlobalFilterChange: setSchoolFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });

  const schoolPoints = useMemo(() => {
    return schoolsRows
      .map((r) => ({
        name: r.schoolName,
        lat: Number(r.latitude),
        lng: Number(r.longitude),
      }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  }, [schoolsRows]);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 shadow-sm"
        style={{ backgroundColor: "#1e7dbf" }}
      >
        <div className="mx-auto max-w-7xl px-2">
          <div className="h-16 flex items-center py-2">
            <Image
              src="/images/hope-logo.png"
              alt="Generation Hope"
              width={120}
              height={8}
            />
          </div>
        </div>
      </header>
      <div className="pt-24 mx-4 lg:mx-24 grid gap-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold mt-4">
            Impact Dashboard: Generation Hope
          </h1>
          <p className="text-muted-foreground mt-1">
            Tracking our impact to schools and students
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <School className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground">
                Classrooms Built
              </h2>
            </div>
            <div className="mt-2 text-4xl font-semibold">
              {error ? (
                <span className="text-red-600">—</span>
              ) : data ? (
                nf.format(classroomCount)
              ) : (
                "Loading…"
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground">
                Schools Helped
              </h2>
            </div>
            <div className="mt-2 text-4xl font-semibold">
              {error ? (
                <span className="text-red-600">—</span>
              ) : data ? (
                nf.format(schoolsCount)
              ) : (
                "Loading…"
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground">
                Students Impacted
              </h2>
            </div>
            <div className="mt-2 text-4xl font-semibold">
              {error ? (
                <span className="text-red-600">—</span>
              ) : data ? (
                nf.format(studentsImpacted)
              ) : (
                "Loading…"
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground">
                Construction Cost Donated
              </h2>
            </div>
            <div className="mt-2 text-4xl font-semibold">
              {error ? (
                <span className="text-red-600">—</span>
              ) : data ? (
                <span>
                  {currencyPH.format(pesoMillions)}
                  <span className="text-base align-top">&nbsp;M</span>
                </span>
              ) : (
                "Loading…"
              )}
            </div>
          </Card>
        </div>

        {/* Tabs: Yearly Impact, School List, Donor List, Construction Data */}
        <div className="mt-8">
          {/* Minimal tab bar with underline active state */}
          <div className="border-b flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("yearly")}
              aria-pressed={activeTab === "yearly"}
              className={`px-3 py-2 text-sm font-medium -mb-px border-b-2 transition-colors
              ${
                activeTab === "yearly"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly Impact
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("schools")}
              aria-pressed={activeTab === "schools"}
              className={`px-3 py-2 text-sm font-medium -mb-px border-b-2 transition-colors
              ${
                activeTab === "schools"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              School List
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("schoolmap")}
              aria-pressed={activeTab === "schoolmap"}
              className={`px-3 py-2 text-sm font-medium -mb-px border-b-2 transition-colors
              ${
                activeTab === "schoolmap"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              School Map
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("donors")}
              aria-pressed={activeTab === "donors"}
              className={`px-3 py-2 text-sm font-medium -mb-px border-b-2 transition-colors
              ${
                activeTab === "donors"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Donor List
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("construction")}
              aria-pressed={activeTab === "construction"}
              className={`px-3 py-2 text-sm font-medium -mb-px border-b-2 transition-colors
              ${
                activeTab === "construction"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Construction Data
            </button>
          </div>

          {/* Tab panel */}
          <Card className="p-6 mt-4 border-0">
            {activeTab === "yearly" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Classrooms Built per Year
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={yearlyImpactData}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="classrooms" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Students Impacted per Year
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={yearlyStudentsData}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="students" fill="#2563EB" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Note: The 2021 value represents a cumulative count for
                    2013–2021.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "schools" && (
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Input
                    placeholder="Search schools…"
                    value={schoolFilter}
                    onChange={(e) => setSchoolFilter(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <div className="rounded-md border">
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
                              {{ asc: " \u2191", desc: " \u2193" }[
                                header.column.getIsSorted()
                              ] || null}
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
                            No results.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between mt-3">
                  <div className="text-sm text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Next
                    </Button>
                  </div>
                </div>

                {/* Slide-out Sheet for school details */}
                <SchoolDetailSheet
                  open={isSheetOpen}
                  onOpenChange={setIsSheetOpen}
                  school={selectedSchool}
                  buildsMap={buildsBySchoolMap}
                  impactsMap={impactsBySchoolMap}
                  classroomsMap={classroomsBySchoolMap}
                  onViewMap={(s) => {
                    if (!s) return;
                    const lat = Number(s.latitude);
                    const lng = Number(s.longitude);
                    if (Number.isFinite(lat) && Number.isFinite(lng)) {
                      setMapCenter([lat, lng]);
                      setMapZoom(13);
                      setActiveTab("schoolmap");
                    }
                  }}
                />
              </div>
            )}

            {activeTab === "schoolmap" && (
              <div>
                <div className="rounded-md overflow-hidden border -mx-6 -mt-6 -mb-6 relative z-0">
                  <MapNoSSR
                    center={mapCenter}
                    zoom={mapZoom}
                    points={schoolPoints}
                    onMarkerClick={(p) => {
                      const norm = (v) =>
                        String(v || "")
                          .trim()
                          .toLowerCase();
                      let match = schoolsRows.find(
                        (s) => norm(s.schoolName) === norm(p.name)
                      );
                      if (!match) {
                        match = schoolsRows.find(
                          (s) =>
                            Number(s.latitude) === Number(p.lat) &&
                            Number(s.longitude) === Number(p.lng)
                        );
                      }
                      if (match) {
                        setSelectedSchool(match);
                        setIsSheetOpen(true);
                      } else {
                        // Fallback: still open the sheet with minimal info
                        setSelectedSchool({
                          schoolName: p.name,
                          latitude: p.lat,
                          longitude: p.lng,
                        });
                        setIsSheetOpen(true);
                      }
                    }}
                  />
                </div>
                {/* Slide-out Sheet for school details */}
                <SchoolDetailSheet
                  open={isSheetOpen}
                  onOpenChange={setIsSheetOpen}
                  school={selectedSchool}
                  buildsMap={buildsBySchoolMap}
                  impactsMap={impactsBySchoolMap}
                  classroomsMap={classroomsBySchoolMap}
                  onViewMap={(s) => {
                    if (!s) return;
                    const lat = Number(s.latitude);
                    const lng = Number(s.longitude);
                    if (Number.isFinite(lat) && Number.isFinite(lng)) {
                      setMapCenter([lat, lng]);
                      setMapZoom(13);
                      setActiveTab("schoolmap");
                    }
                  }}
                />
              </div>
            )}

            {activeTab === "donors" && (
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Input
                    placeholder="Search donors…"
                    value={donorFilter}
                    onChange={(e) => setDonorFilter(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {donorTable.getHeaderGroups().map((headerGroup) => (
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
                              {{ asc: " \u2191", desc: " \u2193" }[
                                header.column.getIsSorted()
                              ] || null}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {donorTable.getRowModel().rows.map((row) => (
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
                      {donorTable.getRowModel().rows.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={donorColumns.length}
                            className="text-center text-sm text-muted-foreground py-8"
                          >
                            No results.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between mt-3">
                  <div className="text-sm text-muted-foreground">
                    Page {donorTable.getState().pagination.pageIndex + 1} of{" "}
                    {donorTable.getPageCount()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => donorTable.previousPage()}
                      disabled={!donorTable.getCanPreviousPage()}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => donorTable.nextPage()}
                      disabled={!donorTable.getCanNextPage()}
                    >
                      Next
                    </Button>
                  </div>
                </div>

                {/* Slide-out Sheet for donor details */}
                <DonorDetailSheet
                  open={isDonorSheetOpen}
                  onOpenChange={setIsDonorSheetOpen}
                  donor={selectedDonor}
                  donations={selectedDonorDonations}
                />
              </div>
            )}

            {activeTab === "construction" && (
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Input
                    placeholder="Search builds…"
                    value={buildsFilter}
                    onChange={(e) => setBuildsFilter(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {buildsTable.getHeaderGroups().map((headerGroup) => (
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
                              {{ asc: " \u2191", desc: " \u2193" }[
                                header.column.getIsSorted()
                              ] || null}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {buildsTable.getRowModel().rows.map((row) => (
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
                      {buildsTable.getRowModel().rows.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={buildsColumns.length}
                            className="text-center text-sm text-muted-foreground py-8"
                          >
                            No results.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between mt-3">
                  <div className="text-sm text-muted-foreground">
                    Page {buildsTable.getState().pagination.pageIndex + 1} of{" "}
                    {buildsTable.getPageCount()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => buildsTable.previousPage()}
                      disabled={!buildsTable.getCanPreviousPage()}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => buildsTable.nextPage()}
                      disabled={!buildsTable.getCanNextPage()}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
