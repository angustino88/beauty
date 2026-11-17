import dayjs, { type ManipulateType, type OpUnitType } from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import isoWeek from "dayjs/plugin/isoWeek.js";
import quarterOfYear from "dayjs/plugin/quarterOfYear.js";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import type { StatisticsChartEntry } from "../types";
import type { ChartDateParams, ChartDurationParams } from "../types";
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(quarterOfYear);
dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.extend(isoWeek);

export const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";
export const MAX_TICKS = 7;

const getLastPeriod = (period: "isoweek" | "month" | "year" | "quarter") => {
  const tz = dayjs().tz(DEFAULT_TIMEZONE);
  const startOp = period === "isoweek" ? "isoWeek" : period;
  const upperbound = tz
    .startOf(startOp as OpUnitType)
    .subtract(1, (period === "isoweek" ? "week" : period) as ManipulateType)
    .endOf(startOp as OpUnitType);
  const lowerbound = upperbound.startOf(startOp as OpUnitType);
  return { lowerbound, upperbound };
};

export const getNearestLastWeekday = (weekday: number) => {
  const today = dayjs().tz(DEFAULT_TIMEZONE);
  const todayWeekday = today.day();
  const diff = (todayWeekday - weekday + 7) % 7;
  return today.subtract(diff, "day");
};

const { lowerbound: lastWeekStart, upperbound: lastWeekEnd } =
  getLastPeriod("isoweek");
const { lowerbound: lastMonthStart, upperbound: lastMonthEnd } =
  getLastPeriod("month");
const { lowerbound: lastQuarterStart, upperbound: lastQuarterEnd } =
  getLastPeriod("quarter");
const { lowerbound: lastYearStart, upperbound: lastYearEnd } =
  getLastPeriod("year");

export const PERIOD = {
  LAST_WEEK: `${lastWeekStart.format("YYYY-MM-DD")} - ${lastWeekEnd.format("YYYY-MM-DD")}`,
  LAST_MONTH: `${lastMonthStart.format("YYYY-MM-DD")} - ${lastMonthEnd.format("YYYY-MM-DD")}`,
  LAST_QUARTER: `${lastQuarterStart.format("YYYY-MM-DD")} - ${lastQuarterEnd.format("YYYY-MM-DD")}`,
  LAST_YEAR: `${lastYearStart.format("YYYY-MM-DD")} - ${lastYearEnd.format("YYYY-MM-DD")}`,
};

const range = (max: number, step = 1) => {
  const arr: number[] = [];
  for (let i = 0; i <= max + step / 2; i += step) arr.push(+i.toFixed(2));
  return arr;
};

export const getWholeTick = (
  values: number[],
  maxTicks = MAX_TICKS,
) => {
  const maxEntry = Math.max(...values.map(Number));
  const largestTick = maxEntry + (maxTicks - 1 - (maxEntry % (maxTicks - 1)));
  if (largestTick <= maxTicks - 1) return range(largestTick);
  const space = largestTick / (maxTicks - 1);
  return range(largestTick, space);
};

