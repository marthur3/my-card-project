export interface Event {
  id: number;
  type: 'birthday' | 'anniversary' | 'holiday' | 'custom';
  date: string;
  recurring: boolean;
  frequency: 'yearly' | 'monthly';
  description?: string;
  nextOccurrence: Date;
}

export interface Contact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  group: string;
  events: Event[];
  lastContact?: Date | string; // Allow both Date and string
}

export interface ValidationError {
  field: string;
  message: string;
}
