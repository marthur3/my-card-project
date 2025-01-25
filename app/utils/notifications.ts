import { Contact, Event } from '../types/types';

export const checkUpcomingEvents = (contacts: Contact[]) => {
  const today = new Date();
  const twoWeeksFromNow = new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000));
  const notifications = [];

  contacts.forEach(contact => {
    // Add null check for events
    if (contact.events && Array.isArray(contact.events)) {
      contact.events.forEach(event => {
        const nextOccurrence = getNextOccurrence(event);
        if (nextOccurrence <= twoWeeksFromNow && nextOccurrence > today) {
          notifications.push({
            contactId: contact.id,
            contactName: contact.name,
            eventType: event.type,
            eventDate: nextOccurrence,
            daysUntil: Math.ceil((nextOccurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          });
        }
      });
    }
  });

  return notifications.sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
};

export const getNextOccurrence = (event: Event): Date => {
  const today = new Date();
  let nextDate = new Date(event.date);

  if (event.recurring) {
    while (nextDate < today) {
      if (event.frequency === 'yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      } else if (event.frequency === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
    }
  }

  return nextDate;
};
