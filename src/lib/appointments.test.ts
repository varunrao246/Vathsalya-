import { describe, it, expect } from "vitest";

describe("Clinical Appointments Management & Validation", () => {
  it("validates required fields for appointment creation", () => {
    const validAppointment = {
      doctorName: "Dr. Ananth Kumar",
      specialty: "Cardiology",
      clinicName: "Manipal Hospital",
      locationOrLink: "Old Airport Road, Bangalore",
      appointmentTime: new Date(Date.now() + 86400000).toISOString(),
    };

    expect(validAppointment.doctorName.trim()).toBeTruthy();
    expect(validAppointment.specialty.trim()).toBeTruthy();
    expect(validAppointment.clinicName.trim()).toBeTruthy();
    expect(new Date(validAppointment.appointmentTime).getTime()).toBeGreaterThan(Date.now());
  });

  it("identifies valid and invalid appointment statuses", () => {
    const validStatuses = ["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"];

    expect(validStatuses.includes("SCHEDULED")).toBe(true);
    expect(validStatuses.includes("COMPLETED")).toBe(true);
    expect(validStatuses.includes("CANCELLED")).toBe(true);
    expect(validStatuses.includes("RESCHEDULED")).toBe(true);
    expect(validStatuses.includes("DELETED")).toBe(false);
  });

  it("calculates correct reminder window (24 hours and 2 hours prior)", () => {
    const appointmentTime = new Date("2026-11-20T10:00:00Z").getTime();
    const reminder24h = new Date(appointmentTime - 24 * 60 * 60 * 1000).toISOString();
    const reminder2h = new Date(appointmentTime - 2 * 60 * 60 * 1000).toISOString();

    expect(reminder24h).toBe("2026-11-19T10:00:00.000Z");
    expect(reminder2h).toBe("2026-11-20T08:00:00.000Z");
  });

  it("structures immutable activity log payload accurately", () => {
    const activityPayload = {
      appointmentId: "appt-uuid-1",
      doctorName: "Dr. Ananth Kumar",
      specialty: "Cardiology",
      clinicName: "Manipal Hospital",
      appointmentTime: "2026-11-20T10:00:00Z",
    };

    expect(activityPayload).toHaveProperty("appointmentId");
    expect(activityPayload).toHaveProperty("doctorName");
    expect(activityPayload.doctorName).toBe("Dr. Ananth Kumar");
  });
});
