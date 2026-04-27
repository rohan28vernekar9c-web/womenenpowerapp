// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyAuHnd-CtqEJ3XrwAmWDcrVuMLGnlB42Dk",
    authDomain: "tarini-9ff23.firebaseapp.com",
    projectId: "tarini-9ff23",
    storageBucket: "tarini-9ff23.firebasestorage.app",
    messagingSenderId: "913663967260",
    appId: "1:913663967260:web:42f163262705f52a28dfd9",
    measurementId: "G-HLWD3CDYGH"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// List of screens that should hide the bottom navigation
const screensWithoutNav = ['login', 'notifications', 'ai-assistant', 'post-product', 'product-detail', 'edit-profile', 'job-detail', 'job-apply', 'skill-categories', 'market-categories', 'all-companies', 'company-profile'];
// Screens that show the nav but don't have a matching nav tab (no active highlight needed)
const mainNavScreens = ['dashboard', 'jobs', 'skills', 'shop', 'profile'];
const _navStack = [];

function navigateTo(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) {
        // Track nav history for back navigation
        const currentActive = document.querySelector('.screen.active');
        if (currentActive) {
            const currentId = currentActive.id.replace('screen-', '');
            if (currentId !== screenId) _navStack.push(currentId);
        }
        targetScreen.classList.add('active');
        updateBottomNav(screenId);
        if (screenId === 'profile') loadProfileScreen();
        if (screenId === 'dashboard') { loadDashboardEarnings(); }
        if (screenId === 'notifications') loadNotificationsScreen();
        if (screenId === 'jobs') initJobsPage();
        if (screenId === 'applications') loadApplicationsScreen();
        if (screenId === 'skills') initSkillsPage();
        if (screenId === 'shop') initMarketplace();
        if (screenId === 'my-shop') initMyShop();
        if (screenId === 'cart') renderCart();
        if (screenId === 'rewards') initRewardsScreen();
        if (screenId === 'all-companies') renderAllCompanies();
        if (screenId === 'company-profile') renderCompanyProfile();
        if (screenId === 'co-own-profile') loadCompanyProfile();
    } else {
        console.error(`Screen 'screen-${screenId}' not found.`);
    }
}
window.navigateTo = navigateTo;

function goBack() {
    window.history.back();
}
window.goBack = goBack;

function navigateToWithOutHistory(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) {
        targetScreen.classList.add('active');
        updateBottomNav(screenId);
        if (screenId === 'profile') loadProfileScreen();
        if (screenId === 'dashboard') { loadDashboardEarnings(); }
        if (screenId === 'notifications') loadNotificationsScreen();
        if (screenId === 'jobs') initJobsPage();
        if (screenId === 'applications') loadApplicationsScreen();
        if (screenId === 'skills') initSkillsPage();
        if (screenId === 'shop') initMarketplace();
        if (screenId === 'my-shop') initMyShop();
        if (screenId === 'cart') renderCart();
        if (screenId === 'rewards') initRewardsScreen();
    }
}

function updateBottomNav(screenId) {
    const role = _currentRole();
    const bottomNav = document.getElementById('bottom-nav');
    const companyNav = document.getElementById('company-bottom-nav');
    const globalHeader = document.getElementById('global-header');

    if (role === 'company') {
        // Company users: always hide women nav & header; company nav visibility
        // is managed by companyNavTo — just ensure women nav stays hidden
        if (bottomNav) bottomNav.classList.add('hidden');
        if (globalHeader) globalHeader.classList.add('hidden');
        return;
    }

    // Women / default role
    if (companyNav) companyNav.classList.add('hidden');

    if (screensWithoutNav.includes(screenId)) {
        if (bottomNav) bottomNav.classList.add('hidden');
        if (globalHeader) globalHeader.classList.add('hidden');
    } else {
        if (bottomNav) bottomNav.classList.remove('hidden');
        if (globalHeader) globalHeader.classList.remove('hidden');
    }

    // Update active state on nav items
    const navTargetMap = {
        'my-shop': 'shop', 'cart': 'shop', 'market-categories': 'shop',
        'applications': 'jobs', 'job-detail': 'jobs', 'job-apply': 'jobs',
        'skill-categories': 'skills',
        'notifications': 'dashboard', 'ai-assistant': 'dashboard', 'rewards': 'dashboard',
        'edit-profile': 'profile',
    };
    const activeTarget = navTargetMap[screenId] || screenId;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'scale-110');
        item.classList.add('text-slate-400', 'dark:text-slate-500');
        const icon = item.querySelector('.nav-icon');
        if (icon) icon.style.fontVariationSettings = "'FILL' 0";
        if (item.getAttribute('data-target') === activeTarget) {
            item.classList.remove('text-slate-400', 'dark:text-slate-500');
            item.classList.add('text-indigo-600', 'dark:text-indigo-400', 'scale-110');
            if (icon) icon.style.fontVariationSettings = "'FILL' 1";
        }
    });
}

function goToLogin() {
    toggleAuthMode('login');
    navigateTo('login');
}
window.goToLogin = goToLogin;

function goToSignup() {
    toggleAuthMode('register');
    navigateTo('login');
}
window.goToSignup = goToSignup;

// --- PROFILE PROGRESS ---

function computeProfileProgress() {
    const d = getProfileData();
    const fields = [
        !!d.avatar,
        !!(d.name && d.name.trim()),
        !!(d.bio && d.bio.trim()),
        !!(d.location && d.location.trim()),
        !!(d.skills && d.skills.trim()),
        !!(d.title && d.title.trim()),
        !!(d.website && d.website.trim()),
        !!(d.resumeName),
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
}

function updateProfileProgressUI() {
    const pct = computeProfileProgress();
    const bar = document.getElementById('profile-progress-bar');
    const label = document.getElementById('profile-progress-label');
    const cta = document.getElementById('profile-progress-cta');
    const profileCard = document.getElementById('dash-profile-card');
    const notifCard = document.getElementById('dash-notif-card');
    if (!bar || !label) return;
    bar.style.width = pct + '%';
    if (pct >= 100) {
        label.textContent = 'Profile Completed \u2714';
        label.style.color = '#276749';
        if (cta) cta.style.display = 'none';
        if (profileCard && notifCard && !notifCard.classList.contains('notif-shown')) {
            notifCard.classList.add('notif-shown');
            profileCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            profileCard.style.opacity = '0';
            profileCard.style.transform = 'scale(0.95)';
            setTimeout(() => {
                profileCard.classList.add('hidden');
                notifCard.classList.remove('hidden');
                notifCard.style.opacity = '0';
                notifCard.style.transform = 'scale(0.95)';
                requestAnimationFrame(() => {
                    notifCard.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
                    notifCard.style.opacity = '1';
                    notifCard.style.transform = 'scale(1)';
                });
            }, 300);
        } else if (profileCard && notifCard) {
            profileCard.classList.add('hidden');
            notifCard.classList.remove('hidden');
        }
        refreshNotifCard();
    } else {
        label.textContent = pct + '% Complete';
        label.style.color = '';
        if (cta) cta.style.display = '';
        if (profileCard) { profileCard.classList.remove('hidden'); profileCard.style.opacity = '1'; profileCard.style.transform = ''; }
        if (notifCard) { notifCard.classList.add('hidden'); notifCard.classList.remove('notif-shown'); }
    }
}

// --- HEADER AVATAR ---

function updateHeaderAvatar() {
    const d = getProfileData();
    const img = document.getElementById('header-avatar-img');
    const icon = document.getElementById('header-avatar-icon');
    if (!img || !icon) return;
    if (d.avatar) {
        img.src = d.avatar;
        img.classList.remove('hidden');
        icon.classList.add('hidden');
    } else {
        img.classList.add('hidden');
        icon.classList.remove('hidden');
    }
}

// --- NOTIFICATIONS ---

const _NOTIF_KEY = () => { const u = auth.currentUser; return u ? `tarini_notifications_${u.uid}` : 'tarini_notifications_guest'; };

function getNotifications() {
    return JSON.parse(localStorage.getItem(_NOTIF_KEY()) || '[]');
}

function saveNotifications(list) {
    localStorage.setItem(_NOTIF_KEY(), JSON.stringify(list));
}

function addNotification(type, title, description) {
    const list = getNotifications();
    list.unshift({ id: Date.now(), type, title, description, time: new Date().toISOString(), read: false });
    saveNotifications(list.slice(0, 50));
    refreshNotifCard();
}
window.addNotification = addNotification;

function refreshNotifCard() {
    const list = getNotifications();
    const unread = list.filter(n => !n.read);
    const countEl = document.getElementById('dash-notif-count');
    const previewEl = document.getElementById('dash-notif-preview');
    if (countEl) countEl.textContent = unread.length;
    if (previewEl) previewEl.textContent = unread.length > 0 ? unread[0].title : "You're all caught up!";
}

function loadNotificationsScreen() {
    const container = document.getElementById('notifications-list');
    if (!container) return;
    const list = getNotifications();
    if (list.length === 0) {
        container.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px 0;text-align:center">
                <div style="width:64px;height:64px;border-radius:50%;background:rgba(77,65,223,0.10);display:flex;align-items:center;justify-content:center;margin-bottom:16px">
                    <span class="material-symbols-outlined" style="font-size:32px;color:#4d41df;font-variation-settings:'FILL' 1">notifications_none</span>
                </div>
                <p style="font-size:15px;font-weight:600;color:#1b1b24">No notifications yet</p>
                <p style="font-size:13px;color:#777587;margin-top:4px">We'll notify you about jobs, orders, and updates</p>
            </div>`;
        return;
    }
    const _icon = { job: 'work', application: 'assignment', order: 'shopping_bag', system: 'info' };
    const _color = { job: '#4d41df', application: '#875041', order: '#5c51a0', system: '#777587' };
    const _bg = { job: 'rgba(77,65,223,0.10)', application: 'rgba(135,80,65,0.10)', order: 'rgba(92,81,160,0.10)', system: 'rgba(119,117,135,0.10)' };
    container.innerHTML = list.map(n => {
        const ic = _icon[n.type] || 'notifications';
        const col = _color[n.type] || '#4d41df';
        const bg = _bg[n.type] || 'rgba(77,65,223,0.10)';
        return `
        <div onclick="markNotifRead(${n.id})" style="display:flex;align-items:flex-start;gap:12px;padding:16px;border-radius:18px;cursor:pointer;background:${n.read ? '#ffffff' : 'rgba(77,65,223,0.04)'};border:1px solid ${n.read ? '#eae6f3' : 'rgba(77,65,223,0.15)'};transition:transform 0.15s" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform=''" ontouchstart="this.style.transform='scale(0.98)'" ontouchend="this.style.transform=''">
            <div style="width:40px;height:40px;border-radius:12px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span class="material-symbols-outlined" style="font-size:20px;color:${col};font-variation-settings:'FILL' 1">${ic}</span>
            </div>
            <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                    <p style="font-size:13px;font-weight:${n.read ? 500 : 700};color:#1b1b24;line-height:1.3">${n.title}</p>
                    ${!n.read ? '<span style="width:8px;height:8px;border-radius:50%;background:#4d41df;flex-shrink:0"></span>' : ''}
                </div>
                <p style="font-size:12px;color:#777587;margin-top:2px;line-height:1.4">${n.description}</p>
                <p style="font-size:11px;color:#9e9bb8;margin-top:4px">${_timeAgo(n.time)}</p>
            </div>
        </div>`;
    }).join('');
    saveNotifications(list.map(n => ({ ...n, read: true })));
    refreshNotifCard();
}
window.loadNotificationsScreen = loadNotificationsScreen;

function markNotifRead(id) {
    saveNotifications(getNotifications().map(n => n.id === id ? { ...n, read: true } : n));
    loadNotificationsScreen();
}
window.markNotifRead = markNotifRead;

function markAllNotifsRead() {
    saveNotifications(getNotifications().map(n => ({ ...n, read: true })));
    loadNotificationsScreen();
    refreshNotifCard();
}
window.markAllNotifsRead = markAllNotifsRead;

function _timeAgo(iso) {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
}

// --- DASHBOARD EARNINGS ---

function formatCurrency(value) {
    const num = parseFloat(value);
    if (value === null || value === undefined || value === '' || typeof value === 'object' || isNaN(num)) {
        return '\u20b90.00';
    }
    return '\u20b9' + num.toFixed(2);
}

function loadDashboardEarnings() {
    const el = document.getElementById('dashboard-earnings');
    if (!el) return;
    const user = auth.currentUser;
    if (!user) { el.textContent = '\u20b90.00'; return; }
    db.collection('earnings').doc(user.uid).get()
        .then(doc => {
            const amount = doc.exists ? doc.data().amount : 0;
            el.textContent = formatCurrency(amount);
        })
        .catch(() => { el.textContent = '\u20b90.00'; });
    loadQuickActionStats();
    renderDashboardJobs();
    updateProfileProgressUI();
}

function _setQaBadge(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden');
}

function loadQuickActionStats() {
    const user = auth.currentUser;
    if (!user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. New jobs posted today
    db.collection('jobs')
        .where('postedAt', '>=', today)
        .get()
        .then(snap => {
            const count = snap.size;
            _setQaBadge('qa-jobs-badge', count > 0 ? `${count} New Today` : 'Browse Jobs');
        })
        .catch(() => _setQaBadge('qa-jobs-badge', 'Find Jobs'));

    // 2. User's total applications
    db.collection('applications')
        .where('userId', '==', user.uid)
        .get()
        .then(snap => {
            const count = snap.size;
            _setQaBadge('qa-apps-badge', count > 0 ? `${count} Applied` : 'Apply Now');
        })
        .catch(() => _setQaBadge('qa-apps-badge', 'My Apps'));

    // 3. New orders received today in the marketplace
    db.collection('orders')
        .where('sellerId', '==', user.uid)
        .where('createdAt', '>=', today)
        .get()
        .then(snap => {
            const count = snap.size;
            _setQaBadge('qa-orders-badge', count > 0 ? `${count} New Orders` : 'Marketplace');
        })
        .catch(() => _setQaBadge('qa-orders-badge', 'Marketplace'));
}

// --- APPLICATIONS HELPERS ---
function _appsKey() { const u = auth.currentUser; return u ? `tarini_applications_${u.uid}` : 'tarini_applications_guest'; }
function _enrolledKey() { const u = auth.currentUser; return u ? `tarini_enrolled_${u.uid}` : 'tarini_enrolled_guest'; }

// Avatar gradient palettes for company logos
const _avatarGradients = [
    'linear-gradient(135deg,#4d41df,#675df9)',
    'linear-gradient(135deg,#875041,#feb5a2)',
    'linear-gradient(135deg,#5c51a0,#c8bfff)',
    'linear-gradient(135deg,#2d6a4f,#74c69d)',
    'linear-gradient(135deg,#c77dff,#7b2d8b)',
];

function renderDashboardJobs() {
    const container = document.getElementById('dashboard-featured-jobs');
    if (!container) return;
    const sampleJobs = [
        { title: 'Tailoring Instructor', company: 'Craft India', location: 'Mumbai', type: 'Part-time', salary: '\u20b912,000/mo' },
        { title: 'Data Entry Operator', company: 'TechSeva', location: 'Remote', type: 'Full-time', salary: '\u20b915,000/mo' },
        { title: 'Beauty Consultant', company: 'GlowUp Studio', location: 'Delhi', type: 'Freelance', salary: '\u20b98,000/mo' },
    ];
    container.innerHTML = sampleJobs.map((job, i) => {
        const grad = _avatarGradients[i % _avatarGradients.length];
        const initials = job.company.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const typeColor = job.type === 'Full-time' ? 'background:rgba(77,65,223,0.10);color:#4d41df'
            : job.type === 'Part-time' ? 'background:rgba(135,80,65,0.10);color:#875041'
                : 'background:rgba(92,81,160,0.10);color:#5c51a0';
        return `
        <div class="dash-job-card" onclick="navigateTo('jobs')">
            <div style="display:flex;align-items:flex-start;gap:12px">
                <div class="dash-job-avatar" style="background:${grad}">${initials}</div>
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                        <p style="font-size:14px;font-weight:700;color:#1b1b24;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${job.title}</p>
                        <button onclick="event.stopPropagation()" style="flex-shrink:0;width:30px;height:30px;border-radius:50%;background:rgba(77,65,223,0.08);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background 0.15s" onmouseenter="this.style.background='rgba(77,65,223,0.16)'" onmouseleave="this.style.background='rgba(77,65,223,0.08)'">
                            <span class="material-symbols-outlined" style="font-size:16px;color:#4d41df">bookmark</span>
                        </button>
                    </div>
                    <p style="font-size:12px;color:#777587;margin-top:2px">${job.company} &bull; ${job.location}</p>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap">
                        <span class="dash-job-badge" style="${typeColor}">${job.type}</span>
                        <span class="dash-job-badge" style="background:rgba(56,161,105,0.10);color:#276749">${job.salary}</span>
                    </div>
                </div>
            </div>
            <button onclick="event.stopPropagation();navigateTo('jobs')" style="margin-top:12px;width:100%;height:38px;border-radius:10px;border:none;background:linear-gradient(135deg,#4d41df,#5c51a0);color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:opacity 0.15s;font-family:'Poppins',sans-serif" onmouseenter="this.style.opacity='0.88'" onmouseleave="this.style.opacity='1'">Apply Now</button>
        </div>`;
    }).join('');
}

// --- PROFILE LOGIC ---

function _profileKey() {
    const user = auth.currentUser;
    return user ? `profileData_${user.uid}` : 'profileData_guest';
}

function getProfileData() {
    return JSON.parse(localStorage.getItem(_profileKey()) || '{}');
}

function saveProfileData(data) {
    localStorage.setItem(_profileKey(), JSON.stringify(data));
}

function loadProfileScreen() {
    if (!document.getElementById('profile-user-name')) return;
    const d = getProfileData();
    const user = auth.currentUser;
    const name = d.name || (user && user.displayName) || 'User';

    document.getElementById('profile-user-name').textContent = name;
    document.getElementById('profile-display-fullname').textContent = name;
    document.getElementById('profile-display-title').textContent = d.title || '';
    document.getElementById('profile-display-bio').textContent = d.bio || '';
    document.getElementById('profile-display-location').textContent = d.location || '';
    document.getElementById('profile-display-website').textContent = d.website || '';
    document.getElementById('profile-display-visibility').textContent = d.visibility || 'Public';
    document.getElementById('profile-display-joined').textContent = d.joined || ('Joined ' + new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }));

    const img = document.getElementById('profile-avatar-img');
    const icon = document.getElementById('profile-avatar-icon');
    if (d.avatar) { img.src = d.avatar; img.classList.remove('hidden'); icon.classList.add('hidden'); }
    else { img.classList.add('hidden'); icon.classList.remove('hidden'); }

    const skillsEl = document.getElementById('profile-skills-display');
    const skills = d.skills ? d.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    skillsEl.innerHTML = skills.length
        ? skills.map(s => `<span class="text-xs bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full">${s}</span>`).join('')
        : '<span class="text-sm text-on-surface-variant">No skills added yet.</span>';

    document.getElementById('profile-resume-name').textContent = d.resumeName || 'No resume uploaded';
    document.getElementById('profile-resume-date').textContent = d.resumeDate || '';

    const prefs = d.prefs || {};
    updateNotifToggle(prefs.notifications !== false);
    const langEl = document.getElementById('pref-language');
    if (langEl) langEl.value = prefs.language || 'English';
    document.getElementById('pref-language-display').textContent = prefs.language || 'English';
    const tfaEl = document.getElementById('tfa-status');
    const tfaBtn = document.getElementById('tfa-toggle-btn');
    if (tfaEl) tfaEl.textContent = prefs.tfa ? 'Enabled' : 'Disabled';
    if (tfaBtn) tfaBtn.textContent = prefs.tfa ? 'Disable' : 'Enable';

    const dashEl = document.getElementById('dashboard-user-name');
    if (dashEl) dashEl.textContent = name;
}
window.loadProfileScreen = loadProfileScreen;

function openEditProfile() {
    const d = getProfileData();
    const user = auth.currentUser;
    document.getElementById('ep-name').value = d.name || (user && user.displayName) || '';
    document.getElementById('ep-title').value = d.title || '';
    document.getElementById('ep-bio').value = d.bio || '';
    document.getElementById('ep-location').value = d.location || '';
    document.getElementById('ep-website').value = d.website || '';
    document.getElementById('ep-skills').value = d.skills || '';
    navigateTo('edit-profile');
}
window.openEditProfile = openEditProfile;

function saveProfile() {
    const d = getProfileData();
    d.name = document.getElementById('ep-name').value.trim();
    d.title = document.getElementById('ep-title').value.trim();
    d.bio = document.getElementById('ep-bio').value.trim();
    d.location = document.getElementById('ep-location').value.trim();
    d.website = document.getElementById('ep-website').value.trim();
    d.skills = document.getElementById('ep-skills').value.trim();
    if (!d.joined) d.joined = 'Joined ' + new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    saveProfileData(d);
    // Persist to Firestore
    const user = auth.currentUser;
    if (user) db.collection('users').doc(user.uid).set(d, { merge: true }).catch(console.warn);
    navigateTo('profile');
    updateProfileProgressUI();
    // Award coins for profile completion
    const pct = computeProfileProgress();
    if (pct >= 100) { earnCoins(50, 'Profile 100% complete'); checkAndAwardBadges(); }
    else if (pct >= 50) { earnCoins(10, 'Profile updated'); }
}
window.saveProfile = saveProfile;

function handleProfilePicChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const d = getProfileData();
        d.avatar = e.target.result;
        saveProfileData(d);
        loadProfileScreen();
        updateProfileProgressUI();
        updateHeaderAvatar();
    };
    reader.readAsDataURL(file);
}
window.handleProfilePicChange = handleProfilePicChange;

function toggleProfileVisibility() {
    const d = getProfileData();
    d.visibility = (d.visibility === 'Private') ? 'Public' : 'Private';
    saveProfileData(d);
    document.getElementById('profile-display-visibility').textContent = d.visibility;
}
window.toggleProfileVisibility = toggleProfileVisibility;

function handleResumeUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const d = getProfileData();
    d.resumeName = file.name;
    d.resumeDate = 'Uploaded ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    saveProfileData(d);
    document.getElementById('profile-resume-name').textContent = d.resumeName;
    document.getElementById('profile-resume-date').textContent = d.resumeDate;
    updateProfileProgressUI();
}
window.handleResumeUpload = handleResumeUpload;

function togglePref(key) {
    const d = getProfileData();
    if (!d.prefs) d.prefs = {};
    d.prefs[key] = !d.prefs[key];
    saveProfileData(d);
    if (key === 'notifications') updateNotifToggle(d.prefs.notifications);
    if (key === 'tfa') {
        const tfaEl = document.getElementById('tfa-status');
        const tfaBtn = document.getElementById('tfa-toggle-btn');
        if (tfaEl) tfaEl.textContent = d.prefs.tfa ? 'Enabled' : 'Disabled';
        if (tfaBtn) tfaBtn.textContent = d.prefs.tfa ? 'Disable' : 'Enable';
    }
}
window.togglePref = togglePref;

function savePref(key, value) {
    const d = getProfileData();
    if (!d.prefs) d.prefs = {};
    d.prefs[key] = value;
    saveProfileData(d);
    if (key === 'language') document.getElementById('pref-language-display').textContent = value;
}
window.savePref = savePref;

function updateNotifToggle(on) {
    const btn = document.getElementById('notif-toggle');
    const knob = document.getElementById('notif-knob');
    if (!btn || !knob) return;
    if (on) { btn.classList.add('bg-primary'); btn.classList.remove('bg-outline-variant'); knob.classList.add('translate-x-6'); knob.classList.remove('translate-x-0'); }
    else { btn.classList.remove('bg-primary'); btn.classList.add('bg-outline-variant'); knob.classList.remove('translate-x-6'); knob.classList.add('translate-x-0'); }
}

async function shareProfile() {
    const d = getProfileData();
    const user = auth.currentUser;
    const name = d.name || (user && user.displayName) || 'User';
    const uid = user ? user.uid : 'guest';

    // Build a deep-link URL pointing to this user's profile
    const profileUrl = `https://tarini-9ff23.web.app/?profile=${uid}`;
    const shareTitle = `${name} on Tarini`;
    const shareText = `Check out ${name}'s profile on Tarini \u2014 a platform empowering women entrepreneurs.`;

    if (navigator.share) {
        try {
            await navigator.share({ title: shareTitle, text: shareText, url: profileUrl });
        } catch (err) {
            if (err.name !== 'AbortError') copyToClipboard(profileUrl);
        }
    } else {
        copyToClipboard(profileUrl);
    }
}
window.shareProfile = shareProfile;

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast('Profile link copied to clipboard!'));
    } else {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        showToast('Profile link copied to clipboard!');
    }
}

