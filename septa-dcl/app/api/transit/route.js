// app/api/transit/route.js

const LIBRARIES = {
  norwood: {
    name: "Norwood Public Library",
    rail: {
      station: "Norwood",
      line: "Wilmington/Newark Line",
      inboundLabel: "To Phila",
      outboundLabel: "From Phila",
    },
  },

  swarthmore: {
    name: "Swarthmore Public Library",
    rail: {
      station: "Swarthmore",
      line: "Media/Wawa Line",
      inboundLabel: "To Phila",
      outboundLabel: "From Phila",
    },
  },

  sharonhill: {
    name: "Sharon Hill Public Library",
    rail: {
      station: "Sharon Hill",
      line: "Wilmington/Newark Line",
      inboundLabel: "To Phila",
      outboundLabel: "From Phila",
    },

    // FILL THESE IN LATER
    // Example pattern:
    // surfaceStops: [
    //   { stopId: "12345", mode: "Trolley", label: "To 69th Street" },
    //   { stopId: "12346", mode: "Trolley", label: "From 69th Street" }
    // ]
    surfaceStops: [],
  },

  dclhq: {
    name: "DCL Administrative Office",
    surfaceStops: [
      { stopId: "15069", mode: "Bus", label: "Fair Acres" },
    ],
  },

  radnor: {
    name: "Radnor Memorial Library",

    // FILL THESE IN LATER
    // Example pattern:
    // surfaceStops: [
    //   { stopId: "23456", mode: "Bus", label: "Eastbound" },
    //   { stopId: "23457", mode: "Bus", label: "Westbound" }
    // ]
    surfaceStops: [],
  },

  ridley: {
    name: "Ridley Township Public Library",

    // FILL THESE IN LATER
    surfaceStops: [],
  },
};

/**
 * GET /api/transit?library=norwood
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get("library") || "").toLowerCase().trim();

  if (!slug || !LIBRARIES[slug]) {
    return Response.json(
      {
        error: "Unknown or missing library slug",
        validLibraries: Object.keys(LIBRARIES),
      },
      { status: 400 }
    );
  }

  const config = LIBRARIES[slug];
  let rows = [];

  try {
    if (config.rail) {
      const railRows = await getRailRows(config, slug);
      rows.push(...railRows);
    }

    if (config.surfaceStops && config.surfaceStops.length > 0) {
      const surfaceRows = await getSurfaceRows(config, slug);
      rows.push(...surfaceRows);
    }

    // Sort by whichever rows are soonest
    rows.sort((a, b) => {
      const aMinutes = typeof a.minutes === "number" ? a.minutes : 9999;
      const bMinutes = typeof b.minutes === "number" ? b.minutes : 9999;
      return aMinutes - bMinutes;
    });

    // Add final display order after sorting
    rows = rows.map((row, index) => ({
      ...row,
      sort_order: index + 1,
    }));

    return Response.json(
      {
        library: config.name,
        generated_at: new Date().toISOString(),
        rows,
      },
      {
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    return Response.json(
      {
        error: "Failed to load transit data",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * REGIONAL RAIL
 * Uses SEPTA Arrivals endpoint for a station.
 * Returns one row "to Center City" and one row "from Center City" if possible.
 */
