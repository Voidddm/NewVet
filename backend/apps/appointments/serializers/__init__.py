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

    class Meta:
        model = Appointment
        fields = [
            'id',
            'client',
            'veterinarian',
            'service',
            'date',
            'time',
            'mode',
            'status',
            'surgery_room',
            'referral_file',
            'is_surgery_approved',
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

    def create(self, validated_data):
        return Appointment.objects.create(
            client=self.context['request'].user,
            status=Appointment.Status.PENDING,
            **validated_data,
        )


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
        ]
        read_only_fields = ['id', 'status', 'expires_at', 'is_surgery_approved']
