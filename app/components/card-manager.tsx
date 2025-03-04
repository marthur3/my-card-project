'use client'

import React, { useState, useEffect, JSX } from 'react';
import { Mail, Search, Package, Star, Archive, Plus, X, Save, Wand2, Mic, MicOff, Sparkles } from 'lucide-react';
import { validateContact } from '../utils/validation';
import OpenAI from 'openai';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

const prisma = new PrismaClient()

export async function dbHealthCheck() {
  try {
    await prisma.$connect()
    return true
  } catch (err) {
    console.error('Database connection failed:', err)
    return false
  }
}

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
  'casual': { 
    name: 'Homemade Apple', 
    class: 'font-homemade-apple font-cursive'  // Add explicit font-family class
  },
  'neat': { 
    name: 'Nothing You Could Do', 
    class: 'font-nothing-you-could-do font-cursive'
  },
  'formal': { 
    name: 'Alex Brush', 
    class: 'font-alex-brush font-cursive'
  },
  'modern': { 
    name: 'Caveat', 
    class: 'font-caveat font-cursive'
  }
} as const;

// Add ValidationError type
interface ValidationError {
  field: string;
  message: string;
}
// Global type declarations
interface Contact {
  id: string;
  name: string;
  group: string;
  email: string;
  phone: string;
  lastContact?: string | Date;
  address: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface EditFormProps {
  editContact: Contact;
  setEditingContact: (id: string | null) => void;
  setEditContact: (contact: Contact) => void;
  handleSaveEdit: () => void;
}

// Add new interfaces after the existing ones
interface ThankYouItem {
  id: string;
  giftOrReason: string;
  fromPerson: string;
  occasion: string;
  dateReceived: string;
  status: 'pending' | 'generated' | 'finalized';
  suggestedMessage?: string;
  contact?: Contact;
}

interface BulkImportData {
  items: {
    giftOrReason: string;
    fromPerson: string;
    occasion?: string;
    dateReceived?: string;
  }[];
}

// Add new interface for message queue items
interface QueuedMessage {
  id: string;
  recipient: Contact;
  occasion?: string;
  giftOrReason?: string;
  suggestedMessage: string;
  status: 'pending' | 'accepted' | 'editing';
  dateCreated: string;
}

// Add button style constants near the top of the file
const buttonStyles = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  success: "bg-green-600 hover:bg-green-700 text-white",
  secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
  premium: `bg-gradient-to-r from-violet-500 to-indigo-500 
    hover:from-violet-600 hover:to-indigo-600 
    text-white transition-all duration-200 
    hover:shadow-lg transform hover:scale-102`,
  outline: "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700",
  ghost: "text-gray-600 hover:bg-gray-100",
  destructive: "bg-red-600 hover:bg-red-700 text-white",
  glass: `bg-white/80 backdrop-blur-sm 
    border border-gray-200/50
    hover:bg-white/90 hover:shadow-md
    transition-all duration-200`,
  tab: `relative px-4 py-2 text-sm font-medium transition-all duration-200
    after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full
    after:scale-x-0 after:bg-violet-600 after:transition-transform
    hover:after:scale-x-100`,
};

const baseButtonStyle = "px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50";

const navStyles = {
  tab: `flex items-center w-full p-3 rounded-lg transition-all duration-200
    font-medium text-sm gap-3`,
  active: `bg-gradient-to-r from-violet-500/10 to-indigo-500/10 
    text-violet-700 shadow-sm`,
  inactive: `text-neutral-600 hover:bg-neutral-100`,
};

const brandBadge = `absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 
  bg-gradient-to-r from-violet-500/10 to-indigo-500/10 
  border border-violet-500/20 rounded-full`;

