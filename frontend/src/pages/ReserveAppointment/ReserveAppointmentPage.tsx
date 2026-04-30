import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Bone,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Home,
  Monitor,
  Plus,
  Search,
  Stethoscope,
  Syringe,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  createAppointment,
  getServices,
  getSurgeryRooms,
  getVeterinarians,
} from '../../services/api';
import type { AppointmentMode, Service, SurgeryRoom, User } from '../../types';
import { formatDate } from '../../utils/format';

interface ReserveAppointmentPageProps {
  user: User;
}

interface PetProfile {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
}

type SearchMode = 'specialty' | 'professional';

const STORAGE_KEY = 'newvet.pets';

const serviceCards: Array<{
  mode: AppointmentMode;
  title: string;
  description: string;
  icon: typeof Monitor;
}> = [
  {
    mode: 'online',
    title: 'Teleconsulta',
    description: 'Orientacion remota y seguimiento clinico.',
    icon: Monitor,
  },
  {
    mode: 'home',
    title: 'Domicilio',
    description: 'Atencion presencial en el hogar.',
    icon: Home,
  },
  {
    mode: 'surgery',
    title: 'Cirugia',
    description: 'Evaluacion y procedimiento quirurgico.',
    icon: Syringe,
  },
];

const specialtyOptions = ['Medicina general', 'Dermatologia', 'Cirugia menor', 'Cardiologia', 'Exoticos'];
const restrictions = [
  'No atiende braquiocefalicos',
  'Solo felinos tranquilos',
  'Requiere examenes previos',
  'Atiende pacientes senior',
  'Sin restricciones informadas',
];

