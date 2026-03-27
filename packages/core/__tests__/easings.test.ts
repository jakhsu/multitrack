import { describe, it, expect } from "vitest";
import {
  snap,
  linear,
  easeIn,
  easeOut,
  easeInOut,
  resolveEasing,
} from "../src/easings.js";

describe("easing functions", () => {
  it("snap always returns 1", () => {
    expect(snap(0)).toBe(1);
    expect(snap(0.5)).toBe(1);
    expect(snap(1)).toBe(1);
  });

  it("linear returns input unchanged", () => {
    expect(linear(0)).toBe(0);
    expect(linear(0.5)).toBe(0.5);
    expect(linear(1)).toBe(1);
  });

  it("easeIn starts slow (below linear)", () => {
    expect(easeIn(0.5)).toBeLessThan(0.5);
    expect(easeIn(0)).toBe(0);
    expect(easeIn(1)).toBe(1);
  });

  it("easeOut starts fast (above linear)", () => {
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
  });

  it("easeInOut is symmetric", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBeCloseTo(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    // First half is below linear, second half above
    expect(easeInOut(0.25)).toBeLessThan(0.25);
    expect(easeInOut(0.75)).toBeGreaterThan(0.75);
  });
});

describe("resolveEasing", () => {
  it("returns snap for undefined", () => {
    const fn = resolveEasing(undefined);
    expect(fn(0.5)).toBe(1);
  });

  it("returns correct preset by name", () => {
    expect(resolveEasing("linear")(0.5)).toBe(0.5);
    expect(resolveEasing("snap")(0.5)).toBe(1);
  });

  it("passes through custom functions", () => {
    const custom = (t: number) => t * t * t;
    expect(resolveEasing(custom)).toBe(custom);
  });
});
