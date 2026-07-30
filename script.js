/**
 * Indharajith Fitness - Main JavaScript File
 * Handles UI interactions, authentication state, class scheduling, and form bookings.
 */

/* ==========================================================================
   1. PWA (Progressive Web App) Setup
   ========================================================================== */
(async () => {
    // Dynamically create and inject a web app manifest for installation
    const manifest = {
        name: "Indharajith Fitness",
        short_name: "Fitness",
        display: "standalone",
        start_url: "./index.html",
        background_color: "#0b1224",
        theme_color: "#0f172a",
        icons: []
    };
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
    const manifestURL = URL.createObjectURL(blob);
    
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestURL;
    document.head.appendChild(link);
})();

/* ==========================================================================
   2. DOM Configuration & Event Listeners
   ========================================================================== */
const API_URL = "http://127.0.0.1:8000/api";

window.authState = {
    isAuthenticated: false,
    email: '',
    tier: 'Free Tier',
    streak: 5,
    bookings: []
};

// Fetch user authentication and profile status from Django REST API
async function fetchUserStatus() {
    try {
        const res = await fetch(`${API_URL}/user-status/`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
        });
        const data = await res.json();
        
        window.authState.isAuthenticated = data.isAuthenticated;
        if (data.isAuthenticated) {
            window.authState.email = data.email;
            window.authState.tier = data.tier;
            window.authState.streak = data.streak;
            window.authState.bookings = data.bookings;
        } else {
            window.authState.email = '';
            window.authState.tier = 'Free Tier';
            window.authState.streak = 5;
            window.authState.bookings = [];
        }
        updateAuthUI();
    } catch (e) {
        console.error("Error fetching auth status from Django:", e);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initMobileMenu();
    initSchedule();
    initBookingForm();
    initAutoRenewToggle();
    initFAQs();
    initBeforeAfterSlider();
    injectWhatsAppButton();
    fetchUserStatus(); // Fetch auth state from Django API and trigger updateAuthUI()
});

/**
 * Initializes the mobile hamburger menu UI
 */
function initMobileMenu() {
    const topNav = document.querySelector('.top-nav');
    const linksContainer = document.querySelector('.nav-links');
    
    if (topNav && linksContainer) {
        // Create hamburger button dynamically
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger-btn';
        hamburger.innerHTML = `
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        `;
        
        topNav.insertBefore(hamburger, linksContainer);

        hamburger.addEventListener('click', () => {
            linksContainer.classList.toggle('nav-active');
            hamburger.classList.toggle('is-open');
        });
    }
}

/**
 * Renders the live class schedule and updates it every minute
 */
