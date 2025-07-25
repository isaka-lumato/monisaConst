/**
 * Construction Cost Estimator - Data Models
 * Core data structures and model definitions
 */

// Project Estimate Model
class ProjectEstimate {
  constructor() {
    this.id = this.generateId();
    this.projectType = "";
    this.dimensions = {
      length: 0,
      width: 0,
      height: 0,
      totalArea: 0,
    };
    this.materials = [];
    this.labor = {
      skillLevels: [],
      totalLaborCost: 0,
    };
    this.timeline = [];
    this.totalCost = 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  generateId() {
    return "est_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  updateTimestamp() {
    this.updatedAt = new Date();
  }

  calculateTotalArea() {
    this.dimensions.totalArea = this.dimensions.length * this.dimensions.width;
    this.updateTimestamp();
    return this.dimensions.totalArea;
  }

  addMaterial(material) {
    this.materials.push(material);
    this.updateTimestamp();
  }

  removeMaterial(index) {
    if (index >= 0 && index < this.materials.length) {
      this.materials.splice(index, 1);
      this.updateTimestamp();
    }
  }

  calculateMaterialCosts() {
    return this.materials.reduce((total, material) => {
      return total + material.quantity * material.unitPrice;
    }, 0);
  }

  calculateLaborCosts() {
    this.labor.totalLaborCost = this.labor.skillLevels.reduce(
      (total, skill) => {
        return total + skill.hours * skill.rate;
      },
      0
    );
    return this.labor.totalLaborCost;
  }

  calculateTotalCost() {
    const materialCost = this.calculateMaterialCosts();
    const laborCost = this.calculateLaborCosts();
    this.totalCost = materialCost + laborCost;
    this.updateTimestamp();
    return this.totalCost;
  }
}

// Material Model
class Material {
  constructor(category, item, quantity, unit, unitPrice) {
    this.category = category;
    this.item = item;
    this.quantity = quantity || 0;
    this.unit = unit;
    this.unitPrice = unitPrice || 0;
    this.totalCost = this.quantity * this.unitPrice;
  }

  updateQuantity(newQuantity) {
    this.quantity = newQuantity;
    this.totalCost = this.quantity * this.unitPrice;
  }

  updatePrice(newPrice) {
    this.unitPrice = newPrice;
    this.totalCost = this.quantity * this.unitPrice;
  }
}

// Labor Skill Model
class LaborSkill {
  constructor(type, hours, rate) {
    this.type = type;
    this.hours = hours || 0;
    this.rate = rate || 0;
    this.cost = this.hours * this.rate;
  }

  updateHours(newHours) {
    this.hours = newHours;
    this.cost = this.hours * this.rate;
  }

  updateRate(newRate) {
    this.rate = newRate;
    this.cost = this.hours * this.rate;
  }
}

// Timeline Phase Model
class TimelinePhase {
  constructor(phase, duration, cost, startDate) {
    this.phase = phase;
    this.duration = duration || 0;
    this.cost = cost || 0;
    this.startDate = startDate || new Date();
    this.endDate = this.calculateEndDate();
  }

  calculateEndDate() {
    const end = new Date(this.startDate);
    end.setDate(end.getDate() + this.duration);
    return end;
  }

  updateDuration(newDuration) {
    this.duration = newDuration;
    this.endDate = this.calculateEndDate();
  }
}

// Quote Request Model
class QuoteRequest {
  constructor() {
    this.id = this.generateId();
    this.customerInfo = {
      name: "",
      email: "",
      phone: "",
      address: "",
    };
    this.projectDetails = {
      type: "",
      description: "",
      location: "",
      preferredStartDate: null,
      budgetRange: "",
    };
    this.estimate = null;
    this.status = "pending";
    this.submittedAt = new Date();
    this.responseDeadline = this.calculateResponseDeadline();
  }

  generateId() {
    return (
      "quote_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  calculateResponseDeadline() {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 3); // 3 days response time
    return deadline;
  }

  setEstimate(projectEstimate) {
    this.estimate = projectEstimate;
  }

  updateStatus(newStatus) {
    this.status = newStatus;
  }
}

// Pricing Configuration Model
class PricingConfig {
  constructor() {
    this.materials = {};
    this.labor = {};
    this.locationMultipliers = {
      dar_es_salaam: 1.0,
      arusha: 0.9,
      mwanza: 0.85,
      dodoma: 0.8,
      other: 0.75,
    };
    this.projectTypeMultipliers = {
      residential: 1.0,
      commercial: 1.2,
      renovation: 0.9,
    };
    this.lastUpdated = new Date();
  }

  updateMaterialPrice(category, item, newPrice) {
    if (!this.materials[category]) {
      this.materials[category] = {};
    }
    if (!this.materials[category][item]) {
      this.materials[category][item] = {};
    }
    this.materials[category][item].basePrice = newPrice;
    this.materials[category][item].lastUpdated = new Date();
    this.lastUpdated = new Date();
  }

  updateLaborRate(skillLevel, newRate) {
    if (!this.labor[skillLevel]) {
      this.labor[skillLevel] = {};
    }
    this.labor[skillLevel].hourlyRate = newRate;
    this.labor[skillLevel].lastUpdated = new Date();
    this.lastUpdated = new Date();
  }

  getMaterialPrice(category, item) {
    if (this.materials[category] && this.materials[category][item]) {
      return this.materials[category][item].basePrice || 0;
    }
    return 0;
  }

  getLaborRate(skillLevel) {
    if (this.labor[skillLevel]) {
      return this.labor[skillLevel].hourlyRate || 0;
    }
    return 0;
  }
}

// Export models for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ProjectEstimate,
    Material,
    LaborSkill,
    TimelinePhase,
    QuoteRequest,
    PricingConfig,
  };
}
