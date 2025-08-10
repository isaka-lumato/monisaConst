/**
 * Simple Projects Showcase - Direct DOM manipulation
 * Updated to use CMS data structure
 */

// Fallback project data (will be replaced by CMS data)
let projectsData = [
  {
    title: "Luxury Villa Construction",
    shortDescription:
      "Premium 4-bedroom villa with modern architecture and landscaped gardens",
    images: {
      main: "assets/imgs/our-projects/latest-project__item-1.jpg",
    },
    category: "Residential",
    location: "Dar es Salaam",
    slug: "luxury-villa-construction",
  },
  {
    title: "Commercial Office Complex",
    shortDescription:
      "Multi-story business center with retail spaces and parking facilities",
    images: {
      main: "assets/imgs/our-projects/latest-project__item-2.jpg",
    },
    category: "Commercial",
    location: "Arusha",
    slug: "commercial-office-complex",
  },
  {
    title: "Complete Home Renovation",
    shortDescription:
      "Full house makeover with modern kitchen, bathrooms and interior design",
    images: {
      main: "assets/imgs/our-projects/latest-project__item-3.jpg",
    },
    category: "Renovation",
    location: "Mwanza",
    slug: "home-renovation",
  },
];

// Load actual CMS data
async function loadCMSProjectData() {
  try {
    const response = await fetch("assets/data/projects.json");
    if (response.ok) {
      const cmsData = await response.json();
      // Use featured projects or first 3 projects
      const featuredProjects = cmsData
        .filter((project) => project.featured)
        .slice(0, 3);
      if (featuredProjects.length > 0) {
        projectsData = featuredProjects;
      } else {
        projectsData = cmsData.slice(0, 3);
      }
    }
  } catch (error) {
    console.warn(
      "Could not load CMS project data, using fallback data:",
      error
    );
  }
}

// Function to create project card HTML
function createProjectCard(project, index) {
  return `
    <div class="project-card animate-in" style="animation-delay: ${
      index * 200
    }ms;">
      <div class="project-card-image">
        <img src="${project.images.main}" alt="${project.title}" loading="lazy">
        <div class="project-card-overlay">
          <div class="project-card-category">${project.category}</div>
        </div>
      </div>
      <div class="project-card-content">
        <h4 class="project-card-title">${project.title}</h4>
        <p class="project-card-description">${project.shortDescription}</p>
        <div class="project-card-meta">
          <span class="project-location">${project.location}</span>
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

// Function to render projects panel
async function renderProjectsPanel() {
  const container = document.getElementById("hero-projects-panel");
  if (!container) {
    console.error("Projects container not found");
    return;
  }

  console.log("Rendering projects panel...");

  // Load CMS data first
  await loadCMSProjectData();

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
