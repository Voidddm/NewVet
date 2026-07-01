import { FormEvent, useEffect, useState } from 'react';
import { Bone, ExternalLink, MapPin, Phone, Plus, Trash2, UserRound } from 'lucide-react';
import { breedsForSpecies } from '../../data/petBreeds';
import {
  formatPetAge,
  loadPets,
  makePetId,
  type AgeUnit,
  type PetProfile,
  savePets,
} from '../../pets/storage';
import { patchCurrentUser } from '../../services/api';
import type { User } from '../../types';

interface ProfilesPageProps {
  user: User;
  onUserUpdated: () => Promise<void>;
}

const MAX_AVATAR_BYTES = 350_000;

const COMMUNES = [
  'Cerrillos',
  'Cerro Navia',
  'Conchali',
  'El Bosque',
  'Estacion Central',
  'Huechuraba',
  'Independencia',
  'La Cisterna',
  'La Florida',
  'La Granja',
  'La Pintana',
  'La Reina',
  'Las Condes',
  'Lo Barnechea',
  'Lo Espejo',
  'Lo Prado',
  'Macul',
  'Maipu',
  'Nunoa',
  'Pedro Aguirre Cerda',
  'Penalolen',
  'Providencia',
  'Pudahuel',
  'Puente Alto',
  'Quilicura',
  'Quinta Normal',
  'Recoleta',
  'Renca',
  'San Bernardo',
  'San Joaquin',
  'San Miguel',
  'San Ramon',
  'Santiago',
  'Vitacura',
];