export const getFloatTick = (
  values: number[],
  maxTicks = MAX_TICKS,
) => {
  const maxEntry = Math.max(...values.map(Number));
  const rawStep = maxEntry / (maxTicks - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const step = Math.ceil((rawStep || 1) / magnitude) * magnitude;
  const largestTick = step * (maxTicks - 1);
  return range(largestTick, step);
};

/**
 * The line under a chart title: which slice of the ranking and which period, e.g.
 * "Top 5, highest first · 10 – 16 Nov 2026" or "Snapshot · 11 Nov 2026".
 */
export const getChartSubtitle = (
  filters:
    | { from_date_time?: string; to_date_time?: string; log_date?: string; top?: number; order?: "asc" | "desc" }
    | undefined,
  rank = true,
): string => {
  const parts: string[] = [];
  if (rank) {
    const top = filters?.top ?? 5;
    parts.push(`Top ${top}, ${filters?.order === "asc" ? "lowest" : "highest"} first`);
  }
  if (filters?.log_date) {
    parts.push(`Snapshot · ${dayjs(filters.log_date).format("D MMM YYYY")}`);
  } else if (filters?.from_date_time && filters?.to_date_time) {
    const from = dayjs(filters.from_date_time).tz(DEFAULT_TIMEZONE);
    const to = dayjs(filters.to_date_time).tz(DEFAULT_TIMEZONE);
    const sameYear = from.year() === to.year();
    const sameMonth = sameYear && from.month() === to.month();
    const start = from.format(sameMonth ? "D" : sameYear ? "D MMM" : "D MMM YYYY");
    parts.push(from.isSame(to, "day") ? to.format("D MMM YYYY") : `${start} – ${to.format("D MMM YYYY")}`);
  }
  return parts.join(" · ");
};

export const getChartHeight = (entries: number) => {
  const defaultHeight = 350;
  const addedHeightPerEntry = 35;
  return entries <= 10
    ? defaultHeight
    : defaultHeight + (entries - 10) * addedHeightPerEntry;
};

export const processDateLabels = (entries: StatisticsChartEntry[], selectedUnit?: string) => {
  if (entries.length === 0) return [];
  const first = entries[0];
  const last = entries[entries.length - 1];

  // A summary (no unit) has a count but no bucket date; do not manufacture a year.
  const unit = selectedUnit ?? ('date' in first ? 'day' : 'week' in first ? 'week' : 'month' in first ? 'month' : 'quarter' in first ? 'quarter' : 'year' in first ? 'year' : '');
  if (!unit) return entries.map((entry) => ({ ...entry, label: 'Current' }));

  let current = dayjs().year(Number(first.year));
  let end = dayjs().year(Number(last.year));

  if (unit === 'day') {
    if (!first.date || !last.date) return entries;
    current = dayjs(String(first.date));
    end = dayjs(String(last.date));
  } else if (unit === 'week') {
    if (first.year == null || first.week == null || last.year == null || last.week == null) return entries;
    current = dayjs(`${first.year}-01-04`).startOf('isoWeek').add(Number(first.week) - 1, 'week');
    end = dayjs(`${last.year}-01-04`).startOf('isoWeek').add(Number(last.week) - 1, 'week');
  } else if (unit === 'month') {
    if (first.year == null || first.month == null || last.year == null || last.month == null) return entries;
    current = dayjs()
      .year(Number(first.year))
      .month(Number(first.month) - 1);
    end = dayjs()
      .year(Number(last.year))
      .month(Number(last.month) - 1);
  } else if (unit === 'quarter') {
    if (first.year == null || first.quarter == null || last.year == null || last.quarter == null) return entries;
    current = dayjs().year(Number(first.year)).quarter(Number(first.quarter));
    end = dayjs().year(Number(last.year)).quarter(Number(last.quarter));
  } else if (first.year == null || last.year == null) {
    return entries;
  }

  if (!current.isValid() || !end.isValid()) return entries;

  const entryMap = new Map<string, StatisticsChartEntry>();
  for (const entry of entries) {
    const key =
      unit === "day"
        ? String(entry.date)
        : unit === "week"
          ? `${entry.year}-W${entry.week}`
          : unit === "month"
            ? `${entry.year}-${entry.month}`
            : unit === "quarter"
              ? `${entry.year}-Q${entry.quarter}`
              : `${entry.year}`;
    entryMap.set(key, entry);
  }

  const result: StatisticsChartEntry[] = [];
  while (current.isSameOrBefore(end, unit as OpUnitType)) {
    let entry: StatisticsChartEntry;
    let label: string;

    if (unit === "day") {
      const key = current.format("YYYY-MM-DD");
      entry = entryMap.get(key) ?? { count: 0, date: key };
      label = current.format("MM/DD/YYYY");
    } else if (unit === "week") {
      const year = current.isoWeekYear();
      const week = current.isoWeek();
      const key = `${year}-W${week}`;
      entry = entryMap.get(key) ?? { count: 0, week, year };
      label = `W${week}/${year}`;
    } else if (unit === "month") {
      const year = current.year();
      const month = current.month() + 1;
      const key = `${year}-${month}`;
      entry = entryMap.get(key) ?? { count: 0, month, year };
      label = `${current.format("MM")}/${year}`;
    } else if (unit === "quarter") {
      const year = current.year();
      const quarter = current.quarter();
      const key = `${year}-Q${quarter}`;
      entry = entryMap.get(key) ?? { count: 0, quarter, year };
      label = `Q${quarter}/${year}`;
    } else {
      const year = current.year();
      const key = `${year}`;
      entry = entryMap.get(key) ?? { count: 0, year };
      label = key;
    }

    result.push({ ...entry, label });
    current = current.add(1, unit as ManipulateType);
  }

  return result;
};

export const generateInterval = (dataSize: number) => {
  if (dataSize <= 7) return 0;
  if (dataSize <= 14) return 1;
  if (dataSize <= 30) return 2;
  if (dataSize <= 60) return 4;
  if (dataSize <= 100) return 6;
  if (dataSize <= 180) return 10;
  if (dataSize <= 365) return 15;
  return 30;
};

export const analyticsColumnIndex = {
  labGroup: [
    { title: "Lab Group", dataIndex: "lab_group_name" },
    { title: "Entries", dataIndex: "entries" },
  ],
  labEquipmentStatus: [
    { title: "Status Type", dataIndex: "status_type" },
    { title: "Entries", dataIndex: "entries" },
  ],
  labEfficiency: [
    { title: "Lab Name", dataIndex: "lab_name" },
    { title: "Computer Name", dataIndex: "computer_name" },
    { title: "Efficiency", dataIndex: "efficiency" },
    { title: "Bookings", dataIndex: "booking" },
  ],
  projectUsage: [
    { title: "Project Name", dataIndex: "project_name" },
    { title: "Usage", dataIndex: "usage" },
  ],
  userByLabUsage: [
    { title: "Remote User", dataIndex: "remote_user" },
    { title: "Usage", dataIndex: "usage" },
  ],
  userByBookingEfficiency: [
    { title: "Remote User", dataIndex: "remote_user" },
    { title: "Efficiency", dataIndex: "efficiency" },
  ],
  labUsageByTimeframe: [
    { title: "Timeslot", dataIndex: "timeslot" },
    { title: "Usage", dataIndex: "usage" },
  ],
  userStorageQuota: [
    { title: "User", dataIndex: "username" },
    { title: "Used", dataIndex: "used" },
    { title: "Quota", dataIndex: "quota" },
  ],
  statistics: [
    { title: "Year", dataIndex: "year" },
    { title: "Quarter", dataIndex: "quarter" },
    { title: "Month", dataIndex: "month" },
    { title: "Week", dataIndex: "week" },
    { title: "Date", dataIndex: "date" },
    { title: "Count", dataIndex: "count" },
  ],
};

const [_weekStart, _weekEnd] = PERIOD.LAST_WEEK.split(" - ");

export const DEFAULT_DURATION: ChartDurationParams = {
  from_date_time: dayjs.tz(_weekStart, DEFAULT_TIMEZONE).startOf("day").format(),
  to_date_time: dayjs.tz(_weekEnd, DEFAULT_TIMEZONE).endOf("day").format(),
  top: 5,
  order: "desc",
};

export const DEFAULT_DATE: ChartDateParams = {
  log_date: getNearestLastWeekday(2).format('YYYY-MM-DD'),
  top: 12,
  order: "desc",
};
