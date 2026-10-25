/**
 * Seed data for Jashn.
 * Includes three diverse, realistic celebrations with dynamic future dates:
 * 1. Royal Destination Wedding (Jaipur)
 * 2. 10th Superhero Birthday Bash (Mumbai)
 * 3. Greenwood Community Diwali Gala (Bangalore)
 */

function futureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

export const SEED_EVENTS = [
  {
    id: 'seed-wedding-jaipur',
    title: "Priya & Rohan's Royal Palace Wedding",
    type: 'wedding',
    date: futureDate(65),
    city: 'Jaipur',
    guestCount: 350,
    totalBudget: 2500000,
    currency: 'INR',
    priorities: ['catering', 'photography', 'decor'],
    dietary: ['vegetarian', 'jain', 'vegan'],
    theme: 'Royal Rajasthani Heritage & Marigold Romance',
    notes: 'Multi-day celebration: Mehendi, Sangeet, and Royal Pheras at heritage haveli.',
    budget: {
      total: 2500000,
      currency: 'INR',
      perGuest: 7142,
      tightBudget: false,
      contingencyPercent: 10,
      allocations: [
        { category: 'Venue', amount: 625000, percentage: 25, actualSpent: 600000, description: 'Heritage Haveli courtyard & banquet hall' },
        { category: 'Catering', amount: 800000, percentage: 32, actualSpent: 750000, description: 'Royal Rajasthani & Continental buffet (350 pax)' },
        { category: 'Photography & Video', amount: 300000, percentage: 12, actualSpent: 280000, description: 'Candid photo + cinematic teaser + drone coverage' },
        { category: 'Decor & Flowers', amount: 325000, percentage: 13, actualSpent: 310000, description: 'Marigold floral mandap, fairy lights, royal drapes' },
        { category: 'Music & Entertainment', amount: 125000, percentage: 5, actualSpent: 100000, description: 'Folk singers, live Dhol, DJ for Sangeet' },
        { category: 'Attire & Makeup', amount: 150000, percentage: 6, actualSpent: 160000, description: 'Bridal lehenga, sherwani, bridal makeup artist' },
        { category: 'Gifts & Invites', amount: 50000, percentage: 2, actualSpent: 35000, description: 'Handcrafted box invites & artisanal mithai favors' },
        { category: 'Contingency', amount: 125000, percentage: 5, actualSpent: 0, description: 'Emergency buffer & last-minute transport' }
      ]
    },
    tasks: [
      { id: 'w1', title: 'Confirm Haveli Venue & Sign Deposit', category: 'Venue', dueDate: futureDate(55), status: 'completed', urgency: 'critical', notes: 'Advance paid, contract filed' },
      { id: 'w2', title: 'Finalize Royal Banquet Tasting & Menu', category: 'Catering', dueDate: futureDate(45), status: 'completed', urgency: 'critical', notes: 'Include dedicated Jain counter' },
      { id: 'w3', title: 'Book Candid Photographer & Drone Team', category: 'Photography', dueDate: futureDate(40), status: 'completed', urgency: 'high', notes: 'Shot list shared' },
      { id: 'w4', title: 'Mandap Floral Architecture Approval', category: 'Decor', dueDate: futureDate(30), status: 'in_progress', urgency: 'high', notes: 'Samples checked for fresh tuberose' },
      { id: 'w5', title: 'Send Digital & Box Invitations with RSVP Link', category: 'Invites', dueDate: futureDate(25), status: 'in_progress', urgency: 'high', notes: 'Track RSVPs via WhatsApp & app' },
      { id: 'w6', title: 'Bridal & Groom Final Wardrobe Fittings', category: 'Attire', dueDate: futureDate(15), status: 'pending', urgency: 'medium', notes: 'Scheduled with boutique designer' },
      { id: 'w7', title: 'Coordinate Guest Pickups & Bus Fleet', category: 'Logistics', dueDate: futureDate(7), status: 'pending', urgency: 'medium', notes: 'Flight arrival schedules compiled' },
      { id: 'w8', title: 'Day-of Emergency Kit & Vendor Walkthrough', category: 'Coordination', dueDate: futureDate(2), status: 'pending', urgency: 'critical', notes: 'Safety pins, medical kit, schedule sheet' }
    ],
    vendors: [
      { id: 'v1', name: 'Alila Haveli Palace', category: 'Venue', status: 'booked', quote: 600000, phone: '+91 98290 11223', email: 'events@alilahaveli.com', notes: 'Courtyard booked for Pheras' },
      { id: 'v2', name: 'Shahi Dawat Caterers', category: 'Catering', status: 'booked', quote: 750000, phone: '+91 98291 44556', email: 'rajesh@shahidawat.com', notes: 'Confirmed 350 plates + Jain counter' },
      { id: 'v3', name: 'Lumiere Wedding Stories', category: 'Photography', status: 'booked', quote: 280000, phone: '+91 98292 77889', email: 'hello@lumiereweddings.in', notes: '3 candid + 2 cinematic cinematographers' },
      { id: 'v4', name: 'Genda Phool Decor Studio', category: 'Decor', status: 'quoted', quote: 310000, phone: '+91 98293 99001', email: 'decor@gendaphool.com', notes: 'Reviewing entrance floral arch mockups' },
      { id: 'v5', name: 'DJ Suketu Live', category: 'Music', status: 'contacted', quote: 110000, phone: '+91 98294 22334', email: 'bookings@suketu.in', notes: 'Awaiting revised quote with live dhol troupe' }
    ],
    ideas: {
      source: 'offline',
      themeSuggestions: [
        { name: 'Royal Rajputana Darbar', description: 'Deep jewel tones (maroon, saffron, emerald) with antique brass diyas and sitar players.' },
        { name: 'Sunlit Marigold Festive Romance', description: 'Canopies of fresh yellow and orange marigolds with pink bougainvillea accents.' }
      ],
      decorHighlights: [
        'Floating flower urli bowls with fragrant mogra and tea-lights along the entrance path',
        'Mirror-work Rajasthani umbrellas for the colorful Mehendi photo booth',
        'Fairy light canopy over the dining lawn mimicking starry desert skies'
      ],
      menuSuggestions: [
        { course: 'Welcome Drinks', item: 'Spiced Rose Sharbat & Fresh Coconut Water with Mint' },
        { course: 'Mehendi Live Stations', item: 'Mini Dal Baati Churma Shots, Poha Jalebi Counter, Palak Patta Chaat' },
        { course: 'Royal Dinner Feast', item: 'Laal Maas, Paneer Kadhai, Ker Sangri, Jodhpur Gatta Curry, Garlic Naan' },
        { course: 'Dessert Extravaganza', item: 'Warm Moong Dal Halwa, Rabdi Jalebi, Artisanal Paan Kulfi' }
      ],
      entertainment: [
        'Traditional Manganiyar folk singers welcoming guests with Kamaicha',
        'Sangeet flashmob choreographed with both families',
        'Royal entry with Rajasthani nagada drums and rose petal shower'
      ],
      runOfShow: [
        { time: '04:00 PM', event: 'Guest Welcome with Tilak & Shehnai' },
        { time: '05:30 PM', event: 'Sunset Royal Baraat Procession' },
        { time: '06:45 PM', event: 'Jaimala Ceremony on Haveli Terrace' },
        { time: '08:00 PM', event: 'Vedic Pheras & Mandap Blessings' },
        { time: '09:15 PM', event: 'Royal Banquet Dinner & Live Folk Music' }
      ]
    }
  },
  {
    id: 'seed-birthday-superhero',
    title: "Aarav's 10th Superhero Birthday Bash",
    type: 'birthday',
    date: futureDate(18),
    city: 'Mumbai',
    guestCount: 40,
    totalBudget: 45000,
    currency: 'INR',
    priorities: ['decor', 'entertainment', 'catering'],
    dietary: ['vegetarian', 'nut-free'],
    theme: 'Avengers Comic Universe & Training Academy',
    notes: 'Kids-friendly party with obstacle training course, custom capes, and photo ops.',
    budget: {
      total: 45000,
      currency: 'INR',
      perGuest: 1125,
      tightBudget: false,
      contingencyPercent: 8,
      allocations: [
        { category: 'Venue & Clubhouse', amount: 8000, percentage: 18, actualSpent: 7500, description: 'Society clubhouse hall with lawn access' },
        { category: 'Catering & Snacks', amount: 16000, percentage: 36, actualSpent: 15500, description: 'Kids burger sliders, pizza pockets, fries, juices, cake' },
        { category: 'Cake & Desserts', amount: 4500, percentage: 10, actualSpent: 4500, description: '3D Fondant Avengers 3kg chocolate truffle cake' },
        { category: 'Decor & Balloon Arch', amount: 7000, percentage: 16, actualSpent: 6500, description: 'Marvel comic backdrop, red & blue balloon garland' },
        { category: 'Entertainment & Games', amount: 5500, percentage: 12, actualSpent: 5000, description: 'Game host / superhero performer + laser obstacle course' },
        { category: 'Return Gifts & Favors', amount: 4000, percentage: 8, actualSpent: 3800, description: 'Personalized superhero mugs & comic goodie bags' }
      ]
    },
    tasks: [
      { id: 'b1', title: 'Book Society Clubhouse & Pay Security', category: 'Venue', dueDate: futureDate(15), status: 'completed', urgency: 'critical', notes: 'Permission letter stamped' },
      { id: 'b2', title: 'Order Avengers 3D Fondant Cake (Nut-Free)', category: 'Cake', dueDate: futureDate(12), status: 'completed', urgency: 'high', notes: 'Design approved with baker' },
      { id: 'b3', title: 'Assemble Superhero Capes & Masks for Guests', category: 'Favors', dueDate: futureDate(8), status: 'in_progress', urgency: 'medium', notes: 'Ordered 40 cape kits' },
      { id: 'b4', title: 'Confirm Game Host & Obstacle Course Props', category: 'Entertainment', dueDate: futureDate(5), status: 'pending', urgency: 'high', notes: 'Kryptonite hunt game setup' },
      { id: 'b5', title: 'Order Finger Foods & Fresh Fruit Juice Slushies', category: 'Catering', dueDate: futureDate(3), status: 'pending', urgency: 'medium', notes: 'Confirm nut-free safety protocol' }
    ],
    vendors: [
      { id: 'vb1', name: 'SugarCraft Boutique Cakes', category: 'Cake', status: 'booked', quote: 4500, phone: '+91 98200 33441', email: 'order@sugarcraft.in', notes: 'Deliver at 3:30 PM on party day' },
      { id: 'vb2', name: 'FunZone Kids Animators', category: 'Entertainment', status: 'booked', quote: 5000, phone: '+91 98201 55662', email: 'fun@funzoneevents.com', notes: 'Host dressed as Spider-Man' },
      { id: 'vb3', name: 'Rainbow Balloons & Party Deco', category: 'Decor', status: 'booked', quote: 6500, phone: '+91 98202 88993', email: 'party@rainbowballoons.com', notes: 'Includes comic speech-bubble cutouts' }
    ],
    ideas: {
      source: 'offline',
      themeSuggestions: [
        { name: 'Avengers S.H.I.E.L.D. Cadet Academy', description: 'Kids complete agility challenges to earn their superhero badge and cape.' }
      ],
      decorHighlights: [
        'Comic book POW / BAM explosion signs and skyline silhouette backdrop',
        'Life-size cutout photo-booth with Thor Hammer and Captain America Shield'
      ],
      menuSuggestions: [
        { course: 'Super Power Snacks', item: 'Thor’s Cheese Hammer Sticks, Hulk Green Guacamole Nachos' },
        { course: 'Main Fuel', item: 'Iron Man Margherita Pizza, Spidey Slider Sliders, Curly Fries' },
        { course: 'Hero Fuel Drinks', item: 'Hulk Smash Kiwi Cooler & Captain Berry Fizz' }
      ],
      entertainment: [
        'Laser beam yarn maze challenge',
        'Tug-of-war: Villains vs Superheroes',
        'Pin the Arc Reactor on Iron Man'
      ],
      runOfShow: [
        { time: '04:30 PM', event: 'Cadet Check-in: Receive Cape, Mask & ID Badge' },
        { time: '05:00 PM', event: 'Spider-Man Superhero Training Games' },
        { time: '06:15 PM', event: 'Grand Cake Cutting Ceremony' },
        { time: '06:45 PM', event: 'Kids Dinner Buffet & Super Drinks' },
        { time: '07:30 PM', event: 'Graduation Certificates & Return Gift Handout' }
      ]
    }
  },
  {
    id: 'seed-community-diwali',
    title: 'Greenwood Community Diwali Milan & Mela',
    type: 'community',
    date: futureDate(32),
    city: 'Bangalore',
    guestCount: 200,
    totalBudget: 150000,
    currency: 'INR',
    priorities: ['decor', 'catering', 'entertainment'],
    dietary: ['vegetarian'],
    theme: 'Festival of Lights: Rangoli, Diya Labyrinth & Cultural Stage',
    notes: 'Neighborhood cultural gathering celebrating Diwali with youth dance, rangoli contest, and eco-friendly diyas.',
    budget: {
      total: 150000,
      currency: 'INR',
      perGuest: 750,
      tightBudget: false,
      contingencyPercent: 8,
      allocations: [
        { category: 'Community Amphitheatre & Tent', amount: 30000, percentage: 20, actualSpent: 28000, description: 'Stage setup, canopy tents, 200 chairs' },
        { category: 'Festive Buffet & Sweets', amount: 65000, percentage: 43, actualSpent: 62000, description: 'Live chaat counter, poori chole, gulab jamun, masala chai' },
        { category: 'Sound System & Stage Lights', amount: 20000, percentage: 13, actualSpent: 19000, description: 'Microphones, wireless speakers, stage uplighting' },
        { category: 'Eco Diya & Floral Decor', amount: 18000, percentage: 12, actualSpent: 16500, description: '500 terracotta diyas, marigold garlands, rangoli colors' },
        { category: 'Prizes & Rangoli Contest', amount: 7000, percentage: 5, actualSpent: 5000, description: 'Trophies and vouchers for society cultural competitions' },
        { category: 'Safety & Contingency', amount: 10000, percentage: 7, actualSpent: 2000, description: 'First aid stall, fire extinguisher checkpoints' }
      ]
    },
    tasks: [
      { id: 'c1', title: 'File Society AGM & Municipality Permission', category: 'Permits', dueDate: futureDate(28), status: 'completed', urgency: 'critical', notes: 'Permission received from RWA committee' },
      { id: 'c2', title: 'Sound & Mic Rental Vendor Contract', category: 'Logistics', dueDate: futureDate(22), status: 'completed', urgency: 'high', notes: 'Advance receipt retained' },
      { id: 'c3', title: 'Announce Rangoli & Cultural Registrations', category: 'Community', dueDate: futureDate(15), status: 'in_progress', urgency: 'high', notes: '24 resident entries registered' },
      { id: 'c4', title: 'Finalize Live Chaat & Festive Dinner Caterer', category: 'Catering', dueDate: futureDate(10), status: 'in_progress', urgency: 'high', notes: 'Pure veg menu certified' },
      { id: 'c5', title: 'Setup Diya Labyrinth on Central Lawn', category: 'Decor', dueDate: futureDate(1), status: 'pending', urgency: 'medium', notes: 'Volunteer team assigned' }
    ],
    vendors: [
      { id: 'vc1', name: 'Apex Sound & Stage Bangalore', category: 'Sound', status: 'booked', quote: 19000, phone: '+91 98450 11990', email: 'info@apexsound.in', notes: 'Includes 4 wireless cordless mics' },
      { id: 'vc2', name: 'Annapurna Community Caterers', category: 'Catering', status: 'booked', quote: 62000, phone: '+91 98451 22881', email: 'annapurna@festivefood.in', notes: 'Confirmed dinner for 200 residents' },
      { id: 'vc3', name: 'Prakriti Eco Terracotta Crafts', category: 'Decor', status: 'quoted', quote: 16500, phone: '+91 98452 33772', email: 'diyas@prakriti.org', notes: '500 clay diyas + natural rangoli powder' }
    ],
    ideas: {
      source: 'offline',
      themeSuggestions: [
        { name: 'Prakriti Diwali (Eco Heritage)', description: 'Terracotta lamps, seed paper greeting cards, and floral mandalas.' }
      ],
      decorHighlights: [
        'Central circular rangoli created collaboratively by society youth',
        'Warm string lights framing the society amphitheatre steps',
        'Selfie booth with decorative brass urlis and traditional backdrop'
      ],
      menuSuggestions: [
        { course: 'Welcome Drinks', item: 'Saffron Badam Milk & Masala Chai' },
        { course: 'Live Street Counters', item: 'Pani Puri, Dahi Bhalla, Pav Bhaji' },
        { course: 'Community Dinner', item: 'Amritsari Kulche, Dal Makhani, Paneer Tikka Masala, Jeera Rice' },
        { course: 'Festive Mithai', item: 'Hot Angoori Gulab Jamun & Kaju Katli' }
      ],
      entertainment: [
        'Children’s mythological fancy dress parade',
        'Senior citizens antakshari competition',
        'Community Dandiya / Folk dance circle'
      ],
      runOfShow: [
        { time: '05:30 PM', event: 'Rangoli Competition Showcase & Judging' },
        { time: '06:30 PM', event: 'Community Diya Lighting & Prayer' },
        { time: '07:00 PM', event: 'Resident Cultural Performances & Dance' },
        { time: '08:15 PM', event: 'Prize Distribution & Gala Buffet Opens' },
        { time: '09:45 PM', event: 'Eco-friendly Sparkler Celebration & Wrap-up' }
      ]
    }
  }
];
