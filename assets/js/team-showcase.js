/**
 * Team Showcase Module
 * Handles loading and displaying team member data
 */

class TeamShowcase {
  constructor() {
    this.teamData = null;
    this.isLoaded = false;
    this.loadingPromise = null;
  }

  /**
   * Load team data from JSON file
   * @returns {Promise<Array>} Team data array
   */
  async loadTeamData() {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = fetch("assets/data/team.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        this.teamData = data;
        this.isLoaded = true;
        return data;
      })
      .catch((error) => {
        console.error("Error loading team data:", error);
        return this.getFallbackData();
      });

    return this.loadingPromise;
  }

  /**
   * Get fallback data when loading fails
   * @returns {Array} Fallback team data
   */
  getFallbackData() {
    return [
      {
        slug: "fallback-1",
        name: "Team Member",
        position: "Construction Professional",
        photo: "assets/imgs/team/team-item-1.jpg",
        bio: "Experienced construction professional",
        active: true,
      },
    ];
  }

  /**
   * Get active team members
   * @param {number} limit - Maximum number of members to return
   * @returns {Array} Array of active team members
   */
  getActiveMembers(limit = null) {
    if (!this.teamData) {
      return [];
    }

    const active = this.teamData
      .filter((member) => member.active)
      .sort((a, b) => (a.order || 999) - (b.order || 999));

    return limit ? active.slice(0, limit) : active;
  }

  /**
   * Get featured team members
   * @param {number} limit - Maximum number of members to return
   * @returns {Array} Array of featured team members
   */
  getFeaturedMembers(limit = 3) {
    if (!this.teamData) {
      return [];
    }

    const featured = this.teamData
      .filter((member) => member.featured && member.active)
      .sort((a, b) => (a.order || 999) - (b.order || 999));

    return featured.slice(0, limit);
  }

  /**
   * Create team member card HTML
   * @param {Object} member - Team member data object
   * @param {number} index - Card index for animation delay
   * @returns {string} HTML string for team member card
   */
  createTeamCard(member, index = 0) {
    const animationDelay = index * 200;
    const socialLinks = this.createSocialLinks(member.socialLinks);

    return `
      <div class="col-lg-4 col-md-6 mb-30" style="animation-delay: ${animationDelay}ms;">
        <div class="team__item">
          <div class="team__item-thumb">
            <img src="${member.photo}" alt="${member.name}">
            <div class="team__item-social">
              ${socialLinks}
            </div>
          </div>
          <div class="team__item-content">
            <h3 class="team__item-name">
              <a href="team-details.html?member=${member.slug}">${
      member.name
    }</a>
            </h3>
            <span class="team__item-position">${member.position}</span>
            <p class="team__item-bio">${member.bio}</p>
            <div class="team__item-meta">
              ${
                member.professional
                  ? `<span class="team__item-experience">${member.professional.experience}+ years experience</span>`
                  : ""
              }
              ${
                member.department
                  ? `<span class="team__item-department">${member.department}</span>`
                  : ""
              }
            </div>
            <a href="team-details.html?member=${
              member.slug
            }" class="team__item-link">
              View Profile <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create team member list item HTML
   * @param {Object} member - Team member data object
   * @returns {string} HTML string for team member list item
   */
  createTeamListItem(member) {
    const socialLinks = this.createSocialLinks(member.socialLinks);

    return `
      <div class="team-list__item">
        <div class="team-list__item-photo">
          <img src="${member.photo}" alt="${member.name}">
        </div>
        <div class="team-list__item-content">
          <h4 class="team-list__item-name">
            <a href="team-details.html?member=${member.slug}">${member.name}</a>
          </h4>
          <span class="team-list__item-position">${member.position}</span>
          <p class="team-list__item-bio">${member.bio}</p>
          <div class="team-list__item-contact">
            ${
              member.contact
                ? `
              <span class="team-email">
                <i class="fa-solid fa-envelope"></i>
                <a href="mailto:${member.contact.email}">${member.contact.email}</a>
              </span>
              <span class="team-phone">
                <i class="fa-solid fa-phone"></i>
                <a href="tel:${member.contact.phone}">${member.contact.phone}</a>
              </span>
            `
                : ""
            }
          </div>
          <div class="team-list__item-social">
            ${socialLinks}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create social links HTML
   * @param {Object} socialLinks - Social media links object
   * @returns {string} HTML string for social links
   */
  createSocialLinks(socialLinks) {
    if (!socialLinks) return "";

    const links = [];

    if (socialLinks.linkedin) {
      links.push(
        `<a href="${socialLinks.linkedin}" target="_blank" rel="noopener"><i class="fab fa-linkedin-in"></i></a>`
      );
    }
    if (socialLinks.twitter) {
      links.push(
        `<a href="${socialLinks.twitter}" target="_blank" rel="noopener"><i class="fab fa-twitter"></i></a>`
      );
    }
    if (socialLinks.facebook) {
      links.push(
        `<a href="${socialLinks.facebook}" target="_blank" rel="noopener"><i class="fab fa-facebook-f"></i></a>`
      );
    }
    if (socialLinks.instagram) {
      links.push(
        `<a href="${socialLinks.instagram}" target="_blank" rel="noopener"><i class="fab fa-instagram"></i></a>`
      );
    }

    return links.join("");
  }

  /**
   * Render team grid
   * @param {string} containerId - ID of container element
   * @param {number} limit - Maximum number of members to display
   */
  async renderTeamGrid(containerId, limit = null) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }

    try {
      await this.loadTeamData();
      const members = this.getActiveMembers(limit);

      const teamCards = members
        .map((member, index) => this.createTeamCard(member, index))
        .join("");

      container.innerHTML = teamCards;

      // Trigger entrance animations
      this.triggerEntranceAnimations(container);
    } catch (error) {
      console.error("Error rendering team grid:", error);
      this.renderErrorState(container);
    }
  }

  /**
   * Render featured team members
   * @param {string} containerId - ID of container element
   * @param {number} limit - Maximum number of members to display
   */
  async renderFeaturedTeam(containerId, limit = 3) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }

    try {
      await this.loadTeamData();
      const members = this.getFeaturedMembers(limit);

      const teamCards = members
        .map((member, index) => this.createTeamCard(member, index))
        .join("");

      container.innerHTML = teamCards;

      // Trigger entrance animations
      this.triggerEntranceAnimations(container);
    } catch (error) {
      console.error("Error rendering featured team:", error);
      this.renderErrorState(container);
    }
  }

  /**
   * Render team list
   * @param {string} containerId - ID of container element
   */
  async renderTeamList(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }

    try {
      await this.loadTeamData();
      const members = this.getActiveMembers();

      const teamItems = members
        .map((member) => this.createTeamListItem(member))
        .join("");

      container.innerHTML = teamItems;
    } catch (error) {
      console.error("Error rendering team list:", error);
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
      <div class="team-error">
        <p>Unable to load team information at this time.</p>
        <a href="team.html" class="btn">View Team</a>
      </div>
    `;
  }
}

// Export for use in other modules
window.TeamShowcase = TeamShowcase;
