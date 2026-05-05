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

    class Meta:
        model = Appointment
        fields = [
            'id',
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
            'created_at',
            'accepted_at',
            'expires_at',
            'cancelled_at',
            'completed_at',
            'medical_files',
            'messages',
        ]
        read_only_fields = [
            'id',
            'client',
            'client_name',
            'veterinarian_name',
            'status',
            'created_at',
            'accepted_at',
            'expires_at',
            'cancelled_at',
            'completed_at',
            'medical_files',
            'messages',
        ]

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
            if user.id in (instance.client_id, instance.veterinarian_id) and instance.status in (
                Appointment.Status.PENDING,
                Appointment.Status.ACCEPTED,
            ):
                allowed.add('date')
                allowed.add('time')
            disallowed = patch_keys - allowed
            if disallowed:
                raise serializers.ValidationError({
                    key: 'No puedes modificar este campo.' for key in disallowed
                })

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

    def update(self, instance, validated_data):
        for key in ('messaging_enabled', 'client_case_notes', 'date', 'time', 'pet_name'):
            if key in validated_data:
                setattr(instance, key, validated_data[key])
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
    'client_case_notes',
    'messaging_enabled',
    'is_surgery_approved',
    'created_at',
    'accepted_at',
    'expires_at',
    'cancelled_at',
    'completed_at',
    'medical_files_count',
]


class AppointmentSummarySerializer(serializers.ModelSerializer):
    """Listados sin mensajes ni archivos anidados (mas liviano)."""

    client_name = serializers.CharField(source='client.name', read_only=True)
    veterinarian_name = serializers.CharField(source='veterinarian.name', read_only=True)
    medical_files_count = serializers.IntegerField(source='file_count', read_only=True)

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
        ]
        read_only_fields = ['id', 'status', 'expires_at', 'is_surgery_approved']
