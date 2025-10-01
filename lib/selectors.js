import { normalize, getDonorNameFromClassroom } from "./normalize";
import { mapBuildsBySchool } from "./aggregations";

export function deriveDonationsByDonor(classrooms) {
  const map = new Map();
  for (const c of classrooms || []) {
    const key = normalize(getDonorNameFromClassroom(c));
    if (!key) continue;
    const list = map.get(key) || [];
    list.push(c);
    map.set(key, list);
  }
  return map;
}

export function deriveDonorRows(donors, donationsByDonor) {
  return (donors || []).map((d) => {
    const key = normalize(d.donorName);
    const donatedClassrooms = donationsByDonor.get(key) || [];
    const schoolsSet = new Set(
      donatedClassrooms.map((r) => normalize(r.schoolName)).filter(Boolean)
    );
    return {
      name: d.donorName,
      isCorporate: !!d.isCorporate,
      donorType: d.isCorporate ? "Corporate" : "Individual",
      classroomsCount: donatedClassrooms.length,
      schoolsCount: Array.from(schoolsSet).length,
    };
  });
}

export function deriveSchoolsRows(schools, builds) {
  const buildsBySchool = mapBuildsBySchool(builds || []);
  return (schools || []).map((s) => {
    const key = normalize(s.schoolName);
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
}

export function deriveBuildsRows(builds) {
  return (builds || []).map((r) => ({
    contractorName: r.contractorName,
    schoolName: r.schoolName,
    buildEndYear: r.buildEndYear,
    constructionCost: Number(r.constructionCost || 0),
    nicra: Number(r.nicra || 0),
    classroomsBuiltCount: Number(r.classroomsBuiltCount || 0),
  }));
}
