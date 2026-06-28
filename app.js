// FAMILY HEALTH RISK PREDICTOR - JS ENGINE

// 1. DATA DICTIONARIES
const locationData = {
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Gorakhpur"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Puri"],
    "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Durgapur"],
    "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Tezpur"]
};

const facilityMapping = {
    "Patna": "Patna Medical College & Hospital (PMCH), Patna",
    "Gaya": "Anugrah Narayan Magadh Medical College, Gaya",
    "Lucknow": "King George's Medical University (KGMU), Lucknow",
    "Kanpur": "Hallet Hospital & GSVM Medical College, Kanpur",
    "Bhopal": "Hamidia Hospital & Gandhi Medical College, Bhopal",
    "Indore": "Maharaja Yeshwantrao Hospital, Indore",
    "Jaipur": "Sawai Man Singh (SMS) Hospital, Jaipur",
    "Jodhpur": "Dr. Sampurnanand Medical College Hospital, Jodhpur",
    "Bengaluru": "Victoria Hospital & Bangalore Medical College, Bengaluru",
    "Mysuru": "Mysore Medical College & Research Institute, Mysuru",
    "Chennai": "Rajiv Gandhi Government General Hospital, Chennai",
    "Coimbatore": "Coimbatore Government Medical College Hospital, Coimbatore",
    "Mumbai": "KEM Hospital & Seth GS Medical College, Mumbai",
    "Pune": "Sassoon General Hospital & BJMC, Pune",
    "Bhubaneswar": "Capital Hospital, Bhubaneswar",
    "Cuttack": "SCB Medical College & Hospital, Cuttack",
    "Kolkata": "SSKM Hospital & IPGMER, Kolkata",
    "Howrah": "Howrah District General Hospital, Howrah",
    "Guwahati": "Guwahati Medical College & Hospital (GMCH), Guwahati",
    "Dibrugarh": "Assam Medical College & Hospital, Dibrugarh"
};

const DISEASES = [
    { id: 'diabetes', name: 'Diabetes', tooltip: 'Chronic blood sugar elevation' },
    { id: 'hypertension', name: 'Hypertension', tooltip: 'High blood pressure conditions' },
    { id: 'heart', name: 'Heart Disease', tooltip: 'Cardiovascular and coronary illnesses' },
    { id: 'cancer', name: 'Cancer', tooltip: 'Oncological conditions' },
    { id: 'thyroid', name: 'Thyroid Disorder', tooltip: 'Thyroid hormone imbalances' },
    { id: 'ckd', name: 'Chronic Kidney Disease', tooltip: 'Kidney filtration inefficiencies' },
    { id: 'obesity', name: 'Obesity', tooltip: 'Excessive body fat accumulation' }
];

// STATE MANAGEMENT
let currentUser = null; // Stores currently logged-in user profile
let activeRole = 'guest'; // 'guest', 'asha', 'admin', 'general'
let assessmentData = {}; // Stores wizard inputs in progress
let currentStep = 1;
const maxSteps = 6;
let currentAssessmentId = null; // Stores record ID being viewed
let modelStatus = {}; // Stores server /predict /health status

// 2. INITIALIZATION & ROUTER
document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    initLocationDropdowns();
    initFamilyHistoryInputs();
    setupEventListeners();
    checkBackendStatus();
    
    // Hash router
    window.addEventListener('hashchange', router);
    router();
});

