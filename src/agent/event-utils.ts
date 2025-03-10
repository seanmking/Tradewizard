import { EventSystem, EventType, EventPriority, Event } from './event-system';

/**
 * Utility functions for working with the Event System.
 */

/**
 * Publishes a business-specific event.
 */
export async function publishBusinessEvent(
  eventSystem: EventSystem,
  businessId: string,
  type: EventType,
  payload: any,
  priority: EventPriority = EventPriority.MEDIUM
): Promise<string> {
  return eventSystem.publish({
    type,
    source: 'BusinessEventUtil',
    priority,
    businessId,
    payload
  });
}

/**
 * Publishes a system-wide event (not specific to a business).
 */
export async function publishSystemEvent(
  eventSystem: EventSystem,
  type: EventType,
  payload: any,
  priority: EventPriority = EventPriority.MEDIUM
): Promise<string> {
  return eventSystem.publish({
    type,
    source: 'SystemEventUtil',
    priority,
    payload
  });
}

/**
 * Creates a filter function for events related to a specific business.
 */
export function createBusinessFilter(businessId: string): (event: Event) => boolean {
  return (event: Event) => event.businessId === businessId;
}

/**
 * Creates a filter function for events with a minimum priority level.
 */
export function createPriorityFilter(minPriority: EventPriority): (event: Event) => boolean {
  const priorities = [
    EventPriority.LOW,
    EventPriority.MEDIUM,
    EventPriority.HIGH,
    EventPriority.CRITICAL
  ];
  
  const minIndex = priorities.indexOf(minPriority);
  
  return (event: Event) => {
    const eventPriorityIndex = priorities.indexOf(event.priority);
    return eventPriorityIndex >= minIndex;
  };
}

/**
 * Creates a combined filter function from multiple filter functions.
 */
export function combineFilters(...filters: ((event: Event) => boolean)[]): (event: Event) => boolean {
  return (event: Event) => filters.every(filter => filter(event));
}

/**
 * Creates a filter function for events of specific types.
 */
export function createEventTypeFilter(types: EventType[]): (event: Event) => boolean {
  return (event: Event) => types.includes(event.type);
}

/**
 * Creates a filter function for events with a specific source.
 */
export function createSourceFilter(source: string): (event: Event) => boolean {
  return (event: Event) => event.source === source;
}

/**
 * Creates a filter function for events with a payload matching a predicate.
 */
export function createPayloadFilter(predicate: (payload: any) => boolean): (event: Event) => boolean {
  return (event: Event) => predicate(event.payload);
} 