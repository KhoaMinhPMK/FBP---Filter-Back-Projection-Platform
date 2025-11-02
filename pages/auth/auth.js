// ===== Utilities =====
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ===== Dynamic Header =====
function initDynamicHeader() {
  const header = $('#header');
  if (!header) return;

  const toggleScrolled = () => {
    if (window.pageYOffset > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', toggleScrolled);
  toggleScrolled();
}

// ===== Mobile Menu =====
function initMobileMenu() {
  const menuToggle = $('#menuToggle');
  const headerNav = $('#mainNav');

  if (!menuToggle || !headerNav) return;

  menuToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    menuToggle.classList.toggle('active');
    headerNav.classList.toggle('mobile-open');
    document.body.classList.toggle('menu-open');
  });

  document.addEventListener('click', (event) => {
    if (!headerNav.contains(event.target) && !menuToggle.contains(event.target)) {
      menuToggle.classList.remove('active');
      headerNav.classList.remove('mobile-open');
      document.body.classList.remove('menu-open');
    }
  });

  $$('.header-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      headerNav.classList.remove('mobile-open');
      document.body.classList.remove('menu-open');
    });
  });
}

// ===== Auth Form Toggle =====
function setActiveForm(target, { updateHash = true } = {}) {
  const forms = $$('.auth-form');
  const tabs = $$('.auth-tab');
  const headerLogin = $('.header-actions .btn-login');
  const headerRegister = $('.header-actions .btn-register');

  const normalizedTarget = target === 'register' ? 'register' : 'login';

  forms.forEach((form) => {
    form.classList.toggle('active', form.dataset.form === normalizedTarget);
  });

  tabs.forEach((tab) => {
    const isActive = tab.dataset.target === normalizedTarget;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  if (headerLogin && headerRegister) {
    headerLogin.classList.toggle('active', normalizedTarget === 'login');
    headerRegister.classList.toggle('active', normalizedTarget === 'register');
  }

  if (updateHash) {
    const hash = normalizedTarget === 'register' ? '#register' : '#login';
    if (window.location.hash !== hash) {
      history.replaceState(null, '', hash);
    }
  }
}

function initTabs() {
  $$('.auth-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target || 'login';
      setActiveForm(target);
    });
  });
}

function initHeaderActions() {
  const loginButton = $('.header-actions .btn-login');
  const registerButton = $('.header-actions .btn-register');

  if (loginButton) {
    loginButton.addEventListener('click', (event) => {
      event.preventDefault();
      setActiveForm('login');
    });
  }

  if (registerButton) {
    registerButton.addEventListener('click', (event) => {
      event.preventDefault();
      setActiveForm('register');
    });
  }
}

function initSwitchLinks() {
  $$('.switch-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const hash = link.getAttribute('href') || '#login';
      const target = hash.replace('#', '');
      setActiveForm(target);
    });
  });
}

function resolveInitialForm() {
  const hash = window.location.hash.toLowerCase();
  if (hash === '#register') {
    return 'register';
  }
  return 'login';
}

function initHashWatcher() {
  window.addEventListener('hashchange', () => {
    const target = resolveInitialForm();
    setActiveForm(target, { updateHash: false });
  });
}

function initForms() {
  $$('.auth-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      alert('Tính năng xác thực sẽ được tích hợp ở phiên bản tiếp theo.');
    });
  });
}

function init() {
  initDynamicHeader();
  initMobileMenu();
  initTabs();
  initHeaderActions();
  initSwitchLinks();
  initHashWatcher();
  initForms();
  setActiveForm(resolveInitialForm());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
