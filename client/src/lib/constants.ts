import { format, addWeeks } from "date-fns";

// Pregnancy stages
export const WEEKS_OPTIONS = Array.from({ length: 40 }, (_, i) => ({
  label: `Week ${i + 1}`,
  value: (i + 1).toString(),
}));

export const MONTHS_OPTIONS = Array.from({ length: 9 }, (_, i) => ({
  label: `Month ${i + 1}`,
  value: (i + 1).toString(),
}));

export const TRIMESTER_OPTIONS = [
  { label: "1st Trimester", value: "1" },
  { label: "2nd Trimester", value: "2" },
  { label: "3rd Trimester", value: "3" },
];

// Baby size comparisons by week
export const BABY_SIZE_COMPARISONS = [
  { week: 1, size: "Poppy seed", image: "🌱" },
  { week: 2, size: "Poppy seed", image: "🌱" },
  { week: 3, size: "Poppy seed", image: "🌱" },
  { week: 4, size: "Poppyseed", image: "🌱" },
  { week: 5, size: "Apple seed", image: "🍎" },
  { week: 6, size: "Sweet pea", image: "🥜" },
  { week: 7, size: "Blueberry", image: "🫐" },
  { week: 8, size: "Kidney bean", image: "🧫" },
  { week: 9, size: "Grape", image: "🍇" },
  { week: 10, size: "Strawberry", image: "🍓" },
  { week: 11, size: "Lime", image: "🍈" },
  { week: 12, size: "Plum", image: "🍑" },
  { week: 13, size: "Peach", image: "🍑" },
  { week: 14, size: "Lemon", image: "🍋" },
  { week: 15, size: "Apple", image: "🍎" },
  { week: 16, size: "Avocado", image: "🥑" },
  { week: 17, size: "Pear", image: "🍐" },
  { week: 18, size: "Bell pepper", image: "🫑" },
  { week: 19, size: "Tomato", image: "🍅" },
  { week: 20, size: "Banana", image: "🍌" },
  { week: 21, size: "Carrot", image: "🥕" },
  { week: 22, size: "Coconut", image: "🥥" },
  { week: 23, size: "Grapefruit", image: "🍊" },
  { week: 24, size: "Corn", image: "🌽" },
  { week: 25, size: "Cauliflower", image: "🥦" },
  { week: 26, size: "Lettuce", image: "🥬" },
  { week: 27, size: "Rutabaga", image: "🥔" },
  { week: 28, size: "Eggplant", image: "🍆" },
  { week: 29, size: "Butternut squash", image: "🎃" },
  { week: 30, size: "Cabbage", image: "🥬" },
  { week: 31, size: "Coconut", image: "🥥" },
  { week: 32, size: "Squash", image: "🎃" },
  { week: 33, size: "Pineapple", image: "🍍" },
  { week: 34, size: "Cantaloupe", image: "🍈" },
  { week: 35, size: "Honeydew melon", image: "🍈" },
  { week: 36, size: "Romaine lettuce", image: "🥬" },
  { week: 37, size: "Winter melon", image: "🍈" },
  { week: 38, size: "Pumpkin", image: "🎃" },
  { week: 39, size: "Watermelon", image: "🍉" },
  { week: 40, size: "Watermelon", image: "🍉" },
];

// Development milestones by week
export const DEVELOPMENT_MILESTONES = {
  1: {
    description: "Fertilization occurs",
    keyDevelopments: [
      "The fertilized egg begins dividing",
      "The blastocyst is formed",
      "Implantation begins"
    ]
  },
  2: {
    description: "The embryo implants in the uterus",
    keyDevelopments: [
      "Implantation completes",
      "Placenta begins to form",
      "Amniotic sac develops"
    ]
  },
  // More weeks would be filled in here...
  18: {
    description: "Your baby is about 5.5 inches long and weighs approximately 7 ounces. The little one is busy flexing muscles and practicing different facial expressions.",
    keyDevelopments: [
      "Fingerprints are now forming on tiny fingertips",
      "Ears are now positioned properly on the sides of the head",
      "Baby can now hear sounds from outside the womb"
    ],
    funFact: "Your baby is developing a unique sleep pattern and may already have periods of rest and activity!"
  },
  // ... and so on for all 40 weeks
};

