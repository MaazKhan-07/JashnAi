/**
 * Offline idea generator engine.
 * Generates themes, decor, menu, entertainment, return gifts,
 * invitation wording, and run-of-show personalized to event context.
 *
 * Uses a seeded PRNG for determinism: same input → same output.
 * Pure function — no I/O.
 */

/**
 * @typedef {Object} IdeaInput
 * @property {'wedding'|'birthday'|'community'} eventType
 * @property {string} eventName
 * @property {number} guestCount
 * @property {string} style - theme/style preference
 * @property {string[]} dietary - dietary needs
 * @property {string[]} priorities
 * @property {number} budget
 * @property {string} currency
 * @property {string} city
 */

/**
 * @typedef {Object} IdeaResult
 * @property {string} source - 'offline' | 'gemini'
 * @property {Object} ideas
 * @property {string[]} ideas.themes
 * @property {string[]} ideas.decor
 * @property {string[]} ideas.menu
 * @property {string[]} ideas.entertainment
 * @property {string[]} ideas.returnGifts
 * @property {string} ideas.invitationWording
 * @property {string[]} ideas.runOfShow
 */

/**
 * Simple seeded PRNG (mulberry32).
 * @param {number} seed
 * @returns {function(): number} - returns 0-1
 */
function createRng(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a numeric seed from a string.
 * @param {string} str
 * @returns {number}
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Pick n items from an array using the RNG.
 * @param {any[]} arr
 * @param {number} n
 * @param {function} rng
 * @returns {any[]}
 */
function pick(arr, n, rng) {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

// ── Idea pools ──

const WEDDING_THEMES = [
  'Royal Rajasthani – jewel tones, mirror work, folk musicians',
  'Pastel Garden – soft pinks, lavender, fairy lights, floral arches',
  'Rustic Farmhouse – jute, marigolds, vintage furniture, earthy tones',
  'Modern Minimalist – clean whites, geometric shapes, succulents',
  'Bollywood Glamour – vibrant colors, sequins, movie-inspired photo ops',
  'South Indian Classic – banana leaves, brass lamps, jasmine garlands',
  'Mughal Elegance – ivory & gold, crystal chandeliers, Persian carpets',
  'Bohemian Chic – dream catchers, mismatched furniture, dried flowers',
  'Winter Wonderland – silver, white draping, candle-lit pathway',
  'Tropical Paradise – palm leaves, bright colors, tiki bar',
];

const BIRTHDAY_THEMES = [
  'Retro Bollywood Night – disco ball, vintage posters, 80s music',
  'Garden Brunch – fresh flowers, pastel linens, live acoustic music',
  'Neon Glow Party – blacklights, neon signs, glow sticks',
  'Elegant Wine & Cheese – charcuterie boards, candlelight, jazz',
  'Adventure & Travel – world map, passport invites, global cuisine',
  'Vintage Tea Party – lace, fine china, scones, cupcakes',
  'Masquerade Ball – masks, velvet, gold accents, mystery theme',
  'Sports Fan Celebration – jersey decor, stadium snacks, big screen',
  'Art Studio Party – painting stations, creative cocktails, gallery wall',
  'Rooftop Under the Stars – fairy lights, lounge seating, stargazing',
];

const COMMUNITY_THEMES = [
  'Diwali Mela – diyas, rangoli stations, crackers-free celebration, lanterns',
  'Holi Celebration – color stations, water play zone, DJ, street food',
  'Cultural Festival – dance stages, art stalls, heritage walk, food court',
  'Community Carnival – game booths, rides, cotton candy, prize wall',
  'Green & Clean Drive – eco-friendly decor, plantation, nature walk',
  'Music & Food Festival – live bands, food trucks, open mic',
  'Navratri Garba Night – dandiya, traditional dress, fast food stalls',
  'Sports Day – relay races, tug of war, trophies, refreshments',
  'Kids Fun Fair – bouncy castles, magic show, face painting, puppets',
  'Republic Day / Independence Day – patriotic decor, flag hoisting, cultural program',
];

const VEG_MENU = [
  'Paneer tikka, dal makhani, naan, jeera rice, raita',
  'Chole bhature with pickled onions & mint chutney',
  'Live chaat counter: pani puri, bhel, dahi vada, papdi chaat',
  'Rajasthani thali: dal baati churma, gatte ki sabzi, ker sangri',
  'South Indian spread: dosa, idli, vada, sambar, coconut chutney',
  'Mediterranean mezze: hummus, falafel, pita, tabbouleh, grilled veggies',
  'Italian corner: wood-fired pizza, pasta, bruschetta, tiramisu',
  'Street food live counters: pav bhaji, momos, vada pav, kulfi',
];

const VEGAN_MENU = [
  'Buddha bowls with quinoa, roasted veggies, tahini dressing',
  'Live dosa counter with coconut-based chutneys (no ghee)',
  'Vegan thali: dal, roti, sabzi, rice, pickle – all dairy-free',
  'Plant-based burgers with sweet potato fries & vegan mayo',
  'Asian fusion: stir-fried tofu, vegetable pad thai, spring rolls',
  'Mediterranean: falafel, hummus, baba ganoush, olive tapenade',
  'Raw food & smoothie bar with açai bowls, fresh juices',
  'Vegan desserts: date-walnut balls, coconut ladoo, fruit sorbet',
];

const NONVEG_MENU = [
  'Tandoori chicken, mutton biryani, butter chicken, roomali roti',
  'Lucknowi kebab platter: galouti, seekh, shammi, kakori',
  'Coastal seafood: fish curry, prawn masala, crab fry, appam',
  'Mughlai feast: nihari, korma, sheermal, phirni',
  'Indo-Chinese: chilli chicken, dragon chicken, fried rice, hakka noodles',
  'BBQ grill station: marinated chicken, lamb chops, fish tikka',
  'Hyderabadi spread: biryani, haleem, mirchi ka salan, double ka meetha',
  'Multi-cuisine buffet with live counters for pasta, wok, and grill',
];

const JAIN_MENU = [
  'Jain thali: no onion/garlic dal, sabudana khichdi, fruit raita',
  'Jain pizza & pasta (no root vegetables, no onion/garlic)',
  'Dry fruit ladoo, makhana kheer, jain-friendly chaat (no potato)',
  'Jain Mexican: bean burritos (no onion/garlic), guacamole, nachos',
];

const HALAL_MENU = [
  'Halal biryani counter with raita, mirchi salan, boiled egg',
  'Halal seekh kebab, shawarma wraps, and falafel platter',
  'Halal grilled chicken, mutton korma, naan & pulao',
];

const DECOR_IDEAS = [
  'Marigold & jasmine entrance arch with hanging diyas',
  'Fairy light canopy over the dining area',
  'Personalized photo wall with memories timeline',
  'Floating candles in brass urlis with rose petals',
  'Balloon garland arch in theme colors',
  'Eco-friendly decor: potted plants as centerpieces (guests take home)',
  'Paper lantern ceiling with soft downlighting',
  'Mandala rangoli at entrance with flower petals',
  'Vintage trunk & suitcase display with photos',
  'LED neon sign with event hashtag or couple/birthday name',
  'Banana leaf and brass bell South Indian entrance decor',
  'Fabric draping with fairy lights and chandelier clusters',
];

const ENTERTAINMENT_IDEAS = [
  'Live acoustic duo playing Bollywood melodies & classics',
  'DJ with curated playlist (Bollywood, pop, retro) + dance floor',
  'Photo booth with quirky props and instant prints',
  'Caricature artist sketching guests live',
  'Mehendi artist station for guests',
  'Magic show or mentalist for a wow factor',
  'Karaoke station with Bollywood & English hits',
  'Dance performance by friends & family (choreographed)',
  'Stand-up comedian for a 20-minute set',
  'Interactive cocktail/mocktail-making class',
  'Live pottery or art station',
  'Fireworks or sparkler send-off (check local rules)',
];

const GIFT_IDEAS = [
  'Personalized mini succulents in painted pots',
  'Custom tote bags with event artwork',
  'Artisan chocolate box with thank-you note',
  'Scented candle set in a jute pouch',
  'Seed paper bookmarks (plant them, they grow!)',
  'Miniature brass diya set (for Diwali/wedding)',
  'Custom spice box with local blends',
  'Handmade soap set in fabric wrap',
  'Photo magnets of the event (mailed later)',
  'Reusable bamboo cutlery set with pouch',
];

const INVITATION_TEMPLATES = {
  wedding: [
    `With joyful hearts, the families of {names} invite you to celebrate their union. Join us for an evening of love, laughter, and togetherness as two souls become one. Your presence is the greatest gift.`,
    `Together with our families, {names} request the pleasure of your company at their wedding celebration. Come share in our happiness as we begin this beautiful journey together.`,
    `Love is in the air! ✨ {names} are tying the knot and would be honored to have you witness their special day. Save the date for an unforgettable celebration of love.`,
  ],
  birthday: [
    `🎂 You're invited! Come celebrate {name}'s milestone birthday with great food, music, and company. Let's make this one for the books!`,
    `It's party time! 🎉 {name} is turning a fabulous new age and we'd love you to join the celebration. Expect good vibes, great food, and lots of laughter.`,
    `Life is short, eat cake first! 🍰 Join us as we celebrate {name}'s birthday with a day full of joy and surprises.`,
  ],
  community: [
    `🎊 You're invited to {name}! Join your neighbors for a day of community spirit, entertainment, food, and fun. Bring the whole family!`,
    `The community comes alive at {name}! 🌟 We've planned an amazing event with something for everyone. Mark your calendars and be part of the celebration.`,
    `Get ready for {name}! 🎪 A celebration of togetherness with cultural programs, games, food stalls, and much more. See you there!`,
  ],
};

/**
 * Generate offline ideas personalized to event context.
 * @param {IdeaInput} input
 * @returns {IdeaResult}
 */
export function generateIdeas(input) {
  const { eventType, eventName, guestCount, style, dietary = [], priorities = [], budget, currency, city } = input;

  // Create deterministic seed from input
  const seedStr = `${eventType}-${eventName}-${guestCount}-${budget}-${city}`;
  const rng = createRng(hashString(seedStr));

  // Themes
  const themePool = eventType === 'wedding' ? WEDDING_THEMES
    : eventType === 'birthday' ? BIRTHDAY_THEMES
    : COMMUNITY_THEMES;
  const themes = pick(themePool, 3, rng);

  // Decor
  const decor = pick(DECOR_IDEAS, 4, rng);

  // Menu (respect dietary needs)
  const menu = buildMenu(dietary, rng);

  // Entertainment
  const entertainment = pick(ENTERTAINMENT_IDEAS, 4, rng);

  // Return gifts
  const returnGifts = pick(GIFT_IDEAS, 3, rng);

  // Invitation wording
  const invTemplates = INVITATION_TEMPLATES[eventType] || INVITATION_TEMPLATES.birthday;
  let invitationWording = invTemplates[Math.floor(rng() * invTemplates.length)];
  invitationWording = invitationWording
    .replace('{names}', eventName)
    .replace('{name}', eventName);

  // Run of show
  const runOfShow = generateRunOfShow(eventType, rng);

  return {
    source: 'offline',
    ideas: {
      themes,
      decor,
      menu,
      entertainment,
      returnGifts,
      invitationWording,
      runOfShow,
    },
  };
}

/**
 * Build menu suggestions based on dietary needs.
 * @param {string[]} dietary
 * @param {function} rng
 * @returns {string[]}
 */
function buildMenu(dietary, rng) {
  const items = [];
  const dietaryLower = dietary.map(d => d.toLowerCase());

  if (dietaryLower.includes('vegan')) {
    items.push(...pick(VEGAN_MENU, 3, rng));
  } else if (dietaryLower.includes('jain')) {
    items.push(...pick(JAIN_MENU, 2, rng));
    items.push(...pick(VEG_MENU, 2, rng));
  } else if (dietaryLower.includes('veg') || dietaryLower.includes('vegetarian')) {
    items.push(...pick(VEG_MENU, 3, rng));
  } else {
    // Mixed menu
    items.push(...pick(VEG_MENU, 2, rng));
    if (dietaryLower.includes('halal')) {
      items.push(...pick(HALAL_MENU, 2, rng));
    } else {
      items.push(...pick(NONVEG_MENU, 2, rng));
    }
  }

  return items;
}

/**
 * Generate a simple run-of-show outline.
 * @param {string} eventType
 * @param {function} rng
 * @returns {string[]}
 */
function generateRunOfShow(eventType, rng) {
  if (eventType === 'wedding') {
    return [
      '4:00 PM – Guest arrival & welcome drinks',
      '4:30 PM – Haldi/Mehendi activities (if applicable)',
      '5:30 PM – Sangeet performances begin',
      '7:00 PM – Wedding ceremony (pheras/rituals)',
      '8:00 PM – Dinner service opens',
      '9:00 PM – Couple\'s first dance & toasts',
      '9:30 PM – DJ/Band takes over, dance floor opens',
      '11:00 PM – Dessert & farewell gifts',
    ];
  }
  if (eventType === 'birthday') {
    return [
      '12:00 PM – Welcome & drinks',
      '12:30 PM – Brunch/lunch service',
      '1:30 PM – Games & activities',
      '2:30 PM – Cake cutting & toasts',
      '3:00 PM – Music & dancing',
      '4:00 PM – Return gifts & farewell',
    ];
  }
  // community
  return [
    '4:00 PM – Gates open, welcome & registration',
    '4:30 PM – Opening ceremony & lamp lighting',
    '5:00 PM – Cultural performances begin',
    '5:30 PM – Food stalls & game booths open',
    '6:30 PM – Kids activities & competitions',
    '7:30 PM – Main stage entertainment / DJ',
    '8:30 PM – Prize distribution',
    '9:00 PM – Vote of thanks & closing',
  ];
}