function initSchedule() {
    const scheduleContainer = document.getElementById('schedule');
    if (!scheduleContainer) return;

    const classes = [
        { time: '06:00', name: 'HIIT Blast' },
        { time: '07:30', name: 'Strength & Conditioning' },
        { time: '10:00', name: 'Mobility & Core' },
        { time: '17:30', name: 'Spin Power' },
        { time: '19:00', name: 'Boxing Basics' }
    ];

    function renderSchedule() {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        scheduleContainer.innerHTML = '';
        let nextClassText = '';

        classes.forEach(c => {
            const [h, m] = c.time.split(':').map(Number);
            const startStr = h * 60 + m;
            const endStr = startStr + 60;
            const isLive = currentMinutes >= startStr && currentMinutes < endStr;
            
            // Determine the next upcoming class
            if (!nextClassText && currentMinutes < startStr) {
                nextClassText = `Next: ${c.name} at ${c.time}`;
            }

            // Formatting time
            const isPM = h >= 12;
            const hour12 = h % 12 || 12;
            const ampm = isPM ? 'PM' : 'AM';
            const minuteStr = m < 10 ? '0' + m : m;

            // Create schedule slot element
            const slot = document.createElement('div');
            slot.className = 'slot' + (isLive ? ' live' : '');
            slot.innerHTML = `
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="display: flex; flex-direction: column; align-items: center; width: 64px; background: rgba(255,255,255,0.04); padding: 8px 0; border-radius: 8px; border: 1px solid var(--border);">
                        <span style="font-size: 17px; font-weight: 800; color: ${isLive ? 'var(--accent)' : 'var(--text)'};">${hour12}:${minuteStr}</span>
                        <span style="font-size: 11px; font-weight: 700; color: var(--muted);">${ampm}</span>
                    </div>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 17px; font-weight: 700; color: ${isLive ? 'var(--text)' : 'var(--muted)'};">${c.name}</span>
                        <span style="font-size: 13px; color: var(--muted); margin-top:2px; font-weight: 400;"><span style="color:var(--accent);">●</span> Main Studio</span>
                    </div>
                </div>
                ${isLive ? '<span class="badge-live"><span style="display:block;width:8px;height:8px;background:var(--accent);border-radius:50%;box-shadow:0 0 8px var(--accent);"></span> Live Now</span>' : ''}
            `;
            scheduleContainer.appendChild(slot);
        });

        // Update the next class notice
        const nextClassEl = document.getElementById('next-class');
        if (nextClassEl) {
            nextClassEl.textContent = nextClassText || 'All sessions done for today. See you tomorrow!';
        }
    }

    renderSchedule(); 
    setInterval(renderSchedule, 60000); // re-render every minute
}

/**
 * Handles class booking submissions
 */
