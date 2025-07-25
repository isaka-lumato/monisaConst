/**
 * Construction Cost Estimator - Main Calculator
 * Interactive cost calculation functionality
 */

class CostCalculator {
  constructor() {
    this.currentEstimate = new ProjectEstimate();
    this.pricingConfig = new PricingConfig();
    this.currentTab = "project-type";
    this.isInitialized = false;

    // Initialize synchronously to avoid loading issues
    this.initSync();
  }

  initSync() {
    try {
      // Load default configuration
      this.loadDefaultPricingConfig();

      // Initialize UI components
      this.initializeTabNavigation();
      this.initializeProjectTypeSelection();
      this.initializeDimensionsCalculator();
      this.initializeValidation();

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log("Cost Calculator initialized successfully");

      // Try to load external pricing config in background (non-blocking)
      this.loadPricingConfig().catch((error) => {
        console.warn(
          "Could not load external pricing config, using defaults:",
          error
        );
      });
    } catch (error) {
      console.error("Error initializing Cost Calculator:", error);
      this.initializeMinimal();
    }
  }

  initializeMinimal() {
    try {
      // Load default configuration
      this.loadDefaultPricingConfig();

      // Initialize only essential components
      this.initializeTabNavigation();
      this.initializeProjectTypeSelection();

      this.isInitialized = true;
      console.log("Cost Calculator initialized with minimal functionality");
    } catch (error) {
      console.error("Failed to initialize even minimal functionality:", error);
    }
  }

  async loadPricingConfig() {
    try {
      const response = await fetch("cost-estimator/data/pricing-config.json");
      if (!response.ok) {
        throw new Error("Failed to load pricing configuration");
      }
      const data = await response.json();

      // Update pricing config with loaded data
      this.pricingConfig.materials = data.materials;
      this.pricingConfig.labor = data.labor;
      this.pricingConfig.locationMultipliers = data.locationMultipliers;
      this.pricingConfig.projectTypeMultipliers = data.projectTypeMultipliers;

      console.log("Pricing configuration loaded successfully");
    } catch (error) {
      console.error("Error loading pricing config:", error);
      // Use default configuration if loading fails
      this.loadDefaultPricingConfig();
    }
  }

  loadDefaultPricingConfig() {
    // Load default pricing from CostEstimatorConfig
    this.pricingConfig.locationMultipliers =
      CostEstimatorConfig.locationMultipliers;
    this.pricingConfig.projectTypeMultipliers =
      CostEstimatorConfig.projectTypes;
    console.log("Using default pricing configuration");
  }

