// Simple test to replace skeleton content immediately
console.log("Projects test script loaded");

// Replace content immediately when script loads
setTimeout(function () {
  console.log("Attempting to replace skeleton content...");

  const container = document.getElementById("hero-projects-panel");
  if (container) {
    console.log("Container found, replacing content...");

    container.innerHTML = `
      <div class="projects-panel-header">
        <h3>Recent Projects</h3>
      </div>
      <div class="projects-panel-content">
        <div class="project-card animate-in">
          <div class="project-card-image">
            <img src="assets/imgs/our-projects/latest-project__item-1.jpg" alt="Villa Construction" loading="lazy">
            <div class="project-card-overlay">
              <div class="project-card-category">Residential</div>
            </div>
          </div>
          <div class="project-card-content">
            <h4 class="project-card-title">Luxury Villa Construction</h4>
            <p class="project-card-description">Premium 4-bedroom villa with modern architecture and landscaped gardens</p>
            <div class="project-card-meta">
              <span class="project-location">Dar es Salaam</span>
              <a href="project-details.html" class="project-card-link">
                View Details
                <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
        
        <div class="project-card animate-in" style="animation-delay: 200ms;">
          <div class="project-card-image">
            <img src="assets/imgs/our-projects/latest-project__item-2.jpg" alt="Office Complex" loading="lazy">
            <div class="project-card-overlay">
              <div class="project-card-category">Commercial</div>
            </div>
          </div>
          <div class="project-card-content">
            <h4 class="project-card-title">Commercial Office Complex</h4>
            <p class="project-card-description">Multi-story business center with retail spaces and parking facilities</p>
            <div class="project-card-meta">
              <span class="project-location">Arusha</span>
              <a href="project-details.html" class="project-card-link">
                View Details
                <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
        
        <div class="project-card animate-in" style="animation-delay: 400ms;">
          <div class="project-card-image">
            <img src="assets/imgs/our-projects/latest-project__item-3.jpg" alt="Home Renovation" loading="lazy">
            <div class="project-card-overlay">
              <div class="project-card-category">Renovation</div>
            </div>
          </div>
          <div class="project-card-content">
            <h4 class="project-card-title">Complete Home Renovation</h4>
            <p class="project-card-description">Full house makeover with modern kitchen, bathrooms and interior design</p>
            <div class="project-card-meta">
              <span class="project-location">Mwanza</span>
              <a href="project-details.html" class="project-card-link">
                View Details
                <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div class="projects-panel-footer">
        <a href="project.html" class="projects-view-all-btn">
          See All Projects
          <i class="fa-solid fa-arrow-right"></i>
        </a>
      </div>
    `;

    console.log("Content replaced successfully!");
  } else {
    console.error("Container not found!");
  }
}, 100); // Wait 100ms to ensure DOM is ready
