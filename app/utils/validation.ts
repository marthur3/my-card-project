import { Contact, ValidationError } from '../types/types';

export const validateContact = (contact: Partial<Contact>): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!contact.name?.trim()) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  if (contact.phone && !/^\+?[\d\s-()]+$/.test(contact.phone)) {
    errors.push({ field: 'phone', message: 'Invalid phone format' });
  }

  if (contact.address) {
    if (!contact.address.street?.trim()) {
      errors.push({ field: 'address.street', message: 'Street address is required' });
    }
    if (!contact.address.city?.trim()) {
      errors.push({ field: 'address.city', message: 'City is required' });
    }
    if (!contact.address.state?.trim()) {
      errors.push({ field: 'address.state', message: 'State is required' });
    }
    if (!contact.address.zipCode?.trim()) {
      errors.push({ field: 'address.zipCode', message: 'ZIP code is required' });
    }
  }

  return errors;
};

export const validateEvent = (event: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!event.type) {
    errors.push({ field: 'type', message: 'Event type is required' });
  }

  if (!event.date) {
    errors.push({ field: 'date', message: 'Date is required' });
  }

  return errors;
};
