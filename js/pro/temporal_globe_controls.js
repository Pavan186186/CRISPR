/**
 * Temporal Globe Controls
 * Adds timeline controls to the globe for the temporal map visualization
 * Shows 711 studies appearing over time on the 3D globe
 */

let temporalGlobeState = {
  allStudies: [],
  currentYear: 2015,
  isPlaying: false,
  playInterval: null,
  minYear: 2015,
  maxYear: 2025,
};

/**
 * Load temporal map data and integrate with globe
 */
async function loadTemporalMapData() {
  try {
    const data = await d3.json("../data/processed/temporal_map_data.json");
    temporalGlobeState.allStudies = data;

    // Get year range
    const years = data.map((d) => d.year);
    temporalGlobeState.minYear = Math.min(...years);
    temporalGlobeState.maxYear = Math.max(...years);
    temporalGlobeState.currentYear = temporalGlobeState.minYear;

    console.log(
      `[temporal-globe] Loaded ${data.length} studies (${temporalGlobeState.minYear}-${temporalGlobeState.maxYear})`
    );

    return data;
  } catch (error) {
    console.error("[temporal-globe] Error loading data:", error);
    return [];
  }
}

/**
 * Create timeline controls UI overlay
 */
function createTemporalGlobeControls() {
  // Check if controls already exist
  if (document.getElementById("temporal-globe-controls")) {
    return;
  }

  // Create controls container
  const controlsDiv = d3
    .select("body")
    .append("div")
    .attr("id", "temporal-globe-controls")
    .style("position", "fixed")
    .style("bottom", "40px")
    .style("left", "50%")
    .style("transform", "translateX(-50%)")
    .style("z-index", "200")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("padding", "20px 30px")
    .style("border-radius", "12px")
    .style("border", "2px solid #2dfaff")
    .style("backdrop-filter", "blur(10px)")
    .style("display", "none") // Hidden by default
    .style("flex-direction", "column")
    .style("gap", "15px")
    .style("min-width", "600px")
    .style("box-shadow", "0 0 30px rgba(45, 250, 255, 0.3)");

  // Title
  controlsDiv
    .append("div")
    .style("color", "#2dfaff")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("text-align", "center")
    .style("margin-bottom", "5px")
    .text("🌍 GLOBAL CRISPR RESEARCH TIMELINE");

  // Stats row
  const statsRow = controlsDiv
    .append("div")
    .style("display", "flex")
    .style("justify-content", "space-between")
    .style("color", "#00ff88")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "12px")
    .style("margin-bottom", "10px");

  statsRow
    .append("span")
    .attr("id", "temporal-year-display")
    .style("font-weight", "bold")
    .style("font-size", "18px")
    .text("2015");

  statsRow
    .append("span")
    .attr("id", "temporal-count-display")
    .text("Studies: 0");

  // Controls row
  const controlsRow = controlsDiv
    .append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "15px");

  // Play/Pause button
  const playButton = controlsRow
    .append("button")
    .attr("id", "temporal-play-btn")
    .style("padding", "8px 16px")
    .style("background", "#2dfaff")
    .style("color", "#0a192f")
    .style("border", "none")
    .style("border-radius", "6px")
    .style("cursor", "pointer")
    .style("font-family", '"Courier New", monospace')
    .style("font-weight", "bold")
    .style("font-size", "14px")
    .style("transition", "all 0.2s")
    .text("▶ PLAY")
    .on("click", togglePlayback)
    .on("mouseover", function () {
      d3.select(this).style("background", "#00ff88");
    })
    .on("mouseout", function () {
      d3.select(this).style("background", "#2dfaff");
    });

  // Slider container
  const sliderContainer = controlsRow
    .append("div")
    .style("flex", "1")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "10px");

  sliderContainer
    .append("span")
    .style("color", "#2dfaff")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "12px")
    .text(temporalGlobeState.minYear);

  // Year slider
  const yearSlider = sliderContainer
    .append("input")
    .attr("type", "range")
    .attr("id", "temporal-year-slider")
    .attr("min", temporalGlobeState.minYear)
    .attr("max", temporalGlobeState.maxYear)
    .attr("value", temporalGlobeState.minYear)
    .attr("step", 1)
    .style("flex", "1")
    .style("cursor", "pointer")
    .style("accent-color", "#2dfaff")
    .on("input", function () {
      const year = +this.value;
      updateTemporalGlobeYear(year);
      if (temporalGlobeState.isPlaying) {
        stopPlayback();
      }
    });

  sliderContainer
    .append("span")
    .style("color", "#2dfaff")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "12px")
    .text(temporalGlobeState.maxYear);

  console.log("[temporal-globe] Controls created");
}