  initializeTabNavigation() {
    const navItems = document.querySelectorAll(".cost-estimator__nav-item");
    const tabs = document.querySelectorAll(".cost-estimator__tab");

    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        const tabId = item.getAttribute("data-tab");
        this.switchTab(tabId);
      });
    });
  }

  switchTab(tabId) {
    // Update navigation
    document.querySelectorAll(".cost-estimator__nav-item").forEach((item) => {
      item.classList.remove("active");
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add("active");

    // Update tab content
    document.querySelectorAll(".cost-estimator__tab").forEach((tab) => {
      tab.classList.remove("active");
    });
    document.getElementById(`${tabId}-tab`).classList.add("active");

    this.currentTab = tabId;

    // Trigger tab-specific initialization
    this.onTabSwitch(tabId);
  }

  onTabSwitch(tabId) {
    switch (tabId) {
      case "materials":
        this.populateMaterialCategories();
        break;
      case "labor":
        this.populateLaborCategories();
        break;
      case "timeline":
        this.generateTimeline();
        break;
      case "results":
        this.calculateFinalResults();
        break;
    }
  }

  initializeProjectTypeSelection() {
    const projectTypeCards = document.querySelectorAll(".project-type-card");
    const locationSelect = document.getElementById("project-location");
    const nextButton = document.getElementById("next-to-dimensions");

    // Project type selection
    projectTypeCards.forEach((card) => {
      card.addEventListener("click", () => {
        // Remove active class from all cards
        projectTypeCards.forEach((c) =>
          c.classList.remove("active", "border-primary")
        );

        // Add active class to selected card
        card.classList.add("active", "border-primary");

        // Update estimate
        const projectType = card.getAttribute("data-type");
        this.currentEstimate.projectType = projectType;

        // Enable next button if location is also selected
        this.validateProjectTypeTab();

        console.log("Project type selected:", projectType);
      });
    });

    // Location selection
    locationSelect.addEventListener("change", () => {
      this.currentEstimate.location = locationSelect.value;
      this.validateProjectTypeTab();
      console.log("Location selected:", locationSelect.value);
    });

    // Next button
    nextButton.addEventListener("click", () => {
      if (this.validateProjectTypeSelection()) {
        this.switchTab("dimensions");
      }
    });
  }

  validateProjectTypeTab() {
    const nextButton = document.getElementById("next-to-dimensions");
    const isValid =
      this.currentEstimate.projectType &&
      document.getElementById("project-location").value;

    nextButton.disabled = !isValid;

    if (isValid) {
      nextButton.classList.remove("disabled");
    } else {
      nextButton.classList.add("disabled");
    }
  }

  validateProjectTypeSelection() {
    const errors = [];

    if (!this.currentEstimate.projectType) {
      errors.push("Please select a project type");
    }

    if (!document.getElementById("project-location").value) {
      errors.push("Please select a project location");
    }

    if (errors.length > 0) {
      this.showError(errors.join(". "));
      return false;
    }

    this.clearMessages();
    return true;
  }

  initializeDimensionsCalculator() {
    const lengthInput = document.getElementById("project-length");
    const widthInput = document.getElementById("project-width");
    const heightInput = document.getElementById("project-height");
    const nextButton = document.getElementById("next-to-materials");
    const backButton = document.getElementById("back-to-project-type");

    // Create debounced calculation function
    const debouncedCalculate = CostEstimatorUtils.debounce(() => {
      this.calculateArea();
    }, CostEstimatorConfig.ui.debounceDelay);

    // Add input event listeners
    [lengthInput, widthInput, heightInput].forEach((input) => {
      input.addEventListener("input", debouncedCalculate);
      input.addEventListener("blur", () => this.validateDimensions());
    });

    // Navigation buttons
    nextButton.addEventListener("click", () => {
      if (this.validateDimensions()) {
        this.switchTab("materials");
      }
    });

    backButton.addEventListener("click", () => {
      this.switchTab("project-type");
    });
  }

  calculateArea() {
    const length =
      parseFloat(document.getElementById("project-length").value) || 0;
    const width =
      parseFloat(document.getElementById("project-width").value) || 0;
    const height =
      parseFloat(document.getElementById("project-height").value) || 0;

    // Update estimate dimensions
    this.currentEstimate.dimensions.length = length;
    this.currentEstimate.dimensions.width = width;
    this.currentEstimate.dimensions.height = height;

    // Calculate total area
    const totalArea = this.currentEstimate.calculateTotalArea();

    // Calculate additional metrics
    const perimeter = 2 * (length + width);
    const volume = length * width * height;
    const wallArea = this.calculateWallArea(length, width, height);

    // Update UI with comprehensive area information
    if (totalArea > 0) {
      document.getElementById("area-results").style.display = "block";
      document.getElementById("total-area").textContent =
        CostEstimatorUtils.formatNumber(totalArea);

      // Update additional area information
      this.updateAreaDetails(totalArea, perimeter, volume, wallArea);

      // Calculate and display estimated cost based on area
      this.calculateAreaBasedCost(totalArea);
    } else {
      document.getElementById("area-results").style.display = "none";
    }

    // Validate and enable/disable next button
    this.validateDimensionsTab();

    console.log("Area calculated:", {
      totalArea: totalArea,
      perimeter: perimeter,
      volume: volume,
      wallArea: wallArea,
    });
  }

  calculateWallArea(length, width, height) {
    // Calculate wall area (excluding floor and ceiling)
    return 2 * (length + width) * height;
  }

  updateAreaDetails(totalArea, perimeter, volume, wallArea) {
    // Create or update area details display
    let detailsContainer = document.getElementById("area-details");

    if (!detailsContainer) {
      detailsContainer = document.createElement("div");
      detailsContainer.id = "area-details";
      detailsContainer.className = "mt-3";

      const areaResults = document.getElementById("area-results");
      areaResults.appendChild(detailsContainer);
    }

    detailsContainer.innerHTML = `
      <div class="row g-3 mt-2">
        <div class="col-6 col-md-3">
          <div class="text-center">
            <div class="h6 mb-1 text-primary">${CostEstimatorUtils.formatNumber(
              totalArea
            )}</div>
            <small class="text-muted">Floor Area (m²)</small>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="text-center">
            <div class="h6 mb-1 text-primary">${CostEstimatorUtils.formatNumber(
              perimeter
            )}</div>
            <small class="text-muted">Perimeter (m)</small>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="text-center">
            <div class="h6 mb-1 text-primary">${CostEstimatorUtils.formatNumber(
              volume
            )}</div>
            <small class="text-muted">Volume (m³)</small>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="text-center">
            <div class="h6 mb-1 text-primary">${CostEstimatorUtils.formatNumber(
              wallArea
            )}</div>
            <small class="text-muted">Wall Area (m²)</small>
          </div>
        </div>
      </div>
    `;
  }

  calculateAreaBasedCost(totalArea) {
    if (!this.currentEstimate.projectType || totalArea <= 0) return;

    // Get project type configuration
    const projectConfig =
      CostEstimatorConfig.projectTypes[this.currentEstimate.projectType];
    if (!projectConfig) return;

    // Get location multiplier
    const location = document.getElementById("project-location").value;
    const locationMultiplier =
      CostEstimatorConfig.locationMultipliers[location]?.multiplier || 1.0;

    // Calculate base cost
    const baseCostPerSqFt = projectConfig.defaultPricePerSqFt;
    const estimatedCost = totalArea * baseCostPerSqFt * locationMultiplier;

    // Create or update cost estimate display
    let costContainer = document.getElementById("area-cost-estimate");

    if (!costContainer) {
      costContainer = document.createElement("div");
      costContainer.id = "area-cost-estimate";
      costContainer.className = "mt-4 p-3 bg-light rounded";

      const areaResults = document.getElementById("area-results");
      areaResults.appendChild(costContainer);
    }

    costContainer.innerHTML = `
      <div class="text-center">
        <h6 class="mb-2">Preliminary Cost Estimate</h6>
        <div class="h4 text-primary mb-2">${CostEstimatorUtils.formatCurrency(
          estimatedCost
        )}</div>
        <div class="small text-muted">
          Based on ${CostEstimatorUtils.formatCurrency(
            baseCostPerSqFt
          )}/m² for ${projectConfig.name}
          ${
            location !== "dar_es_salaam"
              ? ` with ${((locationMultiplier - 1) * 100).toFixed(
                  0
                )}% location adjustment`
              : ""
          }
        </div>
        <div class="small text-warning mt-2">
          <i class="fas fa-info-circle me-1"></i>
          This is a rough estimate. Continue for detailed calculation.
        </div>
      </div>
    `;

    // Store preliminary estimate
    this.preliminaryEstimate = estimatedCost;
  }

  validateDimensionsTab() {
    const nextButton = document.getElementById("next-to-materials");
    const isValid = this.validateDimensionsInput();

    nextButton.disabled = !isValid;

    if (isValid) {
      nextButton.classList.remove("disabled");
    } else {
      nextButton.classList.add("disabled");
    }
  }

  validateDimensions() {
    const length = parseFloat(document.getElementById("project-length").value);
    const width = parseFloat(document.getElementById("project-width").value);
    const height = parseFloat(document.getElementById("project-height").value);

    const errors = [];

    // Validate dimensions using config rules
    if (!CostEstimatorUtils.validateDimensions(length, width, height)) {
      const rules = CostEstimatorConfig.validation.dimensions;

      if (length < rules.minLength || length > rules.maxLength) {
        errors.push(
          `Length must be between ${rules.minLength} and ${rules.maxLength} meters`
        );
      }

      if (width < rules.minWidth || width > rules.maxWidth) {
        errors.push(
          `Width must be between ${rules.minWidth} and ${rules.maxWidth} meters`
        );
      }

      if (height < rules.minHeight || height > rules.maxHeight) {
        errors.push(
          `Height must be between ${rules.minHeight} and ${rules.maxHeight} meters`
        );
      }
    }

    // Update input field styles
    this.updateInputValidation(
      "project-length",
      length >= CostEstimatorConfig.validation.dimensions.minLength &&
        length <= CostEstimatorConfig.validation.dimensions.maxLength
    );
    this.updateInputValidation(
      "project-width",
      width >= CostEstimatorConfig.validation.dimensions.minWidth &&
        width <= CostEstimatorConfig.validation.dimensions.maxWidth
    );
    this.updateInputValidation(
      "project-height",
      height >= CostEstimatorConfig.validation.dimensions.minHeight &&
        height <= CostEstimatorConfig.validation.dimensions.maxHeight
    );

    if (errors.length > 0) {
      this.showError(errors.join(". "));
      return false;
    }

    this.clearMessages();
    return true;
  }

  validateDimensionsInput() {
    const length = parseFloat(document.getElementById("project-length").value);
    const width = parseFloat(document.getElementById("project-width").value);
    const height = parseFloat(document.getElementById("project-height").value);

    return (
      !isNaN(length) &&
      !isNaN(width) &&
      !isNaN(height) &&
      CostEstimatorUtils.validateDimensions(length, width, height)
    );
  }

  updateInputValidation(inputId, isValid) {
    const input = document.getElementById(inputId);

    // Remove existing validation classes
    input.classList.remove("error", "success");

    // Add appropriate validation class
    if (input.value) {
      if (isValid) {
        input.classList.add("success");
      } else {
        input.classList.add("error");
      }
    }
  }

  populateMaterialCategories() {
    const container = document.getElementById("material-categories");
    if (!container) return;

    container.innerHTML = "";

    // Get material categories from pricing config
    const categories =
      this.pricingConfig.materials || CostEstimatorConfig.materialCategories;

    Object.keys(categories).forEach((categoryKey) => {
      const category = categories[categoryKey];
      const categoryDiv = document.createElement("div");
      categoryDiv.className = "cost-estimator__item";

      categoryDiv.innerHTML = `
                <div class="cost-estimator__item-info">
                    <div class="cost-estimator__item-name">${
                      category.name || this.formatCategoryName(categoryKey)
                    }</div>
                    <div class="cost-estimator__item-description">Click to view materials</div>
                </div>
                <div class="cost-estimator__item-controls">
                    <button class="cost-estimator__btn cost-estimator__btn--outline btn-sm" 
                            onclick="calculator.showMaterialItems('${categoryKey}')">
                        View Items
                    </button>
                </div>
            `;

      container.appendChild(categoryDiv);
    });
  }

  populateLaborCategories() {
    const container = document.getElementById("labor-categories");
    if (!container) return;

    container.innerHTML = "";

    // Get labor categories from pricing config
    const categories =
      this.pricingConfig.labor || CostEstimatorConfig.laborCategories;

    Object.keys(categories).forEach((categoryKey) => {
      const category = categories[categoryKey];
      const categoryDiv = document.createElement("div");
      categoryDiv.className = "cost-estimator__item";

      categoryDiv.innerHTML = `
                <div class="cost-estimator__item-info">
                    <div class="cost-estimator__item-name">${
                      category.name || this.formatCategoryName(categoryKey)
                    }</div>
                    <div class="cost-estimator__item-description">Click to view labor types</div>
                </div>
                <div class="cost-estimator__item-controls">
                    <button class="cost-estimator__btn cost-estimator__btn--outline btn-sm" 
                            onclick="calculator.showLaborItems('${categoryKey}')">
                        View Types
                    </button>
                </div>
            `;

      container.appendChild(categoryDiv);
    });
  }

  formatCategoryName(categoryKey) {
    return categoryKey
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  generateTimeline() {
    const container = document.getElementById("project-timeline");
    if (!container) return;

    container.innerHTML = "";

    const phases = CostEstimatorConfig.timelinePhases;
    const totalCost = this.currentEstimate.calculateTotalCost();
    let currentDate = new Date();

    Object.keys(phases).forEach((phaseKey) => {
      const phase = phases[phaseKey];
      const phaseCost = totalCost * phase.costPercentage;

      const phaseDiv = document.createElement("div");
      phaseDiv.className = "cost-estimator__timeline-item";

      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + phase.durationDays);

      phaseDiv.innerHTML = `
                <div class="cost-estimator__timeline-phase">${phase.name}</div>
                <div class="cost-estimator__timeline-duration">
                    ${
                      phase.durationDays
                    } days (${currentDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})
                </div>
                <div class="cost-estimator__timeline-cost">${CostEstimatorUtils.formatCurrency(
                  phaseCost
                )}</div>
                <p class="text-muted mt-2">${phase.description}</p>
            `;

      container.appendChild(phaseDiv);

      // Update current date for next phase
      currentDate = new Date(endDate);
      currentDate.setDate(currentDate.getDate() + 1);
    });
  }

  calculateFinalResults() {
    const totalCost = this.currentEstimate.calculateTotalCost();
    const materialCost = this.currentEstimate.calculateMaterialCosts();
    const laborCost = this.currentEstimate.calculateLaborCosts();

    // Update total cost display
    document.getElementById("final-total-cost").textContent =
      CostEstimatorUtils.formatCurrency(totalCost);

    // Update breakdown table
    const tableBody = document.getElementById("cost-breakdown-table");
    if (tableBody) {
      tableBody.innerHTML = `
                <tr>
                    <td>Materials</td>
                    <td class="amount">${CostEstimatorUtils.formatCurrency(
                      materialCost
                    )}</td>
                    <td>${((materialCost / totalCost) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>Labor</td>
                    <td class="amount">${CostEstimatorUtils.formatCurrency(
                      laborCost
                    )}</td>
                    <td>${((laborCost / totalCost) * 100).toFixed(1)}%</td>
                </tr>
                <tr style="font-weight: bold; border-top: 2px solid #dee2e6;">
                    <td>Total</td>
                    <td class="amount">${CostEstimatorUtils.formatCurrency(
                      totalCost
                    )}</td>
                    <td>100%</td>
                </tr>
            `;
    }
  }

  setupEventListeners() {
    // Set up all remaining navigation buttons
    const navigationButtons = [
      { id: "back-to-dimensions", target: "dimensions" },
      { id: "next-to-labor", target: "labor" },
      { id: "back-to-materials", target: "materials" },
      { id: "next-to-timeline", target: "timeline" },
      { id: "back-to-labor", target: "labor" },
      { id: "next-to-results", target: "results" },
      { id: "back-to-timeline", target: "timeline" },
    ];

    navigationButtons.forEach((button) => {
      const element = document.getElementById(button.id);
      if (element) {
        element.addEventListener("click", () => {
          this.switchTab(button.target);
        });
      }
    });

    // Set up action buttons
    const saveButton = document.getElementById("save-estimate");
    const quoteButton = document.getElementById("request-quote");

    if (saveButton) {
      saveButton.addEventListener("click", () => this.saveEstimate());
    }

    if (quoteButton) {
      quoteButton.addEventListener("click", () => this.requestQuote());
    }
  }

  initializeValidation() {
    // Set up real-time validation for all form inputs
    const inputs = document.querySelectorAll(".cost-estimator__form-control");

    inputs.forEach((input) => {
      input.addEventListener("blur", () => {
        this.validateInput(input);
      });
    });
  }

  validateInput(input) {
    const value = input.value.trim();
    const inputType = input.type;
    const inputId = input.id;

    let isValid = true;
    let errorMessage = "";

    // Basic validation based on input type
    if (inputType === "number") {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        isValid = false;
        errorMessage = "Please enter a valid positive number";
      }
    }

    // Specific validation based on input ID
    if (inputId === "project-length" || inputId === "project-width") {
      const numValue = parseFloat(value);
      const rules = CostEstimatorConfig.validation.dimensions;
      if (numValue < rules.minLength || numValue > rules.maxLength) {
        isValid = false;
        errorMessage = `Value must be between ${rules.minLength} and ${rules.maxLength} meters`;
      }
    }

    if (inputId === "project-height") {
      const numValue = parseFloat(value);
      const rules = CostEstimatorConfig.validation.dimensions;
      if (numValue < rules.minHeight || numValue > rules.maxHeight) {
        isValid = false;
        errorMessage = `Height must be between ${rules.minHeight} and ${rules.maxHeight} meters`;
      }
    }

    // Update input styling
    this.updateInputValidation(inputId, isValid);

    // Show error message if needed
    if (!isValid && errorMessage) {
      this.showInputError(input, errorMessage);
    } else {
      this.clearInputError(input);
    }

    return isValid;
  }

  showInputError(input, message) {
    // Remove existing error message
    this.clearInputError(input);

    // Create error message element
    const errorDiv = document.createElement("div");
    errorDiv.className = "cost-estimator__input-error text-danger mt-1";
    errorDiv.textContent = message;
    errorDiv.style.fontSize = "0.875rem";

    // Insert after input
    input.parentNode.appendChild(errorDiv);
  }

  clearInputError(input) {
    const existingError = input.parentNode.querySelector(
      ".cost-estimator__input-error"
    );
    if (existingError) {
      existingError.remove();
    }
  }

  saveEstimate() {
    try {
      // Save to localStorage
      const estimateData = {
        estimate: this.currentEstimate,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(
        "monisa_cost_estimate",
        JSON.stringify(estimateData)
      );

      this.showSuccess("Estimate saved successfully!");
      console.log("Estimate saved to localStorage");
    } catch (error) {
      console.error("Error saving estimate:", error);
      this.showError("Failed to save estimate. Please try again.");
    }
  }

  requestQuote() {
    // This will be implemented in a later task
    // For now, redirect to contact page with estimate data
    const estimateData = encodeURIComponent(
      JSON.stringify({
        projectType: this.currentEstimate.projectType,
        totalArea: this.currentEstimate.dimensions.totalArea,
        totalCost: this.currentEstimate.calculateTotalCost(),
      })
    );

    window.location.href = `contact.html?estimate=${estimateData}`;
  }

  showError(message) {
    this.showMessage(message, "error");
  }

  showSuccess(message) {
    this.showMessage(message, "success");
  }

  showInfo(message) {
    this.showMessage(message, "info");
  }

  showMessage(message, type) {
    // Remove existing messages
    this.clearMessages();

    // Create message element
    const messageDiv = document.createElement("div");
    messageDiv.className = `cost-estimator__message cost-estimator__message--${type}`;
    messageDiv.innerHTML = `
            <i class="fas fa-${
              type === "error"
                ? "exclamation-triangle"
                : type === "success"
                ? "check-circle"
                : "info-circle"
            }"></i>
            <span>${message}</span>
        `;

    // Insert at the top of current tab content
    const currentTabContent = document.querySelector(
      ".cost-estimator__tab.active .cost-estimator__content, .cost-estimator__tab.active"
    );
    if (currentTabContent) {
      currentTabContent.insertBefore(messageDiv, currentTabContent.firstChild);
    }

    // Auto-remove success and info messages after 5 seconds
    if (type !== "error") {
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.remove();
        }
      }, 5000);
    }
  }

  clearMessages() {
    const messages = document.querySelectorAll(".cost-estimator__message");
    messages.forEach((message) => message.remove());
  }

  // Placeholder methods for material and labor item display
  showMaterialItems(categoryKey) {
    console.log("Show material items for category:", categoryKey);
    // This will be implemented in later tasks
    this.showInfo("Material selection will be available in the next update.");
  }

  showLaborItems(categoryKey) {
    console.log("Show labor items for category:", categoryKey);
    // This will be implemented in later tasks
    this.showInfo("Labor selection will be available in the next update.");
  }
}

