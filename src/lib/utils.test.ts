import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("combines class names correctly", () => {
    expect(cn("bg-green-500", "text-white")).toBe("bg-green-500 text-white");
  });

  it("handles conditional classes", () => {
    const isTaken = true;
    const isOverdue = false;
    expect(cn("p-4", isTaken && "border-green-600", isOverdue && "border-red-600")).toBe(
      "p-4 border-green-600"
    );
  });

  it("merges conflicting tailwind classes", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});
