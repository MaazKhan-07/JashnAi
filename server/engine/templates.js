/**
 * Event-type templates: base budget allocations, ideal lead times,
 * timeline phases, vendor categories, and idea categories.
 * Pure data — no logic.
 */

/** Base budget allocation percentages per event type */
export const BUDGET_TEMPLATES = {
  wedding: {
    venue: 20,
    catering: 25,
    decor: 12,
    photography: 10,
    music: 5,
    makeup: 4,
    transport: 3,
    invitations: 3,
    gifts: 4,
    attire: 6,
    contingency: 5,
    miscellaneous: 3,
  },
  birthday: {
    venue: 20,
    catering: 30,
    decor: 15,
    photography: 8,
    music: 8,
    cake: 5,
    invitations: 2,
    gifts: 4,
    contingency: 5,
    miscellaneous: 3,
  },
  community: {
    venue: 18,
    catering: 22,
    decor: 10,
    entertainment: 12,
    sound_lighting: 8,
    permits: 5,
    safety: 5,
    publicity: 6,
    volunteers: 2,
    prizes: 4,
    contingency: 5,
    miscellaneous: 3,
  },
};

/** Ideal lead time in days per event type */
export const IDEAL_LEAD_DAYS = {
  wedding: 365,
  birthday: 56,
  community: 70,
};

/** Priority-to-category mappings for budget boost logic */
export const PRIORITY_CATEGORY_MAP = {
  food: ['catering', 'cake'],
  decor: ['decor'],
  photography: ['photography'],
  entertainment: ['music', 'entertainment', 'sound_lighting'],
  venue: ['venue'],
  guest_experience: ['gifts', 'prizes', 'catering'],
};

/** Per-head budget floor in INR below which "tight budget" mode activates */
export const TIGHT_BUDGET_FLOOR_INR = 1500;

/** Categories to trim first in tight-budget mode (order matters) */
export const TRIM_ORDER = ['miscellaneous', 'gifts', 'prizes', 'decor', 'entertainment', 'music', 'sound_lighting'];

/** Guest-count thresholds for catering share scaling */
export const CATERING_SCALE_THRESHOLDS = [
  { above: 300, boost: 4 },
  { above: 150, boost: 2 },
  { above: 50, boost: 1 },
];

/**
 * Timeline milestone templates per event type.
 * offsetRatio: 0 = today, 1 = event day.
 * Critical tasks are pushed to front in fast-track mode.
 */
