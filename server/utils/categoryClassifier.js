/**
 * CampusCycle Intelligent Category Classifier & Auto-Filter Engine
 * Deterministic NLP token & n-gram matcher with weighted scoring across 12 campus categories.
 */

export const CATEGORY_TAXONOMY = [
  {
    category: "Electronics",
    subcategories: {
      "Laptops": ["laptop", "macbook", "thinkpad", "ideapad", "pavilion", "inspiron", "zenbook", "vivobook", "chromebook", "notebook", "surface pro", "rog strix", "tuf gaming", "predator", "legion", "latitude", "vostro", "swift", "m1 macbook", "m2 macbook", "m3 macbook"],
      "Mobile Phones": ["iphone", "smartphone", "galaxy s2", "galaxy s21", "galaxy s22", "galaxy s23", "galaxy s24", "oneplus", "redmi note", "realme", "pixel 6", "pixel 7", "pixel 8", "xiaomi", "poco", "moto g", "oppo", "vivo", "iqoo", "nothing phone", "mobile phone", "android phone"],
      "Tablets": ["ipad", "ipad air", "ipad pro", "ipad mini", "tablet", "galaxy tab", "lenovo tab", "stylus", "apple pencil", "s pen"],
      "Headphones": ["headphone", "headphones", "headset", "sony wh", "bose qc", "sennheiser", "jbl tune", "over-ear", "on-ear", "boat rockerz"],
      "Earphones": ["earphone", "earphones", "earbuds", "airpods", "airpods pro", "galaxy buds", "tws", "in-ear", "neckband", "wireless earbuds", "realme buds", "boat airdopes"],
      "Speakers": ["speaker", "speakers", "bluetooth speaker", "jbl flip", "jbl charge", "boat stone", "soundbar", "echo dot", "alexa", "google home"],
      "Cameras": ["camera", "dslr", "mirrorless", "canon eos", "nikon d", "sony alpha", "gopro", "tripod", "camera lens", "digicam", "action camera"],
      "Chargers": ["charger", "fast charger", "type-c charger", "adapter", "power adapter", "magsafe", "charging cable", "usb cable", "lightning cable"],
      "Power Banks": ["power bank", "powerbank", "portable charger", "mi power bank", "anker", "ambrane"],
      "Smart Watches": ["smartwatch", "smart watch", "apple watch", "galaxy watch", "noise watch", "fire-boltt", "fitbit", "fitness band", "mi band", "amazfit"],
      "Computer Accessories": ["mouse", "keyboard", "mechanical keyboard", "wireless mouse", "logitech", "webcam", "monitor", "hdmi cable", "vga cable", "displayport", "usb hub", "hard disk", "external hdd", "ssd", "pendrive", "pen drive", "flash drive", "ram 8gb", "ram 16gb", "graphic card", "gpu", "cooling pad", "laptop stand"],
      "Other Electronics": ["soldering iron", "arduino", "raspberry pi", "breadboard", "multimeter", "drone", "projector"]
    },
    generalKeywords: ["electronic", "electronics", "gadget", "device", "usb", "bluetooth", "wireless", "hdmi", "cable", "tech", "gigabyte", "intel", "amd", "ryzen", "nvidia"]
  },
  {
    category: "Books & Education",
    subcategories: {
      "Textbooks": ["textbook", "textbooks", "coursebook", "syllabus book", "standard textbook", "galvin", "tanenbaum", "korth", "forouzan", "boylestad", "morris mano", "sedra smith", "stewart calculus", "thomas calculus", "griffiths", "goldstein"],
      "Reference Books": ["reference book", "handbook", "encyclopedia", "dictionary", "hc verma", "h.c. verma", "rd sharma", "r.d. sharma", "dc pandey", "sl loney", "resnick halliday", "cengage", "arihant"],
      "Novels": ["novel", "novels", "fiction", "non-fiction", "paperback", "hardcover", "story book", "harry potter", "george orwell", "stephen king", "agatha christie", "dan brown", "manga", "comics"],
      "Competitive Exam Books": ["gate", "gate exam", "cat prep", "upsc", "jee main", "jee advanced", "neet", "gre prep", "gmat", "toefl", "ielts", "clat", "ies", "ies master", "made easy"],
      "Notes": ["handwritten notes", "lecture notes", "class notes", "topper notes", "short notes", "formula sheet", "exam notes"],
      "Study Materials": ["study material", "module", "coaching material", "allen", "resonance", "fiitjee", "dpp", "solved papers", "previous year questions", "pyq"],
      "Stationery": ["stationery", "notebook", "register", "spiral notebook", "drawing sheet", "drafter", "mini drafter", "t-square", "geometry box", "compass", "pens", "highlighter", "marker", "binder", "file folder"],
      "Calculators": ["scientific calculator", "casio fx-991", "casio fx-991es", "casio fx-991ex", "casio fx-991cw", "graphing calculator", "calculator with case", "casio calculator", "calculator"]
    },
    generalKeywords: ["book", "books", "author", "edition", "volume", "vol 1", "vol 2", "paperback", "hardcover", "isbn", "read", "literature", "semester", "engineering mathematics"]
  },
  {
    category: "Clothing & Fashion",
    subcategories: {
      "Men's Clothing": ["shirt", "shirts", "t-shirt", "tshirt", "tee", "hoodie", "hoodies", "sweatshirt", "jacket", "blazer", "suit", "jeans", "trousers", "pants", "chinos", "cargo", "shorts", "kurta", "ethnic wear", "lab coat", "formal shirt"],
      "Women's Clothing": ["dress", "kurti", "kurtis", "saree", "top", "crop top", "skirt", "leggings", "jeans", "women jacket", "hoodie for women", "dupatta", "gown"],
      "Shoes": ["shoes", "sneakers", "running shoes", "sports shoes", "casual shoes", "formal shoes", "boots", "loafers", "sandals", "slippers", "flip-flops", "heels", "nike", "adidas", "puma", "reebok", "converse", "vans", "woodland", "crocs", "bata", "red tape", "size uk"],
      "Bags": ["backpack", "college bag", "laptop bag", "school bag", "tote bag", "handbag", "duffle bag", "gym bag", "sling bag", "rucksack", "wildcraft", "american tourister", "skybags", "samsonite"],
      "Watches": ["watch", "analog watch", "chronograph", "wrist watch", "titan", "fastrack", "casio watch", "fossil", "timex", "rolex", "citizen"],
      "Accessories": ["wallet", "leather wallet", "belt", "leather belt", "sunglasses", "shades", "ray-ban", "cap", "beanie", "muffler", "scarf", "tie", "cufflinks"]
    },
    generalKeywords: ["wear", "cotton", "denim", "fabric", "apparel", "wardrobe", "outfit", "size m", "size l", "size s", "size xl", "brand new with tags"]
  },
  {
    category: "Furniture",
    subcategories: {
      "Chairs": ["chair", "chairs", "study chair", "office chair", "ergonomic chair", "revolving chair", "mesh chair", "boss chair", "plastic chair", "nilkamal chair", "stool", "bean bag", "beanbag"],
      "Tables": ["table", "tables", "folding table", "coffee table", "bed table", "laptop table", "wooden table"],
      "Study Tables": ["study table", "computer table", "study desk", "workstation", "office desk"],
      "Beds": ["bed", "cot", "single bed", "bunk bed", "wooden bed", "iron bed", "metal cot", "bed frame"],
      "Shelves": ["bookshelf", "book shelf", "book rack", "wall shelf", "display rack"],
      "Storage": ["wardrobe", "almirah", "cupboard", "cabinet", "drawer", "chest of drawers", "shoe rack", "plastic organizer"],
      "Desks": ["desk", "desks", "writing desk", "executive desk", "standing desk"]
    },
    generalKeywords: ["furniture", "wooden", "plywood", "sheesham", "engineered wood", "particle board", "metal frame", "assembled"]
  },
  {
    category: "Vehicles",
    subcategories: {
      "Bicycles": ["bicycle", "bicycles", "cycle", "cycles", "bike", "gear cycle", "single speed cycle", "mountain bike", "mtb", "road bike", "hybrid cycle", "hero sprint", "btwin", "rockrider", "decathlon cycle", "firefox", "montra", "mach city", "hercules", "fat bike", "electric cycle"],
      "Scooters": ["scooter", "scooty", "activa", "honda activa", "jupiter", "tvs jupiter", "access 125", "pleasure", "dio", "electric scooter", "ola s1", "ather"],
      "Motorcycles": ["motorcycle", "motorbike", "pulsar", "royal enfield", "classic 350", "bullet", "apache rtr", "duke 200", "duke 390", "fz", "yamaha r15", "splendor", "shine"],
      "Car Accessories": ["car accessory", "car mobile holder", "car charger", "dash cam", "car seat cover", "helmet", "bike helmet", "studds helmet", "vega helmet", "axor", "riding gloves", "cycle lock", "bike lock", "cycle pump"]
    },
    generalKeywords: ["vehicle", "mileage", "cc engine", "riding", "disc brake", "gear transmission", "shimano"]
  },
  {
    category: "Hostel Essentials",
    subcategories: {
      "Mattresses": ["mattress", "foam mattress", "single mattress", "hostel mattress", "sleepwell", "kurl-on", "coir mattress", "cotton gadda", "gadda"],
      "Pillows": ["pillow", "pillows", "cushion", "bedsheet", "bed sheet", "bed cover", "blanket", "comforter", "quilt", "dohar", "pillow cover"],
      "Utensils": ["utensil", "utensils", "plate", "bowl", "spoon", "fork", "knife", "maggi bowl", "steel plate", "water bottle", "thermos flask", "milton bottle", "lunch box", "tiffin"],
      "Kitchen Items": ["electric kettle", "kettle", "induction cooktop", "induction stove", "pigeon induction", "prestige kettle", "coil heater", "immersion rod", "water heater rod", "pan", "cooker"],
      "Fans": ["table fan", "small fan", "portable fan", "rechargeable fan", "room cooler", "mini cooler", "desert cooler"],
      "Lamps": ["study lamp", "desk lamp", "table lamp", "reading light", "rechargeable lamp", "led lamp", "night lamp"],
      "Buckets": ["bucket", "mug", "bath bucket", "dustbin", "laundry basket", "cloth clips", "hanger", "hangers", "cloth drying rack"],
      "Appliances": ["iron box", "steam iron", "mosquito bat", "mosquito net", "room freshener", "extension cord", "extension board", "spike guard", "multi plug"],
      "Room Decor": ["fairy lights", "wall poster", "mirror", "clock", "curtains", "carpet", "rug", "door mat"]
    },
    generalKeywords: ["hostel", "dorm", "pg room", "roommate", "hostel essentials", "daily use"]
  },
  {
    category: "Sports & Fitness",
    subcategories: {
      "Cricket": ["cricket", "cricket bat", "kashmir willow", "english willow", "leather ball", "tennis cricket bat", "cricket ball", "batting pads", "cricket kit", "cricket gloves", "stumps"],
      "Football": ["football", "soccer ball", "football studs", "shin guards", "goalkeeper gloves", "fifa ball", "kipsta"],
      "Badminton": ["badminton", "badminton racket", "badminton racquet", "yonex", "li-ning", "shuttlecock", "feather shuttle", "nylon shuttle", "badminton kit bag"],
      "Gym Equipment": ["gym", "dumbbell", "dumbbells", "dumbell", "dumbells", "barbell", "weight plates", "kettlebell", "bench press", "pull-up bar", "pull up bar", "push up bar", "resistance bands", "ab roller", "hand gripper", "weight lifting"],
      "Sports Accessories": ["yoga mat", "skipping rope", "jump rope", "sipper bottle", "gym shaker", "gym gloves", "wrist bands", "knee support", "basketball", "volleyball", "table tennis bat", "tt bat", "swimming goggles", "skateboard"]
    },
    generalKeywords: ["fitness", "workout", "exercise", "training", "sports", "athlete", "tournament"]
  },
  {
    category: "Musical Instruments",
    subcategories: {
      "Guitars": ["guitar", "acoustic guitar", "electric guitar", "classical guitar", "bass guitar", "yamaha f310", "fender", "ibanez", "cort", "kadence", "ukulele", "guitar case", "guitar strings", "guitar strap", "capo", "guitar picks"],
      "Keyboards": ["keyboard", "synthesizer", "piano", "electronic piano", "casio ctk", "yamaha psr", "midi keyboard", "sustain pedal", "keyboard stand"],
      "Drums": ["drums", "drum kit", "snare", "cajon", "conga", "bongo", "tabla", "drumsticks", "drum sticks"],
      "Violins": ["violin", "fiddle", "bow", "flute", "bansuri", "harmonica", "mouth organ", "saxophone", "trumpet"]
    },
    generalKeywords: ["music", "musical", "instrument", "tuner", "amplifier", "audio interface", "musician"]
  },
  {
    category: "Home Appliances",
    subcategories: {
      "Refrigerators": ["refrigerator", "fridge", "mini fridge", "single door fridge", "double door fridge", "lg fridge", "samsung fridge"],
      "Washing Machines": ["washing machine", "fully automatic", "semi automatic", "front load", "top load"],
      "Microwaves": ["microwave", "microwave oven", "convection microwave", "otg", "oven toaster grill", "toaster", "sandwich maker", "pop up toaster", "air fryer"],
      "Mixers": ["mixer", "mixer grinder", "blender", "hand blender", "juicer", "food processor", "preethi", "sujata"],
      "Irons": ["iron", "steam iron", "dry iron", "philips iron", "garment steamer"],
      "Fans": ["exhaust fan", "ceiling fan", "geyser", "water heater", "water purifier", "ro water purifier", "vacuum cleaner", "room heater", "blower"]
    },
    generalKeywords: ["appliance", "appliances", "kitchen appliance", "home appliance", "watts", "voltage"]
  },
  {
    category: "Gaming",
    subcategories: {
      "Consoles": ["playstation", "ps5", "ps4", "ps4 slim", "ps4 pro", "xbox", "xbox series x", "xbox series s", "xbox one", "nintendo switch", "nintendo switch oled", "handheld console"],
      "Video Games": ["game cd", "game disc", "video game", "ps5 game", "ps4 game", "gta v", "gta 5", "fifa 23", "fifa 24", "ea fc 24", "ea fc 25", "call of duty", "spider-man", "god of war", "elden ring", "red dead redemption", "cyberpunk"],
      "Controllers": ["controller", "gamepad", "joystick", "dualshock", "dualsense", "xbox controller", "wireless controller"],
      "Gaming Accessories": ["gaming headset", "hyperx", "razer", "corsair", "gaming chair", "rgb mousepad", "racing wheel", "steering wheel", "flight stick", "vr headset", "oculus quest", "meta quest"]
    },
    generalKeywords: ["gaming", "gamer", "fps", "rgb lighting", "multiplayer", "gameplay"]
  },
  {
    category: "Services",
    subcategories: {
      "Tutoring": ["tutoring", "tutor", "tuition", "math tutor", "physics tutor", "coding tutor", "chemistry tutor", "online classes", "teaching", "exam preparation classes"],
      "Photography": ["photography", "photographer", "photoshoot", "photo shoot", "event photography", "portfolio shoot", "drone videography"],
      "Graphic Design": ["graphic design", "logo design", "poster design", "banner design", "ui/ux design", "photoshop editing", "illustrator", "canva design"],
      "Programming": ["programming", "coding help", "web development", "app development", "python project", "java project", "react developer", "bug fixing", "assignment help"],
      "Video Editing": ["video editing", "video editor", "reel editing", "youtube video editing", "premiere pro", "after effects", "motion graphics"]
    },
    generalKeywords: ["service", "services", "freelance", "hourly", "hire", "consultation"]
  },
  {
    category: "Other",
    subcategories: {
      "Stationery & Art": ["art supplies", "acrylic paints", "oil pastels", "easel", "canvas board", "sketchbook", "calligraphy"],
      "Travel Goods": ["trolley bag", "suitcase", "travel bag", "luggage", "travel pillow"],
      "Collectibles": ["action figure", "anime figure", "poster", "collectible", "badge", "souvenir", "coins"],
      "Miscellaneous": ["umbrella", "raincoat", "keychain", "gift item"]
    },
    generalKeywords: ["miscellaneous", "item", "stuff", "pack", "bundle"]
  }
];