const EditForm: React.FC<EditFormProps> = ({
  editContact,
  setEditingContact,
  setEditContact,
  handleSaveEdit
}: EditFormProps): JSX.Element => {
  return (
    <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
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
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={() => setEditingContact(null)}
            className={`${baseButtonStyle} ${buttonStyles.ghost}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            className={`${baseButtonStyle} ${buttonStyles.primary}`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const CardManager: React.FC = (): JSX.Element => {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter(contact => contact.id !== id));
    if (selectedRecipient?.id === id) {
      setSelectedRecipient(null);
    }
  };
  const [message, setMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<Contact | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState<Contact>({
    id: '',  // Will be generated when saving
    name: '',
    group: '',
    email: '',
    phone: '',
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
      id: 'clq1234567890abcdef',  // Prisma ID format
      name: 'Sarah Johnson',
      group: 'Family',
      lastContact: formatDate(new Date('2024-01-01')), // Use a string date instead of Date object
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
      id: 'clq2345678901bcdefg',  // Prisma ID format
      name: 'Mike Peters',
      group: 'Work',
      lastContact: '1 week ago',
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
      id: 'clq3456789012cdefgh',  // Prisma ID format
      name: 'Emma Wilson',
      group: 'Friends',
      lastContact: '3 weeks ago',
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
  interface Draft {
    id: number;
    recipient: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    noteType: string;
    note: string;
    createdAt: string;
  }

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messagePrompt, setMessagePrompt] = useState({
    occasion: '',
    relationship: '',
    tone: 'formal',
    specificDetails: ''
  });
  const [showPromptForm, setShowPromptForm] = useState(false);

  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [editContact, setEditContact] = useState<Contact>({
    id: '',  // Will be filled when editing starts
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
    }
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const [isEditing, setIsEditing] = useState(false);

  const [selectedCardSize, setSelectedCardSize] = useState<keyof typeof cardSizes>('a2');
  const [selectedFont, setSelectedFont] = useState<keyof typeof handwritingFonts>('casual');
  
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
  const [recognition, setRecognition] = useState<any | null>(null);

  // Add new state for bulk import
  const [thankYouItems, setThankYouItems] = useState<ThankYouItem[]>([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportStep, setBulkImportStep] = useState(1);
  const [importedData, setImportedData] = useState<BulkImportData>({ items: [] });

  // Add new state for message queue
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);
  const [showMessageQueue, setShowMessageQueue] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact.id);
    setEditContact(contact);
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
      const newId = `clq${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`; // Generate CUID-like ID
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
      id: '',
      name: '',
      group: '',
      email: '',
      phone: '',
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
  if (!selectedRecipient) {
    setError('Please select a recipient first');
    return;
  }

  const generatedMessage = await handleAIAssist('generate', '');
  if (generatedMessage) {
    setMessage(generatedMessage);
    setShowPromptForm(false);
  }
};

// Single, consolidated handleAIAssist function
const handleAIAssist = async (instruction: string, existingMessage?: string) => {
  setIsGenerating(true);
  setError(null);
  
  try {
    let prompt;
    if (instruction === 'generate') {
      prompt = `Write a ${messagePrompt.tone} message for a ${messagePrompt.occasion} card to a ${messagePrompt.relationship}. 
              Additional details: ${messagePrompt.specificDetails}`;
    } else {
      prompt = `${instruction}: "${existingMessage || message}"
        Please maintain the core message while ${instruction === 'make it shorter' 
          ? 'being more concise' 
          : 'adding more detail and expression'}.`;
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt,
        contactId: selectedRecipient?.id 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate/improve message');
    }

    const data = await response.json();
    return data.message;
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to process message');
    return null;
  } finally {
    setIsGenerating(false);
  }
};

// Improve existing message function
const improveExistingMessage = async (instruction: 'make it shorter' | 'make it longer') => {
  if (!message || !selectedRecipient) {
    setError('Please write a message and select a recipient first');
    return;
  }

  const improvedMessage = await handleAIAssist(instruction, message);
  if (improvedMessage) {
    setMessage(improvedMessage);
  }
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

    // Update drafts and message queue references
    setDrafts(prevDrafts => 
      prevDrafts.map(draft => {
        if (draft.recipient === editContact.name) {
          return {
            ...draft,
            recipient: editContact.name,
            address: {
              street: editContact.address?.street || '',
              city: editContact.address?.city || '',
              state: editContact.address?.state || '',
              zipCode: editContact.address?.zipCode || '',
              country: editContact.address?.country || 'United States'
            }
          };
        }
        return draft;
      })
    );

    setMessageQueue(prevQueue =>
      prevQueue.map(item => {
        if (item.recipient.id === editContact.id) {
          return {
            ...item,
            recipient: editContact
          };
        }
        return item;
      })
    );

    // Reset editing state
    setEditingContact(null);
    setEditContact({
      id: '',
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
      />
    );
  };

  const toggleListening = () => {
    if (isListening) {
      (recognition as any)?.stop();
    } else {
      try {
        recognition?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  // Add new functions for bulk import
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const items = lines.slice(1).map((line) => {
          const [giftOrReason, fromPerson, occasion, dateReceived] = line.split(',');
          return { giftOrReason, fromPerson, occasion, dateReceived };
        });
        setImportedData({ items });
        setBulkImportStep(2);
      } catch (error) {
        console.error('Error parsing CSV:', error);
      }
    };
    reader.readAsText(file);
  };

  const matchContacts = () => {
    const newThankYouItems = importedData.items.map((item) => {
      const matchedContact = contacts.find(
        (contact) => contact.name.toLowerCase() === item.fromPerson.toLowerCase()
      );
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        giftOrReason: item.giftOrReason,
        fromPerson: item.fromPerson,
        occasion: item.occasion || 'General',
        dateReceived: item.dateReceived || new Date().toISOString(),
        status: 'pending' as const,
        contact: matchedContact,
      };
    });

    setThankYouItems(newThankYouItems);
    setBulkImportStep(3);
  };

  const generateBulkMessages = async () => {
    const updatedItems = await Promise.all(
      thankYouItems.map(async (item) => {
        if (item.status !== 'pending') return item;

        const prompt = `Write a thank you card message for ${item.fromPerson} who gave/did: ${item.giftOrReason}${
          item.occasion ? ` for ${item.occasion}` : ''
        }. Make it personal and sincere.`;

        try {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
          });

          const data = await response.json();
          if (data.error) throw new Error(data.error);
          
          return {
            ...item,
            status: 'generated' as const,
            suggestedMessage: data.message || '',
          };
        } catch (error) {
          console.error('Error generating message:', error);
          return item;
        }
      })
    );

    setThankYouItems(updatedItems);
    setBulkImportStep(4);
  };

  // Replace the existing finalizeAndSave function
  const finalizeAndSave = () => {
    const newQueueItems: QueuedMessage[] = thankYouItems
      .filter((item) => item.status === 'generated' && item.suggestedMessage)
      .map((item) => ({
        id: Math.random().toString(36).substr(2, 9),
        recipient: item.contact || {
          id: Date.now().toString(),
          name: item.fromPerson,
          group: 'Other',
          email: '',
          phone: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'United States'
          }
        },
        occasion: item.occasion || 'Thank You',
        giftOrReason: item.giftOrReason,
        suggestedMessage: item.suggestedMessage!,
        status: 'pending' as const,
        dateCreated: new Date().toISOString()
      }));

    setMessageQueue([...messageQueue, ...newQueueItems]);
    setThankYouItems([]);
    setShowBulkImport(false);
    setBulkImportStep(1);
    setShowMessageQueue(true); // Show the message queue after adding items
  };

  // Add new handlers for queue actions
  const handleEditQueuedMessage = (queuedMessage: QueuedMessage) => {
    setSelectedRecipient(queuedMessage.recipient);
    setMessage(queuedMessage.suggestedMessage);
    setMessagePrompt({
      ...messagePrompt,
      occasion: queuedMessage.occasion || '',
    });
    // Remove from queue
    setMessageQueue(queue => queue.filter(item => item.id !== queuedMessage.id));
    setShowMessageQueue(false);
  };

  const handleAcceptQueuedMessage = (queuedMessage: QueuedMessage) => {
    // Move to drafts
    const newDraft = {
      id: Date.now(),
      recipient: queuedMessage.recipient.name,
      address: queuedMessage.recipient.address,
      noteType: queuedMessage.occasion ? `Thank You - ${queuedMessage.occasion}` : 'Thank You Card',
      note: queuedMessage.suggestedMessage,
      createdAt: new Date().toISOString()
    };
    setDrafts([...drafts, newDraft]);
    
    // Remove from queue
    setMessageQueue(queue => queue.filter(item => item.id !== queuedMessage.id));
  };

  const addToQueue = () => {
    if (!selectedRecipient || !message) return;
    
    const newQueueItem: QueuedMessage = {
      id: Math.random().toString(36).substr(2, 9),
      recipient: selectedRecipient,
      occasion: messagePrompt.occasion,
      suggestedMessage: message,
      status: 'pending',
      dateCreated: new Date().toISOString()
    };

    setMessageQueue([...messageQueue, newQueueItem]);
    
    // Clear the form
    setMessage('');
    setSelectedRecipient(null);
    setSearchTerm('');
    setShowMessageQueue(true);
  };

  const handleDeleteDraft = (draftId: number) => {
    setDrafts(drafts.filter(draft => draft.id !== draftId));
  };

  const exportDraftsToCSV = () => {
    // Define CSV headers
    const headers = [
      'Recipient',
      'Street Address',
      'City',
      'State',
      'ZIP Code',
      'Note Type',
      'Note',
      'Created At'
    ];

    // Convert drafts to CSV rows
    const rows = drafts.map(draft => [
      draft.recipient,
      draft.address?.street || '',
      draft.address?.city || '',
      draft.address?.state || '',
      draft.address?.zipCode || '',
      draft.noteType,
      draft.note,
      draft.createdAt
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `draft-cards-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navigation */}
      <div className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-neutral-200 shadow-sm">
        <div className="p-6 relative">
          <h1 className="font-heading text-2xl text-neutral-900 mb-2">Card Manager</h1>
          <p className="text-sm text-neutral-500 mb-8">Manage your cards and contacts</p>
          
          <div className={brandBadge}>
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-medium bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Pro
            </span>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`${navStyles.tab} ${
                activeView === 'dashboard' ? navStyles.active : navStyles.inactive
              }`}
            >
              <Star className="w-5 h-5" />
              Dashboard
            </button>

            <button 
              onClick={() => setActiveView('contacts')}
              className={`${navStyles.tab} ${
                activeView === 'contacts' ? navStyles.active : navStyles.inactive
              }`}
            >
              <Mail className="w-5 h-5" />
              Contacts
            </button>

            <button 
              onClick={() => setActiveView('sent')}
              className={`${navStyles.tab} ${
                activeView === 'sent' ? navStyles.active : navStyles.inactive
              }`}
            >
              <Archive className="w-5 h-5" />
              Draft Cards
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8 bg-neutral-50 min-h-screen">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <button 
            onClick={handleNewCard}
            className={`${baseButtonStyle} ${buttonStyles.primary}`}
          >
            <Package className="w-5 h-5" />
            New Card
          </button>

          {/* Add bulk import button */}
          <button 
            onClick={() => setShowBulkImport(true)}
            className={`${baseButtonStyle} ${buttonStyles.success}`}
          >
            <Package className="w-5 h-5" />
            Bulk Import Thank You Cards
          </button>

          {/* Add queue button */}
          <button 
            onClick={() => setShowMessageQueue(true)}
            className={`${baseButtonStyle} ${buttonStyles.secondary}`}
          >
            <Archive className="w-5 h-5" />
            Message Queue ({messageQueue.length})
          </button>
        </div>

        {/* Message Queue Panel */}
        {showMessageQueue && (
          <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl overflow-hidden z-40">
            <div className="flex flex-col h-full">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-medium">Message Queue</h3>
                <button 
                  onClick={() => setShowMessageQueue(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {messageQueue.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.recipient.name}</h4>
                          <p className="text-sm text-gray-500">
                            {item.occasion || 'Thank You Card'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditQueuedMessage(item)}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleAcceptQueuedMessage(item)}
                            className="text-green-600 hover:text-green-700 text-sm"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                      
                      {item.giftOrReason && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Gift/Reason:</span> {item.giftOrReason}
                        </p>
                      )}
                      
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        {item.suggestedMessage}
                      </div>
                      
                      <p className="text-xs text-gray-400">
                        Created {new Date(item.dateCreated).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  
                  {messageQueue.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No messages in queue
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Content */}

        {activeView === 'sent' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Draft Cards</h2>
              <button
                onClick={exportDraftsToCSV}
                className={`${baseButtonStyle} ${buttonStyles.outline}`}
                disabled={drafts.length === 0}
              >
                <Package className="w-4 h-4" />
                Export to CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Recipient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">City</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">State</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Zip Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Note Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Note</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {drafts.map((draft) => (
                    <tr key={draft.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">{draft.recipient}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{draft.address?.street || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{draft.address?.city || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{draft.address?.state || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{draft.address?.zipCode || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{draft.noteType}</td>
                      <td className="px-6 py-4 max-w-md overflow-hidden text-ellipsis">{draft.note}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className={`${baseButtonStyle} !py-1 !px-3 text-sm ${buttonStyles.destructive}`}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </td>
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
                        id: '',
                        name: '', 
                        group: '', 
                        email: '',
                        phone: '',
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
                          id: '',
                          name: '', 
                          group: '', 
                          email: '',
                          phone: '',
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
                      className={`${baseButtonStyle} ${buttonStyles.ghost}`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddContact}
                      className={`${baseButtonStyle} ${buttonStyles.primary}`}
                    >
                      {isEditing ? 'Save Changes' : 'Add Contact'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Contacts</h2>
                  <button
                    onClick={() => setIsAddingContact(true)}
                    className={`${baseButtonStyle} ${buttonStyles.primary}`}
                  >
                    <Plus className="w-4 h-4" />
                    Add New Contact
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Group</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">City</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">State</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Zip Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Last Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {contacts.map(contact => (
                        <tr key={contact.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap">{contact.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{contact.group}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{contact.address?.street || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{contact.address?.city || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{contact.address?.state || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{contact.address?.zipCode || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {typeof contact.lastContact === 'object' 
                              ? formatDate(contact.lastContact) 
                              : contact.lastContact}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditContact(contact)}
                                className={`${baseButtonStyle} !py-1 !px-3 text-sm`}
                              >
                                <Mail className="w-4 h-4 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteContact(contact.id)}
                                className={`${baseButtonStyle} !py-1 !px-3 text-sm ${buttonStyles.destructive}`}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 border-t border-neutral-200">
                  <button
                    onClick={() => setIsAddingContact(true)}
                    className={`${baseButtonStyle} ${buttonStyles.primary}`}
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
                              className={`p-2 cursor-pointer hover:bg-neutral-50 ${
                                selectedRecipient?.id === contact.id ? 'bg-primary-50' : ''
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
                        <div className="flex-1 p-2 bg-primary-50 rounded-lg">
                          <div className="font-medium text-primary-700">{selectedRecipient.name}</div>
                          <div className="text-sm text-primary-600">{selectedRecipient.group}</div>
                        </div>
                      )}
                      <button
                        onClick={() => setIsAddingContact(true)}
                        className="text-primary-600 text-sm flex items-center gap-1 hover:text-primary-700"
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
                        className={`${baseButtonStyle} ${buttonStyles.ghost}`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddContact}
                        className={`${baseButtonStyle} ${buttonStyles.primary}`}
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
                    onClick={() => message ? setShowPromptForm(true) : generateMessage()}
                    className={`${baseButtonStyle} ${buttonStyles.premium} !p-2`}
                    disabled={isGenerating}
                  >
                    <Wand2 className="w-4 h-4" />
                    {isGenerating ? 'Processing...' : message ? 'Improve with AI' : 'AI Assist'}
                  </button>
                </div>
                
                {showPromptForm && (
                  <div className="mb-4 p-4 border rounded-lg bg-white space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">AI Message Assistant</h4>
                      <button
                        onClick={() => setShowPromptForm(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {message ? (
                      // Show improvement options if there's an existing message
                      <div className="space-y-4">
                        <h5 className="font-medium text-sm text-gray-700">How would you like to improve this message?</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => improveExistingMessage('make it shorter')}
                            className={`${baseButtonStyle} ${buttonStyles.outline}`}
                            disabled={isGenerating}
                          >
                            Make it Shorter
                          </button>
                          <button
                            onClick={() => improveExistingMessage('make it longer')}
                            className={`${baseButtonStyle} ${buttonStyles.outline}`}
                            disabled={isGenerating}
                          >
                            Make it Longer
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Show the original prompt form for generating new messages
                      <div className="space-y-4">
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
                          className="w-full py-2 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
                        >
                          {isGenerating ? 'Generating...' : message ? 'Regenerate Message' : 'Generate Message'}
                        </button>
                      </div>
                    )}
                    
                    {isGenerating && (
                      <div className="text-center text-sm text-gray-600">
                        Processing your request...
                      </div>
                    )}
                    
                    {error && (
                      <div className="text-red-500 text-sm">
                        {error}
                      </div>
                    )}
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
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                      title={isListening ? 'Stop recording' : 'Start recording'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Message controls */}
                  <div className="space-y-4">
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
                            onClick={() => improveExistingMessage('make it shorter')}
                            className="text-primary-600 hover:text-primary-700 disabled:opacity-50"
                            disabled={isGenerating || !selectedRecipient}
                          >
                            {isGenerating ? 'Improving...' : 'Make Shorter'}
                          </button>
                          <button
                            onClick={() => improveExistingMessage('make it longer')}
                            className="text-primary-600 hover:text-primary-700 disabled:opacity-50"
                            disabled={isGenerating || !selectedRecipient}
                          >
                            {isGenerating ? 'Improving...' : 'Make Longer'}
                          </button>
                        </div>
                      )}
                    </div>
                    {error && (
                      <p className="text-red-500 text-sm mt-2">{error}</p>
                    )}

                    {/* Action buttons - Add this section */}
                    {selectedRecipient && message && (
                      <div className="flex gap-3">
                        <button
                          onClick={saveToDrafts}
                          className={`${baseButtonStyle} ${buttonStyles.success} flex-1`}
                        >
                          <Save className="w-4 h-4" />
                          Save to Drafts
                        </button>
                        <button
                          onClick={addToQueue}
                          className={`${baseButtonStyle} ${buttonStyles.primary} flex-1`}
                        >
                          <Archive className="w-4 h-4" />
                          Add to Review Queue
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
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Font:</span>
                      <select
                        value={selectedFont}
                        onChange={(e) => setSelectedFont(e.target.value as keyof typeof handwritingFonts)}
                        className="text-sm border rounded p-1 bg-white min-w-[160px]"
                      >
                        {Object.entries(handwritingFonts).map(([key, font]) => (
                          <option key={key} value={key}>
                            {font.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Size:</span>
                      <select
                        value={selectedCardSize}
                        onChange={(e) => setSelectedCardSize(e.target.value as keyof typeof cardSizes)}
                        className="text-sm border rounded p-1 bg-white min-w-[120px]"
                      >
                        {Object.entries(cardSizes).map(([size, details]) => (
                          <option key={size} value={size}>
                            {details.displaySize}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8 rounded-lg">
                <div className={`
                  bg-white/80 backdrop-blur-sm
                  border border-gray-200/50
                  rounded-lg shadow-md
                  transition-all duration-300
                  hover:shadow-lg hover:scale-102
                  mx-auto overflow-hidden
                  ${cardSizes[selectedCardSize].aspect}
                `}>
                  <div className="p-8 h-full relative">
                    <div className={`
                      text-neutral-800 w-full h-full 
                      whitespace-pre-wrap text-left
                      ${handwritingFonts[selectedFont].class} 
                      ${cardSizes[selectedCardSize].fontSize}
                      leading-relaxed
                      bg-gradient-to-r from-gray-700 to-gray-800 
                      bg-clip-text text-transparent
                      transition-opacity duration-300
                      !font-normal
                    `}>
                      {message || (
                        <span className="opacity-40 select-none">
                          Your message will appear here...
                          <br />
                          Start typing or use AI assistance to generate a message.
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(75,85,99,0.05),transparent_40%)]" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-700 font-medium">
                    {cardSizes[selectedCardSize].displaySize}
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

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="font-heading text-xl text-neutral-900">Bulk Import Thank You Cards</h2>
              <p className="text-sm text-gray-500">Step {bulkImportStep} of 4</p>
            </div>

            <div className="p-6 overflow-y-auto">
              {bulkImportStep === 1 && (
                <div className="space-y-4">
                  <p>Upload a CSV file with the following columns:</p>
                  <ul className="list-disc pl-5">
                    <li>Gift or Reason for Thanks</li>
                    <li>From Person</li>
                    <li>Occasion (optional)</li>
                    <li>Date Received (optional)</li>
                  </ul>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </div>
              )}

              {bulkImportStep === 2 && (
                <div className="space-y-4">
                  <p>Review imported data and match with contacts:</p>
                  <div className="max-h-96 overflow-y-auto">
                    {importedData.items.map((item, index) => (
                      <div key={index} className="p-4 border rounded mb-2">
                        <p><strong>From:</strong> {item.fromPerson}</p>
                        <p><strong>Gift/Reason:</strong> {item.giftOrReason}</p>
                        {item.occasion && <p><strong>Occasion:</strong> {item.occasion}</p>}
                        {item.dateReceived && <p><strong>Date:</strong> {item.dateReceived}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bulkImportStep === 3 && (
                <div className="space-y-4">
                  <p>Review contact matches and generate messages:</p>
                  <div className="max-h-96 overflow-y-auto">
                    {thankYouItems.map((item) => (
                      <div key={item.id} className="p-4 border rounded mb-2">
                        <p><strong>From:</strong> {item.fromPerson}</p>
                        <p><strong>Gift/Reason:</strong> {item.giftOrReason}</p>
                        {item.occasion && <p><strong>Occasion:</strong> {item.occasion}</p>}
                        <p><strong>Contact Match:</strong> {item.contact?.name || 'No match found'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bulkImportStep === 4 && (
                <div className="space-y-4">
                  <p>Review generated messages:</p>
                  <div className="max-h-96 overflow-y-auto">
                    {thankYouItems.map((item) => (
                      <div key={item.id} className="p-4 border rounded mb-2">
                        <p><strong>To:</strong> {item.fromPerson}</p>
                        <p><strong>Gift/Reason:</strong> {item.giftOrReason}</p>
                        {item.suggestedMessage && (
                          <div className="mt-2 p-3 bg-gray-50 rounded">
                            {item.suggestedMessage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
              <button
                onClick={() => {
                  setShowBulkImport(false);
                  setBulkImportStep(1);
                }}
                className={`${baseButtonStyle} ${buttonStyles.ghost}`}
              >
                Cancel
              </button>
              <div className="space-x-2">
                {bulkImportStep > 1 && (
                  <button
                    onClick={() => setBulkImportStep(step => step - 1)}
                    className={`${baseButtonStyle} ${buttonStyles.outline}`}
                  >
                    Back
                  </button>
                )}
                {bulkImportStep === 2 && (
                  <button
                    onClick={matchContacts}
                    className={`${baseButtonStyle} ${buttonStyles.primary}`}
                  >
                    Match Contacts
                  </button>
                )}
                {bulkImportStep === 3 && (
                  <button
                    onClick={generateBulkMessages}
                    className={`${baseButtonStyle} ${buttonStyles.primary}`}
                  >
                    Generate Messages
                  </button>
                )}
                {bulkImportStep === 4 && (
                  <button
                    onClick={finalizeAndSave}
                    className={`${baseButtonStyle} ${buttonStyles.success}`}
                  >
                    Add to Message Queue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {editingContact && renderEditForm()}
    </div>
  );
};

import { Session } from "next-auth";

export const authConfig = {
  providers: [
    // Configure auth providers
  ],
  callbacks: {
    async session({ session, token }: { session: Session; token: any }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub
        }
      }
    }
  }
}

// 3. Route Protection
import { withAuth } from 'next-auth/middleware'

export const authMiddleware = withAuth({
  callbacks: {
    authorized: ({ token }) => !!token
  }
});

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
}

// 4. Error Boundary Component
'use client'

export function ErrorBoundary({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2>Something went wrong!</h2>
        <button
          onClick={() => reset()}
          className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-white"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

export default CardManager;