// Diet recommendations by trimester
export const DIET_RECOMMENDATIONS = {
  first: {
    focusNutrients: [
      { name: "Folic Acid", description: "Essential for neural tube development and preventing defects." },
      { name: "Iron", description: "Supports increased blood volume and prevents anemia." },
      { name: "Calcium", description: "Important for baby's bone and tooth development." }
    ],
    sampleMealPlan: {
      breakfast: "Whole grain toast with avocado and a boiled egg",
      lunch: "Spinach salad with grilled chicken and quinoa",
      dinner: "Baked salmon with sweet potato and steamed broccoli",
      snacks: "Greek yogurt with berries, mixed nuts, apple with peanut butter"
    }
  },
  second: {
    focusNutrients: [
      { name: "Iron", description: "Essential for increased blood volume and preventing anemia." },
      { name: "Calcium", description: "Crucial for baby's bone development." },
      { name: "Omega-3 Fatty Acids", description: "Important for baby's brain development." }
    ],
    sampleMealPlan: {
      breakfast: "Spinach and cheese omelet with whole grain toast",
      lunch: "Quinoa bowl with grilled chicken, avocado, and mixed vegetables",
      dinner: "Baked salmon with sweet potatoes and steamed broccoli",
      snacks: "Greek yogurt with berries, mixed nuts, and fresh fruit"
    }
  },
  third: {
    focusNutrients: [
      { name: "Vitamin D", description: "Supports baby's bone growth and immune system." },
      { name: "Calcium", description: "Crucial as baby's bones are hardening rapidly." },
      { name: "Protein", description: "Essential for baby's continued growth and development." }
    ],
    sampleMealPlan: {
      breakfast: "Oatmeal with chia seeds, berries, and almond butter",
      lunch: "Lentil soup with whole grain bread and a side salad",
      dinner: "Grilled chicken with quinoa and roasted vegetables",
      snacks: "Hummus with vegetable sticks, cheese with whole grain crackers"
    }
  }
};

// Exercise recommendations by trimester
export const EXERCISE_RECOMMENDATIONS = {
  first: [
    { name: "Walking", duration: "30 minutes, 3-5 times weekly", icon: "walking" },
    { name: "Swimming", duration: "20-30 minutes, 2-3 times weekly", icon: "swimming-pool" },
    { name: "Prenatal Yoga", duration: "15-20 minutes, 2-3 times weekly", icon: "om" }
  ],
  second: [
    { name: "Walking", duration: "30 minutes, 3-5 times weekly", icon: "walking" },
    { name: "Swimming", duration: "20-30 minutes, 2-3 times weekly", icon: "swimming-pool" },
    { name: "Prenatal Yoga", duration: "15-20 minutes, 2-3 times weekly", icon: "om" }
  ],
  third: [
    { name: "Walking", duration: "20-30 minutes, 3-4 times weekly", icon: "walking" },
    { name: "Swimming", duration: "15-20 minutes, 2-3 times weekly", icon: "swimming-pool" },
    { name: "Gentle Stretching", duration: "10-15 minutes daily", icon: "om" }
  ]
};

// Test recommendations by trimester
export const TEST_RECOMMENDATIONS = {
  first: [
    { name: "Initial Prenatal Checkup", description: "Confirms pregnancy and establishes baseline health metrics.", icon: "stethoscope" },
    { name: "Dating Ultrasound", description: "Determines gestational age and due date.", icon: "ultrasound" },
    { name: "NIPT (Non-Invasive Prenatal Testing)", description: "Screens for chromosomal abnormalities like Down syndrome.", icon: "vial" }
  ],
  second: [
    { name: "Anatomy Scan Ultrasound", description: "Typically done between weeks 18-22, this detailed ultrasound checks baby's organs and physical development.", icon: "ultrasound" },
    { name: "Glucose Challenge Test", description: "Usually performed between weeks 24-28, but may be done earlier if you have risk factors for gestational diabetes.", icon: "vial" }
  ],
  third: [
    { name: "Group B Strep Test", description: "Screens for bacteria that can cause serious infections in newborns.", icon: "bacterium" },
    { name: "Non-stress Test", description: "Monitors the baby's heart rate in response to movements.", icon: "heartbeat" },
    { name: "Biophysical Profile", description: "Uses ultrasound to check baby's movements, breathing, and amniotic fluid levels.", icon: "ultrasound" }
  ]
};