// Ensure preloader is dismissed
window.addEventListener("load", function () {
  // Force dismiss preloader after 2 seconds if it's still showing
  setTimeout(function () {
    const preloader = document.getElementById("preloader");
    if (preloader) {
      preloader.style.display = "none";
    }
  }, 2000);
});

// Initialize calculator when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Force dismiss preloader immediately on DOM ready
  const preloader = document.getElementById("preloader");
  if (preloader) {
    setTimeout(() => {
      preloader.style.display = "none";
    }, 1000);
  }

  try {
    // Check if required dependencies are available
    if (typeof ProjectEstimate === "undefined") {
      console.error(
        "ProjectEstimate class not found. Make sure models.js is loaded."
      );
      // Still try to initialize with basic functionality
      initializeBasicCalculator();
      return;
    }

    if (typeof CostEstimatorConfig === "undefined") {
      console.error(
        "CostEstimatorConfig not found. Make sure config.js is loaded."
      );
      // Still try to initialize with basic functionality
      initializeBasicCalculator();
      return;
    }

    // Make calculator globally accessible
    window.calculator = new CostCalculator();
    console.log("Calculator initialized successfully");
  } catch (error) {
    console.error("Failed to initialize calculator:", error);
    initializeBasicCalculator();
  }
});

// Basic calculator initialization fallback
function initializeBasicCalculator() {
  console.log("Initializing basic calculator functionality");

  // Show error message
  const errorDiv = document.createElement("div");
  errorDiv.className = "alert alert-warning m-3";
  errorDiv.innerHTML = `
    <h5>Calculator Loading Issue</h5>
    <p>The cost calculator is loading with basic functionality. Some features may be limited.</p>
    <p>Please refresh the page to try again, or <a href="contact.html">contact us</a> for assistance.</p>
  `;

  const container = document.querySelector(".cost-estimator__container");
  if (container) {
    const content = container.querySelector(".cost-estimator__content");
    if (content) {
      content.insertBefore(errorDiv, content.firstChild);
    }
  }

  // Initialize basic tab navigation
  const navItems = document.querySelectorAll(".cost-estimator__nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab");

      // Update navigation
      navItems.forEach((nav) => nav.classList.remove("active"));
      this.classList.add("active");

      // Update tab content
      document.querySelectorAll(".cost-estimator__tab").forEach((tab) => {
        tab.classList.remove("active");
      });
      const targetTab = document.getElementById(tabId + "-tab");
      if (targetTab) {
        targetTab.classList.add("active");
      }
    });
  });
}

// Export for module use
if (typeof module !== "undefined" && module.exports) {
  module.exports = CostCalculator;
}
