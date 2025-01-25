'use client'

import React, { useState, useEffect } from 'react';
import { Mail, Search, Calendar, Tag, Package, Heart, Star, Archive, Plus, X, Save, Wand2, Bell, Mic, MicOff } from 'lucide-react';
import { validateContact, validateEvent } from '../utils/validation';
import { checkUpcomingEvents } from '../utils/notifications';
import OpenAI from 'openai';

const formatDate = (date: Date | string | undefined) => {
  if (!date) return '-';
  if (typeof date === 'string') {
    if (date.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(date).toLocaleDateString();
    }
    return date;
  }
  return date.toLocaleDateString();
};

const handwritingFonts = {
  'casual': { name: 'Homemade Apple', class: 'font-homemade-apple' },
  'neat': { name: 'Nothing You Could Do', class: 'font-nothing-you-could-do' },
  'formal': { name: 'Alex Brush', class: 'font-alex-brush' },
  'modern': { name: 'Caveat', class: 'font-caveat' }
};

// Add ValidationError type
interface ValidationError {
  field: string;
  message: string;
}
// Global type declarations
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Contact {
  id: number;
  name: string;
  group: string;
  email: string;
  phone: string;
  nextEvent?: string;
  lastContact?: string | Date;
  address: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  events: Array<{
    id: number;
    type: 'birthday' | 'anniversary' | 'holiday' | 'custom';
    date: string;
    recurring: boolean;
    frequency: 'yearly' | 'monthly';
    nextOccurrence?: Date;
    description?: string;
  }>;
}

interface EditFormProps {
  editContact: Contact;
  setEditingContact: (id: number | null) => void;
  setEditContact: (contact: Contact) => void;
  handleSaveEdit: () => void;
  handleAddEvent: (id: number) => void;
}

