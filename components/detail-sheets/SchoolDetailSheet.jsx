"use client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatMoney0 } from "@/lib/formatters";

export default function SchoolDetailSheet({
  open,
  onOpenChange,
  school,
  buildsMap,
  impactsMap,
  classroomsMap,
}) {
  const nf = new Intl.NumberFormat("en-US");

  const key = (school?.schoolName || "").toString().trim().toLowerCase();
  const builds = buildsMap.get(key) || [];
  const classrooms = classroomsMap.get(key) || [];
  const impacts = impactsMap.get(key) || [];

  const totalRooms = builds.reduce((s, r) => s + Number(r.classroomsBuiltCount || 0), 0);
  const totalStudents = impacts.reduce((s, r) => s + Number(r.impactedStudentCount || 0), 0);
  const totalCost = builds.reduce((s, r) => s + Number(r.constructionCost || 0), 0);
  const latestYear = builds.reduce((m, r) => Math.max(m, Number(r.buildEndYear || 0)), 0) || "";

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
                    <span key={i} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs bg-blue-200">
                      {d}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">No donor data.</div>
              );
            })()}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Students Impacted</div>
              <div className="text-2xl font-semibold">{nf.format(totalStudents)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Built On</div>
              <div className="text-xl font-semibold">{latestYear || "—"}</div>
            </div>
          </div>

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
                        <td className="px-3 py-2 text-right">{nf.format(Number(b.classroomsBuiltCount || 0))}</td>
                        <td className="px-3 py-2 text-right">{formatMoney0(Number(b.constructionCost || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted-foreground">No builds recorded.</div>
            )}
          </div>

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