export const TIMELINE_TEMPLATES = {
  wedding: [
    { phase: 'Planning', task: 'Set budget and guest list', offsetRatio: 0.05, owner: 'self', priority: 'high', critical: true },
    { phase: 'Planning', task: 'Book venue', offsetRatio: 0.08, owner: 'self', priority: 'high', critical: true },
    { phase: 'Planning', task: 'Book caterer', offsetRatio: 0.12, owner: 'self', priority: 'high', critical: true },
    { phase: 'Planning', task: 'Book photographer & videographer', offsetRatio: 0.15, owner: 'self', priority: 'high', critical: false },
    { phase: 'Planning', task: 'Choose wedding theme & color palette', offsetRatio: 0.18, owner: 'self', priority: 'medium', critical: false },
    { phase: 'Planning', task: 'Book makeup artist', offsetRatio: 0.20, owner: 'family', priority: 'medium', critical: false },
    { phase: 'Preparation', task: 'Send save-the-dates', offsetRatio: 0.25, owner: 'self', priority: 'high', critical: false },
    { phase: 'Preparation', task: 'Book music/DJ/band', offsetRatio: 0.28, owner: 'self', priority: 'medium', critical: false },
    { phase: 'Preparation', task: 'Finalize menu with caterer', offsetRatio: 0.35, owner: 'self', priority: 'high', critical: true },
    { phase: 'Preparation', task: 'Book transport (baraat, guest shuttles)', offsetRatio: 0.38, owner: 'family', priority: 'medium', critical: false },
    { phase: 'Preparation', task: 'Order wedding attire', offsetRatio: 0.40, owner: 'self', priority: 'high', critical: false },
    { phase: 'Preparation', task: 'Send formal invitations', offsetRatio: 0.50, owner: 'self', priority: 'high', critical: false },
    { phase: 'Preparation', task: 'Plan Haldi ceremony details', offsetRatio: 0.55, owner: 'family', priority: 'medium', critical: false },
    { phase: 'Preparation', task: 'Plan Sangeet performances & playlist', offsetRatio: 0.58, owner: 'family', priority: 'medium', critical: false },
    { phase: 'Preparation', task: 'Confirm decor with vendor', offsetRatio: 0.60, owner: 'vendor', priority: 'high', critical: false },
    { phase: 'Final Prep', task: 'Follow up on RSVPs', offsetRatio: 0.70, owner: 'self', priority: 'high', critical: false },
    { phase: 'Final Prep', task: 'Finalize seating arrangement', offsetRatio: 0.75, owner: 'self', priority: 'medium', critical: false },
    { phase: 'Final Prep', task: 'Trial makeup & hair', offsetRatio: 0.78, owner: 'self', priority: 'medium', critical: false },
    { phase: 'Final Prep', task: 'Pack return gifts (favors)', offsetRatio: 0.82, owner: 'family', priority: 'low', critical: false },
    { phase: 'Final Prep', task: 'Final venue walkthrough', offsetRatio: 0.88, owner: 'self', priority: 'high', critical: true },
    { phase: 'Final Prep', task: 'Confirm all vendor timings', offsetRatio: 0.90, owner: 'self', priority: 'high', critical: true },
    { phase: 'Day-of', task: 'Bridal/groom prep', offsetRatio: 0.97, owner: 'self', priority: 'high', critical: false },
    { phase: 'Day-of', task: 'Venue setup supervision', offsetRatio: 0.98, owner: 'family', priority: 'high', critical: true },
    { phase: 'Day-of', task: 'Guest welcome & coordination', offsetRatio: 1.0, owner: 'family', priority: 'high', critical: false },
  ],
  birthday: [
    { phase: 'Planning', task: 'Set budget and theme', offsetRatio: 0.05, owner: 'self', priority: 'high', critical: true },
    { phase: 'Planning', task: 'Book venue or prep home', offsetRatio: 0.10, owner: 'self', priority: 'high', critical: true },
    { phase: 'Planning', task: 'Book caterer or plan menu', offsetRatio: 0.15, owner: 'self', priority: 'high', critical: true },
    { phase: 'Planning', task: 'Order or design cake', offsetRatio: 0.20, owner: 'self', priority: 'high', critical: false },
    { phase: 'Preparation', task: 'Send invitations', offsetRatio: 0.30, owner: 'self', priority: 'high', critical: false },
    { phase: 'Preparation', task: 'Book photographer', offsetRatio: 0.35, owner: 'self', priority: 'medium', critical: false },
    { phase: 'Preparation', task: 'Arrange music/playlist/DJ', offsetRatio: 0.40, owner: 'self', priority: 'medium', critical: false },
    { phase: 'Preparation', task: 'Plan games and activities', offsetRatio: 0.50, owner: 'self', priority: 'medium', critical: false },
    { phase: 'Preparation', task: 'Buy decor & party supplies', offsetRatio: 0.55, owner: 'self', priority: 'medium', critical: false },
    { phase: 'Preparation', task: 'Arrange return gifts', offsetRatio: 0.60, owner: 'self', priority: 'low', critical: false },
    { phase: 'Final Prep', task: 'Confirm final headcount', offsetRatio: 0.75, owner: 'self', priority: 'high', critical: false },
    { phase: 'Final Prep', task: 'Finalize food order & dietary needs', offsetRatio: 0.80, owner: 'self', priority: 'high', critical: true },
    { phase: 'Final Prep', task: 'Set up decorations', offsetRatio: 0.92, owner: 'self', priority: 'medium', critical: false },
    { phase: 'Day-of', task: 'Final venue prep & food setup', offsetRatio: 0.97, owner: 'self', priority: 'high', critical: false },
    { phase: 'Day-of', task: 'Welcome guests & enjoy!', offsetRatio: 1.0, owner: 'self', priority: 'high', critical: false },
  ],
  community: [
    { phase: 'Planning', task: 'Form organizing committee', offsetRatio: 0.05, owner: 'self', priority: 'high', critical: true },
    { phase: 'Planning', task: 'Set budget & get approvals', offsetRatio: 0.08, owner: 'self', priority: 'high', critical: true },
    { phase: 'Planning', task: 'Book venue / reserve community space', offsetRatio: 0.10, owner: 'self', priority: 'high', critical: true },
    { phase: 'Planning', task: 'Apply for permits & permissions', offsetRatio: 0.12, owner: 'self', priority: 'high', critical: true },
    { phase: 'Planning', task: 'Book caterer / food stalls', offsetRatio: 0.18, owner: 'volunteer', priority: 'high', critical: true },
    { phase: 'Preparation', task: 'Plan event program & schedule', offsetRatio: 0.25, owner: 'self', priority: 'high', critical: false },
    { phase: 'Preparation', task: 'Arrange entertainment (performers, games)', offsetRatio: 0.30, owner: 'volunteer', priority: 'medium', critical: false },
    { phase: 'Preparation', task: 'Book sound & lighting', offsetRatio: 0.35, owner: 'vendor', priority: 'medium', critical: false },
    { phase: 'Preparation', task: 'Design & distribute publicity', offsetRatio: 0.40, owner: 'volunteer', priority: 'medium', critical: false },
    { phase: 'Preparation', task: 'Arrange safety measures (first aid, fire extinguisher)', offsetRatio: 0.45, owner: 'self', priority: 'high', critical: true },
    { phase: 'Preparation', task: 'Recruit & brief volunteers', offsetRatio: 0.50, owner: 'self', priority: 'high', critical: false },
    { phase: 'Preparation', task: 'Procure prizes & giveaways', offsetRatio: 0.55, owner: 'volunteer', priority: 'low', critical: false },
    { phase: 'Preparation', task: 'Order decor & signage', offsetRatio: 0.60, owner: 'volunteer', priority: 'medium', critical: false },
    { phase: 'Final Prep', task: 'Confirm all vendor bookings', offsetRatio: 0.75, owner: 'self', priority: 'high', critical: true },
    { phase: 'Final Prep', task: 'Final safety walkthrough', offsetRatio: 0.85, owner: 'self', priority: 'high', critical: true },
    { phase: 'Final Prep', task: 'Set up venue & test equipment', offsetRatio: 0.92, owner: 'volunteer', priority: 'high', critical: false },
    { phase: 'Day-of', task: 'Volunteer coordination & check-in', offsetRatio: 0.97, owner: 'self', priority: 'high', critical: false },
    { phase: 'Day-of', task: 'Event execution & crowd management', offsetRatio: 1.0, owner: 'self', priority: 'high', critical: false },
  ],
};

