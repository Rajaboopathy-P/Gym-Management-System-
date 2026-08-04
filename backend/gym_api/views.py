import json
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Booking, UserProfile

@csrf_exempt
def register_user(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return JsonResponse({'error': 'Email and Password are required'}, status=400)
            
        if User.objects.filter(username=email).exists():
            return JsonResponse({'error': 'User with this email already exists'}, status=400)
            
        user = User.objects.create_user(username=email, email=email, password=password)
        
        # Log the user in immediately
        login(request, user)
        
        return JsonResponse({
            'success': True, 
            'email': user.email,
            'message': 'Account created and logged in successfully!'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def login_user(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
        
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return JsonResponse({'error': 'Email and Password are required'}, status=400)
            
        user = authenticate(username=email, password=password)
        
        if user is not None:
            login(request, user)
            return JsonResponse({
                'success': True, 
                'email': user.email,
                'message': 'Logged in successfully!'
            })
        else:
            return JsonResponse({'error': 'Invalid email or password'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def logout_user(request):
    logout(request)
    return JsonResponse({'success': True, 'message': 'Logged out successfully.'})

def user_status(request):
    if not request.user.is_authenticated:
        return JsonResponse({'isAuthenticated': False})
        
    user = request.user
    profile = user.profile
    
    # Get user's bookings
    bookings = Booking.objects.filter(user=user).order_by('-date')
    bookings_list = [{
        'id': b.id,
        'className': b.class_name,
        'date': b.date.strftime('%Y-%m-%d'),
        'attendee': b.name
    } for b in bookings]
    
    return JsonResponse({
        'isAuthenticated': True,
        'email': user.email,
        'tier': profile.membership_tier,
        'streak': profile.workout_streak,
        'bookings': bookings_list
    })

@csrf_exempt
def book_class(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
        
    try:
        data = json.loads(request.body)
        name = data.get('name')
        class_name = data.get('class')
        date = data.get('date')
        
        # If user is not authenticated, try implicit login / registration
        user = request.user
        if not user.is_authenticated:
            email = data.get('email')
            password = data.get('password')
            
            if not email:
                return JsonResponse({'error': 'Login required to book a spot.'}, status=401)
                
            # Check if user already exists
            existing_user = User.objects.filter(username=email).first()
            if existing_user:
                # Authenticate and login
                authenticated_user = authenticate(username=email, password=password)
                if authenticated_user:
                    login(request, authenticated_user)
                    user = authenticated_user
                else:
                    return JsonResponse({'error': 'This email is registered. Please enter the correct password.'}, status=400)
            else:
                # Create user
                if not password or len(password) < 3:
                    return JsonResponse({'error': 'Password is required to create a new account.'}, status=400)
                user = User.objects.create_user(username=email, email=email, password=password)
                login(request, user)
                
        # Create booking in database
        booking = Booking.objects.create(
            user=user,
            name=name,
            class_name=class_name,
            date=date
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Spot reserved successfully!',
            'booking': {
                'id': booking.id,
                'className': booking.class_name,
                'date': booking.date
            }
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def update_membership(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
        
    if not request.user.is_authenticated:
        # Check if email/password is supplied to create/authenticate guest
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            
            if email and password:
                existing_user = User.objects.filter(username=email).first()
                if existing_user:
                    authenticated_user = authenticate(username=email, password=password)
                    if authenticated_user:
                        login(request, authenticated_user)
                    else:
                        return JsonResponse({'error': 'Invalid credentials for existing email.'}, status=400)
                else:
                    user = User.objects.create_user(username=email, email=email, password=password)
                    login(request, user)
            else:
                return JsonResponse({'error': 'Login required before membership activation.'}, status=401)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    try:
        user = request.user
        profile = user.profile
        profile.membership_tier = 'Pro Member (Active)'
        profile.save()
        
        return JsonResponse({
            'success': True,
            'tier': profile.membership_tier,
            'message': 'Membership activated successfully!'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def increment_streak(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
        
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Login required to update streak.'}, status=401)
        
    try:
        user = request.user
        profile = user.profile
        profile.workout_streak += 1
        profile.save()
        
        return JsonResponse({
            'success': True,
            'streak': profile.workout_streak,
            'message': 'Workout logged successfully!'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