function initBookingForm() {
    const bookingForm = document.getElementById('booking-form');
    if (!bookingForm) return;

    bookingForm.addEventListener('submit', async e => {
        e.preventDefault();
        const data = new FormData(e.target);
        const msgEl = document.getElementById('booking-msg');
        const submitBtn = bookingForm.querySelector('button[type="submit"]');
        const isLoggedIn = window.authState.isAuthenticated;

        if (submitBtn) {
            submitBtn.textContent = 'Sending Booking...';
            submitBtn.disabled = true;
        }

        const payload = {
            name: data.get('name'),
            class: data.get('class'),
            date: data.get('date')
        };

        if (!isLoggedIn) {
            payload.email = data.get('email');
            payload.password = data.get('password');
        }

        try {
            // 1. Submit to Django local database backend
            const res = await fetch(`${API_URL}/book-class/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });
            const result = await res.json();
            
            if (result.success) {
                if (msgEl) {
                    msgEl.style.color = '#4ade80';
                    msgEl.textContent = `Successfully booked! Registered and secured in database.`;
                }
                e.target.reset();
                await fetchUserStatus(); // Refresh dashboard bookings lists
                
                // 2. Submit to FormSubmit.co for email notifications (async background, ignore errors)
                fetch("https://formsubmit.co/ajax/rajaboopathy825@gmail.com", {
                    method: "POST",
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        _subject: "New Class Booking: " + data.get('class'),
                        _template: "box",
                        _autoresponse: "Hi " + data.get('name') + ", \n\nYour spot for " + data.get('class') + " on " + data.get('date') + " is secured! We look forward to seeing you at Indharajith Fitness.",
                        email: data.get('email') || window.authState.email,
                        Name: data.get('name'),
                        Class: data.get('class'),
                        Date: data.get('date')
                    })
                }).catch(e => console.warn("FormSubmit notice skipped:", e));
                
            } else {
                if (msgEl) {
                    msgEl.style.color = '#f87171';
                    msgEl.textContent = result.error || "Booking failed.";
                }
            }
        } catch (error) {
            console.error("Booking error:", error);
            if (msgEl) {
                msgEl.style.color = '#eab308';
                msgEl.textContent = `Server connection error. Make sure the Django backend is running.`;
            }
        } finally {
            if (submitBtn) {
                submitBtn.textContent = 'Reserve Spot';
                submitBtn.disabled = false;
            }
        }
    });
}

/**
 * Handles membership auto-renewal toggle messages
 */
function initAutoRenewToggle() {
    const autoRenew = document.getElementById('auto-renew');
    if (!autoRenew) return;

    autoRenew.addEventListener('change', e => {
        const remindersEl = document.getElementById('reminders');
        const wantsReminders = remindersEl ? remindersEl.checked : false;
        const noteEl = document.getElementById('renew-note');
        
        if (noteEl) {
            noteEl.style.display = 'block';
            noteEl.textContent = e.target.checked 
                ? `Auto-renew enabled. ${wantsReminders ? 'We will send reminders 3 days before.' : ''}` 
                : 'Auto-renew off.';
        }
    });
}

/* ==========================================================================
   3. Global Helper Functions (UI toggles & Modals)
   ========================================================================== */

/**
 * Toggles a password input between text and password types
 */
window.togglePassword = function(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
        icon.style.stroke = 'var(--accent)';
    } else {
        input.type = 'password';
        icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
        icon.style.stroke = 'currentColor';
    }
}

// Portal Modals
window.openPortal = () => toggleModal('portal-modal', true);
window.closePortal = () => toggleModal('portal-modal', false);
window.openForgotModal = () => { closePortal(); toggleModal('forgot-modal', true); };
window.closeForgot = () => toggleModal('forgot-modal', false);
window.openLightbox = (src) => {
    const img = document.getElementById('lightbox-img');
    if (img) img.src = src;
    toggleModal('lightbox-modal', true);
};
window.closeLightbox = () => toggleModal('lightbox-modal', false);

/**
 * Reusable modal toggler function
 */
function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    if (show) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    } else {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

// Close modals when clicking outside their content boxes
document.addEventListener('click', e => {
    const pModal = document.getElementById('portal-modal');
    const fModal = document.getElementById('forgot-modal');
    const lModal = document.getElementById('lightbox-modal');
    const gModal = document.getElementById('google-select-modal');
    if (pModal && e.target === pModal) closePortal();
    if (fModal && e.target === fModal) closeForgot();
    if (lModal && e.target === lModal) window.closeLightbox();
    if (gModal && e.target === gModal) window.closeGoogleSelect();
});

/* ==========================================================================
   4. Authentication & User State
   ========================================================================== */

/**
 * Handles standard email/password user login
 */
window.loginUser = async function(e) {
    e.preventDefault();
    const emailInput = document.getElementById('lemail');
    const passwordInput = document.getElementById('lpass');
    
    if (!emailInput?.value || !passwordInput?.value) {
        alert('Please enter your email and password.');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: emailInput.value,
                password: passwordInput.value
            }),
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            closePortal();
            await fetchUserStatus();
            alert(`Welcome back to Indharajith Fitness, ${emailInput.value}!`);
        } else {
            alert(data.error || 'Login failed.');
        }
    } catch (error) {
        console.error("Login error:", error);
        alert('An error occurred during login. Make sure the backend server is running.');
    }
}

/**
 * Opens the simulated Google Account selector modal
 */
window.simulateGoogleLogin = function() {
    closePortal(); // Close the standard login modal first
    toggleModal('google-select-modal', true); // Open the Google chooser modal
}

window.closeGoogleSelect = () => toggleModal('google-select-modal', false);

/**
 * Registers/Authenticates the user using the selected Google Account email
 */
window.selectGoogleAccount = async function(email) {
    window.closeGoogleSelect();
    const btn = document.getElementById('google-auth-btn');
    if (btn) btn.textContent = 'Connecting...';
    
    try {
        const password = 'google_oauth_boopathy_pass_123'; // Static password for mock OAuth
        
        // 1. Try to register user
        const res = await fetch(`${API_URL}/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        let data = await res.json();
        
        // 2. If user already exists, authenticate and login instead
        if (!data.success && data.error && data.error.includes("already exists")) {
            const loginRes = await fetch(`${API_URL}/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            data = await loginRes.json();
        }
        
        if (data.success) {
            await fetchUserStatus();
            alert(`Logged in with Google successfully as ${email}!`);
        } else {
            alert(data.error || "Google Login failed.");
        }
    } catch (err) {
        console.error("Google login authentication error:", err);
        alert("Connection to Django server failed.");
    } finally {
        if (btn) btn.innerHTML = `Continue with Google`;
    }
}

/**
 * Prompts user to input a custom Google account email
 */
window.promptCustomGoogleAccount = function() {
    const email = prompt("Enter your Google Email Address:");
    if (email && email.includes('@')) {
        window.selectGoogleAccount(email);
    } else if (email) {
        alert("Please enter a valid Google email address.");
    }
}

/**
 * Clears user session and logs them out
 */
window.logoutUser = async function() {
    try {
        const res = await fetch(`${API_URL}/logout/`, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            await fetchUserStatus();
            alert("Logged out successfully.");
        }
    } catch (e) {
        console.error("Logout error:", e);
    }
}

/**
 * Sends check-in request to Django backend to increment streak
 */
window.logWorkout = async function() {
    const btn = document.getElementById('log-workout-btn');
    if (btn) {
        btn.textContent = 'Logging...';
        btn.disabled = true;
    }
    
    try {
        const res = await fetch(`${API_URL}/increment-streak/`, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
        });
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('dash-streak').textContent = `${data.streak} Days`;
            alert("Great job! Today's workout logged successfully. Streak updated!");
        } else {
            alert(data.error || "Could not log workout.");
        }
    } catch (err) {
        console.error("Log workout error:", err);
        alert("Connection to Django server failed.");
    } finally {
        if (btn) {
            btn.textContent = "Log Today's Workout";
            btn.disabled = false;
        }
    }
}

/**
 * Reflects the authentication state across all application UI elements
 */
function updateAuthUI() {
    const isLoggedIn = window.authState.isAuthenticated;
    const userEmail = window.authState.email;

    // 1. Home Page: Update Member Authentication Card
    const authCard = document.getElementById('member-auth-card');
    if (authCard) {
        const title = authCard.querySelector('h3');
        const desc = authCard.querySelector('p.small');
        const actionBtn = document.getElementById('auth-main-btn');

        if (isLoggedIn) {
            title.textContent = "Welcome Back!";
            desc.textContent = "Your profile is active. Subscription is running.";
            actionBtn.textContent = "Logout";
            actionBtn.onclick = window.logoutUser;
            actionBtn.style.background = "rgba(255,255,255,0.05)";
            actionBtn.style.color = "var(--text)";
            actionBtn.style.boxShadow = "none";
        } else {
            title.textContent = "Member Login";
            desc.textContent = "Manage subscriptions, payments, bookings.";
            actionBtn.textContent = "Member Portal";
            actionBtn.onclick = window.openPortal;
            actionBtn.style.background = "linear-gradient(135deg, var(--accent), var(--accent2))";
            actionBtn.style.color = "#fff";
            actionBtn.style.boxShadow = "0 4px 15px rgba(249, 115, 22, 0.3)";
        }
    }

    // 2. Classes Page: Toggle password field during booking operations
    const bookingPassGroup = document.getElementById('booking-password-group');
    const bEmail = document.getElementById('femail');
    if (bookingPassGroup && bEmail) {
        const fbPass = document.getElementById('fbpass');
        if (isLoggedIn) {
            bookingPassGroup.style.display = 'none';
            if (fbPass) fbPass.removeAttribute('required');
            bEmail.value = userEmail || bEmail.value; 
        } else {
            bookingPassGroup.style.display = 'block';
            if (fbPass) fbPass.setAttribute('required', 'true');
        }
    }

    // 3. Membership Page: Adapt checkout form capabilities
    const memPassGroup = document.getElementById('mem-password-group');
    const memEmail = document.getElementById('mem-email');
    if (memPassGroup && memEmail) {
        const memPass = document.getElementById('mem-pass');
        if (isLoggedIn) {
            memPassGroup.style.display = 'none';
            if (memPass) memPass.removeAttribute('required');
            memEmail.value = userEmail || memEmail.value; 
            memEmail.readOnly = true;
            memEmail.style.opacity = '0.7';
        } else {
            memPassGroup.style.display = 'block';
            if (memPass) memPass.setAttribute('required', 'true');
            memEmail.readOnly = false;
            memEmail.style.opacity = '1';
        }
    }

    // 4. Portal Modal view toggling & Dashboard Rendering
    const loginView = document.getElementById('portal-login-view');
    const dashboardView = document.getElementById('portal-dashboard-view');
    if (loginView && dashboardView) {
        if (isLoggedIn) {
            loginView.classList.add('d-none');
            dashboardView.classList.remove('d-none');
            
            // Update dashboard text
            const welcomeText = document.getElementById('dash-welcome');
            const avatar = document.getElementById('dash-avatar');
            const tierBadge = document.getElementById('dash-tier');
            const streakVal = document.getElementById('dash-streak');
            
            if (welcomeText && userEmail) welcomeText.textContent = `Welcome, ${userEmail.split('@')[0]}!`;
            if (avatar && userEmail) avatar.textContent = userEmail.substring(0, 2).toUpperCase();
            if (tierBadge) tierBadge.textContent = window.authState.tier;
            if (streakVal) streakVal.textContent = `${window.authState.streak} Days`;
            
            // Render booked classes dynamically
            const bookingsContainer = document.getElementById('dash-bookings');
            if (bookingsContainer) {
                const userBookings = window.authState.bookings;
                
                if (userBookings.length > 0) {
                    bookingsContainer.innerHTML = '';
                    userBookings.forEach(b => {
                        const div = document.createElement('div');
                        div.className = 'dash-booking-item';
                        div.innerHTML = `
                            <div class="dash-booking-details">
                                <span class="dash-booking-name">${b.className}</span>
                                <span class="dash-booking-date">Date: ${b.date} | Attendee: ${b.attendee}</span>
                            </div>
                            <span class="badge badge-success" style="margin:0;">Confirmed</span>
                        `;
                        bookingsContainer.appendChild(div);
                    });
                } else {
                    bookingsContainer.innerHTML = `
                        <p class="small text-muted">No classes booked yet. Go to <a href="classes.html" class="link-accent">Classes</a> to reserve your spot!</p>
                    `;
                }
            }
        } else {
            loginView.classList.remove('d-none');
            dashboardView.classList.add('d-none');
        }
    }
}

/**
 * Validates session integrity before pushing towards external payment gateways
 */
window.processMembershipPayment = async function(e) {
    if (e) e.preventDefault();
    
    const isLoggedIn = window.authState.isAuthenticated;
    const emailInput = document.getElementById('mem-email');
    const pwdInput = document.getElementById('mem-pass');
    
    const payload = {};
    if (!isLoggedIn) {
        if (!emailInput?.value || pwdInput?.value.length < 3) {
            alert("Please enter a valid Email and Password to create your account before continuing to payment.");
            return;
        }
        payload.email = emailInput.value;
        payload.password = pwdInput.value;
    }
    
    // Determine payment gateway redirect URL from selected radio option
    let url = 'https://pay.google.com/';
    const selectedPay = document.querySelector('input[name="payment"]:checked');
    if (selectedPay) {
        if (selectedPay.id === 'pay-paytm') {
            url = 'https://paytm.com/';
        } else if (selectedPay.id === 'pay-netbank') {
            url = 'netbanking';
        }
    }
    
    try {
        const res = await fetch(`${API_URL}/update-membership/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        const result = await res.json();
        
        if (result.success) {
            await fetchUserStatus();
            alert("Account verified and membership tier updated in MySQL database!");
            
            // Process redirect simulation
            setTimeout(() => {
                if (url === 'netbanking') {
                    alert('Redirecting to Netbanking Secure Gateway...');
                } else {
                    window.open(url, '_blank');
                }
            }, 300);
        } else {
            alert(result.error || "Membership activation failed.");
        }
    } catch (err) {
        console.error("Payment registration error:", err);
        alert("Connection to Django server failed. Check if Django backend is running.");
    }
}

/**
 * Setup collapsible FAQ accordions
 */
function initFAQs() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.parentElement;
            const isActive = item.classList.contains('active');
            
            // Collapse other active items
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

/**
 * Setup Before/After Drag Slider
 */
function initBeforeAfterSlider() {
    const slider = document.getElementById('transform-slider');
    if (!slider) return;
    
    const resizeContainer = slider.querySelector('.slider-resize-container');
    const beforeImg = slider.querySelector('.before-image');
    const handle = slider.querySelector('.slider-handle');
    
    let active = false;
    
    // Ensure the cropped image matches the exact width of the slider container
    const syncImageWidth = () => {
        if (beforeImg) {
            beforeImg.style.width = `${slider.offsetWidth}px`;
        }
    };
    
    syncImageWidth();
    window.addEventListener('resize', syncImageWidth);
    
    const slideMove = (clientX) => {
        const rect = slider.getBoundingClientRect();
        let position = ((clientX - rect.left) / rect.width) * 100;
        
        if (position < 0) position = 0;
        if (position > 100) position = 100;
        
        resizeContainer.style.width = `${position}%`;
        handle.style.left = `${position}%`;
    };
    
    // Desktop mouse events
    slider.addEventListener('mousedown', () => { active = true; });
    window.addEventListener('mouseup', () => { active = false; });
    window.addEventListener('mousemove', (e) => {
        if (!active) return;
        slideMove(e.clientX);
    });
    
    // Mobile touch events
    slider.addEventListener('touchstart', (e) => { 
        active = true; 
    }, { passive: true });
    
    window.addEventListener('touchend', () => { active = false; });
    
    slider.addEventListener('touchmove', (e) => {
        if (!active) return;
        slideMove(e.touches[0].clientX);
        if (e.cancelable) e.preventDefault(); // Stop mobile vertical page scroll when actively dragging slider
    }, { passive: false });
    
    // Handle clicking directly on the slider
    slider.addEventListener('click', (e) => {
        slideMove(e.clientX);
    });
}

/**
 * Inject the Floating WhatsApp button globally
 */
function injectWhatsAppButton() {
    if (document.querySelector('.whatsapp-float')) return; // already injected
    
    const waButton = document.createElement('a');
    waButton.href = 'https://wa.me/919442742982';
    waButton.target = '_blank';
    waButton.className = 'whatsapp-float';
    waButton.setAttribute('aria-label', 'Chat on WhatsApp');
    waButton.innerHTML = `
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966C16.49 1.975 14.021.954 11.998.954 6.56.954 2.136 5.325 2.133 10.756c-.001 1.677.452 3.31 1.311 4.757l-.993 3.624 3.725-.976-.129-.121zm12.338-7.902c-.329-.165-1.95-.963-2.253-1.074-.303-.11-.524-.165-.745.165-.22.33-.852 1.074-1.044 1.293-.191.22-.383.247-.712.082-.329-.165-1.389-.512-2.646-1.633-.978-.872-1.637-1.95-1.829-2.28-.191-.33-.02-.508.145-.671.149-.147.33-.385.495-.578.165-.192.22-.33.33-.55.11-.22.055-.412-.028-.577-.082-.165-.745-1.792-1.02-2.457-.268-.646-.541-.559-.745-.57-.192-.01-.412-.011-.632-.011-.22 0-.577.082-.88.413-.302.33-1.155 1.127-1.155 2.748 0 1.62 1.183 3.19 1.348 3.41.165.22 2.328 3.555 5.639 4.98.787.34 1.4.542 1.88.697.79.25 1.512.215 2.08.13.634-.094 1.95-.798 2.225-1.568.275-.77.275-1.43.193-1.568-.083-.138-.303-.22-.632-.385z"/>
        </svg>
    `;
    document.body.appendChild(waButton);
}
