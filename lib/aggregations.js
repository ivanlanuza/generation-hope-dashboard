import { normalize } from "./normalize";

export function mapByKey(rows, keyName) {
  const map = new Map();
  for (const r of rows || []) {
    const k = normalize(r?.[keyName]);
    if (!k) continue;
    const list = map.get(k) || [];
    list.push(r);
    map.set(k, list);
  }
  return map;
}

export function mapBuildsBySchool(builds) {
  return mapByKey(builds, "schoolName");
}

export function mapClassroomsBySchool(classrooms) {
  return mapByKey(classrooms, "schoolName");
}

export function mapImpactsBySchool(impacts) {
  return mapByKey(impacts, "schoolName");
}

export function buildYearlyClassrooms(builds) {
  const byYear = new Map();
  for (const r of builds || []) {
    const yearRaw = r.buildEndYear ?? r.year;
    const year = yearRaw != null ? String(yearRaw).trim() : "";
    if (!year) continue;
    const count = Number(r.classroomsBuiltCount ?? 0);
    const prev = byYear.get(year) ?? 0;
    byYear.set(year, prev + (Number.isFinite(count) ? count : 0));
  }
  return Array.from(byYear.entries())
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, classrooms]) => ({ year, classrooms }));
}

export function buildYearlyStudents(impacts) {
  const byYear = new Map();
  for (const r of impacts || []) {
    const yearRaw = r.yearOfImpact ?? r.year;
    const year = yearRaw != null ? String(yearRaw).trim() : "";
    if (!year) continue;
    const count = Number(r.impactedStudentCount ?? 0);
    const prev = byYear.get(year) ?? 0;
    byYear.set(year, prev + (Number.isFinite(count) ? count : 0));
  }
  return Array.from(byYear.entries())
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, students]) => ({ year, students }));
}
