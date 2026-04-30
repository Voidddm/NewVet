from datetime import time, timedelta
from decimal import Decimal
import random

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.appointments.models import Appointment, Availability, MedicalFile, Message, SurgeryRoom
from apps.services.models import Service
from apps.users.models import User


DEMO_DOMAIN = 'newvet.demo'
PASSWORD = 'Demo12345'


class Command(BaseCommand):
    help = 'Create demo users, services, surgery rooms, schedules, appointments, messages and files.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete demo data before creating it again.',
        )
        parser.add_argument(
            '--appointments',
            type=int,
            default=24,
            help='Number of demo appointments to create.',
        )

    def handle(self, *args, **options):
        random.seed(42)

        if options['reset']:
            self.reset_demo_data()

        with transaction.atomic():
            clients = self.create_users('client', [
                ('ana.torres', 'Ana Torres'),
                ('marco.silva', 'Marco Silva'),
                ('camila.rojas', 'Camila Rojas'),
                ('diego.munoz', 'Diego Munoz'),
                ('sofia.vera', 'Sofia Vera'),
                ('nicolas.araya', 'Nicolas Araya'),
            ])
            veterinarians = self.create_users('veterinarian', [
                ('valentina.perez', 'Dra. Valentina Perez'),
                ('tomas.garcia', 'Dr. Tomas Garcia'),
                ('isidora.morales', 'Dra. Isidora Morales'),
            ])
            services = self.create_services()
            surgery_rooms = self.create_surgery_rooms()
            self.create_availabilities(veterinarians)
            appointments = self.create_appointments(
                clients=clients,
                veterinarians=veterinarians,
                services=services,
                surgery_rooms=surgery_rooms,
                total=options['appointments'],
            )
            self.create_panel_content(appointments)

        self.stdout.write(self.style.SUCCESS('Demo data created successfully.'))
        self.stdout.write(f'Users: {len(clients)} clients, {len(veterinarians)} veterinarians')
        self.stdout.write(f'Services: {len(services)}')
        self.stdout.write(f'Surgery rooms: {len(surgery_rooms)}')
        self.stdout.write(f'Appointments: {len(appointments)}')
        self.stdout.write(f'Demo password for all users: {PASSWORD}')

    def reset_demo_data(self):
        demo_users = User.objects.filter(email__endswith=f'@{DEMO_DOMAIN}')
        Appointment.objects.filter(client__in=demo_users).delete()
        Appointment.objects.filter(veterinarian__in=demo_users).delete()
        Availability.objects.filter(veterinarian__in=demo_users).delete()
        demo_users.delete()

        Service.objects.filter(name__startswith='Demo').delete()
        SurgeryRoom.objects.filter(name__startswith='Demo').delete()

        self.stdout.write('Previous demo data deleted.')

    def create_users(self, role, people):
        users = []
        for username, name in people:
            email = f'{username}@{DEMO_DOMAIN}'
            user, created = User.objects.get_or_create(
                email=email,
                defaults={'name': name, 'role': role},
            )
            if created:
                user.set_password(PASSWORD)
                user.save(update_fields=['password'])
            users.append(user)
        return users

    def create_services(self):
        service_specs = [
            ('Demo Teleconsulta general', 'Evaluacion remota para dudas clinicas generales.', 30, 'online', '18000'),
            ('Demo Control domicilio', 'Visita veterinaria programada en domicilio.', 45, 'home', '32000'),
            ('Demo Vacunacion domicilio', 'Vacunacion y control preventivo en casa.', 30, 'home', '28000'),
            ('Demo Cirugia menor', 'Procedimiento quirurgico ambulatorio con pabellon.', 60, 'surgery', '75000'),
            ('Demo Evaluacion prequirurgica', 'Revision documental y orientacion previa a cirugia.', 30, 'online', '22000'),
        ]
        services = []
        for name, description, duration, service_type, price in service_specs:
            service, _ = Service.objects.get_or_create(
                name=name,
                defaults={
                    'description': description,
                    'duration_minutes': duration,
                    'service_type': service_type,
                    'price': Decimal(price),
                },
            )
            services.append(service)
        return services

    def create_surgery_rooms(self):
        room_specs = [
            ('Demo Pabellon Central', 'Av. Providencia 1200', 'Pabellon equipado para cirugia menor.'),
            ('Demo Pabellon Norte', 'Av. Independencia 845', 'Sala quirurgica para procedimientos programados.'),
            ('Demo Pabellon Sur', 'Gran Avenida 2401', 'Pabellon asociado a atenciones de derivacion.'),
        ]
        rooms = []
        for name, address, description in room_specs:
            room, _ = SurgeryRoom.objects.get_or_create(
                name=name,
                defaults={'address': address, 'description': description},
            )
            rooms.append(room)
        return rooms

    def create_availabilities(self, veterinarians):
        slots = [
            (0, time(9, 0), time(13, 0), Availability.Mode.ONLINE),
            (1, time(10, 0), time(15, 0), Availability.Mode.HOME),
            (2, time(9, 0), time(12, 0), Availability.Mode.ONLINE),
            (3, time(14, 0), time(18, 0), Availability.Mode.HOME),
            (4, time(9, 0), time(13, 0), Availability.Mode.ONLINE),
        ]
        for vet in veterinarians:
            for day_of_week, start_time, end_time, mode in slots:
                Availability.objects.get_or_create(
                    veterinarian=vet,
                    day_of_week=day_of_week,
                    start_time=start_time,
                    end_time=end_time,
                    mode=mode,
                )

    def create_appointments(self, clients, veterinarians, services, surgery_rooms, total):
        statuses = [
            Appointment.Status.PENDING,
            Appointment.Status.ACCEPTED,
            Appointment.Status.REJECTED,
            Appointment.Status.CANCELLED,
            Appointment.Status.COMPLETED,
        ]
        base_date = timezone.localdate() + timedelta(days=1)
        appointments = []
        service_by_type = {
            'online': [service for service in services if service.service_type == 'online'],
            'home': [service for service in services if service.service_type == 'home'],
            'surgery': [service for service in services if service.service_type == 'surgery'],
        }
        times = [time(9, 0), time(10, 0), time(11, 0), time(12, 0), time(14, 0), time(15, 0), time(16, 0)]

        for index in range(total):
            mode = random.choice([Appointment.Mode.ONLINE, Appointment.Mode.HOME, Appointment.Mode.SURGERY])
            service = random.choice(service_by_type[mode])
            vet = veterinarians[index % len(veterinarians)]
            day = base_date + timedelta(days=index // len(times))
            slot_time = times[index % len(times)]
            status = statuses[index % len(statuses)]

            defaults = {
                'client': random.choice(clients),
                'service': service,
                'mode': mode,
                'status': status,
                'surgery_room': random.choice(surgery_rooms) if mode == Appointment.Mode.SURGERY else None,
                'is_surgery_approved': mode == Appointment.Mode.SURGERY and status in [
                    Appointment.Status.ACCEPTED,
                    Appointment.Status.COMPLETED,
                ],
            }
            if status == Appointment.Status.ACCEPTED:
                defaults['accepted_at'] = timezone.now()
            if status == Appointment.Status.CANCELLED:
                defaults['cancelled_at'] = timezone.now()
            if status == Appointment.Status.COMPLETED:
                defaults['accepted_at'] = timezone.now() - timedelta(days=1)
                defaults['completed_at'] = timezone.now()

            try:
                appointment, _ = Appointment.objects.get_or_create(
                    veterinarian=vet,
                    date=day,
                    time=slot_time,
                    defaults=defaults,
                )
            except IntegrityError:
                continue
            appointments.append(appointment)

        return appointments

    def create_panel_content(self, appointments):
        accepted_or_completed = [
            appointment for appointment in appointments
            if appointment.status in [Appointment.Status.ACCEPTED, Appointment.Status.COMPLETED]
        ]
        for appointment in accepted_or_completed:
            Message.objects.get_or_create(
                appointment=appointment,
                sender=appointment.client,
                content='Hola, adjunte antecedentes para la revision.',
            )
            Message.objects.get_or_create(
                appointment=appointment,
                sender=appointment.veterinarian,
                content='Gracias, revisare los archivos antes de la atencion.',
            )
            if not MedicalFile.objects.filter(appointment=appointment).exists():
                MedicalFile.objects.create(
                    appointment=appointment,
                    uploaded_by=appointment.client,
                    file_type=MedicalFile.FileType.PDF,
                    description='Antecedente clinico demo',
                    file=ContentFile(
                        b'Documento clinico demo para NewVet.',
                        name=f'appointment-{appointment.id}-demo.pdf',
                    ),
                )
