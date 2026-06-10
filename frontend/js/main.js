// GSAP & Lenis Initialization

let lenis;

function initSmoothScroll() {
    // Basic smooth scroll setup
    lenis = new window.Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
}

function showLoader(messages, onComplete, userName) {
    const overlay = document.createElement('div');
    overlay.className = 'loader-overlay';
    overlay.style.background = '#050505';

    let stepsHTML = '';
    messages.forEach((msg, idx) => {
        stepsHTML += `
            <div class="loader-step-card" id="loader-step-${idx}" style="background: #111; border: 1px solid #222; padding: 15px 20px; border-radius: 8px; display: flex; align-items: center; gap: 15px; opacity: 0.5; transition: all 0.3s;">
                <svg id="loader-icon-${idx}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #444;">
                    <circle cx="12" cy="12" r="10"></circle>
                </svg>
                <div style="color: #ccc; font-size: 0.95rem;">${msg}</div>
            </div>
        `;
    });

    const welcomeHtml = userName ? `<div style="color: #fff; font-size: 1.2rem; font-weight: 600; margin-bottom: 30px; letter-spacing: 1px;">Welcome, <span style="color: #00e5ff;">${userName}</span></div>` : '<div style="margin-bottom: 40px;"></div>';

    overlay.innerHTML = `
        <div class="loader-container" style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 450px;">
            <h1 style="color: #00e5ff; font-weight: 700; letter-spacing: 2px; font-size: 2.5rem; margin-bottom: 5px; text-shadow: 0 0 15px rgba(0, 229, 255, 0.4);">AETHON</h1>
            <div style="color: #888; font-size: 0.85rem; margin-bottom: ${userName ? '15px' : '40px'};">AI-Powered Database Control System</div>
            ${welcomeHtml}
            
            <div style="width: 100%; display: flex; flex-direction: column; gap: 10px; margin-bottom: 30px;">
                ${stepsHTML}
            </div>

            <div style="width: 100%; height: 4px; background: #222; border-radius: 2px; overflow: hidden; margin-bottom: 15px;">
                <div id="loaderProgress" style="height: 100%; width: 0%; background: linear-gradient(90deg, #00e5ff, #d946ef); border-radius: 2px; box-shadow: 0 0 10px rgba(0, 229, 255, 0.5);"></div>
            </div>
            <div style="color: #666; font-size: 0.75rem;">Preparing your workspace...</div>
        </div>
    `;

    document.body.appendChild(overlay);

    const progress = document.getElementById('loaderProgress');
    const totalDuration = messages.length * 1.2;

    const checkIcon = `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>`;
    const spinnerIcon = `<path d="M21 12a9 9 0 1 1-6.219-8.56"></path>`;

    let currentStep = -1;

    gsap.to(progress, {
        width: '100%',
        duration: totalDuration,
        ease: 'power1.inOut',
        onUpdate: function() {
            const ratio = this.progress();
            const stepIdx = Math.floor(ratio * messages.length);
            
            if (stepIdx !== currentStep && stepIdx < messages.length) {
                // Complete previous step
                if (currentStep >= 0) {
                    const prevCard = document.getElementById(`loader-step-${currentStep}`);
                    const prevIcon = document.getElementById(`loader-icon-${currentStep}`);
                    if (prevCard) {
                        prevCard.style.opacity = '1';
                        prevCard.style.borderColor = '#00e5ff';
                    }
                    if (prevIcon) {
                        prevIcon.innerHTML = checkIcon;
                        prevIcon.style.color = '#00e5ff';
                        gsap.killTweensOf(prevIcon);
                        gsap.set(prevIcon, { rotation: 0 });
                    }
                }

                currentStep = stepIdx;
                
                // Activate current step
                const currCard = document.getElementById(`loader-step-${currentStep}`);
                const currIcon = document.getElementById(`loader-icon-${currentStep}`);
                if (currCard) {
                    currCard.style.opacity = '1';
                    currCard.style.borderColor = '#333';
                }
                if (currIcon) {
                    currIcon.innerHTML = spinnerIcon;
                    currIcon.style.color = '#00e5ff';
                    gsap.to(currIcon, { rotation: 360, repeat: -1, ease: 'linear', duration: 1 });
                }
            }
        },
        onComplete: () => {
            // Complete final step
            if (currentStep >= 0) {
                const prevCard = document.getElementById(`loader-step-${currentStep}`);
                const prevIcon = document.getElementById(`loader-icon-${currentStep}`);
                if (prevCard) prevCard.style.borderColor = '#00e5ff';
                if (prevIcon) {
                    prevIcon.innerHTML = checkIcon;
                    gsap.killTweensOf(prevIcon);
                    gsap.set(prevIcon, { rotation: 0 });
                }
            }

            setTimeout(() => {
                gsap.to(overlay, {
                    opacity: 0,
                    duration: 0.5,
                    onComplete: () => {
                        overlay.remove();
                        if(onComplete) onComplete();
                    }
                });
            }, 500);
        }
    });
}

function initAuthGuard() {
    const user = localStorage.getItem('aethon_user');
    const isLogin = window.location.pathname.includes('login.html');
    const isIndex = window.location.pathname === '/' || window.location.pathname.includes('index.html');
    
    if (!user && !isLogin && !isIndex) {
        window.location.href = '/login.html';
    } else if (user && isLogin) {
        window.location.href = '/dashboard.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initAuthGuard();

    // Setup sidebar based on role
    const userStr = localStorage.getItem('aethon_user');
    if (userStr) {
        const user = JSON.parse(userStr);
        const nav = document.getElementById('sidebar-nav');
        if (nav) {
            nav.innerHTML = '';
            if (user.role === 'ADMIN') {
                nav.innerHTML = `
                    <a href="/dashboard.html">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> Dashboard
                    </a>
                    <a href="/ai-command.html?new=1">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> AI Command Center
                    </a>
                    <a href="/db-explorer.html?table=users">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg> Database Explorer
                    </a>
                    <a href="/audit-logs.html">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Audit Logs
                    </a>
                    <a href="/prompt-learning.html">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg> Prompt Learning Center
                    </a>
                    <a href="/profile.html">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Profile
                    </a>
                    <div style="margin-top: auto; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05);">
                        <a href="#" onclick="logout()" style="color: #ff5555; margin-top: 0;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Logout
                        </a>
                    </div>
                `;
                
                // Fetching tables logic removed since the sidebar dropdown is no longer used.
            } else {
                nav.innerHTML = `
                    <a href="/dashboard.html">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> Dashboard
                    </a>
                    <a href="/ai-command.html?new=1">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> AI Assistant (Read-Only)
                    </a>
                    <a href="/profile.html">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Profile
                    </a>
                    <div style="margin-top: auto; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05);">
                        <a href="#" onclick="logout()" style="color: #ff5555; margin-top: 0;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Logout
                        </a>
                    </div>
                `;
            }
            
            // Highlight active link
            const currentPath = window.location.pathname;
            const links = nav.querySelectorAll('a');
            links.forEach(link => {
                if (link.getAttribute('href') === currentPath) {
                    link.classList.add('active');
                }
            });
        }
    }
});

window.logout = function() {
    localStorage.removeItem('aethon_token');
    localStorage.removeItem('aethon_user');
    window.location.href = '/login.html';
};
