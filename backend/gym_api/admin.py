from django.contrib import admin
from .models import UserProfile, Booking


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'membership_tier',
        'workout_streak',
    )
    search_fields = (
        'user__username',
        'user__email',
    )


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'user',
        'class_name',
        'date',
        'created_at',
    )

    list_filter = (
        'class_name',
        'date',
    )

    search_fields = (
        'name',
        'user__username',
        'user__email',
        'class_name',
    )

    ordering = ('-date', '-created_at')