/**
 * Clean & normalize a string into lowercase tokens
 */
function cleanText(str) {
  if (!str || typeof str !== "string") return "";
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Evaluates text against a term/phrase
 */
function matchTerm(text, term) {
  const cleanT = cleanText(text);
  const cleanTerm = cleanText(term);
  if (!cleanTerm) return false;

  const escaped = cleanTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, "i");
  return regex.test(cleanT);
}

/**
 * Classify a product given title, description, brand, and tags
 * @param {Object} product
 * @param {string} product.title
 * @param {string} product.description
 * @param {string} product.brand
 * @param {Array|string} product.tags
 * @param {string} [product.currentCategory]
 * @returns {Object} classification result
 */
export function classifyProduct({ title = "", description = "", brand = "", tags = [], currentCategory = "" }) {
  const normTitle = cleanText(title);
  const normDesc = cleanText(description);
  const normBrand = cleanText(brand);
  const normTags = Array.isArray(tags) ? tags.map(cleanText).join(" ") : cleanText(tags);

  // Extract the primary subject of the title before conjunctions like "with", "plus", "+", "including"
  const primaryTitlePart = normTitle.split(/\b(?:with|along with|plus|\+|w\/|including)\b/i)[0].trim();

  // Keep scores per category and per subcategory
  const scores = {};
  const matchedTerms = {};
  const subcategoryScores = {};

  CATEGORY_TAXONOMY.forEach(({ category, subcategories, generalKeywords }) => {
    scores[category] = 0;
    matchedTerms[category] = [];
    subcategoryScores[category] = {};

    // 1. Evaluate subcategories
    Object.entries(subcategories).forEach(([subcatName, keywords]) => {
      subcategoryScores[category][subcatName] = 0;

      keywords.forEach((kw) => {
        let termScore = 0;

        const isPrimaryTitleMatch = primaryTitlePart && matchTerm(primaryTitlePart, kw);
        const isTitleMatch = matchTerm(normTitle, kw);

        // Title matches have highest weight (Primary subject: 8.0, regular title: 5.0)
        if (isPrimaryTitleMatch) {
          termScore += 8.0;
        } else if (isTitleMatch) {
          termScore += 5.0;
        }
        // Brand matches (3.5 points)
        if (normBrand && matchTerm(normBrand, kw)) {
          termScore += 3.5;
        }
        // Tags matches (3.0 points)
        if (normTags && matchTerm(normTags, kw)) {
          termScore += 3.0;
        }
        // Description matches (1.0 points)
        if (matchTerm(normDesc, kw)) {
          termScore += 1.0;
        }

        if (termScore > 0) {
          const wordCount = kw.split(" ").length;
          const weightedScore = termScore * (1 + (wordCount - 1) * 0.4);

          // Subcategory scoring: extra boost if matched directly in primary title subject
          const subcatMultiplier = isPrimaryTitleMatch ? 3.0 : (isTitleMatch ? 1.5 : 0.6);

          scores[category] += weightedScore;
          subcategoryScores[category][subcatName] += weightedScore * subcatMultiplier;
          if (!matchedTerms[category].includes(kw)) {
            matchedTerms[category].push(kw);
          }
        }
      });
    });

    // 2. Evaluate general category keywords
    generalKeywords.forEach((kw) => {
      let termScore = 0;
      if (matchTerm(normTitle, kw)) termScore += 2.0;
      if (matchTerm(normBrand, kw)) termScore += 1.5;
      if (matchTerm(normTags, kw)) termScore += 1.5;
      if (matchTerm(normDesc, kw)) termScore += 0.5;

      if (termScore > 0) {
        scores[category] += termScore;
        if (!matchedTerms[category].includes(kw)) {
          matchedTerms[category].push(kw);
        }
      }
    });
  });

  // Disambiguation / Context overrides:
  if (matchTerm(normTitle, "table") || matchTerm(normTitle, "chair") || matchTerm(normTitle, "desk")) {
    if (scores["Furniture"] > 0) {
      scores["Furniture"] += 6.0;
    }
  }
  if (matchTerm(normTitle, "cycle") || matchTerm(normTitle, "bicycle") || matchTerm(normTitle, "helmet")) {
    if (scores["Vehicles"] > 0) {
      scores["Vehicles"] += 6.0;
    }
  }
  if (matchTerm(normTitle, "calculator") || matchTerm(normTitle, "casio fx")) {
    scores["Books & Education"] += 6.0;
  }
  if (matchTerm(normTitle, "mattress") || matchTerm(normTitle, "kettle") || matchTerm(normTitle, "bedsheet")) {
    scores["Hostel Essentials"] += 5.0;
  }

  // Find category with highest score
  let bestCategory = null;
  let highestScore = 0;

  Object.entries(scores).forEach(([cat, score]) => {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = cat;
    }
  });

  const confidence = highestScore > 0 ? Math.min(1, Number((highestScore / 8.0).toFixed(2))) : 0;

  // Determine best subcategory
  let bestSubcategory = "";
  if (bestCategory && subcategoryScores[bestCategory]) {
    let bestSubScore = 0;
    Object.entries(subcategoryScores[bestCategory]).forEach(([subcat, subScore]) => {
      if (subScore > bestSubScore) {
        bestSubScore = subScore;
        bestSubcategory = subcat;
      }
    });

    if (!bestSubcategory) {
      const catObj = CATEGORY_TAXONOMY.find((c) => c.category === bestCategory);
      bestSubcategory = Object.keys(catObj.subcategories)[0] || "";
    }
  }

  const isMismatch = Boolean(
    bestCategory &&
    currentCategory &&
    bestCategory.toLowerCase() !== currentCategory.toLowerCase() &&
    confidence >= 0.35
  );

  return {
    category: bestCategory,
    subcategory: bestSubcategory,
    confidence,
    rawScore: highestScore,
    matchedKeywords: bestCategory ? matchedTerms[bestCategory].slice(0, 4) : [],
    isMismatch,
    suggestedCategory: isMismatch ? bestCategory : null,
    suggestedSubcategory: isMismatch ? bestSubcategory : null
  };
}
