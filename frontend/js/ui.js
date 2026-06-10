// Simulated Progress Bar Loading Screen
window.addEventListener('load', () => {
    const loader = document.getElementById('loading-screen');
    const progressBar = document.getElementById('progress-bar');
    
    if (loader && progressBar) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15 + 5; // Random jump between 5% and 20%
            if (progress > 100) progress = 100;
            
            progressBar.style.width = `${progress}%`;
            
            if (progress === 100) {
                clearInterval(interval);
                // Wait a tiny bit at 100% then slide up
                setTimeout(() => {
                    loader.classList.add('slide-up-exit');
                    setTimeout(() => {
                        loader.style.display = 'none';
                    }, 800); // Matches CSS transition duration
                }, 300);
            }
        }, 80); // Update every 80ms
    } else if (loader) {
        // Fallback if no progress bar
        loader.classList.add('slide-up-exit');
        setTimeout(() => { loader.style.display = 'none'; }, 800);
    }
});

// Toast Notification System
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✅ ' : '❌ ';
    toast.innerHTML = `${icon} ${message}`;

    container.appendChild(toast);

    // Remove toast after animation finishes
    setTimeout(() => {
        if(container.contains(toast)) {
            container.removeChild(toast);
        }
    }, 3500);
}

// Animate numbers counting up
function animateValue(id, start, end, duration, suffix = '') {
    const obj = document.getElementById(id);
    if (!obj) return;
    
    // Ensure end is a valid number
    const parsedEnd = parseFloat(end);
    if(isNaN(parsedEnd)) {
        obj.innerHTML = end + suffix;
        return;
    }

    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Easing function: easeOutQuart
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        
        const current = start + easeProgress * (parsedEnd - start);
        
        // Format based on integer vs float
        if(Number.isInteger(parsedEnd)) {
            obj.innerHTML = Math.floor(current) + suffix;
        } else {
            obj.innerHTML = current.toFixed(2) + suffix;
        }

        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = parsedEnd + suffix;
        }
    };
    window.requestAnimationFrame(step);
}
