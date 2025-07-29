/**
 * Projects Showcase Module
 * Handles loading and displaying project data for homepage integration
 */

class ProjectsShowcase {
  constructor() {
    this.projectsData = null;
    this.isLoaded = false;
    this.loadingPromise = null;
  }

  /**
   * Load project data from JSON file
   * @returns {Promise<Object>} Project data
   */
  async loadProjectData() {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = fetch("assets/data/projects-showcase.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        this.projectsData = data;
        this.isLoaded = true;
        return data;
      })
      .catch((error) => {
        console.error("Error loading project data:", error);
        // Return fallback data
        return this.getFallbackData();
      });

    return this.loadingPromise;
  }

  /**
   * Get fallback data when loading fails
   * @returns {Object} Fallback project data
   */
  getFallbackData() {
    return {
      featuredProjects: [
        {
          id: "fallback-1",
          title: "Recent Construction Project",
          description: "Quality construction services in Tanzania",
          imageUrl: "assets/imgs/hero/hero-1.jpg",
          imageAlt: "Construction project",
          projectUrl: "project.html",
          category: "residential",
          featured: true,
        },
      ],
      metadata: {
        totalProjects: 1,
        displayLimit: 3,
      },
    };
  }

  /**
   * Get featured projects for homepage display
   * @param {number} limit - Maximum number of projects to return
   * @returns {Array} Array of featured projects
   */
  getFeaturedProjects(limit = 3) {
    if (!this.projectsData) {
      return [];
    }

    const featured = this.projectsData.featuredProjects || [];
    return featured.slice(0, limit);
  }

  /**
   * Get all recent projects
   * @returns {Array} Array of all projects
   */
  getAllProjects() {
    if (!this.projectsData) {
      return [];
    }

    const featured = this.projectsData.featuredProjects || [];
    const recent = this.projectsData.recentProjects || [];
    return [...featured, ...recent];
  }

  /**
   * Create project card HTML
   * @param {Object} project - Project data object
   * @param {number} index - Card index for animation delay
   * @returns {string} HTML string for project card
   */
  createProjectCard(project, index = 0) {
    const animationDelay = index * 200; // Stagger animation by 200ms

    return `
      <div class="project-card" style="animation-delay: ${animationDelay}ms;">
        <div class="project-card-image">
          <img src="${project.imageUrl}" alt="${
      project.imageAlt
    }" loading="lazy">
          <div class="project-card-overlay">
            <div class="project-card-category">${this.formatCategory(
              project.category
            )}</div>
          </div>
        </div>
        <div class="project-card-content">
          <h4 class="project-card-title">${project.title}</h4>
          <p class="project-card-description">${project.description}</p>
          <div class="project-card-meta">
            <span class="project-location">${project.location || ""}</span>
            <a href="${project.projectUrl}" class="project-card-link">
              View Details
              <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Format category name for display
   * @param {string} category - Raw category name
   * @returns {string} Formatted category name
   */
  formatCategory(category) {
    const categoryMap = {
      residential: "Residential",
      commercial: "Commercial",
      renovation: "Renovation",
    };
    return categoryMap[category] || category;
  }

  /**
   * Create skeleton loading card
   * @returns {string} HTML string for skeleton card
   */
  createSkeletonCard() {
    return `
      <div class="project-card skeleton">
        <div class="project-card-image skeleton-image"></div>
        <div class="project-card-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-description"></div>
          <div class="skeleton-meta"></div>
        </div>
      </div>
    `;
  }

  /**
   * Render projects panel
   * @param {string} containerId - ID of container element
   * @param {number} limit - Maximum number of projects to display
   */
  async renderProjectsPanel(containerId, limit = 3) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }

    // Show loading state
    container.innerHTML = `
      <div class="projects-panel-header">
        <h3>Recent Projects</h3>
      </div>
      <div class="projects-panel-content">
        ${Array(limit)
          .fill(0)
          .map(() => this.createSkeletonCard())
          .join("")}
      </div>
      <div class="projects-panel-footer">
        <a href="project.html" class="projects-view-all-btn">
          See All Projects
          <i class="fa-solid fa-arrow-right"></i>
        </a>
      </div>
    `;

    try {
      // Load project data
      await this.loadProjectData();
      const projects = this.getFeaturedProjects(limit);

      // Render actual content
      const projectCards = projects
        .map((project, index) => this.createProjectCard(project, index))
        .join("");

      container.innerHTML = `
        <div class="projects-panel-header">
          <h3>Recent Projects</h3>
        </div>
        <div class="projects-panel-content">
          ${projectCards}
        </div>
        <div class="projects-panel-footer">
          <a href="project.html" class="projects-view-all-btn">
            See All Projects
            <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      `;

      // Trigger entrance animations
      this.triggerEntranceAnimations(container);
    } catch (error) {
      console.error("Error rendering projects panel:", error);
      this.renderErrorState(container);
    }
  }

  /**
   * Trigger entrance animations for project cards
   * @param {Element} container - Container element
   */
  triggerEntranceAnimations(container) {
    const cards = container.querySelectorAll(".project-card");
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add("animate-in");
      }, index * 200);
    });
  }

  /**
   * Render error state
   * @param {Element} container - Container element
   */
  renderErrorState(container) {
    container.innerHTML = `
      <div class="projects-panel-error">
        <h3>Recent Projects</h3>
        <p>Unable to load projects at this time.</p>
        <a href="project.html" class="projects-view-all-btn">
          View All Projects
          <i class="fa-solid fa-arrow-right"></i>
        </a>
      </div>
    `;
  }
}

// Export for use in other modules
window.ProjectsShowcase = ProjectsShowcase;

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  // Initialize projects showcase if container exists
  const projectsContainer = document.getElementById("hero-projects-panel");
  if (projectsContainer) {
    const showcase = new ProjectsShowcase();

    // Add immediate fallback data for testing
    showcase.projectsData = {
      featuredProjects: [
        {
          id: "proj-001",
          title: "Luxury Villa Construction",
          description:
            "Premium 4-bedroom villa with modern architecture and landscaped gardens",
          imageUrl: "assets/imgs/our-projects/latest-project__item-1.jpg",
          imageAlt: "Modern villa exterior with contemporary design",
          projectUrl: "project-details.html",
          category: "residential",
          location: "Dar es Salaam",
          featured: true,
        },
        {
          id: "proj-002",
          title: "Commercial Office Complex",
          description:
            "Multi-story business center with retail spaces and parking facilities",
          imageUrl: "assets/imgs/our-projects/latest-project__item-2.jpg",
          imageAlt: "Modern commercial building with glass facade",
          projectUrl: "project-details.html",
          category: "commercial",
          location: "Arusha",
          featured: true,
        },
        {
          id: "proj-003",
          title: "Complete Home Renovation",
          description:
            "Full house makeover with modern kitchen, bathrooms and interior design",
          imageUrl: "assets/imgs/our-projects/latest-project__item-3.jpg",
          imageAlt: "Renovated home interior with modern finishes",
          projectUrl: "project-details.html",
          category: "renovation",
          location: "Mwanza",
          featured: true,
        },
      ],
    };
    showcase.isLoaded = true;

    console.log(
      "Projects showcase initialized with data:",
      showcase.projectsData
    );
    showcase.renderProjectsPanel("hero-projects-panel", 3);
  }
});
