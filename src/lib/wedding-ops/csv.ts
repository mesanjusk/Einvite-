import { normalizePhone } from "@/lib/phone";

export type GuestImportRow = {
  name: string;
  phone: string | null;
  email: string | null;
  group: string | null;
  expectedPartySize: number;
  eventNames: string | null;
  travelMode: string | null;
  travelDetails: string | null;
  hotelDetails: string | null;
};

const HEADER_NAMES: Record<string, keyof GuestImportRow> = {
  name: "name",
  guestname: "name",
  fullname: "name",
  mobile: "phone",
  mobilenumber: "phone",
  whatsapp: "phone",
  whatsappnumber: "phone",
  phone: "phone",
  phonenumber: "phone",
  email: "email",
  emailaddress: "email",
  group: "group",
  side: "group",
  family: "group",
  familyside: "group",
  partysize: "expectedPartySize",
  guestcount: "expectedPartySize",
  persons: "expectedPartySize",
  events: "eventNames",
  ceremonies: "eventNames",
  travelmode: "travelMode",
  travel: "travelMode",
  traveldetails: "travelDetails",
  arrival: "travelDetails",
  hotel: "hotelDetails",
  accommodation: "hotelDetails",
};

function splitCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error("CSV has an unclosed quoted cell.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function detectDelimiter(header: string) {
  const counts = [",", "\t", ";"].map((sep) => ({
    sep,
    count: header.split(sep).length - 1,
  }));
  return counts.sort((a, b) => b.count - a.count)[0].sep;
}

export function parseGuestCsv(input: string): GuestImportRow[] {
  const csv = input.replace(/^\uFEFF/, "").trim();
  if (!csv) throw new Error("Please select a CSV file with a header row.");
  if (csv.length > 400_000) throw new Error("CSV exceeds the 400 KB import limit.");
  const rows = splitCsv(csv, detectDelimiter(csv.split(/\r?\n/, 1)[0]));
  if (rows.length < 2) throw new Error("CSV needs headers and at least one guest.");
  if (rows.length > 501) throw new Error("Import at most 500 guests per batch.");

  const keys = rows[0].map((key) =>
    HEADER_NAMES[key.toLowerCase().replace(/[^a-z0-9]/g, "")] ?? null,
  );
  if (!keys.includes("name")) {
    throw new Error("CSV must have a Name or Guest Name column.");
  }
  const deduplicated = new Set<string>();
  const guests: GuestImportRow[] = [];

  for (const [rowIndex, cells] of rows.slice(1).entries()) {
    const values: Record<string, string> = {};
    keys.forEach((key, index) => {
      if (key && cells[index] !== undefined) values[key] = cells[index].trim().slice(0, 500);
    });
    const name = (values.name ?? "").slice(0, 120).trim();
    if (!name) throw new Error("Guest name is missing on row " + (rowIndex + 2) + ".");
    const rawPhone = values.phone ?? "";
    const phone = rawPhone ? normalizePhone(rawPhone) : null;
    if (rawPhone && !phone) {
      throw new Error("Invalid phone number on row " + (rowIndex + 2) + ".");
    }
    const email = values.email || null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email on row " + (rowIndex + 2) + ".");
    }
    const expectedPartySize = values.expectedPartySize
      ? Number(values.expectedPartySize)
      : 1;
    if (!Number.isInteger(expectedPartySize) || expectedPartySize < 1 || expectedPartySize > 50) {
      throw new Error("Party size must be 1–50 on row " + (rowIndex + 2) + ".");
    }
    const group = values.group?.slice(0, 100) || null;
    const key = phone || (name.toLowerCase() + ":" + (group ?? "").toLowerCase());
    if (deduplicated.has(key)) continue;
    deduplicated.add(key);
    guests.push({
      name,
      phone,
      email,
      group,
      expectedPartySize,
      eventNames: values.eventNames?.slice(0, 300) || null,
      travelMode: values.travelMode?.slice(0, 60) || null,
      travelDetails: values.travelDetails?.slice(0, 500) || null,
      hotelDetails: values.hotelDetails?.slice(0, 300) || null,
    });
  }
  return guests;
}