function showToast(msg) {
    let toast = document.getElementById('share-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'share-toast';
        toast.className = 'fixed bottom-32 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-sm font-semibold px-5 py-3 rounded-full shadow-xl z-[999] transition-all';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

// --- SHOP LOGIC ---

let currentProductId = null;
let showAllProducts = false;

function getShopProducts() {
    const u = auth.currentUser;
    const key = u ? `shopProducts_${u.uid}` : 'shopProducts_guest';
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function saveShopProducts(products) {
    const u = auth.currentUser;
    const key = u ? `shopProducts_${u.uid}` : 'shopProducts_guest';
    localStorage.setItem(key, JSON.stringify(products));
}

function renderShopProducts(viewAll) {
    if (viewAll !== undefined) showAllProducts = viewAll;
    const products = getShopProducts();
    const emptyState = document.getElementById('shop-empty-state');
    const productsState = document.getElementById('shop-products-state');
    const container = document.getElementById('shop-products-container');
    if (!container) return;

    if (products.length === 0) {
        showAllProducts = false;
        emptyState.classList.remove('hidden');
        productsState.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    productsState.classList.remove('hidden');

    const viewAllBtn = document.getElementById('shop-view-all');
    const display = showAllProducts ? products.slice().reverse() : products.slice(-4).reverse();
    if (viewAllBtn) {
        viewAllBtn.classList.toggle('hidden', products.length <= 4);
        viewAllBtn.textContent = showAllProducts ? 'Show Less' : 'View All';
    }

    container.innerHTML = display.map(p => {
        const safeName = (p.name && typeof p.name === 'string') ? p.name : 'Unnamed Product';
        const safePrice = (!isNaN(parseFloat(p.price)) && isFinite(p.price)) ? Number(p.price).toFixed(2) : '0.00';
        const safeCategory = (p.category && typeof p.category === 'string') ? p.category : '';
        const safeImage = (p.image && typeof p.image === 'string') ? p.image : '';
        return `
        <div onclick="openProductDetail(${p.id})" class="bg-white rounded-[20px] border border-surface-container-high shadow-sm overflow-hidden flex flex-col cursor-pointer active:scale-95 transition-all">
            <div class="w-full h-36 bg-surface-container-low flex items-center justify-center overflow-hidden">
                ${safeImage ? `<img src="${safeImage}" alt="${safeName}" class="w-full h-full object-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><span class="material-symbols-outlined text-outline-variant text-5xl" style="display:none">image</span>` : `<span class="material-symbols-outlined text-outline-variant text-5xl">image</span>`}
            </div>
            <div class="p-3 flex flex-col gap-1 flex-1">
                <p class="font-semibold text-on-surface text-sm leading-tight line-clamp-2">${safeName}</p>
                ${safeCategory ? `<span class="text-[11px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full w-fit">${safeCategory}</span>` : ''}
                <p class="text-primary font-bold text-sm mt-auto">&#8377;${safePrice}</p>
            </div>
        </div>
    `;
    }).join('');
}
window.renderShopProducts = renderShopProducts;

let _postProductOrigin = 'shop';

function openPostProduct(productId) {
    _postProductOrigin = document.querySelector('.screen.active')?.id?.replace('screen-', '') || 'shop';
    const form = document.getElementById('post-product-form');
    form.reset();
    document.getElementById('edit-product-id').value = '';
    document.getElementById('post-product-title').textContent = 'Add Product';
    const btnLabel = document.getElementById('post-btn-label');
    if (btnLabel) btnLabel.textContent = 'Post Product';
    resetImagePreview('product-image-preview', 'product-image-icon', 'product-image-text');
    // Reset new UI elements
    const imgActions = document.getElementById('img-actions');
    if (imgActions) imgActions.classList.add('hidden');
    const aiBox = document.getElementById('ai-suggestion-box');
    if (aiBox) aiBox.classList.add('hidden');
    const progressWrap = document.getElementById('img-progress-wrap');
    if (progressWrap) progressWrap.classList.add('hidden');
    document.getElementById('product-image-text').textContent = 'Tap to upload image';

    if (productId) {
        const p = getShopProducts().find(x => x.id === productId);
        if (p) {
            document.getElementById('edit-product-id').value = p.id;
            document.getElementById('product-name').value = p.name;
            document.getElementById('product-description').value = p.description || '';
            document.getElementById('product-price').value = p.price;
            document.getElementById('product-category').value = p.category || '';
            document.getElementById('product-stock').value = p.stock;
            document.getElementById('post-product-title').textContent = 'Edit Product';
            document.getElementById('post-product-btn').textContent = 'Save Changes';
            if (p.image) {
                const preview = document.getElementById('product-image-preview');
                preview.setAttribute('data-src', p.image);
                preview.src = p.image;
                preview.classList.remove('hidden');
                document.getElementById('product-image-icon').classList.add('hidden');
                document.getElementById('product-image-text').classList.add('hidden');
            }
        }
    }
    navigateTo('post-product');
}
window.openPostProduct = openPostProduct;

function submitProductForm() {
    const editId = document.getElementById('edit-product-id').value;
    const name = document.getElementById('product-name').value.trim();
    const description = document.getElementById('product-description').value.trim();
    const price = parseFloat(document.getElementById('product-price').value);
    const category = document.getElementById('product-category').value;
    const stock = parseInt(document.getElementById('product-stock').value);
    const preview = document.getElementById('product-image-preview');
    const image = (!preview.classList.contains('hidden') && preview.getAttribute('data-src'))
        ? preview.getAttribute('data-src')
        : '';

    // Show loading state on button
    const btn = document.getElementById('post-product-btn');
    const btnLabel = document.getElementById('post-btn-label');
    if (btn && btnLabel) {
        btnLabel.textContent = 'Adding...';
        btn.disabled = true;
        btn.style.opacity = '0.8';
    }

    setTimeout(() => {
        let products = getShopProducts();
        if (editId) {
            products = products.map(p => p.id === parseInt(editId)
                ? { ...p, name, description, price, category, stock, image: image || p.image }
                : p);
        } else {
            products.push({ id: Date.now(), name, description, price, category, stock, image });
            earnCoins(25, 'Listed a new product');
            checkAndAwardBadges();
        }
        saveShopProducts(products);
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        if (btnLabel) btnLabel.textContent = editId ? 'Save Changes' : 'Post Product';
        // Show success modal
        const modal = document.getElementById('product-success-modal');
        if (modal) modal.classList.remove('hidden');
    }, 1200);
}
window.submitProductForm = submitProductForm;

function closeProductSuccess() {
    const modal = document.getElementById('product-success-modal');
    if (modal) modal.classList.add('hidden');
    navigateTo('my-shop');
}
window.closeProductSuccess = closeProductSuccess;

function previewProductImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    // Show progress bar
    const progressWrap = document.getElementById('img-progress-wrap');
    const progressBar = document.getElementById('img-progress-bar');
    const progressLabel = document.getElementById('img-progress-label');
    if (progressWrap) {
        progressWrap.classList.remove('hidden');
        progressBar.style.width = '0%';
        let pct = 0;
        const interval = setInterval(() => {
            pct += Math.random() * 30;
            if (pct >= 100) { pct = 100; clearInterval(interval); }
            progressBar.style.width = pct + '%';
            if (progressLabel) progressLabel.textContent = pct < 100 ? 'Uploading...' : 'Done!';
        }, 80);
    }
    const reader = new FileReader();
    reader.onload = e => {
        const preview = document.getElementById('product-image-preview');
        preview.setAttribute('data-src', e.target.result);
        preview.src = e.target.result;
        preview.classList.remove('hidden');
        document.getElementById('product-image-icon').classList.add('hidden');
        document.getElementById('product-image-text').classList.add('hidden');
        setTimeout(() => {
            if (progressWrap) progressWrap.classList.add('hidden');
            const actions = document.getElementById('img-actions');
            if (actions) actions.classList.remove('hidden');
        }, 900);
    };
    reader.readAsDataURL(file);
}
window.previewProductImage = previewProductImage;

function removeProductImage() {
    resetImagePreview('product-image-preview', 'product-image-icon', 'product-image-text');
    document.getElementById('product-image').value = '';
    const actions = document.getElementById('img-actions');
    if (actions) actions.classList.add('hidden');
}
window.removeProductImage = removeProductImage;

// --- AI IMPROVE (simulated) ---
const _aiSuggestions = [
    { title: 'Elegant Handcrafted Earrings \u2014 Artisan Collection', desc: 'Beautifully crafted by skilled artisans using premium materials. Each piece is unique, lightweight, and perfect for everyday wear or special occasions. A thoughtful gift for loved ones.' },
    { title: 'Premium Handwoven Silk Saree \u2014 Traditional Elegance', desc: 'Experience the timeless beauty of handwoven silk. This exquisite saree features intricate patterns crafted by master weavers, blending tradition with modern aesthetics.' },
    { title: 'Organic Herbal Skincare Set \u2014 Natural Glow Collection', desc: 'Nourish your skin with our 100% organic herbal blend. Free from harmful chemicals, this set is crafted with love using traditional recipes passed down through generations.' },
    { title: 'Handmade Terracotta Jewellery \u2014 Earthy Charm Series', desc: 'Celebrate the art of terracotta with these stunning handmade pieces. Lightweight, eco-friendly, and uniquely designed to complement both traditional and contemporary outfits.' },
];

function aiImproveProduct() {
    const btn = document.getElementById('ai-improve-btn');
    const label = document.getElementById('ai-btn-label');
    const box = document.getElementById('ai-suggestion-box');
    if (!btn || !label || !box) return;
    // Show loading state
    label.textContent = 'Thinking...';
    btn.disabled = true;
    btn.style.opacity = '0.7';
    const spinner = document.createElement('span');
    spinner.className = 'material-symbols-outlined';
    spinner.style.cssText = 'font-size:13px;animation:spin 0.8s linear infinite';
    spinner.textContent = 'progress_activity';
    btn.prepend(spinner);
    // Add spin keyframe if not present
    if (!document.getElementById('spin-style')) {
        const s = document.createElement('style');
        s.id = 'spin-style';
        s.textContent = '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
        document.head.appendChild(s);
    }
    setTimeout(() => {
        spinner.remove();
        btn.disabled = false;
        btn.style.opacity = '1';
        label.textContent = 'Improve with AI';
        // Pick suggestion based on current name or random
        const name = (document.getElementById('product-name').value || '').toLowerCase();
        let pick = _aiSuggestions[Math.floor(Math.random() * _aiSuggestions.length)];
        if (name.includes('saree') || name.includes('silk')) pick = _aiSuggestions[1];
        else if (name.includes('skin') || name.includes('herbal')) pick = _aiSuggestions[2];
        else if (name.includes('terra') || name.includes('clay')) pick = _aiSuggestions[3];
        document.getElementById('ai-suggested-title').textContent = pick.title;
        document.getElementById('ai-suggested-desc').textContent = pick.desc;
        box.classList.remove('hidden');
    }, 2200);
}
window.aiImproveProduct = aiImproveProduct;

function acceptAiSuggestion() {
    const title = document.getElementById('ai-suggested-title').textContent;
    const desc = document.getElementById('ai-suggested-desc').textContent;
    document.getElementById('product-name').value = title;
    document.getElementById('product-description').value = desc;
    document.getElementById('ai-suggestion-box').classList.add('hidden');
}
window.acceptAiSuggestion = acceptAiSuggestion;

function dismissAiSuggestion() {
    document.getElementById('ai-suggestion-box').classList.add('hidden');
}
window.dismissAiSuggestion = dismissAiSuggestion;

// ---- Product detail ----
function openProductDetail(productId) {
    currentProductId = productId;
    const p = getShopProducts().find(x => x.id === productId);
    if (!p) return;
    document.getElementById('detail-name').textContent = p.name;
    document.getElementById('detail-price').textContent = '\u20b9' + Number(p.price).toFixed(2);
    document.getElementById('detail-category').textContent = p.category || 'Uncategorised';
    document.getElementById('detail-description').textContent = p.description || 'No description provided.';
    document.getElementById('detail-stock').textContent = p.stock;
    const img = document.getElementById('detail-image');
    const placeholder = document.getElementById('detail-image-placeholder');
    if (p.image) {
        img.src = p.image;
        img.classList.remove('hidden');
        placeholder.classList.add('hidden');
    } else {
        img.classList.add('hidden');
        placeholder.classList.remove('hidden');
    }
    navigateTo('product-detail');
}
window.openProductDetail = openProductDetail;

function editCurrentProduct() {
    openPostProduct(currentProductId);
}
window.editCurrentProduct = editCurrentProduct;

function deleteCurrentProduct() {
    if (!confirm('Delete this product?')) return;
    saveShopProducts(getShopProducts().filter(p => p.id !== currentProductId));
    currentProductId = null;
    navigateTo('shop');
}
window.deleteCurrentProduct = deleteCurrentProduct;

// ---- Helpers ----
function previewImageInto(event, previewId, iconId, textId) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const preview = document.getElementById(previewId);
        preview.src = e.target.result;
        preview.classList.remove('hidden');
        document.getElementById(iconId).classList.add('hidden');
        document.getElementById(textId).classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

function resetImagePreview(previewId, iconId, textId) {
    const preview = document.getElementById(previewId);
    if (preview) { preview.src = ''; preview.removeAttribute('data-src'); preview.classList.add('hidden'); }
    const icon = document.getElementById(iconId);
    if (icon) icon.classList.remove('hidden');
    const text = document.getElementById(textId);
    if (text) text.classList.remove('hidden');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderShopProducts();
    loadProfileScreen();
    updateHeaderAvatar();
    refreshNotifCard();

    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-theme');
        document.documentElement.classList.add('dark');
    }
    _applyLogo(savedTheme === 'dark');
});

const LOGO_LIGHT = 'tarini%20logo%20png.png';
const LOGO_DARK = 'logo.png';

function _applyLogo(isDark) {
    const src = isDark ? LOGO_DARK : LOGO_LIGHT;
    ['header-logo', 'auth-logo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.src = src;
    });
}
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark-theme');
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    _applyLogo(isDark);
    // Re-render dynamic lists so inline colours update immediately
    const jobsScreen = document.getElementById('screen-jobs');
    if (jobsScreen && jobsScreen.classList.contains('active')) initJobsPage();
    const shopScreen = document.getElementById('screen-shop');
    if (shopScreen && shopScreen.classList.contains('active')) initMarketplace();
    const myShopScreen = document.getElementById('screen-my-shop');
    if (myShopScreen && myShopScreen.classList.contains('active')) initMyShop();
    const cartScreen = document.getElementById('screen-cart');
    if (cartScreen && cartScreen.classList.contains('active')) renderCart();
    const skillsScreen = document.getElementById('screen-skills');
    if (skillsScreen && skillsScreen.classList.contains('active')) applySkillFilters();
    const catScreen = document.getElementById('screen-skill-categories');
    if (catScreen && catScreen.classList.contains('active')) {
        const catTitle = document.getElementById('skill-cat-page-title');
        if (catTitle && catTitle.textContent !== 'All Categories') openSkillCategory(catTitle.textContent);
    }

    // Re-render all dynamic screens on theme change
    const _screens = [
        ['screen-rewards', () => initRewardsScreen()],
        ['screen-notifications', () => loadNotificationsScreen()],
        ['screen-applications', () => loadApplicationsScreen()],
        ['screen-dashboard', () => loadDashboardEarnings()],
        ['screen-profile', () => loadProfileScreen()],
        ['screen-company-training', () => loadTrainingScreen()],
        ['screen-company-dashboard', () => loadCompanyDashboard()],
        ['screen-company-applications', () => loadCompanyApplications()],
        ['screen-co-own-profile', () => loadCompanyProfile()],
    ];
    _screens.forEach(([id, fn]) => { const s = document.getElementById(id); if (s && s.classList.contains('active')) fn(); });
    // Update upload modal card bg if open
    const _mc = document.getElementById('training-modal-card');
    if (_mc && !document.getElementById('training-upload-modal').classList.contains('hidden')) _mc.style.background = isDark ? '#1c1b2e' : '#ffffff';
}
window.toggleTheme = toggleTheme;

// --- FIREBASE AUTHENTICATION LOGIC ---

function showError(msg) {
    const errorEl = document.getElementById('auth-error-msg');
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
    setTimeout(() => { errorEl.style.display = 'none'; }, 4000);
}

function toggleAuthMode(mode) {
    const loginForm = document.getElementById('login-form');
    const roleSelector = document.getElementById('register-role-selector');
    const errorEl = document.getElementById('auth-error-msg');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const toggleToRegister = document.getElementById('toggle-to-register');
    const toggleToLogin = document.getElementById('toggle-to-login');
    errorEl.style.display = 'none';
    ['woman', 'company', 'admin'].forEach(r => {
        document.getElementById(`register-form-${r}`).style.display = 'none';
    });
    if (mode === 'register') {
        loginForm.style.display = 'none';
        roleSelector.style.display = 'block';
        if (title) title.setAttribute('data-i18n', 'signUp');
        if (subtitle) subtitle.setAttribute('data-i18n', 'tariniWelcomesYou');
        toggleToRegister.style.display = 'none';
        toggleToLogin.style.display = 'block';
    } else {
        roleSelector.style.display = 'none';
        loginForm.style.display = 'block';
        if (title) title.setAttribute('data-i18n', 'signIn');
        if (subtitle) subtitle.setAttribute('data-i18n', 'welcomeBack');
        toggleToRegister.style.display = 'block';
        toggleToLogin.style.display = 'none';
        const roleEl = document.getElementById('login-role');
        if (roleEl) roleEl.value = '';
    }
    // Re-apply translations so title/subtitle and all elements update immediately
    setAuthLang(localStorage.getItem('authLangPref') || 'en');
}
window.toggleAuthMode = toggleAuthMode;

async function handleForgotPassword() {
    const email = document.getElementById('login-email').value.trim();
    if (!email) {
        showError('Enter your email address above, then tap Forgot Password.');
        return;
    }
    try {
        await auth.sendPasswordResetEmail(email);
        showToast('Password reset email sent! Check your inbox.');
    } catch (error) {
        showError(error.message);
    }
}
window.handleForgotPassword = handleForgotPassword;

async function handleGoogleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const cred = await auth.signInWithPopup(provider);
        await _loadUserProfileFromFirestore(cred.user);
        // onAuthStateChanged will handle navigation
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') showError(error.message);
    }
}
window.handleGoogleSignIn = handleGoogleSignIn;

// --- ROLE-BASED ROUTING ---

// Returns the current user's role from their scoped profile
function _currentRole() {
    return getProfileData().role || 'woman';
}
window._currentRole = _currentRole;

// Enforce nav visibility based on role — call this any time screens change
function _applyRoleNav(role) {
    const bottomNav = document.getElementById('bottom-nav');
    const companyNav = document.getElementById('company-bottom-nav');
    const globalHeader = document.getElementById('global-header');
    if (role === 'company') {
        if (bottomNav) bottomNav.classList.add('hidden');
        if (globalHeader) globalHeader.classList.add('hidden');   // company has its own header area
        if (companyNav) companyNav.classList.remove('hidden');
    } else {
        if (companyNav) companyNav.classList.add('hidden');
        if (bottomNav) bottomNav.classList.remove('hidden');
        if (globalHeader) globalHeader.classList.remove('hidden');
    }
}

function routeByRole() {
    const role = _currentRole();
    _applyRoleNav(role);
    if (role === 'company') {
        companyNavTo('company-dashboard');
    } else {
        navigateTo('dashboard');
    }
}
window.routeByRole = routeByRole;

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const selectedRole = document.getElementById('login-role').value;
    const btn = document.getElementById('login-btn');

    if (!email || !password) {
        showError("Please enter email and password.");
        return;
    }
    if (!selectedRole) {
        showError("Please select your role to continue.");
        return;
    }

    const lang = localStorage.getItem('authLangPref') || 'en';
    const dict = (window.authTranslations && window.authTranslations[lang]) ? window.authTranslations[lang] : (window.authTranslations ? window.authTranslations['en'] : null);

    try {
        btn.disabled = true;
        btn.textContent = 'Signing In...';
        const cred = await auth.signInWithEmailAndPassword(email, password);

        // Fetch user profile from Firestore to validate role
        await _loadUserProfileFromFirestore(cred.user);
        const d = getProfileData();
        const storedRole = d.role;

        // Role mismatch: only block if a role IS stored and doesn't match
        if (storedRole && storedRole !== selectedRole) {
            await auth.signOut();
            showError('Selected role does not match your account.');
            return;
        }

        // No role stored yet — trust the selected role and persist it
        if (!storedRole) {
            const _key = `profileData_${cred.user.uid}`;
            const _ex = JSON.parse(localStorage.getItem(_key) || '{}');
            _ex.role = selectedRole;
            localStorage.setItem(_key, JSON.stringify(_ex));
            db.collection('users').doc(cred.user.uid).set({ role: selectedRole }, { merge: true }).catch(console.warn);
        }

        routeByRole();
    } catch (error) {
        if (error.code) showError(error.message);
    } finally {
        btn.disabled = false;
        setAuthLang(localStorage.getItem('authLangPref') || 'en');
    }
}
window.handleLogin = handleLogin;

// Fetch user profile from Firestore and store in user-scoped localStorage
async function _loadUserProfileFromFirestore(user) {
    if (!user) return;
    try {
        const doc = await db.collection('users').doc(user.uid).get();
        const key = `profileData_${user.uid}`;
        const companyKey = `companyProfileData_${user.uid}`;
        if (doc.exists) {
            const data = doc.data();
            const existing = JSON.parse(localStorage.getItem(key) || '{}');
            localStorage.setItem(key, JSON.stringify({ ...existing, ...data }));
            if (data.role === 'company') {
                const cd = JSON.parse(localStorage.getItem(companyKey) || '{}');
                if (!cd.name) {
                    cd.name = data.name || user.displayName || '';
                    cd.email = data.email || user.email || '';
                    cd.industry = data.industry || '';
                    cd.address = data.address || '';
                    localStorage.setItem(companyKey, JSON.stringify(cd));
                }
            }
        } else {
            const existing = JSON.parse(localStorage.getItem(key) || '{}');
            if (!existing.name) existing.name = user.displayName || '';
            localStorage.setItem(key, JSON.stringify(existing));
            const cd = JSON.parse(localStorage.getItem(companyKey) || '{}');
            if (!cd.name && user.displayName) {
                cd.name = user.displayName;
                localStorage.setItem(companyKey, JSON.stringify(cd));
            }
        }
    } catch (e) {
        console.warn('Could not load user profile from Firestore:', e);
    }
}

function showRegisterForm(role) {
    document.getElementById('register-role-selector').style.display = 'none';
    document.getElementById(`register-form-${role}`).style.display = 'block';
}
window.showRegisterForm = showRegisterForm;

function showRegisterRole() {
    ['woman', 'company', 'admin'].forEach(r => {
        document.getElementById(`register-form-${r}`).style.display = 'none';
    });
    document.getElementById('register-role-selector').style.display = 'block';
}
window.showRegisterRole = showRegisterRole;

async function handleRegister(role) {
    let email, password, name, btn;
    if (role === 'woman') {
        name = document.getElementById('w-name').value;
        email = document.getElementById('w-email').value;
        password = document.getElementById('w-password').value;
        btn = document.getElementById('register-btn');
    } else if (role === 'company') {
        name = document.getElementById('c-name').value;
        email = document.getElementById('c-email').value;
        password = document.getElementById('c-password').value;
        btn = document.getElementById('register-btn-company');
    } else {
        name = document.getElementById('a-name').value;
        email = document.getElementById('a-email').value;
        password = document.getElementById('a-password').value;
        btn = document.getElementById('register-btn-admin');
    }
    if (!email || !password || !name) { showError('Please fill in all required fields.'); return; }

    const lang = localStorage.getItem('authLangPref') || 'en';
    const dict = (window.authTranslations && window.authTranslations[lang]) ? window.authTranslations[lang] : (window.authTranslations ? window.authTranslations['en'] : null);
    try {
        btn.textContent = 'Creating...';
        btn.disabled = true;
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: name });

        // Build profile object
        const profileData = {
            name,
            email,
            role,
            joined: 'Joined ' + new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        };
        if (role === 'woman') {
            profileData.skills = document.getElementById('w-skills').value;
            profileData.jobPref = document.getElementById('w-job-pref').value;
        } else if (role === 'company') {
            profileData.industry = document.getElementById('c-industry').value;
            profileData.address = document.getElementById('c-address').value;
        }

        // Save to Firestore (source of truth)
        await db.collection('users').doc(cred.user.uid).set(profileData);

        // Cache locally under user-scoped key
        localStorage.setItem(`profileData_${cred.user.uid}`, JSON.stringify(profileData));

        // For company role, also seed the company-scoped data store
        if (role === 'company') {
            const companyKey = `companyProfileData_${cred.user.uid}`;
            const existing = JSON.parse(localStorage.getItem(companyKey) || '{}');
            if (!existing.name) {
                existing.name = name;
                existing.email = email;
                existing.industry = profileData.industry || '';
                existing.address = profileData.address || '';
                localStorage.setItem(companyKey, JSON.stringify(existing));
            }
        }

        // Route based on the role we just registered with (don't rely on getProfileData yet)
        _applyRoleNav(role);
        if (role === 'company') {
            companyNavTo('company-dashboard');
        } else {
            navigateTo('dashboard');
        }
    } catch (error) {
        showError(error.message);
    } finally {
        btn.disabled = false;
        setAuthLang(localStorage.getItem('authLangPref') || 'en');
    }
}
window.handleRegister = handleRegister;

async function handleLogout() {
    try {
        await auth.signOut();
        // onAuthStateChanged will handle navigation
    } catch (error) {
        console.error("Logout Error:", error);
    }
}
window.handleLogout = handleLogout;

// Global Auth State Observer
auth.onAuthStateChanged(async (user) => {
    const _overlay = document.getElementById('auth-loading-overlay');
    if (_overlay) _overlay.style.display = 'none';

    const loginBtn = document.getElementById('login-btn');
    const regBtn = document.getElementById('register-btn');
    if (loginBtn) { loginBtn.disabled = false; }
    if (regBtn) { regBtn.disabled = false; }
    try { setAuthLang(localStorage.getItem('authLangPref') || 'en'); } catch (e) { }

    if (user) {
        // Ensure user-scoped profile is loaded before any UI update
        const cachedKey = `profileData_${user.uid}`;
        const hasCached = !!localStorage.getItem(cachedKey);
        if (!hasCached) {
            await _loadUserProfileFromFirestore(user);
        }

        const d = getProfileData(); // now reads user-scoped key
        const displayName = d.name || user.displayName || 'User';

        const dashboardUserNameEl = document.getElementById('dashboard-user-name');
        if (dashboardUserNameEl) dashboardUserNameEl.textContent = displayName;
        const profileUserNameEl = document.getElementById('profile-user-name');
        if (profileUserNameEl) profileUserNameEl.textContent = displayName;

        // Award welcome coins on first ever login
        const r = _getRewards();
        if (!r.earnedBadges.includes('first_login')) {
            earnCoins(30, 'Welcome to Tarini!');
            checkAndAwardBadges();
        }

        const loginScreen = document.getElementById('screen-login');
        if (loginScreen && loginScreen.classList.contains('active')) {
            routeByRole();
        } else if (history.state && history.state.screen === 'login') {
            routeByRole();
        } else {
            // App reload: redirect to correct dashboard, never show login
            routeByRole();
        }
    } else {
        navigateToWithOutHistory('login');
        history.replaceState({ screen: 'login' }, '', window.location.pathname);
    }
});
// --- GLOBAL LANGUAGE SUPPORT (Google Translate) ---
function setGlobalLang(lang) {
    localStorage.setItem('appLangPref', lang);

    // Find the hidden Google Translate dropdown
    const selectField = document.querySelector('.goog-te-combo');
    if (selectField) {
        selectField.value = lang;
        selectField.dispatchEvent(new Event('change'));
    }
}
window.setGlobalLang = setGlobalLang;

// Initialize language preference
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('appLangPref') || 'en';

    // Keep custom dropdowns synced
    document.querySelectorAll('.lang-dropdown').forEach(dropdown => {
        dropdown.value = savedLang;
        // override onchange
        dropdown.onchange = function () {
            setGlobalLang(this.value);
        };
    });

    // Wait for Google Translate widget to load, then apply saved language
    const checkGoogleTranslate = setInterval(() => {
        const selectField = document.querySelector('.goog-te-combo');
        if (selectField) {
            clearInterval(checkGoogleTranslate);
            if (savedLang !== 'en') {
                setGlobalLang(savedLang);
            }
        }
    }, 500);

    // Stop checking after 10 seconds to avoid infinite polling
    setTimeout(() => clearInterval(checkGoogleTranslate), 10000);
});

// ============================================================
// FIND JOBS PAGE ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â data, filters, AI match, top companies
// ============================================================

const _allJobs = [
    { id: 1, title: 'Tailoring Instructor', company: 'Craft India', location: 'Mumbai', locType: 'On-site', type: 'Part-time', exp: 'Mid-level', industry: 'Education', salaryNum: 12000, salary: '\u20b912,000/mo', grad: 'linear-gradient(135deg,#4d41df,#675df9)' },
    { id: 2, title: 'Data Entry Operator', company: 'TechSeva', location: 'Remote', locType: 'Remote', type: 'Full-time', exp: 'Fresher', industry: 'Technology', salaryNum: 15000, salary: '\u20b915,000/mo', grad: 'linear-gradient(135deg,#5c51a0,#c8bfff)' },
    { id: 3, title: 'Beauty Consultant', company: 'GlowUp Studio', location: 'Delhi', locType: 'On-site', type: 'Freelance', exp: 'Fresher', industry: 'Retail', salaryNum: 8000, salary: '\u20b98,000/mo', grad: 'linear-gradient(135deg,#875041,#feb5a2)' },
    { id: 4, title: 'Junior Web Developer', company: 'CodeNest', location: 'Hybrid', locType: 'Hybrid', type: 'Full-time', exp: 'Fresher', industry: 'Technology', salaryNum: 22000, salary: '\u20b922,000/mo', grad: 'linear-gradient(135deg,#2d6a4f,#74c69d)' },
    { id: 5, title: 'Healthcare Assistant', company: 'MediCare Plus', location: 'Bangalore', locType: 'On-site', type: 'Full-time', exp: 'Mid-level', industry: 'Healthcare', salaryNum: 18000, salary: '\u20b918,000/mo', grad: 'linear-gradient(135deg,#c77dff,#7b2d8b)' },
    { id: 6, title: 'Content Writer', company: 'WordCraft', location: 'Remote', locType: 'Remote', type: 'Freelance', exp: 'Fresher', industry: 'Technology', salaryNum: 9000, salary: '\u20b99,000/mo', grad: 'linear-gradient(135deg,#4d41df,#875041)' },
    { id: 7, title: 'Retail Store Manager', company: 'FashionHub', location: 'Chennai', locType: 'On-site', type: 'Full-time', exp: 'Senior', industry: 'Retail', salaryNum: 35000, salary: '\u20b935,000/mo', grad: 'linear-gradient(135deg,#875041,#5c51a0)' },
    { id: 8, title: 'UI/UX Design Intern', company: 'PixelWorks', location: 'Hybrid', locType: 'Hybrid', type: 'Internship', exp: 'Fresher', industry: 'Technology', salaryNum: 7000, salary: '\u20b97,000/mo', grad: 'linear-gradient(135deg,#675df9,#c8bfff)' },
    { id: 9, title: 'Primary School Teacher', company: 'BrightMinds School', location: 'Pune', locType: 'On-site', type: 'Full-time', exp: 'Mid-level', industry: 'Education', salaryNum: 20000, salary: '\u20b920,000/mo', grad: 'linear-gradient(135deg,#2d6a4f,#4d41df)' },
    { id: 10, title: 'Senior Data Analyst', company: 'InsightCo', location: 'Remote', locType: 'Remote', type: 'Full-time', exp: 'Senior', industry: 'Technology', salaryNum: 55000, salary: '\u20b955,000/mo', grad: 'linear-gradient(135deg,#4d41df,#2d6a4f)' },
];

const _topCompanies = [
    { name: 'TechSeva', industry: 'Technology', tagline: 'Hiring freshers now!', color: '#4d41df', bg: 'rgba(77,65,223,0.10)', icon: 'computer' },
    { name: 'MediCare Plus', industry: 'Healthcare', tagline: 'Join our care team', color: '#c77dff', bg: 'rgba(199,125,255,0.10)', icon: 'health_and_safety' },
    { name: 'BrightMinds', industry: 'Education', tagline: 'Shape future leaders', color: '#2d6a4f', bg: 'rgba(45,106,79,0.10)', icon: 'school' },
    { name: 'FashionHub', industry: 'Retail', tagline: 'Style meets career', color: '#875041', bg: 'rgba(135,80,65,0.10)', icon: 'storefront' },
    { name: 'PixelWorks', industry: 'Design', tagline: 'Create. Inspire. Grow.', color: '#5c51a0', bg: 'rgba(92,81,160,0.10)', icon: 'palette' },
    { name: 'WordCraft', industry: 'Media', tagline: 'Words that matter', color: '#675df9', bg: 'rgba(103,93,249,0.10)', icon: 'edit_note' },
];

const _jobFilters = { type: new Set(), exp: new Set(), loc: new Set(), industry: new Set(), salary: new Set() };

function toggleJobFilters() {
    const panel = document.getElementById('job-filter-panel');
    const btn = document.getElementById('filter-toggle-btn');
    const isHidden = panel.classList.toggle('hidden');
    btn.style.background = isHidden ? '' : 'rgba(77,65,223,0.12)';
}
window.toggleJobFilters = toggleJobFilters;

function toggleFilter(group, value) {
    const set = _jobFilters[group];
    if (set.has(value)) set.delete(value); else set.add(value);
    // Update chip visual
    document.querySelectorAll(`.filter-chip[data-filter="${group}"][data-value="${value}"]`).forEach(btn => {
        const active = set.has(value);
        btn.style.background = active ? '#4d41df' : '';
        btn.style.color = active ? '#ffffff' : '';
        btn.style.fontWeight = active ? '700' : '';
        btn.style.boxShadow = active ? '0 0 0 2px #4d41df' : '';
    });
    applyJobFilters();
}
window.toggleFilter = toggleFilter;

function clearJobFilters() {
    Object.values(_jobFilters).forEach(s => s.clear());
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.style.background = '';
        btn.style.color = '';
        btn.style.fontWeight = '';
        btn.style.boxShadow = '';
    });
    const input = document.getElementById('job-search-input');
    if (input) input.value = '';
    applyJobFilters();
}
window.clearJobFilters = clearJobFilters;

function _salaryMatch(job, salarySet) {
    if (salarySet.size === 0) return true;
    const n = job.salaryNum;
    if (salarySet.has('under10') && n < 10000) return true;
    if (salarySet.has('10to20') && n >= 10000 && n <= 20000) return true;
    if (salarySet.has('20to40') && n > 20000 && n <= 40000) return true;
    if (salarySet.has('above40') && n > 40000) return true;
    return false;
}

function applyJobFilters() {
    const query = (document.getElementById('job-search-input')?.value || '').toLowerCase();
    const { type, exp, loc, industry, salary } = _jobFilters;

    const filtered = _allJobs.filter(job => {
        if (query && !`${job.title} ${job.company} ${job.location} ${job.industry}`.toLowerCase().includes(query)) return false;
        if (type.size && !type.has(job.type)) return false;
        if (exp.size && !exp.has(job.exp)) return false;
        if (loc.size && !loc.has(job.locType)) return false;
        if (industry.size && !industry.has(job.industry)) return false;
        if (!_salaryMatch(job, salary)) return false;
        return true;
    });

    _renderJobCards(filtered);

    // Also filter the Explore Companies section by query
    if (query) {
        _getAllRegisteredCompanies().then(all => {
            const companyMatch = all.filter(c =>
                (c.name + ' ' + c.industry + ' ' + c.location).toLowerCase().includes(query)
            );
            const sec = document.getElementById('jobs-company-section');
            if (sec) sec.style.display = companyMatch.length ? '' : 'none';
            if (companyMatch.length) renderJobsCompanies(companyMatch);
        });
    } else {
        const sec = document.getElementById('jobs-company-section');
        if (sec) sec.style.display = '';
        renderJobsCompanies();
    }
}
window.applyJobFilters = applyJobFilters;

function _renderJobCards(jobs) {
    const container = document.getElementById('jobs-list-container');
    const empty = document.getElementById('jobs-empty-state');
    const countEl = document.getElementById('jobs-count');
    if (!container) return;

    if (jobs.length === 0) {
        container.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        if (countEl) countEl.textContent = '';
        return;
    }
    if (empty) empty.classList.add('hidden');
    if (countEl) countEl.textContent = `${jobs.length} job${jobs.length !== 1 ? 's' : ''}`;

    const typeColor = t => t === 'Full-time' ? 'background:rgba(77,65,223,0.10);color:#4d41df'
        : t === 'Part-time' ? 'background:rgba(135,80,65,0.10);color:#875041'
            : t === 'Internship' ? 'background:rgba(92,81,160,0.10);color:#5c51a0'
                : 'background:rgba(45,106,79,0.10);color:#2d6a4f';

    const _dark = document.documentElement.classList.contains('dark-theme');
    const titleCol = _dark ? '#e8e6f4' : '#1b1b24';
    const subCol = _dark ? '#9e9bb8' : '#777587';

    container.innerHTML = jobs.map(job => {
        const initials = job.company.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        return `
        <div class="dash-job-card" onclick="openJobDetail(${job.id})" style="cursor:pointer">
            <div style="display:flex;align-items:flex-start;gap:12px">
                <div class="dash-job-avatar" style="background:${job.grad}">${initials}</div>
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                        <p style="font-size:14px;font-weight:700;color:${titleCol};line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${job.title}</p>
                        <button onclick="event.stopPropagation()" style="flex-shrink:0;width:30px;height:30px;border-radius:50%;background:rgba(77,65,223,0.08);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer">
                            <span class="material-symbols-outlined" style="font-size:16px;color:#4d41df">bookmark</span>
                        </button>
                    </div>
                    <p style="font-size:12px;color:${subCol};margin-top:2px">${job.company} &bull; ${job.location}</p>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap">
                        <span class="dash-job-badge" style="${typeColor(job.type)}">${job.type}</span>
                        <span class="dash-job-badge" style="background:rgba(56,161,105,0.10);color:#276749">${job.salary}</span>
                        <span class="dash-job-badge" style="background:rgba(119,117,135,0.08);color:${subCol}">${job.exp}</span>
                    </div>
                </div>
            </div>
            <button onclick="event.stopPropagation();openJobDetail(${job.id})" style="margin-top:12px;width:100%;height:38px;border-radius:10px;border:none;background:linear-gradient(135deg,#4d41df,#5c51a0);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif">Apply Now</button>
        </div>`;
    }).join('');
}

function renderJobsCompanies(prefiltered) {
    const container = document.getElementById('jobs-company-container');
    const countEl = document.getElementById('jobs-company-count');
    if (!container) return;
    const _dark = document.documentElement.classList.contains('dark-theme');
    const cardBg = _dark ? '#1c1b2e' : '#fff';
    const border = _dark ? '#2a2840' : '#eae6f3';
    const titleC = _dark ? '#e8e6f4' : '#1b1b24';
    const subC = _dark ? '#9e9bb8' : '#777587';
    const shadowN = _dark ? '0 2px 10px -4px rgba(0,0,0,0.5)' : '0 2px 10px -4px rgba(77,65,223,0.10)';
    const shadowH = _dark ? '0 6px 18px -4px rgba(0,0,0,0.7)' : '0 6px 18px -4px rgba(77,65,223,0.18)';
    const grads = ['linear-gradient(135deg,#4d41df,#675df9)', 'linear-gradient(135deg,#875041,#feb5a2)', 'linear-gradient(135deg,#5c51a0,#c8bfff)', 'linear-gradient(135deg,#2d6a4f,#74c69d)', 'linear-gradient(135deg,#c77dff,#7b2d8b)'];
    const openJobs = name => _allJobs.filter(j => j.company.toLowerCase() === name.toLowerCase()).length;

    _getAllRegisteredCompanies().then(all => {
        const preview = (prefiltered || all).slice(0, 8);
        if (countEl) countEl.textContent = '';
        container.innerHTML = preview.map((c, i) => {
            const initials = (c.name || 'C').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const grad = grads[i % grads.length];
            const jobs = openJobs(c.name);
            const isReg = !!c.uid;
            const safeName = c.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            return `<div onclick="openCompanyProfile('${safeName}')"
                style="flex-shrink:0;width:130px;background:${cardBg};border-radius:18px;padding:14px 12px;border:1px solid ${border};box-shadow:${shadowN};cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;text-align:center"
                onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='${shadowH}'"
                onmouseleave="this.style.transform='';this.style.boxShadow='${shadowN}'"
                ontouchstart="this.style.transform='scale(0.97)'" ontouchend="this.style.transform=''">
                ${c.logo
                    ? `<img src="${c.logo}" style="width:44px;height:44px;border-radius:12px;object-fit:cover;margin:0 auto 8px;display:block" onerror="this.style.display='none'"/>`
                    : `<div style="width:44px;height:44px;border-radius:12px;background:${grad};display:flex;align-items:center;justify-content:center;margin:0 auto 8px;font-size:16px;font-weight:800;color:#fff">${initials}</div>`}
                <p style="font-size:12px;font-weight:700;color:${titleC};line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name}</p>
                <p style="font-size:10px;color:${subC};margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.industry || ''}</p>
                <p style="font-size:10px;font-weight:600;color:#4d41df;margin-top:3px">${jobs} job${jobs !== 1 ? 's' : ''}</p>
                ${isReg ? '<span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:999px;background:rgba(45,106,79,0.12);color:#276749;display:inline-block;margin-top:3px">Registered</span>' : ''}
            </div>`;
        }).join('');
    });
}
window.renderJobsCompanies = renderJobsCompanies;
window.renderTopCompanies = renderJobsCompanies;

// ---- Full companies page ----

function openAllCompanies() {
    navigateTo('all-companies');
    setTimeout(renderAllCompanies, 100);
}
window.openAllCompanies = openAllCompanies;

function clearAllCompanyFilters() {
    const s = document.getElementById('all-companies-search');
    const ind = document.getElementById('all-companies-industry');
    const loc = document.getElementById('all-companies-location');
    if (s) s.value = '';
    if (ind) ind.value = '';
    if (loc) loc.value = '';
    renderAllCompanies();
}
window.clearAllCompanyFilters = clearAllCompanyFilters;

function renderAllCompanies() {
    const container = document.getElementById('all-companies-list');
    const countEl = document.getElementById('all-companies-count');
    if (!container) return;

    const query = (document.getElementById('all-companies-search')?.value || '').toLowerCase().trim();
    const industry = (document.getElementById('all-companies-industry')?.value || '').toLowerCase().trim();
    const location = (document.getElementById('all-companies-location')?.value || '').toLowerCase().trim();

    container.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:20px;background:rgba(77,65,223,0.05);border-radius:14px"><span class="material-symbols-outlined text-primary" style="font-size:20px;animation:spin 1s linear infinite">progress_activity</span><p style="font-size:13px;color:#777587">Loading companies...</p></div>';

    _getAllRegisteredCompanies().then(all => {
        let filtered = all;
        if (query) filtered = filtered.filter(c => (c.name + ' ' + c.industry + ' ' + c.location + ' ' + (c.tagline || '')).toLowerCase().includes(query));
        if (industry) filtered = filtered.filter(c => (c.industry || '').toLowerCase().includes(industry));
        if (location) filtered = filtered.filter(c => (c.location || '').toLowerCase().includes(location));

        if (countEl) countEl.textContent = filtered.length + ' compan' + (filtered.length === 1 ? 'y' : 'ies');

        if (filtered.length === 0) {
            container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;padding:48px 0;text-align:center"><div style="width:56px;height:56px;border-radius:50%;background:rgba(77,65,223,0.10);display:flex;align-items:center;justify-content:center;margin-bottom:12px"><span class="material-symbols-outlined" style="font-size:28px;color:#4d41df">domain_disabled</span></div><p style="font-size:14px;font-weight:700;color:#1b1b24">No companies found</p><p style="font-size:12px;color:#777587;margin-top:4px">Try different filters</p></div>';
            return;
        }

        const _dark = document.documentElement.classList.contains('dark-theme');
        const cardBg = _dark ? '#1c1b2e' : '#fff';
        const border = _dark ? '#2a2840' : '#eae6f3';
        const titleC = _dark ? '#e8e6f4' : '#1b1b24';
        const subC = _dark ? '#9e9bb8' : '#777587';
        const grads = ['linear-gradient(135deg,#4d41df,#675df9)', 'linear-gradient(135deg,#875041,#feb5a2)', 'linear-gradient(135deg,#5c51a0,#c8bfff)', 'linear-gradient(135deg,#2d6a4f,#74c69d)', 'linear-gradient(135deg,#c77dff,#7b2d8b)'];
        const openJobs = name => _allJobs.filter(j => j.company.toLowerCase() === name.toLowerCase()).length;

        container.innerHTML = filtered.map((c, i) => {
            const initials = (c.name || 'C').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const grad = grads[i % grads.length];
            const jobs = openJobs(c.name);
            const isReg = !!c.uid;
            const safeName = c.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            return `<div style="background:${cardBg};border-radius:18px;padding:16px;border:1px solid ${border};box-shadow:0 2px 12px -4px rgba(77,65,223,0.08);display:flex;align-items:center;gap:12px;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;active:scale-[0.98]"
                onclick="openCompanyProfile('${safeName}')"
                onmouseenter="this.style.transform='translateY(-1px)'" onmouseleave="this.style.transform=''">
                ${c.logo
                    ? `<img src="${c.logo}" style="width:48px;height:48px;border-radius:14px;object-fit:cover;flex-shrink:0" onerror="this.style.display='none'"/>`
                    : `<div style="width:48px;height:48px;border-radius:14px;background:${grad};display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;color:#fff;flex-shrink:0">${initials}</div>`}
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:6px">
                        <p style="font-size:14px;font-weight:700;color:${titleC};line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name}</p>
                        ${isReg ? '<span style="flex-shrink:0;font-size:10px;font-weight:700;padding:1px 7px;border-radius:999px;background:rgba(45,106,79,0.12);color:#276749">Registered</span>' : ''}
                    </div>
                    <p style="font-size:12px;color:${subC};margin-top:2px">${c.industry || ''}${c.location ? ' &bull; ' + c.location : ''}</p>
                    ${c.tagline ? `<p style="font-size:11px;color:#4d41df;font-weight:600;margin-top:2px">${c.tagline}</p>` : ''}
                </div>
                <div style="flex-shrink:0;text-align:right">
                    <p style="font-size:13px;font-weight:800;color:#4d41df">${jobs}</p>
                    <p style="font-size:10px;color:${subC}">job${jobs !== 1 ? 's' : ''}</p>
                </div>
            </div>`;
        }).join('');
    });
}
window.renderAllCompanies = renderAllCompanies;

function filterByCompany(name) {
    const input = document.getElementById('job-search-input');
    if (input) { input.value = name; applyJobFilters(); }
    // Scroll to job list
    document.getElementById('jobs-list-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.filterByCompany = filterByCompany;

function runAIMatch() {
    const btn = document.querySelector('#screen-jobs button[onclick="runAIMatch()"]');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.75'; }
    const section = document.getElementById('ai-match-section');
    const container = document.getElementById('ai-match-container');
    if (section) section.classList.remove('hidden');
    const _aiDark = document.documentElement.classList.contains('dark-theme');
    if (container) container.innerHTML = `<div style="display:flex;align-items:center;gap:10px;padding:16px;background:${_aiDark ? 'rgba(77,65,223,0.10)' : 'rgba(77,65,223,0.05)'};border-radius:14px"><span class="material-symbols-outlined text-primary" style="font-size:20px;animation:spin 1s linear infinite">progress_activity</span><p style="font-size:13px;color:${_aiDark ? '#9e9bb8' : '#777587'}">Analysing your profile for best matches...</p></div>`;

    const d = getProfileData();
    const skills = (d.skills || '').toLowerCase();

    setTimeout(() => {
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        // Pick relevant jobs based on profile skills, fallback to top 3
        let matched = _allJobs.filter(j => {
            if (!skills) return false;
            return skills.split(',').some(s => s.trim() && j.title.toLowerCase().includes(s.trim()));
        });
        if (matched.length === 0) matched = _allJobs.slice(0, 3);
        matched = matched.slice(0, 4);

        const scores = [98, 94, 89, 85];
        if (!container) return;
        const _d = document.documentElement.classList.contains('dark-theme');
        const _tc = _d ? '#e8e6f4' : '#1b1b24';
        const _sc = _d ? '#9e9bb8' : '#777587';
        container.innerHTML = matched.map((job, i) => {
            const initials = job.company.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const score = scores[i] || 80;
            return `
            <div class="dash-job-card" onclick="openJobDetail(${job.id})" style="border-left:3px solid #4d41df;cursor:pointer">
                <div style="display:flex;align-items:flex-start;gap:12px">
                    <div class="dash-job-avatar" style="background:${job.grad}">${initials}</div>
                    <div style="flex:1;min-width:0">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                            <p style="font-size:14px;font-weight:700;color:${_tc};line-height:1.3">${job.title}</p>
                            <span style="flex-shrink:0;font-size:11px;font-weight:700;color:#4d41df;background:rgba(77,65,223,0.12);padding:2px 8px;border-radius:999px">${score}% match</span>
                        </div>
                        <p style="font-size:12px;color:${_sc};margin-top:2px">${job.company} &bull; ${job.location}</p>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap">
                            <span class="dash-job-badge" style="background:rgba(77,65,223,0.10);color:#4d41df">${job.type}</span>
                            <span class="dash-job-badge" style="background:rgba(56,161,105,0.10);color:#276749">${job.salary}</span>
                        </div>
                    </div>
                </div>
                <button onclick="event.stopPropagation();openJobDetail(${job.id})" style="margin-top:12px;width:100%;height:38px;border-radius:10px;border:none;background:linear-gradient(135deg,#4d41df,#5c51a0);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif">Apply Now</button>
            </div>`;
        }).join('');
    }, 2000);
}
window.runAIMatch = runAIMatch;

function initJobsPage() {
    renderJobsCompanies();
    applyJobFilters();
}
window.initJobsPage = initJobsPage;

// ============================================================
// JOB DETAIL PAGE
// ============================================================

const _jobDetails = {
    1: {
        description: 'Craft India is looking for an experienced Tailoring Instructor to teach stitching, pattern-making, and garment construction to women learners. You will design lesson plans, conduct hands-on sessions, and help students build a career in the fashion industry.',
        requirements: ['Minimum 2 years of tailoring or teaching experience', 'Ability to communicate clearly in Hindi or local language', 'Patience and passion for teaching', 'Basic knowledge of fabric types and sewing machines'],
        skills: ['Tailoring', 'Pattern Making', 'Teaching', 'Communication', 'Fabric Knowledge'],
    },
    2: {
        description: 'TechSeva is hiring a Data Entry Operator to manage and update digital records accurately. You will work remotely, entering data into our systems, verifying information, and maintaining data quality standards.',
        requirements: ['Typing speed of at least 35 WPM', 'Basic computer literacy (MS Office / Google Sheets)', 'Attention to detail', 'Reliable internet connection for remote work'],
        skills: ['Data Entry', 'MS Excel', 'Google Sheets', 'Typing', 'Accuracy'],
    },
    3: {
        description: 'GlowUp Studio is seeking a freelance Beauty Consultant to provide personalised skincare and makeup advice to clients. You will conduct consultations, recommend products, and help clients build confidence through beauty.',
        requirements: ['Certification in beauty or cosmetology preferred', 'Strong interpersonal and communication skills', 'Knowledge of skincare and makeup trends', 'Ability to work flexible hours'],
        skills: ['Skincare', 'Makeup', 'Client Consultation', 'Communication', 'Product Knowledge'],
    },
    4: {
        description: 'CodeNest is looking for a Junior Web Developer to join our hybrid team. You will build and maintain web applications, collaborate with designers, and write clean, efficient code under the guidance of senior developers.',
        requirements: ['Basic knowledge of HTML, CSS, and JavaScript', 'Familiarity with React or any frontend framework is a plus', 'Ability to work in a team environment', 'Eagerness to learn and grow'],
        skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git'],
    },
    5: {
        description: 'MediCare Plus is hiring a Healthcare Assistant to support medical staff in delivering quality patient care. You will assist with patient monitoring, record-keeping, and ensuring a safe and comfortable environment.',
        requirements: ['Diploma or degree in healthcare or nursing preferred', 'Compassionate and patient-focused attitude', 'Ability to work in shifts', 'Basic knowledge of medical terminology'],
        skills: ['Patient Care', 'Medical Records', 'Communication', 'Empathy', 'First Aid'],
    },
    6: {
        description: 'WordCraft is looking for a freelance Content Writer to create engaging blog posts, social media content, and marketing copy. You will research topics, write original content, and meet deadlines consistently.',
        requirements: ['Strong written communication skills in English', 'Ability to research and write on diverse topics', 'Experience with SEO basics is a plus', 'Self-motivated and deadline-driven'],
        skills: ['Content Writing', 'SEO', 'Research', 'Editing', 'Creativity'],
    },
    7: {
        description: 'FashionHub is seeking a Senior Retail Store Manager to oversee daily operations, manage a team of sales associates, and drive revenue growth. You will ensure excellent customer experience and maintain store standards.',
        requirements: ['Minimum 4 years of retail management experience', 'Strong leadership and team management skills', 'Proven track record of meeting sales targets', 'Excellent customer service orientation'],
        skills: ['Retail Management', 'Team Leadership', 'Sales', 'Customer Service', 'Inventory Management'],
    },
    8: {
        description: 'PixelWorks is offering a UI/UX Design Internship for creative individuals passionate about digital design. You will assist in designing user interfaces, creating wireframes, and conducting user research under senior designers.',
        requirements: ['Basic knowledge of Figma or Adobe XD', 'Understanding of UI/UX principles', 'Portfolio of design work (academic or personal projects accepted)', 'Eagerness to learn and take feedback'],
        skills: ['Figma', 'UI Design', 'Wireframing', 'User Research', 'Creativity'],
    },
    9: {
        description: 'BrightMinds School is hiring a Primary School Teacher to educate students in foundational subjects. You will create engaging lesson plans, assess student progress, and foster a positive learning environment.',
        requirements: ['B.Ed or equivalent teaching qualification', 'Minimum 1 year of teaching experience', 'Strong communication and classroom management skills', 'Passion for child development and education'],
        skills: ['Teaching', 'Lesson Planning', 'Classroom Management', 'Communication', 'Child Development'],
    },
    10: {
        description: 'InsightCo is looking for a Senior Data Analyst to transform complex datasets into actionable business insights. You will build dashboards, conduct statistical analysis, and present findings to leadership teams.',
        requirements: ['3+ years of data analysis experience', 'Proficiency in SQL, Python, or R', 'Experience with BI tools like Tableau or Power BI', 'Strong analytical and problem-solving skills'],
        skills: ['SQL', 'Python', 'Tableau', 'Data Analysis', 'Statistics', 'Power BI'],
    },
};

let _currentJobId = null;

function openJobDetail(jobId) {
    const job = _allJobs.find(j => j.id === jobId);
    if (!job) return;
    _currentJobId = jobId;
    const detail = _jobDetails[jobId] || {
        description: `${job.title} at ${job.company}. Join our team and grow your career in a supportive environment.`,
        requirements: ['Relevant experience or qualification', 'Good communication skills', 'Willingness to learn'],
        skills: [job.type, job.industry, job.exp],
    };

    // Hero card gradient
    const hero = document.getElementById('jd-hero-card');
    if (hero) hero.style.background = job.grad;

    // Avatar initials
    const avatar = document.getElementById('jd-avatar');
    if (avatar) avatar.textContent = job.company.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    document.getElementById('jd-company').textContent = job.company;
    document.getElementById('jd-title').textContent = job.title;
    document.getElementById('jd-type-badge').textContent = job.type;
    document.getElementById('jd-loc-badge').textContent = job.locType;
    document.getElementById('jd-exp-badge').textContent = job.exp;
    document.getElementById('jd-salary').textContent = job.salary;
    document.getElementById('jd-location').textContent = job.location;
    document.getElementById('jd-industry').textContent = job.industry;
    document.getElementById('jd-description').textContent = detail.description;

    // Requirements list
    const reqEl = document.getElementById('jd-requirements');
    reqEl.innerHTML = detail.requirements.map(r => `
        <li style="display:flex;align-items:flex-start;gap:8px">
            <span class="material-symbols-outlined text-primary" style="font-size:16px;margin-top:1px;flex-shrink:0;font-variation-settings:'FILL' 1">check_circle</span>
            <span style="font-size:13px;color:#464555;line-height:1.5">${r}</span>
        </li>`).join('');

    // Skills chips
    const skillsEl = document.getElementById('jd-skills');
    skillsEl.innerHTML = detail.skills.map(s => `
        <span style="font-size:12px;font-weight:600;padding:5px 12px;border-radius:999px;background:rgba(77,65,223,0.10);color:#4d41df">${s}</span>`).join('');

    // Reset apply button
    const applyBtn = document.getElementById('jd-apply-btn');
    if (applyBtn) { applyBtn.disabled = false; applyBtn.style.opacity = '1'; applyBtn.onclick = function () { openJobApplyForm(); }; applyBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1">send</span> Apply Now'; }

    // Bookmark state
    const apps = JSON.parse(localStorage.getItem(_appsKey()) || '[]');
    const alreadyApplied = apps.some(a => a.jobId === jobId);
    if (alreadyApplied) {
        if (applyBtn) { applyBtn.disabled = true; applyBtn.style.opacity = '0.7'; applyBtn.onclick = null; applyBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1">check_circle</span> Already Applied'; }
    }

    navigateTo('job-detail');
}
window.openJobDetail = openJobDetail;

function submitJobApplication() {
    const job = _allJobs.find(j => j.id === _currentJobId);
    if (!job) return;

    const applyBtn = document.getElementById('jd-apply-btn');
    if (applyBtn) { applyBtn.disabled = true; applyBtn.style.opacity = '0.7'; applyBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1;animation:spin 1s linear infinite">progress_activity</span> Submitting...'; }

    setTimeout(() => {
        // Save to applications
        const apps = JSON.parse(localStorage.getItem(_appsKey()) || '[]');
        const alreadyApplied = apps.some(a => a.jobId === job.id);
        if (!alreadyApplied) {
            apps.unshift({
                jobId: job.id,
                title: job.title,
                company: job.company,
                location: job.location,
                salary: job.salary,
                type: job.type,
                grad: job.grad,
                appliedAt: new Date().toISOString(),
                status: 'Applied',
            });
            localStorage.setItem(_appsKey(), JSON.stringify(apps));
            earnCoins(20, `Applied to ${job.title}`);
            checkAndAwardBadges();
        }

        // Add notification
        addNotification('application', `Applied to ${job.title}`, `Your application to ${job.company} has been submitted successfully.`);

        // Show success toast
        const toast = document.getElementById('jd-success-toast');
        const toastJob = document.getElementById('jd-toast-job');
        if (toastJob) toastJob.textContent = `${job.title} at ${job.company}`;
        if (toast) toast.classList.remove('hidden');

        if (applyBtn) { applyBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1">check_circle</span> Already Applied'; }
    }, 1200);
}
window.submitJobApplication = submitJobApplication;

function closeJobToast() {
    const toast = document.getElementById('jd-success-toast');
    if (toast) toast.classList.add('hidden');
    navigateTo('jobs');
}
window.closeJobToast = closeJobToast;

function toggleJobBookmark() {
    const icon = document.getElementById('jd-bookmark-icon');
    if (!icon) return;
    const filled = icon.style.fontVariationSettings && icon.style.fontVariationSettings.includes('1');
    icon.style.fontVariationSettings = filled ? "'FILL' 0" : "'FILL' 1";
}
window.toggleJobBookmark = toggleJobBookmark;

// ============================================================
// JOB APPLICATION FORM
// ============================================================

function openJobApplyForm() {
    const job = _allJobs.find(j => j.id === _currentJobId);
    if (!job) return;

    // Pre-fill from profile
    const d = getProfileData();
    const user = auth.currentUser;
    const el = id => document.getElementById(id);

    el('af-name').value = d.name || (user && user.displayName) || '';
    el('af-email').value = (user && user.email) || '';
    el('af-phone').value = d.phone || '';
    el('af-street').value = '';
    el('af-city').value = (d.location || '').split(',')[0]?.trim() || '';
    el('af-state').value = (d.location || '').split(',')[1]?.trim() || '';
    el('af-pincode').value = '';
    el('af-education').value = d.education || '';
    el('af-experience').value = d.experience || 'Fresher';
    el('af-skills').value = d.skills || '';
    el('af-notes').value = '';
    el('af-resume-label').textContent = d.resumeName ? d.resumeName : 'Upload PDF / DOC';

    // Job summary card
    el('apply-job-title').textContent = job.title;
    el('apply-job-company').textContent = job.company + ' \u00b7 ' + job.location;
    el('apply-job-type').textContent = job.type;
    el('apply-form-subtitle').textContent = job.company;
    const avatar = el('apply-job-avatar');
    if (avatar) {
        avatar.textContent = job.company.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        avatar.style.background = job.grad;
    }

    // Reset error + button
    const errEl = el('af-error');
    if (errEl) errEl.classList.add('hidden');
    const btn = el('af-submit-btn');
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1">send</span> Submit Application'; }

    navigateTo('job-apply');
}
window.openJobApplyForm = openJobApplyForm;

function handleApplyResumeChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    const label = document.getElementById('af-resume-label');
    if (label) label.textContent = file.name;
}
window.handleApplyResumeChange = handleApplyResumeChange;

function finalSubmitApplication() {
    const job = _allJobs.find(j => j.id === _currentJobId);
    if (!job) return;

    const el = id => document.getElementById(id);
    const errEl = el('af-error');
    const btn = el('af-submit-btn');

    // Collect values
    const name = el('af-name').value.trim();
    const email = el('af-email').value.trim();
    const phone = el('af-phone').value.trim();
    const street = el('af-street').value.trim();
    const city = el('af-city').value.trim();
    const state = el('af-state').value.trim();
    const pincode = el('af-pincode').value.trim();
    const edu = el('af-education').value;
    const skills = el('af-skills').value.trim();
    const exp = el('af-experience').value;
    const notes = el('af-notes').value.trim();
    const resumeFile = el('af-resume').files[0];

    // Validate
    if (!name || !email || !phone || !street || !city || !state || !pincode || !edu || !skills) {
        if (errEl) { errEl.textContent = 'Please fill in all required fields.'; errEl.classList.remove('hidden'); }
        return;
    }
    if (!/^\d{10,13}$/.test(phone)) {
        if (errEl) { errEl.textContent = 'Enter a valid phone number (10\u201313 digits).'; errEl.classList.remove('hidden'); }
        return;
    }
    if (!/^\d{6}$/.test(pincode)) {
        if (errEl) { errEl.textContent = 'Enter a valid 6-digit pincode.'; errEl.classList.remove('hidden'); }
        return;
    }
    if (errEl) errEl.classList.add('hidden');

    // Loading state
    if (btn) { btn.disabled = true; btn.style.opacity = '0.75'; btn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1;animation:spin 1s linear infinite">progress_activity</span> Submitting...'; }

    const user = auth.currentUser;

    const doSave = (resumeName) => {
        const apps = JSON.parse(localStorage.getItem(_appsKey()) || '[]');
        const alreadyApplied = apps.some(a => a.jobId === job.id);
        if (!alreadyApplied) {
            apps.unshift({
                jobId: job.id,
                userId: user ? user.uid : 'guest',
                companyId: job.company.toLowerCase().replace(/\s+/g, '_'),
                title: job.title,
                company: job.company,
                location: job.location,
                salary: job.salary,
                type: job.type,
                industry: job.industry,
                grad: job.grad,
                appliedAt: new Date().toISOString(),
                status: 'Applied',
                applicant: { name, email, phone, address: `${street}, ${city}, ${state} - ${pincode}`, education: edu, experience: exp, skills, notes, resumeName: resumeName || '' },
            });
            localStorage.setItem(_appsKey(), JSON.stringify(apps));
            earnCoins(20, `Applied to ${job.title}`);
            checkAndAwardBadges();
        }

        addNotification('application', `Applied to ${job.title}`, `Your application to ${job.company} has been submitted successfully.`);

        // Update apply button on detail page
        const applyBtn = document.getElementById('jd-apply-btn');
        if (applyBtn) { applyBtn.disabled = true; applyBtn.style.opacity = '0.7'; applyBtn.onclick = null; applyBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1">check_circle</span> Already Applied'; }

        // Show success toast (on job detail screen)
        const toast = document.getElementById('jd-success-toast');
        const toastJob = document.getElementById('jd-toast-job');
        if (toastJob) toastJob.textContent = `${job.title} at ${job.company}`;

        // Navigate to job-detail first so toast is visible there
        navigateTo('job-detail');
        setTimeout(() => { if (toast) toast.classList.remove('hidden'); }, 150);
    };

    setTimeout(() => {
        if (resumeFile) {
            const reader = new FileReader();
            reader.onload = () => doSave(resumeFile.name);
            reader.readAsDataURL(resumeFile);
        } else {
            doSave('');
        }
    }, 1000);
}
window.finalSubmitApplication = finalSubmitApplication;

// ============================================================
// MY APPLICATIONS SCREEN
// ============================================================

function loadApplicationsScreen() {
    const container = document.getElementById('applications-list-container');
    if (!container) return;

    const apps = JSON.parse(localStorage.getItem(_appsKey()) || '[]');

    if (apps.length === 0) {
        container.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 0;text-align:center">
                <div style="width:64px;height:64px;border-radius:50%;background:rgba(77,65,223,0.10);display:flex;align-items:center;justify-content:center;margin-bottom:16px">
                    <span class="material-symbols-outlined" style="font-size:32px;color:#4d41df;font-variation-settings:'FILL' 1">work_history</span>
                </div>
                <p style="font-size:15px;font-weight:700;color:#1b1b24">No applications yet</p>
                <p style="font-size:13px;color:#777587;margin-top:4px">Start applying to jobs to track them here</p>
                <button onclick="navigateTo('jobs')" style="margin-top:16px;padding:10px 24px;border-radius:999px;border:none;background:linear-gradient(135deg,#4d41df,#5c51a0);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif">Browse Jobs</button>
            </div>`;
        return;
    }

    const statusStyle = s => s === 'Applied'
        ? 'background:rgba(77,65,223,0.10);color:#4d41df'
        : s === 'Reviewed'
            ? 'background:rgba(45,106,79,0.10);color:#276749'
            : s === 'Shortlisted'
                ? 'background:rgba(92,81,160,0.10);color:#5c51a0'
                : 'background:rgba(135,80,65,0.10);color:#875041';

    container.innerHTML = apps.map((app, idx) => {
        const initials = app.company.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const date = new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        return `
        <div style="background:#fff;border-radius:18px;padding:16px;border:1px solid #eae6f3;box-shadow:0 2px 12px -4px rgba(77,65,223,0.08);margin-bottom:12px">
            <div style="display:flex;align-items:flex-start;gap:12px">
                <div style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#fff;flex-shrink:0;background:${app.grad || 'linear-gradient(135deg,#4d41df,#5c51a0)'}">${initials}</div>
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                        <div style="flex:1;min-width:0">
                            <p style="font-size:14px;font-weight:700;color:#1b1b24;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${app.title}</p>
                            <p style="font-size:12px;color:#777587;margin-top:2px">${app.company} &bull; ${app.location}</p>
                        </div>
                        <span style="flex-shrink:0;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;${statusStyle(app.status)}">${app.status}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap">
                        <span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:rgba(77,65,223,0.08);color:#4d41df">${app.type || ''}</span>
                        <span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:rgba(56,161,105,0.08);color:#276749">${app.salary || ''}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:4px;margin-top:8px">
                        <span class="material-symbols-outlined" style="font-size:13px;color:#9e9bb8">calendar_today</span>
                        <p style="font-size:11px;color:#9e9bb8">Applied on ${date}</p>
                    </div>
                </div>
            </div>
            ${app.applicant ? `
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid #f0ecf9">
                <p style="font-size:11px;font-weight:600;color:#9e9bb8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Applicant Details</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px">
                    <p style="font-size:12px;color:#464555"><span style="color:#9e9bb8">Name:</span> ${app.applicant.name}</p>
                    <p style="font-size:12px;color:#464555"><span style="color:#9e9bb8">Phone:</span> ${app.applicant.phone}</p>
                    <p style="font-size:12px;color:#464555;grid-column:1/-1"><span style="color:#9e9bb8">Education:</span> ${app.applicant.education}</p>
                    <p style="font-size:12px;color:#464555;grid-column:1/-1"><span style="color:#9e9bb8">Experience:</span> ${app.applicant.experience}</p>
                </div>
            </div>` : ''}
        </div>`;
    }).join('');
}
window.loadApplicationsScreen = loadApplicationsScreen;

// ============================================================
// BACK NAVIGATION ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â My Applications
// ============================================================

function goBackFromApplications() {
    // Pop the last screen from the stack; fall back to dashboard
    const prev = _navStack.length > 0 ? _navStack.pop() : 'dashboard';
    // Never go back to login or another no-nav screen that doesn't make sense
    const safe = ['dashboard', 'jobs', 'job-detail', 'profile', 'shop', 'my-shop', 'cart'].includes(prev) ? prev : 'dashboard';
    navigateTo(safe);
}
window.goBackFromApplications = goBackFromApplications;

// Hardware back button / Android back gesture support
window.addEventListener('popstate', (e) => {
    const activeScreen = document.querySelector('.screen.active');
    if (!activeScreen) return;
    const screenId = activeScreen.id.replace('screen-', '');
    // If on applications, use our custom back logic
    if (screenId === 'applications') {
        e.preventDefault();
        goBackFromApplications();
        // Push a new state so the next back press is handled again
        history.pushState({ screen: screenId }, '', window.location.pathname);
    }
});

// Push a state entry whenever we navigate so popstate fires on back gesture
const _origNavigateTo = navigateTo;
// Wrap navigateTo to also push browser history state (enables swipe-back on mobile)
(function () {
    const _orig = window.navigateTo;
    window.navigateTo = function (screenId) {
        _orig(screenId);
        if (screenId !== 'login') {
            history.pushState({ screen: screenId }, '', window.location.pathname);
        }
    };
})();

// ============================================================
// SKILL HUB PAGE
// ============================================================

const _skillCategories = [
    { name: 'Design', icon: 'palette', color: '#5c51a0', bg: 'rgba(92,81,160,0.12)', grad: 'linear-gradient(135deg,#5c51a0,#c8bfff)' },
    { name: 'Development', icon: 'code', color: '#4d41df', bg: 'rgba(77,65,223,0.12)', grad: 'linear-gradient(135deg,#4d41df,#675df9)' },
    { name: 'Marketing', icon: 'campaign', color: '#875041', bg: 'rgba(135,80,65,0.12)', grad: 'linear-gradient(135deg,#875041,#feb5a2)' },
    { name: 'Finance', icon: 'payments', color: '#276749', bg: 'rgba(45,106,79,0.12)', grad: 'linear-gradient(135deg,#276749,#74c69d)' },
    { name: 'Communication', icon: 'forum', color: '#675df9', bg: 'rgba(103,93,249,0.12)', grad: 'linear-gradient(135deg,#675df9,#c4c0ff)' },
    { name: 'Business', icon: 'business_center', color: '#c77dff', bg: 'rgba(199,125,255,0.12)', grad: 'linear-gradient(135deg,#c77dff,#e5deff)' },
    { name: 'Basics', icon: 'lightbulb', color: '#e63946', bg: 'rgba(230,57,70,0.10)', grad: 'linear-gradient(135deg,#e63946,#ffb3b8)' },
    { name: 'Smartphone', icon: 'smartphone', color: '#4d41df', bg: 'rgba(77,65,223,0.12)', grad: 'linear-gradient(135deg,#4d41df,#5c51a0)' },
];
const _allCourses = [
    // â”€â”€ English courses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    { id: 1, ytId: 'dU1xS07N-FA', title: 'Figma for Beginners', instructor: 'DesignCraft', category: 'Design', level: 'Beginner', durLabel: '1.5h', durKey: 'short', type: 'Free', rating: 4.8, enrolled: 3200, lang: 'en', tags: ['figma', 'ui', 'design', 'wireframe'], desc: 'Learn UI design fundamentals using Figma from wireframes to polished prototypes.' },
    { id: 2, ytId: 'w7ejDZ8SWv8', title: 'React.js Essentials', instructor: 'CodeNest', category: 'Development', level: 'Intermediate', durLabel: '4h', durKey: 'medium', type: 'Free', rating: 4.7, enrolled: 5100, lang: 'en', tags: ['react', 'javascript', 'web', 'frontend'], desc: 'Build modern web apps with React hooks, components, and state management.' },
    { id: 3, ytId: 'nU-IIXBWlS4', title: 'Digital Marketing Masterclass', instructor: 'GrowthLab', category: 'Marketing', level: 'Beginner', durLabel: '3h', durKey: 'medium', type: 'Paid', rating: 4.6, enrolled: 2800, lang: 'en', tags: ['marketing', 'seo', 'social media', 'ads'], desc: 'Master SEO, social media, email campaigns, and paid ads from scratch.' },
    { id: 4, ytId: 'HQzoZfc3GwQ', title: 'Personal Finance Basics', instructor: 'MoneyWise', category: 'Finance', level: 'Beginner', durLabel: '1h', durKey: 'short', type: 'Free', rating: 4.9, enrolled: 7400, lang: 'en', tags: ['finance', 'budget', 'savings', 'money'], desc: 'Understand budgeting, savings, investments, and financial planning for everyday life.' },
    { id: 5, ytId: 'tShavGuo0_E', title: 'Public Speaking Confidence', instructor: 'SpeakUp India', category: 'Communication', level: 'Beginner', durLabel: '2h', durKey: 'short', type: 'Free', rating: 4.5, enrolled: 1900, lang: 'en', tags: ['speaking', 'confidence', 'communication'], desc: 'Overcome stage fear and communicate with clarity, confidence, and impact.' },
    { id: 6, ytId: 'Fqch5OrUPvA', title: 'Business Plan Writing', instructor: 'StartupSchool', category: 'Business', level: 'Intermediate', durLabel: '2.5h', durKey: 'medium', type: 'Paid', rating: 4.7, enrolled: 1500, lang: 'en', tags: ['business', 'plan', 'startup', 'entrepreneur'], desc: 'Write a compelling business plan that attracts investors and guides your startup.' },
    { id: 7, ytId: '1Rs2ND1ryYc', title: 'Advanced CSS and Animations', instructor: 'PixelWorks', category: 'Development', level: 'Advanced', durLabel: '6h', durKey: 'long', type: 'Paid', rating: 4.6, enrolled: 2100, lang: 'en', tags: ['css', 'animation', 'web', 'frontend'], desc: 'Deep-dive into CSS Grid, Flexbox, custom animations, and responsive design patterns.' },
    { id: 8, ytId: 'p7HKvqRI_Bo', title: 'Stock Market for Women', instructor: 'InvestHer', category: 'Finance', level: 'Beginner', durLabel: '3h', durKey: 'medium', type: 'Paid', rating: 4.8, enrolled: 3300, lang: 'en', tags: ['stocks', 'invest', 'finance', 'wealth'], desc: 'Demystify the stock market and learn how to invest smartly and build long-term wealth.' },
    { id: 9, ytId: '0JCUH5daCCE', title: 'Brand Identity Design', instructor: 'DesignCraft', category: 'Design', level: 'Intermediate', durLabel: '5h', durKey: 'long', type: 'Paid', rating: 4.7, enrolled: 1800, lang: 'en', tags: ['brand', 'logo', 'design', 'identity'], desc: 'Create powerful brand identities with logos, colour palettes, typography, and style guides.' },
    { id: 10, ytId: 'r-uWLhO2v9U', title: 'Python for Data Analysis', instructor: 'DataSeva', category: 'Development', level: 'Intermediate', durLabel: '8h', durKey: 'long', type: 'Free', rating: 4.9, enrolled: 6200, lang: 'en', tags: ['python', 'data', 'analysis', 'pandas'], desc: 'Use Python, Pandas, and Matplotlib to analyse real-world datasets and visualise insights.' },
    { id: 11, ytId: 'sPW9r5NDLSE', title: 'Effective Email Writing', instructor: 'SpeakUp India', category: 'Communication', level: 'Beginner', durLabel: '45min', durKey: 'short', type: 'Free', rating: 4.4, enrolled: 980, lang: 'en', tags: ['email', 'writing', 'communication', 'office'], desc: 'Write professional emails that get responses - structure, tone, and etiquette covered.' },
    { id: 12, ytId: 'ZpL0oGFBsDg', title: 'Entrepreneurship 101', instructor: 'StartupSchool', category: 'Business', level: 'Beginner', durLabel: '4h', durKey: 'medium', type: 'Free', rating: 4.6, enrolled: 4100, lang: 'en', tags: ['entrepreneur', 'startup', 'business', 'idea'], desc: 'From idea to execution - learn the mindset, tools, and steps to launch your own venture.' },
    { id: 13, ytId: 'Ks-_Mh1QhMc', title: 'How to Use a Smartphone', instructor: 'TechSaathi', category: 'Smartphone', level: 'Beginner', durLabel: '30min', durKey: 'short', type: 'Free', rating: 4.9, enrolled: 8200, lang: 'en', tags: ['smartphone', 'mobile', 'apps', 'beginner'], desc: 'Simple step-by-step guide to using a smartphone - calls, messages, apps, and internet.' },
    { id: 14, ytId: 'mP_ZMmgFHPY', title: 'Internet Basics for Beginners', instructor: 'TechSaathi', category: 'Basics', level: 'Beginner', durLabel: '25min', durKey: 'short', type: 'Free', rating: 4.8, enrolled: 6100, lang: 'en', tags: ['internet', 'basics', 'google', 'whatsapp'], desc: 'Learn what the internet is, how to browse safely, and use Google and WhatsApp.' },
    { id: 15, ytId: 'VvCytJvd4H0', title: 'Basic Computer Skills', instructor: 'DigiLearn', category: 'Basics', level: 'Beginner', durLabel: '40min', durKey: 'short', type: 'Free', rating: 4.7, enrolled: 5400, lang: 'en', tags: ['computer', 'basics', 'typing', 'files'], desc: 'Learn to use a computer from scratch - typing, files, and basic applications.' },
    { id: 16, ytId: 'eIho2S0ZahI', title: 'How to Start a Small Business', instructor: 'StartupSchool', category: 'Basics', level: 'Beginner', durLabel: '35min', durKey: 'short', type: 'Free', rating: 4.8, enrolled: 4900, lang: 'en', tags: ['business', 'small', 'startup', 'basics'], desc: 'Simple guide to starting your own small business with little money and big ideas.' },
    { id: 17, ytId: 'tShavGuo0_E', title: 'Simple Communication Skills', instructor: 'SpeakUp India', category: 'Basics', level: 'Beginner', durLabel: '20min', durKey: 'short', type: 'Free', rating: 4.6, enrolled: 3800, lang: 'en', tags: ['communication', 'speaking', 'basics', 'soft'], desc: 'Learn to speak clearly and confidently in everyday situations at home and work.' },
    { id: 18, ytId: 'Ks-_Mh1QhMc', title: 'WhatsApp and Video Calls Guide', instructor: 'TechSaathi', category: 'Smartphone', level: 'Beginner', durLabel: '20min', durKey: 'short', type: 'Free', rating: 4.9, enrolled: 7100, lang: 'en', tags: ['whatsapp', 'video call', 'smartphone', 'chat'], desc: 'Learn to use WhatsApp, make video calls, and share photos with family and friends.' },
    { id: 19, ytId: 'HQzoZfc3GwQ', title: 'Save Money Every Day', instructor: 'MoneyWise', category: 'Finance', level: 'Beginner', durLabel: '18min', durKey: 'short', type: 'Free', rating: 4.7, enrolled: 5200, lang: 'en', tags: ['savings', 'money', 'budget', 'daily'], desc: 'Easy tips to save money from your daily income and build a small emergency fund.' },
    { id: 20, ytId: '1Rs2ND1ryYc', title: 'Basic Sewing and Tailoring', instructor: 'CraftIndia', category: 'Basics', level: 'Beginner', durLabel: '45min', durKey: 'short', type: 'Free', rating: 4.8, enrolled: 4300, lang: 'en', tags: ['sewing', 'tailoring', 'stitching', 'craft'], desc: 'Learn basic hand stitching and simple tailoring skills to make and repair clothes.' },
    // â”€â”€ Hindi courses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    { id: 21, ytId: 'BVbFHfFgFcE', title: 'Silai Machine Chalana Sikhe', instructor: 'Sewing Duniya', category: 'Basics', level: 'Beginner', durLabel: '40min', durKey: 'short', type: 'Free', rating: 4.9, enrolled: 9100, lang: 'hi', tags: ['silai', 'machine', 'stitching', 'hindi', 'sewing'], desc: 'Silai machine ka basic istemal Hindi mein seekhein, bilkul shuruaat se.' },
    { id: 22, ytId: '7Gy_OkFbSKQ', title: 'Kapde Ki Cutting aur Silai', instructor: 'Sewing Duniya', category: 'Basics', level: 'Beginner', durLabel: '35min', durKey: 'short', type: 'Free', rating: 4.8, enrolled: 7600, lang: 'hi', tags: ['kapde', 'cutting', 'silai', 'tailoring', 'hindi'], desc: 'Ghar par kapde ki cutting aur silai karna seekhein, step by step Hindi mein.' },
    { id: 23, ytId: '8jPQjjsBbIc', title: 'Paise Kaise Bachaye - Hindi', instructor: 'Yadnya Academy', category: 'Finance', level: 'Beginner', durLabel: '20min', durKey: 'short', type: 'Free', rating: 4.7, enrolled: 6200, lang: 'hi', tags: ['paise', 'bachana', 'savings', 'finance', 'hindi'], desc: 'Roz ki kamaai mein se paise kaise bachayein, simple aur practical tips Hindi mein.' },
    { id: 24, ytId: 'qeMFqkcPYcg', title: 'Smartphone Tips aur Tricks Hindi', instructor: 'Technical Guruji', category: 'Smartphone', level: 'Beginner', durLabel: '25min', durKey: 'short', type: 'Free', rating: 4.9, enrolled: 8800, lang: 'hi', tags: ['smartphone', 'tips', 'mobile', 'hindi', 'android'], desc: 'Apne smartphone ko better tarike se use karna seekhein, Hindi mein.' },
    { id: 25, ytId: '7lECIsRif0U', title: 'Apna Business Kaise Shuru Karein', instructor: 'Josh Talks Hindi', category: 'Business', level: 'Beginner', durLabel: '30min', durKey: 'short', type: 'Free', rating: 4.8, enrolled: 5400, lang: 'hi', tags: ['business', 'startup', 'kaam', 'hindi', 'entrepreneur'], desc: 'Khud ka chota business shuru karne ke liye zaruri steps, Hindi mein.' },
    { id: 26, ytId: 'BVbFHfFgFcE', title: 'Haath ki Silai Basics - Hindi', instructor: 'Sewing Duniya', category: 'Basics', level: 'Beginner', durLabel: '45min', durKey: 'short', type: 'Free', rating: 4.9, enrolled: 7200, lang: 'hi', tags: ['haath', 'silai', 'stitching', 'basics', 'hindi'], desc: 'Haath se silai karna seekhein, basic stitches aur techniques Hindi mein.' },
    { id: 27, ytId: '4deVAL4yphE', title: 'Computer Basics Hindi Mein', instructor: 'LearnVern', category: 'Basics', level: 'Beginner', durLabel: '40min', durKey: 'short', type: 'Free', rating: 4.7, enrolled: 5900, lang: 'hi', tags: ['computer', 'basics', 'hindi', 'typing', 'files'], desc: 'Computer chalana Hindi mein seekhein, typing, files aur basic applications.' },
];
const _skillFilters = { cat: new Set(), level: new Set(), dur: new Set(), type: new Set(), lang: new Set() };

function toggleSkillFilters() {
    const panel = document.getElementById('skill-filter-panel');
    const btn = document.getElementById('skill-filter-btn');
    const hidden = panel.classList.toggle('hidden');
    btn.style.background = hidden ? '' : 'rgba(77,65,223,0.12)';
}
window.toggleSkillFilters = toggleSkillFilters;

function toggleSkillFilter(group, value) {
    const set = _skillFilters[group];
    if (set.has(value)) set.delete(value); else set.add(value);
    document.querySelectorAll(`.skill-chip[data-sf="${group}"][data-sv="${value}"]`).forEach(btn => {
        const on = set.has(value);
        btn.style.background = on ? '#4d41df' : '';
        btn.style.color = on ? '#ffffff' : '';
        btn.style.fontWeight = on ? '700' : '';
        btn.style.boxShadow = on ? '0 0 0 2px #4d41df' : '';
    });
    applySkillFilters();
}
window.toggleSkillFilter = toggleSkillFilter;

function clearSkillFilters() {
    Object.values(_skillFilters).forEach(s => s.clear());
    document.querySelectorAll('.skill-chip').forEach(b => { b.style.background = ''; b.style.color = ''; b.style.fontWeight = ''; b.style.boxShadow = ''; });
    const _ls = document.getElementById('skill-lang-select'); if (_ls) _ls.value = '';
    const inp = document.getElementById('skill-search-input');
    if (inp) inp.value = '';
    applySkillFilters();
}
window.clearSkillFilters = clearSkillFilters;

function applySkillFilters() {
    const q = (document.getElementById('skill-search-input')?.value || '').toLowerCase();
    const _langDrop = document.getElementById('skill-lang-select')?.value || '';
    if (_langDrop) { _skillFilters.lang.clear(); _skillFilters.lang.add(_langDrop); } else if (!_skillFilters.lang.size) { _skillFilters.lang.clear(); }
    const { cat, level, dur, type, lang } = _skillFilters;
    const filtered = _allCourses.filter(c => {
        if (q && !`${c.title} ${c.instructor} ${c.category} ${(c.tags || []).join(' ')}`.toLowerCase().includes(q)) return false;
        if (cat.size && !cat.has(c.category)) return false;
        if (level.size && !level.has(c.level)) return false;
        if (dur.size && !dur.has(c.durKey)) return false;
        if (type.size && !type.has(c.type)) return false;
        if (lang.size && !lang.has(c.lang)) return false;
        return true;
    });
    _renderCourseCards(filtered);
}
window.applySkillFilters = applySkillFilters;

function _renderCourseCards(courses) {
    const container = document.getElementById('skill-courses-container');
    const empty = document.getElementById('skill-empty-state');
    const countEl = document.getElementById('skill-courses-count');
    if (!container) return;
    if (courses.length === 0) {
        container.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        if (countEl) countEl.textContent = '';
        return;
    }
    if (empty) empty.classList.add('hidden');
    if (countEl) countEl.textContent = courses.length + ' course' + (courses.length !== 1 ? 's' : '');
    _renderCourseCardsInto(container, courses);
}

function openCourseVideo(courseId) {
    const course = _allCourses.find(c => c.id === courseId);
    if (!course) return;
    const modal = document.getElementById('course-video-modal');
    const iframe = document.getElementById('course-video-iframe');
    const titleEl = document.getElementById('course-video-title');
    const metaEl = document.getElementById('course-video-meta');
    if (!modal || !iframe) return;
    if (titleEl) titleEl.textContent = course.title;
    if (metaEl) metaEl.textContent = course.instructor + ' \u2022 ' + course.category + ' \u2022 ' + course.durLabel;
    iframe.src = 'https://www.youtube.com/embed/' + course.ytId + '?autoplay=1&rel=0&modestbranding=1';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    enrollCourse(courseId);
}
window.openCourseVideo = openCourseVideo;

function closeCourseVideo() {
    const modal = document.getElementById('course-video-modal');
    const iframe = document.getElementById('course-video-iframe');
    if (iframe) iframe.src = '';
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
}
window.closeCourseVideo = closeCourseVideo;

function enrollCourse(courseId) {
    const course = _allCourses.find(c => c.id === courseId);
    if (!course) return;
    const key = _enrolledKey();
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    if (list.includes(courseId)) return;
    list.push(courseId);
    localStorage.setItem(key, JSON.stringify(list));
    showToast('Enrolled in "' + course.title + '" \u2713');
    addNotification('system', 'Enrolled: ' + course.title, 'You have successfully enrolled in ' + course.title + ' by ' + course.instructor + '.');
    earnCoins(15, 'Enrolled in ' + course.title);
    checkAndAwardBadges();
}
window.enrollCourse = enrollCourse;

function _renderSkillCategories() {
    const container = document.getElementById('skill-categories-container');
    if (!container) return;
    container.innerHTML = _skillCategories.slice(0, 6).map(c => `
        <div onclick="openSkillCategory('${c.name}')"
            style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;width:68px">
            <div style="width:60px;height:60px;border-radius:50%;background:${c.bg};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px -4px rgba(77,65,223,0.15);transition:transform 0.15s,box-shadow 0.15s"
                onmouseenter="this.style.transform='scale(1.08)';this.style.boxShadow='0 8px 20px -4px rgba(77,65,223,0.22)'"
                onmouseleave="this.style.transform='';this.style.boxShadow='0 4px 12px -4px rgba(77,65,223,0.15)'"
                ontouchstart="this.style.transform='scale(0.94)'" ontouchend="this.style.transform=''">
                <span class="material-symbols-outlined" style="font-size:26px;color:${c.color};font-variation-settings:'FILL' 1">${c.icon}</span>
            </div>
            <p style="font-size:11px;font-weight:600;color:#1b1b24;text-align:center;line-height:1.3;word-break:break-word">${c.name}</p>
        </div>`).join('');
}

function openSkillCategory(name) {
    const cat = _skillCategories.find(c => c.name === name);
    const courses = _allCourses.filter(c => c.category === name);
    // Update category page header
    const titleEl = document.getElementById('skill-cat-page-title');
    const iconEl = document.getElementById('skill-cat-page-icon');
    const countEl = document.getElementById('skill-cat-page-count');
    if (titleEl) titleEl.textContent = name;
    if (iconEl && cat) {
        iconEl.style.background = cat.bg;
        iconEl.querySelector('span').style.color = cat.color;
        iconEl.querySelector('span').textContent = cat.icon;
    }
    if (countEl) countEl.textContent = courses.length + ' course' + (courses.length !== 1 ? 's' : '');
    // Render filtered cards into category page container
    const container = document.getElementById('skill-cat-courses-container');
    if (container) {
        if (courses.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:48px 0"><span class="material-symbols-outlined text-outline-variant" style="font-size:48px">search_off</span><p class="text-on-surface-variant font-semibold mt-2">No courses in this category yet</p></div>';
        } else {
            _renderCourseCardsInto(container, courses);
        }
    }
    navigateTo('skill-categories');
}
window.openSkillCategory = openSkillCategory;

function filterBySkillCategory(name) {
    _skillFilters.cat.clear();
    _skillFilters.cat.add(name);
    document.querySelectorAll('.skill-chip[data-sf="cat"]').forEach(b => {
        const on = b.getAttribute('data-sv') === name;
        b.style.background = on ? 'rgba(77,65,223,0.15)' : '';
        b.style.color = on ? '#4d41df' : '';
        b.style.fontWeight = on ? '700' : '';
    });
    applySkillFilters();
    document.getElementById('skill-courses-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.filterBySkillCategory = filterBySkillCategory;

function openAllCategories() {
    const grid = document.getElementById('all-categories-grid');
    if (grid) {
        grid.innerHTML = _skillCategories.map(c => {
            const count = _allCourses.filter(x => x.category === c.name).length;
            return `
            <div onclick="openSkillCategory('${c.name}')"
                style="display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;padding:12px 4px;border-radius:16px;transition:background 0.15s"
                onmouseenter="this.style.background='rgba(77,65,223,0.05)'"
                onmouseleave="this.style.background=document.documentElement.classList.contains('dark-theme')?'transparent':''">
                <div style="width:64px;height:64px;border-radius:50%;background:${c.bg};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px -4px rgba(77,65,223,0.15)">
                    <span class="material-symbols-outlined" style="font-size:28px;color:${c.color};font-variation-settings:'FILL' 1">${c.icon}</span>
                </div>
                <p style="font-size:12px;font-weight:600;color:#1b1b24;text-align:center;line-height:1.3">${c.name}</p>
                <p style="font-size:10px;color:#9e9bb8">${count} course${count !== 1 ? 's' : ''}</p>
            </div>`;
        }).join('');
    }
    // Show all-categories grid on the skill-categories screen (not a category detail)
    const titleEl = document.getElementById('skill-cat-page-title');
    const iconEl = document.getElementById('skill-cat-page-icon');
    const countEl = document.getElementById('skill-cat-page-count');
    const container = document.getElementById('skill-cat-courses-container');
    if (titleEl) titleEl.textContent = 'All Categories';
    if (iconEl) iconEl.style.display = 'none';
    if (countEl) countEl.textContent = '';
    if (container) container.innerHTML = '';
    document.getElementById('all-categories-grid').style.display = 'grid';
    document.getElementById('skill-cat-courses-container').style.display = 'none';
    navigateTo('skill-categories');
}
window.openAllCategories = openAllCategories;

// Shared helper: render course cards into any container element
function _renderCourseCardsInto(container, courses) {
    const levelColor = l => l === 'Beginner' ? 'background:rgba(45,106,79,0.10);color:#276749'
        : l === 'Intermediate' ? 'background:rgba(77,65,223,0.10);color:#4d41df'
            : 'background:rgba(135,80,65,0.10);color:#875041';
    const typeColor = t => t === 'Free' ? 'background:rgba(45,106,79,0.10);color:#276749'
        : 'background:rgba(92,81,160,0.10);color:#5c51a0';
    const stars = r => {
        const full = Math.floor(r);
        return Array.from({ length: 5 }, (_, i) =>
            `<span class="material-symbols-outlined" style="font-size:13px;color:${i < full ? '#f59e0b' : '#d1d5db'};font-variation-settings:'FILL' 1">star</span>`
        ).join('');
    };
    const _dark = document.documentElement.classList.contains('dark-theme');
    const cardBg = _dark ? '#1c1b2e' : '#fff';
    const cardBorder = _dark ? '#2a2840' : '#eae6f3';
    const titleCol = _dark ? '#e8e6f4' : '#1b1b24';
    const subCol = _dark ? '#9e9bb8' : '#777587';
    const descCol = _dark ? '#c8c6dc' : '#464555';
    const shadowNorm = _dark ? '0 2px 12px -4px rgba(0,0,0,0.5)' : '0 2px 12px -4px rgba(77,65,223,0.08)';
    const shadowHov = _dark ? '0 6px 20px -4px rgba(0,0,0,0.7)' : '0 6px 20px -4px rgba(77,65,223,0.14)';
    const playBg = _dark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.95)';
    const playCol = _dark ? '#c4c0ff' : '#4d41df';
    const starEmpty = _dark ? '#4a4860' : '#d1d5db';

    container.innerHTML = courses.map(c => {
        const catMeta = _skillCategories.find(x => x.name === c.category) || { bg: 'rgba(77,65,223,0.12)', color: '#4d41df', icon: 'school' };
        const enrolled = JSON.parse(localStorage.getItem(_enrolledKey()) || '[]').includes(c.id);
        const thumbHq = 'https://img.youtube.com/vi/' + c.ytId + '/hqdefault.jpg';
        const thumbMq = 'https://img.youtube.com/vi/' + c.ytId + '/mqdefault.jpg';
        const starsHtml = Array.from({ length: 5 }, (_, i) =>
            `<span class="material-symbols-outlined" style="font-size:13px;color:${i < Math.floor(c.rating) ? '#f59e0b' : starEmpty};font-variation-settings:'FILL' 1">star</span>`
        ).join('');
        return `
        <div onclick="openTrainingPlayer(${v.id})" style="background:${cardBg};border-radius:20px;overflow:hidden;border:1px solid ${cardBorder};box-shadow:${shadowNorm};transition:transform 0.15s,box-shadow 0.15s"
            onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='${shadowHov}'"
            onmouseleave="this.style.transform='';this.style.boxShadow='${shadowNorm}'"
            ontouchstart="this.style.transform='scale(0.98)'" ontouchend="this.style.transform=''">
            <div onclick="openCourseVideo(${c.id})" style="position:relative;width:100%;height:160px;cursor:pointer;overflow:hidden;background:${catMeta.bg}">
                <img src="${thumbHq}" alt="${c.title}"
                    style="width:100%;height:100%;object-fit:cover;display:block"
                    onerror="this.src='${thumbMq}';this.onerror=function(){this.style.display='none';this.nextElementSibling.style.display='flex'}"/>
                <div style="display:none;width:100%;height:100%;background:${catMeta.bg};align-items:center;justify-content:center;position:absolute;inset:0">
                    <span class="material-symbols-outlined" style="font-size:40px;color:${catMeta.color};font-variation-settings:'FILL' 1">${catMeta.icon}</span>
                </div>
                <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.28);transition:background 0.2s"
                    onmouseenter="this.style.background='rgba(0,0,0,0.45)'" onmouseleave="this.style.background='rgba(0,0,0,0.28)'">
                    <div style="width:52px;height:52px;border-radius:50%;background:${playBg};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.4);transition:transform 0.15s"
                        onmouseenter="this.style.transform='scale(1.1)'" onmouseleave="this.style.transform=''">
                        <span class="material-symbols-outlined" style="font-size:26px;color:${playCol};font-variation-settings:'FILL' 1;margin-left:3px">play_arrow</span>
                    </div>
                </div>
                <span style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.72);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px">${c.durLabel}</span>
                ${enrolled ? '<span style="position:absolute;top:8px;left:8px;background:rgba(45,106,79,0.90);color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px">Enrolled</span>' : ''}
                ${c.lang === 'hi' ? '<span style="position:absolute;top:8px;right:8px;background:rgba(255,153,0,0.92);color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px">&#127470;&#127475; Hindi</span>' : ''}
            </div>
            <div style="padding:14px 16px 16px">
                <div style="display:flex;align-items:flex-start;gap:10px">
                    <div style="width:36px;height:36px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:${catMeta.bg}">
                        <span class="material-symbols-outlined" style="font-size:18px;color:${catMeta.color};font-variation-settings:'FILL' 1">${catMeta.icon}</span>
                    </div>
                    <div style="flex:1;min-width:0">
                        <p style="font-size:14px;font-weight:700;color:${titleCol};line-height:1.3">${c.title}</p>
                        <p style="font-size:12px;color:${subCol};margin-top:2px">${c.instructor} &bull; ${c.category}</p>
                    </div>
                </div>
                <p style="font-size:12px;color:${descCol};margin-top:8px;line-height:1.5">${c.desc}</p>
                <div style="display:flex;align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap">
                    <span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;${levelColor(c.level)}">${c.level}</span>
                    <span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;${typeColor(c.type)}">${c.type}</span>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px">
                    <div style="display:flex;align-items:center;gap:4px">
                        ${starsHtml}
                        <span style="font-size:12px;font-weight:700;color:${titleCol};margin-left:2px">${c.rating}</span>
                        <span style="font-size:11px;color:${subCol}">(${c.enrolled.toLocaleString('en-IN')})</span>
                    </div>
                    <button onclick="openCourseVideo(${c.id})" style="height:34px;padding:0 14px;border-radius:10px;border:none;background:linear-gradient(135deg,#4d41df,#5c51a0);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;display:flex;align-items:center;gap:5px;transition:opacity 0.15s" onmouseenter="this.style.opacity='0.88'" onmouseleave="this.style.opacity='1'">
                        <span class="material-symbols-outlined" style="font-size:14px;font-variation-settings:'FILL' 1">play_circle</span>Watch
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}
window._renderCourseCardsInto = _renderCourseCardsInto;

function initSkillsPage() {
    _renderSkillCategories();
    applySkillFilters();
}
window.initSkillsPage = initSkillsPage;

// ============================================================
// MARKETPLACE PAGE
// ============================================================

const _marketCategories = [
    { name: 'Handicrafts', icon: 'category', color: '#4d41df', bg: 'rgba(77,65,223,0.12)' },
    { name: 'Clothing', icon: 'checkroom', color: '#875041', bg: 'rgba(135,80,65,0.12)' },
    { name: 'Jewellery', icon: 'diamond', color: '#5c51a0', bg: 'rgba(92,81,160,0.12)' },
    { name: 'Food', icon: 'restaurant', color: '#276749', bg: 'rgba(45,106,79,0.12)' },
    { name: 'Art', icon: 'palette', color: '#675df9', bg: 'rgba(103,93,249,0.12)' },
    { name: 'Beauty', icon: 'spa', color: '#c77dff', bg: 'rgba(199,125,255,0.12)' },
    { name: 'Home Decor', icon: 'chair', color: '#875041', bg: 'rgba(135,80,65,0.10)' },
    { name: 'Stationery', icon: 'edit_note', color: '#4d41df', bg: 'rgba(77,65,223,0.10)' },
];

const _marketProducts = [
    { id: 'm1', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80', name: 'Hand-embroidered Dupatta', seller: 'Meena Crafts', sellerType: 'user', category: 'Clothing', price: 850, stock: 12, rating: 4.8, desc: 'Beautifully hand-embroidered dupatta with traditional motifs.', lang: 'en' },
    { id: 'm2', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=80', name: 'Terracotta Earrings Set', seller: 'Clay & Co.', sellerType: 'company', category: 'Jewellery', price: 320, stock: 30, rating: 4.7, desc: 'Lightweight terracotta earrings, eco-friendly and unique.', lang: 'en' },
    { id: 'm3', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', name: 'Organic Turmeric Powder', seller: 'Spice Garden', sellerType: 'user', category: 'Food', price: 180, stock: 50, rating: 4.9, desc: '100% organic turmeric sourced directly from farms.', lang: 'en' },
    { id: 'm4', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80', name: 'Madhubani Art Print', seller: 'ArtByPriya', sellerType: 'user', category: 'Art', price: 1200, stock: 5, rating: 4.6, desc: 'Original Madhubani art print on handmade paper.', lang: 'en' },
    { id: 'm5', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80', name: 'Handwoven Jute Bag', seller: 'GreenWeave', sellerType: 'company', category: 'Handicrafts', price: 450, stock: 20, rating: 4.5, desc: 'Eco-friendly jute bag, perfect for daily use.', lang: 'en' },
    { id: 'm6', image: 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=400&q=80', name: 'Rose & Sandalwood Soap', seller: 'NaturalGlow', sellerType: 'user', category: 'Beauty', price: 150, stock: 40, rating: 4.8, desc: 'Handmade cold-process soap with natural ingredients.', lang: 'en' },
    { id: 'm7', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', name: 'MacramÃƒÆ’Ã‚Â© Wall Hanging', seller: 'KnotArt Studio', sellerType: 'company', category: 'Home Decor', price: 2200, stock: 8, rating: 4.7, desc: 'Handcrafted macramÃƒÆ’Ã‚Â© wall hanging, boho style.', lang: 'en' },
    { id: 'm8', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80', name: 'Handmade Greeting Cards', seller: 'PaperLove', sellerType: 'user', category: 'Stationery', price: 80, stock: 100, rating: 4.4, desc: 'Set of 5 handmade greeting cards for all occasions.', lang: 'en' },
    { id: 'm9', image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400&q=80', name: 'Silk Thread Bangles', seller: 'Meena Crafts', sellerType: 'user', category: 'Jewellery', price: 250, stock: 25, rating: 4.6, desc: 'Colourful silk thread bangles, set of 6.', lang: 'en' },
    { id: 'm10', name: 'Handloom Cotton Saree', seller: 'WeaversHub', sellerType: 'company', category: 'Clothing', price: 3500, stock: 15, rating: 4.9, desc: 'Pure handloom cotton saree with natural dyes.', lang: 'en' },
];

const _marketFilters = { cat: new Set(), price: new Set(), seller: new Set(), stock: new Set() };

function toggleMarketFilters() {
    const panel = document.getElementById('market-filter-panel');
    const btn = document.getElementById('market-filter-btn');
    const hidden = panel.classList.toggle('hidden');
    btn.style.background = hidden ? '' : 'rgba(77,65,223,0.12)';
}
window.toggleMarketFilters = toggleMarketFilters;

function toggleMarketFilter(group, value) {
    const set = _marketFilters[group];
    if (set.has(value)) set.delete(value); else set.add(value);
    document.querySelectorAll(`.market-chip[data-mf="${group}"][data-mv="${value}"]`).forEach(btn => {
        const on = set.has(value);
        btn.style.background = on ? '#4d41df' : '';
        btn.style.color = on ? '#ffffff' : '';
        btn.style.fontWeight = on ? '700' : '';
        btn.style.boxShadow = on ? '0 0 0 2px #4d41df' : '';
    });
    applyMarketFilters();
}
window.toggleMarketFilter = toggleMarketFilter;

function clearMarketFilters() {
    Object.values(_marketFilters).forEach(s => s.clear());
    document.querySelectorAll('.market-chip').forEach(b => { b.style.background = ''; b.style.color = ''; b.style.fontWeight = ''; b.style.boxShadow = ''; });
    const inp = document.getElementById('market-search-input');
    if (inp) inp.value = '';
    applyMarketFilters();
}
window.clearMarketFilters = clearMarketFilters;

function _priceMatch(p, priceSet) {
    if (priceSet.size === 0) return true;
    if (priceSet.has('under500') && p.price < 500) return true;
    if (priceSet.has('500to2k') && p.price >= 500 && p.price <= 2000) return true;
    if (priceSet.has('above2k') && p.price > 2000) return true;
    return false;
}

function _getFilteredProducts() {
    const q = (document.getElementById('market-search-input')?.value || '').toLowerCase();
    const { cat, price, seller, stock } = _marketFilters;

    // Merge catalogue + user's own shop products
    const userProds = getShopProducts().map(p => ({
        id: 'u' + p.id, name: p.name, seller: 'My Shop', sellerType: 'user',
        category: p.category || 'Handicrafts', price: Number(p.price) || 0,
        stock: Number(p.stock) || 0, rating: 0, image: p.image || '', desc: p.description || '',
    }));
    const all = [..._marketProducts, ...userProds];

    return all.filter(p => {
        if (q && !`${p.name} ${p.seller} ${p.category}`.toLowerCase().includes(q)) return false;
        if (cat.size && !cat.has(p.category)) return false;
        if (!_priceMatch(p, price)) return false;
        if (seller.size && !seller.has(p.sellerType)) return false;
        if (stock.size) {
            if (stock.has('instock') && p.stock <= 0) return false;
            if (stock.has('outofstock') && p.stock > 0) return false;
        }
        return true;
    });
}

function applyMarketFilters() {
    const filtered = _getFilteredProducts();
    _renderMarketAllProducts(filtered);
}
window.applyMarketFilters = applyMarketFilters;

function _productCard(p, horizontal) {
    const _dark = document.documentElement.classList.contains('dark-theme');
    const cardBg = _dark ? '#1c1b2e' : '#fff';
    const border = _dark ? '#2a2840' : '#eae6f3';
    const titleC = _dark ? '#e8e6f4' : '#1b1b24';
    const subC = _dark ? '#9e9bb8' : '#777587';
    const shadowN = _dark ? '0 2px 10px -4px rgba(0,0,0,0.5)' : '0 2px 10px -4px rgba(77,65,223,0.10)';
    const shadowH = _dark ? '0 6px 18px -4px rgba(0,0,0,0.7)' : '0 6px 18px -4px rgba(77,65,223,0.18)';
    const starEmpty = _dark ? '#4a4860' : '#d1d5db';
    const catMeta = _marketCategories.find(c => c.name === p.category) || { color: '#4d41df', bg: 'rgba(77,65,223,0.10)', icon: 'category' };
    const iconColor = _dark ? (catMeta.color === '#4d41df' ? '#8b83ff' : catMeta.color) : catMeta.color;
    const stars = r => r > 0 ? Array.from({ length: 5 }, (_, i) =>
        `<span class="material-symbols-outlined" style="font-size:11px;color:${i < Math.floor(r) ? '#f59e0b' : starEmpty};font-variation-settings:'FILL' 1">star</span>`
    ).join('') : '';
    const imgContent = p.image
        ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span class="material-symbols-outlined" style="display:none;font-size:32px;color:${iconColor};font-variation-settings:'FILL' 1">${catMeta.icon}</span>`
        : `<span class="material-symbols-outlined" style="font-size:32px;color:${iconColor};font-variation-settings:'FILL' 1">${catMeta.icon}</span>`;

    if (horizontal) {
        return `
        <div style="flex-shrink:0;width:160px;background:${cardBg};border-radius:18px;border:1px solid ${border};box-shadow:${shadowN};overflow:hidden;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s"
            onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='${shadowH}'"
            onmouseleave="this.style.transform='';this.style.boxShadow='${shadowN}'"
            ontouchstart="this.style.transform='scale(0.97)'" ontouchend="this.style.transform=''">
            <div style="width:100%;height:110px;background:${catMeta.bg};display:flex;align-items:center;justify-content:center;overflow:hidden">${imgContent}</div>
            <div style="padding:10px">
                <p style="font-size:12px;font-weight:700;color:${titleC};line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</p>
                <p style="font-size:10px;color:${subC};margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.seller}</p>
                <div style="display:flex;align-items:center;gap:2px;margin-top:3px">${stars(p.rating)}</div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px">
                    <p style="font-size:13px;font-weight:800;color:#8b83ff">&#8377;${p.price.toLocaleString('en-IN')}</p>
                    <button onclick="event.stopPropagation();buyProduct('${p.id}')" style="height:26px;padding:0 10px;border-radius:8px;border:none;background:linear-gradient(135deg,#4d41df,#5c51a0);color:#fff;font-size:10px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif">Buy</button>
                </div>
            </div>
        </div>`;
    }

    return `
    <div style="background:${cardBg};border-radius:18px;border:1px solid ${border};box-shadow:${shadowN};overflow:hidden;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s"
        onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='${shadowH}'"
        onmouseleave="this.style.transform='';this.style.boxShadow='${shadowN}'"
        ontouchstart="this.style.transform='scale(0.97)'" ontouchend="this.style.transform=''">
        <div style="width:100%;height:120px;background:${catMeta.bg};display:flex;align-items:center;justify-content:center;overflow:hidden">${imgContent}</div>
        <div style="padding:10px">
            <p style="font-size:12px;font-weight:700;color:${titleC};line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p.name}</p>
            <p style="font-size:10px;color:${subC};margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.seller}</p>
            <div style="display:flex;align-items:center;gap:2px;margin-top:3px">${stars(p.rating)}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;gap:4px">
                <p style="font-size:13px;font-weight:800;color:#8b83ff">&#8377;${p.price.toLocaleString('en-IN')}</p>
                <button onclick="event.stopPropagation();buyProduct('${p.id}')" style="height:28px;padding:0 10px;border-radius:8px;border:none;background:linear-gradient(135deg,#4d41df,#5c51a0);color:#fff;font-size:10px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;white-space:nowrap">Buy</button>
            </div>
            ${p.stock <= 0 ? `<p style="font-size:10px;color:${_dark ? '#ff8a8a' : '#ba1a1a'};font-weight:600;margin-top:3px">Out of stock</p>` : ''}
        </div>
    </div>`;
}

function _renderMarketPopular() {
    const container = document.getElementById('market-popular-container');
    if (!container) return;
    const popular = _marketProducts.slice(0, 6);
    container.innerHTML = popular.map(p => _productCard(p, true)).join('');
}

function _renderMarketAllProducts(products) {
    const container = document.getElementById('market-all-products');
    const empty = document.getElementById('market-empty-state');
    const countEl = document.getElementById('market-products-count');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        if (countEl) countEl.textContent = '';
        return;
    }
    if (empty) empty.classList.add('hidden');
    if (countEl) countEl.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;
    container.innerHTML = products.map(p => _productCard(p, false)).join('');
}

function showAllMarketProducts() {
    clearMarketFilters();
    document.getElementById('market-all-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.showAllMarketProducts = showAllMarketProducts;

function buyProduct(productId) {
    addToCart(productId);
}
window.buyProduct = buyProduct;

function _renderMarketCategories() {
    const container = document.getElementById('market-categories-container');
    if (!container) return;
    const _dark = document.documentElement.classList.contains('dark-theme');
    const labelC = _dark ? '#e8e6f4' : '#1b1b24';
    container.innerHTML = _marketCategories.slice(0, 6).map(c => {
        const iconC = _dark ? (c.color === '#4d41df' ? '#8b83ff' : c.color === '#875041' ? '#e8a090' : c.color === '#5c51a0' ? '#a89ee8' : c.color === '#276749' ? '#74c69d' : c.color === '#675df9' ? '#a89ee8' : c.color) : c.color;
        return `
        <div onclick="filterByMarketCategory('${c.name}')"
            style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;width:68px">
            <div style="width:60px;height:60px;border-radius:50%;background:${c.bg};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px -4px rgba(77,65,223,0.15);transition:transform 0.15s,box-shadow 0.15s"
                onmouseenter="this.style.transform='scale(1.08)';this.style.boxShadow='0 8px 20px -4px rgba(77,65,223,0.22)'"
                onmouseleave="this.style.transform='';this.style.boxShadow='0 4px 12px -4px rgba(77,65,223,0.15)'"
                ontouchstart="this.style.transform='scale(0.94)'" ontouchend="this.style.transform=''">
                <span class="material-symbols-outlined" style="font-size:26px;color:${iconC};font-variation-settings:'FILL' 1">${c.icon}</span>
            </div>
            <p style="font-size:11px;font-weight:600;color:${labelC};text-align:center;line-height:1.3;word-break:break-word">${c.name}</p>
        </div>`;
    }).join('');
}

function filterByMarketCategory(name) {
    _marketFilters.cat.clear();
    _marketFilters.cat.add(name);
    document.querySelectorAll('.market-chip[data-mf="cat"]').forEach(b => {
        const on = b.getAttribute('data-mv') === name;
        b.style.background = on ? 'rgba(77,65,223,0.15)' : '';
        b.style.color = on ? '#4d41df' : '';
        b.style.fontWeight = on ? '700' : '';
    });
    applyMarketFilters();
    document.getElementById('market-all-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.filterByMarketCategory = filterByMarketCategory;

function openAllMarketCategories() {
    const grid = document.getElementById('market-all-categories-grid');
    if (grid) {
        const _dark = document.documentElement.classList.contains('dark-theme');
        const labelC = _dark ? '#e8e6f4' : '#1b1b24';
        grid.innerHTML = _marketCategories.map(c => {
            const count = _marketProducts.filter(p => p.category === c.name).length;
            const iconC = _dark ? (c.color === '#4d41df' ? '#8b83ff' : c.color === '#875041' ? '#e8a090' : c.color === '#5c51a0' ? '#a89ee8' : c.color === '#276749' ? '#74c69d' : c.color === '#675df9' ? '#a89ee8' : c.color) : c.color;
            return `
            <div onclick="navigateTo('shop');setTimeout(()=>filterByMarketCategory('${c.name}'),200)"
                style="display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;padding:12px 4px;border-radius:16px;transition:background 0.15s"
                onmouseenter="this.style.background='rgba(77,65,223,0.08)'"
                onmouseleave="this.style.background=document.documentElement.classList.contains('dark-theme')?'transparent':''">
                <div style="width:64px;height:64px;border-radius:50%;background:${c.bg};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px -4px rgba(77,65,223,0.15)">
                    <span class="material-symbols-outlined" style="font-size:28px;color:${iconC};font-variation-settings:'FILL' 1">${c.icon}</span>
                </div>
                <p style="font-size:12px;font-weight:600;color:${labelC};text-align:center;line-height:1.3">${c.name}</p>
                <p style="font-size:10px;color:#9e9bb8">${count} products</p>
            </div>`;
        }).join('');
    }
    navigateTo('market-categories');
}
window.openAllMarketCategories = openAllMarketCategories;

function initMarketplace() {
    _renderMarketCategories();
    _renderMarketPopular();
    applyMarketFilters();
    renderShopProducts();   // keep existing My Listings in sync
}
window.initMarketplace = initMarketplace;

// ============================================================
// CART
// ============================================================

function _getCart() { return JSON.parse(localStorage.getItem('tarini_cart') || '[]'); }
function _saveCart(c) { localStorage.setItem('tarini_cart', JSON.stringify(c)); }

function _updateCartBadge() {
    const cart = _getCart();
    const total = cart.reduce((s, i) => s + i.qty, 0);
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    if (total > 0) { badge.textContent = total > 9 ? '9+' : total; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
}

function addToCart(productId) {
    const all = [..._marketProducts, ...getShopProducts().map(p => ({
        id: 'u' + p.id, name: p.name, price: Number(p.price) || 0,
        image: p.image || '', category: p.category || 'Handicrafts',
        seller: 'My Shop', stock: Number(p.stock) || 0,
    }))];
    const p = all.find(x => x.id === productId);
    if (!p) return;
    const cart = _getCart();
    const existing = cart.find(i => i.id === productId);
    if (existing) { existing.qty = Math.min(existing.qty + 1, p.stock || 99); }
    else { cart.push({ id: p.id, name: p.name, price: p.price, image: p.image, seller: p.seller || '', qty: 1, stock: p.stock || 99 }); }
    _saveCart(cart);
    _updateCartBadge();
    showToast(`"${p.name}" added to cart \u2713`);
}
window.addToCart = addToCart;

function removeFromCart(productId) {
    _saveCart(_getCart().filter(i => i.id !== productId));
    _updateCartBadge();
    renderCart();
}
window.removeFromCart = removeFromCart;

function updateCartQty(productId, delta) {
    const cart = _getCart();
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.qty = Math.max(1, Math.min(item.qty + delta, item.stock || 99));
    _saveCart(cart);
    _updateCartBadge();
    renderCart();
}
window.updateCartQty = updateCartQty;

function clearCart() {
    _saveCart([]);
    _updateCartBadge();
    renderCart();
}
window.clearCart = clearCart;

function renderCart() {
    const cart = _getCart();
    const listEl = document.getElementById('cart-items-list');
    const emptyEl = document.getElementById('cart-empty');
    const barEl = document.getElementById('cart-checkout-bar');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-item-count-label');
    if (!listEl) return;

    const itemCount = cart.reduce((s, i) => s + i.qty, 0);
    if (countEl) countEl.textContent = `${itemCount} item${itemCount !== 1 ? 's' : ''}`;

    if (cart.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        if (barEl) barEl.classList.add('hidden');
        return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');
    if (barEl) barEl.classList.remove('hidden');

    const grandTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    if (totalEl) totalEl.textContent = '\u20b9' + grandTotal.toLocaleString('en-IN');

    const _dark = document.documentElement.classList.contains('dark-theme');
    const cardBg = _dark ? '#1c1b2e' : '#fff';
    const border = _dark ? '#2a2840' : '#eae6f3';
    const titleC = _dark ? '#e8e6f4' : '#1b1b24';
    const subC = _dark ? '#9e9bb8' : '#777587';
    const qtyC = _dark ? '#e8e6f4' : '#1b1b24';
    const btnBg = _dark ? 'rgba(100,90,255,0.15)' : '#f6f2ff';
    const btnBdr = _dark ? '#3a3850' : '#eae6f3';

    listEl.innerHTML = cart.map(item => `
        <div style="background:${cardBg};border-radius:18px;padding:14px;border:1px solid ${border};box-shadow:0 2px 10px -4px rgba(0,0,0,${_dark ? '0.4' : '0.08'});display:flex;align-items:center;gap:12px">
            <div style="width:72px;height:72px;border-radius:14px;overflow:hidden;flex-shrink:0;background:rgba(77,65,223,0.10);display:flex;align-items:center;justify-content:center">
                ${item.image
            ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span class="material-symbols-outlined" style="display:none;font-size:28px;color:#8b83ff;font-variation-settings:'FILL' 1">image</span>`
            : `<span class="material-symbols-outlined" style="font-size:28px;color:#8b83ff;font-variation-settings:'FILL' 1">image</span>`}
            </div>
            <div style="flex:1;min-width:0">
                <p style="font-size:13px;font-weight:700;color:${titleC};line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</p>
                <p style="font-size:11px;color:${subC};margin-top:1px">${item.seller}</p>
                <p style="font-size:14px;font-weight:800;color:#8b83ff;margin-top:4px">\u20b9${(item.price * item.qty).toLocaleString('en-IN')}</p>
                <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
                    <button onclick="updateCartQty('${item.id}',-1)" style="width:28px;height:28px;border-radius:8px;border:1px solid ${btnBdr};background:${btnBg};color:#8b83ff;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">\u2212</button>
                    <span style="font-size:14px;font-weight:700;color:${qtyC};min-width:20px;text-align:center">${item.qty}</span>
                    <button onclick="updateCartQty('${item.id}',1)" style="width:28px;height:28px;border-radius:8px;border:1px solid ${btnBdr};background:${btnBg};color:#8b83ff;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>
                    <button onclick="removeFromCart('${item.id}')" style="margin-left:auto;width:28px;height:28px;border-radius:8px;border:none;background:rgba(186,26,26,0.12);color:${_dark ? '#ff8a8a' : '#ba1a1a'};cursor:pointer;display:flex;align-items:center;justify-content:center">
                        <span class="material-symbols-outlined" style="font-size:16px">delete</span>
                    </button>
                </div>
            </div>
        </div>`).join('');
}
window.renderCart = renderCart;

function proceedToCheckout() {
    const cart = _getCart();
    if (cart.length === 0) return;
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    cart.forEach(item => addNotification('order', `Order: ${item.name}`, `Your order for ${item.name} (ÃƒÆ’Ã¢â‚¬â€${item.qty}) has been placed.`));
    clearCart();
    showToast(`Order placed! Total: \u20b9${total.toLocaleString('en-IN')} \u2713`);
    navigateTo('shop');
}
window.proceedToCheckout = proceedToCheckout;

// ============================================================
// MY SHOP (Seller View)
// ============================================================

function initMyShop() {
    const products = getShopProducts();
    const listEl = document.getElementById('myshop-products-list');
    const emptyEl = document.getElementById('myshop-empty');
    const totalEl = document.getElementById('myshop-total-count');
    const instockEl = document.getElementById('myshop-instock-count');
    const soldEl = document.getElementById('myshop-sold-count');
    if (!listEl) return;

    if (totalEl) totalEl.textContent = products.length;
    if (instockEl) instockEl.textContent = products.filter(p => Number(p.stock) > 0).length;
    if (soldEl) soldEl.textContent = products.filter(p => Number(p.stock) === 0).length;

    if (products.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl) { emptyEl.classList.remove('hidden'); emptyEl.style.display = ''; }
        return;
    }
    if (emptyEl) { emptyEl.classList.add('hidden'); emptyEl.style.display = 'none'; }

    listEl.innerHTML = products.slice().reverse().map(p => {
        const _dark = document.documentElement.classList.contains('dark-theme');
        const cardBg = _dark ? '#1c1b2e' : '#fff';
        const border = _dark ? '#2a2840' : '#eae6f3';
        const titleC = _dark ? '#e8e6f4' : '#1b1b24';
        const subC = _dark ? '#9e9bb8' : '#777587';
        const priceC = _dark ? '#8b83ff' : '#4d41df';
        const iconC = _dark ? '#8b83ff' : '#4d41df';
        const inStock = Number(p.stock) > 0;
        const statusStyle = inStock
            ? 'background:rgba(45,106,79,0.10);color:#276749'
            : 'background:rgba(186,26,26,0.08);color:#ba1a1a';
        const statusLabel = inStock ? 'Available' : 'Sold Out';
        return `
        <div style="background:${cardBg};border-radius:18px;padding:14px;border:1px solid ${border};box-shadow:0 2px 10px -4px rgba(0,0,0,${_dark ? '0.4' : '0.08'});display:flex;align-items:center;gap:12px">
            <div style="width:72px;height:72px;border-radius:14px;overflow:hidden;flex-shrink:0;background:rgba(77,65,223,0.10);display:flex;align-items:center;justify-content:center">
                ${p.image
                ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span class="material-symbols-outlined" style="display:none;font-size:28px;color:${iconC};font-variation-settings:'FILL' 1">image</span>`
                : `<span class="material-symbols-outlined" style="font-size:28px;color:${iconC};font-variation-settings:'FILL' 1">image</span>`}
            </div>
            <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                    <p style="font-size:13px;font-weight:700;color:${titleC};line-height:1.3;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</p>
                    <span style="flex-shrink:0;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;${statusStyle}">${statusLabel}</span>
                </div>
                <p style="font-size:14px;font-weight:800;color:${priceC};margin-top:3px">\u20b9${Number(p.price).toLocaleString('en-IN')}</p>
                <p style="font-size:11px;color:${subC};margin-top:1px">Stock: ${p.stock} &bull; ${p.category || 'Uncategorised'}</p>
                <div style="display:flex;gap:8px;margin-top:8px">
                    <button onclick="openPostProduct(${p.id})" style="height:28px;padding:0 12px;border-radius:8px;border:1px solid rgba(77,65,223,0.25);background:rgba(77,65,223,0.08);color:${iconC};font-size:11px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;display:flex;align-items:center;gap:4px">
                        <span class="material-symbols-outlined" style="font-size:13px;color:${iconC}">edit</span>Edit
                    </button>
                    <button onclick="deleteMyShopProduct(${p.id})" style="height:28px;padding:0 12px;border-radius:8px;border:1px solid rgba(186,26,26,0.25);background:rgba(186,26,26,0.08);color:${_dark ? '#ff8a8a' : '#ba1a1a'};font-size:11px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;display:flex;align-items:center;gap:4px">
                        <span class="material-symbols-outlined" style="font-size:13px;color:${_dark ? '#ff8a8a' : '#ba1a1a'}">delete</span>Delete
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}
window.initMyShop = initMyShop;

function deleteMyShopProduct(productId) {
    if (!confirm('Delete this product?')) return;
    saveShopProducts(getShopProducts().filter(p => p.id !== productId));
    initMyShop();
    initMarketplace();
}
window.deleteMyShopProduct = deleteMyShopProduct;

// == Initialise cart badge on page load ==
document.addEventListener('DOMContentLoaded', () => { _updateCartBadge(); });

// ============================================================
// REWARDS ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â TARINI COINS, TASKS & BADGES
// ============================================================

const _REWARDS_KEY = () => { const u = auth.currentUser; return u ? `tarini_rewards_${u.uid}` : 'tarini_rewards_guest'; };

function _getRewards() {
    return JSON.parse(localStorage.getItem(_REWARDS_KEY()) || JSON.stringify({
        coins: 0, streak: 0, lastLogin: null, activity: [], earnedBadges: []
    }));
}
function _saveRewards(r) { localStorage.setItem(_REWARDS_KEY(), JSON.stringify(r)); }

// Earn coins and log activity
function earnCoins(amount, reason) {
    const r = _getRewards();
    r.coins += amount;
    r.activity.unshift({ amount, reason, time: new Date().toISOString() });
    r.activity = r.activity.slice(0, 20);
    _saveRewards(r);
    _animateCoinEarn(amount);
}
window.earnCoins = earnCoins;

function _animateCoinEarn(amount) {
    const el = document.getElementById('rewards-total-points');
    if (!el) return;
    // Flash animation
    el.style.transition = 'transform 0.2s ease, color 0.2s ease';
    el.style.transform = 'scale(1.3)';
    el.style.color = '#f59e0b';
    setTimeout(() => { el.style.transform = 'scale(1)'; el.style.color = ''; }, 400);
    // Floating +N toast
    const toast = document.createElement('div');
    toast.textContent = `+${amount} ⭐ coins`;
    toast.style.cssText = 'position:fixed;top:80px;right:20px;background:linear-gradient(135deg,#4d41df,#675df9);color:#fff;font-size:14px;font-weight:800;padding:8px 16px;border-radius:999px;z-index:9999;animation:coinFloat 1.8s ease-out forwards;pointer-events:none;box-shadow:0 4px 16px rgba(77,65,223,0.4)';
    if (!document.getElementById('coin-float-style')) {
        const s = document.createElement('style');
        s.id = 'coin-float-style';
        s.textContent = '@keyframes coinFloat{0%{opacity:1;transform:translateY(0) scale(1)}60%{opacity:1;transform:translateY(-40px) scale(1.1)}100%{opacity:0;transform:translateY(-70px) scale(0.8)}}';
        document.head.appendChild(s);
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1900);
}

// Daily login streak
function _checkDailyLogin() {
    const r = _getRewards();
    const today = new Date().toDateString();
    if (r.lastLogin === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    r.streak = (r.lastLogin === yesterday) ? (r.streak || 0) + 1 : 1;
    r.lastLogin = today;
    _saveRewards(r);
    earnCoins(10, 'Daily login bonus');
    checkAndAwardBadges();
}

// Badge definitions
const _allBadges = [
    { id: 'first_login', icon: 'waving_hand', color: '#4d41df', bg: 'rgba(77,65,223,0.12)', name: 'Welcome!', desc: 'Joined Tarini', condition: r => true },
    { id: 'profile_star', icon: 'person_check', color: '#276749', bg: 'rgba(45,106,79,0.12)', name: 'Profile Star', desc: 'Completed your profile', condition: r => computeProfileProgress() >= 100 },
    { id: 'first_apply', icon: 'send', color: '#875041', bg: 'rgba(135,80,65,0.12)', name: 'First Apply', desc: 'Applied to your first job', condition: () => (JSON.parse(localStorage.getItem(_appsKey()) || '[]')).length >= 1 },
    { id: 'rising_talent', icon: 'trending_up', color: '#675df9', bg: 'rgba(103,93,249,0.12)', name: 'Rising Talent', desc: 'Applied to 3+ jobs', condition: () => (JSON.parse(localStorage.getItem(_appsKey()) || '[]')).length >= 3 },
    { id: 'skill_learner', icon: 'school', color: '#5c51a0', bg: 'rgba(92,81,160,0.12)', name: 'Skill Learner', desc: 'Enrolled in a course', condition: r => r.activity.some(a => a.reason.startsWith('Enrolled in')) },
    { id: 'seller_debut', icon: 'storefront', color: '#c77dff', bg: 'rgba(199,125,255,0.12)', name: 'Seller Debut', desc: 'Listed your first product', condition: () => getShopProducts().length >= 1 },
    { id: 'top_seller', icon: 'workspace_premium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', name: 'Top Seller', desc: 'Listed 5+ products', condition: () => getShopProducts().length >= 5 },
    { id: 'streak_3', icon: 'local_fire_department', color: '#e63946', bg: 'rgba(230,57,70,0.10)', name: 'On Fire!', desc: '3-day login streak', condition: r => (r.streak || 0) >= 3 },
    { id: 'streak_7', icon: 'bolt', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', name: 'Consistent User', desc: '7-day login streak', condition: r => (r.streak || 0) >= 7 },
    { id: 'coin_100', icon: 'monetization_on', color: '#276749', bg: 'rgba(45,106,79,0.12)', name: 'Coin Collector', desc: 'Earned 100+ Tarini Coins', condition: r => r.coins >= 100 },
    { id: 'coin_500', icon: 'diamond', color: '#4d41df', bg: 'rgba(77,65,223,0.12)', name: 'Coin Champion', desc: 'Earned 500+ Tarini Coins', condition: r => r.coins >= 500 },
    { id: 'design_pro', icon: 'palette', color: '#5c51a0', bg: 'rgba(92,81,160,0.12)', name: 'Design Pro', desc: 'Enrolled in a Design course', condition: r => r.activity.some(a => a.reason.toLowerCase().includes('figma') || a.reason.toLowerCase().includes('brand')) },
];

function checkAndAwardBadges() {
    const r = _getRewards();
    let newBadge = false;
    _allBadges.forEach(b => {
        if (!r.earnedBadges.includes(b.id) && b.condition(r)) {
            r.earnedBadges.push(b.id);
            newBadge = true;
            _showBadgeUnlockToast(b);
        }
    });
    if (newBadge) _saveRewards(r);
}
window.checkAndAwardBadges = checkAndAwardBadges;

function _showBadgeUnlockToast(badge) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:120px;left:50%;transform:translateX(-50%);background:#fff;border:2px solid rgba(77,65,223,0.25);border-radius:20px;padding:12px 20px;display:flex;align-items:center;gap:12px;z-index:9999;box-shadow:0 8px 32px rgba(77,65,223,0.20);animation:fadeIn 0.3s ease-out;min-width:260px;max-width:320px';
    el.innerHTML = `<div style="width:40px;height:40px;border-radius:12px;background:${badge.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0"><span class="material-symbols-outlined" style="font-size:22px;color:${badge.color};font-variation-settings:'FILL' 1">${badge.icon}</span></div><div><p style="font-size:12px;font-weight:700;color:#4d41df">🏆 Badge Unlocked!</p><p style="font-size:13px;font-weight:700;color:#1b1b24">${badge.name}</p><p style="font-size:11px;color:#777587">${badge.desc}</p></div>`;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.4s'; setTimeout(() => el.remove(), 400); }, 3000);
}

// Task definitions (evaluated fresh each call)
function _getDailyTasks() {
    const r = _getRewards();
    const today = new Date().toDateString();
    const apps = JSON.parse(localStorage.getItem(_appsKey()) || '[]');
    const todayApps = apps.filter(a => new Date(a.appliedAt).toDateString() === today);
    const profilePct = computeProfileProgress();
    return [
        { id: 'daily_login', icon: 'login', color: '#4d41df', coins: 10, label: 'Daily Login', desc: 'Open the app today', done: r.lastLogin === today },
        { id: 'complete_profile', icon: 'person_check', color: '#276749', coins: 50, label: 'Complete Profile', desc: 'Fill all profile fields', done: profilePct >= 100 },
        { id: 'apply_job', icon: 'send', color: '#875041', coins: 20, label: 'Apply to a Job', desc: 'Submit a job application', done: todayApps.length >= 1 },
        { id: 'enroll_course', icon: 'school', color: '#5c51a0', coins: 15, label: 'Enroll in a Course', desc: 'Join any Skill Hub course', done: r.activity.some(a => a.reason.startsWith('Enrolled in') && new Date(a.time).toDateString() === today) },
        { id: 'list_product', icon: 'storefront', color: '#c77dff', coins: 25, label: 'List a Product', desc: 'Add a product to your shop', done: r.activity.some(a => a.reason === 'Listed a new product' && new Date(a.time).toDateString() === today) },
    ];
}

function initRewardsScreen() {
    _checkDailyLogin();
    checkAndAwardBadges();
    const r = _getRewards();

    // Update header stats
    const coinsEl = document.getElementById('rewards-total-points');
    const badgeEl = document.getElementById('rewards-badge-count');
    const streakEl = document.getElementById('rewards-streak');
    if (coinsEl) coinsEl.textContent = r.coins;
    if (badgeEl) badgeEl.textContent = r.earnedBadges.length;
    if (streakEl) streakEl.textContent = r.streak || 0;

    _renderTasks();
    _renderActivity(r);
    _renderBadges(r);
}
window.initRewardsScreen = initRewardsScreen;

function _renderTasks() {
    const container = document.getElementById('rewards-tasks-container');
    const label = document.getElementById('tasks-done-label');
    if (!container) return;
    const tasks = _getDailyTasks();
    const done = tasks.filter(t => t.done).length;
    if (label) label.textContent = `${done}/${tasks.length} done`;

    const _d = document.documentElement.classList.contains('dark-theme');
    const _cardBg = _d ? '#1c1b2e' : '#fff';
    const _border = _d ? '#2a2840' : '#eae6f3';
    const _titleC = _d ? '#e8e6f4' : '#1b1b24';
    const _subC = _d ? '#9e9bb8' : '#777587';
    const _coinC = _d ? '#e8e6f4' : '#1b1b24';
    container.innerHTML = tasks.map(t => `
        <div style="display:flex;align-items:center;gap:12px;background:${_cardBg};border-radius:16px;padding:12px 14px;border:1px solid ${t.done ? 'rgba(45,106,79,0.20)' : _border};box-shadow:0 2px 8px -4px rgba(77,65,223,0.08);transition:all 0.2s;${t.done ? 'opacity:0.75' : ''}">
            <div style="width:40px;height:40px;border-radius:12px;background:${t.done ? 'rgba(45,106,79,0.12)' : `rgba(${t.color === '#4d41df' ? '77,65,223' : t.color === '#276749' ? '45,106,79' : t.color === '#875041' ? '135,80,65' : t.color === '#5c51a0' ? '92,81,160' : '199,125,255'},0.12)`};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span class="material-symbols-outlined" style="font-size:20px;color:${t.done ? '#276749' : t.color};font-variation-settings:'FILL' 1">${t.done ? 'check_circle' : t.icon}</span>
            </div>
            <div style="flex:1;min-width:0">
                <p style="font-size:13px;font-weight:700;color:${t.done ? '#276749' : _titleC};${t.done ? 'text-decoration:line-through' : ''}">${t.label}</p>
                <p style="font-size:11px;color:${_subC};margin-top:1px">${t.desc}</p>
            </div>
            <div style="display:flex;align-items:center;gap:3px;flex-shrink:0">
                <span class="material-symbols-outlined" style="font-size:14px;color:#f59e0b;font-variation-settings:'FILL' 1">monetization_on</span>
                <span style="font-size:12px;font-weight:700;color:${_coinC}">+${t.coins}</span>
            </div>
        </div>`).join('');
}

function _renderActivity(r) {
    const container = document.getElementById('rewards-activity-container');
    const _d = document.documentElement.classList.contains('dark-theme');
    const _cardBg = _d ? '#1c1b2e' : '#fff';
    const _border = _d ? '#2a2840' : '#eae6f3';
    const _textC = _d ? '#c8c6dc' : '#464555';
    const _earnC = _d ? '#74c69d' : '#276749';
    if (!container) return;
    if (!r.activity.length) {
        container.innerHTML = `<div style="text-align:center;padding:24px 0;color:#9e9bb8;font-size:13px">No activity yet. Start earning coins!</div>`;
        return;
    }
    container.innerHTML = r.activity.slice(0, 6).map(a => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:${_cardBg};border-radius:14px;border:1px solid ${_border}">
            <div style="width:32px;height:32px;border-radius:10px;background:rgba(77,65,223,0.10);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span class="material-symbols-outlined" style="font-size:16px;color:#4d41df;font-variation-settings:'FILL' 1">monetization_on</span>
            </div>
            <p style="flex:1;font-size:12px;color:${_textC};line-height:1.4">${a.reason}</p>
            <span style="font-size:12px;font-weight:800;color:${_earnC};flex-shrink:0">+${a.amount}</span>
        </div>`).join('');
}

function _renderBadges(r) {
    const container = document.getElementById('rewards-list-container');
    const label = document.getElementById('badges-earned-label');
    if (!container) return;
    if (label) label.textContent = `${r.earnedBadges.length} earned`;
    const _d = document.documentElement.classList.contains('dark-theme');
    const _cardBg = _d ? '#1c1b2e' : '#fff';
    const _border = _d ? '#2a2840' : '#eae6f3';
    const _titleC = _d ? '#e8e6f4' : '#1b1b24';
    const _shadow = _d ? '0 2px 8px -4px rgba(0,0,0,0.5)' : '0 2px 8px -4px rgba(77,65,223,0.06)';

    container.innerHTML = _allBadges.map(b => {
        const earned = r.earnedBadges.includes(b.id);
        return `
        <div style="background:${_cardBg};border-radius:18px;padding:14px 10px;border:${earned ? `2px solid ${b.color}30` : `1px solid ${_border}`};box-shadow:${earned ? `0 4px 16px -4px ${b.color}30` : _shadow};text-align:center;transition:transform 0.15s;${earned ? '' : 'opacity:0.45;filter:grayscale(0.6)'}"
            onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform=''">
            <div style="width:48px;height:48px;border-radius:14px;background:${earned ? b.bg : 'rgba(119,117,135,0.08)'};display:flex;align-items:center;justify-content:center;margin:0 auto 8px;position:relative">
                <span class="material-symbols-outlined" style="font-size:24px;color:${earned ? b.color : '#9e9bb8'};font-variation-settings:'FILL' 1">${b.icon}</span>
                ${earned ? `<span style="position:absolute;-top:4px;-right:4px;width:14px;height:14px;background:#276749;border-radius:50%;display:flex;align-items:center;justify-content:center;top:-4px;right:-4px"><span class="material-symbols-outlined" style="font-size:10px;color:#fff;font-variation-settings:'FILL' 1">check</span></span>` : ''}
            </div>
            <p style="font-size:11px;font-weight:700;color:${earned ? _titleC : '#9e9bb8'};line-height:1.3">${b.name}</p>
            <p style="font-size:10px;color:#9e9bb8;margin-top:2px;line-height:1.3">${b.desc}</p>
        </div>`;
    }).join('');
}


// ============================================================
// COMPANY DASHBOARD
// ============================================================

const _companyScreens = ['company-dashboard', 'company-post-job', 'company-applications', 'company-messages', 'co-own-profile'];

function isCompanyUser() {
    const d = getProfileData();
    return d.role === 'company';
}

function companyNavTo(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`screen-${screenId}`);
    if (!target) return;
    target.classList.add('active');

    // Show/hide navbars
    const bottomNav = document.getElementById('bottom-nav');
    const companyNav = document.getElementById('company-bottom-nav');
    const globalHeader = document.getElementById('global-header');
    if (bottomNav) bottomNav.classList.add('hidden');
    if (companyNav) companyNav.classList.remove('hidden');
    if (globalHeader) globalHeader.classList.remove('hidden');

    // Update active state on company nav
    document.querySelectorAll('.co-nav-item').forEach(item => {
        item.classList.remove('text-indigo-600', 'scale-110');
        item.classList.add('text-slate-400');
        const icon = item.querySelector('.co-nav-icon');
        if (icon) icon.style.fontVariationSettings = "'FILL' 0";
        if (item.getAttribute('data-co-target') === screenId) {
            item.classList.remove('text-slate-400');
            item.classList.add('text-indigo-600', 'scale-110');
            if (icon) icon.style.fontVariationSettings = "'FILL' 1";
        }
    });

    if (screenId === 'company-dashboard') loadCompanyDashboard();
    if (screenId === 'co-own-profile') loadCompanyProfile();
    if (screenId === 'company-applications') loadCompanyApplications();
    if (screenId === 'company-training') loadTrainingScreen();
    if (screenId === 'company-candidates') searchCandidates();

    history.pushState({ screen: screenId }, '', window.location.pathname);
}
window.companyNavTo = companyNavTo;

function loadCompanyDashboard() {
    const d = getCompanyData();
    const user = auth.currentUser;
    const name = d.name || (user && user.displayName) || 'Company';

    const nameEl = document.getElementById('company-dashboard-name');
    if (nameEl) nameEl.textContent = 'Welcome, ' + name;

    const subtitleEl = document.getElementById('company-dashboard-subtitle');
    if (subtitleEl) subtitleEl.textContent = 'Manage your jobs and track applicants';

    // Fetch stats from Firestore applications collection
    if (!user) return;
    const companyId = name.toLowerCase().replace(/\s+/g, '_');

    // Active jobs: count only active jobs posted by this company
    // (updateActiveJobsCounter handles localStorage + Firestore with animation)
    updateActiveJobsCounter();

    // Total applications received for this company's jobs
    db.collection('applications').where('companyId', '==', companyId).get()
        .then(snap => {
            const apps = snap.docs.map(d => d.data());
            const el = document.getElementById('co-stat-apps');
            if (el) el.textContent = apps.length;

            const shortlisted = apps.filter(a => a.status === 'Shortlisted').length;
            const hired = apps.filter(a => a.status === 'Hired').length;
            const slEl = document.getElementById('co-stat-shortlisted');
            const hiEl = document.getElementById('co-stat-hired');
            if (slEl) slEl.textContent = shortlisted;
            if (hiEl) hiEl.textContent = hired;
        })
        .catch(() => {
            const apps = JSON.parse(localStorage.getItem(_appsKey()) || '[]');
            const myApps = apps.filter(a => a.companyId === companyId);
            const el = document.getElementById('co-stat-apps');
            if (el) el.textContent = myApps.length;
            const slEl = document.getElementById('co-stat-shortlisted');
            const hiEl = document.getElementById('co-stat-hired');
            if (slEl) slEl.textContent = myApps.filter(a => a.status === 'Shortlisted').length;
            if (hiEl) hiEl.textContent = myApps.filter(a => a.status === 'Hired').length;
        });
}

function loadCompanyProfile() {
    const d = getProfileData();
    const user = auth.currentUser;
    const name = d.name || (user && user.displayName) || 'Company';
    const nameEl = document.getElementById('co-profile-name');
    const indEl = document.getElementById('co-profile-industry');
    const addrEl = document.getElementById('co-profile-address');
    if (nameEl) nameEl.textContent = name;
    if (indEl) indEl.textContent = d.industry || '';
    if (addrEl) addrEl.textContent = d.address || '';
}

function loadCompanyApplications() {
    const d = getProfileData();
    const user = auth.currentUser;
    const name = d.name || (user && user.displayName) || '';
    const companyId = name.toLowerCase().replace(/\s+/g, '_');
    const container = document.getElementById('co-applications-list');
    if (!container) return;

    // Use a global applications key to find apps submitted to this company
    const _allAppsKeys = Object.keys(localStorage).filter(k => k.startsWith('tarini_applications_'));
    const apps = _allAppsKeys.reduce((acc, k) => {
        const list = JSON.parse(localStorage.getItem(k) || '[]');
        return acc.concat(list.filter(a => a.companyId === companyId));
    }, []);

    if (apps.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16">
                <div class="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                    <span class="material-symbols-outlined text-secondary" style="font-size:32px;font-variation-settings:'FILL' 1">assignment</span>
                </div>
                <p class="font-bold text-on-surface text-[15px]">No applications yet</p>
                <p class="text-[13px] text-on-surface-variant mt-1">Applications from candidates will appear here.</p>
            </div>`;
        return;
    }

    const statusStyle = s => s === 'Applied' ? 'background:rgba(77,65,223,0.10);color:#4d41df'
        : s === 'Shortlisted' ? 'background:rgba(92,81,160,0.10);color:#5c51a0'
            : s === 'Hired' ? 'background:rgba(45,106,79,0.10);color:#276749'
                : 'background:rgba(135,80,65,0.10);color:#875041';

    container.innerHTML = apps.map(app => {
        const date = new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        return `
        <div style="background:#fff;border-radius:18px;padding:16px;border:1px solid #eae6f3;box-shadow:0 2px 12px -4px rgba(77,65,223,0.08)">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                <div>
                    <p style="font-size:14px;font-weight:700;color:#1b1b24">${app.applicant ? app.applicant.name : 'Applicant'}</p>
                    <p style="font-size:12px;color:#777587;margin-top:2px">${app.title} &bull; ${app.location}</p>
                    <p style="font-size:11px;color:#9e9bb8;margin-top:4px">Applied ${date}</p>
                </div>
                <span style="flex-shrink:0;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;${statusStyle(app.status)}">${app.status}</span>
            </div>
        </div>`;
    }).join('');
}

// Override onAuthStateChanged to handle company role redirect
const _origAuthStateChanged = auth.onAuthStateChanged.bind(auth);
auth.onAuthStateChanged((user) => {
    if (user) {
        const d = getProfileData();
        if (d.role === 'company') {
            // Hide user bottom nav, show company nav
            const bottomNav = document.getElementById('bottom-nav');
            const companyNav = document.getElementById('company-bottom-nav');
            const globalHeader = document.getElementById('global-header');
            if (bottomNav) bottomNav.classList.add('hidden');
            if (companyNav) companyNav.classList.remove('hidden');
            if (globalHeader) globalHeader.classList.remove('hidden');

            const loginScreen = document.getElementById('screen-login');
            if (loginScreen && loginScreen.classList.contains('active')) {
                companyNavTo('company-dashboard');
            }
        }
    }
});

// Patch handleRegister to redirect company users to company dashboard
const _origHandleRegister = window.handleRegister;
window.handleRegister = async function (role) {
    await _origHandleRegister(role);
    if (role === 'company') {
        setTimeout(() => {
            const d = getProfileData();
            if (d.role === 'company') companyNavTo('company-dashboard');
        }, 300);
    }
};

// Patch handleLogin to redirect company users
const _origHandleLogin = window.handleLogin;
window.handleLogin = async function () {
    await _origHandleLogin();
    setTimeout(() => {
        const d = getProfileData();
        if (d.role === 'company') companyNavTo('company-dashboard');
    }, 500);
};

// ============================================================
// COMPANY PROFILE DATA — separate localStorage key from women users
// ============================================================

function _companyDataKey() {
    const u = auth.currentUser;
    return u ? `companyProfileData_${u.uid}` : 'companyProfileData_guest';
}

function getCompanyData() {
    const key = _companyDataKey();
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    // Seed from auth if name is missing
    const u = auth.currentUser;
    if (!data.name && u && u.displayName) {
        data.name = u.displayName;
        localStorage.setItem(key, JSON.stringify(data));
    }
    return data;
}

function saveCompanyData(data) {
    localStorage.setItem(_companyDataKey(), JSON.stringify(data));
}

// Override the stub loadCompanyProfile with a full implementation
loadCompanyProfile = function () {
    const d = getCompanyData();
    const user = auth.currentUser;
    if (!d.name && user && user.displayName) { d.name = user.displayName; saveCompanyData(d); }
    const name = d.name || (user && user.displayName) || 'Company';
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('co-profile-name', name);
    set('co-profile-tagline', d.tagline || 'Building the future together');
    set('co-profile-industry', d.industry || '');
    set('co-profile-location', d.location || 'Location not set');
    set('co-profile-website', d.website || 'Website not set');
    set('co-profile-employees', d.employees || '—');
    set('co-profile-founded', d.founded || '—');
    set('co-profile-desc', d.description || 'No description added yet.');
    set('co-profile-email', d.email || '—');
    set('co-profile-phone', d.phone || '—');
    set('co-profile-address', d.address || '—');
    const wLink = document.getElementById('co-profile-website-link');
    if (wLink && d.website) { wLink.href = d.website.startsWith('http') ? d.website : 'https://' + d.website; wLink.onclick = null; }
    const hlEl = document.getElementById('co-profile-highlights-list');
    if (hlEl) {
        const lines = (d.highlights || '').split('\n').map(l => l.trim()).filter(Boolean);
        hlEl.innerHTML = lines.length ? lines.map(function (l) { return '<div style="display:flex;align-items:center;gap:8px"><span class="material-symbols-outlined" style="font-size:16px;color:#5c51a0">check_circle</span><p style="font-size:13px;font-weight:500;color:inherit">' + l + '</p></div>'; }).join('') : '<p style="font-size:13px;color:#777587">No highlights added yet.</p>';
    }
    const jobCount = (typeof getCompanyJobs === 'function') ? getCompanyJobs().length : 0;
    set('co-stat-jobs-count', jobCount || '0');
    set('co-profile-type', d.type || '-');
    set('co-profile-revenue', d.revenue || '-');
    set('co-profile-hq', d.hq || d.location || '-');
    set('co-profile-industry-detail', d.industry || '-');
    set('co-profile-mission', d.mission || 'No mission statement added yet.');
    var specEl = document.getElementById('co-profile-specialisations');
    if (specEl) { var specs = (d.specialisations || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean); specEl.innerHTML = specs.length ? specs.map(function (s) { return '<span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;background:rgba(77,65,223,0.10);color:#4d41df">' + s + '</span>'; }).join('') : '<p style="font-size:13px;color:#777587">-</p>'; }
    var socialEl = document.getElementById('co-social-links');
    if (socialEl) { var sLinks = []; if (d.website) sLinks.push({ icon: 'language', label: 'Website', url: d.website.startsWith('http') ? d.website : 'https://' + d.website, color: '#4d41df' }); if (d.linkedin) sLinks.push({ icon: 'group', label: 'LinkedIn', url: d.linkedin, color: '#0077b5' }); if (d.twitter) sLinks.push({ icon: 'tag', label: 'Twitter/X', url: d.twitter, color: '#1da1f2' }); socialEl.innerHTML = sLinks.length ? sLinks.map(function (l) { return '<a href="' + l.url + '" target="_blank" style="display:flex;align-items:center;gap:10px;padding:8px 0;text-decoration:none"><div style="width:32px;height:32px;border-radius:10px;background:rgba(77,65,223,0.08);display:flex;align-items:center;justify-content:center"><span class="material-symbols-outlined" style="font-size:16px;color:' + l.color + '">' + l.icon + '</span></div><p style="font-size:13px;font-weight:600;color:' + l.color + '">' + l.label + '</p></a>'; }).join('') : '<p style="font-size:13px;color:#777587">No social links added yet.</p>'; }
    var jobsListEl = document.getElementById('co-profile-jobs-list');
    if (jobsListEl && typeof getCompanyJobs === 'function') { var aJobs = getCompanyJobs().filter(function (j) { return j.status === 'active'; }).slice(0, 3); jobsListEl.innerHTML = aJobs.length ? aJobs.map(function (j) { return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:rgba(77,65,223,0.05);border-radius:12px;margin-bottom:6px"><div><p style="font-size:13px;font-weight:700;color:#1b1b24">' + j.title + '</p><p style="font-size:11px;color:#777587;margin-top:1px">' + j.type + ' &bull; ' + j.location + '</p></div><span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(45,106,79,0.10);color:#276749">Active</span></div>'; }).join('') : '<p style="font-size:13px;color:#777587">No active jobs yet.</p>'; }
    const img = document.getElementById('co-logo-img');
    const icon = document.getElementById('co-logo-icon');
    if (img && icon) {
        if (d.logo) { img.src = d.logo; img.classList.remove('hidden'); icon.classList.add('hidden'); }
        else { img.classList.add('hidden'); icon.classList.remove('hidden'); }
    }
};

function openEditCompanyProfile() {
    const d = getCompanyData();
    const user = auth.currentUser;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('ecp-name', d.name || (user && user.displayName) || '');
    set('ecp-tagline', d.tagline || '');
    set('ecp-industry', d.industry || '');
    set('ecp-employees', d.employees || '');
    set('ecp-founded', d.founded || '');
    set('ecp-desc', d.description || '');
    set('ecp-location', d.location || '');
    set('ecp-website', d.website || '');
    set('ecp-email', d.email || (user && user.email) || '');
    set('ecp-phone', d.phone || '');
    set('ecp-highlights', d.highlights || '');
    set('ecp-type', d.type || '');
    set('ecp-revenue', d.revenue || '');
    set('ecp-hq', d.hq || '');
    set('ecp-specialisations', d.specialisations || '');
    set('ecp-mission', d.mission || '');
    set('ecp-linkedin', d.linkedin || '');
    set('ecp-twitter', d.twitter || '');
    companyNavTo('edit-company-profile');
}
window.openEditCompanyProfile = openEditCompanyProfile;

function saveCompanyProfile() {
    const d = getCompanyData();
    const get = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    d.name = get('ecp-name');
    d.tagline = get('ecp-tagline');
    d.industry = get('ecp-industry');
    d.employees = get('ecp-employees');
    d.founded = get('ecp-founded');
    d.description = get('ecp-desc');
    d.location = get('ecp-location');
    d.website = get('ecp-website');
    d.email = get('ecp-email');
    d.phone = get('ecp-phone');
    d.highlights = get('ecp-highlights');
    d.type = get('ecp-type');
    d.revenue = get('ecp-revenue');
    d.hq = get('ecp-hq');
    d.specialisations = get('ecp-specialisations');
    d.mission = get('ecp-mission');
    d.linkedin = get('ecp-linkedin');
    d.twitter = get('ecp-twitter');
    saveCompanyData(d);
    _companiesCache = null; // invalidate so updated data shows on next profile view
    companyNavTo('co-own-profile');
}
window.saveCompanyProfile = saveCompanyProfile;

function handleCompanyLogoChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const d = getCompanyData();
        d.logo = e.target.result;
        saveCompanyData(d);
        loadCompanyProfile();
    };
    reader.readAsDataURL(file);
}
window.handleCompanyLogoChange = handleCompanyLogoChange;

// Seed company data on first login for company users
(function patchCompanyAuthObserver() {
    const _origOnAuth = auth.onAuthStateChanged.bind(auth);
    _origOnAuth((user) => {
        if (user) {
            const d = getProfileData();
            if (d.role === 'company') {
                const cd = getCompanyData();
                if (!cd.name && user.displayName) {
                    cd.name = user.displayName;
                    saveCompanyData(cd);
                }
            }
        }
    });
})();

// ============================================================
// POST A JOB — Company Side (full implementation)
// ============================================================

function _companyJobsKey() {
    const u = auth.currentUser;
    return u ? `companyJobs_${u.uid}` : 'companyJobs_guest';
}
function getCompanyJobs() {
    return JSON.parse(localStorage.getItem(_companyJobsKey()) || '[]');
}
function saveCompanyJobs(jobs) {
    localStorage.setItem(_companyJobsKey(), JSON.stringify(jobs));
}

// ---- Form modal open/close ----
function openPostJobForm() {
    const d = getCompanyData();
    const user = auth.currentUser;
    const name = d.name || (user && user.displayName) || '';

    document.getElementById('pj-edit-id').value = '';
    document.getElementById('pj-company').value = name;
    ['pj-title', 'pj-description', 'pj-type', 'pj-workmode', 'pj-location',
        'pj-salary-min', 'pj-salary-max', 'pj-experience', 'pj-openings', 'pj-skills', 'pj-deadline']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('pj-urgent').checked = false;
    document.getElementById('pj-remote-friendly').checked = false;
    document.getElementById('pj-status-row').classList.add('hidden');
    document.getElementById('pj-error').classList.add('hidden');
    document.getElementById('job-form-title').textContent = 'Post a Job';
    document.getElementById('pj-submit-label').textContent = 'Post Job';
    const btn = document.getElementById('pj-submit-btn');
    btn.disabled = false; btn.style.opacity = '1';

    const modal = document.getElementById('job-form-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
window.openPostJobForm = openPostJobForm;

function closePostJobForm() {
    document.getElementById('job-form-modal').classList.add('hidden');
    document.body.style.overflow = '';
}
window.closePostJobForm = closePostJobForm;

function _modalBgClick(e) {
    if (e.target === document.getElementById('job-form-modal')) closePostJobForm();
}
window._modalBgClick = _modalBgClick;

// ---- Open form pre-filled for editing ----
function openEditJobForm(jobId) {
    const jobs = getCompanyJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    document.getElementById('pj-edit-id').value = jobId;
    document.getElementById('pj-company').value = job.company || '';
    document.getElementById('pj-title').value = job.title || '';
    document.getElementById('pj-description').value = job.description || '';
    document.getElementById('pj-type').value = job.type || '';
    document.getElementById('pj-workmode').value = job.workmode || '';
    document.getElementById('pj-location').value = job.location || '';
    document.getElementById('pj-salary-min').value = job.salaryMin || '';
    document.getElementById('pj-salary-max').value = job.salaryMax || '';
    document.getElementById('pj-experience').value = job.experience || '';
    document.getElementById('pj-openings').value = job.openings || '';
    document.getElementById('pj-skills').value = job.skills || '';
    document.getElementById('pj-deadline').value = job.deadline || '';
    document.getElementById('pj-urgent').checked = !!job.urgent;
    document.getElementById('pj-remote-friendly').checked = !!job.remoteFriendly;
    document.getElementById('pj-status').value = job.status || 'active';
    document.getElementById('pj-status-row').classList.remove('hidden');
    document.getElementById('pj-error').classList.add('hidden');
    document.getElementById('job-form-title').textContent = 'Edit Job';
    document.getElementById('pj-submit-label').textContent = 'Save Changes';
    const btn = document.getElementById('pj-submit-btn');
    btn.disabled = false; btn.style.opacity = '1';

    document.getElementById('job-form-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
window.openEditJobForm = openEditJobForm;

// ---- Submit (post new or save edit) ----
function submitPostJob() {
    const get = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const getCheck = id => { const el = document.getElementById(id); return el ? el.checked : false; };

    const editId = get('pj-edit-id');
    const title = get('pj-title');
    const company = get('pj-company');
    const description = get('pj-description');
    const type = get('pj-type');
    const workmode = get('pj-workmode');
    const location = get('pj-location');
    const salaryMin = get('pj-salary-min');
    const salaryMax = get('pj-salary-max');
    const experience = get('pj-experience');
    const openings = get('pj-openings');
    const skills = get('pj-skills');
    const deadline = get('pj-deadline');
    const urgent = getCheck('pj-urgent');
    const remoteFriendly = getCheck('pj-remote-friendly');
    const status = editId ? (get('pj-status') || 'active') : 'active';

    const errEl = document.getElementById('pj-error');
    const btn = document.getElementById('pj-submit-btn');

    if (!title || !description || !type || !workmode || !location || !experience || !openings || !skills) {
        errEl.textContent = 'Please fill in all required fields.';
        errEl.classList.remove('hidden');
        return;
    }
    errEl.classList.add('hidden');
    btn.disabled = true; btn.style.opacity = '0.75';
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;animation:spin 0.8s linear infinite">progress_activity</span>&nbsp;' + (editId ? 'Saving...' : 'Posting...');

    const salary = salaryMin && salaryMax
        ? '\u20b9' + Number(salaryMin).toLocaleString('en-IN') + '\u2013\u20b9' + Number(salaryMax).toLocaleString('en-IN') + '/mo'
        : salaryMin ? '\u20b9' + Number(salaryMin).toLocaleString('en-IN') + '/mo'
            : salaryMax ? 'Up to \u20b9' + Number(salaryMax).toLocaleString('en-IN') + '/mo'
                : 'Negotiable';

    const user = auth.currentUser;
    let jobs = getCompanyJobs();
    let isEdit = false;

    if (editId) {
        // Update existing
        isEdit = true;
        jobs = jobs.map(j => j.id === Number(editId)
            ? {
                ...j, title, description, type, workmode, location,
                salaryMin: salaryMin ? Number(salaryMin) : null,
                salaryMax: salaryMax ? Number(salaryMax) : null,
                salary, experience, openings: Number(openings), skills,
                deadline: deadline || null, urgent, remoteFriendly, status
            }
            : j);
    } else {
        // New job
        const newJob = {
            id: Date.now(), title, company, description, type, workmode, location,
            salaryMin: salaryMin ? Number(salaryMin) : null,
            salaryMax: salaryMax ? Number(salaryMax) : null,
            salary, experience, openings: Number(openings), skills,
            deadline: deadline || null, urgent, remoteFriendly,
            companyId: user ? user.uid : 'guest',
            status: 'active',
            postedAt: new Date().toISOString(),
        };
        jobs.unshift(newJob);
    }
    saveCompanyJobs(jobs);

    // Firestore sync
    if (user && !isEdit) {
        const fsData = {
            title, company, description, type, workmode, location,
            salaryMin: salaryMin ? Number(salaryMin) : null,
            salaryMax: salaryMax ? Number(salaryMax) : null,
            salary, experience, openings: Number(openings), skills,
            deadline: deadline || null, urgent, remoteFriendly,
            companyId: user.uid, status: 'active',
            postedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        db.collection('jobs').add(fsData).catch(() => { });
    }

    setTimeout(() => {
        btn.disabled = false; btn.style.opacity = '1';
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:20px;font-variation-settings:\'FILL\' 1">work</span>&nbsp;<span id="pj-submit-label">' + (isEdit ? 'Save Changes' : 'Post Job') + '</span>';

        closePostJobForm();
        renderPostedJobsList();
        updateActiveJobsCounter();

        const toastMsg = document.getElementById('post-job-toast-msg');
        if (toastMsg) toastMsg.textContent = isEdit ? 'Job Updated Successfully!' : 'Job Posted Successfully!';
        const toast = document.getElementById('post-job-success-toast');
        if (toast) { toast.classList.remove('hidden'); setTimeout(() => toast.classList.add('hidden'), 2500); }
    }, 600);
}
window.submitPostJob = submitPostJob;

// ---- Close a job (set status = closed) ----
function closeJob(jobId) {
    const jobs = getCompanyJobs().map(j => j.id === jobId ? { ...j, status: 'closed' } : j);
    saveCompanyJobs(jobs);
    renderPostedJobsList();
    updateActiveJobsCounter();
    showToast('Job marked as Closed');
}
window.closeJob = closeJob;

// ---- Reopen a closed job ----
function reopenJob(jobId) {
    const jobs = getCompanyJobs().map(j => j.id === jobId ? { ...j, status: 'active' } : j);
    saveCompanyJobs(jobs);
    renderPostedJobsList();
    updateActiveJobsCounter();
    showToast('Job marked as Active');
}
window.reopenJob = reopenJob;

// ---- Render the posted jobs list ----
function renderPostedJobsList() {
    const container = document.getElementById('pj-jobs-list');
    const countEl = document.getElementById('pj-jobs-count');
    if (!container) return;

    const jobs = getCompanyJobs();
    if (countEl) countEl.textContent = jobs.length + ' job' + (jobs.length !== 1 ? 's' : '');

    if (jobs.length === 0) {
        container.innerHTML = `
        <div style="text-align:center;padding:48px 0">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(77,65,223,0.10);display:flex;align-items:center;justify-content:center;margin:0 auto 14px">
                <span class="material-symbols-outlined" style="font-size:30px;color:#4d41df;font-variation-settings:'FILL' 1">work_outline</span>
            </div>
            <p style="font-size:15px;font-weight:700;color:#1b1b24">No jobs posted yet</p>
            <p style="font-size:13px;color:#777587;margin-top:4px">Tap "Post Job" above to get started</p>
        </div>`;
        return;
    }

    container.innerHTML = jobs.map((job, idx) => {
        const isActive = job.status === 'active';
        const date = new Date(job.postedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const typeColor = job.type === 'Full-time' ? '#4d41df' : job.type === 'Part-time' ? '#875041' : job.type === 'Internship' ? '#5c51a0' : '#276749';
        const typeBg = job.type === 'Full-time' ? 'rgba(77,65,223,0.10)' : job.type === 'Part-time' ? 'rgba(135,80,65,0.10)' : job.type === 'Internship' ? 'rgba(92,81,160,0.10)' : 'rgba(45,106,79,0.10)';
        const statusColor = isActive ? '#276749' : '#875041';
        const statusBg = isActive ? 'rgba(45,106,79,0.10)' : 'rgba(135,80,65,0.10)';
        const animDelay = idx * 60;
        return `
        <div style="background:#fff;border-radius:20px;padding:16px;border:1px solid #eae6f3;box-shadow:0 2px 12px -4px rgba(77,65,223,0.08);opacity:0;transform:translateY(10px);transition:opacity 0.3s ease ${animDelay}ms,transform 0.3s ease ${animDelay}ms" class="pj-job-card">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                        <p style="font-size:15px;font-weight:700;color:#1b1b24;line-height:1.3">${job.title}</p>
                        ${job.urgent ? '<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;background:rgba(230,57,70,0.10);color:#e63946">URGENT</span>' : ''}
                    </div>
                    <p style="font-size:12px;color:#777587;margin-top:3px">${job.company} &bull; ${job.location}</p>
                </div>
                <span style="flex-shrink:0;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;background:${statusBg};color:${statusColor}">${isActive ? 'Active' : 'Closed'}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:10px;flex-wrap:wrap">
                <span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:${typeBg};color:${typeColor}">${job.type}</span>
                <span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:rgba(77,65,223,0.07);color:#5c51a0">${job.workmode}</span>
                <span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:rgba(56,161,105,0.08);color:#276749">${job.salary}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;margin-top:8px">
                <span class="material-symbols-outlined" style="font-size:13px;color:#9e9bb8">calendar_today</span>
                <p style="font-size:11px;color:#9e9bb8">Posted ${date}</p>
                ${job.deadline ? `<span style="font-size:11px;color:#9e9bb8;margin-left:6px">&bull; Deadline: ${new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>` : ''}
            </div>
            <div style="display:flex;gap:8px;margin-top:12px">
                <button onclick="openEditJobForm(${job.id})" style="flex:1;height:36px;border-radius:10px;border:1.5px solid #4d41df;background:transparent;color:#4d41df;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:background 0.15s" onmouseenter="this.style.background='rgba(77,65,223,0.07)'" onmouseleave="this.style.background='transparent'">
                    <span class="material-symbols-outlined" style="font-size:15px">edit</span>Edit
                </button>
                ${isActive
                ? `<button onclick="closeJob(${job.id})" style="flex:1;height:36px;border-radius:10px;border:1.5px solid #875041;background:transparent;color:#875041;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:background 0.15s" onmouseenter="this.style.background='rgba(135,80,65,0.07)'" onmouseleave="this.style.background='transparent'"><span class="material-symbols-outlined" style="font-size:15px">lock</span>Close Job</button>`
                : `<button onclick="reopenJob(${job.id})" style="flex:1;height:36px;border-radius:10px;border:1.5px solid #276749;background:transparent;color:#276749;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:background 0.15s" onmouseenter="this.style.background='rgba(45,106,79,0.07)'" onmouseleave="this.style.background='transparent'"><span class="material-symbols-outlined" style="font-size:15px">lock_open</span>Reopen</button>`
            }
            </div>
        </div>`;
    }).join('');

    // Trigger entrance animation
    requestAnimationFrame(() => {
        container.querySelectorAll('.pj-job-card').forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    });
}
window.renderPostedJobsList = renderPostedJobsList;

// ============================================================
// ACTIVE JOBS COUNTER — real-time sync
// ============================================================

function updateActiveJobsCounter() {
    const el = document.getElementById('co-stat-jobs');
    if (!el) return;
    const localCount = getCompanyJobs().filter(j => j.status === 'active').length;
    _animateCounter(el, localCount);
    const user = auth.currentUser;
    if (user) {
        db.collection('jobs')
            .where('companyId', '==', user.uid)
            .where('status', '==', 'active')
            .get()
            .then(snap => { _animateCounter(el, Math.max(snap.size, localCount)); })
            .catch(() => { });
    }
}
window.updateActiveJobsCounter = updateActiveJobsCounter;

function _animateCounter(el, newVal) {
    const current = parseInt(el.textContent) || 0;
    if (current === newVal) return;
    el.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
    el.style.transform = 'scale(1.3)';
    el.style.opacity = '0.5';
    setTimeout(() => {
        el.textContent = newVal;
        el.style.transform = 'scale(1)';
        el.style.opacity = '1';
    }, 150);
}

// Patch companyNavTo to render jobs list and refresh counter
(function () {
    const _orig = window.companyNavTo;
    window.companyNavTo = function (screenId) {
        _orig(screenId);
        if (screenId === 'company-post-job') renderPostedJobsList();
        if (screenId === 'company-dashboard') updateActiveJobsCounter();
    };
})();

// ============================================================
// COMPANY TRAINING
// ============================================================

function _trainingKey() {
    const u = auth.currentUser;
    return u ? `companyTraining_${u.uid}` : 'companyTraining_guest';
}
function _getTrainingVideos() { return JSON.parse(localStorage.getItem(_trainingKey()) || '[]'); }
function _saveTrainingVideos(v) {
    localStorage.setItem(_trainingKey(), JSON.stringify(v));
    // Sync public video metadata to Firestore so other users can see them
    const u = auth.currentUser;
    if (!u) return;
    const pub = v.filter(x => x.privacy === 'public' || !x.privacy).map(x => ({
        id: x.id, title: x.title, desc: x.desc || '',
        privacy: x.privacy || 'public', fileName: x.fileName || '',
        fileSize: x.fileSize || '', uploadedAt: x.uploadedAt || ''
    }));
    db.collection('users').doc(u.uid).update({ trainingVideos: pub }).catch(() =>
        db.collection('users').doc(u.uid).set({ trainingVideos: pub }, { merge: true })
    );
}

let _tvPrivacy = 'public';

function setTrainingPrivacy(val) {
    _tvPrivacy = val;
    const pub = document.getElementById('tv-public-btn');
    const prv = document.getElementById('tv-private-btn');
    if (val === 'public') {
        pub.style.cssText = 'flex:1;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:13px;transition:all 0.2s;border:2px solid #4d41df;background:rgba(77,65,223,0.12);color:#4d41df';
        prv.style.cssText = 'flex:1;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:13px;transition:all 0.2s;border:2px solid #c7c4d8;background:transparent;color:#777587';
    } else {
        prv.style.cssText = 'flex:1;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:13px;transition:all 0.2s;border:2px solid #875041;background:rgba(135,80,65,0.12);color:#875041';
        pub.style.cssText = 'flex:1;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:13px;transition:all 0.2s;border:2px solid #c7c4d8;background:transparent;color:#777587';
    }
}
window.setTrainingPrivacy = setTrainingPrivacy;

function handleTrainingFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    document.getElementById('tv-file-label').textContent = file.name;
    // Sync both inputs to same file
    document.getElementById('tv-file').files = event.target.files;
}
window.handleTrainingFileChange = handleTrainingFileChange;

function openTrainingUpload() {
    _tvPrivacy = 'public';
    document.getElementById('tv-title').value = '';
    document.getElementById('tv-desc').value = '';
    document.getElementById('tv-file-label').textContent = 'Choose file';
    document.getElementById('tv-error').classList.add('hidden');
    const btn = document.getElementById('tv-submit-btn');
    btn.disabled = false; btn.style.opacity = '1';
    setTrainingPrivacy('public');
    const card = document.getElementById('training-modal-card');
    if (card) {
        const _d = document.documentElement.classList.contains('dark-theme');
        card.style.background = _d ? '#1c1b2e' : '#ffffff';
    }
    document.getElementById('training-upload-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    // Camera opens via label[for=tv-camera] click - no programmatic trigger needed
}

window.openTrainingUpload = openTrainingUpload;

function closeTrainingUpload() {
    document.getElementById('training-upload-modal').classList.add('hidden');
    document.body.style.overflow = '';
}
window.closeTrainingUpload = closeTrainingUpload;

// Session-only object URL store (cleared on page reload â€” videos are not persisted as binary)
const _trainingObjectURLs = {};

function submitTrainingVideo() {
    const title = document.getElementById('tv-title').value.trim();
    const desc = document.getElementById('tv-desc').value.trim();
    const fileInput = document.getElementById('tv-file');
    const cameraInput = document.getElementById('tv-camera');
    const file = (fileInput.files && fileInput.files[0]) || (cameraInput.files && cameraInput.files[0]);
    const errEl = document.getElementById('tv-error');
    const btn = document.getElementById('tv-submit-btn');

    if (!title) { errEl.textContent = 'Please enter a video title.'; errEl.classList.remove('hidden'); return; }
    errEl.classList.add('hidden');

    btn.disabled = true; btn.style.opacity = '0.75';
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;animation:spin 0.8s linear infinite">progress_activity</span> Saving...';

    const id = Date.now();

    // Store only metadata â€” never read video binary into memory
    const entry = {
        id,
        title,
        desc,
        privacy: _tvPrivacy,
        fileName: file ? file.name : '',
        fileSize: file ? Math.round(file.size / 1024) + ' KB' : '',
        hasFile: !!file,
        uploadedAt: new Date().toISOString(),
    };

    // Keep an object URL in memory for this session so the video can be previewed
    if (file) {
        _trainingObjectURLs[id] = URL.createObjectURL(file);
    }

    setTimeout(() => {
        const videos = _getTrainingVideos();
        videos.unshift(entry);
        _saveTrainingVideos(videos);
        closeTrainingUpload();
        loadTrainingScreen();
    }, 600);
}
window.submitTrainingVideo = submitTrainingVideo;

function deleteTrainingVideo(id) {
    if (!confirm('Delete this training video?')) return;
    _saveTrainingVideos(_getTrainingVideos().filter(v => v.id !== id));
    loadTrainingScreen();
}
window.deleteTrainingVideo = deleteTrainingVideo;

function toggleTrainingPrivacy(id) {
    const videos = _getTrainingVideos().map(v => v.id === id ? { ...v, privacy: v.privacy === 'public' ? 'private' : 'public' } : v);
    _saveTrainingVideos(videos);
    loadTrainingScreen();
}
window.toggleTrainingPrivacy = toggleTrainingPrivacy;


function openTrainingPlayer(id) {
    const v = _getTrainingVideos().find(x => x.id === id);
    if (!v) return;
    const objUrl = _trainingObjectURLs[v.id] || '';
    const video = document.getElementById('training-player-video');
    const noFile = document.getElementById('player-no-file');

    document.getElementById('player-title').textContent = v.title;
    document.getElementById('player-meta').textContent = v.desc || '';

    const isPrivate = v.privacy === 'private';
    const badge = document.getElementById('player-privacy-badge');
    badge.textContent = isPrivate ? 'ðŸ”’ Private' : 'ðŸŒ Public';
    badge.style.cssText = isPrivate
        ? 'font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;background:rgba(135,80,65,0.25);color:#feb5a2'
        : 'font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;background:rgba(45,106,79,0.25);color:#74c69d';

    document.getElementById('player-date').textContent = new Date(v.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    document.getElementById('player-size').textContent = v.fileSize || '';

    if (objUrl) {
        video.src = objUrl;
        video.classList.remove('hidden');
        noFile.classList.add('hidden');
        noFile.style.display = 'none';
        video.load();
    } else {
        video.src = '';
        video.classList.add('hidden');
        noFile.classList.remove('hidden');
        noFile.style.display = 'flex';
    }

    document.getElementById('training-player-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
window.openTrainingPlayer = openTrainingPlayer;

// Opens the player modal from a video data object (used on public company profile)
function openPublicVideoPlayer(v) {
    if (!v) return;
    document.getElementById('player-title').textContent = v.title || 'Untitled';
    document.getElementById('player-meta').textContent = v.desc || '';
    const badge = document.getElementById('player-privacy-badge');
    badge.textContent = 'Public';
    badge.style.cssText = 'font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;background:rgba(45,106,79,0.25);color:#74c69d';
    document.getElementById('player-date').textContent = v.uploadedAt ? new Date(v.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    document.getElementById('player-size').textContent = v.fileSize || '';
    const video = document.getElementById('training-player-video');
    const noFile = document.getElementById('player-no-file');
    // Try in-memory object URL first (same session as uploader), then no-file fallback
    const objUrl = _trainingObjectURLs[v.id] || '';
    if (objUrl) {
        video.src = objUrl;
        video.classList.remove('hidden');
        noFile.classList.add('hidden');
        noFile.style.display = 'none';
        video.load();
    } else {
        video.src = '';
        video.classList.add('hidden');
        noFile.classList.remove('hidden');
        noFile.style.display = 'flex';
    }
    document.getElementById('training-player-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
window.openPublicVideoPlayer = openPublicVideoPlayer;

function closeTrainingPlayer(e) {
    if (e && e.target !== document.getElementById('training-player-modal')) return;
    const video = document.getElementById('training-player-video');
    video.pause();
    video.src = '';
    document.getElementById('training-player-modal').classList.add('hidden');
    document.body.style.overflow = '';
}
window.closeTrainingPlayer = closeTrainingPlayer;
function loadTrainingScreen() {
    const videos = _getTrainingVideos();
    // Sync to Firestore on every load so other users always see latest public videos
    if (videos.length) _saveTrainingVideos(videos);
    const empty = document.getElementById('training-empty-state');
    const list = document.getElementById('training-list');
    const fab = document.getElementById('training-fab');
    if (!list) return;

    const _d = document.documentElement.classList.contains('dark-theme');
    const cardBg = _d ? '#1c1b2e' : '#ffffff';
    const border = _d ? '#2a2840' : '#eae6f3';
    const titleC = _d ? '#e8e6f4' : '#1b1b24';
    const subC = _d ? '#9e9bb8' : '#777587';
    const shadow = _d ? '0 4px 16px -4px rgba(0,0,0,0.5)' : '0 4px 16px -4px rgba(77,65,223,0.10)';
    const thumbBg = _d ? '#252438' : '#f0ecf9';

    // Update stats
    const total = videos.length;
    const pub = videos.filter(v => v.privacy === 'public').length;
    const priv = videos.filter(v => v.privacy === 'private').length;
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('training-stat-total', total);
    setEl('training-stat-public', pub);
    setEl('training-stat-private', priv);

    if (total === 0) {
        empty.classList.remove('hidden'); empty.style.display = 'flex';
        list.innerHTML = '';
        if (fab) fab.classList.add('hidden');
        return;
    }
    empty.classList.add('hidden'); empty.style.display = 'none';
    if (fab) fab.classList.remove('hidden');

    const recent = videos.slice(0, 4);
    const older = videos.slice(4);

    const gradients = [
        'linear-gradient(135deg,#4d41df,#675df9)',
        'linear-gradient(135deg,#875041,#feb5a2)',
        'linear-gradient(135deg,#5c51a0,#c8bfff)',
        'linear-gradient(135deg,#276749,#74c69d)',
        'linear-gradient(135deg,#c77dff,#7b2d8b)',
    ];

    const videoCard = (v, idx) => {
        const isPrivate = v.privacy === 'private';
        const date = new Date(v.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const privacyCol = isPrivate ? '#875041' : '#276749';
        const privacyBg = isPrivate ? 'rgba(135,80,65,0.12)' : 'rgba(45,106,79,0.12)';
        const privacyIcon = isPrivate ? 'lock' : 'public';
        const grad = gradients[idx % gradients.length];
        const objUrl = _trainingObjectURLs[v.id] || '';
        const initials = v.title.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

        return `
        <div onclick="openTrainingPlayer(${v.id})" style="background:${cardBg};border-radius:20px;overflow:hidden;border:1px solid ${border};box-shadow:${shadow};transition:transform 0.15s;cursor:pointer"
            onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform=''">
            <!-- Thumbnail -->
            <div style="width:100%;height:140px;background:${thumbBg};position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center">
                ${objUrl
                ? `<video src="${objUrl}" style="width:100%;height:100%;object-fit:cover" muted></video>`
                : `<div style="width:100%;height:100%;background:${grad};display:flex;align-items:center;justify-content:center">
                        <span class="material-symbols-outlined" style="font-size:48px;color:rgba(255,255,255,0.9);font-variation-settings:'FILL' 1">play_circle</span>
                       </div>`
            }
                <!-- Privacy badge -->
                <span style="position:absolute;top:8px;left:8px;background:${privacyBg};color:${privacyCol};font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;backdrop-filter:blur(8px);display:flex;align-items:center;gap:3px;border:1px solid ${privacyCol}30">
                    <span class="material-symbols-outlined" style="font-size:10px;font-variation-settings:'FILL' 1">${privacyIcon}</span>${isPrivate ? 'Private' : 'Public'}
                </span>
                ${v.fileSize ? `<span style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.65);color:#fff;font-size:10px;font-weight:600;padding:2px 7px;border-radius:6px">${v.fileSize}</span>` : ''}
            </div>
            <!-- Info -->
            <div style="padding:14px 14px 12px">
                <p style="font-size:14px;font-weight:700;color:${titleC};line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px">${v.title}</p>
                ${v.desc ? `<p style="font-size:12px;color:${subC};line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:6px">${v.desc}</p>` : ''}
                <p style="font-size:11px;color:${subC};margin-bottom:10px">${date}${v.fileName ? ' &bull; ' + v.fileName : ''}</p>
                <!-- Actions -->
                <div style="display:flex;gap:6px">
                    <button onclick="event.stopPropagation();toggleTrainingPrivacy(${v.id})"
                        style="flex:1;height:32px;border-radius:8px;border:1px solid ${border};background:transparent;color:${subC};font-size:11px;font-weight:600;cursor:pointer;font-family:'Poppins',sans-serif;display:flex;align-items:center;justify-content:center;gap:4px">
                        <span class="material-symbols-outlined" style="font-size:13px">${isPrivate ? 'public' : 'lock'}</span>
                        Make ${isPrivate ? 'Public' : 'Private'}
                    </button>
                    <button onclick="event.stopPropagation();deleteTrainingVideo(${v.id})"
                        style="width:32px;height:32px;border-radius:8px;border:none;background:rgba(186,26,26,0.10);color:${_d ? '#ff8a8a' : '#ba1a1a'};cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                        <span class="material-symbols-outlined" style="font-size:15px">delete</span>
                    </button>
                </div>
            </div>
        </div>`;
    };

    let html = '';

    // Recent Videos section
    html += `
    <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <h3 style="font-size:16px;font-weight:700;color:${titleC};font-family:'Plus Jakarta Sans',sans-serif">Recent Videos</h3>
            <span style="font-size:12px;font-weight:600;color:#4d41df;background:rgba(77,65,223,0.10);padding:3px 10px;border-radius:999px">${total} total</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
            ${recent.map((v, i) => videoCard(v, i)).join('')}
        </div>
    </div>`;

    // Older Videos section
    if (older.length > 0) {
        html += `
    <div>
        <h3 style="font-size:16px;font-weight:700;color:${titleC};font-family:'Plus Jakarta Sans',sans-serif;margin-bottom:12px">All Videos</h3>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
            ${older.map((v, i) => videoCard(v, i + recent.length)).join('')}
        </div>
    </div>`;
    }

    list.innerHTML = html;
}
window.loadTrainingScreen = loadTrainingScreen;

// Access control: check if current user is hired by this company
function canViewPrivateTraining() {
    const user = auth.currentUser;
    if (!user) return false;
    const allAppsKeys = Object.keys(localStorage).filter(k => k.startsWith('tarini_applications_'));
    return allAppsKeys.some(k => {
        const apps = JSON.parse(localStorage.getItem(k) || '[]');
        return apps.some(a => a.userId === user.uid && a.status === 'Hired');
    });
}
window.canViewPrivateTraining = canViewPrivateTraining;

// Women users: view company training videos (public always, private only if hired)
function viewCompanyTraining(companyUid) {
    const key = `companyTraining_${companyUid}`;
    const all = JSON.parse(localStorage.getItem(key) || '[]');
    const hired = canViewPrivateTraining();
    return all.filter(v => v.privacy === 'public' || hired);
}
window.viewCompanyTraining = viewCompanyTraining;

// ============================================================
// COMPANY SEARCH (Women Dashboard)
// ============================================================


// ============================================================
// COMPANY SEARCH â€” Women Dashboard
// ============================================================

// In-memory cache so Firestore is only queried once per session
let _companiesCache = null;

async function _getAllRegisteredCompanies() {
    if (_companiesCache !== null) return _companiesCache;

    const companies = [];
    const seen = new Set();

    // 1. Firestore: query all users with role=company
    try {
        const snap = await db.collection('users').where('role', '==', 'company').get();
        snap.forEach(doc => {
            const d = doc.data();
            if (d.name && !seen.has(d.name)) {
                seen.add(d.name);
                // Merge with companyProfileData if available in localStorage
                const cpKey = `companyProfileData_${doc.id}`;
                const cp = JSON.parse(localStorage.getItem(cpKey) || '{}');
                companies.push({
                    uid: doc.id,
                    name: cp.name || d.name || '',
                    tagline: cp.tagline || d.tagline || '',
                    industry: cp.industry || d.industry || '',
                    location: cp.location || d.address || d.location || '',
                    description: cp.description || d.description || '',
                    email: cp.email || d.email || '',
                    phone: cp.phone || d.phone || '',
                    address: cp.address || d.address || '',
                    website: cp.website || d.website || '',
                    employees: cp.employees || d.employees || '',
                    founded: cp.founded || d.founded || '',
                    logo: cp.logo || d.logo || '',
                    type: cp.type || d.type || '',
                    revenue: cp.revenue || d.revenue || '',
                    hq: cp.hq || d.hq || '',
                    mission: cp.mission || d.mission || '',
                    highlights: cp.highlights || d.highlights || '',
                    specialisations: cp.specialisations || d.specialisations || '',
                    linkedin: cp.linkedin || d.linkedin || '',
                    twitter: cp.twitter || d.twitter || '',
                });
            }
        });
    } catch (e) {
        console.warn('Firestore company fetch failed, falling back to localStorage', e);
    }

    // 2. Fallback: localStorage companyProfileData_* (covers offline / same-device)
    Object.keys(localStorage).forEach(key => {
        if (!key.startsWith('companyProfileData_')) return;
        try {
            const d = JSON.parse(localStorage.getItem(key) || '{}');
            if (d.name && !seen.has(d.name)) {
                seen.add(d.name);
                const uid = key.replace('companyProfileData_', '');
                companies.push(Object.assign({}, d, { uid: d.uid || uid }));
            }
        } catch (e) { }
    });

    // 3. Fallback: profileData_* with role=company
    Object.keys(localStorage).forEach(key => {
        if (!key.startsWith('profileData_')) return;
        try {
            const d = JSON.parse(localStorage.getItem(key) || '{}');
            if (d.role === 'company' && d.name && !seen.has(d.name)) {
                seen.add(d.name);
                companies.push({
                    name: d.name, industry: d.industry || '',
                    location: d.address || d.location || '',
                    description: d.description || '', email: d.email || '',
                    website: d.website || '', tagline: d.tagline || '',
                    employees: d.employees || '', founded: d.founded || '', logo: '',
                });
            }
        } catch (e) { }
    });


    // Static sample companies — always visible even before any company registers
    [
        { name: 'TechSeva', industry: 'Technology', location: 'Remote', description: 'Hiring freshers in tech roles.', tagline: 'Hiring freshers now!', logo: '' },
        { name: 'Craft India', industry: 'Education', location: 'Mumbai', description: 'Teaching tailoring and crafts to women.', tagline: 'Empowering artisans', logo: '' },
        { name: 'GlowUp Studio', industry: 'Retail', location: 'Delhi', description: 'Beauty and wellness consultancy.', tagline: 'Beauty meets career', logo: '' },
        { name: 'MediCare Plus', industry: 'Healthcare', location: 'Bangalore', description: 'Healthcare support roles available.', tagline: 'Join our care team', logo: '' },
        { name: 'BrightMinds School', industry: 'Education', location: 'Pune', description: 'Primary school teachers needed.', tagline: 'Shape future leaders', logo: '' },
        { name: 'CodeNest', industry: 'Technology', location: 'Hybrid', description: 'Web development internships available.', tagline: 'Build the future', logo: '' },
        { name: 'FashionHub', industry: 'Retail', location: 'Chennai', description: 'Retail management and sales roles.', tagline: 'Style meets career', logo: '' },
        { name: 'PixelWorks', industry: 'Design', location: 'Hybrid', description: 'UI/UX design internships available.', tagline: 'Create. Inspire. Grow.', logo: '' },
        { name: 'WordCraft', industry: 'Media', location: 'Remote', description: 'Content writing and editing roles.', tagline: 'Words that matter', logo: '' },
        { name: 'InsightCo', industry: 'Technology', location: 'Remote', description: 'Data analyst positions open.', tagline: 'Data-driven growth', logo: '' },
    ].forEach(s => { if (!seen.has(s.name)) { seen.add(s.name); companies.push(s); } });

    _companiesCache = companies;
    return companies;
}

async function searchCompanies() {
    const q = (document.getElementById('company-search-input')?.value || '').toLowerCase().trim();
    const results = document.getElementById('company-search-results');
    const empty = document.getElementById('company-search-empty');
    const countEl = document.getElementById('company-search-count');
    if (!results) return;

    // Show loading skeleton
    results.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:16px;border-radius:16px;background:rgba(77,65,223,0.05)">' +
        '<span class="material-symbols-outlined text-primary" style="font-size:20px;animation:spin 1s linear infinite">progress_activity</span>' +
        '<p style="font-size:13px;color:#777587">Searching companies...</p></div>';
    empty.classList.add('hidden'); empty.style.display = 'none';

    const all = await _getAllRegisteredCompanies();

    const filtered = q
        ? all.filter(c => (c.name + ' ' + c.industry + ' ' + c.location + ' ' + c.description + ' ' + c.tagline + ' ' + c.specialisations)
            .toLowerCase().includes(q))
        : all;

    if (countEl) countEl.textContent = filtered.length > 0 ? filtered.length + (filtered.length === 1 ? ' company' : ' companies') : '';

    if (filtered.length === 0) {
        results.innerHTML = '';
        empty.classList.remove('hidden'); empty.style.display = 'flex';
        return;
    }
    empty.classList.add('hidden'); empty.style.display = 'none';

    const _d = document.documentElement.classList.contains('dark-theme');
    const cardBg = _d ? '#1c1b2e' : '#ffffff';
    const border = _d ? '#2a2840' : '#eae6f3';
    const titleC = _d ? '#e8e6f4' : '#1b1b24';
    const subC = _d ? '#9e9bb8' : '#777587';
    const shadow = _d ? '0 4px 16px -4px rgba(0,0,0,0.45)' : '0 4px 16px -4px rgba(77,65,223,0.10)';
    const grads = [
        'linear-gradient(135deg,#4d41df,#675df9)',
        'linear-gradient(135deg,#875041,#feb5a2)',
        'linear-gradient(135deg,#5c51a0,#c8bfff)',
        'linear-gradient(135deg,#276749,#74c69d)',
        'linear-gradient(135deg,#c77dff,#7b2d8b)',
    ];

    results.innerHTML = filtered.map((c, i) => {
        const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const grad = grads[i % grads.length];
        const desc = c.description || c.tagline || 'No description available.';
        const shortDesc = desc.length > 100 ? desc.slice(0, 100) + '...' : desc;
        const chips = [c.industry, c.type, c.employees ? c.employees + ' employees' : '', c.founded ? 'Est. ' + c.founded : ''].filter(Boolean);
        const safeName = c.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

        const logoHtml = c.logo
            ? `<img src="${c.logo}" alt="${c.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
               <div style="display:none;width:100%;height:100%;background:${grad};align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff">${initials}</div>`
            : `<div style="width:100%;height:100%;background:${grad};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff">${initials}</div>`;

        return `
        <div style="background:${cardBg};border-radius:22px;overflow:hidden;border:1px solid ${border};box-shadow:${shadow};transition:transform 0.15s,box-shadow 0.15s"
            onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='${_d ? '0 8px 24px -4px rgba(0,0,0,0.6)' : '0 8px 24px -4px rgba(77,65,223,0.16)'}'"
            onmouseleave="this.style.transform='';this.style.boxShadow='${shadow}'">
            <!-- Card header strip -->
            <div style="height:6px;background:${grad}"></div>
            <div style="padding:16px">
                <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px">
                    <!-- Logo -->
                    <div style="width:52px;height:52px;border-radius:14px;overflow:hidden;flex-shrink:0;border:2px solid ${border}">${logoHtml}</div>
                    <!-- Name + location -->
                    <div style="flex:1;min-width:0">
                        <p style="font-size:15px;font-weight:800;color:${titleC};line-height:1.2;font-family:'Plus Jakarta Sans',sans-serif">${c.name}</p>
                        ${c.tagline ? `<p style="font-size:12px;color:#4d41df;font-weight:600;margin-top:1px">${c.tagline}</p>` : ''}
                        ${c.location ? `<p style="font-size:11px;color:${subC};margin-top:3px;display:flex;align-items:center;gap:3px"><span class="material-symbols-outlined" style="font-size:12px;font-variation-settings:'FILL' 1">location_on</span>${c.location}</p>` : ''}
                    </div>
                </div>
                <!-- Chips -->
                ${chips.length ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">${chips.map(ch => `<span style="font-size:11px;font-weight:600;padding:2px 9px;border-radius:999px;background:rgba(77,65,223,0.10);color:#4d41df">${ch}</span>`).join('')}</div>` : ''}
                <!-- Description -->
                <p style="font-size:12px;color:${subC};line-height:1.6;margin-bottom:12px">${shortDesc}</p>
                <!-- Actions -->
                <div style="display:flex;gap:8px">
                    <button onclick="viewCompanyDetails('${safeName}')"
                        style="flex:1;height:38px;border-radius:12px;border:1.5px solid rgba(77,65,223,0.3);background:transparent;color:#4d41df;font-size:12px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;display:flex;align-items:center;justify-content:center;gap:5px;transition:background 0.15s"
                        onmouseenter="this.style.background='rgba(77,65,223,0.07)'" onmouseleave="this.style.background='transparent'">
                        <span class="material-symbols-outlined" style="font-size:15px;font-variation-settings:'FILL' 1">info</span>View Details
                    </button>
                    <button onclick="applyToCompany('${safeName}')"
                        style="flex:1;height:38px;border-radius:12px;border:none;background:linear-gradient(135deg,#4d41df,#5c51a0);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;display:flex;align-items:center;justify-content:center;gap:5px;transition:opacity 0.15s"
                        onmouseenter="this.style.opacity='0.88'" onmouseleave="this.style.opacity='1'">
                        <span class="material-symbols-outlined" style="font-size:15px;font-variation-settings:'FILL' 1">send</span>Apply
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}
window.searchCompanies = searchCompanies;

function viewCompanyDetails(name) {
    _getAllRegisteredCompanies().then(all => {
        const c = all.find(x => x.name === name);
        if (!c) return;
        // Build a detail modal
        const _d = document.documentElement.classList.contains('dark-theme');
        const bg = _d ? '#1c1b2e' : '#ffffff';
        const titleC = _d ? '#e8e6f4' : '#1b1b24';
        const subC = _d ? '#9e9bb8' : '#777587';

        let existing = document.getElementById('co-detail-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'co-detail-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto';
        modal.onclick = e => { if (e.target === modal) modal.remove(); };

        const rows = [
            c.industry ? ['business_center', 'Industry', c.industry] : null,
            c.type ? ['corporate_fare', 'Type', c.type] : null,
            c.location ? ['location_on', 'Location', c.location] : null,
            c.employees ? ['group', 'Employees', c.employees] : null,
            c.founded ? ['calendar_today', 'Founded', c.founded] : null,
            c.email ? ['mail', 'Email', c.email] : null,
            c.website ? ['language', 'Website', `<a href="${c.website.startsWith('http') ? c.website : 'https://' + c.website}" target="_blank" style="color:#4d41df;font-weight:600">${c.website}</a>`] : null,
            c.linkedin ? ['group', 'LinkedIn', `<a href="${c.linkedin}" target="_blank" style="color:#0077b5;font-weight:600">View Profile</a>`] : null,
        ].filter(Boolean);

        const chips = (c.specialisations || '').split(',').map(s => s.trim()).filter(Boolean);

        modal.innerHTML = `
        <div style="background:${bg};border-radius:28px;width:100%;max-width:480px;overflow:hidden;box-shadow:0 24px 64px -12px rgba(0,0,0,0.5)">
            <div style="height:8px;background:linear-gradient(135deg,#4d41df,#5c51a0,#875041)"></div>
            <div style="padding:20px 20px 0">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px">
                    <div style="display:flex;align-items:center;gap:12px">
                        <div style="width:56px;height:56px;border-radius:16px;overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,#4d41df,#675df9);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff">
                            ${c.logo ? `<img src="${c.logo}" style="width:100%;height:100%;object-fit:cover"/>` : c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p style="font-size:18px;font-weight:800;color:${titleC};font-family:'Plus Jakarta Sans',sans-serif">${c.name}</p>
                            ${c.tagline ? `<p style="font-size:12px;color:#4d41df;font-weight:600">${c.tagline}</p>` : ''}
                        </div>
                    </div>
                    <button onclick="document.getElementById('co-detail-modal').remove()" style="width:32px;height:32px;border-radius:50%;border:none;background:rgba(119,117,135,0.12);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                        <span class="material-symbols-outlined" style="font-size:18px;color:${subC}">close</span>
                    </button>
                </div>
                ${c.description ? `<p style="font-size:13px;color:${subC};line-height:1.6;margin-bottom:14px">${c.description}</p>` : ''}
                ${c.mission ? `<div style="background:rgba(77,65,223,0.07);border-radius:14px;padding:12px;margin-bottom:14px"><p style="font-size:11px;font-weight:700;color:#4d41df;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Mission</p><p style="font-size:13px;color:${subC};line-height:1.5">${c.mission}</p></div>` : ''}
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
                    ${rows.map(([icon, label, val]) => `
                    <div style="background:rgba(77,65,223,0.05);border-radius:12px;padding:10px">
                        <p style="font-size:10px;font-weight:700;color:#777587;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px">${label}</p>
                        <p style="font-size:13px;font-weight:600;color:${titleC}">${val}</p>
                    </div>`).join('')}
                </div>
                ${chips.length ? `<div style="margin-bottom:14px"><p style="font-size:11px;font-weight:700;color:#777587;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Specialisations</p><div style="display:flex;flex-wrap:wrap;gap:5px">${chips.map(s => `<span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;background:rgba(77,65,223,0.10);color:#4d41df">${s}</span>`).join('')}</div></div>` : ''}
            </div>
            <div style="padding:16px;display:flex;gap:8px">
                <button onclick="document.getElementById('co-detail-modal').remove()" style="flex:1;height:44px;border-radius:14px;border:1.5px solid rgba(77,65,223,0.25);background:transparent;color:#4d41df;font-size:13px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif">Close</button>
                <button onclick="applyToCompany('${c.name.replace(/'/g, "\\'")}');document.getElementById('co-detail-modal').remove()" style="flex:2;height:44px;border-radius:14px;border:none;background:linear-gradient(135deg,#4d41df,#5c51a0);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;display:flex;align-items:center;justify-content:center;gap:6px"><span class="material-symbols-outlined" style="font-size:16px;font-variation-settings:'FILL' 1">send</span>Apply to Jobs</button>
            </div>
        </div>`;
        document.body.appendChild(modal);
    });
}
window.viewCompanyDetails = viewCompanyDetails;

function applyToCompany(name) {
    navigateTo('jobs');
    setTimeout(() => {
        const input = document.getElementById('job-search-input');
        if (input) { input.value = name; applyJobFilters(); }
    }, 300);
}
window.applyToCompany = applyToCompany;



// ============================================================
// COMPANY PROFILE PAGE (women-facing)
// ============================================================

let _currentCompanyName = null;
let _cpFromScreen = 'jobs';

function openCompanyProfile(name) {
    _currentCompanyName = name;
    // remember which screen we came from
    const active = document.querySelector('.screen.active');
    _cpFromScreen = active ? active.id.replace('screen-', '') : 'jobs';
    navigateTo('company-profile');
}
window.openCompanyProfile = openCompanyProfile;

function goBackFromCompanyProfile() {
    navigateTo(_cpFromScreen || 'jobs');
}
window.goBackFromCompanyProfile = goBackFromCompanyProfile;

function renderCompanyProfile() {
    if (!_currentCompanyName) return;
    const name = _currentCompanyName;
    _companiesCache = null; // always fetch fresh so uid is up to date
    _getAllRegisteredCompanies().then(all => {
        const c = all.find(x => x.name === name) || { name };

        const _d = document.documentElement.classList.contains('dark-theme');
        const titleC = _d ? '#e8e6f4' : '#1b1b24';
        const subC = _d ? '#9e9bb8' : '#777587';
        const cardBg = _d ? '#1c1b2e' : '#fff';
        const border = _d ? '#2a2840' : '#eae6f3';
        const grads = ['linear-gradient(135deg,#4d41df,#675df9)', 'linear-gradient(135deg,#875041,#feb5a2)', 'linear-gradient(135deg,#5c51a0,#c8bfff)', 'linear-gradient(135deg,#2d6a4f,#74c69d)', 'linear-gradient(135deg,#c77dff,#7b2d8b)'];
        const grad = grads[Math.abs(name.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0)) % grads.length];
        const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

        // ── Header ──────────────────────────────────────────────────────────
        const hdr = document.getElementById('cp-header');
        if (hdr) hdr.innerHTML = `
            <div style="position:relative;overflow:hidden;border-radius:0 0 28px 28px;background:${grad};padding:24px 20px 28px">
                <div style="position:absolute;top:-20px;right:-20px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.10)"></div>
                <div style="position:absolute;bottom:-30px;left:-20px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.06)"></div>
                <div style="display:flex;align-items:flex-start;gap:14px;position:relative;z-index:1">
                    ${c.logo
                ? `<img src="${c.logo}" style="width:68px;height:68px;border-radius:18px;object-fit:cover;border:2px solid rgba(255,255,255,0.35);flex-shrink:0" onerror="this.style.display='none'"/>`
                : `<div style="width:68px;height:68px;border-radius:18px;background:rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff;flex-shrink:0;letter-spacing:-1px">${initials}</div>`}
                    <div style="flex:1;min-width:0">
                        <p style="font-size:21px;font-weight:800;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;line-height:1.2">${c.name}</p>
                        ${c.tagline ? `<p style="font-size:12px;color:rgba(255,255,255,0.82);margin-top:3px;line-height:1.4">${c.tagline}</p>` : ''}
                        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
                            ${c.industry ? `<span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,0.20);color:#fff">${c.industry}</span>` : ''}
                            ${c.location ? `<span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,0.20);color:#fff">&#128205; ${c.location}</span>` : ''}
                            ${c.employees ? `<span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,0.20);color:#fff">&#128100; ${c.employees}</span>` : ''}
                            ${c.founded ? `<span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,0.20);color:#fff">Est. ${c.founded}</span>` : ''}
                            ${c.type ? `<span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,0.20);color:#fff">${c.type}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>`;

        // ── Stats row ────────────────────────────────────────────────────────
        const statsEl = document.getElementById('cp-stats');
        if (statsEl) {
            const uid = c.uid;
            const postedCount = uid ? JSON.parse(localStorage.getItem('companyJobs_' + uid) || '[]').filter(j => j.status === 'active').length : 0;
            const builtinCount = _allJobs.filter(j => j.company.toLowerCase() === name.toLowerCase()).length;
            const totalJobs = builtinCount + postedCount;
            const localVids = uid ? JSON.parse(localStorage.getItem('companyTraining_' + uid) || '[]') : [];
            const localPubCount = localVids.filter(v => v.privacy === 'public' || !v.privacy).length;
            const sc = (val, label, color) =>
                `<div style="background:${cardBg};border-radius:16px;padding:12px 8px;text-align:center;border:1px solid ${border}">
                    <p style="font-size:20px;font-weight:800;color:${color};line-height:1">${val}</p>
                    <p style="font-size:10px;font-weight:600;color:${subC};margin-top:4px;text-transform:uppercase;letter-spacing:0.04em">${label}</p>
                </div>`;
            statsEl.innerHTML =
                sc(totalJobs || 0, 'Open Jobs', '#4d41df') +
                sc(c.employees || '—', 'Team Size', '#875041') +
                sc(localPubCount, 'Videos', '#5c51a0');
            if (!localVids.length && uid) {
                db.collection('users').doc(uid).get().then(doc => {
                    const fVids = doc.exists ? (doc.data().trainingVideos || []).filter(v => v.privacy === 'public' || !v.privacy) : [];
                    if (fVids.length) {
                        const cards = statsEl.querySelectorAll('div');
                        if (cards[2]) cards[2].querySelector('p').textContent = fVids.length;
                    }
                }).catch(() => { });
            }
        }

        // helper: section card
        const card = (content) =>
            `<div style="background:${cardBg};border-radius:20px;padding:16px;border:1px solid ${border}">${content}</div>`;
        const sectionTitle = (icon, label, color) =>
            `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
                <div style="width:30px;height:30px;border-radius:10px;background:${color}1a;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <span class="material-symbols-outlined" style="font-size:15px;color:${color};font-variation-settings:'FILL' 1">${icon}</span>
                </div>
                <p style="font-size:13px;font-weight:700;color:${titleC};text-transform:uppercase;letter-spacing:0.06em">${label}</p>
            </div>`;

        // ── About ────────────────────────────────────────────────────────────
        const about = document.getElementById('cp-about');
        if (about) {
            let html = '';
            if (c.description || c.mission) {
                html += card(
                    sectionTitle('info', 'About', '#4d41df') +
                    (c.description ? `<p style="font-size:13px;color:${subC};line-height:1.65;margin-bottom:${c.mission ? '10px' : '0'}">${c.description}</p>` : '') +
                    (c.mission ? `<p style="font-size:13px;color:${subC};line-height:1.65;font-style:italic;border-left:3px solid #4d41df;padding-left:10px;margin-top:4px">"${c.mission}"</p>` : '')
                );
            }
            // Highlights
            if (c.highlights) {
                const lines = c.highlights.split('\n').map(l => l.trim()).filter(Boolean);
                if (lines.length) {
                    html += `<div style="margin-top:12px">${card(
                        sectionTitle('workspace_premium', 'Highlights', '#5c51a0') +
                        lines.map(l => `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px">
                            <span class="material-symbols-outlined" style="font-size:15px;color:#5c51a0;margin-top:1px;font-variation-settings:'FILL' 1">check_circle</span>
                            <p style="font-size:13px;color:${subC};line-height:1.5">${l}</p>
                        </div>`).join('')
                    )}</div>`;
                }
            }
            // Specialisations
            if (c.specialisations) {
                const specs = c.specialisations.split(',').map(s => s.trim()).filter(Boolean);
                if (specs.length) {
                    html += `<div style="margin-top:12px">${card(
                        sectionTitle('category', 'Specialisations', '#2d6a4f') +
                        `<div style="display:flex;flex-wrap:wrap;gap:6px">${specs.map(s => `<span style="font-size:12px;font-weight:600;padding:4px 12px;border-radius:999px;background:rgba(45,106,79,0.10);color:#2d6a4f">${s}</span>`).join('')}</div>`
                    )}</div>`;
                }
            }
            about.innerHTML = html;
        }

        // ── Company Details ──────────────────────────────────────────────────
        const detailsEl = document.getElementById('cp-about');
        // (details are merged into about section above; extra details card below)
        const statsSection = document.getElementById('cp-stats');
        // Insert details card after stats if any detail fields exist
        const hasDetails = c.type || c.revenue || c.hq || c.founded || c.employees;
        let detailsCard = '';
        if (hasDetails) {
            const row = (label, val) => val ? `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid ${border}">
                    <p style="font-size:11px;font-weight:700;color:${subC};text-transform:uppercase;letter-spacing:0.05em">${label}</p>
                    <p style="font-size:13px;font-weight:600;color:${titleC};text-align:right;max-width:60%">${val}</p>
                </div>` : '';
            detailsCard = card(
                sectionTitle('corporate_fare', 'Company Details', '#875041') +
                row('Type', c.type) +
                row('Industry', c.industry) +
                row('Headquarters', c.hq || c.location) +
                row('Founded', c.founded) +
                row('Team Size', c.employees) +
                row('Revenue', c.revenue)
            );
        }

        // ── Contact ──────────────────────────────────────────────────────────
        const hasContact = c.email || c.phone || c.address || c.website;
        let contactCard = '';
        if (hasContact) {
            const cRow = (icon, label, val, href) => val ? `
                <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid ${border}">
                    <span class="material-symbols-outlined" style="font-size:18px;color:${subC};font-variation-settings:'FILL' 1">${icon}</span>
                    <div style="flex:1;min-width:0">
                        <p style="font-size:10px;font-weight:700;color:${subC};text-transform:uppercase;letter-spacing:0.05em">${label}</p>
                        ${href
                    ? `<a href="${href}" target="_blank" style="font-size:13px;font-weight:600;color:#4d41df;text-decoration:none;word-break:break-all">${val}</a>`
                    : `<p style="font-size:13px;font-weight:500;color:${titleC};word-break:break-all">${val}</p>`}
                    </div>
                </div>` : '';
            contactCard = card(
                sectionTitle('contact_page', 'Contact', '#875041') +
                cRow('mail', 'Email', c.email, c.email ? 'mailto:' + c.email : null) +
                cRow('call', 'Phone', c.phone, null) +
                cRow('location_city', 'Address', c.address, null) +
                cRow('language', 'Website', c.website, c.website ? (c.website.startsWith('http') ? c.website : 'https://' + c.website) : null)
            );
        }

        // ── Social Links ─────────────────────────────────────────────────────
        const hasSocial = c.linkedin || c.twitter;
        let socialCard = '';
        if (hasSocial) {
            const sRow = (icon, label, url, color) => url ? `
                <a href="${url.startsWith('http') ? url : 'https://' + url}" target="_blank"
                   style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid ${border};text-decoration:none">
                    <div style="width:32px;height:32px;border-radius:10px;background:${color}18;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                        <span class="material-symbols-outlined" style="font-size:16px;color:${color}">${icon}</span>
                    </div>
                    <p style="font-size:13px;font-weight:600;color:${color}">${label}</p>
                    <span class="material-symbols-outlined" style="font-size:14px;color:${subC};margin-left:auto">open_in_new</span>
                </a>` : '';
            socialCard = card(
                sectionTitle('share', 'Social & Links', '#4d41df') +
                sRow('group', 'LinkedIn', c.linkedin, '#0077b5') +
                sRow('tag', 'Twitter / X', c.twitter, '#1da1f2')
            );
        }

        // Inject details + contact + social after cp-about
        const aboutEl = document.getElementById('cp-about');
        if (aboutEl) {
            let extra = '';
            if (detailsCard) extra += `<div style="margin-top:12px">${detailsCard}</div>`;
            if (contactCard) extra += `<div style="margin-top:12px">${contactCard}</div>`;
            if (socialCard) extra += `<div style="margin-top:12px">${socialCard}</div>`;
            aboutEl.innerHTML += extra;
        }

        // ── Jobs ─────────────────────────────────────────────────────────────
        const jobsEl = document.getElementById('cp-jobs');
        const jobsCountEl = document.getElementById('cp-jobs-count');
        if (jobsEl) {
            const uid = c.uid;
            const compJobs = _allJobs.filter(j => j.company.toLowerCase() === name.toLowerCase());
            const postedJobs = uid ? JSON.parse(localStorage.getItem('companyJobs_' + uid) || '[]').filter(j => j.status === 'active') : [];
            const total = compJobs.length + postedJobs.length;
            if (jobsCountEl) jobsCountEl.textContent = total ? total + ' open' : '';

            const typeColor = t => t === 'Full-time' ? '#4d41df' : t === 'Part-time' ? '#875041' : t === 'Internship' ? '#5c51a0' : '#2d6a4f';

            const jobCard = (title, loc, exp, type, salary, onclick) => `
                <div style="background:${cardBg};border-radius:16px;padding:14px;border:1px solid ${border};margin-bottom:8px;cursor:pointer;transition:transform 0.15s"
                    onclick="${onclick}" onmouseenter="this.style.transform='translateY(-1px)'" onmouseleave="this.style.transform=''">
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                        <div style="flex:1;min-width:0">
                            <p style="font-size:14px;font-weight:700;color:${titleC};line-height:1.3">${title}</p>
                            <p style="font-size:12px;color:${subC};margin-top:2px">${loc}${exp ? ' &bull; ' + exp : ''}</p>
                        </div>
                        ${type ? `<span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:${typeColor(type)}18;color:${typeColor(type)};flex-shrink:0">${type}</span>` : ''}
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px">
                        <span style="font-size:12px;font-weight:700;color:#276749">${salary || ''}</span>
                        <button onclick="event.stopPropagation();${onclick}"
                            style="height:32px;padding:0 14px;border-radius:10px;border:none;background:linear-gradient(135deg,#4d41df,#5c51a0);color:#fff;font-size:12px;font-weight:700;cursor:pointer">
                            Apply
                        </button>
                    </div>
                </div>`;

            const builtinCards = compJobs.map(j => jobCard(j.title, j.location, j.exp, j.type, j.salary, `openJobDetail(${j.id})`)).join('');
            const postedCards = postedJobs.map(j => jobCard(
                j.title, j.location || '', j.experience || '', j.type || '',
                j.salaryMin && j.salaryMax ? '&#8377;' + j.salaryMin + '–&#8377;' + j.salaryMax : '',
                `navigateTo('jobs')`
            )).join('');

            jobsEl.innerHTML = (builtinCards + postedCards) ||
                `<div style="text-align:center;padding:24px 0;color:${subC};font-size:13px">No open positions right now.</div>`;
        }

        // ── Videos ───────────────────────────────────────────────────────────
        const videosEl = document.getElementById('cp-videos');
        if (videosEl) {
            const uid = c.uid;
            // First try localStorage (same device), then fall back to Firestore
            const localVideos = uid
                ? JSON.parse(localStorage.getItem('companyTraining_' + uid) || '[]').filter(v => v.privacy === 'public' || !v.privacy)
                : [];

            const renderVideos = (videos) => {
                if (!videos.length) {
                    videosEl.innerHTML = `<p style="font-size:13px;color:${subC};text-align:center;padding:16px 0">No public videos uploaded yet.</p>`;
                    return;
                }
                const vGrads = ['linear-gradient(135deg,#4d41df,#675df9)', 'linear-gradient(135deg,#875041,#feb5a2)', 'linear-gradient(135deg,#5c51a0,#c8bfff)', 'linear-gradient(135deg,#2d6a4f,#74c69d)', 'linear-gradient(135deg,#c77dff,#7b2d8b)'];
                // Store videos in a window-level map so onclick can access by index safely
                window._cpVideosMap = {};
                videosEl.innerHTML = videos.map((v, i) => {
                    window._cpVideosMap[i] = v;
                    const vGrad = vGrads[i % vGrads.length];
                    const date = v.uploadedAt ? new Date(v.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                    return `
                    <div onclick="openPublicVideoPlayer(window._cpVideosMap[${i}])"
                        style="background:${cardBg};border-radius:16px;overflow:hidden;border:1px solid ${border};margin-bottom:10px;cursor:pointer;transition:transform 0.15s"
                        onmouseenter="this.style.transform='translateY(-1px)'" onmouseleave="this.style.transform=''">
                        <div style="position:relative;width:100%;height:140px;background:${vGrad};display:flex;align-items:center;justify-content:center;overflow:hidden">
                            <span class="material-symbols-outlined" style="font-size:52px;color:rgba(255,255,255,0.85);font-variation-settings:'FILL' 1">play_circle</span>
                            <span style="position:absolute;top:8px;left:8px;background:rgba(45,106,79,0.85);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;display:flex;align-items:center;gap:3px">
                                <span class="material-symbols-outlined" style="font-size:10px;font-variation-settings:'FILL' 1">public</span>Public
                            </span>
                            ${v.fileSize ? `<span style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.60);color:#fff;font-size:10px;font-weight:600;padding:2px 7px;border-radius:6px">${v.fileSize}</span>` : ''}
                        </div>
                        <div style="padding:12px">
                            <p style="font-size:13px;font-weight:700;color:${titleC};line-height:1.3">${v.title || 'Untitled'}</p>
                            ${v.desc ? `<p style="font-size:12px;color:${subC};margin-top:4px;line-height:1.4">${v.desc}</p>` : ''}
                            <p style="font-size:11px;color:${subC};margin-top:6px">${date}${v.fileName ? ' &bull; ' + v.fileName : ''}</p>
                        </div>
                    </div>`;
                }).join('');
            };

            if (localVideos.length) {
                renderVideos(localVideos);
            } else if (uid) {
                // Fetch from Firestore
                videosEl.innerHTML = `<p style="font-size:12px;color:${subC};text-align:center;padding:12px 0">Loading videos...</p>`;
                db.collection('users').doc(uid).get().then(doc => {
                    const data = doc.exists ? doc.data() : {};
                    const firestoreVideos = (data.trainingVideos || []).filter(v => v.privacy === 'public' || !v.privacy);
                    // Cache locally for this session
                    if (firestoreVideos.length) {
                        localStorage.setItem('companyTraining_' + uid, JSON.stringify(firestoreVideos));
                    }
                    renderVideos(firestoreVideos);
                }).catch(() => renderVideos([]));
            } else {
                renderVideos([]);
            }
        }
    });
}
window.renderCompanyProfile = renderCompanyProfile;

// ============================================================
// WOMEN ↔ COMPANY CONNECTION MODULE
// ============================================================



// ---- COMPANY SIDE: Search/filter women candidates from Firestore ----

function searchCandidates() {
    if (_currentRole() !== 'company') return; // role-guard
    const skillQ = (document.getElementById('cand-search-skills')?.value || '').toLowerCase().trim();
    const qualQ = (document.getElementById('cand-search-qual')?.value || '').toLowerCase().trim();
    const expQ = (document.getElementById('cand-search-exp')?.value || '').toLowerCase().trim();
    const locQ = (document.getElementById('cand-search-loc')?.value || '').toLowerCase().trim();
    const domainQ = (document.getElementById('cand-search-domain')?.value || '').toLowerCase().trim();
    const container = document.getElementById('candidates-list');
    const countEl = document.getElementById('candidates-count');
    if (!container) return;

    container.innerHTML = `<div style="display:flex;align-items:center;gap:10px;padding:20px;background:rgba(77,65,223,0.05);border-radius:14px"><span class="material-symbols-outlined text-primary" style="font-size:20px;animation:spin 1s linear infinite">progress_activity</span><p style="font-size:13px;color:#777587">Searching candidates...</p></div>`;

    db.collection('users').where('role', '==', 'woman').get()
        .then(snap => {
            let candidates = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Apply filters
            if (skillQ) candidates = candidates.filter(c => (c.skills || '').toLowerCase().includes(skillQ));
            if (qualQ) candidates = candidates.filter(c => (c.education || c.jobPref || '').toLowerCase().includes(qualQ));
            if (expQ) candidates = candidates.filter(c => (c.experience || '').toLowerCase().includes(expQ));
            if (locQ) candidates = candidates.filter(c => (c.location || '').toLowerCase().includes(locQ));
            if (domainQ) candidates = candidates.filter(c => (c.skills || c.title || c.bio || '').toLowerCase().includes(domainQ));

            if (countEl) countEl.textContent = `${candidates.length} candidate${candidates.length !== 1 ? 's' : ''}`;

            if (candidates.length === 0) {
                container.innerHTML = `
                    <div style="display:flex;flex-direction:column;align-items:center;padding:48px 0;text-align:center">
                        <div style="width:56px;height:56px;border-radius:50%;background:rgba(77,65,223,0.10);display:flex;align-items:center;justify-content:center;margin-bottom:12px">
                            <span class="material-symbols-outlined" style="font-size:28px;color:#4d41df">person_search</span>
                        </div>
                        <p style="font-size:14px;font-weight:700;color:#1b1b24">No candidates found</p>
                        <p style="font-size:12px;color:#777587;margin-top:4px">Try different filters or clear all</p>
                    </div>`;
                return;
            }

            const _dark = document.documentElement.classList.contains('dark-theme');
            const cardBg = _dark ? '#1c1b2e' : '#fff';
            const border = _dark ? '#2a2840' : '#eae6f3';
            const titleC = _dark ? '#e8e6f4' : '#1b1b24';
            const subC = _dark ? '#9e9bb8' : '#777587';
            const grads = ['linear-gradient(135deg,#4d41df,#675df9)', 'linear-gradient(135deg,#875041,#feb5a2)', 'linear-gradient(135deg,#5c51a0,#c8bfff)', 'linear-gradient(135deg,#2d6a4f,#74c69d)', 'linear-gradient(135deg,#c77dff,#7b2d8b)'];

            container.innerHTML = candidates.map((c, i) => {
                const initials = (c.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                const grad = grads[i % grads.length];
                const skills = (c.skills || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 4);
                return `
                <div style="background:${cardBg};border-radius:18px;padding:16px;border:1px solid ${border};box-shadow:0 2px 12px -4px rgba(77,65,223,0.08);margin-bottom:10px">
                    <div style="display:flex;align-items:flex-start;gap:12px">
                        <div style="width:48px;height:48px;border-radius:50%;background:${grad};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#fff;flex-shrink:0">${initials}</div>
                        <div style="flex:1;min-width:0">
                            <p style="font-size:14px;font-weight:700;color:${titleC};line-height:1.3">${c.name || 'Candidate'}</p>
                            <p style="font-size:12px;color:${subC};margin-top:2px">${c.title || c.jobPref || 'Looking for opportunities'} ${c.location ? '&bull; ' + c.location : ''}</p>
                            ${skills.length ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px">${skills.map(s => `<span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;background:rgba(77,65,223,0.10);color:#4d41df">${s}</span>`).join('')}</div>` : ''}
                            ${c.resumeName ? `<p style="font-size:11px;color:#276749;margin-top:6px;display:flex;align-items:center;gap:4px"><span class="material-symbols-outlined" style="font-size:13px">description</span>${c.resumeName}</p>` : ''}
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:12px">
                        <button onclick="inviteCandidate('${c.id}','${(c.name || '').replace(/'/g, '')}')" style="flex:1;height:36px;border-radius:10px;border:none;background:linear-gradient(135deg,#4d41df,#5c51a0);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif">Invite</button>
                        <button onclick="contactCandidate('${c.email || ''}')" style="flex:1;height:36px;border-radius:10px;border:1px solid rgba(77,65,223,0.25);background:rgba(77,65,223,0.06);color:#4d41df;font-size:12px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif">Contact</button>
                    </div>
                </div>`;
            }).join('');
        })
        .catch(() => {
            container.innerHTML = '<p style="font-size:13px;color:#777587;text-align:center;padding:24px 0">Could not load candidates. Check your connection.</p>';
        });
}
window.searchCandidates = searchCandidates;

function inviteCandidate(uid, name) {
    db.collection('notifications').add({
        toUid: uid,
        type: 'job',
        title: 'You have been invited!',
        description: `A company has invited you to apply for a position on Tarini.`,
        time: new Date().toISOString(),
        read: false,
    }).catch(console.warn);
    showToast(`Invite sent to ${name} ✓`);
}
window.inviteCandidate = inviteCandidate;

function contactCandidate(email) {
    if (!email) { showToast('No email available for this candidate.'); return; }
    window.open(`mailto:${email}?subject=Opportunity on Tarini`, '_blank');
}
window.contactCandidate = contactCandidate;

// ---- COMPANY SIDE: Update application status ----

function updateApplicationStatus(appKey, jobId, newStatus) {
    // Update in the specific user's localStorage key
    const list = JSON.parse(localStorage.getItem(appKey) || '[]');
    const updated = list.map(a => a.jobId === jobId ? { ...a, status: newStatus } : a);
    localStorage.setItem(appKey, JSON.stringify(updated));
    // Also update in Firestore
    db.collection('applications')
        .where('jobId', '==', jobId)
        .get()
        .then(snap => snap.forEach(doc => doc.ref.update({ status: newStatus })))
        .catch(console.warn);
    loadCompanyApplications();
    showToast(`Status updated to ${newStatus} ✓`);
}
window.updateApplicationStatus = updateApplicationStatus;

// ---- Patch finalSubmitApplication to also write to Firestore ----
// so companies can query applications cross-user

(function _patchFinalSubmit() {
    const _orig = window.finalSubmitApplication;
    window.finalSubmitApplication = function () {
        // Call original first
        _orig();
        // After a short delay (original uses setTimeout(1000)), write to Firestore
        setTimeout(() => {
            const job = _allJobs.find(j => j.id === _currentJobId);
            if (!job) return;
            const user = auth.currentUser;
            const apps = JSON.parse(localStorage.getItem(_appsKey()) || '[]');
            const app = apps.find(a => a.jobId === job.id);
            if (!app || !user) return;
            db.collection('applications').add({
                ...app,
                userId: user.uid,
                companyId: job.company.toLowerCase().replace(/\s+/g, '_'),
                createdAt: new Date().toISOString(),
            }).catch(console.warn);
        }, 1500);
    };
})();

// ---- Patch loadCompanyApplications to show status-change buttons ----

(function _patchLoadCompanyApplications() {
    const _orig = loadCompanyApplications;
    loadCompanyApplications = function () {
        const d = getProfileData();
        const user = auth.currentUser;
        const name = d.name || (user && user.displayName) || '';
        const companyId = name.toLowerCase().replace(/\s+/g, '_');
        const container = document.getElementById('co-applications-list');
        if (!container) return;

        // Gather from all users' localStorage keys
        const allKeys = Object.keys(localStorage).filter(k => k.startsWith('tarini_applications_'));
        let apps = allKeys.reduce((acc, k) => {
            const list = JSON.parse(localStorage.getItem(k) || '[]');
            return acc.concat(list.filter(a => a.companyId === companyId).map(a => ({ ...a, _storageKey: k })));
        }, []);

        // Also try Firestore
        db.collection('applications').where('companyId', '==', companyId).get()
            .then(snap => {
                const fsApps = snap.docs.map(doc => ({ ...doc.data(), _docId: doc.id }));
                // Merge: prefer Firestore status if available
                fsApps.forEach(fa => {
                    const idx = apps.findIndex(a => a.jobId === fa.jobId && (a.applicant?.email === fa.applicant?.email));
                    if (idx >= 0) apps[idx].status = fa.status;
                    else apps.push(fa);
                });
                _renderCompanyApps(container, apps, companyId);
            })
            .catch(() => _renderCompanyApps(container, apps, companyId));
    };

    function _renderCompanyApps(container, apps, companyId) {
        if (apps.length === 0) {
            container.innerHTML = `
                <div class="text-center py-16">
                    <div class="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                        <span class="material-symbols-outlined text-secondary" style="font-size:32px;font-variation-settings:'FILL' 1">assignment</span>
                    </div>
                    <p class="font-bold text-on-surface text-[15px]">No applications yet</p>
                    <p class="text-[13px] text-on-surface-variant mt-1">Applications from candidates will appear here.</p>
                </div>`;
            return;
        }

        const _dark = document.documentElement.classList.contains('dark-theme');
        const cardBg = _dark ? '#1c1b2e' : '#fff';
        const border = _dark ? '#2a2840' : '#eae6f3';
        const titleC = _dark ? '#e8e6f4' : '#1b1b24';
        const subC = _dark ? '#9e9bb8' : '#777587';

        const statusStyle = s => s === 'Applied' ? 'background:rgba(77,65,223,0.10);color:#4d41df'
            : s === 'Shortlisted' ? 'background:rgba(92,81,160,0.10);color:#5c51a0'
                : s === 'Hired' ? 'background:rgba(45,106,79,0.10);color:#276749'
                    : 'background:rgba(135,80,65,0.10);color:#875041';

        container.innerHTML = apps.map(app => {
            const date = new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const storageKey = app._storageKey ? `'${app._storageKey}'` : 'null';
            return `
            <div style="background:${cardBg};border-radius:18px;padding:16px;border:1px solid ${border};box-shadow:0 2px 12px -4px rgba(77,65,223,0.08);margin-bottom:10px">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                    <div style="flex:1;min-width:0">
                        <p style="font-size:14px;font-weight:700;color:${titleC}">${app.applicant ? app.applicant.name : 'Applicant'}</p>
                        <p style="font-size:12px;color:${subC};margin-top:2px">${app.title} &bull; ${app.location}</p>
                        ${app.applicant ? `<p style="font-size:11px;color:${subC};margin-top:2px">Skills: ${app.applicant.skills || '—'} &bull; Exp: ${app.applicant.experience || '—'}</p>` : ''}
                        <p style="font-size:11px;color:#9e9bb8;margin-top:4px">Applied ${date}</p>
                    </div>
                    <span style="flex-shrink:0;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;${statusStyle(app.status)}">${app.status}</span>
                </div>
                <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">
                    <button onclick="updateApplicationStatus(${storageKey},${app.jobId},'Shortlisted')" style="height:30px;padding:0 12px;border-radius:8px;border:none;background:rgba(92,81,160,0.12);color:#5c51a0;font-size:11px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif">Shortlist</button>
                    <button onclick="updateApplicationStatus(${storageKey},${app.jobId},'Hired')" style="height:30px;padding:0 12px;border-radius:8px;border:none;background:rgba(45,106,79,0.12);color:#276749;font-size:11px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif">Hire</button>
                    <button onclick="updateApplicationStatus(${storageKey},${app.jobId},'Rejected')" style="height:30px;padding:0 12px;border-radius:8px;border:none;background:rgba(186,26,26,0.08);color:#ba1a1a;font-size:11px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif">Reject</button>
                </div>
            </div>`;
        }).join('');
    }
})();

// ---- Patch loadApplicationsScreen to show company response status ----

(function _patchLoadApplicationsScreen() {
    const _orig = window.loadApplicationsScreen;
    window.loadApplicationsScreen = function () {
        _orig();
        // After rendering, refresh statuses from Firestore for real-time company responses
        const user = auth.currentUser;
        if (!user) return;
        db.collection('applications').where('userId', '==', user.uid).get()
            .then(snap => {
                snap.forEach(doc => {
                    const data = doc.data();
                    // Update localStorage status if changed
                    const apps = JSON.parse(localStorage.getItem(_appsKey()) || '[]');
                    const idx = apps.findIndex(a => a.jobId === data.jobId);
                    if (idx >= 0 && apps[idx].status !== data.status) {
                        apps[idx].status = data.status;
                        localStorage.setItem(_appsKey(), JSON.stringify(apps));
                        // Re-render to show updated status
                        _orig();
                    }
                });
            })
            .catch(console.warn);
    };
})();

// ============================================
// AI ASSISTANT LOGIC
// ============================================

function _aiChatKey() {
    const user = auth.currentUser;
    return user ? `tarini_ai_chat_${user.uid}` : 'tarini_ai_chat_guest';
}

function getAIChatHistory() {
    return JSON.parse(localStorage.getItem(_aiChatKey()) || '[]');
}

function saveAIChatHistory(history) {
    localStorage.setItem(_aiChatKey(), JSON.stringify(history));
}

function renderAIChatHistory() {
    const chatArea = document.getElementById('ai-chat-area');
    const history = getAIChatHistory();
    if (!chatArea || history.length === 0) return;

    // Remove old bubbles but keep welcome msg & quick actions
    const nodes = Array.from(chatArea.children);
    nodes.forEach(n => {
        if (n.id !== 'ai-quick-actions' && !n.innerHTML.includes('Hello! I am your Tarini AI Assistant')) {
            chatArea.removeChild(n);
        }
    });

    history.forEach(msg => appendChatBubble(msg.text, msg.role === 'user'));
    scrollToBottomChat();
}

function appendChatBubble(text, isUser) {
    const chatArea = document.getElementById('ai-chat-area');
    const quickActions = document.getElementById('ai-quick-actions');
    const bubbleWrapper = document.createElement('div');

    // Parse actions [ACTION:XXXX] from text and create buttons
    let displayText = text;
    let actionButtonsHTML = '';

    if (!isUser) {
        const actionMatch = displayText.match(/\[ACTION:(.*?)\]/g);
        if (actionMatch) {
            actionMatch.forEach(act => {
                displayText = displayText.replace(act, '');
                const actionType = act.replace('[ACTION:', '').replace(']', '').trim();

                if (actionType === 'FIND_JOBS') {
                    actionButtonsHTML += `<button onclick="navigateTo('jobs')" class="mt-2 bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-[12px] font-bold active:scale-95 transition-all">🔍 Browse Jobs</button>`;
                } else if (actionType === 'EDIT_PROFILE') {
                    actionButtonsHTML += `<button onclick="openEditProfile()" class="mt-2 bg-secondary/10 text-secondary px-3 py-1.5 rounded-xl text-[12px] font-bold active:scale-95 transition-all">✏️ Edit Profile</button>`;
                } else if (actionType === 'MY_APPLICATIONS') {
                    actionButtonsHTML += `<button onclick="navigateTo('applications')" class="mt-2 bg-tertiary/10 text-tertiary px-3 py-1.5 rounded-xl text-[12px] font-bold active:scale-95 transition-all">📄 My Applications</button>`;
                }
            });
            displayText = displayText.trim();
        }
    }

    if (isUser) {
        bubbleWrapper.className = 'flex items-end justify-end gap-2 mb-4 mt-2 animate-[fadeIn_0.3s_ease-out]';
        bubbleWrapper.innerHTML = `
            <div class="bg-primary text-white p-3 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%] text-[14px] leading-relaxed break-words">
                ${displayText.replace(/\n/g, '<br>')}
            </div>
        `;
    } else {
        bubbleWrapper.className = 'flex items-start gap-2 mb-4 mt-2 animate-[fadeIn_0.3s_ease-out]';
        bubbleWrapper.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-tertiary flex-shrink-0 flex items-center justify-center mt-1">
                <span class="material-symbols-outlined text-white" style="font-size: 16px;">smart_toy</span>
            </div>
            <div class="flex flex-col">
                <div class="bg-white border border-surface-container-high p-3 rounded-2xl rounded-tl-sm shadow-sm max-w-[85%] text-[14px] text-on-surface leading-relaxed break-words">
                    ${displayText.replace(/\n/g, '<br>')}
                </div>
                ${actionButtonsHTML ? `<div class="flex gap-2 flex-wrap">${actionButtonsHTML}</div>` : ''}
            </div>
        `;
    }

    if (quickActions) {
        chatArea.insertBefore(bubbleWrapper, quickActions);
    } else {
        chatArea.appendChild(bubbleWrapper);
    }
}

function showAILoading() {
    const chatArea = document.getElementById('ai-chat-area');
    const quickActions = document.getElementById('ai-quick-actions');
    const loadingBubble = document.createElement('div');
    loadingBubble.id = 'ai-loading-indicator';
    loadingBubble.className = 'flex items-start gap-2 mb-4 mt-2 animate-[fadeIn_0.3s_ease-out]';
    loadingBubble.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-tertiary flex-shrink-0 flex items-center justify-center mt-1">
            <span class="material-symbols-outlined text-white" style="font-size: 16px;">smart_toy</span>
        </div>
        <div class="bg-white border border-surface-container-high p-4 rounded-2xl rounded-tl-sm shadow-sm max-w-[85%] flex gap-1">
            <div class="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style="animation-delay: 0s"></div>
            <div class="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 rounded-full bg-primary/80 animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
    `;
    if (quickActions) chatArea.insertBefore(loadingBubble, quickActions);
    else chatArea.appendChild(loadingBubble);
    scrollToBottomChat();
}

function removeAILoading() {
    const loader = document.getElementById('ai-loading-indicator');
    if (loader) loader.remove();
}

function scrollToBottomChat() {
    const chatArea = document.getElementById('ai-chat-area');
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
}

async function handleSendAIMessage(msg = null) {
    const inputEl = document.getElementById('ai-chat-input');
    const text = msg || inputEl.value.trim();
    if (!text) return;

    // Reset input
    if (inputEl) {
        inputEl.value = '';
        inputEl.style.height = '';
    }

    // Append user bubble UI
    appendChatBubble(text, true);
    scrollToBottomChat();

    // Disable send button temporarily
    const btn = document.getElementById('ai-send-btn');
    if (btn) btn.disabled = true;

    // Save to local history immediately for visual continuity
    const history = getAIChatHistory();
    history.push({ role: 'user', text: text });
    saveAIChatHistory(history);

    showAILoading();

    try {
        const API_KEY = "AIzaSyA-V_RfVolXcW4M4HjkYv1S-5XskiyZ1h0";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        // Prepare the conversation context for Gemini API
        // Format history according to Gemini requirements: role (user/model) and parts (text)
        let rawHistory = getAIChatHistory().slice(-10);

        // Gemini strictly requires alternating roles starting with 'user'
        let validHistory = [];
        let expectedRole = 'user'; // We know the last message we appended was 'user'

        // Build sequence backwards to ensure ending with the latest user message
        for (let i = rawHistory.length - 1; i >= 0; i--) {
            const msgRole = rawHistory[i].role === 'assistant' ? 'model' : 'user';
            if (msgRole === expectedRole) {
                validHistory.unshift({
                    role: msgRole,
                    parts: [{ text: rawHistory[i].text }]
                });
                expectedRole = expectedRole === 'user' ? 'model' : 'user';
            }
        }

        // The conversation MUST start with a 'user' role
        if (validHistory.length > 0 && validHistory[0].role === 'model') {
            validHistory.shift();
        }

        // Add a system context prompt to the very first user message
        const systemPrompt = "You are Tarini AI Assistant. Be supportive, friendly, concise, and safety-focused. If asked about jobs, ask for skills/preferences. If scam suspected, warn the user. Use [ACTION:FIND_JOBS], [ACTION:EDIT_PROFILE], [ACTION:MY_APPLICATIONS] to trigger UI buttons.\n\nUser: ";
        if (validHistory.length > 0 && validHistory[0].role === 'user') {
            validHistory[0].parts[0].text = systemPrompt + validHistory[0].parts[0].text;
        }

        const payload = {
            contents: validHistory
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error("Gemini API Error Details:", errorDetails);
            let parsedError = errorDetails;
            try { parsedError = JSON.parse(errorDetails).error.message; } catch (e) { }
            throw new Error(`API Error ${response.status}: ${parsedError}`);
        }

        const data = await response.json();

        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("No response generated. Please try again.");
        }

        if (!data.candidates[0].content) {
            throw new Error("Response was blocked due to safety settings.");
        }

        const replyText = data.candidates[0].content.parts[0].text;

        removeAILoading();
        appendChatBubble(replyText, false);
        scrollToBottomChat();

        history.push({ role: 'assistant', text: replyText });
        saveAIChatHistory(history);

    } catch (error) {
        removeAILoading();
        let errorMsg = error.message;
        if (error.name === 'AbortError') {
            errorMsg = "Request timed out. The network might be slow or blocked.";
        }
        // Display the EXACT error to the user so we can see what's wrong
        appendChatBubble("⚠️ System Error: " + errorMsg, false);
        console.error("AI Error:", error);
    } finally {
        if (btn) btn.disabled = false;
    }
}
window.handleSendAIMessage = handleSendAIMessage;

function sendQuickAction(text) {
    handleSendAIMessage(text);
}
window.sendQuickAction = sendQuickAction;

function generateMockAIResponse(userInput) {
    const text = userInput.toLowerCase();
    if (text.includes('remote') || text.includes('job')) {
        return "I found some great remote opportunities for you! Check out the 'Data Entry Operator' role at TechSeva. It's fully remote and offers flexible timings. [ACTION:FIND_JOBS]";
    } else if (text.includes('resume')) {
        return "I'd love to help with your resume! A strong resume highlights your achievements, not just your duties. Make sure to update your profile skills. [ACTION:EDIT_PROFILE]";
    } else if (text.includes('interview')) {
        return "Interview prep is crucial. Remember to use the STAR method (Situation, Task, Action, Result) for behavioral questions. Be confident—you've got this! Practice makes perfect.";
    } else if (text.includes('scam') || text.includes('pay') || text.includes('fee')) {
        return "⚠️ Safety Warning: A legitimate employer will NEVER ask you to pay a fee or deposit money for a job or training. If a job posting asks for money upfront, it is likely a scam.";
    } else {
        return "That's a great question. As your Tarini career coach, I'm here to support you. Would you like to explore jobs, check your applications, or improve your profile? [ACTION:FIND_JOBS]";
    }
}

// Hook into navigateTo to load history when AI screen is opened
(function _patchNavigateToAI() {
    const _orig = window.navigateTo;
    window.navigateTo = function (screenId) {
        _orig(screenId);
        if (screenId === 'ai-assistant') {
            renderAIChatHistory();
        }
    };
})();

// ============================================================
// AI ASSISTANT CHAT — Direct Gemini API (frontend)
// ============================================================

const _GEMINI_API_KEY = 'AIzaSyCi6v2joQGoXY12wzKk8B-klsmqlbHQ-Ug';
const _GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${_GEMINI_API_KEY}`;

const _AI_SYSTEM_PROMPT = `You are the Tarini AI Assistant. You are a smart, supportive, and safety-focused AI designed specifically for a women-focused job platform named Tarini.

CORE BEHAVIOR:
- Friendly, supportive, and intelligent tone.
- Respond in simple, clear language.
- You can understand and reply in Hinglish, Hindi, and English. Match the user's language.
- Provide actionable responses, not just general answers.
- ALWAYS prioritize safety.

KEY RULES:
1. Smart Job Matching: When users ask for jobs, ask about their skills, experience, location, and preferences if not provided.
2. Resume & Profile Assistance: Help create and improve resumes.
3. Career Guidance: Act like a career coach with step-by-step guidance.
4. Safety & Trust Layer: Detect and warn about suspicious job postings.
5. Women-Friendly Job Support: Suggest remote, part-time, flexible jobs.
6. Emotional Support: Encourage users during their job search.

QUICK ACTIONS — include these tags when relevant:
- To navigate to jobs: [ACTION:FIND_JOBS]
- To edit profile: [ACTION:EDIT_PROFILE]
- To view applications: [ACTION:MY_APPLICATIONS]

Keep responses concise and easy to read on a mobile device.`;

// In-memory chat history for context
const _aiChatHistory = [];

function _appendAiDotStyle() {
    if (document.getElementById('ai-dot-style')) return;
    const s = document.createElement('style');
    s.id = 'ai-dot-style';
    s.textContent = '@keyframes aiDot{0%,80%,100%{opacity:0.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}';
    document.head.appendChild(s);
}

async function sendAIMessage() {
    const input = document.getElementById('ai-chat-input');
    const container = document.getElementById('ai-chat-container');
    if (!input || !container) return;

    const message = input.value.trim();
    if (!message) return;

    // Append user bubble
    const userBubble = document.createElement('div');
    userBubble.style.cssText = 'display:flex;justify-content:flex-end;margin-bottom:8px';
    userBubble.innerHTML = `<div style="background:#4d41df;color:#fff;border-radius:18px 18px 4px 18px;padding:12px 16px;max-width:75%;font-size:14px;line-height:1.5">${_escapeHtml(message)}</div>`;
    container.appendChild(userBubble);
    input.value = '';
    container.scrollTop = container.scrollHeight;

    // Typing indicator
    _appendAiDotStyle();
    const typingBubble = document.createElement('div');
    typingBubble.id = 'ai-typing';
    typingBubble.style.cssText = 'margin-bottom:8px';
    typingBubble.innerHTML = '<div style="background:#eae6f3;border-radius:18px 18px 18px 4px;padding:12px 16px;width:fit-content;display:inline-flex;gap:5px;align-items:center"><span style="width:7px;height:7px;border-radius:50%;background:#4d41df;display:inline-block;animation:aiDot 1s infinite 0s"></span><span style="width:7px;height:7px;border-radius:50%;background:#4d41df;display:inline-block;animation:aiDot 1s infinite 0.2s"></span><span style="width:7px;height:7px;border-radius:50%;background:#4d41df;display:inline-block;animation:aiDot 1s infinite 0.4s"></span></div>';
    container.appendChild(typingBubble);
    container.scrollTop = container.scrollHeight;

    // Add to history
    _aiChatHistory.push({ role: 'user', parts: [{ text: message }] });

    try {
        const body = {
            system_instruction: { parts: [{ text: _AI_SYSTEM_PROMPT }] },
            contents: _aiChatHistory
        };

        const res = await fetch(_GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const errMsg = errData.error?.message || `HTTP ${res.status}`;
            if (errMsg.includes('quota') || errMsg.includes('Quota')) {
                const retryMatch = errMsg.match(/(\d+(\.\d+)?)s/);
                const retryTime = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;
                throw new Error(`AI is busy. Please wait ${retryTime} seconds and try again.`);
            }
            throw new Error(errMsg);
        }

        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response.';

        // Add AI reply to history
        _aiChatHistory.push({ role: 'model', parts: [{ text: reply }] });
        // Keep history to last 20 messages
        if (_aiChatHistory.length > 20) _aiChatHistory.splice(0, 2);

        typingBubble.remove();

        // Parse [ACTION:...] commands
        const actionMatch = reply.match(/\[ACTION:(\w+)\]/);
        const cleanReply = reply.replace(/\[ACTION:\w+\]/g, '').trim();

        const aiBubble = document.createElement('div');
        aiBubble.style.cssText = 'margin-bottom:8px';

        const actionMap = { FIND_JOBS: 'jobs', EDIT_PROFILE: 'edit-profile', MY_APPLICATIONS: 'applications' };
        const actionBtn = actionMatch && actionMap[actionMatch[1]]
            ? `<br><button onclick="navigateTo('${actionMap[actionMatch[1]]}')" style="margin-top:8px;font-size:12px;font-weight:700;color:#4d41df;background:rgba(77,65,223,0.10);border:none;padding:4px 12px;border-radius:999px;cursor:pointer">${actionMatch[1].replace(/_/g,' ')}</button>`
            : '';

        aiBubble.innerHTML = `<div style="background:#eae6f3;border-radius:18px 18px 18px 4px;padding:12px 16px;max-width:80%;font-size:14px;line-height:1.6;white-space:pre-wrap;display:inline-block">${_escapeHtml(cleanReply)}${actionBtn}</div>`;
        container.appendChild(aiBubble);

    } catch (err) {
        typingBubble.remove();
        // Remove the failed user message from history
        _aiChatHistory.pop();
        const errBubble = document.createElement('div');
        errBubble.style.cssText = 'margin-bottom:8px';
        errBubble.innerHTML = `<div style="background:#ffdad6;border-radius:18px 18px 18px 4px;padding:12px 16px;max-width:80%;font-size:13px;color:#ba1a1a;display:inline-block">⚠️ ${err.message || 'Could not reach AI. Check your connection.'}</div>`;
        container.appendChild(errBubble);
        console.error('AI error:', err);
    }

    container.scrollTop = container.scrollHeight;
}
window.sendAIMessage = sendAIMessage;

function _escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
