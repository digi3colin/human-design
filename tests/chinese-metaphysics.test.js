import { describe, expect, test } from "bun:test";
import { calculateChineseMetaphysics, calculateMingGua } from "../src/chinese-metaphysics.js";

describe("八字 calculation", () => {
  test("calculates the 1977-12-13 01:45 Hong Kong Four Pillars", () => {
    const result = calculateChineseMetaphysics("1977-12-13", "01:45", "male", 8);

    expect(result.bazi.value).toBe("丁巳 壬子 甲辰 乙丑");
    expect(result.bazi.dayMaster).toEqual({ stem: "甲", element: "木", polarity: "陽" });
    expect(result.bazi.lunarDate).toBe("一九七七年冬月初三");
    expect(result.solarTerms.liChunLocal).toBe("1977-02-04 06:33");
  });

  test("converts the exact 立春 boundary to the birthplace offset", () => {
    const before = calculateChineseMetaphysics("2024-02-04", "03:20", "male", -5);
    const after = calculateChineseMetaphysics("2024-02-04", "03:30", "male", -5);

    expect(before.solarTerms.liChunLocal).toBe("2024-02-04 03:27");
    expect(before.bazi.pillars[0].value).toBe("癸卯");
    expect(before.bazi.pillars[1].value).toBe("乙丑");
    expect(after.bazi.pillars[0].value).toBe("甲辰");
    expect(after.bazi.pillars[1].value).toBe("丙寅");
  });
});

describe("八宅本命卦 calculation", () => {
  test("uses the traditional sex-specific result and five-to-palace rule", () => {
    expect(calculateMingGua(1977, "male")).toMatchObject({ number: 2, name: "坤", group: "西四命" });
    expect(calculateMingGua(1977, "female")).toMatchObject({ number: 1, name: "坎", group: "東四命" });
    expect(calculateMingGua(2000, "male")).toMatchObject({ number: 9, name: "離" });
    expect(calculateMingGua(2000, "female")).toMatchObject({ number: 6, name: "乾" });
  });
});