/**
 * Show temporal globe controls
 */
function showTemporalGlobeControls() {
  // Hide the old floating controls (keep them hidden)
  d3.select("#temporal-globe-controls").style("display", "none");

  // Shift globe canvas left to avoid overlap with text card
  d3.select("#globe-canvas").classed("shift-left", true);

  // Wire up the integrated controls
  const playBtn = d3.select("#temporal-play-btn-integrated");
  const yearSlider = d3.select("#temporal-year-slider-integrated");

  if (!playBtn.empty()) {
    playBtn.on("click", togglePlaybackIntegrated);
  }

  if (!yearSlider.empty()) {
    yearSlider
      .attr("min", temporalGlobeState.minYear)
      .attr("max", temporalGlobeState.maxYear)
      .attr("value", temporalGlobeState.minYear)
      .on("input", function () {
        const year = +this.value;
        updateTemporalGlobeYearIntegrated(year);
        if (temporalGlobeState.isPlaying) {
          stopPlaybackIntegrated();
        }
      });
  }

  // Initialize with first year
  updateTemporalGlobeYearIntegrated(temporalGlobeState.minYear);
}

/**
 * Update globe year for integrated controls
 */
function updateTemporalGlobeYearIntegrated(year) {
  temporalGlobeState.currentYear = year;

  // Update integrated UI
  d3.select("#temporal-year-display-integrated").text(year);
  d3.select("#temporal-year-slider-integrated").property("value", year);

  // Filter studies up to this year (cumulative view)
  const visibleStudies = temporalGlobeState.allStudies.filter(
    (s) => s.year <= year
  );

  // Update count
  d3.select("#temporal-count-display-integrated").text(
    `Studies: ${visibleStudies.length}`
  );

  // Update global study_points variable
  study_points = visibleStudies.map((s, index) => {
    const seed = s.nctId ? hashString(s.nctId) : index;
    const jittered = addJitter(s.lat, s.lon, seed);

    return {
      year: s.year,
      lat: jittered.lat,
      lon: jittered.lon,
      country: s.country,
      city: s.city,
      title: s.title,
      nctId: s.nctId,
      status: s.status,
      enrollment: s.enrollment,
      phase: s.phase,
    };
  });

  // Trigger globe redraw
  if (typeof redraw_globe === "function") {
    redraw_globe();
  }
}

/**
 * Toggle playback for integrated controls
 */
function togglePlaybackIntegrated() {
  if (temporalGlobeState.isPlaying) {
    stopPlaybackIntegrated();
  } else {
    startPlaybackIntegrated();
  }
}

/**
 * Start playback for integrated controls
 */
function startPlaybackIntegrated() {
  temporalGlobeState.isPlaying = true;
  d3.select("#temporal-play-btn-integrated").text("⏸ PAUSE");

  temporalGlobeState.playInterval = setInterval(() => {
    let nextYear = temporalGlobeState.currentYear + 1;

    if (nextYear > temporalGlobeState.maxYear) {
      nextYear = temporalGlobeState.minYear;
    }

    updateTemporalGlobeYearIntegrated(nextYear);
  }, 1000);
}

/**
 * Stop playback for integrated controls
 */
function stopPlaybackIntegrated() {
  temporalGlobeState.isPlaying = false;
  d3.select("#temporal-play-btn-integrated").text("▶ PLAY");

  if (temporalGlobeState.playInterval) {
    clearInterval(temporalGlobeState.playInterval);
    temporalGlobeState.playInterval = null;
  }
}

/**
 * Hide temporal globe controls
 */
function hideTemporalGlobeControls() {
  stopPlaybackIntegrated();
  // Remove globe shift
  d3.select("#globe-canvas").classed("shift-left", false);
  // Old controls are already hidden, nothing more to do
}

