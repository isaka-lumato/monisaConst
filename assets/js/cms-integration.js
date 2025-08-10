/**
 * CMS Integration Module
 * Integrates CMS data with existing website functionality
 */

class CMSIntegration {
  constructor() {
    this.projectsShowcase = new ProjectsShowcase();
    this.blogShowcase = new BlogShowcase();
    this.servicesShowcase = new ServicesShowcase();
    this.teamShowcase = new TeamShowcase();
  }

  /**
   * Initialize CMS integration based on current page
   */
  async init() {
    const currentPage = this.getCurrentPage();

    switch (currentPage) {
      case "index":
        await this.initHomepage();
        break;
      case "project":
        await this.initProjectsPage();
        break;
      case "blog":
        await this.initBlogPage();
        break;
      case "service":
        await this.initServicesPage();
        break;
      case "team":
        await this.initTeamPage();
        break;
      default:
        // Initialize common elements that might appear on any page
        await this.initCommonElements();
        break;
    }
  }

  /**
   * Get current page identifier
   * @returns {string} Page identifier
   */
  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split("/").pop().split(".")[0];

    if (filename === "" || filename === "index") return "index";
    if (filename.includes("project")) return "project";
    if (filename.includes("blog")) return "blog";
    if (filename.includes("service")) return "service";
    if (filename.includes("team")) return "team";

