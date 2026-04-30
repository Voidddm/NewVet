from datetime import datetime, timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from ..models import Availability, Appointment
from apps.services.models import Service

class AvailableSlotsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        vet_id = request.query_params.get('vet_id')
        service_id = request.query_params.get('service_id')
        date = request.query_params.get('date')  # YYYY-MM-DD

        service = Service.objects.get(id=service_id)
        duration = service.duration_minutes

        # día de la semana
        day_of_week = datetime.strptime(date, "%Y-%m-%d").weekday()

        availabilities = Availability.objects.filter(
            veterinarian_id=vet_id,
            day_of_week=day_of_week,
            is_active=True
        )

        # 1. obtener citas ya reservadas
        booked_appointments = Appointment.objects.filter(
            veterinarian_id=vet_id,
            date=date,
            status__in=[Appointment.Status.PENDING, Appointment.Status.ACCEPTED],
        ).values_list('time', flat=True)

        # 2. normalizar a string "HH:MM"
        booked_appointments = set(
            t.strftime("%H:%M") for t in booked_appointments
        )

        slots = []

        for availability in availabilities:
            start = datetime.combine(datetime.today(), availability.start_time)
            end = datetime.combine(datetime.today(), availability.end_time)

            while start + timedelta(minutes=duration) <= end:
                slot_str = start.time().strftime("%H:%M")

                # 3. filtrar ocupados
                if slot_str not in booked_appointments:
                    slots.append(slot_str)

                start += timedelta(minutes=duration)

        return Response(slots)
