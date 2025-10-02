"use client";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { School, Building2, Users, HandCoins, Loader2 } from "lucide-react";
import StatsCard from "@/components/cards/StatsCard";
import YearlyClassroomsChart from "@/components/charts/YearlyClassroomsChart";
import YearlyStudentsChart from "@/components/charts/YearlyStudentsChart";
import BuildsTreemap from "@/components/charts/BuildsTreemap";
import DonationTreemap from "@/components/charts/DonationTreemap";
import TabBar from "@/components/tabs/TabBar";
import SchoolTable from "@/components/tables/SchoolTable";
import DonorTable from "@/components/tables/DonorTable";
import BuildsTable from "@/components/tables/BuildsTable";
import DonorDetailSheet from "@/components/detail-sheets/DonorDetailSheet";
import SchoolDetailSheet from "@/components/detail-sheets/SchoolDetailSheet";
import useDashboardData from "@/hooks/useDashboardData";
import useMapState from "@/hooks/useMapState";
import useDonorState from "@/hooks/useDonorState";
import { normalize } from "@/lib/normalize";
import { formatMoney2 } from "@/lib/formatters";
import { Card as UICard } from "@/components/ui/card";
import Link from "next/link";

const MapNoSSR = dynamic(() => import("@/components/map/LeafletMap"), {
  ssr: false,
});