const EditForm: React.FC<EditFormProps> = ({
  editContact,
  setEditingContact,
  setEditContact,
  handleSaveEdit,
  handleAddEvent
}: EditFormProps): JSX.Element => {
  function calculateNextOccurrence(date: string, frequency: string): Date | undefined {
    if (!date) return undefined;
    
    try {
      const eventDate = new Date(date);
      const today = new Date();
      
      // Return undefined if the date is invalid
      if (isNaN(eventDate.getTime())) return undefined;
      
      // Clone the event date for calculations
      let nextDate = new Date(eventDate);
      
      // If the date is in the future, return it as is
      if (nextDate > today) return nextDate;
      
      // Calculate next occurrence based on frequency
      if (frequency === 'yearly') {
        while (nextDate <= today) {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
      } else if (frequency === 'monthly') {
        while (nextDate <= today) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
      }
      
      return nextDate;
    } catch (error) {
      console.error('Error calculating next occurrence:', error);
      return undefined;
    }
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-xl font-semibold">
                {editContact.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Contact</h2>
              <p className="text-sm text-gray-500">Update contact information and events</p>
            </div>
          </div>
          <button 
            onClick={() => setEditingContact(null)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editContact.name}
                    onChange={(e) => setEditContact({...editContact, name: e.target.value})}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                  <select
                    value={editContact.group}
                    onChange={(e) => setEditContact({...editContact, group: e.target.value})}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a group</option>
                    <option value="Family">Family</option>
                    <option value="Friends">Friends</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editContact.email}
                    onChange={(e) => setEditContact({...editContact, email: e.target.value})}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editContact.phone}
                    onChange={(e) => setEditContact({...editContact, phone: e.target.value})}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={editContact.address.street}
                      onChange={(e) => setEditContact({
                        ...editContact,
                        address: {...editContact.address, street: e.target.value}
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apartment, suite, etc.</label>
                    <input
                      type="text"
                      value={editContact.address.unit}
                      onChange={(e) => setEditContact({
                        ...editContact,
                        address: {...editContact.address, unit: e.target.value}
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={editContact.address.city}
                      onChange={(e) => setEditContact({
                        ...editContact,
                        address: {...editContact.address, city: e.target.value}
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={editContact.address.state}
                      onChange={(e) => setEditContact({
                        ...editContact,
                        address: {...editContact.address, state: e.target.value}
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={editContact.address.zipCode}
                      onChange={(e) => setEditContact({
                        ...editContact,
                        address: {...editContact.address, zipCode: e.target.value}
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Important Dates</h3>
                <button
                  onClick={() => handleAddEvent(editContact.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                >
                  <Plus className="w-4 h-4" />
                  Add Date
                </button>
              </div>
              <div className="space-y-3">
                {editContact.events?.map((event) => (
                  <div 
                    key={event.id} 
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border"
                  >
                    <select
                      value={event.type}
                      onChange={(e) => {
                        const updatedEvents = editContact.events.map(ev =>
                          ev.id === event.id ? {...ev, type: e.target.value} : ev
                        );
                        setEditContact({...editContact, events: updatedEvents});
                      }}
                      className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="birthday">Birthday</option>
                      <option value="anniversary">Anniversary</option>
                      <option value="holiday">Holiday</option>
                      <option value="custom">Custom</option>
                    </select>
                    <input
                      type="date"
                      value={event.date}
                      onChange={(e) => {
                        const updatedEvents = editContact.events.map(ev =>
                          ev.id === event.id ? {
                            ...ev,
                            date: e.target.value,
                            nextOccurrence: calculateNextOccurrence(e.target.value, ev.frequency)
                          } : ev
                        );
                        setEditContact({...editContact, events: updatedEvents});
                      }}
                      className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={event.recurring}
                        onChange={(e) => {
                          const updatedEvents = editContact.events.map(ev =>
                            ev.id === event.id ? {...ev, recurring: e.target.checked} : ev
                          );
                          setEditContact({...editContact, events: updatedEvents});
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Recurring</span>
                    </label>
                    {event.recurring && (
                      <select
                        value={event.frequency}
                        onChange={(e) => {
                          const updatedEvents = editContact.events.map(ev =>
                            ev.id === event.id ? {
                              ...ev,
                              frequency: e.target.value,
                              nextOccurrence: calculateNextOccurrence(ev.date, e.target.value)
                            } : ev
                          );
                          setEditContact({...editContact, events: updatedEvents});
                        }}
                        className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="yearly">Yearly</option>
                        <option value="monthly">Monthly</option>                      
                        </select>
                    )}
                    <button
                      onClick={() => {
                        const updatedEvents = editContact.events.filter(ev => ev.id !== event.id);
                        setEditContact({...editContact, events: updatedEvents});
                      }}
                      className="ml-auto text-gray-400 hover:text-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={() => setEditingContact(null)}
            className="px-4 py-2 text-gray-700 bg-white border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const CardManager: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState<Contact>({
    id: 0,
    name: '',
    group: '',
    email: '',
    phone: '',
    events: [],
    address: {
      street: '',
      unit: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    }
  });
  
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: 1,
      name: 'Sarah Johnson',
      group: 'Family',
      nextEvent: 'Birthday - March 15',
      lastContact: formatDate(new Date('2024-01-01')), // Use a string date instead of Date object
      events: [], // Add empty events array
      address: {
        street: '',
        unit: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States'
      },
      email: '',
      phone: ''
    },
    {
      id: 2,
      name: 'Mike Peters',
      group: 'Work',
      nextEvent: 'Work Anniversary - April 1',
      lastContact: '1 week ago',
      events: [],
      address: {
        street: '',
        unit: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States'
      },
      email: '',
      phone: ''
    },
    {
      id: 3,
      name: 'Emma Wilson',
      group: 'Friends',
      nextEvent: 'Birthday - June 10',
      lastContact: '3 weeks ago',
      events: [],
      address: {
        street: '',
        unit: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States'
      },
      email: '',
      phone: ''
    }
  ]);
  const [drafts, setDrafts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messagePrompt, setMessagePrompt] = useState({
    occasion: '',
    relationship: '',
    tone: 'formal',
    specificDetails: ''
  });
  const [showPromptForm, setShowPromptForm] = useState(false);

  const [editingContact, setEditingContact] = useState<number | null>(null);
  const [editContact, setEditContact] = useState<Contact>({
    id: 0,
    name: '',
    email: '',
    phone: '',
    group: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    events: []
  });

  const [events, setEvents] = useState([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [notifications, setNotifications] = useState([]);

  const [newEvent, setNewEvent] = useState({
    type: 'birthday',
    date: '',
    recurring: true,
    frequency: 'yearly',
    description: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  const [selectedCardSize, setSelectedCardSize] = useState('a2');
  const [selectedFont, setSelectedFont] = useState('casual');
  
  const cardSizes = {
    'a2': {
      name: 'A2',
      width: '4.25"',
      height: '5.5"',
      aspect: 'aspect-[17/22]', // Original proportions
      fontSize: 'text-lg',
      displaySize: '4.25" × 5.5"'
    },
    'a6': {
      name: 'A6',
      width: '4.75"',
      height: '6.5"',
      aspect: 'aspect-[19/26]',
      fontSize: 'text-base',
      displaySize: '4.75" × 6.5"'
    },
    'a7': {
      name: 'A7',
      width: '5.25"',
      height: '7.25"',
      aspect: 'aspect-[21/29]',
      fontSize: 'text-base',
      displaySize: '5.25" × 7.25"'
    },
    'a9': {
      name: 'A9',
      width: '5.5"',
      height: '8.5"',
      aspect: 'aspect-[11/17]',
      fontSize: 'text-sm',
      displaySize: '5.5" × 8.5"'
    },
  };

  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    const checkNotifications = () => {
      const upcomingEvents = checkUpcomingEvents(contacts);
      setNotifications(upcomingEvents);
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 1000 * 60 * 60); // Check every hour

    return () => clearInterval(interval);
  }, [contacts]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        
        recognitionInstance.onresult = (event: any) => {
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            setMessage(prev => prev + ' ' + finalTranscript);
          }
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);

  const handleAddEvent = (contactId: number | null) => {
    if (!contactId) return;
    
    setContacts(contacts.map(contact => {
      if (contact.id === contactId) {
        const nextOccurrence = calculateNextOccurrence(newEvent.date, newEvent.frequency);
        return {
          ...contact,
          events: [...(contact.events || []), {
            ...newEvent,
            id: Date.now(),
            type: newEvent.type as "birthday" | "anniversary" | "holiday" | "custom",
            frequency: newEvent.frequency as "yearly" | "monthly",
            nextOccurrence
          }]
        };
      }
      return contact;
    }));
    
    setNewEvent({
      type: 'birthday',
      date: '',
      recurring: true,
      frequency: 'yearly',
      description: ''
    });
  };

  const calculateNextOccurrence = (date, frequency) => {
    const eventDate = new Date(date);
    const today = new Date();
    
    while (eventDate < today) {
      if (frequency === 'yearly') {
        eventDate.setFullYear(eventDate.getFullYear() + 1);
      } else if (frequency === 'monthly') {
        eventDate.setMonth(eventDate.getMonth() + 1);
      }
    }
    
    return eventDate;
  };

  const handleAddContact = () => {
    const errors = validateContact(newContact);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (isEditing) {
      // Update existing contact
      setContacts(contacts.map(contact => 
        contact.id === newContact.id ? newContact : contact
      ));
    } else {
      // Add new contact
      const newId = contacts.length + 1;
      const contactToAdd = {
        ...newContact,
        id: newId,
        lastContact: formatDate(new Date()),
      };
      setContacts([...contacts, contactToAdd]);
      setSelectedRecipient(contactToAdd);
    }
    
    // Reset the form
    setNewContact({
      id: 0,
      name: '',
      group: '',
      email: '',
      phone: '',
      events: [],
      address: {
        street: '',
        unit: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States'
      }
    });
    setIsAddingContact(false);
    setIsEditing(false);
  };

  const saveToDrafts = () => {
    if (!selectedRecipient || !message) return;
    
    const newDraft = {
      id: Date.now(),
      recipient: selectedRecipient.name,
      address: {
        street: selectedRecipient.address?.street || '',
        city: selectedRecipient.address?.city || '',
        state: selectedRecipient.address?.state || '',
        zipCode: selectedRecipient.address?.zipCode || '',
        country: selectedRecipient.address?.country || 'United States'
      },
      noteType: 'Card',
      note: message,
      createdAt: new Date().toISOString()
    };

    setDrafts([...drafts, newDraft]);
    
    // Clear the form
    setMessage('');
    setSelectedRecipient(null);
    setSearchTerm('');
  };

  const handleNewCard = () => {
    // Reset form state
    setMessage('');
    setSelectedRecipient(null);
    setSearchTerm('');
    setShowPromptForm(false);
    setIsAddingContact(false);
    
    // Switch to dashboard view
    setActiveView('dashboard');
  };

  const generateMessage = async () => {
    setIsGenerating(true);
    try {
      const prompt = message 
        ? `Rewrite this message: "${message}"
           Make it more ${messagePrompt.tone} and suitable for a ${messagePrompt.occasion} card to a ${messagePrompt.relationship}.
           Additional context: ${messagePrompt.specificDetails}`
        : `Write a ${messagePrompt.tone} message for a ${messagePrompt.occasion} card to a ${messagePrompt.relationship}. 
           Additional details: ${messagePrompt.specificDetails}`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
      });

      setMessage(completion.choices[0].message.content || '');
    } catch (error) {
      console.error('Error generating message:', error);
    }
    setIsGenerating(false);
    setShowPromptForm(false);
  };

  const improveExistingMessage = async (instruction: string) => {
    setIsGenerating(true);
    try {
      const prompt = `Improve this card message: "${message}" 
        Instructions: ${instruction}
        Make it more ${messagePrompt.tone}`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
      });

      setMessage(completion.choices[0].message.content || '');
    } catch (error) {
      console.error('Error improving message:', error);
    }
    setIsGenerating(false);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact.id);
    setEditContact({
      ...contact,
      address: {
        street: contact.address?.street || '',
        unit: contact.address?.unit || '',
        city: contact.address?.city || '',
        state: contact.address?.state || '',
        zipCode: contact.address?.zipCode || '',
        country: contact.address?.country || 'United States'
      },
      events: contact.events || []
    });
  };

  const handleSaveEdit = () => {
    const errors = validateContact(editContact);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setContacts(prevContacts => 
      prevContacts.map(contact => 
        contact.id === editingContact ? editContact : contact
      )
    );

    // Reset the editing state
    setEditingContact(null);
    setEditContact({
      id: 0,
      name: '',
      email: '',
      phone: '',
      group: '',
      events: [],
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States'
      }
    });
    
    setValidationErrors([]);
  };

  const getFieldError = (fieldName: string) => {
    return validationErrors.find(error => error.field === fieldName)?.message;
  };

  const renderEditForm = () => {
    if (!editingContact) return null;
    
    return (
      <EditForm
        editContact={editContact}
        setEditingContact={setEditingContact}
        setEditContact={setEditContact}
        handleSaveEdit={handleSaveEdit}
        handleAddEvent={handleAddEvent}
      />
    );
  };

  // Update the upcoming events rendering
  const renderUpcomingEvents = () => {
    const allEvents = contacts.flatMap(contact => 
      contact.events?.map(event => ({
        ...event,
        contactName: contact.name,
        contactId: contact.id,
        nextOccurrence: event.nextOccurrence ? new Date(event.nextOccurrence) : null
      })) || []
    );

    const sortedEvents = allEvents
      .filter(event => event.nextOccurrence && event.nextOccurrence > new Date())
      .sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime());

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Events</h2>
        <div className="space-y-4">
          {sortedEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{event.contactName}</div>
                <div className="text-sm text-gray-500">
                  {event.type} - {formatDate(event.nextOccurrence)}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedRecipient(contacts.find(c => c.id === event.contactId));
                  setActiveView('dashboard');
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                Send Card
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      try {
        recognition?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <div className="fixed top-0 left-0 h-screen w-64 bg-white border-r shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-900 mb-8">Card Manager</h1>
          
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center w-full p-2 rounded-lg ${
                activeView === 'dashboard' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Star className="w-5 h-5 mr-3" />
              Dashboard
            </button>

            <button 
              onClick={() => setActiveView('contacts')}
              className={`flex items-center w-full p-2 rounded-lg ${
                activeView === 'contacts' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Mail className="w-5 h-5 mr-3" />
              Contacts
            </button>

            <button 
              onClick={() => setActiveView('sent')}
              className={`flex items-center w-full p-2 rounded-lg ${
                activeView === 'sent' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Archive className="w-5 h-5 mr-3" />
              Sent Cards
            </button>

            <button 
              onClick={() => setActiveView('upcoming')}
              className={`flex items-center w-full p-2 rounded-lg ${
                activeView === 'upcoming' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bell className="w-5 h-5 mr-3" />
              Upcoming
              {notifications.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {notifications.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <button 
            onClick={handleNewCard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
          >
            <Package className="w-5 h-5" />
            New Card
          </button>
          
          <button
            onClick={saveToDrafts}
            disabled={!selectedRecipient || !message}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save to Drafts
          </button>
        </div>

        {/* View Content */}
        {activeView === 'upcoming' && (
          <div>{renderUpcomingEvents()}</div>
        )}

        {activeView === 'sent' && (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zip Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {drafts.map((draft) => (
                    <tr key={draft.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{draft.recipient}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{draft.address?.street || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{draft.address?.city || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{draft.address?.state || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{draft.address?.zipCode || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{draft.noteType}</td>
                      <td className="px-6 py-4 max-w-md overflow-hidden text-ellipsis">{draft.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'contacts' && (
          <div>
            {isAddingContact ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-gray-900">
                    {isEditing ? 'Edit Contact' : 'Add New Contact'}
                  </h2>
                  <button
                    onClick={() => {
                      setIsAddingContact(false);
                      setIsEditing(false);
                      setNewContact({
                        id: 0,
                        name: '', 
                        group: '', 
                        email: '',
                        phone: '',
                        events: [],
                        address: {
                          street: '',
                          unit: '',
                          city: '',
                          state: '',
                          zipCode: '',
                          country: 'United States'
                        }
                      });
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        placeholder="Name"
                        className={`w-full p-2 border rounded ${getFieldError('name') ? 'border-red-500' : ''}`}
                        value={newContact.name}
                        onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                      />
                      {getFieldError('name') && (
                        <p className="text-red-500 text-xs mt-1">{getFieldError('name')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                      <select
                        value={newContact.group}
                        onChange={(e) => setNewContact({...newContact, group: e.target.value})}
                        className={`w-full p-2 border rounded ${getFieldError('group') ? 'border-red-500' : ''}`}
                      >
                        <option value="">Select a group</option>
                        <option value="Family">Family</option>
                        <option value="Friends">Friends</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="Email"
                        className="w-full p-2 border rounded"
                        value={newContact.email}
                        onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        placeholder="Phone"
                        className="w-full p-2 border rounded"
                        value={newContact.phone}
                        onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Address</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Street Address"
                        className={`w-full p-2 border rounded ${getFieldError('street') ? 'border-red-500' : ''}`}
                        value={newContact.address.street}
                        onChange={(e) => setNewContact({
                          ...newContact,
                          address: { ...newContact.address, street: e.target.value }
                        })}
                      />
                      <input
                        type="text"
                        placeholder="Unit (optional)"
                        className="w-full p-2 border rounded"
                        value={newContact.address.unit || ''}
                        onChange={(e) => setNewContact({
                          ...newContact,
                          address: { ...newContact.address, unit: e.target.value }
                        })}
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <input
                          type="text"
                          placeholder="City"
                          className={`w-full p-2 border rounded ${getFieldError('city') ? 'border-red-500' : ''}`}
                          value={newContact.address.city}
                          onChange={(e) => setNewContact({
                            ...newContact,
                            address: { ...newContact.address, city: e.target.value }
                          })}
                        />
                        <input
                          type="text"
                          placeholder="State"
                          className={`w-full p-2 border rounded ${getFieldError('state') ? 'border-red-500' : ''}`}
                          value={newContact.address.state}
                          onChange={(e) => setNewContact({
                            ...newContact,
                            address: { ...newContact.address, state: e.target.value }
                          })}
                        />
                        <input
                          type="text"
                          placeholder="ZIP Code"
                          className={`w-full p-2 border rounded ${getFieldError('zipCode') ? 'border-red-500' : ''}`}
                          value={newContact.address.zipCode}
                          onChange={(e) => setNewContact({
                            ...newContact,
                            address: { ...newContact.address, zipCode: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsAddingContact(false);
                        setIsEditing(false);
                        setNewContact({
                          id: 0,
                          name: '', 
                          group: '', 
                          email: '',
                          phone: '',
                          events: [],
                          address: {
                            street: '',
                            unit: '',
                            city: '',
                            state: '',
                            zipCode: '',
                            country: 'United States'
                          }
                        });
                      }}
                      className="px-4 py-2 text-gray-600 bg-white border rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddContact}
                      className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      {isEditing ? 'Save Changes' : 'Add Contact'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Contacts</h2>
                  <button
                    onClick={() => setIsAddingContact(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Contact
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zip Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Event</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contacts.map(contact => (
                        <tr key={contact.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">{contact.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{contact.group}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{contact.address?.street || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{contact.address?.city || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{contact.address?.state || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{contact.address?.zipCode || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              {contact.events?.map(event => (
                                <div key={event.id} className="text-sm">
                                  <span className="font-medium">{event.type}</span>
                                  <br />
                                  <span className="text-gray-500">
                                    {event.nextOccurrence ? formatDate(event.nextOccurrence) : '-'}
                                    {event.recurring && ` (${event.frequency})`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {typeof contact.lastContact === 'object' 
                              ? formatDate(contact.lastContact) 
                              : contact.lastContact}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap space-x-2">
                            <button
                              onClick={() => handleEditContact(contact)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteContact(contact.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={() => setIsAddingContact(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Contact
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'dashboard' && (
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Recipient Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900 mb-2">Card Recipient</label>
                {!isAddingContact ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search contacts..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    {searchTerm && (
                      <div className="max-h-40 overflow-y-auto border rounded-lg bg-white">
                        {contacts
                          .filter(contact => 
                            contact.name.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map(contact => (
                            <div
                              key={contact.id}
                              onClick={() => {
                                setSelectedRecipient(contact);
                                setSearchTerm('');
                              }}
                              className={`p-2 cursor-pointer hover:bg-gray-50 ${
                                selectedRecipient?.id === contact.id ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="font-medium">{contact.name}</div>
                              <div className="text-sm text-gray-500">{contact.group}</div>
                            </div>
                          ))
                        }
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {selectedRecipient && (
                        <div className="flex-1 p-2 bg-blue-50 rounded-lg">
                          <div className="font-medium text-blue-700">{selectedRecipient.name}</div>
                          <div className="text-sm text-blue-600">{selectedRecipient.group}</div>
                        </div>
                      )}
                      <button
                        onClick={() => setIsAddingContact(true)}
                        className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-700"
                      >
                        <Plus className="w-4 h-4" /> Add New Contact
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 border rounded-lg bg-white">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Add New Contact</h4>
                      <button
                        onClick={() => setIsAddingContact(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Name"
                          className={`w-full p-2 border rounded ${getFieldError('name') ? 'border-red-500' : ''}`}
                          value={newContact.name}
                          onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                        />
                        <input
                          type="text"
                          placeholder="Group (Family, Friends, Work, etc.)"
                          className={`w-full p-2 border rounded ${getFieldError('group') ? 'border-red-500' : ''}`}
                          value={newContact.group}
                          onChange={(e) => setNewContact({...newContact, group: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="email"
                          placeholder="Email"
                          className="w-full p-2 border rounded"
                          value={newContact.email}
                          onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          className="w-full p-2 border rounded"
                          value={newContact.phone}
                          onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Street Address"
                          className={`w-full p-2 border rounded ${getFieldError('street') ? 'border-red-500' : ''}`}
                          value={newContact.address.street}
                          onChange={(e) => setNewContact({
                            ...newContact,
                            address: { ...newContact.address, street: e.target.value }
                          })}
                        />
                        <input
                          type="text"
                          placeholder="Unit (optional)"
                          className="w-full p-2 border rounded"
                          value={newContact.address.unit || ''}
                          onChange={(e) => setNewContact({
                            ...newContact,
                            address: { ...newContact.address, unit: e.target.value }
                          })}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <input
                          type="text"
                          placeholder="City"
                          className={`w-full p-2 border rounded ${getFieldError('city') ? 'border-red-500' : ''}`}
                          value={newContact.address.city}
                          onChange={(e) => setNewContact({
                            ...newContact,
                            address: { ...newContact.address, city: e.target.value }
                          })}
                        />
                        <input
                          type="text"
                          placeholder="State"
                          className={`w-full p-2 border rounded ${getFieldError('state') ? 'border-red-500' : ''}`}
                          value={newContact.address.state}
                          onChange={(e) => setNewContact({
                            ...newContact,
                            address: { ...newContact.address, state: e.target.value }
                          })}
                        />
                        <input
                          type="text"
                          placeholder="ZIP Code"
                          className={`w-full p-2 border rounded ${getFieldError('zipCode') ? 'border-red-500' : ''}`}
                          value={newContact.address.zipCode}
                          onChange={(e) => setNewContact({
                            ...newContact,
                            address: { ...newContact.address, zipCode: e.target.value }
                          })}
                        />
                      </div>
                    </div>

                    {Object.keys(validationErrors).length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded">
                        Please fix the highlighted fields
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => setIsAddingContact(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddContact}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        {isEditing ? 'Save Changes' : 'Add Contact'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-900">Message</label>
                  <button
                    onClick={() => setShowPromptForm(true)}
                    className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-700"
                  >
                    <Wand2 className="w-4 h-4" /> {message ? 'Improve with AI' : 'AI Assist'}
                  </button>
                </div>
                
                {showPromptForm && (
                  <div className="mb-4 p-4 border rounded-lg bg-white space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">AI Message Generator</h4>
                      <button
                        onClick={() => setShowPromptForm(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <select
                      value={messagePrompt.tone}
                      onChange={(e) => setMessagePrompt({...messagePrompt, tone: e.target.value})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="formal">Formal</option>
                      <option value="casual">Casual</option>
                      <option value="warm">Warm</option>
                      <option value="professional">Professional</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Occasion (e.g., birthday, thank you, congratulations)"
                      value={messagePrompt.occasion}
                      onChange={(e) => setMessagePrompt({...messagePrompt, occasion: e.target.value})}
                      className="w-full p-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Relationship (e.g., close friend, colleague, family member)"
                      value={messagePrompt.relationship}
                      onChange={(e) => setMessagePrompt({...messagePrompt, relationship: e.target.value})}
                      className="w-full p-2 border rounded"
                    />
                    <textarea
                      placeholder="Additional details or specific points to include"
                      value={messagePrompt.specificDetails}
                      onChange={(e) => setMessagePrompt({...messagePrompt, specificDetails: e.target.value})}
                      className="w-full p-2 border rounded h-20"
                    />
                    <button
                      onClick={generateMessage}
                      disabled={isGenerating}
                      className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isGenerating ? 'Generating...' : message ? 'Regenerate Message' : 'Generate Message'}
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full p-3 border rounded-lg h-40 bg-white text-gray-900 shadow-sm pr-12"
                      placeholder="Write your message here..."
                    />
                    <button
                      onClick={toggleListening}
                      className={`absolute right-3 top-3 p-2 rounded-full ${
                        isListening 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={isListening ? 'Stop recording' : 'Start recording'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <span>{message.length} characters</span>
                      {isListening && (
                        <span className="text-red-600 animate-pulse">
                          ● Recording...
                        </span>
                      )}
                    </div>
                    {message && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => improveExistingMessage('Make it more concise')}
                          className="text-blue-600 hover:text-blue-700"
                          disabled={isGenerating}
                        >
                          Make Shorter
                        </button>
                        <button
                          onClick={() => improveExistingMessage('Make it more detailed and expressive')}
                          className="text-blue-600 hover:text-blue-700"
                          disabled={isGenerating}
                        >
                          Make Longer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-medium text-gray-900">Preview</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Font:</span>
                    <select
                      value={selectedFont}
                      onChange={(e) => setSelectedFont(e.target.value)}
                      className="text-sm border rounded p-1 bg-white"
                    >
                      {Object.entries(handwritingFonts).map(([key, font]) => (
                        <option key={key} value={key}>
                          {font.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  {Object.entries(cardSizes).map(([size, details]) => (
                    <button
                      key={size}
                      onClick={() => setSelectedCardSize(size)}
                      className={`px-3 py-1 text-sm rounded ${
                        selectedCardSize === size
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {details.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="relative bg-gray-50 p-8 rounded-lg">
                <div className={`bg-white rounded-lg shadow-lg border mx-auto ${cardSizes[selectedCardSize].aspect}`}>
                  <div className="p-8 h-full">
                    <div className={`text-gray-900 w-full h-full whitespace-pre-wrap text-left overflow-y-auto
                      ${handwritingFonts[selectedFont].class} 
                      ${cardSizes[selectedCardSize].fontSize}
                      leading-relaxed`}
                    >
                      {message || "Your message will appear here"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Card Size: {cardSizes[selectedCardSize].displaySize}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Writing surface shown at actual proportions
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {editingContact && renderEditForm()}
    </div>
  );
};

export default CardManager;