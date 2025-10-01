import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

function auth() {
  const jwt = new google.auth.JWT({
    email: process.env.SHEETS_CLIENT_EMAIL,
    key: process.env.SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: SCOPES,
  });
  return jwt;
}

/** Fetch all sheet titles, skip 'References', batch-get values,
 *  map first row to headers, return { SheetName: [rowObjects...] }.
 */
export async function getAllSheetsAsJSON(spreadsheetId) {
  const sheets = google.sheets({ version: "v4", auth: auth() });

  // 1) List sheets
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetTitles = (meta.data.sheets || [])
    .map((s) => s.properties.title)
    .filter((t) => String(t).toLowerCase() !== "references");

  // 2) Batch get all ranges by sheet title
  const { data } = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: sheetTitles, // full used range per sheet
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });

  // 3) Map rows to objects
  const result = {};
  data.valueRanges.forEach((vr, i) => {
    const title = sheetTitles[i];
    const rows = vr.values || [];
    if (!rows.length) {
      result[title] = [];
      return;
    }
    const headers = rows[0];
    const items = rows.slice(1).map((r) => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[String(h || `col_${idx}`)] = r[idx];
      });
      return obj;
    });
    result[title] = items;
  });
  return result;
}