/**
 * Add random jitter to coordinates to prevent overlapping points
 * Jitter is small enough to keep points in the same city/country area
 */
function addJitter(lat, lon, seed) {
  // Use seed (nctId hash or index) for consistent jitter per study
  const jitterAmount = 0.3; // ~33 km at equator

  // Create pseudo-random offset based on seed
  const randomLat = (Math.sin(seed * 12.9898) * 43758.5453) % 1;
  const randomLon = (Math.sin(seed * 78.233) * 43758.5453) % 1;

  // Apply jitter in range [-jitterAmount, +jitterAmount]
  const jitterLat = (randomLat - 0.5) * 2 * jitterAmount;
  const jitterLon = (randomLon - 0.5) * 2 * jitterAmount;

  return {
    lat: lat + jitterLat,
    lon: lon + jitterLon,
  };
}

/**
 * Create seed from string (for consistent jitter)
 */
function hashString(str) {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Update globe to show studies up to a specific year (cumulative)
 */
function updateTemporalGlobeYear(year) {
  temporalGlobeState.currentYear = year;

  // Update UI
  d3.select("#temporal-year-display").text(year);
  d3.select("#temporal-year-slider").property("value", year);

  // Filter studies up to this year (cumulative view)
  const visibleStudies = temporalGlobeState.allStudies.filter(
    (s) => s.year <= year
  );

  // Update count
  d3.select("#temporal-count-display").text(
    `Studies: ${visibleStudies.length}`
  );

  // Update global study_points variable used by the globe (without window prefix)
  // The main.js expects a global variable called study_points
  // Add jitter to prevent overlapping points in same location
  study_points = visibleStudies.map((s, index) => {
    // Create seed from nctId for consistent jitter
    const seed = s.nctId ? hashString(s.nctId) : index;
    const jittered = addJitter(s.lat, s.lon, seed);

    return {
      year: s.year,
      lat: jittered.lat,
      lon: jittered.lon,
      country: s.country,
      city: s.city,
      title: s.title,
      nctId: s.nctId,
      status: s.status,
      enrollment: s.enrollment,
      phase: s.phase,
    };
  });

  console.log(
    `[temporal-globe] Updated study_points: ${study_points.length} visible`
  );

  // Trigger globe redraw if available
  if (typeof redraw_globe === "function") {
    redraw_globe();
  }
}

/**
 * Toggle playback
 */
function togglePlayback() {
  if (temporalGlobeState.isPlaying) {
    stopPlayback();
  } else {
    startPlayback();
  }
}

/**
 * Start auto-playback animation
 */
function startPlayback() {
  temporalGlobeState.isPlaying = true;
  d3.select("#temporal-play-btn").text("⏸ PAUSE");

  temporalGlobeState.playInterval = setInterval(() => {
    let nextYear = temporalGlobeState.currentYear + 1;

    if (nextYear > temporalGlobeState.maxYear) {
      // Loop back to start
      nextYear = temporalGlobeState.minYear;
    }

    updateTemporalGlobeYear(nextYear);
  }, 1000); // Advance 1 year per second
}

/**
 * Stop auto-playback animation
 */
function stopPlayback() {
  temporalGlobeState.isPlaying = false;
  d3.select("#temporal-play-btn").text("▶ PLAY");

  if (temporalGlobeState.playInterval) {
    clearInterval(temporalGlobeState.playInterval);
    temporalGlobeState.playInterval = null;
  }
}

/**
 * Initialize temporal globe integration
 */
async function initTemporalGlobe() {
  console.log("[temporal-globe] Initializing...");

  // Load data
  const data = await loadTemporalMapData();

  if (data.length === 0) {
    console.warn("[temporal-globe] No data loaded");
    return;
  }

  // Create controls
  createTemporalGlobeControls();

  console.log("[temporal-globe] Ready");
}

/**
 * Cleanup function
 */
function cleanupTemporalGlobe() {
  hideTemporalGlobeControls();

  // Remove controls
  d3.select("#temporal-globe-controls").remove();

  // Reset state
  temporalGlobeState = {
    allStudies: [],
    currentYear: 2015,
    isPlaying: false,
    playInterval: null,
    minYear: 2015,
    maxYear: 2025,
  };
}
