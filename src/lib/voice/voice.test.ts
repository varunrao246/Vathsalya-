import { describe, it, expect } from "vitest";
import { classifyVoiceIntent } from "@/app/api/voice/process/route";

describe("VATSALYA Real Voice Medication Assistant Suite", () => {
  it("classifies Kannada affirmative statements as TAKEN", () => {
    expect(classifyVoiceIntent("ಹೌದು, ಮಾತ್ರೆ ತಗೊಂಡೆ")).toBe("TAKEN");
    expect(classifyVoiceIntent("ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ")).toBe("TAKEN");
    expect(classifyVoiceIntent("ಆಗಿದೆ")).toBe("TAKEN");
    expect(classifyVoiceIntent("ಹೌದು")).toBe("TAKEN");
  });

  it("classifies English affirmative statements as TAKEN", () => {
    expect(classifyVoiceIntent("Yes, I have taken it")).toBe("TAKEN");
    expect(classifyVoiceIntent("I took my tablet with water")).toBe("TAKEN");
    expect(classifyVoiceIntent("Already done")).toBe("TAKEN");
    expect(classifyVoiceIntent("yes")).toBe("TAKEN");
  });

  it("classifies Kannada negative statements as NOT_TAKEN", () => {
    expect(classifyVoiceIntent("ಇಲ್ಲ, ಇನ್ನು ಇಲ್ಲ")).toBe("NOT_TAKEN");
    expect(classifyVoiceIntent("ತೆಗೆದುಕೊಂಡಿಲ್ಲ")).toBe("NOT_TAKEN");
    expect(classifyVoiceIntent("ಇಲ್ಲ")).toBe("NOT_TAKEN");
  });

  it("classifies English negative statements as NOT_TAKEN", () => {
    expect(classifyVoiceIntent("No, I haven't taken it")).toBe("NOT_TAKEN");
    expect(classifyVoiceIntent("Not yet")).toBe("NOT_TAKEN");
    expect(classifyVoiceIntent("I did not take the tablet")).toBe("NOT_TAKEN");
    expect(classifyVoiceIntent("no")).toBe("NOT_TAKEN");
  });

  it("classifies snooze and delay statements as SNOOZE in both languages", () => {
    expect(classifyVoiceIntent("Remind me later")).toBe("SNOOZE");
    expect(classifyVoiceIntent("after 15 minutes please")).toBe("SNOOZE");
    expect(classifyVoiceIntent("ನಂತರ ನೆನಪಿಸಿ")).toBe("SNOOZE");
    expect(classifyVoiceIntent("ಆಮೇಲೆ")).toBe("SNOOZE");
  });

  it("classifies emergency and help requests as HELP in both languages", () => {
    expect(classifyVoiceIntent("I need help")).toBe("HELP");
    expect(classifyVoiceIntent("Feeling dizzy, call doctor")).toBe("HELP");
    expect(classifyVoiceIntent("ನನಗೆ ಸಹಾಯ ಬೇಕು")).toBe("HELP");
    expect(classifyVoiceIntent("ತುಂಬಾ ನೋವು")).toBe("HELP");
  });

  it("returns UNKNOWN for unparseable chatter without false positives", () => {
    expect(classifyVoiceIntent("The weather is nice today")).toBe("UNKNOWN");
    expect(classifyVoiceIntent("Where is the newspaper")).toBe("UNKNOWN");
  });
});
