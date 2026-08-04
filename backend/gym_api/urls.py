from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('user-status/', views.user_status, name='user-status'),
    path('book-class/', views.book_class, name='book-class'),
    path('update-membership/', views.update_membership, name='update-membership'),
    path('increment-streak/', views.increment_streak, name='increment-streak'),
]
