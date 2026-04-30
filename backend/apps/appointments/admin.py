from django.contrib import admin

from .models import Appointment, Availability, MedicalFile, Message, SurgeryRoom


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'date', 'time', 'mode', 'status', 'client', 'veterinarian']
    list_filter = ['mode', 'status', 'date']
    search_fields = ['client__email', 'veterinarian__email', 'service__name']


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ['veterinarian', 'day_of_week', 'start_time', 'end_time', 'mode', 'is_active']
    list_filter = ['mode', 'is_active', 'day_of_week']


@admin.register(MedicalFile)
class MedicalFileAdmin(admin.ModelAdmin):
    list_display = ['id', 'appointment', 'uploaded_by', 'file_type', 'created_at']
    list_filter = ['file_type', 'created_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'appointment', 'sender', 'created_at', 'read_at']
    search_fields = ['sender__email', 'content']


@admin.register(SurgeryRoom)
class SurgeryRoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'address', 'is_active']
    list_filter = ['is_active']
