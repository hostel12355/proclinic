const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");
const siteHeader = document.querySelector(".site-header");
const navDropdowns = Array.from(document.querySelectorAll(".nav-dropdown"));
const navDropdownToggles = Array.from(document.querySelectorAll(".nav-dropdown-toggle"));
const navOverlay = document.createElement("button");
navOverlay.type = "button";
navOverlay.className = "nav-overlay";
navOverlay.setAttribute("aria-label", "Close menu");
document.body.appendChild(navOverlay);

function closeAllDropdowns() {
  navDropdowns.forEach((dropdown) => {
    dropdown.classList.remove("open");
  });

  navDropdownToggles.forEach((toggle) => {
    toggle.setAttribute("aria-expanded", "false");
  });
}

function closeMenu() {
  if (!navMenu || !menuBtn) {
    return;
  }

  navMenu.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
  closeAllDropdowns();
}

function openMenu() {
  if (!navMenu || !menuBtn) {
    return;
  }

  navMenu.classList.add("open");
  menuBtn.setAttribute("aria-expanded", "true");
  document.body.classList.add("menu-open");
}

if (menuBtn && navMenu) {
  menuBtn.addEventListener("click", () => {
    const isOpen = navMenu.classList.contains("open");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  navOverlay.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!navMenu.classList.contains("open")) {
      return;
    }

    const target = event.target;
    const clickedInsideMenu = navMenu.contains(target);
    const clickedToggle = menuBtn.contains(target);
    if (!clickedInsideMenu && !clickedToggle && target !== navOverlay) {
      closeMenu();
    }
  });
}

navDropdownToggles.forEach((toggle) => {
  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const dropdown = toggle.closest(".nav-dropdown");
    if (!dropdown) {
      return;
    }

    const isMobile = window.matchMedia("(max-width: 860px)").matches;
    if (!isMobile) {
      navDropdowns.forEach((d) => {
        if (d !== dropdown) {
          d.classList.remove("open");
        }
      });
    }

    const willOpen = !dropdown.classList.contains("open");
    if (isMobile) {
      dropdown.classList.toggle("open", willOpen);
    } else {
      dropdown.classList.toggle("open", willOpen);
    }
    toggle.setAttribute("aria-expanded", String(willOpen));
  });
});

document.addEventListener("click", (event) => {
  const target = event.target;
  const clickedDropdown = navDropdowns.some((dropdown) => dropdown.contains(target));
  if (!clickedDropdown) {
    closeAllDropdowns();
  }
});

if (siteHeader) {
  const updateHeaderState = () => {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
}

const navLinks = Array.from(document.querySelectorAll(".nav-menu a:not(.btn)"));
const pageName = window.location.pathname.split("/").pop() || "index.html";
const servicePages = new Set([
  "services.html",
  "neurological-disorders.html",
  "psychological-emotional-health.html",
  "hair-loss-treatment.html",
  "skin-diseases.html",
  "womens-health.html",
  "respiratory-lung-diseases.html"
]);

navLinks.forEach((link) => {
  const href = link.getAttribute("href") || "";
  if (!href.includes(".html")) {
    return;
  }

  if (href === pageName || (pageName === "index.html" && href === "index.html")) {
    link.classList.add("is-active-link");
  }
});

if (servicePages.has(pageName)) {
  navDropdownToggles.forEach((toggle) => {
    toggle.classList.add("is-active-link");
  });
}

const slides = Array.from(document.querySelectorAll(".hero-slide"));
const prevHero = document.getElementById("prevHero");
const nextHero = document.getElementById("nextHero");
const heroCaption = document.getElementById("heroCaption");
const heroDots = document.getElementById("heroDots");
const heroSlider = document.getElementById("heroSlider");
let heroIndex = 0;
let heroTimer;

function renderHero(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("is-active", i === index);
  });

  const dots = heroDots ? Array.from(heroDots.querySelectorAll("button")) : [];
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });

  if (heroCaption) {
    heroCaption.textContent = slides[index].dataset.caption || "";
  }
}

function goToHero(step) {
  heroIndex = (heroIndex + step + slides.length) % slides.length;
  renderHero(heroIndex);
}

function startHeroAutoplay() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => goToHero(1), 5500);
}

if (slides.length && heroDots) {
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
    dot.addEventListener("click", () => {
      heroIndex = i;
      renderHero(heroIndex);
      startHeroAutoplay();
    });
    heroDots.appendChild(dot);
  });

  renderHero(heroIndex);
  startHeroAutoplay();

  if (prevHero) {
    prevHero.addEventListener("click", () => {
      goToHero(-1);
      startHeroAutoplay();
    });
  }

  if (nextHero) {
    nextHero.addEventListener("click", () => {
      goToHero(1);
      startHeroAutoplay();
    });
  }

  if (heroSlider) {
    heroSlider.addEventListener("mouseenter", () => clearInterval(heroTimer));
    heroSlider.addEventListener("mouseleave", startHeroAutoplay);
  }
}

const counters = Array.from(document.querySelectorAll("[data-count]"));
const counterObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const el = entry.target;
      const target = Number(el.dataset.count || 0);
      const suffix = el.dataset.suffix || "";
      const duration = 1200;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const value = Math.floor(progress * target);
        el.textContent = `${value}${suffix}`;
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = `${target}${suffix}`;
        }
      }

      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  },
  { threshold: 0.45 }
);

counters.forEach((counter) => counterObserver.observe(counter));

