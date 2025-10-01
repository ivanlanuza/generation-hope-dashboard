export const normalize = (v) => String(v || "").trim().toLowerCase();

export const getDonorNameFromClassroom = (c) =>
  c.donatedBy ||
  c.donorName ||
  c.donor ||
  c.sponsor ||
  c.sponsorName ||
  "";
