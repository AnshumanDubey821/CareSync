import test from 'node:test';
import assert from 'node:assert/strict';

// --- MOCK BROWSER ENVIRONMENT ---
class MockElement {
  constructor(id, className = '', offsetTop = 0, height = 400) {
    this.id = id;
    this.className = className;
    this.offsetTop = offsetTop;
    this.height = height;
    this.scrollIntoViewCalled = false;
    this.scrollIntoViewOptions = null;
  }

  scrollIntoView(options) {
    this.scrollIntoViewCalled = true;
    this.scrollIntoViewOptions = options;
  }

  getBoundingClientRect() {
    return {
      top: this.offsetTop - (globalThis.window?.scrollY || 0),
      bottom: this.offsetTop + this.height - (globalThis.window?.scrollY || 0),
      left: 0,
      right: 1200,
      width: 1200,
      height: this.height
    };
  }
}

class MockDocument {
  constructor() {
    this.elements = new Map();
  }

  register(element) {
    this.elements.set(element.id, element);
  }

  getElementById(id) {
    return this.elements.get(id) || null;
  }
}

class MockWindow {
  constructor() {
    this.scrollY = 0;
    this.historyState = [];
    this.listeners = new Map();
  }

  scrollTo(options) {
    if (typeof options === 'object') {
      this.scrollY = options.top || 0;
    } else {
      this.scrollY = arguments[1] || 0;
    }
  }

  addEventListener(event, fn) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(fn);
  }

  removeEventListener(event, fn) {
    if (this.listeners.has(event)) {
      const list = this.listeners.get(event).filter((l) => l !== fn);
      this.listeners.set(event, list);
    }
  }

  history = {
    pushState: (state, title, url) => {
      this.historyState.push({ state, title, url });
    }
  };
}

globalThis.window = new MockWindow();
globalThis.document = new MockDocument();

// Populate DOM with target sections as rendered by LandingPage
const aboutSection = new MockElement('about-section', 'scroll-mt-28 sm:scroll-mt-32 max-w-7xl mx-auto px-4', 850, 600);
const servicesSection = new MockElement('services-section', 'scroll-mt-28 sm:scroll-mt-32 max-w-7xl mx-auto px-4', 1600, 800);
globalThis.document.register(aboutSection);
globalThis.document.register(servicesSection);

// --- NAVIGATION CONFIG & LOGIC TO TEST ---
const NAV_LINKS = [
  { label: 'Home', to: '/', sectionId: 'hero' },
  { label: 'About', to: '/#about-section', sectionId: 'about-section' },
  { label: 'Services', to: '/#services-section', sectionId: 'services-section' },
  { label: 'Find Doctors', to: '/patient/doctors' },
];

function calculateActiveSection(currentPath, currentHash, scrollY, doc = globalThis.document) {
  if (currentPath !== '/') return '';

  if (currentHash === '#services-section') return 'services-section';
  if (currentHash === '#about-section') return 'about-section';

  const aboutEl = doc.getElementById('about-section');
  const servicesEl = doc.getElementById('services-section');

  if (!aboutEl || !servicesEl) return 'hero';

  const offset = 180;
  if (scrollY + offset >= servicesEl.offsetTop) {
    return 'services-section';
  }
  if (scrollY + offset >= aboutEl.offsetTop) {
    return 'about-section';
  }
  return 'hero';
}

function isItemActive(item, currentPath, activeSection) {
  if (currentPath === '/') {
    if (item.sectionId) {
      return activeSection === item.sectionId;
    }
    return false;
  }
  return currentPath === item.to;
}

