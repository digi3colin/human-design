import { describe, expect, test } from "bun:test";
import { calculateHumanDesign } from "natalengine";

const HONG_KONG_OFFSET = 8;
const birthDate = "1977-12-13";

const cases = [
  {
    label: "01:30",
    birthHour: 1.5,
    designDateTime: "1977-09-15T21:29",
    sun: [47, 6],
    earth: [22, 6],
    moon: [57, 6]
  },
  {
    label: "01:45",
    birthHour: 1.75,
    designDateTime: "1977-09-15T21:44",
    sun: [47, 6],
    earth: [22, 6],
    moon: [57, 6]
  },
  {
    label: "02:00",
    birthHour: 2,
    designDateTime: "1977-09-15T22:00",
    sun: [47, 6],
    earth: [22, 6],
    moon: [32, 1]
  }
];

describe("Human Design solar-arc calculation", () => {
  for (const expected of cases) {
    test(`keeps the ${expected.label} Hong Kong chart on the correct design minute`, () => {
      const chart = calculateHumanDesign(birthDate, expected.birthHour, HONG_KONG_OFFSET);
      const design = chart.gates.design;
      const solarArc =
        (chart.positions.personality.sun.longitude - chart.positions.design.sun.longitude + 360) % 360;

      expect(chart.positions.design.dateTime).toBe(expected.designDateTime);
      expect([design.sun.gate, design.sun.line]).toEqual(expected.sun);
      expect([design.earth.gate, design.earth.line]).toEqual(expected.earth);
      expect([design.moon.gate, design.moon.line]).toEqual(expected.moon);
      expect(Math.abs(solarArc - 88)).toBeLessThan(0.001);
    });
  }

  test("moves the design moment continuously as birth time advances", () => {
    const designMinutes = cases.map(({ birthHour }) => {
      const dateTime = calculateHumanDesign(birthDate, birthHour, HONG_KONG_OFFSET).positions.design.dateTime;
      return Date.parse(`${dateTime}Z`) / 60000;
    });

    expect(designMinutes[1] - designMinutes[0]).toBe(15);
    expect(designMinutes[2] - designMinutes[1]).toBe(16);
  });
});
