// Theory Page JavaScript
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ============================================
// INITIALIZATION
// ============================================
function init() {
  initDynamicHeader();
  initMobileMenu();
  initSmoothScroll();
  initTableOfContents();
  initAuthButtons();
  
  console.log('✅ Theory page initialized');
}

// Dynamic Header
function initDynamicHeader() {
  const header = $('#header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// Mobile Menu
function initMobileMenu() {
  const menuToggle = $('#menuToggle');
  const headerNav = $('#mainNav');
  
  if (!menuToggle || !headerNav) return;

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    headerNav.classList.toggle('mobile-open');
  });

  document.addEventListener('click', (e) => {
    if (!headerNav.contains(e.target) && !menuToggle.contains(e.target)) {
      menuToggle.classList.remove('active');
      headerNav.classList.remove('mobile-open');
    }
  });
}

// Smooth Scroll
function initSmoothScroll() {
  const links = $$('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetElement = $(targetId);
      
      if (targetElement) {
        const headerOffset = 100;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// Table of Contents - Active Link on Scroll
function initTableOfContents() {
  const tocLinks = $$('.toc-link');
  const sections = $$('.content-card[id]');
  
  if (tocLinks.length === 0 || sections.length === 0) return;

  window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      
      if (window.pageYOffset >= sectionTop - 200) {
        current = section.getAttribute('id');
      }
    });

    tocLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

// Auth Buttons
function initAuthButtons() {
  const loginBtn = $('.btn-login');
  const registerBtn = $('.btn-register');
  
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      // Can add custom behavior here
    });
  }
  
  if (registerBtn) {
    registerBtn.addEventListener('click', (e) => {
      // Can add custom behavior here
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