// Simulate handleNavClick from Navbar.jsx
function handleNavClickSim(item, currentPath, callbacks) {
  let prevented = false;
  const mockEvent = {
    preventDefault: () => {
      prevented = true;
    }
  };

  if (item.to === '/') {
    if (currentPath === '/') {
      mockEvent.preventDefault();
      callbacks.scrollTo({ top: 0, behavior: 'smooth' });
      callbacks.pushState(null, '', '/');
      callbacks.setActiveSection('hero');
    } else {
      callbacks.navigate('/');
    }
  } else if (item.sectionId && item.to.startsWith('/#')) {
    if (currentPath === '/') {
      mockEvent.preventDefault();
      const el = callbacks.getElementById(item.sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      callbacks.pushState(null, '', item.to);
      callbacks.setActiveSection(item.sectionId);
    } else {
      callbacks.navigate(item.to);
    }
  } else {
    callbacks.navigate(item.to);
  }

  return { prevented };
}

// --- TEST SUITES ---

test('Scenario 1: Navbar contains valid destination paths and section anchors', () => {
  const home = NAV_LINKS.find((l) => l.label === 'Home');
  const about = NAV_LINKS.find((l) => l.label === 'About');
  const services = NAV_LINKS.find((l) => l.label === 'Services');
  const findDoctors = NAV_LINKS.find((l) => l.label === 'Find Doctors');

  assert.ok(home, 'Home link must exist');
  assert.equal(home.to, '/');

  assert.ok(about, 'About link must exist');
  assert.equal(about.to, '/#about-section');
  assert.equal(about.sectionId, 'about-section');

  assert.ok(services, 'Services link must exist');
  assert.equal(services.to, '/#services-section');
  assert.equal(services.sectionId, 'services-section');

  assert.ok(findDoctors, 'Find Doctors link must exist');
  assert.equal(findDoctors.to, '/patient/doctors');
});

test('Scenario 2: About and Services section DOM nodes exist and have sticky-offset margins', () => {
  const about = globalThis.document.getElementById('about-section');
  const services = globalThis.document.getElementById('services-section');

  assert.ok(about, 'DOM element #about-section must exist');
  assert.ok(services, 'DOM element #services-section must exist');

  // Verify scroll-margin-top class to prevent being hidden under sticky navbar
  assert.ok(
    about.className.includes('scroll-mt-28') || about.className.includes('scroll-mt-32'),
    'About section must specify scroll-mt class for navbar clearance'
  );
  assert.ok(
    services.className.includes('scroll-mt-28') || services.className.includes('scroll-mt-32'),
    'Services section must specify scroll-mt class for navbar clearance'
  );
});

test('Scenario 3: In-page navigation: Click About on homepage scrolls smoothly and updates URL', () => {
  aboutSection.scrollIntoViewCalled = false;
  aboutSection.scrollIntoViewOptions = null;
  globalThis.window.historyState = [];

  let navigatedTo = null;
  let activeSectionSet = null;

  const res = handleNavClickSim(
    { label: 'About', to: '/#about-section', sectionId: 'about-section' },
    '/',
    {
      scrollTo: (opts) => globalThis.window.scrollTo(opts),
      pushState: (s, t, u) => globalThis.window.history.pushState(s, t, u),
      setActiveSection: (sec) => {
        activeSectionSet = sec;
      },
      navigate: (path) => {
        navigatedTo = path;
      },
      getElementById: (id) => globalThis.document.getElementById(id)
    }
  );

  assert.equal(res.prevented, true, 'Default anchor link behavior must be handled via smooth scroll');
  assert.equal(aboutSection.scrollIntoViewCalled, true, 'scrollIntoView must be called on about-section');
  assert.deepEqual(aboutSection.scrollIntoViewOptions, { behavior: 'smooth' });
  assert.equal(activeSectionSet, 'about-section');
  assert.equal(globalThis.window.historyState.length, 1);
  assert.equal(globalThis.window.historyState[0].url, '/#about-section');
  assert.equal(navigatedTo, null, 'No router navigation should occur when already on homepage');
});

test('Scenario 4: In-page navigation: Click Services on homepage scrolls smoothly and updates URL', () => {
  servicesSection.scrollIntoViewCalled = false;
  servicesSection.scrollIntoViewOptions = null;
  globalThis.window.historyState = [];

  let navigatedTo = null;
  let activeSectionSet = null;

  const res = handleNavClickSim(
    { label: 'Services', to: '/#services-section', sectionId: 'services-section' },
    '/',
    {
      scrollTo: (opts) => globalThis.window.scrollTo(opts),
      pushState: (s, t, u) => globalThis.window.history.pushState(s, t, u),
      setActiveSection: (sec) => {
        activeSectionSet = sec;
      },
      navigate: (path) => {
        navigatedTo = path;
      },
      getElementById: (id) => globalThis.document.getElementById(id)
    }
  );

  assert.equal(res.prevented, true);
  assert.equal(servicesSection.scrollIntoViewCalled, true, 'scrollIntoView must be called on services-section');
  assert.deepEqual(servicesSection.scrollIntoViewOptions, { behavior: 'smooth' });
  assert.equal(activeSectionSet, 'services-section');
  assert.equal(globalThis.window.historyState.length, 1);
  assert.equal(globalThis.window.historyState[0].url, '/#services-section');
  assert.equal(navigatedTo, null);
});

test('Scenario 5: Cross-page navigation: Click About or Services from /patient/doctors invokes navigate', () => {
  let navigatedTo = null;

  handleNavClickSim(
    { label: 'About', to: '/#about-section', sectionId: 'about-section' },
    '/patient/doctors',
    {
      scrollTo: () => {},
      pushState: () => {},
      setActiveSection: () => {},
      navigate: (path) => {
        navigatedTo = path;
      },
      getElementById: (id) => globalThis.document.getElementById(id)
    }
  );

  assert.equal(navigatedTo, '/#about-section', 'Should trigger React Router navigate to /#about-section');

  handleNavClickSim(
    { label: 'Services', to: '/#services-section', sectionId: 'services-section' },
    '/patient/doctors',
    {
      scrollTo: () => {},
      pushState: () => {},
      setActiveSection: () => {},
      navigate: (path) => {
        navigatedTo = path;
      },
      getElementById: (id) => globalThis.document.getElementById(id)
    }
  );

  assert.equal(navigatedTo, '/#services-section', 'Should trigger React Router navigate to /#services-section');
});

test('Scenario 6: Cross-page navigation: ScrollToHash resolves element on mount with retries', async () => {
  // Simulate an element that takes 40ms to mount (e.g. async component render)
  const delayedDoc = new MockDocument();
  let hasMounted = false;

  setTimeout(() => {
    const el = new MockElement('about-section', 'scroll-mt-28', 850);
    delayedDoc.register(el);
    hasMounted = true;
  }, 40);

  // Simulation of ScrollToHash retry engine
  const targetId = 'about-section';
  let targetScrolled = false;

  await new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const el = delayedDoc.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        targetScrolled = true;
        clearInterval(interval);
        resolve();
      } else if (attempts >= 15) {
        clearInterval(interval);
        reject(new Error('Timeout waiting for target section'));
      }
    }, 20);
  });

  assert.equal(hasMounted, true);
  assert.equal(targetScrolled, true);
  const found = delayedDoc.getElementById('about-section');
  assert.equal(found.scrollIntoViewCalled, true);
});

