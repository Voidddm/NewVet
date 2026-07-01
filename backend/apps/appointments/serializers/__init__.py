from rest_framework import serializers

from apps.appointments.models import Appointment, MedicalFile, Message, SurgeryRoom


class SurgeryRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurgeryRoom
        fields = ['id', 'name', 'address', 'description', 'is_active']


class MedicalFileSerializer(serializers.ModelSerializer):
    uploaded_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = MedicalFile
        fields = [
            'id',
            'appointment',
            'uploaded_by',
            'file',
            'file_type',
            'description',
            'created_at',
        ]
        read_only_fields = ['id', 'appointment', 'uploaded_by', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'appointment', 'sender', 'content', 'created_at', 'read_at']
        read_only_fields = ['id', 'appointment', 'sender', 'created_at', 'read_at']


class AppointmentSerializer(serializers.ModelSerializer):
    medical_files = MedicalFileSerializer(many=True, read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)
    veterinarian_name = serializers.CharField(source='veterinarian.name', read_only=True)
    tipo = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id',
            'tipo',
            'client',
            'client_name',
            'veterinarian',
            'veterinarian_name',
            'service',
            'date',
            'time',
            'mode',
            'status',
            'surgery_room',
            'referral_file',
            'is_surgery_approved',
            'messaging_enabled',
            'client_case_notes',
            'pet_name',
            'pet_avatar_data_url',
            'teleconsulta_link',
            'created_at',
            'accepted_at',
            'expires_at',
            'cancelled_at',
            'completed_at',
            'started_at',
            'finalized_at',
            'medical_files',
            'messages',
        ]
        read_only_fields = [
            'id',
            'tipo',
            'client',
            'client_name',
            'veterinarian_name',
            'teleconsulta_link',
            'created_at',
            'accepted_at',
            'expires_at',
            'cancelled_at',
            'completed_at',
            'started_at',
            'finalized_at',
            'medical_files',
            'messages',
        ]

    def get_tipo(self, obj):
        return 'teleconsulta' if obj.mode == Appointment.Mode.ONLINE else 'presencial'

    def validate(self, data):
        request = self.context['request']
        user = request.user
        instance = self.instance

        if instance is not None and request.method in ('PATCH', 'PUT'):
            patch_keys = set(data.keys())
            allowed = set()
            if user.id == instance.veterinarian_id and instance.status == Appointment.Status.ACCEPTED:
                allowed.add('messaging_enabled')
            if user.id == instance.client_id and instance.status in (
                Appointment.Status.PENDING,
                Appointment.Status.ACCEPTED,
            ):
                allowed.add('client_case_notes')
                allowed.add('pet_name')
                allowed.add('pet_avatar_data_url')
            if user.id in (instance.client_id, instance.veterinarian_id) and instance.status in (
                Appointment.Status.PENDING,
                Appointment.Status.ACCEPTED,
            ):
                allowed.add('date')
                allowed.add('time')
            if 'status' in patch_keys and user.id in (instance.client_id, instance.veterinarian_id):
                allowed.add('status')
            disallowed = patch_keys - allowed
            if disallowed:
                raise serializers.ValidationError({
                    key: 'No puedes modificar este campo.' for key in disallowed
                })

            next_status = data.get('status')
            if next_status:
                self._validate_status_change(instance, user, next_status)

        mode = data.get('mode', getattr(self.instance, 'mode', None))
        surgery_room = data.get('surgery_room', getattr(self.instance, 'surgery_room', None))
        service = data.get('service', getattr(self.instance, 'service', None))

        if mode == Appointment.Mode.SURGERY and surgery_room is None:
            raise serializers.ValidationError({
                'surgery_room': 'Las citas de cirugia requieren pabellon.'
            })

        if service is not None and service.service_type != mode:
            raise serializers.ValidationError({
                'service': 'El servicio seleccionado no corresponde al tipo de atencion.'
            })

        return data

    def _validate_status_change(self, instance, user, next_status):
        if next_status not in Appointment.Status.values:
            raise serializers.ValidationError({'status': 'Estado no valido.'})
        if user.id == instance.client_id:
            if next_status != Appointment.Status.CANCELLED:
                raise serializers.ValidationError({'status': 'El tutor solo puede cancelar la cita.'})
            return
        if user.id != instance.veterinarian_id:
            raise serializers.ValidationError({'status': 'No tienes acceso a esta cita.'})
        if next_status == Appointment.Status.IN_PROGRESS:
            if instance.mode != Appointment.Mode.ONLINE:
                raise serializers.ValidationError({'status': 'Solo las teleconsultas pueden pasar a en curso.'})
            if instance.status != Appointment.Status.ACCEPTED:
                raise serializers.ValidationError({'status': 'La teleconsulta debe estar aceptada para iniciar.'})
        if next_status == Appointment.Status.FINALIZED:
            if instance.mode != Appointment.Mode.ONLINE:
                raise serializers.ValidationError({'status': 'Solo las teleconsultas pueden finalizar como teleconsulta.'})
            if instance.status != Appointment.Status.IN_PROGRESS:
                raise serializers.ValidationError({'status': 'La teleconsulta debe estar en curso para finalizar.'})

    def update(self, instance, validated_data):
        for key in (
            'messaging_enabled',
            'client_case_notes',
            'date',
            'time',
            'pet_name',
            'pet_avatar_data_url',
            'status',
        ):
            if key in validated_data:
                setattr(instance, key, validated_data[key])
        next_status = validated_data.get('status')
        if next_status in (Appointment.Status.ACCEPTED, Appointment.Status.IN_PROGRESS, Appointment.Status.FINALIZED, Appointment.Status.CANCELLED):
            from django.utils import timezone
            now = timezone.now()
        if next_status == Appointment.Status.ACCEPTED and instance.accepted_at is None:
            instance.accepted_at = now
        if next_status == Appointment.Status.IN_PROGRESS and instance.started_at is None:
            instance.started_at = now
        if next_status == Appointment.Status.FINALIZED:
            instance.finalized_at = now
            instance.completed_at = now
        if next_status == Appointment.Status.CANCELLED and instance.cancelled_at is None:
            instance.cancelled_at = now
        instance.save()
        return instance

    def create(self, validated_data):
        return Appointment.objects.create(
            client=self.context['request'].user,
            status=Appointment.Status.PENDING,
            **validated_data,
        )


