from datetime import datetime, time, timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.appointments.models import Appointment


class Command(BaseCommand):
    help = 'Envia recordatorios de teleconsulta 24 horas y 30 minutos antes.'

    def handle(self, *args, **options):
        now = timezone.now()
        sent_24h = self._send_due(now, timedelta(hours=24), 'reminder_24h_sent', '24 horas')
        sent_30m = self._send_due(now, timedelta(minutes=30), 'reminder_30m_sent', '30 minutos')
        self.stdout.write(self.style.SUCCESS(f'Recordatorios enviados: 24h={sent_24h}, 30m={sent_30m}'))

    def _send_due(self, now, offset, flag_field, label):
        start = now + offset
        end = start + timedelta(minutes=15)
        appointments = Appointment.objects.filter(
            mode=Appointment.Mode.ONLINE,
            status=Appointment.Status.ACCEPTED,
            date__gte=start.date(),
            date__lte=end.date(),
            **{flag_field: False},
        ).select_related('client', 'veterinarian')

        sent = 0
        for appointment in appointments:
            appointment_start = self._appointment_datetime(appointment)
            if not (start <= appointment_start <= end):
                continue
            self._send_email(appointment, label)
            setattr(appointment, flag_field, True)
            appointment.save(update_fields=[flag_field])
            sent += 1
        return sent

    def _appointment_datetime(self, appointment):
        naive = datetime.combine(appointment.date, appointment.time or time(0, 0))
        return timezone.make_aware(naive, timezone.get_current_timezone())

    def _send_email(self, appointment, label):
        link = f"{settings.FRONTEND_URL.rstrip('/')}/teleconsulta/{appointment.teleconsulta_link}"
        when = self._appointment_datetime(appointment).strftime('%d-%m-%Y %H:%M')
        subject = f'Recordatorio NewVet: teleconsulta en {label}'
        recipients = [
            email
            for email in [appointment.client.email, appointment.veterinarian.email]
            if email
        ]
        text = (
            f'Tu teleconsulta NewVet esta agendada para {when}.\n\n'
            f'Ingresar a la consulta: {link}'
        )
        html = f"""
        <div style="font-family: Arial, sans-serif; color: #2f2935;">
          <h2>Teleconsulta NewVet</h2>
          <p>Tu teleconsulta esta agendada para <strong>{when}</strong>.</p>
          <p>
            <a href="{link}" style="background:#9a91ac;color:#fff;padding:12px 16px;border-radius:6px;text-decoration:none;">
              Ingresar a la consulta
            </a>
          </p>
          <p style="color:#666;">Link directo: {link}</p>
        </div>
        """
        send_mail(
            subject,
            text,
            settings.DEFAULT_FROM_EMAIL,
            recipients,
            html_message=html,
            fail_silently=False,
        )
