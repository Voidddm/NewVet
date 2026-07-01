from django.db import IntegrityError
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Appointment, MedicalFile, Message, SurgeryRoom
from ..serializers import (
    AppointmentCreateSerializer,
    AppointmentSerializer,
    AppointmentSummarySerializer,
    MedicalFileSerializer,
    MessageSerializer,
    SurgeryRoomSerializer,
)
from .appointment_filters import apply_appointment_list_filters


class AppointmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Appointment.objects.filter(
            Q(client=user) | Q(veterinarian=user)
        ).select_related('client', 'veterinarian', 'service', 'surgery_room')
        return apply_appointment_list_filters(qs, self.request)

    def perform_create(self, serializer):
        try:
            serializer.save()
        except IntegrityError:
            raise ValidationError('Slot ya reservado para este veterinario.')


class ClientAppointmentListView(generics.ListAPIView):
    serializer_class = AppointmentSummarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Appointment.objects.filter(
            client=self.request.user
        ).select_related('client', 'veterinarian', 'service', 'surgery_room').annotate(
            file_count=Count('medical_files')
        )
        return apply_appointment_list_filters(qs, self.request)


class VeterinarianAppointmentListView(generics.ListAPIView):
    serializer_class = AppointmentSummarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Appointment.objects.filter(
            veterinarian=self.request.user
        ).select_related('client', 'veterinarian', 'service', 'surgery_room').annotate(
            file_count=Count('medical_files')
        )
        return apply_appointment_list_filters(qs, self.request)


class AppointmentDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'head', 'options', 'patch']

    def get_queryset(self):
        user = self.request.user
        return Appointment.objects.filter(Q(client=user) | Q(veterinarian=user))

    def perform_update(self, serializer):
        try:
            serializer.save()
        except IntegrityError as exc:
            raise ValidationError('Ese horario ya esta ocupado para el veterinario.') from exc


class AppointmentStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    action = None

    def post(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)

        if self.action in ['accept', 'reject', 'complete', 'start_teleconsulta', 'finalize_teleconsulta']:
            if appointment.veterinarian_id != request.user.id:
                raise PermissionDenied('Solo el veterinario puede realizar esta accion.')
        elif request.user.id not in [appointment.client_id, appointment.veterinarian_id]:
            raise PermissionDenied('No tienes acceso a esta cita.')

        if self.action in ['start_teleconsulta', 'finalize_teleconsulta'] and appointment.mode != Appointment.Mode.ONLINE:
            raise ValidationError('Esta accion solo aplica a teleconsultas.')
        if self.action == 'start_teleconsulta' and appointment.status != Appointment.Status.ACCEPTED:
            raise ValidationError('La teleconsulta debe estar aceptada para iniciar.')
        if self.action == 'finalize_teleconsulta' and appointment.status != Appointment.Status.IN_PROGRESS:
            raise ValidationError('La teleconsulta debe estar en curso para finalizar.')

        getattr(appointment, self.action)()
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)


class AppointmentAcceptView(AppointmentStatusView):
    action = 'accept'


class AppointmentRejectView(AppointmentStatusView):
    action = 'reject'


class AppointmentCancelView(AppointmentStatusView):
    action = 'cancel'


class AppointmentCompleteView(AppointmentStatusView):
    action = 'complete'


class AppointmentStartTeleconsultationView(AppointmentStatusView):
    action = 'start_teleconsulta'


class AppointmentFinalizeTeleconsultationView(AppointmentStatusView):
    action = 'finalize_teleconsulta'


class AppointmentRescheduleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)
        if request.user.id not in [appointment.client_id, appointment.veterinarian_id]:
            raise PermissionDenied('No tienes acceso a esta cita.')
        if appointment.status not in [Appointment.Status.PENDING, Appointment.Status.ACCEPTED]:
            raise ValidationError('Solo se pueden reprogramar citas pendientes o aceptadas.')

        payload = {}
        if 'date' in request.data:
            payload['date'] = request.data.get('date')
        if 'time' in request.data:
            payload['time'] = request.data.get('time')
        if not payload:
            raise ValidationError('Debes enviar fecha u hora para reprogramar.')
        serializer = AppointmentSerializer(
            appointment,
            data=payload,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        try:
            serializer.save()
        except IntegrityError as exc:
            raise ValidationError('Ese horario ya esta ocupado para el veterinario.') from exc
        return Response(serializer.data, status=status.HTTP_200_OK)


class TeleconsultationByUuidView(generics.RetrieveAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = 'teleconsulta_link'
    lookup_field = 'teleconsulta_link'

    def get_queryset(self):
        user = self.request.user
        return Appointment.objects.filter(
            Q(client=user) | Q(veterinarian=user),
            mode=Appointment.Mode.ONLINE,
        ).select_related('client', 'veterinarian', 'service', 'surgery_room')


class SurgeryApprovalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)

        if appointment.veterinarian_id != request.user.id:
            raise PermissionDenied('Solo el veterinario puede aprobar una cirugia.')
        if appointment.mode != Appointment.Mode.SURGERY:
            raise ValidationError('Solo las citas de cirugia pueden aprobarse como cirugia.')

        appointment.is_surgery_approved = True
        appointment.save(update_fields=['is_surgery_approved'])
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)


class ExpiredPendingCancellationView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        cancelled_count = Appointment.cancel_expired_pending()
        return Response({'cancelled_count': cancelled_count}, status=status.HTTP_200_OK)


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        appointment = self._get_appointment()
        return Message.objects.filter(appointment=appointment)

    def _get_appointment(self):
        appointment = get_object_or_404(Appointment, pk=self.kwargs['appointment_id'])
        if self.request.user.id not in [appointment.client_id, appointment.veterinarian_id]:
            raise PermissionDenied('No tienes acceso a esta cita.')
        return appointment

    def perform_create(self, serializer):
        appointment = self._get_appointment()
        if appointment.status != Appointment.Status.ACCEPTED:
            raise ValidationError('La mensajeria se habilita cuando la cita esta aceptada.')
        if not appointment.messaging_enabled:
            raise ValidationError(
                'El veterinario aun no ha habilitado el chat para esta cita.'
            )
        serializer.save(appointment=appointment, sender=self.request.user)


class MedicalFileListCreateView(generics.ListCreateAPIView):
    serializer_class = MedicalFileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        appointment = self._get_appointment()
        return MedicalFile.objects.filter(appointment=appointment)

    def _get_appointment(self):
        appointment = get_object_or_404(Appointment, pk=self.kwargs['appointment_id'])
        if self.request.user.id not in [appointment.client_id, appointment.veterinarian_id]:
            raise PermissionDenied('No tienes acceso a esta cita.')
        return appointment

    def perform_create(self, serializer):
        appointment = self._get_appointment()
        if appointment.status not in [Appointment.Status.PENDING, Appointment.Status.ACCEPTED, Appointment.Status.IN_PROGRESS]:
            raise ValidationError('No se pueden agregar archivos a una cita cerrada.')
        serializer.save(appointment=appointment, uploaded_by=self.request.user)


class SurgeryRoomListView(generics.ListAPIView):
    serializer_class = SurgeryRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = SurgeryRoom.objects.filter(is_active=True).order_by('name')


AppointmentCreateView = AppointmentListCreateView