const serviceData = {
  neurological: {
    title: "Neurological Disorders",
    image: "assets/images/2025/11/1.jpg",
    description:
      "Personalized support for migraine, neuropathy, spondylosis, myofascial pain and fibromyalgia with a root-cause based plan.",
    points: [
      "Reduces nerve pain, inflammation and recurrence patterns",
      "Improves sleep quality and nervous system stability",
      "Designed for long-term improvement without dependency"
    ]
  },
  psychological: {
    title: "Psychological and Emotional Health",
    image: "assets/images/2025/11/photo-11.jpg",
    description:
      "A combination of homeopathy and counselling to support anxiety, panic episodes, mood disturbances and stress-related symptoms.",
    points: [
      "Addresses emotional triggers and deeper patterns",
      "Improves calmness, confidence and coping ability",
      "Supports both adults and younger patients"
    ]
  },
  hair: {
    title: "Hair Loss Treatment",
    image: "assets/images/2025/11/photo-12.jpg",
    description:
      "Hair fall care focused on internal causes such as stress, hormonal shifts, scalp imbalance and nutritional factors.",
    points: [
      "Used for alopecia, hair thinning and stress-related hair fall",
      "Improves scalp health and follicle strength",
      "Aims for visible and long-lasting recovery"
    ]
  },
  skin: {
    title: "Skin Diseases",
    image: "assets/images/2025/11/photo-8.jpg",
    description:
      "Holistic treatment for eczema, urticaria, acne, seborrheic dermatitis and psoriasis by correcting underlying imbalance.",
    points: [
      "Works on immunity, inflammation and trigger response",
      "Supports clear skin without harsh suppression",
      "Targets relapse prevention for chronic cases"
    ]
  },
  women: {
    title: "Women's Health",
    image: "assets/images/2025/11/women-s-health-awareness-medical-background-illustration-235904218.webp",
    description:
      "Specialized care for PCOD/PCOS, painful periods, fibroids, hormonal imbalance and endometriosis.",
    points: [
      "Helps regulate cycles and hormonal patterns naturally",
      "Supports reproductive wellness and energy balance",
      "Personalized plans for each life stage"
    ]
  },
  respiratory: {
    title: "Respiratory and Lung Diseases",
    image: "assets/images/2025/11/protect-your-lungs-from-air-pollution-1755002428.webp",
    description:
      "Long-term support for asthma, sinusitis, recurrent cough, throat infections and breathing discomfort.",
    points: [
      "Strengthens lung capacity and immune response",
      "Reduces repeated flare-ups and dependency patterns",
      "Suitable for both children and adults"
    ]
  }
};

const serviceButtons = Array.from(document.querySelectorAll(".service-tab"));
const serviceTitle = document.getElementById("serviceTitle");
const serviceDescription = document.getElementById("serviceDescription");
const serviceImage = document.getElementById("serviceImage");
const servicePoints = document.getElementById("servicePoints");

function renderService(key) {
  const service = serviceData[key];
  if (!service || !serviceTitle || !serviceDescription || !serviceImage || !servicePoints) {
    return;
  }

  serviceTitle.textContent = service.title;
  serviceDescription.textContent = service.description;
  serviceImage.src = service.image;
  serviceImage.alt = service.title;
  servicePoints.innerHTML = "";

  service.points.forEach((point) => {
    const li = document.createElement("li");
    li.textContent = point;
    servicePoints.appendChild(li);
  });

  serviceButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.service === key);
  });
}

serviceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    renderService(button.dataset.service);
  });
});

renderService("neurological");

const testimonials = [
  {
    quote:
      "I had consulted for anxiety disorder and started feeling better in a short period. The doctor was very patient and supportive throughout.",
    author: "Dilip Kudukuli"
  },
  {
    quote:
      "I consulted Dr. Garima for anxiety and focus problems. I saw significant improvement over the treatment period.",
    author: "Avanish Kumar"
  },
  {
    quote:
      "Treatment guidance has been calm, clear and consistent. The clinic's care model helped me recover with confidence.",
    author: "Verified Patient Review"
  },
  {
    quote:
      "For long-standing neurological discomfort, follow-up based homeopathic treatment helped reduce symptoms and improve daily life.",
    author: "Clinic Testimonial"
  }
];

const testimonialText = document.getElementById("testimonialText");
const testimonialAuthor = document.getElementById("testimonialAuthor");
const prevTestimonial = document.getElementById("prevTestimonial");
const nextTestimonial = document.getElementById("nextTestimonial");
let testimonialIndex = 0;
let testimonialTimer;

function renderTestimonial(index) {
  if (!testimonialText || !testimonialAuthor) {
    return;
  }

  testimonialText.textContent = `"${testimonials[index].quote}"`;
  testimonialAuthor.textContent = testimonials[index].author;
}

function moveTestimonial(step) {
  testimonialIndex = (testimonialIndex + step + testimonials.length) % testimonials.length;
  renderTestimonial(testimonialIndex);
}

function startTestimonialAutoplay() {
  clearInterval(testimonialTimer);
  testimonialTimer = setInterval(() => moveTestimonial(1), 6500);
}

if (testimonialText && testimonialAuthor) {
  renderTestimonial(testimonialIndex);
  startTestimonialAutoplay();

  if (prevTestimonial) {
    prevTestimonial.addEventListener("click", () => {
      moveTestimonial(-1);
      startTestimonialAutoplay();
    });
  }

  if (nextTestimonial) {
    nextTestimonial.addEventListener("click", () => {
      moveTestimonial(1);
      startTestimonialAutoplay();
    });
  }
}

const revealItems = Array.from(document.querySelectorAll(".reveal"));
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.14
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

const form = document.getElementById("appointmentForm");
const formMessage = document.getElementById("formMessage");

if (form && formMessage) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    formMessage.textContent = "Thank you. Your appointment request has been submitted successfully.";
    form.reset();
  });
}

const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}
