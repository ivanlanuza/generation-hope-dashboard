"use client";
import { useEffect, useMemo, useState } from "react";
import { buildYearlyClassrooms, buildYearlyStudents, mapBuildsBySchool, mapClassroomsBySchool, mapImpactsBySchool } from "@/lib/aggregations";
import { deriveBuildsRows, deriveDonationsByDonor, deriveDonorRows, deriveSchoolsRows } from "@/lib/selectors";

export default function useDashboardData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  const donors = Array.isArray(data?.Donor) ? data.Donor : [];
  const schools = Array.isArray(data?.School) ? data.School : [];
  const builds = Array.isArray(data?.Builds) ? data.Builds : [];
  const classrooms = Array.isArray(data?.Classroom) ? data.Classroom : [];
  const impacts = Array.isArray(data?.StudentImpact) ? data.StudentImpact : [];

  const donationsByDonor = useMemo(() => deriveDonationsByDonor(classrooms), [classrooms]);
  const donorRows = useMemo(() => deriveDonorRows(donors, donationsByDonor), [donors, donationsByDonor]);
  const schoolsRows = useMemo(() => deriveSchoolsRows(schools, builds), [schools, builds]);
  const buildsRows = useMemo(() => deriveBuildsRows(builds), [builds]);

  const buildsBySchoolMap = useMemo(() => mapBuildsBySchool(builds), [builds]);
  const classroomsBySchoolMap = useMemo(() => mapClassroomsBySchool(classrooms), [classrooms]);
  const impactsBySchoolMap = useMemo(() => mapImpactsBySchool(impacts), [impacts]);

  const yearlyImpactData = useMemo(() => buildYearlyClassrooms(builds), [builds]);
  const yearlyStudentsData = useMemo(() => buildYearlyStudents(impacts), [impacts]);

  const totals = useMemo(() => ({
    classroomCount: classrooms.length,
    schoolsCount: schools.length,
    studentsImpacted: impacts.reduce((sum, r) => sum + Number(r.impactedStudentCount || 0), 0),
    totalConstructionCost: builds.reduce((sum, r) => sum + Number(r.constructionCost || 0), 0),
  }), [classrooms, schools, impacts, builds]);

  return {
    error, data,
    donors, schools, builds, classrooms, impacts,
    donationsByDonor,
    donorRows, schoolsRows, buildsRows,
    buildsBySchoolMap, classroomsBySchoolMap, impactsBySchoolMap,
    yearlyImpactData, yearlyStudentsData,
    totals,
  };
}
