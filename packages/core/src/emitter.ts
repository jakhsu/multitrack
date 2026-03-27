import type {
  TimelineEventMap,
  TimelineEventType,
  TimelineEventHandler,
} from "./types.js";

/**
 * Minimal typed event emitter for timeline events.
 */
export class Emitter {
  private listeners = new Map<
    TimelineEventType,
    Set<TimelineEventHandler<any>>
  >();

  on<T extends TimelineEventType>(
    event: T,
    handler: TimelineEventHandler<T>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  emit<T extends TimelineEventType>(
    event: T,
    payload: TimelineEventMap[T],
  ): void {
    this.listeners.get(event)?.forEach((handler) => handler(payload));
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
