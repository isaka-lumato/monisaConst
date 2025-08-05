/**
 * Project Advanced Filters
 * Adds multi-criteria filtering (price, size, floors, rooms) on the Projects page.
 */

(function () {
  // Attribute mapping for each known project title
  const projectAttributes = {
    "Luxury Villa Construction": { price: 450000, size: 3500, floors: 2, rooms: 4 },
    "Commercial Office Complex": { price: 850000, size: 15000, floors: 4, rooms: 0 },
    "Complete Home Renovation": { price: 180000, size: 2200, floors: 1, rooms: 3 },
    "Primary School Construction": { price: 620000, size: 8500, floors: 2, rooms: 12 },
    "Residential Apartment Block": { price: 720000, size: 12000, floors: 4, rooms: 20 },
    // Add new projects here as needed
  };

  document.addEventListener("DOMContentLoaded", () => {
    // Initialize noUiSlider sliders if library is present
    if (window.noUiSlider) {
      initRangeSlider("price-slider", 0, 1000000, [0, 1000000], ["filter-price-min", "filter-price-max"], "price-range-display", "$ ");
      initRangeSlider("size-slider", 0, 20000, [0, 20000], ["filter-size-min", "filter-size-max"], "size-range-display", "", " sq ft");
    }

    // Attach data attributes to each grid item based on the title
    document.querySelectorAll(".grid-item").forEach((item) => {
      const titleEl = item.querySelector(
        ".our-project__item-content-title a, .project-hover-title"
      );
      if (!titleEl) return;
      const title = titleEl.textContent.trim();
      const attrs = projectAttributes[title];
      if (attrs) {
        Object.keys(attrs).forEach((key) => {
          item.dataset[key] = String(attrs[key]);
        });
      }
    });

    // Cache filter input elements
    const filters = {
      priceMin: document.getElementById("filter-price-min"),
      priceMax: document.getElementById("filter-price-max"),
      sizeMin: document.getElementById("filter-size-min"),
      sizeMax: document.getElementById("filter-size-max"),
      floors: document.getElementById("filter-floors"),
      rooms: document.getElementById("filter-rooms"),
    };

    // Attach listeners to filter inputs
    Object.values(filters).forEach((input) => {
      if (input) {
        input.addEventListener("input", applyFilters);
      }
    });

    // Clear button
    const clearBtn = document.getElementById("filter-clear-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        Object.values(filters).forEach((i) => {
          if (i) i.value = "";
        });
        // Reset sliders if available
        if (window.noUiSlider) {
          const priceSlider = document.getElementById("price-slider");
          const sizeSlider = document.getElementById("size-slider");
          priceSlider?.noUiSlider?.set([0, 1000000]);
          sizeSlider?.noUiSlider?.set([0, 20000]);
        }
        applyFilters();
      });
    }

    // Initial filter state
    applyFilters();
  });

  /**
   * Helper to create a slider and bind hidden inputs + display
   */
  function initRangeSlider(elemId, min, max, start, hiddenIds, displayId, prefix = "", suffix = "") {
    const sliderElem = document.getElementById(elemId);
    if (!sliderElem) return;
    noUiSlider.create(sliderElem, {
      start,
      connect: true,
      range: { min, max },
      step: 1000,
      tooltips: false,
      format: {
        to: (v) => Math.round(v),
        from: (v) => Number(v),
      },
    });
    const [minInputId, maxInputId] = hiddenIds;
    const minInput = document.getElementById(minInputId);
    const maxInput = document.getElementById(maxInputId);
    const displayEl = document.getElementById(displayId);
    sliderElem.noUiSlider.on("update", (values) => {
      const [val1, val2] = values.map((v) => Math.round(v));
      if (minInput) minInput.value = val1;
      if (maxInput) maxInput.value = val2;
      if (displayEl) displayEl.textContent = `${prefix}${val1.toLocaleString()} - ${prefix}${val2.toLocaleString()}${suffix}`;
      applyFilters();
    });
  }

  /**
   * Apply current filters to project grid items
   */
  function saveFilterState(state){
    try{ localStorage.setItem('projectFilters', JSON.stringify(state)); }catch(e){}
  }
  function getSavedFilterState(){
    try{ return JSON.parse(localStorage.getItem('projectFilters')||'null'); }catch(e){return null;}
  }

  function applyFilters() {
    const priceMin = parseFloat(document.getElementById("filter-price-min")?.value) || 0;
    const priceMax = parseFloat(document.getElementById("filter-price-max")?.value) || Infinity;
    const sizeMin = parseFloat(document.getElementById("filter-size-min")?.value) || 0;
    const sizeMax = parseFloat(document.getElementById("filter-size-max")?.value) || Infinity;
    const floorsFilter = parseInt(document.getElementById("filter-floors")?.value) || null;
    const roomsFilter = parseInt(document.getElementById("filter-rooms")?.value) || null;

    document.querySelectorAll(".grid-item").forEach((item) => {
      const price = parseFloat(item.dataset.price || "0");
      const size = parseFloat(item.dataset.size || "0");
      const floors = parseInt(item.dataset.floors || "0");
      const rooms = parseInt(item.dataset.rooms || "0");

      let visible = true;
      if (price < priceMin || price > priceMax) visible = false;
      if (size < sizeMin || size > sizeMax) visible = false;
      if (floorsFilter && floors !== floorsFilter) visible = false;
      if (roomsFilter && rooms !== roomsFilter) visible = false;

      item.style.display = visible ? "" : "none";
    });

    // Trigger Isotope re-layout if available (prevents empty gaps)
    if (window.$ && $.fn.isotope) {
      const $grid = $(".grid");
      if ($grid.length) {
        $grid.isotope("layout");
      }
    }

    // save current filter state
    const state={
      priceMin,priceMax,sizeMin,sizeMax,floorsFilter,roomsFilter
    };
    saveFilterState(state);
  }
})();