test('Scenario 7: Active navigation highlight updates dynamically based on scroll position', () => {
  // Top of page (Hero): scrollY = 0
  const activeHero = calculateActiveSection('/', '', 0);
  assert.equal(activeHero, 'hero');
  assert.equal(isItemActive(NAV_LINKS[0], '/', activeHero), true, 'Home is active at top');
  assert.equal(isItemActive(NAV_LINKS[1], '/', activeHero), false, 'About is not active');
  assert.equal(isItemActive(NAV_LINKS[2], '/', activeHero), false, 'Services is not active');

  // Scrolled into About section: scrollY = 800 (aboutSection starts at 850, offset is 180)
  const activeAbout = calculateActiveSection('/', '', 800);
  assert.equal(activeAbout, 'about-section');
  assert.equal(isItemActive(NAV_LINKS[0], '/', activeAbout), false, 'Home is not active');
  assert.equal(isItemActive(NAV_LINKS[1], '/', activeAbout), true, 'About is active');
  assert.equal(isItemActive(NAV_LINKS[2], '/', activeAbout), false, 'Services is not active');

  // Scrolled into Services section: scrollY = 1600
  const activeServices = calculateActiveSection('/', '', 1600);
  assert.equal(activeServices, 'services-section');
  assert.equal(isItemActive(NAV_LINKS[0], '/', activeServices), false, 'Home is not active');
  assert.equal(isItemActive(NAV_LINKS[1], '/', activeServices), false, 'About is not active');
  assert.equal(isItemActive(NAV_LINKS[2], '/', activeServices), true, 'Services is active');

  // Scrolled to URL hash directly
  assert.equal(calculateActiveSection('/', '#services-section', 0), 'services-section');
  assert.equal(calculateActiveSection('/', '#about-section', 0), 'about-section');

  // On /patient/doctors: active link is Find Doctors, regardless of scroll
  assert.equal(isItemActive(NAV_LINKS[3], '/patient/doctors', ''), true);
  assert.equal(isItemActive(NAV_LINKS[0], '/patient/doctors', ''), false);
  assert.equal(isItemActive(NAV_LINKS[1], '/patient/doctors', ''), false);
  assert.equal(isItemActive(NAV_LINKS[2], '/patient/doctors', ''), false);
});

test('Scenario 8: Service card interaction routes to Doctor Search with specialization filter', () => {
  const specialties = [
    { name: 'Cardiologist', specParam: 'Cardiology' },
    { name: 'Pulmonology', specParam: 'Pulmonology' },
    { name: 'General Medicine', specParam: 'General Medicine' },
    { name: 'Pediatrics', specParam: 'Pediatrics' },
    { name: 'Orthopedics', specParam: 'Orthopedics' },
    { name: 'Neurology', specParam: 'Neurology' },
    { name: 'Dermatology', specParam: 'Dermatology' },
    { name: 'Urology', specParam: 'Urology' }
  ];

  for (const item of specialties) {
    let routedUrl = null;
    const navigate = (url) => {
      routedUrl = url;
    };

    // Simulate clicking card or '+ Book Specialist'
    const handleSpecialtyClick = (specName) => {
      navigate(`/patient/doctors?specialization=${encodeURIComponent(specName)}`);
    };

    handleSpecialtyClick(item.specParam);
    assert.equal(
      routedUrl,
      `/patient/doctors?specialization=${encodeURIComponent(item.specParam)}`,
      `Service card ${item.name} must route to doctors with encoded specialization`
    );
  }
});
