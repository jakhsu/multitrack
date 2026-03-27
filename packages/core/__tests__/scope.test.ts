import { describe, it, expect, vi, beforeEach } from "vitest";
import { Scope } from "../src/scope.js";
import { Emitter } from "../src/emitter.js";

describe("Scope", () => {
  it("collects and disposes all tracked functions", () => {
    const scope = new Scope();
    const fn1 = vi.fn();
    const fn2 = vi.fn();

    scope.add(fn1);
    scope.add(fn2);
    expect(scope.size).toBe(2);

    scope.dispose();

    expect(fn1).toHaveBeenCalledOnce();
    expect(fn2).toHaveBeenCalledOnce();
    expect(scope.size).toBe(0);
  });

  it("disposes in reverse order (LIFO)", () => {
    const scope = new Scope();
    const order: number[] = [];

    scope.add(() => order.push(1));
    scope.add(() => order.push(2));
    scope.add(() => order.push(3));

    scope.dispose();

    expect(order).toEqual([3, 2, 1]);
  });

  it("is idempotent — second dispose is a no-op", () => {
    const scope = new Scope();
    const fn = vi.fn();
    scope.add(fn);

    scope.dispose();
    scope.dispose();

    expect(fn).toHaveBeenCalledOnce();
  });
});

describe("Scope + Emitter integration", () => {
  // Test the scope collection pattern without needing Timeline (which needs window)
  // This validates the same logic that Timeline.scope() uses

  it("collects emitter subscriptions and disposes them", () => {
    const emitter = new Emitter();
    const scope = new Scope();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    // Simulate what Timeline.on() does inside a scope
    const unsub1 = emitter.on("scroll", handler1);
    scope.add(unsub1);
    const unsub2 = emitter.on("step:enter", handler2);
    scope.add(unsub2);

    // Handlers fire before dispose
    emitter.emit("scroll", { scrollPercentage: 0.5, currentStep: 2 });
    emitter.emit("step:enter", { name: "intro", track: "main", start: 0, end: 3 });
    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();

    // After dispose, handlers should not fire
    scope.dispose();
    emitter.emit("scroll", { scrollPercentage: 0.8, currentStep: 4 });
    emitter.emit("step:enter", { name: "content", track: "main", start: 3, end: 8 });
    expect(handler1).toHaveBeenCalledOnce(); // still 1 — not called again
    expect(handler2).toHaveBeenCalledOnce();
  });

  it("does not capture subscriptions created outside the scope", () => {
    const emitter = new Emitter();
    const scope = new Scope();
    const outside = vi.fn();
    const inside = vi.fn();

    // Outside the scope
    emitter.on("scroll", outside);

    // Inside the scope
    const unsub = emitter.on("step:enter", inside);
    scope.add(unsub);

    expect(scope.size).toBe(1);
    scope.dispose();

    // Outside handler still fires, inside doesn't
    emitter.emit("scroll", { scrollPercentage: 0.5, currentStep: 2 });
    emitter.emit("step:enter", { name: "intro", track: "main", start: 0, end: 3 });
    expect(outside).toHaveBeenCalledOnce();
    expect(inside).not.toHaveBeenCalled();
  });

  it("supports nested scopes without cross-capture", () => {
    const emitter = new Emitter();

    // Simulate Timeline.scope() nesting logic
    let activeScope: Scope | null = null;

    function scopedOn(event: any, handler: any): () => void {
      const unsub = emitter.on(event, handler);
      activeScope?.add(unsub);
      return unsub;
    }

    function createScope(fn: () => void): Scope {
      const scope = new Scope();
      const prev = activeScope;
      activeScope = scope;
      try { fn(); } finally { activeScope = prev; }
      return scope;
    }

    const outer = createScope(() => {
      scopedOn("scroll", vi.fn());

      const inner = createScope(() => {
        scopedOn("step:enter", vi.fn());
        scopedOn("step:exit", vi.fn());
      });

      expect(inner.size).toBe(2);
      inner.dispose();
    });

    expect(outer.size).toBe(1);
    outer.dispose();
  });
});
