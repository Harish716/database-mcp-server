const fs = require('fs');
const path = require('path');
const dir = './frontend';

const oldStr = `<div id="loading-screen">
    <div class="loader-brand">
        <div style="font-size: 3rem; color: var(--neon-cyan); filter: drop-shadow(0 0 10px rgba(0,243,255,0.5));">⬢</div>
        <div>AETHON</div>
        <div class="loader-subtitle">Smart Attendance</div>
    </div>
    <div class="progress-container">
        <div class="progress-bar" id="progress-bar"></div>
    </div>
</div>`;
const newStr = '<div id="loading-screen"><div class="loader"></div></div>';

['teacher-login.html', 'student-login.html'].forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    if (content.includes(oldStr)) {
        content = content.replace(oldStr, newStr);
        fs.writeFileSync(path.join(dir, file), content);
        console.log('Reverted ' + file);
    }
});
