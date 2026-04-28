from rest_framework import serializers

try:
    from .models import Service
except ImportError:  # pragma: no cover
    Service = None


if Service is not None:
    class ServiceSerializer(serializers.ModelSerializer):
        class Meta:
            model = Service
            fields = '__all__'
else:
    class ServiceSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=False)
        name = serializers.CharField(max_length=255)
        duration_minutes = serializers.IntegerField()
        modality = serializers.CharField(max_length=50)
