import { FormEvent, useEffect, useState } from 'react';
import { Bone, Plus, Trash2, UserRound } from 'lucide-react';
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

export function ProfilesPage({ user, onUserUpdated }: ProfilesPageProps) {
  const [name, setName] = useState(user.name);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

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
  }, [user.name]);

  async function handleSaveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNameSaving(true);
    setNameError(null);
    try {
      await patchCurrentUser({ name: name.trim() });
      await onUserUpdated();
    } catch {
      setNameError('No se pudo actualizar el nombre.');
    } finally {
      setNameSaving(false);
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
        window.alert('La imagen es demasiado grande. Prueba con una foto mas pequeña (menos de unos 300 KB).');
        return;
      }
      setPetForm((f) => ({ ...f, avatarDataUrl: result }));
    };
    reader.readAsDataURL(file);
  }

  if (user.role !== 'client') {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <UserRound className="text-teal" size={22} aria-hidden="true" />
            <h1 className="text-xl font-semibold text-ink">Tu perfil</h1>
          </div>
          <p className="text-sm text-slate-600">Actualiza como te muestra la aplicacion.</p>
          <form className="mt-5 space-y-4" onSubmit={(e) => void handleSaveName(e)}>
            <label className="block text-sm font-medium text-slate-700">
              Nombre visible
              <input
                className="mt-2 h-10 w-full max-w-md rounded-md border border-slate-300 px-3"
                onChange={(e) => setName(e.target.value)}
                value={name}
              />
            </label>
            {nameError && <p className="text-sm text-rose-700">{nameError}</p>}
            <button
              className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              disabled={nameSaving}
              type="submit"
            >
              Guardar nombre
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <UserRound className="text-teal" size={22} aria-hidden="true" />
          <h1 className="text-xl font-semibold text-ink">Tu perfil</h1>
        </div>
        <p className="text-sm text-slate-600">Nombre que veran los profesionales en la plataforma.</p>
        <form className="mt-5 space-y-4" onSubmit={(e) => void handleSaveName(e)}>
          <label className="block text-sm font-medium text-slate-700">
            Nombre del tutor
            <input
              className="mt-2 h-10 w-full max-w-md rounded-md border border-slate-300 px-3"
              onChange={(e) => setName(e.target.value)}
              value={name}
            />
          </label>
          {nameError && <p className="text-sm text-rose-700">{nameError}</p>}
          <button
            className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            disabled={nameSaving}
            type="submit"
          >
            Guardar nombre
          </button>
        </form>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bone className="text-teal" size={22} aria-hidden="true" />
            <h2 className="text-lg font-semibold text-ink">Mascotas</h2>
          </div>
          <button
            className="inline-flex items-center gap-1 rounded-md border border-teal px-3 py-1.5 text-sm font-semibold text-teal"
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
          <p className="text-sm text-slate-500">Aun no hay mascotas. Usa el formulario para agregar la primera.</p>
        ) : (
          <ul className="mb-4 max-h-52 space-y-2 overflow-y-auto">
            {pets.map((pet) => (
              <li className="flex items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2" key={pet.id}>
                <button
                  className="min-w-0 flex-1 text-left text-sm"
                  onClick={() => startEdit(pet)}
                  type="button"
                >
                  <span className="font-semibold text-ink">{pet.name}</span>
                  <span className="block truncate text-slate-500">
                    {pet.species} · {pet.breed}
                    {formatPetAge(pet) ? ` · ${formatPetAge(pet)}` : ''}
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

        <form className="space-y-3 border-t border-slate-100 pt-4" onSubmit={handleSavePet}>
          <p className="text-sm font-semibold text-slate-700">{editingId ? 'Editar mascota' : 'Agregar mascota'}</p>
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
                <option value="years">Años</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white" type="submit">
              {editingId ? 'Guardar cambios' : 'Guardar mascota'}
            </button>
            {editingId && (
              <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => startAdd()} type="button">
                Cancelar edicion
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
