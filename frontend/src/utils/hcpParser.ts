export interface ParsedHCP {
  name: string;
  specialty: string;
  hospital: string;
  city: string;
  email: string;
  phone: string;
}

const KNOWN_SPECIALTIES = [
  'cardiologist', 'neurologist', 'dermatologist', 'pediatrician',
  'orthopedic', 'surgeon', 'radiologist', 'oncologist',
  'psychiatrist', 'ophthalmologist', 'gynecologist', 'urologist',
  'endocrinologist', 'gastroenterologist', 'nephrologist',
  'pulmonologist', 'rheumatologist', 'anesthesiologist',
  'pathologist', 'emergency medicine', 'family medicine',
  'internal medicine', 'general practitioner', 'cardiology',
  'neurology', 'dermatology', 'pediatrics', 'orthopedics',
  'radiology', 'oncology', 'psychiatry', 'ophthalmology',
  'gynecology', 'urology', 'endocrinology', 'gastroenterology',
  'nephrology', 'pulmonology', 'rheumatology', 'dentist',
];

const SPECIALTY_PATTERN = new RegExp(
  `(?:a|an)\\s+(${KNOWN_SPECIALTIES.join('|')})\\s+(?:named|called)`,
  'i'
);

function extractName(text: string): string {
  const patterns = [
    /(?:name(?:\s+is)?\s*[:：]?\s*)(Dr\.?\s*[\w\s]+?)(?:[,.]|$)/i,
    /(?:named|called)\s*(Dr\.?\s*[\w\s]+?)(?:\s*(?:[,.]|$|\sand|\sat\s|\sa\s|\sworking))/i,
    /(?:create|add|new|register)\s+(?:a\s+)?(?:new\s+)?(?:\w+\s+)?(?:named|called|name\s+is)?\s*(Dr\.?\s*[\w\s]+?)(?:\s*(?:[,.]|$|\sand|\sat\s|\sa\s|\sworking|\sin\s|\swith))/i,
    /^.*?(Dr\.?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:\s+[A-Z][a-z]+)?)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().replace(/[,.]$/, '');
  }
  return '';
}

function extractSpecialty(text: string): string {
  const m = text.match(SPECIALTY_PATTERN);
  if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  const direct = text.match(
    /(?:create|add|new)\s+(?:a\s+)?(\w+(?:\s+\w+)?)\s+(?:named|called|hcp|doctor|dr)/i
  );
  if (direct) {
    const s = direct[1].toLowerCase();
    if (KNOWN_SPECIALTIES.includes(s)) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
  }
  return '';
}

function extractHospital(text: string): string {
  const patterns = [
    /(?:at|working\s+at|employed\s+at|based\s+at)\s+([A-Z][\w\s]+?)(?:\s+(?:in|hospital|clinic|center|\.|,|$))/i,
    /(?:hospital|clinic)\s*[:：]?\s*([A-Z][\w\s]+?)(?:[,.]|$)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().replace(/[,.]$/, '');
  }
  const atMatch = text.match(/(?:at)\s+([A-Z][\w\s]+?)(?:\s+in\s+|[,.]|$)/);
  if (atMatch) return atMatch[1].trim().replace(/[,.]$/, '');
  return '';
}

function extractCity(text: string): string {
  const patterns = [
    /(?:in|based\s+in|located\s+in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:[,.]|$)/,
    /(?:city)\s*[:：]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:[,.]|$)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().replace(/[,.]$/, '');
  }
  return '';
}

function extractEmail(text: string): string {
  const patterns = [
    /(?:email|e-mail|mail)\s*(?::|is)?\s*([\w.-]+@[\w.-]+\.\w+)/i,
    /([\w.-]+@[\w.-]+\.\w+)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return '';
}

function extractPhone(text: string): string {
  const patterns = [
    /(?:phone|mobile|tel|cell|contact)\s*(?::|is|#)?\s*([\d\s\-+()]{6,20})/i,
    /([\d\s\-+()]{6,20})/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const cleaned = m[1].trim();
      if (/\d{6,}/.test(cleaned.replace(/\D/g, ''))) return cleaned;
    }
  }
  return '';
}

export function parseHCPFromText(text: string): ParsedHCP {
  return {
    name: extractName(text),
    specialty: extractSpecialty(text),
    hospital: extractHospital(text),
    city: extractCity(text),
    email: extractEmail(text),
    phone: extractPhone(text),
  };
}
