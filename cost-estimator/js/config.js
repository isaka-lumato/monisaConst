/**
 * Construction Cost Estimator - Configuration
 * Application configuration and constants
 */

const CostEstimatorConfig = {
  // Application Settings
  app: {
    name: "Monisa Cost Estimator",
    version: "1.0.0",
    currency: "TZS",
    currencySymbol: "TSh",
    locale: "sw-TZ",
  },

  // Project Types Configuration
  projectTypes: {
    residential: {
      name: "Residential Construction",
      baseMultiplier: 1.0,
      minArea: 50,
      maxArea: 1000,
      defaultPricePerSqFt: 450000, // TSh per sq ft
    },
    commercial: {
      name: "Commercial Construction",
      baseMultiplier: 1.2,
      minArea: 100,
      maxArea: 5000,
      defaultPricePerSqFt: 540000, // TSh per sq ft
    },
    renovation: {
      name: "Renovation & Remodeling",
      baseMultiplier: 0.9,
      minArea: 20,
      maxArea: 800,
      defaultPricePerSqFt: 405000, // TSh per sq ft
    },
  },

  // Material Categories
  materialCategories: {
    foundation: {
      name: "Foundation Materials",
      items: {
        cement: { unit: "bags", wasteFactor: 1.1 },
        sand: { unit: "tons", wasteFactor: 1.15 },
        gravel: { unit: "tons", wasteFactor: 1.1 },
        rebar: { unit: "kg", wasteFactor: 1.05 },
        blocks: { unit: "pieces", wasteFactor: 1.1 },
      },
    },
    structure: {
      name: "Structural Materials",
      items: {
        timber: { unit: "cubic_meters", wasteFactor: 1.1 },
        steel_beams: { unit: "kg", wasteFactor: 1.05 },
        concrete_blocks: { unit: "pieces", wasteFactor: 1.1 },
        mortar: { unit: "bags", wasteFactor: 1.15 },
      },
    },
    roofing: {
      name: "Roofing Materials",
      items: {
        iron_sheets: { unit: "sheets", wasteFactor: 1.1 },
        tiles: { unit: "pieces", wasteFactor: 1.15 },
        timber_trusses: { unit: "pieces", wasteFactor: 1.05 },
        nails: { unit: "kg", wasteFactor: 1.2 },
      },
    },
    finishing: {
      name: "Finishing Materials",
      items: {
        paint: { unit: "liters", wasteFactor: 1.1 },
        tiles_floor: { unit: "sq_meters", wasteFactor: 1.1 },
        doors: { unit: "pieces", wasteFactor: 1.0 },
        windows: { unit: "pieces", wasteFactor: 1.0 },
        electrical_fittings: { unit: "sets", wasteFactor: 1.05 },
      },
    },
  },

  // Labor Categories and Skill Levels
  laborCategories: {
    skilled: {
      name: "Skilled Workers",
      types: {
        mason: { name: "Mason", baseRate: 25000 }, // TSh per day
        carpenter: { name: "Carpenter", baseRate: 30000 },
        electrician: { name: "Electrician", baseRate: 35000 },
        plumber: { name: "Plumber", baseRate: 32000 },
        painter: { name: "Painter", baseRate: 22000 },
      },
    },
    semiskilled: {
      name: "Semi-Skilled Workers",
      types: {
        assistant_mason: { name: "Assistant Mason", baseRate: 18000 },
        helper: { name: "General Helper", baseRate: 15000 },
        cleaner: { name: "Site Cleaner", baseRate: 12000 },
      },
    },
    supervisory: {
      name: "Supervisory Staff",
      types: {
        foreman: { name: "Site Foreman", baseRate: 45000 },
        supervisor: { name: "Construction Supervisor", baseRate: 55000 },
        engineer: { name: "Site Engineer", baseRate: 80000 },
      },
    },
  },

  // Timeline Phases Configuration
  timelinePhases: {
    planning: {
      name: "Planning & Permits",
      costPercentage: 0.07,
      durationDays: 14,
      description: "Project planning, permits, and approvals",
    },
    site_prep: {
      name: "Site Preparation",
      costPercentage: 0.12,
      durationDays: 7,
      description: "Site clearing, excavation, and preparation",
    },
    foundation: {
      name: "Foundation Work",
      costPercentage: 0.18,
      durationDays: 21,
      description: "Foundation laying and concrete work",
    },
    structure: {
      name: "Structural Work",
      costPercentage: 0.28,
      durationDays: 35,
      description: "Walls, columns, and structural elements",
    },
    roofing: {
      name: "Roofing",
      costPercentage: 0.15,
      durationDays: 14,
      description: "Roof structure and covering",
    },
    systems: {
      name: "Systems Installation",
      costPercentage: 0.12,
      durationDays: 21,
      description: "Electrical, plumbing, and other systems",
    },
    finishing: {
      name: "Finishing Work",
      costPercentage: 0.25,
      durationDays: 28,
      description: "Painting, flooring, and final touches",
    },
    inspection: {
      name: "Final Inspection",
      costPercentage: 0.03,
      durationDays: 3,
      description: "Final inspection and handover",
    },
  },

  // Location Multipliers for Tanzania
  locationMultipliers: {
    dar_es_salaam: {
      name: "Dar es Salaam",
      multiplier: 1.0,
      description: "Base pricing for Dar es Salaam region",
    },
    arusha: {
      name: "Arusha",
      multiplier: 0.9,
      description: "Northern region pricing",
    },
    mwanza: {
      name: "Mwanza",
      multiplier: 0.85,
      description: "Lake zone pricing",
    },
    dodoma: {
      name: "Dodoma",
      multiplier: 0.8,
      description: "Central region pricing",
    },
    mbeya: {
      name: "Mbeya",
      multiplier: 0.82,
      description: "Southern highlands pricing",
    },
    other: {
      name: "Other Regions",
      multiplier: 0.75,
      description: "Other regions pricing",
    },
  },

  // Validation Rules
  validation: {
    dimensions: {
      minLength: 1,
      maxLength: 200,
      minWidth: 1,
      maxWidth: 200,
      minHeight: 2.5,
      maxHeight: 20,
    },
    materials: {
      minQuantity: 0.1,
      maxQuantity: 10000,
    },
    labor: {
      minHours: 1,
      maxHours: 2000,
    },
    contact: {
      nameMinLength: 2,
      nameMaxLength: 50,
      phonePattern: /^(\+255|0)[67]\d{8}$/,
      emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },

  // UI Configuration
  ui: {
    animationDuration: 300,
    debounceDelay: 500,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png", "doc", "docx"],
    resultsPerPage: 10,
  },

  // API Endpoints (for future use)
  api: {
    baseUrl: "/api/cost-estimator",
    endpoints: {
      quote: "/quote",
      pricing: "/pricing",
      materials: "/materials",
      labor: "/labor",
    },
  },

  // Error Messages
  messages: {
    errors: {
      invalidDimensions: "Please enter valid dimensions",
      invalidQuantity: "Please enter a valid quantity",
      invalidEmail: "Please enter a valid email address",
      invalidPhone: "Please enter a valid Tanzanian phone number",
      calculationError: "Error in calculation. Please try again.",
      networkError: "Network error. Please check your connection.",
      fileTooBig: "File size exceeds 5MB limit",
      invalidFileType:
        "Invalid file type. Please upload PDF, DOC, or image files.",
    },
    success: {
      calculationComplete: "Cost calculation completed successfully",
      quoteSubmitted: "Quote request submitted successfully",
      dataSaved: "Data saved successfully",
    },
    info: {
      calculating: "Calculating costs...",
      loading: "Loading...",
      saving: "Saving data...",
    },
  },
};

// Utility Functions
const CostEstimatorUtils = {
  formatCurrency: function (amount) {
    return new Intl.NumberFormat("sw-TZ", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  formatNumber: function (number) {
    return new Intl.NumberFormat("sw-TZ").format(number);
  },

  validateDimensions: function (length, width, height) {
    const rules = CostEstimatorConfig.validation.dimensions;
    return (
      length >= rules.minLength &&
      length <= rules.maxLength &&
      width >= rules.minWidth &&
      width <= rules.maxWidth &&
      height >= rules.minHeight &&
      height <= rules.maxHeight
    );
  },

  validateEmail: function (email) {
    return CostEstimatorConfig.validation.contact.emailPattern.test(email);
  },

  validatePhone: function (phone) {
    return CostEstimatorConfig.validation.contact.phonePattern.test(phone);
  },

  debounce: function (func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },
};

// Export configuration
if (typeof module !== "undefined" && module.exports) {
  module.exports = { CostEstimatorConfig, CostEstimatorUtils };
}