async function getRailRows(config, slug) {
  const station = config.rail.station;
  const cityStation = "Suburban Station";

  const inboundUrl =
    `https://www3.septa.org/api/NextToArrive/index.php` +
    `?req1=${encodeURIComponent(station)}` +
    `&req2=${encodeURIComponent(cityStation)}` +
    `&req3=1`;

  const outboundUrl =
    `https://www3.septa.org/api/NextToArrive/index.php` +
    `?req1=${encodeURIComponent(cityStation)}` +
    `&req2=${encodeURIComponent(station)}` +
    `&req3=1`;

  const [inboundRes, outboundRes] = await Promise.all([
    fetch(inboundUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    }),
    fetch(outboundUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    }),
  ]);

  if (!inboundRes.ok) {
    throw new Error(`Rail request failed for ${station} -> ${cityStation}`);
  }
  if (!outboundRes.ok) {
    throw new Error(`Rail request failed for ${cityStation} -> ${station}`);
  }

  const inboundData = await inboundRes.json();
  const outboundData = await outboundRes.json();

  const rows = [];

  const inboundList = Array.isArray(inboundData) ? inboundData : [];
  const outboundList = Array.isArray(outboundData) ? outboundData : [];

  const nextInbound = inboundList.find(
    (t) => isFutureTime(t.orig_departure_time)
  ) || null;

  const nextOutbound = outboundList.find(
    (t) => isFutureTime(t.arrival_time)
  ) || null;

  if (nextInbound) {
    rows.push({
      library: config.name,
      library_slug: slug,
      mode: "Rail",
      route: nextInbound.orig_line || config.rail.line,
      direction_label: config.rail.inboundLabel,
      destination: nextInbound.destination || cityStation,
      minutes: parseMinutes(nextInbound.orig_delay ?? nextInbound.orig_departure_time),
      departure_time: nextInbound.orig_departure_time || "",
      status: normalizeNtaStatus(nextInbound),
    });
  }

  if (nextOutbound) {
    rows.push({
      library: config.name,
      library_slug: slug,
      mode: "Rail",
      route: nextOutbound.orig_line || config.rail.line,
      direction_label: config.rail.outboundLabel,
      destination: nextOutbound.destination || station,
      minutes: parseMinutes(nextOutbound.orig_delay ?? nextOutbound.orig_departure_time),
      departure_time: nextOutbound.arrival_time || "",
      status: normalizeNtaStatus(nextOutbound),
    });
  }

  return rows.filter((r) => Number.isFinite(r.minutes) || r.departure_time);
}

function normalizeNtaStatus(item) {
  const late = item?.orig_delay ?? item?.delay;
  if (late === undefined || late === null || late === "") return "";
  const n = parseInt(String(late), 10);
  if (Number.isNaN(n)) return String(late);
  return n === 0 ? "On Time" : `${n} min late`;
}

function normalizeRailData(data) {
  const trains = [];

  // Common shapes seen in older SEPTA examples:
  // { "Northbound": [...], "Southbound": [...] }
  // or arrays inside named keys.
  if (Array.isArray(data)) {
    return data
      .map(normalizeSingleRailTrain)
      .filter(Boolean)
      .sort((a, b) => (a.minutes ?? 9999) - (b.minutes ?? 9999));
  }

  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          const normalized = normalizeSingleRailTrain(item, key);
          if (normalized) trains.push(normalized);
        }
      }
    }
  }

  return trains.sort((a, b) => (a.minutes ?? 9999) - (b.minutes ?? 9999));
}

function normalizeSingleRailTrain(item, bucket = "") {
  if (!item || typeof item !== "object") return null;

  const destination =
    item.destination ||
    item.dest ||
    item.term ||
    item.terminal ||
    "";

  const line =
    item.line ||
    item.orig_line ||
    item.route ||
    "";

  const departureTime =
    item.depart_time ||
    item.departure_time ||
    item.orig_departure_time ||
    item.sched_time ||
    "";

  const rawStatus =
    item.status ||
    item.late ||
    item.delay ||
    "";

  const minutes =
    parseMinutes(
      item.minutes ??
        item.time ??
        item.eta ??
        item.arrival_time ??
        item.departure_time ??
        item.orig_delay
    );

  // CRITICAL FILTER — skip non-train rows
  if (
    !destination ||
    !departureTime ||
    !Number.isFinite(minutes)
  ) {
    return null;
  }

  return {
    destination,
    line,
    departure_time: departureTime,
    status: normalizeStatus(rawStatus, item),
    minutes,
  };
}

/**
 * BUS / TROLLEY
 * First pass uses SEPTA's SMS-style stop feed because it is straightforward:
 * one stop ID in, upcoming times out.
 *
 * You will need to fill in stop IDs in LIBRARIES above.
 */
async function getSurfaceRows(config, slug) {
  const rows = [];

  for (const stop of config.surfaceStops) {
    const stopRows = await getUpcomingStopTimes(stop, config, slug);
    rows.push(...stopRows);
  }

  return rows.sort((a, b) => (a.minutes ?? 9999) - (b.minutes ?? 9999)).slice(0, 4);
}

