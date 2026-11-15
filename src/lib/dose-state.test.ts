import { describe, it, expect } from "vitest";
import { evaluateDoseState } from "./dose-state";

describe("evaluateDoseState", () => {
  const targetDateStr = "2026-11-15";
  const targetTimeStr = "08:30:00";

  it("returns UPCOMING when current time is 1 hour before scheduled time", () => {
    const currentTime = new Date(2026, 10, 15, 7, 30, 0); // 07:30 AM
    const status = evaluateDoseState({
      targetDateStr,
      targetTimeStr,
      currentTime,
    });
    expect(status).toBe("UPCOMING");
  });

  it("returns DUE when current time is 15 minutes before scheduled time", () => {
    const currentTime = new Date(2026, 10, 15, 8, 15, 0); // 08:15 AM
    const status = evaluateDoseState({
      targetDateStr,
      targetTimeStr,
      currentTime,
    });
    expect(status).toBe("DUE");
  });

  it("returns TAKEN when explicit TAKEN status is already logged", () => {
    const currentTime = new Date(2026, 10, 15, 9, 30, 0); // 09:30 AM
    const status = evaluateDoseState({
      targetDateStr,
      targetTimeStr,
      currentTime,
      existingStatus: "TAKEN",
    });
    expect(status).toBe("TAKEN");
  });

  it("returns OVERDUE when window elapsed without confirmation (e.g. 45 min after scheduled time)", () => {
    const currentTime = new Date(2026, 10, 15, 9, 15, 0); // 09:15 AM (+45m)
    const status = evaluateDoseState({
      targetDateStr,
      targetTimeStr,
      currentTime,
      existingStatus: null,
    });
    expect(status).toBe("OVERDUE");
  });

  it("returns UNCONFIRMED when more than 2 hours overdue without action", () => {
    const currentTime = new Date(2026, 10, 15, 11, 0, 0); // 11:00 AM (+150m)
    const status = evaluateDoseState({
      targetDateStr,
      targetTimeStr,
      currentTime,
      existingStatus: null,
    });
    expect(status).toBe("UNCONFIRMED");
  });
});