export function ReserveAppointmentPage({ user }: ReserveAppointmentPageProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [pets, setPets] = useState<PetProfile[]>(() => loadPets());
  const [selectedPetId, setSelectedPetId] = useState('');
  const [petForm, setPetForm] = useState({ name: '', species: 'Perro', breed: '', age: '' });
  const [mode, setMode] = useState<AppointmentMode | ''>('');
  const [serviceId, setServiceId] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('specialty');
  const [specialty, setSpecialty] = useState(specialtyOptions[0]);
  const [professionalId, setProfessionalId] = useState('');
  const [selectedDate, setSelectedDate] = useState(dateToInput(addDays(new Date(), 1)));
  const [visibleDays, setVisibleDays] = useState(6);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<User[]>([]);
  const [surgeryRooms, setSurgeryRooms] = useState<SurgeryRoom[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const [serviceData, vetData, roomData] = await Promise.all([
        getServices(),
        getVeterinarians(),
        getSurgeryRooms(),
      ]);
      setServices(serviceData);
      setVeterinarians(vetData);
      setSurgeryRooms(roomData);
    }

    void loadData();
  }, []);

  const filteredServices = useMemo(
    () => services.filter((service) => mode && service.service_type === mode),
    [mode, services],
  );
  const days = useMemo(() => {
    return Array.from({ length: visibleDays }, (_, index) => addDays(new Date(), index + 1));
  }, [visibleDays]);
  const professionals = useMemo(() => {
    if (searchMode === 'professional' && professionalId) {
      return veterinarians.filter((vet) => String(vet.id) === professionalId);
    }
    return veterinarians;
  }, [professionalId, searchMode, veterinarians]);

  function savePet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pet: PetProfile = {
      id: makePetId(),
      name: petForm.name,
      species: petForm.species,
      breed: petForm.breed,
      age: petForm.age,
    };
    const nextPets = [...pets, pet];
    setPets(nextPets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPets));
    setSelectedPetId(pet.id);
    setPetForm({ name: '', species: 'Perro', breed: '', age: '' });
  }

  function selectMode(nextMode: AppointmentMode) {
    setMode(nextMode);
    setServiceId('');
  }

  async function reserveSlot(veterinarianId: number, time: string) {
    if (!mode || !serviceId) return;
    setSubmitting(true);
    setError(null);
    try {
      const appointment = await createAppointment({
        veterinarian: veterinarianId,
        service: Number(serviceId),
        date: selectedDate,
        time,
        mode,
        surgery_room: mode === 'surgery' ? surgeryRooms[0]?.id : undefined,
      });
      navigate(`/appointments/${appointment.id}`);
    } catch {
      setError('No se pudo reservar esa hora.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Reserva de hora</h1>
            <p className="text-sm text-slate-500">Completa los pasos para encontrar una hora disponible.</p>
          </div>
          <span className="rounded-md bg-teal-50 px-3 py-1 text-sm font-semibold text-teal">
            Paso {step} de 4
          </span>
        </div>

        <StepProgress currentStep={step} />

        <div className="mt-6 rounded-md border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="font-semibold text-ink">{stepTitle(step)}</h2>
          </div>
          <div className="p-5">
            {step === 1 && (
              <PatientStep
                petForm={petForm}
                pets={pets}
                selectedPetId={selectedPetId}
                setPetForm={setPetForm}
                setSelectedPetId={setSelectedPetId}
                onSavePet={savePet}
              />
            )}
            {step === 2 && (
              <ServiceStep
                filteredServices={filteredServices}
                mode={mode}
                selectedServiceId={serviceId}
                selectMode={selectMode}
                setSelectedServiceId={setServiceId}
              />
            )}
            {step === 3 && (
              <SearchStep
                professionalId={professionalId}
                searchMode={searchMode}
                setProfessionalId={setProfessionalId}
                setSearchMode={setSearchMode}
                setSpecialty={setSpecialty}
                specialty={specialty}
                veterinarians={veterinarians}
              />
            )}
            {step === 4 && (
              <AvailabilityStep
                days={days}
                error={error}
                professionals={professionals}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                setVisibleDays={setVisibleDays}
                submitting={submitting}
                visibleDays={visibleDays}
                onReserve={reserveSlot}
              />
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
            disabled={step === 1}
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            type="button"
          >
            Volver
          </button>
          {step < 4 && (
            <button
              className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              disabled={!canContinue(step, selectedPetId, mode, serviceId)}
              onClick={() => setStep((current) => Math.min(4, current + 1))}
              type="button"
            >
              Continuar
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function StepProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="flex items-center gap-2">
          <div
            className={`grid h-8 w-8 place-items-center rounded-full text-sm font-semibold ${
              item <= currentStep ? 'bg-teal text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {item}
          </div>
          <div className={`h-1 min-w-0 flex-1 rounded ${item < currentStep ? 'bg-teal' : 'bg-slate-200'}`} />
        </div>
      ))}
    </div>
  );
}

function PatientStep({
  pets,
  selectedPetId,
  setSelectedPetId,
  petForm,
  setPetForm,
  onSavePet,
}: {
  pets: PetProfile[];
  selectedPetId: string;
  setSelectedPetId: (id: string) => void;
  petForm: { name: string; species: string; breed: string; age: string };
  setPetForm: (value: { name: string; species: string; breed: string; age: string }) => void;
  onSavePet: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div>
        <p className="mb-3 text-sm font-semibold text-slate-700">Perfiles de mascotas</p>
        {pets.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-5 text-sm text-slate-500">
            Aun no hay mascotas guardadas. Agrega una para continuar.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {pets.map((pet) => (
              <button
                className={`rounded-md border p-4 text-left ${
                  selectedPetId === pet.id ? 'border-teal bg-teal-50' : 'border-slate-200 bg-white'
                }`}
                key={pet.id}
                onClick={() => setSelectedPetId(pet.id)}
                type="button"
              >
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-md bg-slate-100 text-teal">
                  <Bone size={20} aria-hidden="true" />
                </div>
                <p className="font-semibold text-ink">{pet.name}</p>
                <p className="mt-1 text-sm text-slate-500">{pet.species} · {pet.breed || 'Sin raza'} · {pet.age || 'Edad no indicada'}</p>
              </button>
            ))}
          </div>
        )}
      </div>
      <form className="rounded-md border border-slate-200 p-4" onSubmit={onSavePet}>
        <div className="mb-4 flex items-center gap-2">
          <Plus size={18} className="text-teal" aria-hidden="true" />
          <p className="font-semibold text-ink">Agregar mascota</p>
        </div>
        <Input label="Nombre" onChange={(name) => setPetForm({ ...petForm, name })} required value={petForm.name} />
        <SelectValue label="Especie" onChange={(species) => setPetForm({ ...petForm, species })} value={petForm.species}>
          <option value="Perro">Perro</option>
          <option value="Gato">Gato</option>
          <option value="Exotico">Exotico</option>
        </SelectValue>
        <Input label="Raza" onChange={(breed) => setPetForm({ ...petForm, breed })} value={petForm.breed} />
        <Input label="Edad" onChange={(age) => setPetForm({ ...petForm, age })} value={petForm.age} />
        <button className="mt-2 h-10 w-full rounded-md border border-teal px-4 text-sm font-semibold text-teal" type="submit">
          Guardar mascota
        </button>
      </form>
    </div>
  );
}

function ServiceStep({
  mode,
  selectMode,
  filteredServices,
  selectedServiceId,
  setSelectedServiceId,
}: {
  mode: AppointmentMode | '';
  selectMode: (mode: AppointmentMode) => void;
  filteredServices: Service[];
  selectedServiceId: string;
  setSelectedServiceId: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        {serviceCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              className={`rounded-md border p-4 text-left ${
                mode === card.mode ? 'border-teal bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
              key={card.mode}
              onClick={() => selectMode(card.mode)}
              type="button"
            >
              <Icon size={24} className="mb-3 text-teal" aria-hidden="true" />
              <p className="font-semibold text-ink">{card.title}</p>
              <p className="mt-1 text-sm text-slate-500">{card.description}</p>
            </button>
          );
        })}
      </div>
      <div>
        <p className="mb-3 text-sm font-semibold text-slate-700">Servicios disponibles</p>
        <div className="grid gap-3 md:grid-cols-2">
          {filteredServices.map((service) => (
            <button
              className={`rounded-md border p-4 text-left ${
                selectedServiceId === String(service.id) ? 'border-teal bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
              key={service.id}
              onClick={() => setSelectedServiceId(String(service.id))}
              type="button"
            >
              <ClipboardList size={20} className="mb-2 text-teal" aria-hidden="true" />
              <p className="font-semibold text-ink">{service.name}</p>
              <p className="mt-1 text-sm text-slate-500">{service.duration_minutes} min · ${service.price ?? 'Por confirmar'}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchStep({
  searchMode,
  setSearchMode,
  specialty,
  setSpecialty,
  professionalId,
  setProfessionalId,
  veterinarians,
}: {
  searchMode: SearchMode;
  setSearchMode: (value: SearchMode) => void;
  specialty: string;
  setSpecialty: (value: string) => void;
  professionalId: string;
  setProfessionalId: (value: string) => void;
  veterinarians: User[];
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          className={`rounded-md border p-4 text-left ${searchMode === 'specialty' ? 'border-teal bg-teal-50' : 'border-slate-200'}`}
          onClick={() => setSearchMode('specialty')}
          type="button"
        >
          <Search size={22} className="mb-2 text-teal" aria-hidden="true" />
          <p className="font-semibold">Busqueda por especialidad</p>
          <p className="mt-1 text-sm text-slate-500">Encuentra profesionales segun area clinica.</p>
        </button>
        <button
          className={`rounded-md border p-4 text-left ${searchMode === 'professional' ? 'border-teal bg-teal-50' : 'border-slate-200'}`}
          onClick={() => setSearchMode('professional')}
          type="button"
        >
          <Stethoscope size={22} className="mb-2 text-teal" aria-hidden="true" />
          <p className="font-semibold">Busqueda por profesional</p>
          <p className="mt-1 text-sm text-slate-500">Selecciona directamente a quien atendera.</p>
        </button>
      </div>
      {searchMode === 'specialty' ? (
        <SelectValue label="Especialidad" onChange={setSpecialty} value={specialty}>
          {specialtyOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </SelectValue>
      ) : (
        <SelectValue label="Profesional" onChange={setProfessionalId} value={professionalId}>
          <option value="">Cualquier profesional</option>
          {veterinarians.map((vet) => <option key={vet.id} value={vet.id}>{vet.name}</option>)}
        </SelectValue>
      )}
      <button className="inline-flex h-10 items-center gap-2 rounded-md bg-teal px-4 text-sm font-semibold text-white" type="button">
        <Search size={17} aria-hidden="true" />
        Buscar hora
      </button>
    </div>
  );
}

function AvailabilityStep({
  days,
  visibleDays,
  selectedDate,
  setSelectedDate,
  setVisibleDays,
  professionals,
  submitting,
  error,
  onReserve,
}: {
  days: Date[];
  visibleDays: number;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  setVisibleDays: (count: number) => void;
  professionals: User[];
  submitting: boolean;
  error: string | null;
  onReserve: (vetId: number, time: string) => Promise<void>;
}) {
  const hours = ['09:00', '10:00', '11:00', '14:00', '15:00'];

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((day) => {
          const value = dateToInput(day);
          return (
            <button
              className={`min-w-28 rounded-md border px-3 py-2 text-sm ${
                selectedDate === value ? 'border-teal bg-teal text-white' : 'border-slate-200 bg-white text-slate-700'
              }`}
              key={value}
              onClick={() => setSelectedDate(value)}
              type="button"
            >
              {formatDate(value)}
            </button>
          );
        })}
        <button
          className="min-w-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-teal"
          onClick={() => setVisibleDays(visibleDays + 6)}
          type="button"
        >
          Ver mas dias
        </button>
      </div>

      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {professionals.map((vet, index) => (
          <article className="rounded-md border border-slate-200 bg-white p-4" key={vet.id}>
            <div className="mb-4 flex items-start gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-md bg-slate-100 text-lg font-semibold text-teal">
                {initials(vet.name)}
              </div>
              <div>
                <p className="font-semibold text-ink">{vet.name}</p>
                <p className="text-sm text-slate-500">{specialtyOptions[index % specialtyOptions.length]}</p>
                <p className="mt-1 text-xs text-amber-700">{restrictions[index % restrictions.length]}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {hours.map((hour, hourIndex) => (
                <button
                  className="rounded-md border border-slate-200 px-2 py-2 text-sm font-semibold text-teal hover:border-teal disabled:opacity-50"
                  disabled={submitting || (index + hourIndex) % 5 === 0}
                  key={`${vet.id}-${hour}`}
                  onClick={() => void onReserve(vet.id, hour)}
                  type="button"
                >
                  {hour}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="mb-3 block text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      />
    </label>
  );
}

function SelectValue({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select
        className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function makePetId(): string {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `pet-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadPets(): PetProfile[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as PetProfile[];
  } catch {
    return [];
  }
}

function stepTitle(step: number): string {
  if (step === 1) return 'Reserva de hora paso 1: identifica paciente';
  if (step === 2) return 'Reserva de hora paso 2: que servicio necesita agendar';
  if (step === 3) return 'Reserva de hora paso 3: busqueda';
  return 'Reserva de hora paso 4: selecciona profesional y hora';
}

function canContinue(step: number, selectedPetId: string, mode: AppointmentMode | '', serviceId: string): boolean {
  if (step === 1) return Boolean(selectedPetId);
  if (step === 2) return Boolean(mode && serviceId);
  return true;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateToInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
