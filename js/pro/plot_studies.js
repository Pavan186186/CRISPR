// --- Study Points Visualization Logic ---

function plot_studies(globe_context, projection, study_points, mouse_pos) {
  if (!study_points || study_points.length === 0) {
    return null;
  }

  globe_context.save();

  let hovered_study = null;

  study_points.forEach((study) => {
    const coords = projection([study.lon, study.lat]);
    if (coords) {
      // Check if this point is near the mouse for hover effect
      const is_hovered =
        mouse_pos &&
        Math.abs(coords[0] - mouse_pos[0]) < 5 &&
        Math.abs(coords[1] - mouse_pos[1]) < 5;

      if (is_hovered) {
        hovered_study = study;
        globe_context.globalAlpha = 1;
        globe_context.shadowBlur = 15;
        globe_context.shadowColor = "#00ffaa";
        globe_context.fillStyle = "#ffffff";
        globe_context.strokeStyle = "#00ffaa";
        globe_context.lineWidth = 2;
      } else {
        globe_context.globalAlpha = 0.8;
        globe_context.shadowBlur = 4;
        globe_context.shadowColor = "#00ff88";
        globe_context.fillStyle = "#00ff88";
        globe_context.strokeStyle = "rgba(0,0,0,0.5)"; // slight outline for contrast
        globe_context.lineWidth = 0.5;
      }

      globe_context.beginPath();
      globe_context.arc(
        coords[0],
        coords[1],
        is_hovered ? 5 : 3,
        0,
        2 * Math.PI
      );
      globe_context.fill();
      globe_context.stroke();
    }
  });

  globe_context.restore();

  return hovered_study;
}
