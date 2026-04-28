from rest_framework import serializers

try:
    from .models import Pet
except ImportError:  # pragma: no cover
    Pet = None


if Pet is not None:
    class PetSerializer(serializers.ModelSerializer):
        class Meta:
            model = Pet
            fields = '__all__'
else:
    class PetSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=False)
        name = serializers.CharField(max_length=255)
        species = serializers.CharField(max_length=100)
        owner = serializers.IntegerField()
