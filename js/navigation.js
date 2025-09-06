// Mobile-first navigation component for FEIM
(function() {
  'use strict';

  // Navigation configuration
  const NAV_ITEMS = [
    { href: 'index.html', text: 'Home' },
    { href: 'progression.html', text: 'Progression' },
    { href: 'combat_rules.html', text: 'Combat' },
    { href: 'general_rules.html', text: 'Rules' },
    { href: 'lists.html', text: 'Lists' },
    { href: 'character_sheet.html', text: 'Sheet' },
    { href: 'dungeon_master.html', text: 'Dungeon Master' },
    { href: 'settings.html', text: 'Settings' }
  ];

  // Create and inject navigation HTML
  function createNavigation() {
    const nav = document.createElement('nav');
    nav.className = 'feim-nav';
    
    // Mobile menu button
    const menuBtn = document.createElement('button');
    menuBtn.className = 'nav-toggle';
    menuBtn.setAttribute('aria-label', 'Toggle navigation menu');
    menuBtn.innerHTML = '<span></span><span></span><span></span>';
    
    // Navigation list
    const navList = document.createElement('ul');
    navList.className = 'nav-list';
    
    NAV_ITEMS.forEach(item => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.text;
      
      // Highlight current page
      if (window.location.pathname.endsWith(item.href) || 
          (item.href === 'index.html' && window.location.pathname === '/')) {
        a.classList.add('active');
      }
      
      li.appendChild(a);
      navList.appendChild(li);
    });
    
    nav.appendChild(menuBtn);
    nav.appendChild(navList);
    
    return nav;
  }

  // Toggle mobile menu
  function toggleMenu() {
    const nav = document.querySelector('.feim-nav');
    const navList = nav.querySelector('.nav-list');
    const menuBtn = nav.querySelector('.nav-toggle');
    
    navList.classList.toggle('open');
    menuBtn.classList.toggle('open');
    
    // Handle accessibility
    const isOpen = navList.classList.contains('open');
    menuBtn.setAttribute('aria-expanded', isOpen);
  }

  // Close menu when clicking outside
  function handleOutsideClick(event) {
    const nav = document.querySelector('.feim-nav');
    const navList = nav.querySelector('.nav-list');
    
    if (!nav.contains(event.target) && navList.classList.contains('open')) {
      toggleMenu();
    }
  }

  // Initialize navigation
  function initNavigation() {
    // Find existing nav or body
    const existingNav = document.querySelector('nav');
    const navigation = createNavigation();
    
    if (existingNav) {
      existingNav.parentNode.replaceChild(navigation, existingNav);
    } else {
      // Insert after body's first child or at the beginning
      const body = document.body;
      if (body.firstChild) {
        body.insertBefore(navigation, body.firstChild);
      } else {
        body.appendChild(navigation);
      }
    }

    // Attach event listeners
    const menuBtn = navigation.querySelector('.nav-toggle');
    menuBtn.addEventListener('click', toggleMenu);
    
    // Close menu on outside click
    document.addEventListener('click', handleOutsideClick);
    
    // Close menu on escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        const navList = navigation.querySelector('.nav-list');
        if (navList.classList.contains('open')) {
          toggleMenu();
        }
      }
    });

    // Close menu when navigating to a new page
    navigation.addEventListener('click', function(event) {
      if (event.target.tagName === 'A') {
        const navList = navigation.querySelector('.nav-list');
        if (navList.classList.contains('open')) {
          toggleMenu();
        }
      }
    });
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }
})();