function initDatabase() {
    // Seed default ASHA worker for demo
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            {
                role: 'asha',
                name: 'Rajni Devi',
                phone: '9876543210',
                ashaId: 'ASHA-9922',
                state: 'Bihar',
                district: 'Patna',
                password: 'password123'
            },
            {
                role: 'general',
                name: 'Amit Kumar',
                phone: '9123456789',
                age: '45',
                state: 'Bihar',
                district: 'Patna',
                password: 'password123'
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    
    if (!localStorage.getItem('patients')) {
        const seedPatients = [
            {
                id: 'pt-101',
                name: 'Ramesh Singh',
                age: 52,
                gender: 1,
                state: 'Bihar',
                district: 'Patna',
                date: '2026-06-15',
                createdBy: 'Rajni Devi',
                roleCreated: 'asha',
                overallRisk: 'High',
                topRisks: ['Diabetes', 'Hypertension', 'Obesity'],
                results: {
                    diabetes_risk: 74.2,
                    hypertension_risk: 68.5,
                    heart_risk: 42.1,
                    cancer_risk: 12.0,
                    thyroid_risk: 15.2,
                    ckd_risk: 30.5,
                    obesity_risk: 72.0
                },
                followUpStatus: 'Pending',
                symptoms: ['Frequent thirst or urination', 'Frequent headaches']
            },
            {
                id: 'pt-102',
                name: 'Savitri Devi',
                age: 61,
                gender: 0,
                state: 'Bihar',
                district: 'Patna',
                date: '2026-06-20',
                createdBy: 'Rajni Devi',
                roleCreated: 'asha',
                overallRisk: 'Medium',
                topRisks: ['Hypertension', 'Heart Disease'],
                results: {
                    diabetes_risk: 24.5,
                    hypertension_risk: 58.1,
                    heart_risk: 46.2,
                    cancer_risk: 8.5,
                    thyroid_risk: 35.0,
                    ckd_risk: 18.0,
                    obesity_risk: 32.5
                },
                followUpStatus: 'Followed Up',
                symptoms: ['Shortness of breath on exertion']
            }
        ];
        localStorage.setItem('patients', JSON.stringify(seedPatients));
    }

    // Load active session from sessionStorage if any
    const savedUser = sessionStorage.getItem('activeUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        activeRole = currentUser.role;
        updateNavigation();
    }
}

function initLocationDropdowns() {
    const states = Object.keys(locationData);
    const dropdowns = ['gen-state', 'asha-state', 'pt-state'];
    
    dropdowns.forEach(ddId => {
        const select = document.getElementById(ddId);
        if (select) {
            select.innerHTML = '<option value="">Select State</option>';
            states.forEach(state => {
                const opt = document.createElement('option');
                opt.value = state;
                opt.textContent = state;
                select.appendChild(opt);
            });
        }
    });
}

function populateDistricts(stateId, districtId) {
    const stateVal = document.getElementById(stateId).value;
    const districtSelect = document.getElementById(districtId);
    
    if (!districtSelect) return;
    
    if (!stateVal) {
        districtSelect.innerHTML = '<option value="">Select State First</option>';
        districtSelect.disabled = true;
        return;
    }
    
    districtSelect.innerHTML = '<option value="">Select District</option>';
    const districts = locationData[stateVal] || [];
    districts.forEach(dist => {
        const opt = document.createElement('option');
        opt.value = dist;
        opt.textContent = dist;
        districtSelect.appendChild(opt);
    });
    districtSelect.disabled = false;
}

function initFamilyHistoryInputs() {
    const container = document.getElementById('family-history-list');
    if (!container) return;
    
    container.innerHTML = '';
    DISEASES.forEach(d => {
        const card = document.createElement('div');
        card.className = 'fh-disease-card';
        card.id = `fh-card-${d.id}`;
        
        card.innerHTML = `
            <div class="fh-card-header">
                <span class="fh-disease-name">${d.name} <span class="text-muted" style="font-size: 0.85rem; font-weight: normal;">(${d.tooltip})</span></span>
                <label class="switch">
                    <input type="checkbox" id="fh-toggle-${d.id}" onchange="toggleDiseaseFH('${d.id}')">
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="fh-details-box hidden" id="fh-details-${d.id}">
                <div class="relatives-select-box">
                    <label>Which blood relatives are affected? (Select all that apply)</label>
                    <div class="relatives-grid">
                        ${['Self', 'Mother', 'Father', 'Sibling', 'Maternal Grandmother', 'Maternal Grandfather', 'Paternal Grandmother', 'Paternal Grandfather', 'Uncle/Aunt', 'Cousin'].map((rel, idx) => `
                            <label class="rel-check-label">
                                <input type="checkbox" name="rel-${d.id}" value="${rel}">
                                <span>${rel}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="severity-slider-box">
                    <label for="fh-severity-${d.id}">Family Disease Severity</label>
                    <input type="range" id="fh-severity-${d.id}" min="25" max="100" step="25" value="50" oninput="updateSeverityLabel('${d.id}')">
                    <div class="severity-desc">
                        <span>Mild (25%)</span>
                        <span style="font-weight: bold; color: var(--primary);">Moderate (50%)</span>
                        <span>Severe (75%)</span>
                        <span>Very Severe (100%)</span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function toggleDiseaseFH(diseaseId) {
    const toggle = document.getElementById(`fh-toggle-${diseaseId}`);
    const details = document.getElementById(`fh-details-${diseaseId}`);
    const card = document.getElementById(`fh-card-${diseaseId}`);
    
    if (toggle.checked) {
        details.classList.remove('hidden');
        card.classList.add('active');
    } else {
        details.classList.add('hidden');
        card.classList.remove('active');
    }
}

function updateSeverityLabel(diseaseId) {
    const slider = document.getElementById(`fh-severity-${diseaseId}`);
    const labelContainer = slider.nextElementSibling;
    const value = parseInt(slider.value);
    
    // Highlight active label
    const spans = labelContainer.querySelectorAll('span');
    spans.forEach(span => {
        span.style.fontWeight = 'normal';
        span.style.color = 'var(--text-muted)';
    });
    
    let index = 0;
    if (value === 25) index = 0;
    else if (value === 50) index = 1;
    else if (value === 75) index = 2;
    else if (value === 100) index = 3;
    
    spans[index].style.fontWeight = 'bold';
    spans[index].style.color = 'var(--primary)';
}

// 3. ROUTER & NAVIGATION
function router() {
    const hash = window.location.hash || '#home';
    
    // Page list
    const pages = document.querySelectorAll('.app-page');
    pages.forEach(p => p.classList.add('hidden'));
    
    // Clear active states in nav
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(l => l.classList.remove('active'));

    // Handle logout action
    if (hash === '#logout') {
        handleLogout();
        return;
    }

    // Access protection routing
    if (hash === '#asha-dashboard' && activeRole !== 'asha') {
        window.location.hash = '#login';
        return;
    }
    if (hash === '#admin-dashboard' && activeRole !== 'admin') {
        window.location.hash = '#login';
        return;
    }

    // Match page visibility
    let targetPageId = hash.substring(1);
    
    // Map specific page tabs / sub-views to correct visual targets
    if (targetPageId === 'asha-patients' || targetPageId === 'asha-dashboard') {
        targetPageId = 'asha-dashboard'; // Share dashboard container
        renderAshaDashboard();
    }
    if (targetPageId === 'admin-patients' || targetPageId === 'admin-ashas' || targetPageId === 'admin-dashboard') {
        // These run on same layout
        if (hash === '#admin-ashas') {
            document.getElementById('admin-dashboard').classList.add('hidden');
            document.getElementById('admin-ashas').classList.remove('hidden');
            renderAdminAshasTable();
        } else if (hash === '#admin-patients') {
            document.getElementById('admin-dashboard').classList.add('hidden');
            document.getElementById('admin-patients').classList.remove('hidden');
            renderAdminPatientsMasterTable();
        } else {
            document.getElementById('admin-ashas').classList.add('hidden');
            document.getElementById('admin-patients').classList.add('hidden');
            document.getElementById('admin-dashboard').classList.remove('hidden');
            renderAdminDashboard();
        }
    } else {
        const targetPage = document.getElementById(targetPageId);
        if (targetPage) {
            targetPage.classList.remove('hidden');
        } else {
            document.getElementById('home').classList.remove('hidden');
        }
    }

    // Set active nav link
    const activeLink = document.querySelector(`.nav-link[href="${hash}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Close mobile nav menu
    document.getElementById('app-nav-menu').classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNavigation() {
    const guestGroup = document.querySelector('.logged-out-only');
    const ashaGroup = document.querySelector('.asha-only');
    const adminGroup = document.querySelector('.admin-only');

    guestGroup.classList.add('hidden');
    ashaGroup.classList.add('hidden');
    adminGroup.classList.add('hidden');

    if (activeRole === 'asha') {
        ashaGroup.classList.remove('hidden');
        document.getElementById('asha-nav-name').textContent = currentUser.name;
    } else if (activeRole === 'admin') {
        adminGroup.classList.remove('hidden');
    } else if (activeRole === 'general') {
        // General users use guest nav layout, but we can customize options
        guestGroup.classList.remove('hidden');
        // Replace login/signup buttons with Logout and Assessment buttons
        const loginBtn = guestGroup.querySelector('.btn-login-nav');
        const signupBtn = guestGroup.querySelector('.btn-signup-nav');
        
        if (loginBtn) loginBtn.classList.add('hidden');
        if (signupBtn) signupBtn.classList.add('hidden');

        // Add dynamically if not already present
        if (!document.getElementById('nav-gen-assess')) {
            const assessLink = document.createElement('a');
            assessLink.href = '#assessment-start';
            assessLink.id = 'nav-gen-assess';
            assessLink.className = 'nav-link';
            assessLink.innerHTML = '<i class="fa-solid fa-file-medical"></i> Risk Assessment';
            
            const profileSpan = document.createElement('span');
            profileSpan.id = 'nav-gen-profile';
            profileSpan.className = 'user-profile-nav';
            profileSpan.innerHTML = `<i class="fa-solid fa-user"></i> ${currentUser.name}`;
            
            const logoutLink = document.createElement('a');
            logoutLink.href = '#logout';
            logoutLink.id = 'nav-gen-logout';
            logoutLink.className = 'nav-link btn-logout';
            logoutLink.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Logout';

            guestGroup.appendChild(assessLink);
            guestGroup.appendChild(profileSpan);
            guestGroup.appendChild(logoutLink);
        } else {
            document.getElementById('nav-gen-assess').classList.remove('hidden');
            document.getElementById('nav-gen-profile').classList.remove('hidden');
            document.getElementById('nav-gen-logout').classList.remove('hidden');
        }
    } else {
        // Guest mode
        guestGroup.classList.remove('hidden');
        const loginBtn = guestGroup.querySelector('.btn-login-nav');
        const signupBtn = guestGroup.querySelector('.btn-signup-nav');
        
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (signupBtn) signupBtn.classList.remove('hidden');

        // Hide customized elements
        if (document.getElementById('nav-gen-assess')) {
            document.getElementById('nav-gen-assess').classList.add('hidden');
            document.getElementById('nav-gen-profile').classList.add('hidden');
            document.getElementById('nav-gen-logout').classList.add('hidden');
        }
    }
}

// 4. AUTHENTICATION LOGIC
function switchSignupTab(role) {
    document.getElementById('tab-signup-general').classList.remove('active');
    document.getElementById('tab-signup-asha').classList.remove('active');
    document.getElementById('form-signup-general').classList.add('hidden');
    document.getElementById('form-signup-asha').classList.add('hidden');

    if (role === 'general') {
        document.getElementById('tab-signup-general').classList.add('active');
        document.getElementById('form-signup-general').classList.remove('hidden');
    } else {
        document.getElementById('tab-signup-asha').classList.add('active');
        document.getElementById('form-signup-asha').classList.remove('hidden');
    }
}

function switchLoginTab(role) {
    const tabs = document.querySelectorAll('.login-tabs .auth-tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    document.getElementById(`tab-login-${role}`).classList.add('active');
    document.getElementById('login-role').value = role;

    const idLabel = document.getElementById('login-identifier-label');
    const idInput = document.getElementById('login-username');
    const signupLink = document.getElementById('login-signup-link');

    if (role === 'admin') {
        idLabel.innerHTML = '<i class="fa-solid fa-user-shield"></i> Admin Username';
        idInput.placeholder = 'Enter admin username';
        idInput.type = 'text';
        signupLink.classList.add('hidden');
    } else if (role === 'asha') {
        idLabel.innerHTML = '<i class="fa-solid fa-id-card"></i> ASHA ID';
        idInput.placeholder = 'Enter your ASHA Worker ID';
        idInput.type = 'text';
        signupLink.classList.remove('hidden');
    } else {
        idLabel.innerHTML = '<i class="fa-solid fa-phone"></i> Phone Number';
        idInput.placeholder = 'Enter registered phone number';
        idInput.type = 'tel';
        signupLink.classList.remove('hidden');
    }
}

function handleGeneralSignup(e) {
    e.preventDefault();
    const name = document.getElementById('gen-name').value;
    const age = parseInt(document.getElementById('gen-age').value);
    const phone = document.getElementById('gen-phone').value;
    const state = document.getElementById('gen-state').value;
    const district = document.getElementById('gen-district').value;
    const password = document.getElementById('gen-password').value;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.phone === phone)) {
        alert("This phone number is already registered.");
        return;
    }

    const newUser = { role: 'general', name, age, phone, state, district, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    alert("Registration successful! Please login.");
    switchLoginTab('general');
    window.location.hash = '#login';
    document.getElementById('login-username').value = phone;
}

function handleAshaSignup(e) {
    e.preventDefault();
    const name = document.getElementById('asha-name').value;
    const ashaId = document.getElementById('asha-id').value;
    const phone = document.getElementById('asha-phone').value;
    const state = document.getElementById('asha-state').value;
    const district = document.getElementById('asha-district').value;
    const password = document.getElementById('asha-password').value;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.ashaId === ashaId)) {
        alert("This ASHA ID is already registered.");
        return;
    }

    const newUser = { role: 'asha', name, ashaId, phone, state, district, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    alert("ASHA Registration successful! Please login.");
    switchLoginTab('asha');
    window.location.hash = '#login';
    document.getElementById('login-username').value = ashaId;
}

function handleLogin(e) {
    e.preventDefault();
    const role = document.getElementById('login-role').value;
    const idVal = document.getElementById('login-username').value;
    const passVal = document.getElementById('login-password').value;

    if (role === 'admin') {
        if (idVal === 'admin' && passVal === 'healthadmin123') {
            currentUser = { role: 'admin', name: 'Admin Administrator' };
            activeRole = 'admin';
            sessionStorage.setItem('activeUser', JSON.stringify(currentUser));
            updateNavigation();
            window.location.hash = '#admin-dashboard';
        } else {
            alert("Incorrect Admin credentials.");
        }
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    let matchedUser = null;

    if (role === 'asha') {
        matchedUser = users.find(u => u.ashaId === idVal && u.role === 'asha');
    } else {
        matchedUser = users.find(u => u.phone === idVal && u.role === 'general');
    }

    if (matchedUser && matchedUser.password === passVal) {
        currentUser = matchedUser;
        activeRole = role;
        sessionStorage.setItem('activeUser', JSON.stringify(currentUser));
        updateNavigation();
        
        if (role === 'asha') {
            window.location.hash = '#asha-dashboard';
        } else {
            window.location.hash = '#home';
        }
    } else {
        alert("Invalid ID/Phone or Password.");
    }
}

function handleLogout() {
    currentUser = null;
    activeRole = 'guest';
    sessionStorage.removeItem('activeUser');
    updateNavigation();
    window.location.hash = '#home';
}

// 5. TOOLTIPS MANAGEMENT
function setupEventListeners() {
    // Mobile navigation toggler
    const navToggle = document.getElementById('nav-toggle-btn');
    const navMenu = document.getElementById('app-nav-menu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });
    }

    // Mobile tap tooltips
    document.body.addEventListener('click', (e) => {
        const triggers = document.querySelectorAll('.tooltip-trigger');
        const tappedTrigger = e.target.closest('.tooltip-trigger');
        
        triggers.forEach(t => {
            if (t !== tappedTrigger) {
                t.classList.remove('active');
            }
        });
        
        if (tappedTrigger) {
            e.stopPropagation();
            tappedTrigger.classList.toggle('active');
        }
    });

    // Close tooltips when clicking anywhere else
    document.addEventListener('click', () => {
        const triggers = document.querySelectorAll('.tooltip-trigger');
        triggers.forEach(t => t.classList.remove('active'));
    });
}

// 6. DASHBOARDS COMPONENT RENDERING

// ASHA WORKER DASHBOARD
function renderAshaDashboard() {
    if (activeRole !== 'asha') return;
    
    document.getElementById('asha-welcome-name').textContent = currentUser.name;
    
    const patients = JSON.parse(localStorage.getItem('patients')) || [];
    const myPatients = patients.filter(p => p.createdBy === currentUser.name && p.roleCreated === 'asha');
    
    const totalCount = myPatients.length;
    const pendingCount = myPatients.filter(p => p.followUpStatus === 'Pending').length;
    const followedCount = myPatients.filter(p => p.followUpStatus === 'Followed Up').length;
    
    document.getElementById('asha-stat-total').textContent = totalCount;
    document.getElementById('asha-stat-pending').textContent = pendingCount;
    document.getElementById('asha-stat-followed').textContent = followedCount;
    
    // Render list depending on route (either complete details or overview table)
    const hash = window.location.hash;
    if (hash === '#asha-patients') {
        renderAshaPatientsMasterList(myPatients);
    } else {
        renderAshaDashboardTable(myPatients);
    }
}

function renderAshaDashboardTable(myPatients) {
    const tbody = document.getElementById('asha-patient-tbody');
    tbody.innerHTML = '';
    
    if (myPatients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No assessments registered yet. Click "New Risk Assessment" to begin.</td></tr>`;
        return;
    }
    
    // Sort descending date
    const sorted = [...myPatients].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sorted.forEach(p => {
        const tr = document.createElement('tr');
        const dateFormatted = new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        
        tr.innerHTML = `
            <td><strong>${p.name}</strong></td>
            <td>${p.age}</td>
            <td><span class="table-badge ${p.overallRisk.toLowerCase()}">${p.overallRisk}</span></td>
            <td>${dateFormatted}</td>
            <td>
                <button class="btn btn-sm ${p.followUpStatus === 'Followed Up' ? 'btn-primary' : 'btn-outline'}" onclick="toggleFollowUp('${p.id}')">
                    <i class="fa-solid ${p.followUpStatus === 'Followed Up' ? 'fa-circle-check' : 'fa-circle'}"></i> ${p.followUpStatus}
                </button>
            </td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="viewAssessmentResult('${p.id}')"><i class="fa-solid fa-file-invoice"></i> Report</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAshaPatientsMasterList(myPatients) {
    const pageContainer = document.getElementById('asha-patients');
    const tbody = document.getElementById('asha-patients-list-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (myPatients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No patients registered.</td></tr>`;
        return;
    }

    myPatients.forEach(p => {
        const tr = document.createElement('tr');
        const genderText = p.gender === 1 ? 'Male' : (p.gender === 0 ? 'Female' : 'Other');
        const dateFormatted = new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        
        tr.innerHTML = `
            <td><strong>${p.name}</strong></td>
            <td>${p.age} Yrs / ${genderText}</td>
            <td>${p.district}, ${p.state}</td>
            <td><span class="table-badge ${p.overallRisk.toLowerCase()}">${p.overallRisk}</span></td>
            <td>${dateFormatted}</td>
            <td>
                <select onchange="updateFollowUpStatusDirectly('${p.id}', this.value)" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.85rem;">
                    <option value="Pending" ${p.followUpStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Followed Up" ${p.followUpStatus === 'Followed Up' ? 'selected' : ''}>Followed Up</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function toggleFollowUp(patientId) {
    const patients = JSON.parse(localStorage.getItem('patients')) || [];
    const ptIdx = patients.findIndex(p => p.id === patientId);
    
    if (ptIdx !== -1) {
        patients[ptIdx].followUpStatus = patients[ptIdx].followUpStatus === 'Followed Up' ? 'Pending' : 'Followed Up';
        localStorage.setItem('patients', JSON.stringify(patients));
        renderAshaDashboard();
    }
}

function updateFollowUpStatusDirectly(patientId, newStatus) {
    const patients = JSON.parse(localStorage.getItem('patients')) || [];
    const ptIdx = patients.findIndex(p => p.id === patientId);
    
    if (ptIdx !== -1) {
        patients[ptIdx].followUpStatus = newStatus;
        localStorage.setItem('patients', JSON.stringify(patients));
        renderAshaDashboard();
    }
}

// ADMIN DASHBOARD
function renderAdminDashboard() {
    if (activeRole !== 'admin') return;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const ashas = users.filter(u => u.role === 'asha');
    const patients = JSON.parse(localStorage.getItem('patients')) || [];

    document.getElementById('admin-stat-ashas').textContent = ashas.length;
    document.getElementById('admin-stat-assessments').textContent = patients.length;
    document.getElementById('admin-stat-highrisk').textContent = patients.filter(p => p.overallRisk === 'High').length;

    // Model Status Panel setup
    renderModelStatusPanel();

    // Populate Filters
    populateAdminFilterDropdowns(patients);

    // Render Table and chart
    applyAdminFilters();
}

function renderModelStatusPanel() {
    const grid = document.getElementById('model-status-grid-panel');
    if (!grid) return;

    grid.innerHTML = '';
    DISEASES.forEach(d => {
        const isReal = modelStatus[d.id] === true;
        const item = document.createElement('div');
        item.className = 'model-status-item';
        item.innerHTML = `
            <span>${d.name}</span>
            <div class="model-status-indicator">
                <span class="indicator-dot ${isReal ? 'real' : 'fallback'}"></span>
                <span style="font-size: 0.75rem; color: ${isReal ? 'var(--green)' : 'var(--yellow)'};">
                    ${isReal ? 'Real ML' : 'Fallback'}
                </span>
            </div>
        `;
        grid.appendChild(item);
    });
}

function populateAdminFilterDropdowns(patients) {
    const distSelect = document.getElementById('filter-district');
    const existingVal = distSelect.value;
    
    // Get unique districts
    const districts = [...new Set(patients.map(p => p.district))].filter(Boolean);
    districts.sort();

    distSelect.innerHTML = '<option value="">All Districts</option>';
    districts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        if (d === existingVal) opt.selected = true;
        distSelect.appendChild(opt);
    });
}

function applyAdminFilters() {
    const patients = JSON.parse(localStorage.getItem('patients')) || [];
    const distVal = document.getElementById('filter-district').value;
    const riskVal = document.getElementById('filter-risk').value;
    const dateVal = document.getElementById('filter-date').value;

    let filtered = patients;

    if (distVal) {
        filtered = filtered.filter(p => p.district === distVal);
    }
    if (riskVal) {
        filtered = filtered.filter(p => p.overallRisk === riskVal);
    }
    if (dateVal) {
        filtered = filtered.filter(p => p.date === dateVal);
    }

    renderAdminPatientsTable(filtered);
    updateRiskChartAndBreakdowns(filtered);
}

function resetAdminFilters() {
    document.getElementById('filter-district').value = '';
    document.getElementById('filter-risk').value = '';
    document.getElementById('filter-date').value = '';
    applyAdminFilters();
}

function renderAdminPatientsTable(filteredPatients) {
    const tbody = document.getElementById('admin-patient-tbody');
    tbody.innerHTML = '';

    if (filteredPatients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No assessments match filters.</td></tr>`;
        return;
    }

    const sorted = [...filteredPatients].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(p => {
        const tr = document.createElement('tr');
        const dateFormatted = new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        
        tr.innerHTML = `
            <td><strong>${p.name}</strong></td>
            <td>${p.age}</td>
            <td>${p.district}, ${p.state}</td>
            <td>${dateFormatted}</td>
            <td>${p.topRisks.join(', ')}</td>
            <td><span class="table-badge ${p.overallRisk.toLowerCase()}">${p.overallRisk}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function updateRiskChartAndBreakdowns(filteredPatients) {
    const total = filteredPatients.length;
    const high = filteredPatients.filter(p => p.overallRisk === 'High').length;
    const med = filteredPatients.filter(p => p.overallRisk === 'Medium').length;
    const low = filteredPatients.filter(p => p.overallRisk === 'Low').length;

    // Update legend labels
    const highPct = total > 0 ? Math.round((high / total) * 100) : 0;
    const medPct = total > 0 ? Math.round((med / total) * 100) : 0;
    const lowPct = total > 0 ? Math.round((low / total) * 100) : 0;

    document.getElementById('donut-total-val').textContent = total;
    document.getElementById('legend-high-pct').textContent = `${highPct}%`;
    document.getElementById('legend-med-pct').textContent = `${medPct}%`;
    document.getElementById('legend-low-pct').textContent = `${lowPct}%`;

    // SVG donut dash offsets calculation
    // R=80 -> Circumference = 502.65
    const circ = 2 * Math.PI * 80;
    const highSeg = document.getElementById('donut-seg-high');
    const medSeg = document.getElementById('donut-seg-med');
    const lowSeg = document.getElementById('donut-seg-low');

    if (total === 0) {
        highSeg.style.strokeDasharray = `0 ${circ}`;
        medSeg.style.strokeDasharray = `0 ${circ}`;
        lowSeg.style.strokeDasharray = `0 ${circ}`;
        return;
    }

    const highLength = (high / total) * circ;
    const medLength = (med / total) * circ;
    const lowLength = (low / total) * circ;

    // Stroke dashes
    highSeg.style.strokeDasharray = `${highLength} ${circ}`;
    highSeg.style.strokeDashoffset = 0;

    medSeg.style.strokeDasharray = `${medLength} ${circ}`;
    medSeg.style.strokeDashoffset = -highLength;

    lowSeg.style.strokeDasharray = `${lowLength} ${circ}`;
    lowSeg.style.strokeDashoffset = -(highLength + medLength);

    // District high risk breakdown listing
    const distContainer = document.getElementById('admin-district-list');
    distContainer.innerHTML = '';

    const highPatients = filteredPatients.filter(p => p.overallRisk === 'High');
    if (highPatients.length === 0) {
        distContainer.innerHTML = `<p class="text-muted text-center mt-4">No high risk cases recorded.</p>`;
        return;
    }

    // Counts mapping
    const counts = {};
    highPatients.forEach(p => {
        counts[p.district] = (counts[p.district] || 0) + 1;
    });

    // Sort descending
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([dist, count]) => {
        const div = document.createElement('div');
        div.className = 'district-item';
        div.innerHTML = `
            <span class="district-tag">${dist}</span>
            <span class="district-count">${count} High Case${count > 1 ? 's' : ''}</span>
        `;
        distContainer.appendChild(div);
    });
}

function renderAdminAshasTable() {
    const tbody = document.getElementById('admin-asha-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const ashas = users.filter(u => u.role === 'asha');

    if (ashas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No ASHA workers registered yet.</td></tr>`;
        return;
    }

    ashas.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${a.name}</strong></td>
            <td>${a.ashaId}</td>
            <td>${a.phone}</td>
            <td>${a.state}</td>
            <td>${a.district}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAdminPatientsMasterTable() {
    const tbody = document.getElementById('admin-patients-master-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const patients = JSON.parse(localStorage.getItem('patients')) || [];

    if (patients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No assessments completed.</td></tr>`;
        return;
    }

    patients.forEach(p => {
        const tr = document.createElement('tr');
        const dateFormatted = new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        
        tr.innerHTML = `
            <td><strong>${p.name}</strong></td>
            <td>${p.age}</td>
            <td>${p.district}, ${p.state}</td>
            <td>${dateFormatted}</td>
            <td><span class="table-badge ${p.overallRisk.toLowerCase()}">${p.overallRisk}</span></td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="viewAssessmentResult('${p.id}')"><i class="fa-solid fa-file-invoice"></i> Report</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 7. RISK ASSESSMENT MULTI-STEP WIZARD ENGINE
function showFamilyMemberDialog() {
    document.getElementById('family-member-box').classList.remove('hidden');
}

function hideFamilyMemberDialog() {
    document.getElementById('family-member-box').classList.add('hidden');
    document.getElementById('fam-name').value = '';
}

function initiateAssessment(mode) {
    assessmentData = {
        mode: mode,
        date: new Date().toISOString().split('T')[0]
    };

    if (mode === 'Self') {
        // Pre-fill from active user if they are general
        if (activeRole === 'general') {
            assessmentData.name = currentUser.name;
            assessmentData.age = parseInt(currentUser.age);
            assessmentData.gender = 1; // Default
            assessmentData.state = currentUser.state;
            assessmentData.district = currentUser.district;
        } else {
            assessmentData.name = '';
            assessmentData.age = '';
            assessmentData.gender = '1';
            assessmentData.state = '';
            assessmentData.district = '';
        }
    } else {
        const famName = document.getElementById('fam-name').value.trim();
        const relationship = document.getElementById('fam-relation').value;
        if (!famName) {
            alert("Please enter the family member's name.");
            return;
        }
        assessmentData.name = famName;
        assessmentData.relation = relationship;
        assessmentData.age = '';
        assessmentData.gender = '1';
        // Inherit locations from logged in asha/user
        if (currentUser) {
            assessmentData.state = currentUser.state;
            assessmentData.district = currentUser.district;
        }
    }

    // Set header tag
    const targetNameSpan = document.getElementById('wizard-target-name');
    targetNameSpan.textContent = mode === 'Self' ? `Screening: Myself` : `Screening Relative: ${assessmentData.name} (${assessmentData.relation})`;

    hideFamilyMemberDialog();
    startWizardFlow();
}

function startWizardFlow() {
    currentStep = 1;
    // Load pre-filled inputs to DOM
    document.getElementById('pt-name').value = assessmentData.name;
    document.getElementById('pt-age').value = assessmentData.age;
    if (assessmentData.gender !== undefined) {
        document.getElementById('pt-gender').value = assessmentData.gender;
    }
    
    if (assessmentData.state) {
        document.getElementById('pt-state').value = assessmentData.state;
        populateDistricts('pt-state', 'pt-district');
        if (assessmentData.district) {
            // Delay to allow population
            setTimeout(() => {
                document.getElementById('pt-district').value = assessmentData.district;
            }, 100);
        }
    } else {
        document.getElementById('pt-state').value = '';
        document.getElementById('pt-district').innerHTML = '<option value="">Select State First</option>';
        document.getElementById('pt-district').disabled = true;
    }

    // Reset family checkboxes
    DISEASES.forEach(d => {
        document.getElementById(`fh-toggle-${d.id}`).checked = false;
        document.getElementById(`fh-details-${d.id}`).classList.add('hidden');
        document.getElementById(`fh-card-${d.id}`).classList.remove('active');
        const checks = document.querySelectorAll(`input[name="rel-${d.id}"]`);
        checks.forEach(c => c.checked = false);
        document.getElementById(`fh-severity-${d.id}`).value = 50;
        updateSeverityLabel(d.id);
    });

    // Reset symptoms
    const sympChecks = document.querySelectorAll('.symptom-check');
    sympChecks.forEach(c => c.checked = false);

    // Reset lifestyle
    document.getElementById('ls-tobacco-no').checked = true;
    document.getElementById('ls-alcohol-no').checked = true;
    document.getElementById('ls-physical').value = 1;
    document.getElementById('ls-diet').value = 2;

    // Reset vitals
    document.getElementById('vital-systolic').value = '';
    document.getElementById('vital-diastolic').value = '';
    document.getElementById('vital-fbs').value = '';
    document.getElementById('vital-height').value = '';
    document.getElementById('vital-weight').value = '';
    document.getElementById('vital-bmi').value = '';
    document.getElementById('bmi-status').textContent = '';

    // Reset optional clinical
    document.getElementById('clin-chol').value = '';
    document.getElementById('clin-hba1c').value = '';
    document.getElementById('clin-ecg').value = '';
    document.getElementById('clin-maxhr').value = '';
    document.getElementById('clin-hemo').value = '';
    document.getElementById('clin-creat').value = '';
    document.getElementById('clin-tsh').value = '';
    document.getElementById('clin-waist').value = '';

    window.location.hash = '#assessment-wizard';
    showStep(1);
}

function showStep(stepNum) {
    // Hide all steps
    const steps = document.querySelectorAll('.wizard-step');
    steps.forEach(s => s.classList.add('hidden'));

    // Show target step
    document.getElementById(`w-step-${stepNum}`).classList.remove('hidden');

    // Update Title
    const stepTitles = [
        "Step 1 — Personal Details",
        "Step 2 — Family Disease History",
        "Step 3 — Current Symptoms",
        "Step 4 — Lifestyle",
        "Step 5 — Basic Vitals",
        "Step 6 — Clinical Measurements"
    ];
    document.getElementById('step-title').textContent = stepTitles[stepNum - 1];

    // Update dots
    const dots = document.querySelectorAll('.step-dot');
    dots.forEach((dot, idx) => {
        dot.classList.remove('active', 'completed');
        if (idx + 1 === stepNum) {
            dot.classList.add('active');
        } else if (idx + 1 < stepNum) {
            dot.classList.add('completed');
        }
    });

    // Update progress bar
    const progressFill = document.getElementById('wizard-progress-fill');
    const widthPct = (stepNum / maxSteps) * 100;
    progressFill.style.width = `${widthPct}%`;

    // Manage buttons
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');

    if (stepNum === 1) {
        prevBtn.disabled = true;
        prevBtn.style.opacity = 0.5;
    } else {
        prevBtn.disabled = false;
        prevBtn.style.opacity = 1;
    }

    if (stepNum === maxSteps) {
        nextBtn.innerHTML = 'Review Summary <i class="fa-solid fa-clipboard-check"></i>';
    } else {
        nextBtn.innerHTML = 'Next <i class="fa-solid fa-arrow-right"></i>';
    }
}

function handlePrevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

function handleNextStep() {
    // Step validation checks
    if (!validateStep(currentStep)) return;

    if (currentStep < maxSteps) {
        currentStep++;
        showStep(currentStep);
    } else {
        // Go to confirmation screen
        gatherAssessmentSummary();
        window.location.hash = '#assessment-confirm';
    }
}

function skipStep6() {
    // Set all clinical values to empty/null
    document.getElementById('clin-chol').value = '';
    document.getElementById('clin-hba1c').value = '';
    document.getElementById('clin-ecg').value = '';
    document.getElementById('clin-maxhr').value = '';
    document.getElementById('clin-hemo').value = '';
    document.getElementById('clin-creat').value = '';
    document.getElementById('clin-tsh').value = '';
    document.getElementById('clin-waist').value = '';

    // Proceed to confirmation screen
    gatherAssessmentSummary();
    window.location.hash = '#assessment-confirm';
}

function goToStep(stepNum) {
    window.location.hash = '#assessment-wizard';
    currentStep = stepNum;
    showStep(currentStep);
}

function validateStep(stepNum) {
    if (stepNum === 1) {
        const name = document.getElementById('pt-name').value.trim();
        const age = document.getElementById('pt-age').value;
        const state = document.getElementById('pt-state').value;
        const district = document.getElementById('pt-district').value;

        if (!name || !age || !state || !district) {
            alert("Please fill in all personal details.");
            return false;
        }
        return true;
    }
    
    if (stepNum === 5) {
        const systolic = document.getElementById('vital-systolic').value;
        const diastolic = document.getElementById('vital-diastolic').value;
        const fbs = document.getElementById('vital-fbs').value;
        const height = document.getElementById('vital-height').value;
        const weight = document.getElementById('vital-weight').value;

        if (!systolic || !diastolic || !fbs || !height || !weight) {
            alert("All vitals in Step 5 are required and cannot be skipped.");
            return false;
        }
        return true;
    }
    return true;
}

function calculateBMIFrontend() {
    const height = parseFloat(document.getElementById('vital-height').value);
    const weight = parseFloat(document.getElementById('vital-weight').value);
    const bmiInput = document.getElementById('vital-bmi');
    const bmiStatus = document.getElementById('bmi-status');

    if (!height || !weight) {
        bmiInput.value = '';
        bmiStatus.textContent = '';
        return;
    }

    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    const bmiVal = bmi.toFixed(1);
    bmiInput.value = bmiVal;

    let category = '';
    let color = '';

    if (bmi < 18.5) {
        category = 'Underweight';
        color = 'var(--blue)';
    } else if (bmi >= 18.5 && bmi < 24.9) {
        category = 'Normal Weight';
        color = 'var(--green)';
    } else if (bmi >= 25 && bmi < 29.9) {
        category = 'Overweight';
        color = 'var(--yellow)';
    } else {
        category = 'Obese';
        color = 'var(--red)';
    }

    bmiStatus.textContent = `Classification: ${category}`;
    bmiStatus.style.color = color;
}

// 8. SUMMARY GATHERING & RENDER
function gatherAssessmentSummary() {
    // Basic Personal
    assessmentData.name = document.getElementById('pt-name').value.trim();
    assessmentData.age = parseInt(document.getElementById('pt-age').value);
    assessmentData.gender = parseInt(document.getElementById('pt-gender').value);
    assessmentData.state = document.getElementById('pt-state').value;
    assessmentData.district = document.getElementById('pt-district').value;

    // Gather Family History values
    DISEASES.forEach(d => {
        const hasFh = document.getElementById(`fh-toggle-${d.id}`).checked;
        assessmentData[`${d.id}_fh`] = hasFh ? 1 : 0;
        
        if (hasFh) {
            const relChecked = Array.from(document.querySelectorAll(`input[name="rel-${d.id}"]:checked`)).map(c => c.value);
            assessmentData[`${d.id}_relatives`] = relChecked;
            assessmentData[`${d.id}_severity`] = parseInt(document.getElementById(`fh-severity-${d.id}`).value);
        } else {
            assessmentData[`${d.id}_relatives`] = [];
            assessmentData[`${d.id}_severity`] = 0;
        }
    });

    // Gather Symptoms
    assessmentData.symptoms = [];
    const sympMapping = {
        'thirst': 'Frequent thirst or urination',
        'fatigue': 'Unexplained fatigue or weakness',
        'chest_pain': 'Chest pain or tightness',
        'breathless': 'Shortness of breath on exertion',
        'blurred_vision': 'Blurred vision',
        'headache': 'Frequent headaches',
        'swelling': 'Swelling in feet or ankles',
        'weight_change': 'Unexplained weight loss or gain',
        'joint_pain': 'Joint pain or stiffness',
        'infections': 'Frequent infections or slow healing wounds',
        'pale_skin': 'Pale skin or yellowing of eyes',
        'breathless_rest': 'Frequent breathlessness even at rest'
    };

    Object.keys(sympMapping).forEach(key => {
        const checked = document.getElementById(`symp-${key.replace('_', '-')}`).checked;
        assessmentData[`symptom_${key}`] = checked ? 1 : 0;
        if (checked) {
            assessmentData.symptoms.push(sympMapping[key]);
        }
    });

    // Gather Lifestyle
    assessmentData.smoking = parseInt(document.querySelector('input[name="ls-tobacco"]:checked').value);
    assessmentData.alcohol = parseInt(document.querySelector('input[name="ls-alcohol"]:checked').value);
    assessmentData.physical_activity = parseInt(document.getElementById('ls-physical').value);
    assessmentData.diet = parseInt(document.getElementById('ls-diet').value);

    // Gather Vitals & Clinicals
    assessmentData.systolic_bp = parseFloat(document.getElementById('vital-systolic').value);
    assessmentData.diastolic_bp = parseFloat(document.getElementById('vital-diastolic').value);
    assessmentData.blood_sugar = parseFloat(document.getElementById('vital-fbs').value);
    assessmentData.height = parseFloat(document.getElementById('vital-height').value);
    assessmentData.weight = parseFloat(document.getElementById('vital-weight').value);
    assessmentData.bmi = parseFloat(document.getElementById('vital-bmi').value);

    // Optional Clinicals
    const readOptional = (id) => {
        const val = document.getElementById(id).value;
        return val !== "" ? parseFloat(val) : null;
    };
    
    assessmentData.cholesterol = readOptional('clin-chol');
    assessmentData.hba1c = readOptional('clin-hba1c');
    
    const ecgVal = document.getElementById('clin-ecg').value;
    assessmentData.ecg = ecgVal !== "" ? parseInt(ecgVal) : null;
    
    assessmentData.max_heart_rate = readOptional('clin-maxhr');
    assessmentData.haemoglobin = readOptional('clin-hemo');
    assessmentData.creatinine = readOptional('clin-creat');
    assessmentData.tsh = readOptional('clin-tsh');
    assessmentData.waist = readOptional('clin-waist');

    // RENDER CONFIRMATION DOM
    // 1. Personal Details
    const gText = assessmentData.gender === 1 ? 'Male' : (assessmentData.gender === 0 ? 'Female' : 'Other');
    document.getElementById('summary-personal-details').innerHTML = `
        <div class="summary-item"><span>Patient Name:</span> <strong>${assessmentData.name}</strong></div>
        <div class="summary-item"><span>Age / Gender:</span> <strong>${assessmentData.age} Yrs / ${gText}</strong></div>
        <div class="summary-item"><span>State:</span> <strong>${assessmentData.state}</strong></div>
        <div class="summary-item"><span>District:</span> <strong>${assessmentData.district}</strong></div>
    `;

    // 2. Family History
    const fhBox = document.getElementById('summary-family-history');
    fhBox.innerHTML = '';
    let fhCount = 0;
    
    DISEASES.forEach(d => {
        if (assessmentData[`${d.id}_fh`]) {
            fhCount++;
            const div = document.createElement('div');
            div.className = 'summary-list-item';
            div.innerHTML = `
                <span><strong>${d.name}</strong> (${assessmentData[`${d.id}_relatives`].join(', ')})</span>
                <span class="text-primary" style="font-weight: 600;">Severity: ${assessmentData[`${d.id}_severity`]}%</span>
            `;
            fhBox.appendChild(div);
        }
    });
    if (fhCount === 0) {
        fhBox.innerHTML = `<p class="text-muted" style="font-size: 0.9rem;">No genetic disease histories selected.</p>`;
    }

    // 3. Symptoms & Lifestyle
    const slBox = document.getElementById('summary-symptoms-lifestyle');
    slBox.innerHTML = '';
    
    // Add symptoms tags
    assessmentData.symptoms.forEach(sym => {
        const span = document.createElement('span');
        span.className = 'summary-tag';
        span.innerHTML = `<i class="fa-solid fa-virus"></i> ${sym}`;
        slBox.appendChild(span);
    });

    // Add lifestyle tags
    const actTexts = ['Sedentary Active', 'Moderate Activity', 'High Physical Active'];
    const dietTexts = ['Vegetarian Diet', 'Non-Vegetarian Diet', 'Mixed Diet'];
    
    const smokingTag = document.createElement('span');
    smokingTag.className = 'summary-tag';
    smokingTag.innerHTML = `<i class="fa-solid fa-smoking"></i> Smoking: ${assessmentData.smoking === 1 ? 'Yes' : 'No'}`;
    slBox.appendChild(smokingTag);

    const alcoholTag = document.createElement('span');
    alcoholTag.className = 'summary-tag';
    alcoholTag.innerHTML = `<i class="fa-solid fa-wine-glass"></i> Alcohol: ${assessmentData.alcohol === 1 ? 'Yes' : 'No'}`;
    slBox.appendChild(alcoholTag);

    const activeTag = document.createElement('span');
    activeTag.className = 'summary-tag';
    activeTag.innerHTML = `<i class="fa-solid fa-person-running"></i> ${actTexts[assessmentData.physical_activity]}`;
    slBox.appendChild(activeTag);

    const dietTag = document.createElement('span');
    dietTag.className = 'summary-tag';
    dietTag.innerHTML = `<i class="fa-solid fa-utensils"></i> ${dietTexts[assessmentData.diet]}`;
    slBox.appendChild(dietTag);

    // 4. Vitals
    document.getElementById('summary-vitals').innerHTML = `
        <div class="summary-item"><span>Blood Pressure:</span> <strong>${assessmentData.systolic_bp}/${assessmentData.diastolic_bp} mmHg</strong></div>
        <div class="summary-item"><span>Fasting Sugar:</span> <strong>${assessmentData.blood_sugar} mg/dL</strong></div>
        <div class="summary-item"><span>BMI Score:</span> <strong>${assessmentData.bmi}</strong></div>
        <div class="summary-item"><span>Cholesterol:</span> <strong>${assessmentData.cholesterol !== null ? assessmentData.cholesterol + ' mg/dL' : 'Not Tested'}</strong></div>
        <div class="summary-item"><span>HbA1c (%):</span> <strong>${assessmentData.hba1c !== null ? assessmentData.hba1c + '%' : 'Not Tested'}</strong></div>
        <div class="summary-item"><span>Creatinine:</span> <strong>${assessmentData.creatinine !== null ? assessmentData.creatinine + ' mg/dL' : 'Not Tested'}</strong></div>
    `;
}

// 9. SUBMISSION & PREDICTIONS
function submitAssessment() {
    window.location.hash = '#assessment-result';
    
    const loader = document.getElementById('result-loader');
    const resultBox = document.getElementById('result-details-content');
    
    loader.classList.remove('hidden');
    resultBox.classList.add('hidden');

    // Make prediction request to Flask API
    fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(assessmentData)
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`Server returned HTTP ${res.status}`);
        }
        return res.json();
    })
    .then(predictions => {
        handlePredictionSuccess(predictions);
    })
    .catch(err => {
        console.warn("Flask Backend Predict Offline or Errored. Using Javascript rule-based fallback scoring engine.", err);
        // Fallback calculations in frontend
        const fallbackResults = calculateRiskFallback(assessmentData);
        handlePredictionSuccess(fallbackResults);
    });
}

function handlePredictionSuccess(results) {
    // Mock latency for loading screen
    setTimeout(() => {
        const loader = document.getElementById('result-loader');
        const resultBox = document.getElementById('result-details-content');
        
        loader.classList.add('hidden');
        resultBox.classList.remove('hidden');

        // Compile and save patient entry
        const patients = JSON.parse(localStorage.getItem('patients')) || [];
        
        const newPatientRecord = {
            id: 'pt-' + Date.now(),
            name: assessmentData.name,
            age: assessmentData.age,
            gender: assessmentData.gender,
            state: assessmentData.state,
            district: assessmentData.district,
            date: assessmentData.date,
            createdBy: currentUser ? currentUser.name : 'Public Citizen',
            roleCreated: activeRole,
            overallRisk: results.overall_risk,
            topRisks: results.top_risks,
            results: {
                diabetes_risk: results.diabetes_risk,
                hypertension_risk: results.hypertension_risk,
                heart_risk: results.heart_risk,
                cancer_risk: results.cancer_risk,
                thyroid_risk: results.thyroid_risk,
                ckd_risk: results.ckd_risk,
                obesity_risk: results.obesity_risk
            },
            followUpStatus: 'Pending',
            symptoms: assessmentData.symptoms,
            vitals: {
                systolic: assessmentData.systolic_bp,
                diastolic: assessmentData.diastolic_bp,
                fbs: assessmentData.blood_sugar,
                bmi: assessmentData.bmi,
                height: assessmentData.height,
                weight: assessmentData.weight
            },
            clinical: {
                cholesterol: assessmentData.cholesterol,
                hba1c: assessmentData.hba1c,
                ecg: assessmentData.ecg,
                maxhr: assessmentData.max_heart_rate,
                hemo: assessmentData.haemoglobin,
                creat: assessmentData.creatinine,
                tsh: assessmentData.tsh,
                waist: assessmentData.waist
            }
        };

        patients.push(newPatientRecord);
        localStorage.setItem('patients', JSON.stringify(patients));

        currentAssessmentId = newPatientRecord.id;
        renderResultScreen(newPatientRecord);
    }, 2000);
}

// 10. JAVASCRIPT FALLBACK SCORING ENGINE
function calculateRiskFallback(data) {
    const age = data.age;
    const gender = data.gender;
    const smoking = data.smoking;
    const alcohol = data.alcohol;
    const physical_activity = data.physical_activity;
    const diet = data.diet;
    const systolic_bp = data.systolic_bp;
    const diastolic_bp = data.diastolic_bp;
    const blood_sugar = data.blood_sugar;
    const bmi = data.bmi;

    const cholesterol = data.cholesterol !== null ? data.cholesterol : 190.0;
    const hba1c = data.hba1c !== null ? data.hba1c : 5.5;
    const ecg = data.ecg !== null ? data.ecg : 0;
    const max_heart_rate = data.max_heart_rate !== null ? data.max_heart_rate : 145.0;
    const haemoglobin = data.haemoglobin !== null ? data.haemoglobin : 13.5;
    const creatinine = data.creatinine !== null ? data.creatinine : 0.9;
    const tsh = data.tsh !== null ? data.tsh : 2.1;
    const waist = data.waist !== null ? data.waist : 85.0;

    const s_thirst = data.symptom_thirst;
    const s_fatigue = data.symptom_fatigue;
    const s_chest_pain = data.symptom_chest_pain;
    const s_breathless = data.symptom_breathless;
    const s_blurred_vision = data.symptom_blurred_vision;
    const s_headache = data.symptom_headache;
    const s_swelling = data.symptom_swelling;
    const s_weight_change = data.symptom_weight_change;
    const s_joint_pain = data.symptom_joint_pain;
    const s_infections = data.symptom_infections;
    const s_pale_skin = data.symptom_pale_skin;
    const s_breathless_rest = data.symptom_breathless_rest;

    const db_fh = data.diabetes_fh;
    const db_sev = data.diabetes_severity;
    const ht_fh = data.hypertension_fh;
    const ht_sev = data.hypertension_severity;
    const cardio_fh = data.heart_fh;
    const cardio_sev = data.heart_severity;
    const ca_fh = data.cancer_fh;
    const ca_sev = data.cancer_severity;
    const th_fh = data.thyroid_fh;
    const th_sev = data.thyroid_severity;
    const ckd_fh = data.ckd_fh;
    const ckd_sev = data.ckd_severity;
    const ob_fh = data.obesity_fh;
    const ob_sev = data.obesity_severity;

    const base_risk = age > 18 ? 5.0 + (age - 18) * 0.3 : 5.0;
    
    // Disease scores container
    const risks = {};

    // 1. DIABETES
    let db_score = base_risk;
    if (db_fh) db_score += db_sev * 0.40;
    if (blood_sugar > 100) db_score += (blood_sugar - 100) * 0.5;
    if (bmi > 25) db_score += (bmi - 25) * 1.5;
    if (s_thirst) db_score += 15;
    if (s_fatigue) db_score += 5;
    if (s_blurred_vision) db_score += 10;
    if (s_weight_change) db_score += 10;
    if (s_infections) db_score += 8;
    if (hba1c > 5.7) db_score += (hba1c - 5.7) * 20;
    if (physical_activity === 0) db_score += 8;
    if (physical_activity === 2) db_score -= 5;
    risks['diabetes'] = Math.min(Math.max(db_score, 0), 100);

    // 2. HYPERTENSION
    let ht_score = base_risk;
    if (ht_fh) ht_score += ht_sev * 0.40;
    if (systolic_bp > 120) ht_score += (systolic_bp - 120) * 0.6;
    if (diastolic_bp > 80) ht_score += (diastolic_bp - 80) * 0.8;
    if (bmi > 25) ht_score += (bmi - 25) * 1.2;
    if (s_headache) ht_score += 12;
    if (s_fatigue) ht_score += 5;
    if (s_swelling) ht_score += 8;
    if (smoking) ht_score += 10;
    if (alcohol) ht_score += 8;
    if (physical_activity === 0) ht_score += 8;
    risks['hypertension'] = Math.min(Math.max(ht_score, 0), 100);

    // 3. HEART
    let card_score = base_risk;
    if (cardio_fh) card_score += cardio_sev * 0.40;
    if (systolic_bp > 130 || diastolic_bp > 85) card_score += 12;
    if (cholesterol > 200) card_score += (cholesterol - 200) * 0.25;
    if (bmi > 25) card_score += (bmi - 25) * 1.0;
    if (s_chest_pain) card_score += 30;
    if (s_breathless || s_breathless_rest) card_score += 15;
    if (s_fatigue) card_score += 5;
    if (ecg === 1) card_score += 10;
    else if (ecg === 2) card_score += 25;
    if (max_heart_rate > 160) card_score += 8;
    if (smoking) card_score += 12;
    if (alcohol) card_score += 8;
    if (physical_activity === 0) card_score += 8;
    risks['heart'] = Math.min(Math.max(card_score, 0), 100);

    // 4. CANCER
    let ca_score = base_risk;
    if (ca_fh) ca_score += ca_sev * 0.45;
    if (smoking) ca_score += 20;
    if (alcohol) ca_score += 10;
    if (physical_activity === 0) ca_score += 5;
    if (s_weight_change) ca_score += 12;
    if (s_fatigue) ca_score += 8;
    if (s_pale_skin) ca_score += 8;
    risks['cancer'] = Math.min(Math.max(ca_score, 0), 100);

    // 5. THYROID
    let th_score = base_risk;
    if (th_fh) th_score += th_sev * 0.40;
    if (s_fatigue) th_score += 15;
    if (s_weight_change) th_score += 15;
    if (s_joint_pain) th_score += 8;
    let tsh_diff = Math.abs(tsh - 2.2);
    if (tsh_diff > 1.8) th_score += tsh_diff * 12;
    risks['thyroid'] = Math.min(Math.max(th_score, 0), 100);

    // 6. CKD
    let ckd_score = base_risk;
    if (ckd_fh) ckd_score += ckd_sev * 0.40;
    if (creatinine > 1.1) ckd_score += (creatinine - 1.1) * 45;
    if (systolic_bp > 130 || diastolic_bp > 85) ckd_score += 10;
    if (blood_sugar > 120) ckd_score += 8;
    if (haemoglobin < 12.0) ckd_score += (12.0 - haemoglobin) * 8;
    if (s_swelling) ckd_score += 15;
    if (s_fatigue) ckd_score += 8;
    if (s_breathless) ckd_score += 8;
    risks['ckd'] = Math.min(Math.max(ckd_score, 0), 100);

    // 7. OBESITY
    let ob_score = base_risk;
    if (ob_fh) ob_score += ob_sev * 0.40;
    if (bmi > 25) ob_score += (bmi - 25) * 6;
    if (gender === 0 && waist > 80) ob_score += 15;
    else if (gender === 1 && waist > 90) ob_score += 15;
    if (physical_activity === 0) ob_score += 10;
    if (physical_activity === 2) ob_score -= 5;
    if (diet === 1) ob_score += 5;
    if (s_joint_pain) ob_score += 5;
    risks['obesity'] = Math.min(Math.max(ob_score, 0), 100);

    // Overall Risk logic
    const all_scores = Object.values(risks);
    const avg = all_scores.reduce((a, b) => a + b, 0) / all_scores.length;
    const max = Math.max(...all_scores);

    let overall = 'Low';
    if (max >= 70.0 || avg >= 50.0) {
        overall = 'High';
    } else if (max >= 40.0) {
        overall = 'Medium';
    }

    // Top 3 Risks
    const sorted = Object.entries(risks).sort((a, b) => b[1] - a[1]);
    const diseaseKeyMap = {
        'diabetes': 'Diabetes',
        'hypertension': 'Hypertension',
        'heart': 'Heart Disease',
        'cancer': 'Cancer',
        'thyroid': 'Thyroid Disorder',
        'ckd': 'Chronic Kidney Disease',
        'obesity': 'Obesity'
    };
    const top = sorted.slice(0, 3).map(item => diseaseKeyMap[item[0]]);

    return {
        diabetes_risk: risks['diabetes'],
        hypertension_risk: risks['hypertension'],
        heart_risk: risks['heart'],
        cancer_risk: risks['cancer'],
        thyroid_risk: risks['thyroid'],
        ckd_risk: risks['ckd'],
        obesity_risk: risks['obesity'],
        overall_risk: overall,
        top_risks: top
    };
}

// 11. RESULT SCREEN RENDERING
function viewAssessmentResult(recordId) {
    const patients = JSON.parse(localStorage.getItem('patients')) || [];
    const record = patients.find(p => p.id === recordId);
    
    if (record) {
        currentAssessmentId = record.id;
        window.location.hash = '#assessment-result';
        // Mock immediate load
        document.getElementById('result-loader').classList.add('hidden');
        document.getElementById('result-details-content').classList.remove('hidden');
        renderResultScreen(record);
    }
}

function renderResultScreen(record) {
    // Fill headers
    const genderText = record.gender === 1 ? 'Male' : (record.gender === 0 ? 'Female' : 'Other');
    const dateFormatted = new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    
    document.getElementById('res-date').textContent = dateFormatted;
    document.getElementById('res-pt-name').textContent = record.name;
    document.getElementById('res-pt-age').textContent = record.age;
    document.getElementById('res-pt-gender').textContent = genderText;

    // Set overall risk badge classes
    const badge = document.getElementById('res-overall-badge');
    badge.textContent = record.overallRisk;
    badge.className = 'risk-badge ' + record.overallRisk.toLowerCase();

    // 1. DRIVING DISEASE EXPLANATION (New Requirement)
    const drivingBox = document.getElementById('res-driving-disease-container');
    const drivingText = document.getElementById('res-driving-disease-text');
    
    if (record.overallRisk === 'High') {
        drivingBox.classList.remove('hidden');
        
        // Find specific high risk driving diseases (score >= 70%)
        const drivers = [];
        const diseaseNamesMap = {
            diabetes_risk: 'Diabetes',
            hypertension_risk: 'Hypertension',
            heart_risk: 'Heart Disease',
            cancer_risk: 'Cancer',
            thyroid_risk: 'Thyroid Disorder',
            ckd_risk: 'Chronic Kidney Disease',
            obesity_risk: 'Obesity'
        };

        Object.entries(record.results).forEach(([key, val]) => {
            if (val >= 70.0) {
                drivers.push(`${diseaseNamesMap[key]} (${val.toFixed(1)}%)`);
            }
        });

        // Fallback to top score if none are technically >= 70% but average drove it high
        if (drivers.length === 0) {
            // Find max score
            const maxEnt = Object.entries(record.results).sort((a,b)=>b[1]-a[1])[0];
            drivers.push(`${diseaseNamesMap[maxEnt[0]]} (${maxEnt[1].toFixed(1)}%)`);
        }

        drivingText.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Overall risk is High primarily due to ${drivers.join(' and ')}.`;
    } else {
        drivingBox.classList.add('hidden');
    }

    // 2. Risk Bars
    const barsContainer = document.getElementById('disease-risk-bars-container');
    barsContainer.innerHTML = '';
    
    const dKeys = [
        { key: 'diabetes_risk', name: 'Diabetes' },
        { key: 'hypertension_risk', name: 'Hypertension' },
        { key: 'heart_risk', name: 'Heart Disease' },
        { key: 'cancer_risk', name: 'Cancer' },
        { key: 'thyroid_risk', name: 'Thyroid Disorder' },
        { key: 'ckd_risk', name: 'Chronic Kidney Disease' },
        { key: 'obesity_risk', name: 'Obesity' }
    ];

    dKeys.forEach(dk => {
        const val = record.results[dk.key] || 0.0;
        let riskClass = 'low';
        if (val >= 70.0) riskClass = 'high';
        else if (val >= 40.0) riskClass = 'medium';

        const row = document.createElement('div');
        row.className = 'disease-risk-item';
        row.innerHTML = `
            <div class="disease-label-row">
                <span>${dk.name}</span>
                <span class="text-${riskClass}">${val.toFixed(1)}%</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill ${riskClass}" style="width: 0%;"></div>
            </div>
        `;
        barsContainer.appendChild(row);
        
        // Trigger width transition
        setTimeout(() => {
            row.querySelector('.progress-bar-fill').style.width = `${val}%`;
        }, 100);
    });

    // 3. Explanation & Simple Toggle
    document.getElementById('toggle-simple-words').checked = false; // Reset to false
    renderExplanation(record, false);

    // 4. Action tips based on highest risk factors
    const tipsContainer = document.getElementById('res-action-tips');
    tipsContainer.innerHTML = '';

    const tipsMapping = {
        'Diabetes': [
            'Monitor blood sugar levels weekly using a glucometer.',
            'Reduce dietary sugar, processed carbs, and switch to high-fiber cereals.',
            'Include 30 minutes of brisk walking in your daily routine.'
        ],
        'Hypertension': [
            'Measure blood pressure daily; maintain records for doctor review.',
            'Strictly limit daily salt intake to under 1 teaspoon (5g).',
            'Incorporate meditation or breathing exercises to manage stress.'
        ],
        'Heart Disease': [
            'Schedule a professional cardiology clinical evaluation (ECG, Lipid Profile).',
            'Avoid highly saturated oils; cook with heart-healthy oils like mustard or sunflower.',
            'Seek immediate medical care if you experience chest pain, sweating, or left-arm numbness.'
        ],
        'Cancer': [
            'Maintain zero tobacco/smoking habits and avoid second-hand smoke.',
            'Include antioxidant-rich foods like leafy greens, fresh seasonal fruits, and turmeric.',
            'Undergo regular screening tests if family history is severe.'
        ],
        'Thyroid Disorder': [
            'Conduct a serum TSH blood test at a diagnostic lab.',
            'Ensure adequate iodized salt consumption in your meals.',
            'Monitor energy patterns, sleep duration, and sudden weight changes.'
        ],
        'Chronic Kidney Disease': [
            'Take a serum creatinine test to estimate your GFR level.',
            'Keep tight control over blood pressure and blood sugar levels (as both strain kidneys).',
            'Avoid self-medicating with over-the-counter painkillers (NSAIDs) which cause renal strain.'
        ],
        'Obesity': [
            'Aim for 150 minutes of moderate-intensity cardio workouts weekly.',
            'Practice portion control in meals; avoid sugar-sweetened beverages.',
            'Track waist measurements to manage abdominal visceral fat.'
        ]
    };

    // Gather unique tips based on top risks
    let tipsAdded = 0;
    record.topRisks.forEach(tr => {
        const diseaseTips = tipsMapping[tr] || [];
        diseaseTips.forEach(tip => {
            if (tipsAdded < 6) {
                const li = document.createElement('li');
                li.textContent = tip;
                tipsContainer.appendChild(li);
                tipsAdded++;
            }
        });
    });

    // Default general tips if empty
    if (tipsAdded === 0) {
        const defaults = [
            'Follow a well-balanced seasonal diet with adequate hydration.',
            'Engage in light physical exercise or walking daily.',
            'Participate in periodic health screenings under the AB-PMJAY scheme.'
        ];
        defaults.forEach(t => {
            const li = document.createElement('li');
            li.textContent = t;
            tipsContainer.appendChild(li);
        });
    }

    // 5. Facility Referral
    const facilityName = document.getElementById('res-facility-name');
    const facilityAddress = document.getElementById('res-facility-address');
    const nextAction = document.getElementById('res-next-action');

    const mappedCHC = facilityMapping[record.district];
    if (mappedCHC) {
        facilityName.innerHTML = `<i class="fa-solid fa-hospital"></i> ${mappedCHC}`;
        facilityAddress.textContent = `Ayushman Bharat empanelled specialty hospital in ${record.district}, ${record.state}`;
    } else {
        facilityName.innerHTML = `<i class="fa-solid fa-hospital"></i> ${record.district} District Headquarters Hospital`;
        facilityAddress.textContent = `Government General empanelled PMJAY facility, ${record.state}`;
    }

    if (record.overallRisk === 'High') {
        nextAction.innerHTML = `<strong>URGENT Action:</strong> Visit the outpatient department (OPD) at the facility listed above within <strong>2-3 days</strong> for expert clinical consultation.`;
        nextAction.style.color = 'var(--red)';
    } else if (record.overallRisk === 'Medium') {
        nextAction.innerHTML = `<strong>Recommended Action:</strong> Visit your nearest Community Health Centre (CHC) within <strong>7-10 days</strong> to review vitals and schedule screenings.`;
        nextAction.style.color = 'var(--yellow)';
    } else {
        nextAction.innerHTML = `<strong>Routine Action:</strong> Continue maintaining healthy lifestyle habits and undergo routine health checkups annually.`;
        nextAction.style.color = 'var(--green)';
    }
}

function toggleExplanationMode() {
    const isSimple = document.getElementById('toggle-simple-words').checked;
    const patients = JSON.parse(localStorage.getItem('patients')) || [];
    const record = patients.find(p => p.id === currentAssessmentId);
    if (record) {
        renderExplanation(record, isSimple);
    }
}

function renderExplanation(record, simpleMode) {
    const textEl = document.getElementById('res-explanation-text');
    
    // Clinical / Professional narrative
    const clinicalText = `
        A comprehensive review of the patient's hereditary profile indicates a <strong>${record.overallRisk}</strong> risk level. 
        Genetic pedigree analysis shows family history linkages to <strong>${record.topRisks.join(' and ')}</strong>. 
        Basic vitals record a blood pressure of ${record.vitals.systolic}/${record.vitals.diastolic} mmHg and fasting glycemic levels of ${record.vitals.fbs} mg/dL, 
        indicating potential vascular resistance and glycemic instability. Obesity analysis shows a body mass index of ${record.vitals.bmi}. 
        We recommend a targeted diagnostic protocol including HbA1c screening, renal filtration panels, and lipid profiles to monitor secondary risk parameters.
    `;

    // Simple plain English translation
    const simpleText = `
        Your health checkup results show a <strong>${record.overallRisk}</strong> chance of health issues. 
        Because some of your close blood relatives have had <strong>${record.topRisks.join(' and ')}</strong>, you also carry genes that make you more vulnerable to them. 
        Your blood pressure is ${record.vitals.systolic}/${record.vitals.diastolic} and your fasting sugar is ${record.vitals.fbs} mg/dL. 
        These numbers mean you need to watch out for blood sugar spikes and extra strain on your heart and blood vessels. 
        Your weight ratio (BMI) is ${record.vitals.bmi}. 
        It is highly recommended that you take a simple lab test for average blood sugar (HbA1c) and consult a doctor at the hospital for checkups.
    `;

    textEl.innerHTML = simpleMode ? simpleText : clinicalText;
}

// 12. REPORT EXPORTS (PDF & WHATSAPP)
function printAssessment() {
    window.print();
}

function downloadPDF() {
    const patients = JSON.parse(localStorage.getItem('patients')) || [];
    const record = patients.find(p => p.id === currentAssessmentId);
    
    if (!record) {
        alert("No record selected for PDF generation.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Set Styles & Background
    doc.setFillColor(248, 252, 251); // var(--bg-main)
    doc.rect(0, 0, 210, 297, 'F');

    // Header Banner
    doc.setFillColor(29, 158, 117); // var(--primary)
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("FAMILY HEALTH RISK ASSESSMENT REPORT", 15, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)", 15, 25);

    // Patient Info Panel
    doc.setFillColor(255, 255, 255);
    doc.setStrokeColor(226, 232, 240);
    doc.roundedRect(15, 45, 180, 45, 3, 3, 'FD');

    doc.setTextColor(26, 32, 44);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PATIENT DEMOGRAPHICS", 20, 53);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Patient Name: ${record.name}`, 20, 62);
    doc.text(`Age / Gender: ${record.age} Yrs / ${record.gender === 1 ? 'Male' : 'Female'}`, 20, 70);
    doc.text(`Date of Assessment: ${new Date(record.date).toLocaleDateString()}`, 20, 78);

    doc.text(`Location: ${record.district}, ${record.state}`, 110, 62);
    doc.text(`Assessed By: ${record.createdBy} (${record.roleCreated.toUpperCase()})`, 110, 70);
    
    // Overall Risk Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(120, 100, 75, 22, 2, 2, 'FD');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("OVERALL GENETIC RISK LEVEL:", 123, 107);
    
    let rColor = [56, 161, 105]; // Green
    if (record.overallRisk === 'High') rColor = [229, 62, 62]; // Red
    else if (record.overallRisk === 'Medium') rColor = [221, 107, 32]; // Yellow
    
    doc.setTextColor(rColor[0], rColor[1], rColor[2]);
    doc.setFontSize(14);
    doc.text(record.overallRisk.toUpperCase(), 123, 117);

    // Disease Probabilities Table
    doc.setTextColor(26, 32, 44);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DISEASE RISK SCORES", 15, 105);

    // Table Lines
    doc.setLineWidth(0.2);
    doc.line(15, 128, 195, 128); // Header line
    
    doc.setFontSize(9);
    doc.text("Disease / Condition", 20, 133);
    doc.text("Probability Score", 80, 133);
    doc.text("Risk Status", 140, 133);
    doc.line(15, 136, 195, 136);

    const dNames = [
        { k: 'diabetes_risk', n: 'Diabetes Mellitus' },
        { k: 'hypertension_risk', n: 'Hypertension (High BP)' },
        { k: 'heart_risk', n: 'Cardiovascular / Heart Disease' },
        { k: 'cancer_risk', n: 'Cancer (Oncology History)' },
        { k: 'thyroid_risk', n: 'Thyroid Disorder' },
        { k: 'ckd_risk', n: 'Chronic Kidney Disease (CKD)' },
        { k: 'obesity_risk', n: 'Obesity / BMI Excess' }
    ];

    let y = 142;
    doc.setFont("helvetica", "normal");
    dNames.forEach(dn => {
        const val = record.results[dn.k];
        let rStat = 'Low';
        if (val >= 70) rStat = 'High';
        else if (val >= 40) rStat = 'Medium';

        doc.text(dn.n, 20, y);
        doc.text(`${val.toFixed(1)}%`, 80, y);
        doc.text(rStat, 140, y);
        
        doc.line(15, y + 3, 195, y + 3);
        y += 8;
    });

    // Medical Explanation
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("CLINICAL INTERPRETATION:", 15, y);
    doc.setFont("helvetica", "normal");
    
    // Split clinical narrative
    const simpleText = `Your screening reports a ${record.overallRisk} risk. Closer relatives have history of ${record.topRisks.join(' & ')}. BP is ${record.vitals.systolic}/${record.vitals.diastolic} mmHg and blood sugar is ${record.vitals.fbs} mg/dL. Monitor these values to avoid complications.`;
    const lines = doc.splitTextToSize(simpleText, 180);
    doc.text(lines, 15, y + 6);

    // Recommended actions
    y += 24;
    doc.setFont("helvetica", "bold");
    doc.text("RECOMMENDED PMJAY FACILITY REFERRAL:", 15, y);
    doc.setFont("helvetica", "normal");
    
    const CHC = facilityMapping[record.district] || `${record.district} District General Hospital`;
    doc.text(`Hospital: ${CHC}`, 15, y + 6);
    doc.text(`Action: Please carry your PMJAY e-Card and consult the doctor within 7 days.`, 15, y + 12);

    // Footer Disclaimer
    doc.setFontSize(7);
    doc.setTextColor(113, 128, 150);
    doc.text("DISCLAIMER: This is a screen report generated by Family Health Risk Predictor helper and does not serve as medical prescription.", 15, 280);

    doc.save(`PMJAY_Health_Report_${record.name.replace(/\s+/g, '_')}.pdf`);
}

function shareWhatsApp() {
    const patients = JSON.parse(localStorage.getItem('patients')) || [];
    const record = patients.find(p => p.id === currentAssessmentId);

    if (!record) {
        alert("No assessment record selected.");
        return;
    }

    const patientName = record.name;
    const overallRisk = record.overallRisk;
    const topRisks = record.topRisks.join(', ');

    // Template content
    const msg = `*Ayushman Bharat PM-JAY - Family Health Risk Predictor Report*\n\n*Patient:* ${patientName}\n*Overall Risk:* ${overallRisk}\n*Top Health Risks:* ${topRisks}\n\n_Assessment done via Family Health Risk Predictor — AB-PMJAY._`;
    const encoded = encodeURIComponent(msg);
    
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
}

// 13. BACKEND API SYNC / HEALTH LOOKUPS
function checkBackendStatus() {
    fetch('http://127.0.0.1:5000/health')
    .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
    })
    .then(data => {
        // Set loaded models
        DISEASES.forEach(d => {
            if (data.models_loaded && data.models_loaded.includes(d.id)) {
                modelStatus[d.id] = true;
            } else {
                modelStatus[d.id] = false;
            }
        });
        
        // Refresh admin dashboard status if visible
        if (window.location.hash === '#admin-dashboard') {
            renderModelStatusPanel();
        }
    })
    .catch(() => {
        // Backend offline, set all to fallback
        DISEASES.forEach(d => {
            modelStatus[d.id] = false;
        });
        if (window.location.hash === '#admin-dashboard') {
            renderModelStatusPanel();
        }
    });
}

function syncWithBackend() {
    checkBackendStatus();
    alert("Triggered backend ML model status synchronization!");
}
