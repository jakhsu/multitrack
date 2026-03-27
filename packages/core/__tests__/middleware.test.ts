import { describe, it, expect, vi } from "vitest";
import { MiddlewareChain, type MiddlewareEvent } from "../src/middleware.js";

describe("MiddlewareChain", () => {
  const enterEvent: MiddlewareEvent = {
    type: "step:enter",
    payload: { name: "intro", track: "main", start: 0, end: 3 },
  };

  const exitEvent: MiddlewareEvent = {
    type: "step:exit",
    payload: { name: "intro", track: "main", start: 0, end: 3 },
  };

  it("executes finalAction when no middleware is registered", () => {
    const chain = new MiddlewareChain();
    const finalAction = vi.fn();

    chain.run(enterEvent, finalAction);

    expect(finalAction).toHaveBeenCalledOnce();
  });

  it("passes event through when middleware calls next()", () => {
    const chain = new MiddlewareChain();
    const middleware = vi.fn((event, next) => next());
    const finalAction = vi.fn();

    chain.add(middleware);
    chain.run(enterEvent, finalAction);

    expect(middleware).toHaveBeenCalledWith(enterEvent, expect.any(Function));
    expect(finalAction).toHaveBeenCalledOnce();
  });

  it("swallows event when middleware does not call next()", () => {
    const chain = new MiddlewareChain();
    const middleware = vi.fn((_event, _next) => {
      // intentionally not calling next()
    });
    const finalAction = vi.fn();

    chain.add(middleware);
    chain.run(enterEvent, finalAction);

    expect(middleware).toHaveBeenCalledOnce();
    expect(finalAction).not.toHaveBeenCalled();
  });

  it("executes multiple middleware in registration order", () => {
    const chain = new MiddlewareChain();
    const order: number[] = [];

    chain.add((_event, next) => { order.push(1); next(); });
    chain.add((_event, next) => { order.push(2); next(); });
    chain.add((_event, next) => { order.push(3); next(); });

    chain.run(enterEvent, () => order.push(4));

    expect(order).toEqual([1, 2, 3, 4]);
  });

  it("stops chain when middle middleware does not call next()", () => {
    const chain = new MiddlewareChain();
    const order: number[] = [];

    chain.add((_event, next) => { order.push(1); next(); });
    chain.add((_event, _next) => { order.push(2); /* swallow */ });
    chain.add((_event, next) => { order.push(3); next(); });

    chain.run(enterEvent, () => order.push(4));

    expect(order).toEqual([1, 2]); // 3 and 4 never reached
  });

  it("removes middleware via returned unsubscribe function", () => {
    const chain = new MiddlewareChain();
    const middleware = vi.fn((_event, next) => next());
    const finalAction = vi.fn();

    const remove = chain.add(middleware);
    remove();

    chain.run(enterEvent, finalAction);

    expect(middleware).not.toHaveBeenCalled();
    expect(finalAction).toHaveBeenCalledOnce();
  });

  it("receives correct event type for enter and exit", () => {
    const chain = new MiddlewareChain();
    const events: MiddlewareEvent[] = [];

    chain.add((event, next) => { events.push(event); next(); });

    chain.run(enterEvent, vi.fn());
    chain.run(exitEvent, vi.fn());

    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("step:enter");
    expect(events[1].type).toBe("step:exit");
    expect(events[0].payload.name).toBe("intro");
  });

  it("clears all middleware", () => {
    const chain = new MiddlewareChain();
    const middleware = vi.fn((_event, next) => next());

    chain.add(middleware);
    chain.clear();
    chain.run(enterEvent, vi.fn());

    expect(middleware).not.toHaveBeenCalled();
  });
});
