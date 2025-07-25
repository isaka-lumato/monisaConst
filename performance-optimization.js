/**
 * Performance Optimization Script
 * Improves site loading speed and user experience
 */

// Preloader optimization - Force dismiss after maximum 1.5 seconds
(function () {
  "use strict";

  // Force preloader dismissal
  function dismissPreloader() {
    const preloader = document.getElementById("preloader");
    if (preloader) {
      preloader.style.opacity = "0";
      preloader.style.transition = "opacity 0.3s ease";
      setTimeout(() => {
        preloader.style.display = "none";
      }, 300);
    }
  }

  // Dismiss preloader on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(dismissPreloader, 500);
    });
  } else {
    setTimeout(dismissPreloader, 100);
  }

  // Force dismiss after 1.5 seconds maximum
  setTimeout(dismissPreloader, 1500);

  // Dismiss on window load
  window.addEventListener("load", function () {
    setTimeout(dismissPreloader, 200);
  });
})();

// Lazy loading for images
(function () {
  "use strict";

  function lazyLoadImages() {
    const images = document.querySelectorAll("img[data-src]");
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove("lazy");
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  }

  // Initialize lazy loading when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", lazyLoadImages);
  } else {
    lazyLoadImages();
  }
})();

// Optimize animations and transitions
(function () {
  "use strict";

  // Reduce motion for users who prefer it
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const style = document.createElement("style");
    style.textContent = `
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
    document.head.appendChild(style);
  }
})();

// Optimize scroll performance
(function () {
  "use strict";

  let ticking = false;

  function updateScrollPosition() {
    // Update scroll-dependent elements here
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateScrollPosition);
      ticking = true;
    }
  }

  window.addEventListener("scroll", requestTick, { passive: true });
})();

// Preload critical resources
(function () {
  "use strict";

  function preloadCriticalResources() {
    const criticalResources = [
      "assets/css/main.css",
      "assets/js/main.js",
      "assets/imgs/logo/10.png",
    ];

    criticalResources.forEach((resource) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.href = resource;

      if (resource.endsWith(".css")) {
        link.as = "style";
      } else if (resource.endsWith(".js")) {
        link.as = "script";
      } else if (resource.match(/\.(jpg|jpeg|png|webp)$/)) {
        link.as = "image";
      }

      document.head.appendChild(link);
    });
  }

  // Preload resources immediately
  preloadCriticalResources();
})();