    return filename;
  }

  /**
   * Initialize homepage elements
   */
  async initHomepage() {
    console.log("Initializing homepage CMS integration...");

    // Update projects showcase in hero banner
    await this.updateProjectsShowcase();

    // Update latest projects section
    await this.updateLatestProjectsSection();

    // Update blog section if present
    await this.updateBlogSection();

    // Update services section if present
    await this.updateServicesSection();

    // Update team section if present
    await this.updateTeamSection();
  }

  /**
   * Initialize projects page elements
   */
  async initProjectsPage() {
    console.log("Initializing projects page CMS integration...");

    // Update projects grid
    await this.updateProjectsGrid();

    // Update project filters
    await this.updateProjectFilters();
  }

  /**
   * Initialize blog page elements
   */
  async initBlogPage() {
    console.log("Initializing blog page CMS integration...");

    // Update blog grid
    const blogGrid = document.getElementById("blog-grid");
    if (blogGrid) {
      await this.blogShowcase.renderBlogGrid("blog-grid");
    }
  }

  /**
   * Initialize services page elements
   */
  async initServicesPage() {
    console.log("Initializing services page CMS integration...");

    // Update services grid
    const servicesGrid = document.getElementById("services-grid");
    if (servicesGrid) {
      await this.servicesShowcase.renderServicesGrid("services-grid");
    }
  }

  /**
   * Initialize team page elements
   */
  async initTeamPage() {
    console.log("Initializing team page CMS integration...");

    // Update team grid
    const teamGrid = document.getElementById("team-grid");
    if (teamGrid) {
      await this.teamShowcase.renderTeamGrid("team-grid");
    }
  }

  /**
   * Initialize common elements that appear on multiple pages
   */
  async initCommonElements() {
    // Update any common project showcases
    await this.updateProjectsShowcase();
  }

  /**
   * Update projects showcase in hero banner
   */
  async updateProjectsShowcase() {
    try {
      await this.projectsShowcase.loadProjectData();
      const projects = this.projectsShowcase.getFeaturedProjects(2);

      // Update each banner slide's project panel
      const projectPanels = document.querySelectorAll(
        ".projects-panel-content"
      );

      projectPanels.forEach((panel, slideIndex) => {
        const slideProjects = projects.slice(
          slideIndex * 2,
          (slideIndex + 1) * 2
        );
        if (slideProjects.length > 0) {
          const projectCards = slideProjects
            .map((project, index) =>
              this.projectsShowcase.createProjectCard(project, index)
            )
            .join("");

          panel.innerHTML = projectCards;
        }
      });

      console.log("Projects showcase updated successfully");
    } catch (error) {
      console.error("Error updating projects showcase:", error);
    }
  }

  /**
   * Update latest projects section
   */
  async updateLatestProjectsSection() {
    try {
      await this.projectsShowcase.loadProjectData();
      const projects = this.projectsShowcase.getAllProjects();

      // Update the isotope grid
      const gridContainer = document.querySelector(".grid");
      if (gridContainer) {
        const projectItems = projects
          .map((project) => this.createLatestProjectItem(project))
          .join("");
        gridContainer.innerHTML = projectItems;

        // Reinitialize isotope if available
        if (typeof $.fn.isotope !== "undefined") {
          $(gridContainer).isotope("reloadItems");
        }
      }

      console.log("Latest projects section updated successfully");
    } catch (error) {
      console.error("Error updating latest projects section:", error);
    }
  }

  /**
   * Create latest project item HTML
   * @param {Object} project - Project data object
   * @returns {string} HTML string for project item
   */
  createLatestProjectItem(project) {
    const categoryClass = project.category.toLowerCase().replace(/\s+/g, "-");

    return `
      <div class="col-lg-4 col-md-6 grid-item ${categoryClass}">
        <div class="latest-project__item mb-30">
          <div class="latest-project__item-thumb wow clip-a-z">
            <img src="${project.images.main}" alt="${project.title}" />
          </div>
          <div class="latest-project__item-content">
            <div class="icon__wrapper">
              <a href="project-details.html?project=${project.slug}" class="icon">
                <svg width="34" height="30" viewBox="0 0 34 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.3333 8.33333V5C20.3333 3.61929 19.2474 2.5 17.9 2.5H5.43333C4.08595 2.5 3 3.61929 3 5V20C3 21.3807 4.08595 22.5 5.43333 22.5H8.66667" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M13.9 8.33333H26.3667C27.714 8.33333 28.8 9.45262 28.8 10.8333V25.8333C28.8 27.214 27.714 28.3333 26.3667 28.3333H13.9C12.5526 28.3333 11.4667 27.214 11.4667 25.8333V10.8333C11.4667 9.45262 12.5526 8.33333 13.9 8.33333Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>
            </div>
            <div class="content">
              <span class="category">${project.category}</span>
              <h4 class="title">
                <a href="project-details.html?project=${project.slug}">${project.title}</a>
              </h4>
              <p class="description">${project.shortDescription}</p>
              <div class="meta">
                <span class="location">${project.location}</span>
                <span class="status">${project.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update blog section
   */
  async updateBlogSection() {
    const blogSlider = document.querySelector(
      ".blog-2__slider .swiper-wrapper"
    );
    if (blogSlider) {
      try {
        await this.blogShowcase.loadBlogData();
        const posts = this.blogShowcase.getRecentPosts(3);

        const blogSlides = posts
          .map(
            (post) => `
          <div class="swiper-slide">
            ${this.blogShowcase.createBlogCard(post)}
          </div>
        `
          )
          .join("");

        blogSlider.innerHTML = blogSlides;

        console.log("Blog section updated successfully");
      } catch (error) {
        console.error("Error updating blog section:", error);
      }
    }
  }

  /**
   * Update services section
   */
  async updateServicesSection() {
    const servicesContainer = document.getElementById("homepage-services");
    if (servicesContainer) {
      await this.servicesShowcase.renderFeaturedServices(
        "homepage-services",
        3
      );
    }
  }

  /**
   * Update team section
   */
  async updateTeamSection() {
    const teamContainer = document.getElementById("homepage-team");
    if (teamContainer) {
      await this.teamShowcase.renderFeaturedTeam("homepage-team", 3);
    }
  }

  /**
   * Update projects grid for projects page
   */
  async updateProjectsGrid() {
    const projectsGrid = document.getElementById("projects-grid");
    if (projectsGrid) {
      try {
        await this.projectsShowcase.loadProjectData();
        const projects = this.projectsShowcase.getAllProjects();

        const projectItems = projects
          .map((project) => this.createProjectGridItem(project))
          .join("");
        projectsGrid.innerHTML = projectItems;

        console.log("Projects grid updated successfully");
      } catch (error) {
        console.error("Error updating projects grid:", error);
      }
    }
  }

  /**
   * Create project grid item HTML
   * @param {Object} project - Project data object
   * @returns {string} HTML string for project grid item
   */
  createProjectGridItem(project) {
    return `
      <div class="col-lg-4 col-md-6 mb-30">
        <div class="project-grid__item">
          <div class="project-grid__item-thumb">
            <img src="${project.images.main}" alt="${project.title}">
            <div class="project-grid__item-overlay">
              <a href="project-details.html?project=${
                project.slug
              }" class="project-grid__item-link">
                <i class="fa-solid fa-eye"></i>
              </a>
            </div>
          </div>
          <div class="project-grid__item-content">
            <div class="project-grid__item-meta">
              <span class="category">${project.category}</span>
              <span class="status status-${project.status
                .toLowerCase()
                .replace(/\s+/g, "-")}">${project.status}</span>
            </div>
            <h3 class="project-grid__item-title">
              <a href="project-details.html?project=${project.slug}">${
      project.title
    }</a>
            </h3>
            <p class="project-grid__item-description">${
              project.shortDescription
            }</p>
            <div class="project-grid__item-footer">
              <span class="location">${project.location}</span>
              ${
                project.completionDate
                  ? `<span class="completion-date">${this.projectsShowcase.formatDate(
                      project.completionDate
                    )}</span>`
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update project filters
   */
  async updateProjectFilters() {
    try {
      await this.projectsShowcase.loadProjectData();
      const projects = this.projectsShowcase.getAllProjects();

      // Get unique categories
      const categories = [
        ...new Set(projects.map((project) => project.category)),
      ];

      // Update filter buttons
      const filterContainer = document.querySelector(".masonary-menu");
      if (filterContainer) {
        const filterButtons = [
          '<button class="active" data-filter="*">All</button>',
          ...categories.map((category) => {
            const filterClass = category.toLowerCase().replace(/\s+/g, "-");
            return `<button data-filter=".${filterClass}">${category}</button>`;
          }),
        ].join("");

        filterContainer.innerHTML = filterButtons;
      }

      console.log("Project filters updated successfully");
    } catch (error) {
      console.error("Error updating project filters:", error);
    }
  }
}

// Initialize CMS integration when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  const cmsIntegration = new CMSIntegration();
  cmsIntegration.init().catch((error) => {
    console.error("Error initializing CMS integration:", error);
  });
});

// Export for use in other modules
window.CMSIntegration = CMSIntegration;