/** Vendor categories per event type */
export const VENDOR_CATEGORIES = {
  wedding: ['venue', 'catering', 'decor', 'photography', 'videography', 'music', 'makeup', 'mehendi', 'transport', 'invitations', 'attire', 'jewellery', 'pandit', 'gifts'],
  birthday: ['venue', 'catering', 'decor', 'photography', 'music', 'cake', 'entertainment', 'invitations', 'gifts'],
  community: ['venue', 'catering', 'decor', 'entertainment', 'sound_lighting', 'permits', 'safety', 'publicity', 'prizes', 'transport'],
};

/** Questions to ask each vendor category */
export const VENDOR_QUESTIONS = {
  venue: [
    'What is the maximum capacity (seated and standing)?',
    'Is there a backup plan for rain/weather?',
    'Are there parking facilities? How many spots?',
    'What is included in the venue rental (tables, chairs, AV)?',
    'Is there a noise curfew? What are the timings?',
    'Are there accessibility features (ramps, elevators, accessible restrooms)?',
  ],
  catering: [
    'Can you accommodate dietary restrictions (vegan, Jain, halal, allergies)?',
    'Is tasting included before the event?',
    'What is the per-plate cost? Minimum order?',
    'Do you provide crockery, serving staff, and cleanup?',
    'How do you handle last-minute guest count changes?',
  ],
  decor: [
    'Can you share a mood board or portfolio?',
    'What is included vs. extra (lighting, flowers, draping)?',
    'Do you handle setup and teardown?',
    'What is the cancellation policy?',
  ],
  photography: [
    'How many hours of coverage are included?',
    'Do you provide both photo and video?',
    'When will we receive the edited deliverables?',
    'Can we see a full wedding/event gallery?',
    'Do you offer a pre-event shoot?',
  ],
  music: [
    'Can you play a mix of genres we request?',
    'Do you bring your own sound system?',
    'What is the setup time needed?',
    'Do you have experience with our type of event?',
  ],
  makeup: [
    'Do you offer a trial session?',
    'What products and brands do you use?',
    'How many people can you cover (bridesmaids, family)?',
    'Do you travel to the venue?',
  ],
  entertainment: [
    'What acts or activities do you offer?',
    'Is the content suitable for all ages?',
    'What space and equipment do you need?',
    'What is the duration of the performance?',
  ],
  default: [
    'What is included in your quote?',
    'What is your cancellation and refund policy?',
    'Do you have references from similar events?',
    'When is the final payment due?',
  ],
};

/** Currency conversion factors relative to INR */
export const CURRENCY_RATES = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
};

export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};
