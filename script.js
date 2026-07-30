
        if (submitBtn) {
            submitBtn.textContent = 'Sending Booking...';"></circle>';
        icon.style.stroke = 'var(--accent)';
    } else {
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
