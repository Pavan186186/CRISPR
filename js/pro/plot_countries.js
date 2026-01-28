// --- Country Borders Visualization Logic ---

function plot_countries(
  globe_context,
  projection,
  path_generator,
  country_features
) {
  if (!country_features || country_features.length === 0) {
    return;
  }

  globe_context.save();

  country_features.forEach((feature) => {
    globe_context.beginPath();
    path_generator(feature);

    // Fill with a subtle neon blue color for pro theme
    globe_context.fillStyle = "rgba(45, 250, 255, 0.08)";
    globe_context.fill();

    // Draw borders with a visible neon stroke
    globe_context.strokeStyle = "#2dfaff";
    globe_context.lineWidth = 0.6;
    globe_context.stroke();
  });

  globe_context.restore();
}
