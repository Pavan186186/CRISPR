/**
 * Visualization 4: Clinical Trials Global Distribution - Animated Temporal Map
 * Shows CRISPR clinical trials appearing over time on a world map
 * Data: temporal_map_data.json (NCT ID, Title, Year, City, Country, Lat, Lon, Status, Enrollment)
 */

let temporalMapState = {
  data: null,
  currentYear: 2015,
  isPlaying: false,
  playInterval: null,
  svg: null,
  projection: null,
  path: null,
  tooltip: null,
};

/**
 * Initialize the temporal map visualization
 */
async function initTemporalMap() {
  const container = document.getElementById("temporal-map-container");
  if (!container) {
    console.error("Temporal map container not found");
    return;
  }

  // Load data
  try {
    const [studiesData, worldData] = await Promise.all([
      d3.json("../data/processed/temporal_map_data.json"),
      d3.json("../data/processed/world-110m.json"),
    ]);

    temporalMapState.data = studiesData;
    createTemporalMapViz(container, studiesData, worldData);
  } catch (error) {
    console.error("Error loading temporal map data:", error);
    container.innerHTML =
      '<p style="color: #ff6b6b;">Error loading data. Please check console.</p>';
  }
}

/**
 * Create the temporal map visualization
 */
function createTemporalMapViz(container, studiesData, worldData) {
  // Clear existing content
  container.innerHTML = "";

  // Set up dimensions
  const width = container.offsetWidth || 1000;
  const height = 600;

  // Create SVG
  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#0a192f");

  temporalMapState.svg = svg;

  // Create projection
  const projection = d3
    .geoNaturalEarth1()
    .fitSize(
      [width, height],
      topojson.feature(worldData, worldData.objects.countries)
    );

  const path = d3.geoPath().projection(projection);

  temporalMapState.projection = projection;
  temporalMapState.path = path;

  // Draw world map
  const countries = topojson.feature(worldData, worldData.objects.countries);

  svg
    .append("g")
    .selectAll("path")
    .data(countries.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "#1e3a5f")
    .attr("stroke", "#2dfaff")
    .attr("stroke-width", 0.5)
    .attr("opacity", 0.6);

  // Create study points group
  const studyPointsGroup = svg.append("g").attr("class", "study-points");

  // Create tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "temporal-map-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "rgba(0, 0, 0, 0.9)")
    .style("color", "#2dfaff")
    .style("padding", "12px")
    .style("border-radius", "8px")
    .style("border", "1px solid #2dfaff")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", "10000")
    .style("max-width", "300px");

  temporalMapState.tooltip = tooltip;

  // Get year range
  const years = Array.from(new Set(studiesData.map((d) => d.year))).sort();
  const minYear = years[0];
  const maxYear = years[years.length - 1];

  // Create controls container
  const controlsDiv = d3
    .select(container)
    .append("div")
    .attr("class", "temporal-map-controls")
    .style("margin-top", "20px")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "20px")
    .style("flex-wrap", "wrap");

  // Play/Pause button
  const playButton = controlsDiv
    .append("button")
    .attr("id", "temporal-play-btn")
    .style("padding", "10px 20px")
    .style("background", "#2dfaff")
    .style("color", "#0a192f")
    .style("border", "none")
    .style("border-radius", "4px")
    .style("cursor", "pointer")
    .style("font-family", '"Courier New", monospace')
    .style("font-weight", "bold")
    .text("▶ PLAY");

  // Year slider
  const sliderContainer = controlsDiv
    .append("div")
    .style("flex", "1")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "10px");

  sliderContainer
    .append("label")
    .style("color", "#2dfaff")
    .style("font-family", '"Courier New", monospace')
    .text("Year:");

  const yearSlider = sliderContainer
    .append("input")
    .attr("type", "range")
    .attr("min", minYear)
    .attr("max", maxYear)
    .attr("value", minYear)
    .attr("step", 1)
    .attr("id", "year-slider")
    .style("flex", "1")
    .style("cursor", "pointer");

  const yearLabel = sliderContainer
    .append("span")
    .attr("id", "year-label")
    .style("color", "#2dfaff")
    .style("font-family", '"Courier New", monospace')
    .style("font-weight", "bold")
    .style("font-size", "18px")
    .style("min-width", "60px")
    .text(minYear);

  // Study counter
  const studyCounter = controlsDiv
    .append("div")
    .attr("id", "study-counter")
    .style("color", "#2dfaff")
    .style("font-family", '"Courier New", monospace')
    .style("font-weight", "bold")
    .text("Studies: 0");

  // Update function
  function updateMap(year) {
    temporalMapState.currentYear = year;
    yearLabel.text(year);

    // Filter studies up to current year (cumulative)
    const visibleStudies = studiesData.filter((d) => d.year <= year);
    studyCounter.text(`Studies: ${visibleStudies.length}`);

    // Update study points
    const circles = studyPointsGroup
      .selectAll("circle")
      .data(visibleStudies, (d) => d.nctId);

    // Enter new circles
    circles
      .enter()
      .append("circle")
      .attr("cx", (d) => projection([d.lon, d.lat])[0])
      .attr("cy", (d) => projection([d.lon, d.lat])[1])
      .attr("r", 0)
      .attr("fill", "#ff6b6b")
      .attr("stroke", "#ffd700")
      .attr("stroke-width", 1)
      .attr("opacity", 0.8)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 8).attr("stroke-width", 2);

        tooltip.style("visibility", "visible").html(`
            <strong>${d.nctId}</strong><br/>
            <strong>${d.title}</strong><br/>
            📍 ${d.city}, ${d.country}<br/>
            📅 Year: ${d.year}<br/>
            👥 Enrollment: ${d.enrollment}<br/>
            🔬 Phase: ${d.phase}<br/>
            📊 Status: ${d.status}
          `);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", event.pageY + 15 + "px")
          .style("left", event.pageX + 15 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 5).attr("stroke-width", 1);

        tooltip.style("visibility", "hidden");
      })
      .transition()
      .duration(500)
      .attr("r", 5);

    // Exit old circles (shouldn't happen in cumulative view)
    circles.exit().transition().duration(300).attr("r", 0).remove();
  }

  // Slider change handler
  yearSlider.on("input", function () {
    const year = +this.value;
    updateMap(year);
    if (temporalMapState.isPlaying) {
      stopAnimation();
    }
  });

  // Play/Pause functionality
  playButton.on("click", function () {
    if (temporalMapState.isPlaying) {
      stopAnimation();
    } else {
      startAnimation();
    }
  });

  function startAnimation() {
    temporalMapState.isPlaying = true;
    playButton.text("⏸ PAUSE");

    temporalMapState.playInterval = setInterval(() => {
      let nextYear = temporalMapState.currentYear + 1;

      if (nextYear > maxYear) {
        nextYear = minYear; // Loop back
      }

      yearSlider.property("value", nextYear);
      updateMap(nextYear);
    }, 1000); // Advance 1 year per second
  }

  function stopAnimation() {
    temporalMapState.isPlaying = false;
    playButton.text("▶ PLAY");

    if (temporalMapState.playInterval) {
      clearInterval(temporalMapState.playInterval);
      temporalMapState.playInterval = null;
    }
  }

  // Initial render
  updateMap(minYear);
}

/**
 * Cleanup function
 */
function cleanupTemporalMap() {
  if (temporalMapState.playInterval) {
    clearInterval(temporalMapState.playInterval);
  }
  if (temporalMapState.tooltip) {
    temporalMapState.tooltip.remove();
  }
  temporalMapState = {
    data: null,
    currentYear: 2015,
    isPlaying: false,
    playInterval: null,
    svg: null,
    projection: null,
    path: null,
    tooltip: null,
  };
}
