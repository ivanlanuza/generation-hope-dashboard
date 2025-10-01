import { getAllSheetsAsJSON } from "@/lib/sheets";

export default async function handler(req, res) {
  try {
    const data = await getAllSheetsAsJSON(process.env.SHEETS_SPREADSHEET_ID);
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(data));
    //console.log(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load Sheets data" });
  }
}