async function getUpcomingStopTimes(stopConfig, config, slug) {
  const stopId = stopConfig.stopId;

  // SEPTA SMS endpoint returns text-like upcoming times by stop.
  // Example patterns are documented by SEPTA/OpenDataPhilly.
  const url = `https://www3.septa.org/sms/${encodeURIComponent(stopId)}`;

  const response = await fetch(url, {
    headers: {
      Accept: "text/plain, text/html, */*",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Surface stop request failed for stop ${stopId}`);
  }

  const text = await response.text();
  console.log("STOP ID:", stopId);
  console.log("RAW STOP TEXT:", text);

  const parsed = parseSmsStopFeed(text);
  console.log("PARSED STOP ROWS:", parsed);

  return parsed.map((entry) => ({
    library: config.name,
    library_slug: slug,
    mode: stopConfig.mode || "Bus/Trolley",
    route: entry.route || "",
    direction_label: entry.direction_from_feed || stopConfig.label || "",
    destination: entry.destination || "",
    minutes: entry.minutes,
    departure_time: entry.departure_time || "",
    status: "",
  }));
}

/**
 * Very forgiving parser for SEPTA SMS-style response text.
 * You may need to tweak this once you see real output for your stops.
 */
function parseSmsStopFeed(text) {
  if (!text) return [];

  const cleaned = text.replace(/\s+/g, " ").trim();
  const rows = [];

  const directionBlocks = [
    { label: "Inbound", regex: /Inbound\s+(.+?)(?=\s+Outbound\b|$)/i },
    { label: "Outbound", regex: /Outbound\s+(.+?)$/i },
  ];

  for (const block of directionBlocks) {
    const match = cleaned.match(block.regex);
    if (!match) continue;

    const segment = match[1];

    const routeRegex = /Rt\.\s*([A-Za-z0-9]+)\s*@\s*(\d{1,2}:\d{2})/gi;
    let routeMatch;

    while ((routeMatch = routeRegex.exec(segment)) !== null) {
      const route = routeMatch[1];
      const time24 = routeMatch[2];

      rows.push({
        route,
        destination: "",
        direction_from_feed: block.label,
        minutes: minutesUntil24HourTime(time24),
        departure_time: convert24HourTo12Hour(time24),
        raw: routeMatch[0],
      });
    }
  }

  return rows
    .filter((r) => Number.isFinite(r.minutes) && r.minutes >= -2)
    .sort((a, b) => a.minutes - b.minutes)
    .slice(0, 4);
}

function extractDestinationFromLine(line) {
  if (!line) return "";

  // Very loose guess:
  // Look for "to Something"
  const toMatch = line.match(/\bto\s+(.+?)(?:\s+\d+\s*(?:min|mins|minutes)|$)/i);
  if (toMatch) return toMatch[1].trim();

  return "";
}

function isTowardCenterCity(destination) {
  if (!destination) return false;

  const d = destination.toLowerCase();

  return (
    d.includes("suburban") ||
    d.includes("center city") ||
    d.includes("jefferson") ||
    d.includes("market east") ||
    d.includes("30th street") ||
    d.includes("temple")
  );
}

function parseMinutes(value) {
  if (value === null || value === undefined) return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const str = String(value).trim();

  if (!str) return null;

  // Plain integer string
  if (/^\d+$/.test(str)) {
    return parseInt(str, 10);
  }

  // "5 min"
  const minMatch = str.match(/(\d+)\s*(min|mins|minutes)\b/i);
  if (minMatch) {
    return parseInt(minMatch[1], 10);
  }

  // "3:42 PM" -> convert to minutes from now
  const parsed = minutesUntilClockTime(str);
  if (parsed !== null) return parsed;

  return null;
}

function minutesUntilClockTime(timeString) {
  if (!timeString) return null;

  const normalized = String(timeString)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(\d)(AM|PM)$/i, "$1 $2");

  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*([APap][Mm])$/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);

  if (target < now) {
    target.setDate(target.getDate() + 1);
  }

  return Math.round((target - now) / 60000);
}

function isFutureTime(timeString) {
  const mins = minutesUntilClockTime(timeString);
  return mins !== null && mins >= 0;
}

function minutesUntil24HourTime(timeString) {
  if (!timeString) return null;

  const match = String(timeString).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);

  return Math.round((target - now) / 60000);
}

function convert24HourTo12Hour(timeString) {
  const match = String(timeString).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return timeString || "";

  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const suffix = hour >= 12 ? "PM" : "AM";

  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;

  return `${hour}:${minute}${suffix}`;
}

function normalizeStatus(status, item) {
  if (!status) return "";

  const raw = String(status).trim();

  if (/^\d+$/.test(raw)) {
    const minsLate = parseInt(raw, 10);
    return minsLate === 0 ? "On Time" : `${minsLate} min late`;
  }

  if (item?.late !== undefined && /^\d+$/.test(String(item.late))) {
    const minsLate = parseInt(String(item.late), 10);
    return minsLate === 0 ? "On Time" : `${minsLate} min late`;
  }

  return raw;
}