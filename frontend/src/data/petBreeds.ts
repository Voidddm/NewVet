/** Razas predefinidas por especie para evitar datos inconsistentes por errores de escritura. */

export const DOG_BREEDS = [
  'Mestizo',
  'Labrador retriever',
  'Golden retriever',
  'Pastor aleman',
  'Bulldog frances',
  'Bulldog ingles',
  'Poodle / Caniche',
  'Chihuahua',
  'Yorkshire terrier',
  'Beagle',
  'Boxer',
  'Husky siberiano',
  'Border collie',
  'Cocker spaniel',
  'Schnauzer',
  'Dachshund / Salchicha',
  'Pug / Carlino',
  'Shih Tzu',
  'Jack Russell terrier',
  'Rottweiler',
  'Doberman',
  'Otro (indicar en notas de la cita)',
] as const;

export const CAT_BREEDS = [
  'Mestizo',
  'Persa',
  'Siames',
  'Maine coon',
  'Ragdoll',
  'British shorthair',
  'Bengali',
  'Sphynx',
  'Abisinio',
  'Europeo comun',
  'Scottish fold',
  'Angora turco',
  'Otro (indicar en notas de la cita)',
] as const;

export const EXOTIC_BREEDS = [
  'Conejo',
  'Cobaya',
  'Huron',
  'Hamster',
  'Chinchilla',
  'Reptil (general)',
  'Ave (general)',
  'Otro (indicar en notas de la cita)',
] as const;

export function breedsForSpecies(species: string): readonly string[] {
  if (species === 'Gato') return CAT_BREEDS;
  if (species === 'Exotico') return EXOTIC_BREEDS;
  return DOG_BREEDS;
}
