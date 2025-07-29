// Simple animation trigger for project cards
document.addEventListener("DOMContentLoaded", function () {
  // console.log("Triggering project card animations...");

  // Find all project cards and trigger animations
  const projectCards = document.querySelectorAll(".project-card.animate-in");

  if (projectCards.length > 0) {
    // console.log(`Found ${projectCards.length} project cards to animate`);

    // Add a small delay to ensure CSS is loaded
    setTimeout(() => {
      projectCards.forEach((card, index) => {
        // Add the animation class with staggered timing
        setTimeout(() => {
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
          // console.log(`Animated card ${index + 1}`);
        }, index * 200);
      });
    }, 100);
  } else {
    // console.log("No project cards found to animate");
  }
});
