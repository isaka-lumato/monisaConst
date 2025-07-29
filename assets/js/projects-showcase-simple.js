/**
 * Simple Projects Showcase - Direct DOM manipulation
 */

// Project data
const projectsData = [
  {
    title: "Luxury Villa Construction",
    description:
      "Premium 4-bedroom villa with modern architecture and landscaped gardens",
    imageUrl: "assets/imgs/our-projects/latest-project__item-1.jpg",
    category: "Residential",
    location: "Dar es Salaam",
  },
  {
    title: "Commercial Office Complex",
    description:
      "Multi-story business center with retail spaces and parking facilities",
    imageUrl: "assets/imgs/our-projects/latest-project__item-2.jpg",
    category: "Commercial",
    location: "Arusha",
  },
  {
    title: "Complete Home Renovation",
    description:
      "Full house makeover with modern kitchen, bathrooms and interior design",
    imageUrl: "assets/imgs/our-projects/latest-project__item-3.jpg",
    category: "Renovation",
    location: "Mwanza",
  },
];

// Function to create project card HTML
function createProjectCard(project, index) {
  return `
    <div class="project-card animate-in" style="animation-delay: ${
      index * 200
    }ms;">
      <div class="project-card-image">
        <img src="${project.imageUrl}" alt="${project.title}" loading="lazy">
        <div class="project-card-overlay">
          <div class="project-card-category">${project.category}</div>
        </div>
      </div>
      <div class="project-card-content">
        <h4 class="project-card-title">${project.title}</h4>
        <p class="project-card-description">${project.description}</p>
        <div class="project-card-meta">
          <span class="project-location">${project.location}</span>
          <a href="project-details.html" class="project-card-link">
            View Details
            <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </div>
    </div>
  `;
}

// Function to render projects panel
function renderProjectsPanel() {
  const container = document.getElementById("hero-projects-panel");
  if (!container) {
    console.error("Projects container not found");
    return;
  }

  console.log("Rendering projects panel...");

  // Create project cards HTML
  const projectCards = projectsData
    .map((project, index) => createProjectCard(project, index))
    .join("");

  // Update container content
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

  console.log("Projects panel rendered successfully");
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing projects showcase...");
  renderProjectsPanel();
});

// Also try to initialize immediately in case DOM is already loaded
if (document.readyState === "loading") {
  // DOM is still loading
  console.log("DOM is loading, waiting...");
} else {
  // DOM is already loaded
  console.log("DOM already loaded, initializing immediately...");
  renderProjectsPanel();
}
