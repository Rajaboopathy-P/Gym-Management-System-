
        if (submitBtn) {
            submitBtn.textContent = 'Sending Booking...';
            submitBtn.disabled = true;
        }

        // Submit via FormSubmit API
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
                email: data.get('email'), // Submitter's email
                Name: data.get('name'),
                Class: data.get('class'),
                Date: data.get('date')
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success === "true") {
                if (msgEl) {
                    msgEl.style.color = '#4ade80';
                    msgEl.textContent = `Successfully booked! A confirmation email has been sent.`;
                }
                e.target.reset(); // clear form inputs
            } else {
                throw new Error("FormSubmit failed");
            }
        })
        .catch(error => {
            if (msgEl) {
                msgEl.style.color = '#eab308';
                msgEl.textContent = `Booking submitted! Note: Gym owner must activate the email receiver first.`;
            }
            console.error("Booking error:", error);
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.textContent = 'Reserve Spot';
                submitBtn.disabled = false;
            }
        });
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
    if (pModal && e.target === pModal) closePortal();
    if (fModal && e.target === fModal) closeForgot();
    if (lModal && e.target === lModal) window.closeLightbox();
});

/* ==========================================================================
   4. Authentication & User State
   ========================================================================== */

/**
 * Handles standard email/password user login
 */
window.loginUser = function(e) {
    e.preventDefault();
    const emailInput = document.getElementById('lemail');
    const passwordInput = document.getElementById('lpass');
    
    if (emailInput?.value && passwordInput?.value) {
        localStorage.setItem('gym_auth_status', 'true');
        localStorage.setItem('gym_user', emailInput.value);
        
        closePortal();
        updateAuthUI();
        setTimeout(() => alert(`Welcome back to Indharajith Fitness, ${emailInput.value}!`), 300);
    } else {
        alert('Please enter your email and password.');
    }
}

/**
 * Triggers a simulated Google OAuth login sequence
 */
window.simulateGoogleLogin = function() {
    const btn = document.getElementById('google-auth-btn');
    if (btn) btn.textContent = 'Connecting...';
    
    // Simulate OAuth popup logic
    let popup = window.open("", "Google Sign In", "width=500,height=600");
    if (popup) {
        popup.document.write(`
            <body style="font-family: sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#f8f9fa;">
                <h2>Sign in with Google</h2>
                <p>Authenticating Indharajith Fitness...</p>
            </body>
        `);
        
        // Mocking the redirect delay from OAuth server
        setTimeout(() => {
            popup.close();
            localStorage.setItem('gym_auth_status', 'true');
            localStorage.setItem('gym_user', 'user123@gmail.com (Google)');
            closePortal();
            updateAuthUI();
            
            if (btn) btn.innerHTML = `Continue with Google`;
            alert("Signed in with Google successfully!");
        }, 2000);
    } else {
        alert("Please allow popups to sign in with Google.");
        if (btn) btn.innerHTML = `Continue with Google`;
    }
}

/**
 * Clears user session and logs them out
 */
window.logoutUser = function() {
    localStorage.removeItem('gym_auth_status');
    localStorage.removeItem('gym_user');
    updateAuthUI();
    alert("Logged out successfully.");
}

/**
 * Reflects the authentication state across all application UI elements
 */
function updateAuthUI() {
    const isLoggedIn = localStorage.getItem('gym_auth_status') === 'true';
    const userEmail = localStorage.getItem('gym_user');

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
        if (isLoggedIn) {
            bookingPassGroup.style.display = 'none';
            document.getElementById('fbpass').removeAttribute('required');
            bEmail.value = userEmail || bEmail.value; 
        } else {
            bookingPassGroup.style.display = 'block';
            document.getElementById('fbpass').setAttribute('required', 'true');
        }
    }

    // 3. Membership Page: Adapt checkout form capabilities
    const memPassGroup = document.getElementById('mem-password-group');
    const memEmail = document.getElementById('mem-email');
    if (memPassGroup && memEmail) {
        if (isLoggedIn) {
            memPassGroup.style.display = 'none';
            memEmail.value = userEmail || memEmail.value; 
            memEmail.readOnly = true;
            memEmail.style.opacity = '0.7';
        } else {
            memPassGroup.style.display = 'block';
            memEmail.readOnly = false;
            memEmail.style.opacity = '1';
        }
    }
}

/**
 * Validates session integrity before pushing towards external payment gateways
 */
window.processMembershipPayment = function(e, url) {
    if (e) e.preventDefault();
    
    const isLoggedIn = localStorage.getItem('gym_auth_status') === 'true';
    const emailInput = document.getElementById('mem-email');
    const pwdInput = document.getElementById('mem-pass');
    
    // Explicit user creation if passing through checkout as guest
    if (!isLoggedIn) {
        if (!emailInput?.value || pwdInput?.value.length < 3) {
            alert("Please enter a valid Email and Password to create your account before continuing to payment.");
            return;
        }
        
        localStorage.setItem('gym_auth_status', 'true');
        localStorage.setItem('gym_user', emailInput.value);
        updateAuthUI();
        alert("Account Created successfully! Processing secure payment...");
    }
    
    // Process redirect simulation
    setTimeout(() => {
        if (url === 'netbanking') {
            alert('Redirecting to Netbanking Secure Gateway...');
        } else {
            window.open(url, '_blank');
        }
    }, 300);
}
