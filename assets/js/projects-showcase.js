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
   * @returns {Promise<Array>} Project data array
   */
  async loadProjectData() {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = fetch("assets/data/projects.json")
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
   * @returns {Array} Fallback project data
   */
  getFallbackData() {
    return [
      {
        slug: "fallback-1",
        title: "Recent Construction Project",
        shortDescription: "Quality construction services in Tanzania",
        images: {
          main: "assets/imgs/hero/hero-1.jpg",
        },
        category: "Residential",
        location: "Tanzania",
        featured: true,
      },
    ];
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

    // Filter featured projects and sort by completion date
    const featured = this.projectsData
      .filter((project) => project.featured)
      .sort((a, b) => {
        const dateA = new Date(a.completionDate || "1970-01-01");
        const dateB = new Date(b.completionDate || "1970-01-01");
        return dateB - dateA; // Most recent first
      });

    return featured.slice(0, limit);
  }

  /**
   * Get all projects
   * @returns {Array} Array of all projects
   */
  getAllProjects() {
    if (!this.projectsData) {
      return [];
    }

    return this.projectsData;
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
          <img src="${project.images.main}" alt="${
      project.title
    }" loading="lazy">
          <div class="project-card-overlay">
            <div class="project-card-category">${project.category}</div>
          </div>
        </div>
        <div class="project-card-content">
          <h4 class="project-card-title">${project.title}</h4>
          <p class="project-card-description">${project.shortDescription}</p>
          <div class="project-card-meta">
            <span class="project-location">${project.location || ""}</span>
            <a href="project-details.html?project=${
              project.slug
            }" class="project-card-link">
              View Details
              <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
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
// Static content is now used in HTML, no dynamic initialization needed
// This file is kept for potential future dynamic functionality

// Static content is now used in HTML, no dynamic initialization needed
// This file is kept for potential future dynamic functionality

// Animation is now handled by main.js to avoid conflicts
