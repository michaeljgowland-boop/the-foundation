// The Foundation — main.js

// Scroll reveal
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

reveals.forEach(el => observer.observe(el));

// Stagger children within groups
document.querySelectorAll('.three-columns, .mission-pillars, .warning-grid').forEach(group => {
  group.querySelectorAll('.col-item, .pillar, .warning-item').forEach((child, i) => {
    child.style.transitionDelay = `${i * 0.1}s`;
  });
});

// Nav scroll behaviour
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });
}

// Auth state
let currentUser = null;

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    currentUser = data.authenticated ? data : null;
    updateNavAuth();
  } catch (e) {
    currentUser = null;
  }
}

function updateNavAuth() {
  const authEl = document.getElementById('nav-auth');
  if (!authEl) return;
  if (currentUser) {
    authEl.innerHTML = `
      <span class="nav-username">${currentUser.display_name}</span>
      <button class="nav-signin" id="logout-btn">Sign out</button>
    `;
    document.getElementById('logout-btn')?.addEventListener('click', logout);
  } else {
    authEl.innerHTML = `
      <button class="nav-signin" id="signin-btn">Sign in</button>
      <a href="/join.html" class="nav-join">Join</a>
    `;
    document.getElementById('signin-btn')?.addEventListener('click', () => openModal('login'));
  }
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  updateNavAuth();
  window.location.reload();
}

// Auth modal
const modal = document.getElementById('auth-modal');
const modalLogin = document.getElementById('modal-login');
const modalRegister = document.getElementById('modal-register');

function openModal(view = 'login') {
  if (!modal) return;
  modal.classList.remove('hidden');
  modalLogin.classList.toggle('hidden', view !== 'login');
  modalRegister.classList.toggle('hidden', view !== 'register');
}

function closeModal() {
  modal?.classList.add('hidden');
}

document.getElementById('modal-close')?.addEventListener('click', closeModal);
document.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);
document.getElementById('show-register')?.addEventListener('click', () => openModal('register'));
document.getElementById('show-login')?.addEventListener('click', () => openModal('login'));

document.getElementById('login-submit')?.addEventListener('click', async () => {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (res.ok) {
    currentUser = { authenticated: true, display_name: data.display_name, is_admin: data.is_admin };
    updateNavAuth();
    closeModal();
    window.location.reload();
  } else {
    errEl.textContent = data.error;
    errEl.classList.remove('hidden');
  }
});

document.getElementById('register-submit')?.addEventListener('click', async () => {
  const display_name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const errEl = document.getElementById('register-error');

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ display_name, email, password })
  });

  const data = await res.json();
  if (res.ok) {
    currentUser = { authenticated: true, display_name: data.display_name };
    updateNavAuth();
    closeModal();
    window.location.reload();
  } else {
    errEl.textContent = data.error;
    errEl.classList.remove('hidden');
  }
});

// Expose for use in page scripts
window.foundationAuth = { getCurrentUser: () => currentUser, openModal };

checkAuth();
