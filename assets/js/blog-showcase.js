/**
 * Blog Showcase Module
 * Handles loading and displaying blog data for homepage and blog pages
 */

class BlogShowcase {
  constructor() {
    this.blogData = null;
    this.isLoaded = false;
    this.loadingPromise = null;
  }

  /**
   * Load blog data from JSON file
   * @returns {Promise<Array>} Blog data array
   */
  async loadBlogData() {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = fetch("assets/data/blog.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        this.blogData = data;
        this.isLoaded = true;
        return data;
      })
      .catch((error) => {
        console.error("Error loading blog data:", error);
        return this.getFallbackData();
      });

    return this.loadingPromise;
  }

  /**
   * Get fallback data when loading fails
   * @returns {Array} Fallback blog data
   */
  getFallbackData() {
    return [
      {
        slug: "fallback-1",
        title: "Construction Industry Updates",
        excerpt: "Stay updated with the latest in construction industry",
        featuredImage: "assets/imgs/blog/blog-1.jpg",
        date: new Date().toISOString(),
        author: "Monisa Team",
        published: true,
      },
    ];
  }

  /**
   * Get published blog posts
   * @param {number} limit - Maximum number of posts to return
   * @returns {Array} Array of published blog posts
   */
  getPublishedPosts(limit = null) {
    if (!this.blogData) {
      return [];
    }

    const published = this.blogData
      .filter((post) => post.published)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return limit ? published.slice(0, limit) : published;
  }

  /**
   * Get recent blog posts for homepage display
   * @param {number} limit - Maximum number of posts to return
   * @returns {Array} Array of recent blog posts
   */
  getRecentPosts(limit = 3) {
    return this.getPublishedPosts(limit);
  }

  /**
   * Create blog card HTML
   * @param {Object} post - Blog post data object
   * @param {number} index - Card index for animation delay
   * @returns {string} HTML string for blog card
   */
  createBlogCard(post, index = 0) {
    const animationDelay = index * 200;
    const formattedDate = this.formatDate(post.date);

    return `
      <div class="blog-2__item d-flex flex-column flex-sm-row" style="animation-delay: ${animationDelay}ms;">
        <div class="blog-2__item-text d-flex justify-content-center flex-column">
          <div class="blog-2__item-meta mb-10">
            <a href="blog-details.html?post=${post.slug}">
              <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 0.5C3.35786 0.5 0 3.85786 0 8C0 12.1421 3.35786 15.5 7.5 15.5C11.6421 15.5 15 12.1421 15 8C15 3.85786 11.6421 0.5 7.5 0.5ZM7.5 14C4.18629 14 1.5 11.3137 1.5 8C1.5 4.68629 4.18629 2 7.5 2C10.8137 2 13.5 4.68629 13.5 8C13.5 11.3137 10.8137 14 7.5 14Z" fill="#6A6A6A"/>
                <path d="M7.5 4.5V8.5L10.5 10.5" stroke="#6A6A6A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              ${formattedDate}
            </a>
            <span class="blog-author">By ${post.author}</span>
          </div>

          <h4 class="blog-2__item-title mb-15 mb-xs-10 rr-fw-bold text-capitalize">
            <a href="blog-details.html?post=${post.slug}">${post.title}</a>
          </h4>

          <p class="mb-20">${post.excerpt}</p>

          <a class="blog-2__item-readmore" href="blog-details.html?post=${post.slug}">
            Read More
            <svg width="20" height="11" viewBox="0 0 20 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 5.5L19 5.5" stroke="#6A6A6A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M15 1.5L19 5.5L15 9.5" stroke="#6A6A6A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        </div>
        <a href="blog-details.html?post=${post.slug}" data-cursor-text="View" class="blog-2__item-media d-block">
          <img src="${post.featuredImage}" alt="${post.title}" class="img-fluid">
        </a>
      </div>
    `;
  }

  /**
   * Create blog grid item HTML
   * @param {Object} post - Blog post data object
   * @returns {string} HTML string for blog grid item
   */
  createBlogGridItem(post) {
    const formattedDate = this.formatDate(post.date);
    const readingTime =
      post.readingTime || Math.ceil(post.wordCount / 200) || 2;

    return `
      <div class="col-lg-4 col-md-6 mb-30">
        <div class="blog__item">
          <div class="blog__item-thumb">
            <a href="blog-details.html?post=${post.slug}">
              <img src="${post.featuredImage}" alt="${post.title}">
            </a>
          </div>
          <div class="blog__item-content">
            <div class="blog__item-meta">
              <span class="blog__item-date">${formattedDate}</span>
              <span class="blog__item-author">By ${post.author}</span>
              <span class="blog__item-reading-time">${readingTime} min read</span>
            </div>
            <h3 class="blog__item-title">
              <a href="blog-details.html?post=${post.slug}">${post.title}</a>
            </h3>
            <p class="blog__item-excerpt">${post.excerpt}</p>
            <div class="blog__item-tags">
              ${
                post.tags
                  ? post.tags
                      .slice(0, 3)
                      .map((tag) => `<span class="tag">${tag}</span>`)
                      .join("")
                  : ""
              }
            </div>
            <a href="blog-details.html?post=${
              post.slug
            }" class="blog__item-readmore">
              Read More <i class="fa-solid fa-arrow-right"></i>
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
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * Render blog slider for homepage
   * @param {string} containerId - ID of container element
   * @param {number} limit - Maximum number of posts to display
   */
  async renderBlogSlider(containerId, limit = 3) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }

    try {
      await this.loadBlogData();
      const posts = this.getRecentPosts(limit);

      const blogCards = posts
        .map((post, index) => this.createBlogCard(post, index))
        .join("");

      container.innerHTML = blogCards;

      // Trigger entrance animations
      this.triggerEntranceAnimations(container);
    } catch (error) {
      console.error("Error rendering blog slider:", error);
      this.renderErrorState(container);
    }
  }

  /**
   * Render blog grid for blog page
   * @param {string} containerId - ID of container element
   */
  async renderBlogGrid(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }

    try {
      await this.loadBlogData();
      const posts = this.getPublishedPosts();

      const blogItems = posts
        .map((post) => this.createBlogGridItem(post))
        .join("");

      container.innerHTML = blogItems;
    } catch (error) {
      console.error("Error rendering blog grid:", error);
      this.renderErrorState(container);
    }
  }

  /**
   * Trigger entrance animations
   * @param {Element} container - Container element
   */
  triggerEntranceAnimations(container) {
    const items = container.querySelectorAll(".blog-2__item");
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
      <div class="blog-error">
        <p>Unable to load blog posts at this time.</p>
        <a href="blog.html" class="btn">View All Posts</a>
      </div>
    `;
  }
}

// Export for use in other modules
window.BlogShowcase = BlogShowcase;
