import lunarPackage from "lunar-javascript";

const { LunarUtil, Solar } = lunarPackage;

const GAN = [..."甲乙丙丁戊己庚辛壬癸"];
const ZHI = [..."子丑寅卯辰巳午未申酉戌亥"];
const CHINA_STANDARD_OFFSET = 8;

const MING_GUA = {
  1: { name: "坎", symbol: "☵", element: "水", direction: "北", group: "東四命", english: "Kan" },
  2: { name: "坤", symbol: "☷", element: "土", direction: "西南", group: "西四命", english: "Kun" },
  3: { name: "震", symbol: "☳", element: "木", direction: "東", group: "東四命", english: "Zhen" },
  4: { name: "巽", symbol: "☴", element: "木", direction: "東南", group: "東四命", english: "Xun" },
  6: { name: "乾", symbol: "☰", element: "金", direction: "西北", group: "西四命", english: "Qian" },
  7: { name: "兌", symbol: "☱", element: "金", direction: "西", group: "西四命", english: "Dui" },
  8: { name: "艮", symbol: "☶", element: "土", direction: "東北", group: "西四命", english: "Gen" },
  9: { name: "離", symbol: "☲", element: "火", direction: "南", group: "東四命", english: "Li" },
};

const PILLAR_LABELS = {
  year: ["年柱", "Year"],
  month: ["月柱", "Month"],
  day: ["日柱", "Day"],
  time: ["時柱", "Hour"],
};

export function calculateChineseMetaphysics(date, time, sex, utcOffset) {
  if (!["male", "female"].includes(sex)) {
    throw new Error("Choose male or female for the traditional 本命卦 calculation.");
  }
  if (!Number.isFinite(utcOffset)) throw new Error("A valid UTC offset is required for solar-term boundaries.");

  const localParts = parseLocalMoment(date, time);
  const localSolar = Solar.fromYmdHms(...localParts, 0);
  const localLunar = localSolar.getLunar();
  const localEightChar = localLunar.getEightChar();

  // lunar-javascript publishes Chinese solar-term timestamps in UTC+8. Shift
  // the entered civil moment to its UTC+8 equivalent before selecting the
  // exact year and month pillars, then retain local civil day/hour pillars.
  const termParts = shiftLocalMoment(date, time, CHINA_STANDARD_OFFSET - utcOffset);
  const termSolar = Solar.fromYmdHms(...termParts, 0);
  const termLunar = termSolar.getLunar();
  const termEightChar = termLunar.getEightChar();

  const rawPillars = [
    ["year", termEightChar.getYear()],
    ["month", termEightChar.getMonth()],
    ["day", localEightChar.getDay()],
    ["time", localEightChar.getTime()],
  ];
  const dayMaster = localEightChar.getDayGan();
  const pillars = rawPillars.map(([key, value]) => buildPillar(key, value, dayMaster));
  const effectiveYear = resolveGanZhiYear(termEightChar.getYear(), localParts[0]);
  const liChun = termLunar.getJieQiTable()["立春"];

  return {
    bazi: {
      value: pillars.map((pillar) => pillar.value).join(" "),
      pillars,
      dayMaster: {
        stem: dayMaster,
        element: LunarUtil.WU_XING_GAN[dayMaster],
        polarity: GAN.indexOf(dayMaster) % 2 === 0 ? "陽" : "陰",
      },
      lunarDate: localLunar.toString(),
      zodiac: LunarUtil.SHENGXIAO[ZHI.indexOf(termEightChar.getYearZhi()) + 1],
      sect: 2,
    },
    mingGua: calculateMingGua(effectiveYear, sex),
    solarTerms: {
      boundary: "立春",
      liChunLocal: liChun ? chinaTimeToLocal(liChun, utcOffset) : "—",
      effectiveYear,
    },
  };
}

export function calculateMingGua(year, sex) {
  const number = calculateMingGuaNumber(year, sex);
  return {
    ...MING_GUA[number],
    number,
    sex,
    sexLabel: sex === "male" ? "男命" : "女命",
    year,
  };
}

function calculateMingGuaNumber(year, sex) {
  if (!Number.isInteger(year) || !["male", "female"].includes(sex)) return NaN;

  const yearRoot = digitRoot(year);
  let number = sex === "male" ? digitRoot(11 - yearRoot) : digitRoot(4 + yearRoot);
  if (number === 5) number = sex === "male" ? 2 : 8;
  return number;
}

function buildPillar(key, value, dayMaster) {
  const gan = value[0];
  const zhi = value[1];
  const hiddenStems = LunarUtil.ZHI_HIDE_GAN[zhi] || [];

  return {
    key,
    label: PILLAR_LABELS[key][0],
    english: PILLAR_LABELS[key][1],
    value,
    gan,
    zhi,
    ganElement: LunarUtil.WU_XING_GAN[gan],
    zhiElement: LunarUtil.WU_XING_ZHI[zhi],
    tenGod: key === "day" ? "日主" : LunarUtil.SHI_SHEN[dayMaster + gan],
    hiddenStems,
    hiddenTenGods: hiddenStems.map((stem) => LunarUtil.SHI_SHEN[dayMaster + stem]),
    naYin: LunarUtil.NAYIN[value],
    xunKong: LunarUtil.getXunKong(value),
  };
}

function parseLocalMoment(date, time) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return [year, month, day, hour, minute];
}

function shiftLocalMoment(date, time, hours) {
  const [year, month, day, hour, minute] = parseLocalMoment(date, time);
  const shifted = new Date(Date.UTC(year, month - 1, day, hour, minute) + hours * 60 * 60 * 1000);
  return [
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
    shifted.getUTCHours(),
    shifted.getUTCMinutes(),
  ];
}

function chinaTimeToLocal(solar, utcOffset) {
  const milliseconds =
    Date.UTC(
      solar.getYear(),
      solar.getMonth() - 1,
      solar.getDay(),
      solar.getHour(),
      solar.getMinute(),
      solar.getSecond(),
    ) +
    (utcOffset - CHINA_STANDARD_OFFSET) * 60 * 60 * 1000;
  const local = new Date(milliseconds).toISOString();
  return `${local.slice(0, 10)} ${local.slice(11, 16)}`;
}

function resolveGanZhiYear(ganZhi, nearbyYear) {
  return [nearbyYear - 1, nearbyYear, nearbyYear + 1].find((year) => ganZhiForYear(year) === ganZhi) ?? nearbyYear;
}

function ganZhiForYear(year) {
  const offset = modulo(year - 4, 60);
  return GAN[offset % 10] + ZHI[offset % 12];
}

function digitRoot(value) {
  const positive = Math.abs(value);
  return positive === 0 ? 9 : ((positive - 1) % 9) + 1;
}

function modulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}
