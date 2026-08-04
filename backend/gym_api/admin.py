from django.contrib import admin
from .models import UserProfile, Booking

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'membership_tier', 'workout_streak')
    search_fields = ('user__username', 'membership_tier')
    list_filter = ('membership_tier',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('name', 'class_name', 'date', 'user', 'created_at')
    search_fields = ('name', 'class_name', 'user__username')
    list_filter = ('class_name', 'date')
