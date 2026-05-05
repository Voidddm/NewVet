from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.appointments.models import Appointment, MedicalFile, Message, SurgeryRoom
from apps.services.models import Service
from apps.users.models import User


class AppointmentClinicalFlowTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            email='client@example.com',
            password='pass12345',
            name='Tutor',
            role='client',
        )
        self.veterinarian = User.objects.create_user(
            email='vet@example.com',
            password='pass12345',
            name='Veterinaria',
            role='veterinarian',
        )
        self.service = Service.objects.create(
            name='Cirugia menor',
            description='Procedimiento quirurgico simple',
            duration_minutes=60,
            service_type='surgery',
            price=50000,
        )
        self.surgery_room = SurgeryRoom.objects.create(
            name='Pabellon Central',
            address='Av. Principal 123',
        )

    def test_surgery_appointment_enables_clinical_panel_after_acceptance(self):
        self.client.force_authenticate(user=self.client_user)

        create_response = self.client.post(reverse('appointment-list-create'), {
            'veterinarian': self.veterinarian.id,
            'service': self.service.id,
            'date': '2026-05-05',
            'time': '10:00',
            'mode': Appointment.Mode.SURGERY,
            'surgery_room': self.surgery_room.id,
        })

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        appointment = Appointment.objects.get(id=create_response.data['id'])
        self.assertEqual(appointment.status, Appointment.Status.PENDING)
        self.assertIsNotNone(appointment.expires_at)

        self.client.force_authenticate(user=self.veterinarian)
        accept_response = self.client.post(reverse('appointment-accept', args=[appointment.id]))

        self.assertEqual(accept_response.status_code, status.HTTP_200_OK)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, Appointment.Status.ACCEPTED)
        self.assertIsNotNone(appointment.accepted_at)

        blocked_message = self.client.post(reverse('appointment-messages', args=[appointment.id]), {
            'content': 'Ya revise los antecedentes clinicos.',
        })
        self.assertEqual(blocked_message.status_code, status.HTTP_400_BAD_REQUEST)

        enable_chat = self.client.patch(
            reverse('appointment-detail', args=[appointment.id]),
            {'messaging_enabled': True},
            format='json',
        )
        self.assertEqual(enable_chat.status_code, status.HTTP_200_OK)
        appointment.refresh_from_db()
        self.assertTrue(appointment.messaging_enabled)

        message_response = self.client.post(reverse('appointment-messages', args=[appointment.id]), {
            'content': 'Ya revise los antecedentes clinicos.',
        })

        self.assertEqual(message_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Message.objects.filter(appointment=appointment).count(), 1)

        file_response = self.client.post(
            reverse('appointment-files', args=[appointment.id]),
            {
                'file': SimpleUploadedFile(
                    'examen.pdf',
                    b'contenido de prueba',
                    content_type='application/pdf',
                ),
                'file_type': MedicalFile.FileType.PDF,
                'description': 'Examen preoperatorio',
            },
            format='multipart',
        )

        self.assertEqual(file_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MedicalFile.objects.filter(appointment=appointment).count(), 1)

    def test_surgery_appointment_requires_surgery_room(self):
        self.client.force_authenticate(user=self.client_user)

        response = self.client.post(reverse('appointment-list-create'), {
            'veterinarian': self.veterinarian.id,
            'service': self.service.id,
            'date': '2026-05-05',
            'time': '10:00',
            'mode': Appointment.Mode.SURGERY,
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('surgery_room', response.data)

    def test_appointment_service_must_match_mode(self):
        home_service = Service.objects.create(
            name='Control domicilio',
            description='Visita a domicilio',
            duration_minutes=45,
            service_type='home',
            price=30000,
        )

        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(reverse('appointment-list-create'), {
            'veterinarian': self.veterinarian.id,
            'service': home_service.id,
            'date': '2026-05-05',
            'time': '10:00',
            'mode': Appointment.Mode.ONLINE,
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('service', response.data)

    def test_veterinarian_can_approve_surgery_appointment(self):
        appointment = Appointment.objects.create(
            client=self.client_user,
            veterinarian=self.veterinarian,
            service=self.service,
            date='2026-05-05',
            time='10:00',
            mode=Appointment.Mode.SURGERY,
            surgery_room=self.surgery_room,
            status=Appointment.Status.ACCEPTED,
        )

        self.client.force_authenticate(user=self.veterinarian)
        response = self.client.post(reverse('appointment-approve-surgery', args=[appointment.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        appointment.refresh_from_db()
        self.assertTrue(appointment.is_surgery_approved)

    def test_client_cannot_approve_surgery_appointment(self):
        appointment = Appointment.objects.create(
            client=self.client_user,
            veterinarian=self.veterinarian,
            service=self.service,
            date='2026-05-05',
            time='10:00',
            mode=Appointment.Mode.SURGERY,
            surgery_room=self.surgery_room,
        )

        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(reverse('appointment-approve-surgery', args=[appointment.id]))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_role_based_appointment_lists(self):
        Appointment.objects.create(
            client=self.client_user,
            veterinarian=self.veterinarian,
            service=self.service,
            date='2026-05-05',
            time='10:00',
            mode=Appointment.Mode.SURGERY,
            surgery_room=self.surgery_room,
        )

        self.client.force_authenticate(user=self.client_user)
        client_response = self.client.get(reverse('client-appointments'))

        self.assertEqual(client_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(client_response.data), 1)

        self.client.force_authenticate(user=self.veterinarian)
        veterinarian_response = self.client.get(reverse('veterinarian-appointments'))

        self.assertEqual(veterinarian_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(veterinarian_response.data), 1)

    def test_admin_can_cancel_expired_pending_appointments(self):
        admin = User.objects.create_superuser(
            email='admin@example.com',
            password='pass12345',
            name='Admin',
        )
        expired_appointment = Appointment.objects.create(
            client=self.client_user,
            veterinarian=self.veterinarian,
            service=self.service,
            date='2026-05-05',
            time='10:00',
            mode=Appointment.Mode.SURGERY,
            surgery_room=self.surgery_room,
        )
        expired_appointment.expires_at = timezone.now() - timezone.timedelta(minutes=1)
        expired_appointment.save(update_fields=['expires_at'])

        self.client.force_authenticate(user=admin)
        response = self.client.post(reverse('appointment-cancel-expired'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['cancelled_count'], 1)
        expired_appointment.refresh_from_db()
        self.assertEqual(expired_appointment.status, Appointment.Status.CANCELLED)