export function ProfilesPage({ user, onUserUpdated }: ProfilesPageProps) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [address, setAddress] = useState(user.address ?? '');
  const [commune, setCommune] = useState(user.commune ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [pets, setPets] = useState<PetProfile[]>(() => loadPets());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'Perro',
    breed: breedsForSpecies('Perro')[0] ?? '',
    ageAmount: '',
    ageUnit: 'years' as AgeUnit,
    avatarDataUrl: '' as string | undefined,
  });

  useEffect(() => {
    setName(user.name);
    setPhone(user.phone ?? '');
    setAddress(user.address ?? '');
    setCommune(user.commune ?? '');
  }, [user.address, user.commune, user.name, user.phone]);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    try {
      await patchCurrentUser({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        commune: commune.trim(),
      });
      await onUserUpdated();
    } catch {
      setProfileError('No se pudo actualizar el perfil.');
    } finally {
      setProfileSaving(false);
    }
  }

  function startAdd() {
    setEditingId(null);
    setPetForm({
      name: '',
      species: 'Perro',
      breed: breedsForSpecies('Perro')[0] ?? '',
      ageAmount: '',
      ageUnit: 'years',
      avatarDataUrl: undefined,
    });
  }

  function startEdit(pet: PetProfile) {
    setEditingId(pet.id);
    setPetForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      ageAmount: pet.ageAmount,
      ageUnit: pet.ageUnit,
      avatarDataUrl: pet.avatarDataUrl,
    });
  }

  function persistPetList(next: PetProfile[]) {
    setPets(next);
    savePets(next);
  }

  function handleSavePet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entry: PetProfile = {
      id: editingId ?? makePetId(),
      name: petForm.name.trim(),
      species: petForm.species,
      breed: petForm.breed,
      ageAmount: petForm.ageAmount,
      ageUnit: petForm.ageUnit,
      avatarDataUrl: petForm.avatarDataUrl || undefined,
    };
    if (editingId) {
      persistPetList(pets.map((p) => (p.id === editingId ? entry : p)));
    } else {
      persistPetList([...pets, entry]);
    }
    startAdd();
  }

  function handleDelete(id: string) {
    if (!window.confirm('Eliminar esta mascota del perfil local?')) return;
    persistPetList(pets.filter((p) => p.id !== id));
    if (editingId === id) startAdd();
  }

  function onAvatarFile(file: File | null) {
    if (!file || !file.type.startsWith('image/')) {
      setPetForm((f) => ({ ...f, avatarDataUrl: undefined }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') return;
      if (result.length > MAX_AVATAR_BYTES) {
        window.alert('La imagen es demasiado grande. Prueba con una foto mas pequena.');
        return;
      }
      setPetForm((f) => ({ ...f, avatarDataUrl: result }));
    };
    reader.readAsDataURL(file);
  }

  const mapsQuery = [address.trim(), commune.trim(), 'Chile'].filter(Boolean).join(', ');
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

  if (user.role !== 'client') {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <section className="rounded-md border border-white bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <UserRound className="text-teal" size={22} aria-hidden="true" />
            <h1 className="text-xl font-semibold text-ink">Tu perfil</h1>
          </div>
          <p className="text-sm text-slate-600">Actualiza como te muestra la aplicacion.</p>
          <form className="mt-5 space-y-4" onSubmit={(e) => void handleSaveProfile(e)}>
            <label className="block text-sm font-medium text-slate-700">
              Nombre visible
              <input
                className="mt-2 h-10 w-full max-w-md rounded-md border border-slate-300 px-3"
                onChange={(e) => setName(e.target.value)}
                required
                value={name}
              />
            </label>
            {profileError && <p className="text-sm text-rose-700">{profileError}</p>}
            <button
              className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              disabled={profileSaving}
              type="submit"
            >
              Guardar perfil
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="rounded-md border border-white bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <UserRound className="text-teal" size={22} aria-hidden="true" />
          <h1 className="text-xl font-semibold text-ink">Tu perfil</h1>
        </div>
        <p className="text-sm text-slate-600">Datos de contacto para coordinar atenciones y visitas.</p>
        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={(e) => void handleSaveProfile(e)}>
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Nombre del tutor
            <input
              className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3"
              onChange={(e) => setName(e.target.value)}
              required
              value={name}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Telefono
            <div className="mt-2 flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3">
              <Phone size={16} className="text-slate-400" aria-hidden="true" />
              <input
                className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 outline-none"
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9..."
                value={phone}
              />
            </div>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Comuna
            <select
              className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3"
              onChange={(e) => setCommune(e.target.value)}
              value={commune}
            >
              <option value="">Selecciona comuna</option>
              {COMMUNES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Direccion
            <div className="mt-2 flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1">
              <MapPin size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
              <input
                className="h-8 min-w-0 flex-1 border-0 bg-transparent p-0 outline-none"
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, numero, depto o referencia"
                value={address}
              />
              <a
                className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold ${
                  mapsQuery ? 'bg-blush text-ink hover:bg-coral/70' : 'pointer-events-none bg-slate-100 text-slate-400'
                }`}
                href={mapsUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink size={14} aria-hidden="true" />
                Maps
              </a>
            </div>
          </label>
          {profileError && <p className="text-sm text-rose-700 md:col-span-2">{profileError}</p>}
          <button
            className="w-fit rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            disabled={profileSaving}
            type="submit"
          >
            Guardar perfil
          </button>
        </form>
      </section>

      <section className="rounded-md border border-white bg-white p-5 shadow-soft xl:row-span-2">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bone className="text-teal" size={22} aria-hidden="true" />
            <h2 className="text-lg font-semibold text-ink">Tus mascotas</h2>
          </div>
          <button
            className="inline-flex items-center gap-1 rounded-md border border-teal bg-white px-3 py-1.5 text-sm font-semibold text-teal"
            onClick={() => startAdd()}
            type="button"
          >
            <Plus size={16} aria-hidden="true" />
            Nueva
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          Los datos se guardan en este navegador. En la reserva de hora podras elegir una de estas mascotas.
        </p>

        {pets.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-mist/50 p-5 text-sm text-slate-500">
            Aun no hay mascotas. Usa el cuadro de agregar mascota para crear la primera.
          </div>
        ) : (
          <ul className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
            {pets.map((pet) => (
              <li
                className={`flex items-center justify-between gap-3 rounded-md border px-3 py-3 ${
                  editingId === pet.id
                    ? 'border-teal bg-teal-50'
                    : 'border-slate-200 bg-white hover:border-teal/40'
                }`}
                key={pet.id}
              >
                <button
                  className="flex min-w-0 flex-1 items-center gap-3 text-left text-sm"
                  onClick={() => startEdit(pet)}
                  type="button"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-mist text-teal ring-1 ring-slate-200">
                    {pet.avatarDataUrl ? (
                      <img alt="" className="h-full w-full object-cover" src={pet.avatarDataUrl} />
                    ) : (
                      <Bone size={22} aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">{pet.name}</span>
                    <span className="block truncate text-slate-500">
                      {pet.species} - {pet.breed}
                      {formatPetAge(pet) ? ` - ${formatPetAge(pet)}` : ''}
                    </span>
                  </span>
                </button>
                <button
                  className="rounded-md p-2 text-rose-600 hover:bg-rose-50"
                  onClick={() => handleDelete(pet.id)}
                  title="Eliminar"
                  type="button"
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-md border border-white bg-white p-5 shadow-soft">
        <form className="space-y-3" onSubmit={handleSavePet}>
          <div className="flex items-center gap-2">
            <Plus className="text-teal" size={20} aria-hidden="true" />
            <h2 className="text-lg font-semibold text-ink">{editingId ? 'Editar mascota' : 'Agregar mascota'}</h2>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Foto (opcional)
            <input
              accept="image/*"
              className="mt-2 block w-full text-sm text-slate-600"
              onChange={(e) => onAvatarFile(e.target.files?.[0] ?? null)}
              type="file"
            />
          </label>
          {petForm.avatarDataUrl && (
            <img alt="" className="h-16 w-16 rounded-md object-cover ring-1 ring-slate-200" src={petForm.avatarDataUrl} />
          )}
          <label className="block text-sm font-medium text-slate-700">
            Nombre
            <input
              className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3"
              onChange={(e) => setPetForm((f) => ({ ...f, name: e.target.value }))}
              required
              value={petForm.name}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Especie
            <select
              className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3"
              onChange={(e) =>
                setPetForm((f) => ({
                  ...f,
                  species: e.target.value,
                  breed: breedsForSpecies(e.target.value)[0] ?? '',
                }))
              }
              value={petForm.species}
            >
              <option value="Perro">Perro</option>
              <option value="Gato">Gato</option>
              <option value="Exotico">Exotico</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Raza
            <select
              className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3"
              onChange={(e) => setPetForm((f) => ({ ...f, breed: e.target.value }))}
              value={petForm.breed}
            >
              {breedsForSpecies(petForm.species).map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Edad (cantidad)
              <input
                className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3"
                onChange={(e) => setPetForm((f) => ({ ...f, ageAmount: e.target.value }))}
                value={petForm.ageAmount}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Unidad
              <select
                className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3"
                onChange={(e) => setPetForm((f) => ({ ...f, ageUnit: e.target.value as AgeUnit }))}
                value={petForm.ageUnit}
              >
                <option value="weeks">Semanas</option>
                <option value="months">Meses</option>
                <option value="years">Anos</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white" type="submit">
              {editingId ? 'Guardar cambios' : 'Guardar mascota'}
            </button>
            {editingId && (
              <button
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                onClick={() => startAdd()}
                type="button"
              >
                Cancelar edicion
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
