import { normalize, getDonorNameFromClassroom } from "./normalize";

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

// Builds a hierarchy: Island -> Region, sized by total classroomsBuiltCount
export function buildTreemapByIslandRegion(schools, builds) {
  // Helper: tolerant field picker (supports various header spellings)
  const pick = (obj, names) => {
    for (const n of names) {
      if (obj && obj[n] != null && String(obj[n]).trim() !== "") return obj[n];
    }
    // case-insensitive fallback
    const keys = Object.keys(obj || {});
    for (const k of keys) {
      if (names.some((n) => n.toLowerCase() === k.toLowerCase())) {
        const v = obj[k];
        if (v != null && String(v).trim() !== "") return v;
      }
    }
    return "";
  };

  // Fixed colors per island group
  const colorForIsland = (name) => {
    const k = String(name || "")
      .trim()
      .toLowerCase();
    if (k.includes("luzon")) return "#FCD34D"; // amber-600 (yellowish)
    if (k.includes("visayas")) return "#FCA5A5"; // red-500 (reddish)
    if (k.includes("mindanao")) return "#93C5FD"; // blue-500 (blueish)
    return "#9CA3AF"; // gray-400 fallback
  };

  // Map schoolName -> { island, region }
  const schoolMeta = new Map();
  for (const s of schools || []) {
    const key = normalize(s.schoolName);
    if (!key) continue;
    const islandRaw = pick(s, [
      "island",
      "Island",
      "islandGroup",
      "Island Group",
    ]);
    const regionRaw = pick(s, [
      "region",
      "Region",
      "regionName",
      "Region Name",
    ]);
    const island = String(islandRaw || "Unknown").trim();
    const region = String(regionRaw || "Unknown").trim();
    schoolMeta.set(key, { island, region });
  }

  // Aggregate classrooms by island -> region
  const islandMap = new Map(); // island -> (region -> totalClassrooms)
  for (const b of builds || []) {
    const key = normalize(b.schoolName);
    if (!key) continue;
    const meta = schoolMeta.get(key);
    if (!meta) continue;
    const count = Number(b.classroomsBuiltCount || 0);
    if (!Number.isFinite(count) || count <= 0) continue;

    const { island, region } = meta;
    let regionMap = islandMap.get(island);
    if (!regionMap) {
      regionMap = new Map();
      islandMap.set(island, regionMap);
    }
    regionMap.set(region, (regionMap.get(region) || 0) + count);
  }

  // Build hierarchical result with color baked into leaves
  const result = [];
  for (const [island, regionMap] of islandMap.entries()) {
    const children = Array.from(regionMap.entries())
      .map(([region, value]) => ({
        name: region,
        value,
        _island: island,
        fill: colorForIsland(island),
      }))
      .sort((a, b) => b.value - a.value);

    result.push({ name: island, children });
  }

  // Sort islands by total classrooms desc
  result.sort(
    (a, b) =>
      b.children.reduce((s, c) => s + c.value, 0) -
      a.children.reduce((s, c) => s + c.value, 0)
  );

  return result;
}

export function buildTreemapByDonor(classrooms) {
  const counts = new Map();
  for (const c of classrooms || []) {
    const raw = getDonorNameFromClassroom(c);
    const key = normalize(raw);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  // stable palette of muted colors
  const palette = [
    "#93C5FD", // blue-300
    "#FCA5A5", // red-300
    "#FCD34D", // amber-300
    "#A7F3D0", // emerald-300
    "#C4B5FD", // violet-300
    "#FDBA74", // orange-300
    "#67E8F9", // cyan-300
    "#F9A8D4", // pink-300
    "#DDD6FE", // indigo-200
  ];

  const rows = Array.from(counts.entries())
    .map(([normName, value]) => ({ normName, value }))
    .sort((a, b) => b.value - a.value)
    .map((row, i) => ({
      name: row.normName.replace(/\b\w/g, (m) => m.toUpperCase()),
      value: row.value,
      fill: palette[i % palette.length],
    }));

  return rows; // flat list for the Treemap
}
