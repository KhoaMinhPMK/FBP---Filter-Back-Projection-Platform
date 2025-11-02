// ===== Utility Functions =====
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ===== Dynamic Header Scroll Effect =====
function initDynamicHeader() {
  const header = $('#header');
  if (!header) return;

  let lastScroll = 0;
  const scrollThreshold = 100;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > scrollThreshold) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  });
}

// ===== Smooth Scroll Navigation =====
function initSmoothScroll() {
  const navLinks = Array.from($$('.nav-link'));
  const anchorLinks = navLinks.filter(link => {
    const href = link.getAttribute('href');
    return href && href.startsWith('#');
  });

  if (anchorLinks.length === 0) return;
  
  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      
      // Check if it's an internal anchor link
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const target = document.getElementById(targetId);
        
        if (target) {
          // Update active state
          anchorLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');

          // Smooth scroll to target
          const headerOffset = 120;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Close mobile menu if open
          const headerNav = $('#mainNav');
          const menuToggle = $('#menuToggle');
          if (headerNav && menuToggle) {
            menuToggle.classList.remove('active');
            headerNav.classList.remove('mobile-open');
          }
        }
      }
    });
  });
}

// ===== Active Nav on Scroll =====
function initScrollSpy() {
  const sections = $$('section[id]');
  const navLinks = $$('.nav-link');
  const anchorLinks = Array.from(navLinks).filter(link => {
    const href = link.getAttribute('href');
    return href && href.startsWith('#');
  });

  if (sections.length === 0 || anchorLinks.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '-50% 0px -50% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        
        anchorLinks.forEach(link => {
          const linkHref = link.getAttribute('href');
          link.classList.remove('active');
          if (linkHref === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

// ===== Mobile Menu Toggle =====
function initMobileMenu() {
  const menuToggle = $('#menuToggle');
  const headerNav = $('#mainNav');
  
  if (!menuToggle || !headerNav) return;

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    headerNav.classList.toggle('mobile-open');
    document.body.classList.toggle('menu-open');
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!headerNav.contains(e.target) && !menuToggle.contains(e.target)) {
      menuToggle.classList.remove('active');
      headerNav.classList.remove('mobile-open');
      document.body.classList.remove('menu-open');
    }
  });
}

// ===== Scroll Reveal Animation =====
function initScrollReveal() {
  const revealElements = $$('.step-card, .theory-card, .feature-card, .about-card, .highlight-item');
  
  if (revealElements.length === 0) return;

  const revealOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 50);
        revealObserver.unobserve(entry.target);
      }
    });
  }, revealOptions);

  revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    revealObserver.observe(el);
  });
}

// ===== Counter Animation =====
function initCounterAnimation() {
  const statNumbers = $$('.stat-content h3');
  
  if (statNumbers.length === 0) return;

  const animateCounter = (element) => {
    const target = element.textContent;
    const isPercentage = target.includes('%');
    const isPlus = target.includes('+');
    const numericValue = parseInt(target.replace(/[^0-9]/g, ''));
    
    if (isNaN(numericValue)) return;

    let current = 0;
    const increment = numericValue / 50;
    const duration = 2000;
    const stepTime = duration / 50;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        current = numericValue;
        clearInterval(timer);
      }
      
      let displayValue = Math.floor(current);
      if (isPercentage) displayValue += '%';
      if (isPlus) displayValue += '+';
      
      element.textContent = displayValue;
    }, stepTime);
  };

  const counterOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, counterOptions);

  statNumbers.forEach(stat => counterObserver.observe(stat));
}

// ===== Auth Button Handlers =====
function initAuthButtons() {
  const loginBtn = $('.btn-login');
  const registerBtn = $('.btn-register');
  const loginUrl = '../auth/index.html#login';
  const registerUrl = '../auth/index.html#register';

  if (loginBtn) {
    if (loginBtn.tagName.toLowerCase() === 'a') {
      loginBtn.setAttribute('href', loginUrl);
    } else {
      loginBtn.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = loginUrl;
      });
    }
  }

  if (registerBtn) {
    if (registerBtn.tagName.toLowerCase() === 'a') {
      registerBtn.setAttribute('href', registerUrl);
    } else {
      registerBtn.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = registerUrl;
      });
    }
  }
}

// ===== Parallax Effect =====
function initParallax() {
  const heroSection = $('.hero-section');
  if (!heroSection) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroPattern = $('.hero-pattern');
    
    if (heroPattern && scrolled < window.innerHeight) {
      heroPattern.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
  });
}

// ===== Initialize All Functions =====
function init() {
  // Initialize all features
  initDynamicHeader();
  initSmoothScroll();
  initScrollSpy();
  initMobileMenu();
  initScrollReveal();
  initCounterAnimation();
  initAuthButtons();
  initParallax();

  // Add loaded class for animations
  setTimeout(() => {
    document.body.classList.add('loaded');
  }, 100);
}

// ===== Run on DOM Load =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ===== Handle Page Visibility =====
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('Page is hidden');
  } else {
    console.log('Page is visible');
  }
});
