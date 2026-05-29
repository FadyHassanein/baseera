import type { Lang } from "./messages";

type Bilingual = { en: string; ar: string };

const mobility_level: Record<string, Bilingual> = {
  full: { en: "Full", ar: "كاملة" },
  partial: { en: "Partial", ar: "جزئية" },
  very_limited: { en: "Very limited", ar: "محدودة جداً" },
  none: { en: "None", ar: "لا توجد" },
};

const walking_distance: Record<string, Bilingual> = {
  long: { en: "Long", ar: "طويلة" },
  moderate: { en: "Moderate", ar: "متوسطة" },
  short: { en: "Short", ar: "قصيرة" },
  very_short: { en: "Very short", ar: "قصيرة جداً" },
};

const vision: Record<string, Bilingual> = {
  normal: { en: "Normal", ar: "طبيعي" },
  low: { en: "Low vision", ar: "ضعيف" },
  blind: { en: "Blind", ar: "كفيف" },
};

const hearing: Record<string, Bilingual> = {
  normal: { en: "Normal", ar: "طبيعي" },
  low: { en: "Hard of hearing", ar: "ضعيف" },
  deaf: { en: "Deaf", ar: "أصم" },
};

const specifics: Record<string, Bilingual> = {
  left_side_weak: { en: "Left side weakness", ar: "ضعف الجانب الأيسر" },
  right_side_weak: { en: "Right side weakness", ar: "ضعف الجانب الأيمن" },
  cannot_climb_stairs: { en: "Cannot climb stairs", ar: "لا يستطيع صعود الدرج" },
  low_stairs_tolerance: { en: "Low stairs tolerance", ar: "صعوبة في الدرج" },
  uses_cane: { en: "Uses a cane", ar: "يستخدم عصاية" },
  uses_walker: { en: "Uses a walker", ar: "يستخدم مشاية" },
  uses_wheelchair_manual: { en: "Manual wheelchair user", ar: "مستخدم كرسي متحرك يدوي" },
  uses_wheelchair_power: { en: "Power wheelchair user", ar: "مستخدم كرسي متحرك كهربائي" },
  slow_walker: { en: "Walks slowly", ar: "يمشي ببطء" },
  unstable_balance: { en: "Unstable balance", ar: "توازن غير مستقر" },
  transfers_independently: { en: "Transfers independently", ar: "ينتقل باستقلالية" },
  transfers_with_support: { en: "Needs transfer support", ar: "يحتاج مساعدة للانتقال" },
  prefers_close_parking: { en: "Prefers close parking", ar: "يفضل وقوف السيارة قريباً" },
};

const requirements: Record<string, Bilingual> = {
  grab_bars: { en: "Grab bars", ar: "مساند يدوية" },
  walk_in_shower: { en: "Walk-in shower", ar: "دوش بدون حاجز" },
  seated_shower: { en: "Seated shower", ar: "مقعد للاستحمام" },
  raised_toilet_seat: { en: "Raised toilet seat", ar: "مقعد مرحاض مرتفع" },
  transfer_space_beside_toilet: {
    en: "Transfer space beside toilet",
    ar: "مساحة انتقال بجانب المرحاض",
  },
  lever_door_handle: { en: "Lever door handles", ar: "مقابض أبواب على شكل عتلة" },
  non_slip_floor: { en: "Non-slip floor", ar: "أرضية غير منزلقة" },
};

const equipment: Record<string, Bilingual> = {
  manual_wheelchair: { en: "Manual wheelchair", ar: "كرسي متحرك يدوي" },
  power_wheelchair: { en: "Power wheelchair", ar: "كرسي متحرك كهربائي" },
  scooter: { en: "Scooter", ar: "سكوتر" },
  cane: { en: "Cane", ar: "عصاية" },
  walker: { en: "Walker", ar: "مشاية" },
  crutches: { en: "Crutches", ar: "عكازات" },
  service_dog: { en: "Service dog", ar: "كلب خدمة" },
  hearing_aid: { en: "Hearing aid", ar: "سماعة طبية" },
  white_cane: { en: "White cane", ar: "عصا بيضاء" },
};

const dimension: Record<string, Bilingual> = {
  entrance: { en: "Entrance", ar: "المدخل" },
  bathroom: { en: "Bathroom", ar: "الحمام" },
  seating: { en: "Seating", ar: "الجلوس" },
  lighting: { en: "Lighting", ar: "الإضاءة" },
  flooring: { en: "Flooring", ar: "الأرضيات" },
  path_width: { en: "Path width", ar: "عرض الممر" },
  parking: { en: "Parking", ar: "موقف السيارات" },
  signage: { en: "Signage", ar: "اللافتات" },
  equipment: { en: "Equipment", ar: "المعدات" },
  doorway: { en: "Doorway", ar: "الباب" },
  counter_height: { en: "Counter height", ar: "ارتفاع الكاونتر" },
  other: { en: "Other", ar: "أخرى" },
};

const tables = {
  mobility_level,
  walking_distance,
  vision,
  hearing,
  specifics,
  requirements,
  equipment,
  dimension,
} as const;

export type VocabCategory = keyof typeof tables;

function humanize(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function labelFor(category: VocabCategory, key: string, lang: Lang): string {
  const entry = tables[category][key];
  if (entry) return entry[lang];
  return humanize(key);
}
