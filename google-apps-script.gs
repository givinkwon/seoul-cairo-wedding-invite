const SHEET_HEADERS = {
  attendance: [
    "createdAt",
    "id",
    "name",
    "phone",
    "side",
    "attendance",
    "adultCompanions",
    "childCompanions",
    "mealAttendance",
    "dietary",
    "note",
  ],
  guestbook: ["createdAt", "id", "name", "message", "x", "y"],
};

function doGet(event) {
  const type = normalizeType((event && event.parameter && event.parameter.type) || "attendance");
  const sheet = getSheet(type);
  const headers = ensureHeaders(sheet, SHEET_HEADERS[type]);
  const rows = sheet.getDataRange().getValues().slice(1);
  const entries = rows
    .filter((row) => row.some((cell) => String(cell).trim() !== ""))
    .map((row) =>
      headers.reduce((entry, header, index) => {
        entry[header] = row[index];
        return entry;
      }, {})
    );

  return json({ ok: true, entries });
}

function doPost(event) {
  const body = JSON.parse((event && event.postData && event.postData.contents) || "{}");
  const type = normalizeType(body.type);
  const payload = body.payload || {};
  const sheet = getSheet(type);
  const headers = ensureHeaders(sheet, SHEET_HEADERS[type]);
  const entry = normalizeEntry(type, payload);
  sheet.appendRow(headers.map((header) => entry[header] || ""));
  return json({ ok: true, entry });
}

function normalizeType(type) {
  if (type === "guestbook") return "guestbook";
  return "attendance";
}

function getSheet(type) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const name = type === "guestbook" ? "guestbook" : "attendance";
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function ensureHeaders(sheet, expectedHeaders) {
  const current = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];
  const hasHeaders = current.some((cell) => String(cell).trim() !== "");
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    return expectedHeaders;
  }
  return current.map(String);
}

function normalizeEntry(type, payload) {
  const now = new Date().toISOString();
  if (type === "guestbook") {
    return {
      createdAt: payload.createdAt || now,
      id: payload.id || Utilities.getUuid(),
      name: payload.name || "",
      message: payload.message || "",
      x: payload.x || "",
      y: payload.y || "",
    };
  }

  return {
    createdAt: payload.createdAt || now,
    id: payload.id || Utilities.getUuid(),
    name: payload.name || "",
    phone: payload.phone || "",
    side: payload.side || "",
    attendance: payload.attendance || "",
    adultCompanions: payload.adultCompanions || "0",
    childCompanions: payload.childCompanions || "0",
    mealAttendance: payload.mealAttendance || "",
    dietary: payload.dietary || "",
    note: payload.note || "",
  };
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