// Common symptoms by trimester
export const COMMON_SYMPTOMS = {
  first: [
    { name: "Morning Sickness", severity: 4, remedy: "Eat small, frequent meals and ginger tea" },
    { name: "Fatigue", severity: 5, remedy: "Rest when possible, maintain good sleep hygiene" },
    { name: "Frequent Urination", severity: 3, remedy: "Stay hydrated but reduce fluids before bed" }
  ],
  second: [
    { name: "Back Pain", severity: 3, remedy: "Try pregnancy pillows and gentle stretching" },
    { name: "Round Ligament Pain", severity: 2, remedy: "Change positions slowly and use a support band" },
    { name: "Nasal Congestion", severity: 3, remedy: "Stay hydrated and use a humidifier" }
  ],
  third: [
    { name: "Heartburn", severity: 4, remedy: "Eat smaller meals and avoid lying down after eating" },
    { name: "Swelling", severity: 3, remedy: "Elevate feet, wear compression stockings" },
    { name: "Shortness of Breath", severity: 3, remedy: "Practice good posture and deep breathing" }
  ]
};

// Resource recommendations
export const RESOURCE_RECOMMENDATIONS = {
  books: [
    { 
      title: "What to Expect When You're Expecting",
      author: "Heidi Murkoff", 
      rating: 4.5,
      imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    },
    { 
      title: "Ina May's Guide to Childbirth",
      author: "Ina May Gaskin", 
      rating: 4,
      imageUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    }
  ],
  movies: [
    { 
      title: "The Business of Being Born",
      year: "2008", 
      type: "Documentary",
      rating: 4,
      imageUrl: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    },
    { 
      title: "Babies",
      year: "2010", 
      type: "Documentary",
      rating: 3.5,
      imageUrl: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    }
  ],
  podcasts: [
    { 
      title: "The Birth Hour",
      description: "Real birth stories shared by real moms"
    },
    { 
      title: "Pregnancy Podcast",
      description: "Evidence-based information for pregnancy"
    }
  ]
};

// Helper functions
export function getTrimeasterFromWeek(week: number): string {
  if (week <= 13) return "first";
  if (week <= 26) return "second";
  return "third";
}

export function getTrimeasterLabel(week: number): string {
  if (week <= 13) return "1st Trimester";
  if (week <= 26) return "2nd Trimester";
  return "3rd Trimester";
}

export function calculateDueDate(currentWeek: number): string {
  const weeksLeft = 40 - currentWeek;
  const dueDate = addWeeks(new Date(), weeksLeft);
  return format(dueDate, "MMMM d, yyyy");
}

export function calculateCompletion(currentWeek: number): number {
  return Math.round((currentWeek / 40) * 100);
}

export const MEDICATION_SAFETY = {
  "acetaminophen": { isSafe: true, notes: "Generally considered safe during pregnancy when used as directed." },
  "ibuprofen": { isSafe: false, notes: "Not recommended during pregnancy, especially in the third trimester." },
  "prenatal vitamins": { isSafe: true, notes: "Recommended during pregnancy to support maternal and fetal health." },
};

// Baby name origins
export const NAME_ORIGINS = [
  "All Origins",
  "English",
  "French",
  "Spanish",
  "Italian",
  "Greek",
  "Hebrew",
  "Arabic",
  "Indian",
  "Chinese",
  "Japanese",
  "African",
  "Celtic",
  "Nordic",
  "Slavic",
  "German",
  "Latin"
];

// Baby name genders
export const NAME_GENDERS = [
  "All Genders",
  "Girl Names",
  "Boy Names",
  "Unisex Names"
];

export const DANGEROUS_SYMPTOMS = [
  "Severe abdominal pain or cramping",
  "Vaginal bleeding or fluid leakage",
  "Severe headache or visual changes",
  "Decreased fetal movement"
];
