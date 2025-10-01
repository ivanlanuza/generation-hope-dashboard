"use client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function DonorDetailSheet({ open, onOpenChange, donor, donations }) {
  const nf = new Intl.NumberFormat("en-US");
  const type = donor?.isCorporate ? "Corporate" : "Individual";

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
      <SheetContent side="right" className="w-full sm:max-w-lg p-4 z-[2000] overflow-auto">
        <SheetHeader>
          <SheetTitle className="-ml-4 -mb-12">
            {donor?.name || "Donor Details"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6 text-sm">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Donor Type</div>
              <div className="text-lg font-semibold">{type}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Classrooms Donated</div>
              <div className="text-2xl font-semibold">{nf.format(totalClassrooms)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Schools Helped</div>
              <div className="text-2xl font-semibold">{nf.format(uniqueSchools)}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Schools & Classrooms Donated</div>
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
                        <td className="px-3 py-2 text-right">{nf.format(g.classrooms)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted-foreground">No donation records found for this donor.</div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