_APPOINTMENT_SUMMARY_FIELDS = [
    'id',
    'tipo',
    'client',
    'client_name',
    'veterinarian',
    'veterinarian_name',
    'service',
    'date',
    'time',
    'mode',
    'status',
    'surgery_room',
    'pet_name',
    'pet_avatar_data_url',
    'teleconsulta_link',
    'client_case_notes',
    'messaging_enabled',
    'is_surgery_approved',
    'created_at',
    'accepted_at',
    'expires_at',
    'cancelled_at',
    'completed_at',
    'started_at',
    'finalized_at',
    'medical_files_count',
]


class AppointmentSummarySerializer(serializers.ModelSerializer):
    """Listados sin mensajes ni archivos anidados (mas liviano)."""

    client_name = serializers.CharField(source='client.name', read_only=True)
    veterinarian_name = serializers.CharField(source='veterinarian.name', read_only=True)
    medical_files_count = serializers.IntegerField(source='file_count', read_only=True)
    tipo = serializers.SerializerMethodField()

    def get_tipo(self, obj):
        return 'teleconsulta' if obj.mode == Appointment.Mode.ONLINE else 'presencial'

    class Meta:
        model = Appointment
        fields = _APPOINTMENT_SUMMARY_FIELDS
        read_only_fields = _APPOINTMENT_SUMMARY_FIELDS


class AppointmentCreateSerializer(AppointmentSerializer):
    class Meta(AppointmentSerializer.Meta):
        fields = [
            'id',
            'veterinarian',
            'service',
            'date',
            'time',
            'mode',
            'surgery_room',
            'referral_file',
            'is_surgery_approved',
            'status',
            'expires_at',
            'pet_name',
            'pet_avatar_data_url',
            'teleconsulta_link',
        ]
        read_only_fields = ['id', 'status', 'expires_at', 'is_surgery_approved', 'teleconsulta_link']
