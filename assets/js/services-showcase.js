/**
 * Services Showcase Module
 * Handles loading and displaying services data
 */

class ServicesShowcase {
  constructor() {
    this.servicesData = null;
    this.isLoaded = false;
    this.loadingPromise = null;
  }

  /**
   * Load services data from JSON file
   * @returns {Promise<Array>} Services data array
   */
  async loadServicesData() {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = fetch("assets/data/services.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        this.servicesData = data;
        this.isLoaded = true;
        return data;
      })
      .catch((error) => {
        console.error("Error loading services data:", error);
        return this.getFallbackData();
      });

    return this.loadingPromise;
  }

  /**
   * Get fallback data when loading fails
   * @returns {Array} Fallback services data
   */
  getFallbackData() {
    return [
      {
        slug: "fallback-1",
        title: "Construction Services",
        description: "Professional construction services for all your needs",
        icon: "home",
        category: "Construction Services",
        features: ["Quality work", "Professional team", "Timely delivery"],
        available: true,
      },
    ];
  }

  /**
   * Get available services
   * @param {number} limit - Maximum number of services to return
   * @returns {Array} Array of available services
   */
  getAvailableServices(limit = null) {
    if (!this.servicesData) {
      return [];
    }

    const available = this.servicesData
      .filter((service) => service.available)
      .sort((a, b) => (a.order || 999) - (b.order || 999));

    return limit ? available.slice(0, limit) : available;
  }

  /**
   * Get featured services
   * @param {number} limit - Maximum number of services to return
   * @returns {Array} Array of featured services
   */
  getFeaturedServices(limit = 3) {
    if (!this.servicesData) {
      return [];
    }

    const featured = this.servicesData
      .filter((service) => service.featured && service.available)
      .sort((a, b) => (a.order || 999) - (b.order || 999));

    return featured.slice(0, limit);
  }

  /**
   * Create service card HTML
   * @param {Object} service - Service data object
   * @param {number} index - Card index for animation delay
   * @returns {string} HTML string for service card
   */
  createServiceCard(service, index = 0) {
    const animationDelay = index * 200;
    const iconClass = this.getIconClass(service.icon);

    return `
      <div class="col-lg-4 col-md-6 mb-30" style="animation-delay: ${animationDelay}ms;">
        <div class="service__item">
          <div class="service__item-icon">
            <i class="${iconClass}"></i>
          </div>
          <div class="service__item-content">
            <h3 class="service__item-title">
              <a href="service-details.html?service=${service.slug}">${
      service.title
    }</a>
            </h3>
            <p class="service__item-description">${service.description}</p>
            <div class="service__item-features">
              <ul>
                ${service.features
                  .slice(0, 3)
                  .map((feature) => `<li>${feature}</li>`)
                  .join("")}
              </ul>
            </div>
            <div class="service__item-footer">
              ${
                service.pricing
                  ? `<span class="service__item-price">From ${service.pricing.startingFrom}</span>`
                  : ""
              }
              <a href="service-details.html?service=${
                service.slug
              }" class="service__item-link">
                Learn More <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create service list item HTML
   * @param {Object} service - Service data object
   * @returns {string} HTML string for service list item
   */
  createServiceListItem(service) {
    const iconClass = this.getIconClass(service.icon);

    return `
      <div class="service-list__item">
        <div class="service-list__item-icon">
          <i class="${iconClass}"></i>
        </div>
        <div class="service-list__item-content">
          <h4 class="service-list__item-title">
            <a href="service-details.html?service=${service.slug}">${
      service.title
    }</a>
          </h4>
          <p class="service-list__item-description">${service.description}</p>
          <div class="service-list__item-meta">
            <span class="service-category">${service.category}</span>
            ${
              service.pricing
                ? `<span class="service-price">From ${service.pricing.startingFrom}</span>`
                : ""
            }
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get icon class based on service icon
   * @param {string} icon - Icon identifier
   * @returns {string} CSS class for icon
   */
  getIconClass(icon) {
    const iconMap = {
      home: "fa-solid fa-home",
      building: "fa-solid fa-building",
      blueprint: "fa-solid fa-drafting-compass",
      clipboard: "fa-solid fa-clipboard-list",
      calculator: "fa-solid fa-calculator",
      hammer: "fa-solid fa-hammer",
      wrench: "fa-solid fa-wrench",
      tools: "fa-solid fa-tools",
    };
    return iconMap[icon] || "fa-solid fa-cog";
  }

  /**
   * Render services grid
   * @param {string} containerId - ID of container element
   * @param {number} limit - Maximum number of services to display
   */
  async renderServicesGrid(containerId, limit = null) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }

    try {
      await this.loadServicesData();
      const services = this.getAvailableServices(limit);

      const serviceCards = services
        .map((service, index) => this.createServiceCard(service, index))
        .join("");

      container.innerHTML = serviceCards;

      // Trigger entrance animations
      this.triggerEntranceAnimations(container);
    } catch (error) {
      console.error("Error rendering services grid:", error);
      this.renderErrorState(container);
    }
  }

  /**
   * Render featured services
   * @param {string} containerId - ID of container element
   * @param {number} limit - Maximum number of services to display
   */
  async renderFeaturedServices(containerId, limit = 3) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }

    try {
      await this.loadServicesData();
      const services = this.getFeaturedServices(limit);

      const serviceCards = services
        .map((service, index) => this.createServiceCard(service, index))
        .join("");

      container.innerHTML = serviceCards;

      // Trigger entrance animations
      this.triggerEntranceAnimations(container);
    } catch (error) {
      console.error("Error rendering featured services:", error);
      this.renderErrorState(container);
    }
  }

  /**
   * Render services list
   * @param {string} containerId - ID of container element
   */
  async renderServicesList(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }

    try {
      await this.loadServicesData();
      const services = this.getAvailableServices();

      const serviceItems = services
        .map((service) => this.createServiceListItem(service))
        .join("");

      container.innerHTML = serviceItems;
    } catch (error) {
      console.error("Error rendering services list:", error);
      this.renderErrorState(container);
    }
  }

  /**
   * Trigger entrance animations
   * @param {Element} container - Container element
   */
  triggerEntranceAnimations(container) {
    const items = container.querySelectorAll('[style*="animation-delay"]');
    items.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add("animate-in");
      }, index * 200);
    });
  }

  /**
   * Render error state
   * @param {Element} container - Container element
   */
  renderErrorState(container) {
    container.innerHTML = `
      <div class="services-error">
        <p>Unable to load services at this time.</p>
        <a href="service.html" class="btn">View All Services</a>
      </div>
    `;
  }
}

// Export for use in other modules
window.ServicesShowcase = ServicesShowcase;
