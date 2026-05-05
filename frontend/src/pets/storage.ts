import { breedsForSpecies } from '../data/petBreeds';

export const PETS_STORAGE_KEY = 'newvet.pets';

export type AgeUnit = 'weeks' | 'months' | 'years';

export interface PetProfile {
  id: string;
  name: string;
  species: string;
  breed: string;
  ageAmount: string;
  ageUnit: AgeUnit;
  avatarDataUrl?: string;
}

const AGE_UNIT_LABELS: Record<AgeUnit, string> = {
  weeks: 'semanas',
  months: 'meses',
  years: 'años',
};

export function formatPetAge(pet: PetProfile): string {
  if (!pet.ageAmount.trim()) return '';
  return `${pet.ageAmount.trim()} ${AGE_UNIT_LABELS[pet.ageUnit]}`;
}

export function makePetId(): string {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `pet-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isAgeUnit(value: unknown): value is AgeUnit {
  return value === 'weeks' || value === 'months' || value === 'years';
}

export function normalizePet(raw: unknown): PetProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.id !== 'string' || typeof p.name !== 'string') return null;

  const species = typeof p.species === 'string' ? p.species : 'Perro';
  let breed = typeof p.breed === 'string' ? p.breed : '';
  const options = breedsForSpecies(species);
  const breedFallback =
    options.find((b) => b.startsWith('Otro')) ?? options[0] ?? '';
  if (!breed || !options.includes(breed)) {
    breed = breedFallback;
  }

  let ageAmount = typeof p.ageAmount === 'string' ? p.ageAmount : '';
  let ageUnit: AgeUnit = 'years';
  if (isAgeUnit(p.ageUnit)) {
    ageUnit = p.ageUnit;
  }
  if (!ageAmount && typeof p.age === 'string' && p.age.trim()) {
    ageAmount = p.age.trim();
    ageUnit = 'years';
  }

  const avatarDataUrl = typeof p.avatarDataUrl === 'string' ? p.avatarDataUrl : undefined;

  return {
    id: p.id,
    name: p.name,
    species,
    breed: breed || (options[0] ?? ''),
    ageAmount,
    ageUnit,
    avatarDataUrl,
  };
}

export function loadPets(): PetProfile[] {
  const stored = localStorage.getItem(PETS_STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizePet).filter((x): x is PetProfile => x !== null);
  } catch {
    return [];
  }
}

export function savePets(pets: PetProfile[]): void {
  localStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(pets));
}