export default function Home() {
  const [activeTab, setActiveTab] = useState("yearly");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [buildsFilter, setBuildsFilter] = useState("");

  const {
    isLoading, // may be undefined if hook not yet updated
    error,
    donors,
    donorRows,
    donationsByDonor,
    schoolsRows,
    buildsRows,
    buildsBySchoolMap,
    classroomsBySchoolMap,
    impactsBySchoolMap,
    yearlyImpactData,
    yearlyStudentsData,
    buildsTreemapData,
    donationTreemapData,
    totals,
  } = useDashboardData();

  const {
    mapCenter,
    setMapCenter,
    mapZoom,
    setMapZoom,
    selectedSchool,
    isSchoolSheetOpen,
    openSchoolSheet,
    closeSchoolSheet,
  } = useMapState();

  const {
    donorFilter,
    setDonorFilter,
    selectedDonor,
    openDonorSheet,
    closeDonorSheet,
    isDonorSheetOpen,
    selectedDonorDonations,
  } = useDonorState(donationsByDonor);

  const nf = new Intl.NumberFormat("en-US");

  // Fallback loading heuristic in case hook isn't updated to return isLoading yet
  const fallbackLoading =
    !error && !donorRows?.length && !schoolsRows?.length && !buildsRows?.length;
  const loading = typeof isLoading === "boolean" ? isLoading : fallbackLoading;

  const handleMapClickFromTable = useCallback(
    (school) => {
      const lat = Number(school.latitude);
      const lng = Number(school.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setMapCenter([lat, lng]);
        setMapZoom(13);
        setActiveTab("schoolmap");
        openSchoolSheet(school);
      } else {
        openSchoolSheet(school);
      }
    },
    [openSchoolSheet, setActiveTab, setMapCenter, setMapZoom]
  );

  const schoolPoints = useMemo(() => {
    return (schoolsRows || [])
      .map((r) => ({
        name: r.schoolName,
        lat: Number(r.latitude),
        lng: Number(r.longitude),
      }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  }, [schoolsRows]);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[1000] bg-background/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 rounded-md border bg-background px-6 py-6 shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin" />
            <div className="text-sm text-muted-foreground">
              Loading latest data…
            </div>
          </div>
        </div>
      )}
      <header
        className="fixed top-0 left-0 right-0 z-50 shadow-sm"
        style={{ backgroundColor: "#1e7dbf" }}
      >
        <div className="mx-auto max-w-7xl px-2">
          <div className="h-16 flex items-center py-2">
            <Link href="https://www.generationhope.ph/">
              <Image
                src="/images/hope-logo.png"
                alt="Generation Hope"
                width={120}
                height={8}
              />
            </Link>
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mr-4 lg:mr-0">
          <StatsCard
            icon={School}
            label="Classrooms Built"
            value={error ? "—" : nf.format(totals.classroomCount || 0)}
          />
          <StatsCard
            icon={Building2}
            label="Schools Helped"
            value={error ? "—" : nf.format(totals.schoolsCount || 0)}
          />
          <StatsCard
            icon={Users}
            label="Students Impacted"
            value={error ? "—" : nf.format(totals.studentsImpacted || 0)}
          />
          <StatsCard
            icon={HandCoins}
            label="Construction Cost Donated"
            value={
              error ? (
                "—"
              ) : (
                <span>
                  {formatMoney2(
                    (totals.totalConstructionCost || 0) / 1_000_000
                  )}
                  <span className="text-base align-top">&nbsp;M</span>
                </span>
              )
            }
          />
        </div>

        <div className="mt-8 mb-8  mr-4 lg:mr-0">
          <TabBar
            active={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: "yearly", label: "Yearly Impact" },
              { id: "schoolmap", label: "School Map" },
              { id: "schools", label: "School List" },
              { id: "donors", label: "Donor List" },
              { id: "construction", label: "Construction Data" },
            ]}
          />

          <UICard className="p-6 mt-4 border-0">
            {activeTab === "yearly" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Classrooms Built per Year
                  </h3>
                  <YearlyClassroomsChart data={yearlyImpactData} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Students Impacted per Year
                  </h3>
                  <YearlyStudentsChart data={yearlyStudentsData} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Note: The 2021 value represents a cumulative count for
                    2013–2021.
                  </p>
                </div>

                <div className="lg:col-span-1">
                  <h3 className="text-lg font-semibold mb-2">
                    Classrooms Built per Region
                  </h3>
                  <BuildsTreemap data={buildsTreemapData} />
                </div>
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-semibold mb-2">
                    Classrooms Donated per Donor
                  </h3>
                  <DonationTreemap data={donationTreemapData} />
                </div>
              </div>
            )}

            {activeTab === "schools" && (
              <>
                <SchoolTable
                  data={schoolsRows}
                  filter={schoolFilter}
                  onFilter={setSchoolFilter}
                  onMap={handleMapClickFromTable}
                  onOpenSheet={(s) => openSchoolSheet(s)}
                />
                <SchoolDetailSheet
                  open={isSchoolSheetOpen}
                  onOpenChange={(v) => (v ? null : closeSchoolSheet())}
                  school={selectedSchool}
                  buildsMap={buildsBySchoolMap}
                  impactsMap={impactsBySchoolMap}
                  classroomsMap={classroomsBySchoolMap}
                />
              </>
            )}

            {activeTab === "schoolmap" && (
              <div>
                <div className="h-[560px] rounded-md overflow-hidden border -mx-6 -mt-6 -mb-6 relative z-0">
                  <MapNoSSR
                    center={mapCenter}
                    zoom={mapZoom}
                    points={schoolPoints}
                    onMarkerClick={(p) => {
                      const norm = (v) =>
                        String(v || "")
                          .trim()
                          .toLowerCase();
                      let match = (schoolsRows || []).find(
                        (s) => norm(s.schoolName) === norm(p.name)
                      );
                      if (!match) {
                        match = (schoolsRows || []).find(
                          (s) =>
                            Number(s.latitude) === Number(p.lat) &&
                            Number(s.longitude) === Number(p.lng)
                        );
                      }
                      if (match) {
                        openSchoolSheet(match);
                      } else {
                        openSchoolSheet({
                          schoolName: p.name,
                          latitude: p.lat,
                          longitude: p.lng,
                        });
                      }
                    }}
                  />
                </div>
                <SchoolDetailSheet
                  open={isSchoolSheetOpen}
                  onOpenChange={(v) => (v ? null : closeSchoolSheet())}
                  school={selectedSchool}
                  buildsMap={buildsBySchoolMap}
                  impactsMap={impactsBySchoolMap}
                  classroomsMap={classroomsBySchoolMap}
                />
              </div>
            )}

            {activeTab === "donors" && (
              <>
                <DonorTable
                  data={donorRows}
                  filter={donorFilter}
                  onFilter={setDonorFilter}
                  onOpenSheet={(donor) => openDonorSheet(donor)}
                  donationsByDonor={donationsByDonor}
                />
                <DonorDetailSheet
                  open={isDonorSheetOpen}
                  onOpenChange={(v) => (v ? null : closeDonorSheet())}
                  donor={selectedDonor}
                  donations={selectedDonorDonations}
                />
              </>
            )}

            {activeTab === "construction" && (
              <BuildsTable
                data={buildsRows}
                filter={buildsFilter}
                onFilter={setBuildsFilter}
              />
            )}
          </UICard>
        </div>
      </div>
    </>
  );
}
