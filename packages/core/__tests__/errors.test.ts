import { describe, it, expect } from "vitest";
import {
  MultitrackError,
  stepNotFound,
  emptyConfig,
  duplicateStepName,
} from "../src/errors.js";

describe("MultitrackError", () => {
  it("has correct code and message", () => {
    const err = new MultitrackError("TEST_CODE", "test message");
    expect(err.code).toBe("TEST_CODE");
    expect(err.message).toBe("[@multitrack] TEST_CODE: test message");
    expect(err.name).toBe("MultitrackError");
    expect(err instanceof Error).toBe(true);
  });
});

describe("error factories", () => {
  it("stepNotFound includes step name", () => {
    const err = stepNotFound("myStep");
    expect(err.code).toBe("STEP_NOT_FOUND");
    expect(err.message).toContain("myStep");
  });

  it("emptyConfig produces correct error", () => {
    const err = emptyConfig();
    expect(err.code).toBe("EMPTY_CONFIG");
  });

  it("duplicateStepName includes the name", () => {
    const err = duplicateStepName("intro");
    expect(err.code).toBe("DUPLICATE_STEP_NAME");
    expect(err.message).toContain("intro");
  });
});
