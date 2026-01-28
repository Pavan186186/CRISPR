// 1. setup
const canvas = d3.select("#globe-canvas").node();
const context = canvas.getContext("2d");

const width = window.innerWidth;
const height = window.innerHeight;
canvas.width = width;
canvas.height = height;

const rotation_speed = 0.002;
let auto_rotate_timer;
let last_time = 0;
let is_dragging = false;
let vx = rotation_speed; // Velocity X (starts at auto-rotate speed)
let vy = 0; // Velocity Y
let land_particles = [];
let country_features = [];
let study_points = [];
let time_sorted_studies = [];
let all_years = [];
let studies_by_year = {};
let current_year_index = 0;
let is_timeline_active = false;
let is_countries_active = false;
let current_mouse_pos = null;
let hovered_study = null;

// 2. projection
const projection = d3
  .geoOrthographic()
  .scale(Math.min(width, height) / 2.2)
  .translate([width / 2, height / 2])
  .clipAngle(90);

const path = d3.geoPath(projection, context);
const graticule = d3.geoGraticule10();

// 3. gradients (for area charts)
const defs = d3
  .select("body")
  .append("svg")
  .attr("width", 0)
  .attr("height", 0)
  .append("defs");

const area_gradient = defs
  .append("linearGradient")
  .attr("id", "area-gradient")
  .attr("x1", "0%")
  .attr("y1", "0%")
  .attr("x2", "0%")
  .attr("y2", "100%");
area_gradient
  .append("stop")
  .attr("offset", "0%")
  .attr("stop-color", "#2dfaff")
  .attr("stop-opacity", 0.6);
area_gradient
  .append("stop")
  .attr("offset", "100%")
  .attr("stop-color", "#050a14")
  .attr("stop-opacity", 0.1);

// Tooltip for study points
let globe_tooltip = d3.select("body").select(".globe-tooltip");
if (globe_tooltip.empty()) {
  globe_tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "globe-tooltip");
}

// 4. animation loop
function animate(elapsed) {
  const dt = elapsed - last_time;
  last_time = elapsed;

  if (!is_dragging) {
    // Apply momentum
    const current_rotate = projection.rotate();
    projection.rotate([
      current_rotate[0] + vx * dt,
      current_rotate[1] + vy * dt,
      current_rotate[2],
    ]);

    // Smoothly decay velocity back to default
    // vx decays towards rotation_speed (auto-rotate)
    // vy decays towards 0
    const friction = 0.96;
    vx = vx * friction + rotation_speed * (1 - friction);
    vy = vy * friction;
  }
  redraw_globe();
}

function redraw_globe() {
  context.clearRect(0, 0, width, height);

  // reset shadow and alpha each frame
  context.globalAlpha = 1;
  context.shadowBlur = 0;
  context.shadowColor = "rgba(0,0,0,0)";

  // graticule
  context.beginPath();
  path(graticule);
  context.strokeStyle = is_countries_active ? "#2a4a6c" : "#1a2a4c";
  context.lineWidth = 0.5;
  context.stroke();

  if (is_countries_active) {
    // Draw country borders
    if (typeof plot_countries === "function" && country_features.length > 0) {
      plot_countries(context, projection, path, country_features);
    }

    // Draw study points on top of countries
    if (is_timeline_active && study_points.length > 0) {
      if (typeof plot_studies === "function") {
        hovered_study = plot_studies(
          context,
          projection,
          study_points,
          current_mouse_pos
        );

        // Show tooltip for hovered study
        if (hovered_study && current_mouse_pos) {
          globe_tooltip
            .style("opacity", 1)
            .html(
              `<strong>${hovered_study.title}</strong><br>` +
                `Location: ${
                  hovered_study.city ? hovered_study.city + ", " : ""
                }${hovered_study.country}<br>` +
                `Year: ${hovered_study.year}<br>` +
                `NCT ID: ${hovered_study.nctId || "N/A"}`
            )
            .style("left", current_mouse_pos[0] + 15 + "px")
            .style("top", current_mouse_pos[1] + 15 + "px");
        } else {
          globe_tooltip.style("opacity", 0);
          hovered_study = null;
        }
      } else {
        console.warn("[main] plot_studies function is not defined yet.");
      }
    }
  } else {
    // Show particle dots initially (matching anti side)
    if (land_particles.length > 0) {
      context.fillStyle = "#9effff";
      context.globalAlpha = 0.9;
      for (const p of land_particles) {
        const coords = projection(p.coordinates);
        if (coords) {
          context.fillRect(coords[0], coords[1], 1, 1);
        }
      }
    }
    globe_tooltip.style("opacity", 0);
  }
}

// 5. start
console.log("[main] starting animation...");
auto_rotate_timer = d3.timer(animate);

// Updated Path to Data
const map_url = "../data/processed/world-110m.json";
const studies_url = "../data/processed/ctg-studies.json";
let bloom_chart_drawn = false;
let area_chart_drawn = false;
let bubble_chart_drawn = false;
let cas9NetworkDrawn = false;

// ui elements
const progress_bar = d3.select("#progress-fill");
const loading_text = d3.select("#loading-text");
const scroll_prompt = d3.select("#scroll-prompt");
const progress_container = d3.select("#progress-bar-container");

// --- Event Listeners (Drag) ---
const sensitivity = 50;

d3.select(canvas).call(
  d3
    .drag()
    .on("start", (event) => {
      is_dragging = true;
      vx = 0;
      vy = 0;
    })
    .on("drag", (event) => {
      const current_rotate = projection.rotate();
      const k = sensitivity / projection.scale();

      // Update rotation immediately for responsiveness
      const new_rotate = [
        current_rotate[0] + event.dx * k,
        current_rotate[1] - event.dy * k,
        current_rotate[2],
      ];
      new_rotate[1] = Math.max(-90, Math.min(90, new_rotate[1]));
      projection.rotate(new_rotate);

      // Calculate velocity for momentum (approximate)
      // We assume ~16ms per frame for simplicity, or we could track time
      // This "throws" the globe
      vx = (event.dx * k) / 16;
      vy = (-event.dy * k) / 16;
    })
    .on("end", () => {
      is_dragging = false;
      // No need to restart timer, it never stopped
    })
);

// Mouse move for tooltip
d3.select(canvas).on("mousemove", (event) => {
  current_mouse_pos = d3.pointer(event);
  if ((is_timeline_active || is_countries_active) && !is_dragging) {
    redraw_globe();
  }
});

// Load both map and studies data
Promise.all([
  d3.json(map_url),
  d3.json(studies_url).catch((err) => {
    console.warn(
      "[main] Could not load studies data, proceeding without it:",
      err
    );
    return []; // Return empty array on failure
  }),
])
  .then(([land_topo, studies_data]) => {
    console.log("[main] map loaded...");
    console.log(
      "[main] studies loaded:",
      studies_data ? studies_data.length : 0
    );

    const land = topojson.feature(land_topo, land_topo.objects.land);
    country_features = topojson.feature(
      land_topo,
      land_topo.objects.countries
    ).features;

    // Process studies data
    if (studies_data && studies_data.length > 0) {
      processStudiesData(studies_data);
    } else {
      console.warn("[main] No studies data available to process.");
    }

    const density = 2.0;
    const graticule_lines = d3.geoGraticule().step([density, density])()
      .coordinates;
    const all_points = graticule_lines.flat();
    const total_points = all_points.length;

    let i = 0;
    const batch_size = 1000;

    function compute_batch() {
      for (let j = 0; j < batch_size && i < total_points; ++j, ++i) {
        const coords = all_points[i];
        if (d3.geoContains(land, coords)) {
          land_particles.push({ type: "Point", coordinates: coords });
        }
      }

      const percent = (i / total_points) * 100;
      progress_bar.style("width", `${percent}%`);

      if (i < total_points) {
        setTimeout(compute_batch, 0);
      } else {
        console.log(`[main] done! ${land_particles.length} particles live.`);

        loading_text.text("global systems online");
        progress_container.transition().duration(500).style("opacity", 0);
        scroll_prompt.style("opacity", 1);

        // 1. Prevent browser from restoring scroll position
        if ("scrollRestoration" in history) {
          history.scrollRestoration = "manual";
        }

        initializeAllCharts();

        // 2. Force scroll to top immediately
        window.scrollTo(0, 0);

        // 3. Delay Scrollama setup slightly to ensure layout is stable at top
        setTimeout(() => {
          // Explicitly force "Rest" state before Scrollama takes over
          d3.selectAll(".widget")
            .classed("focused", false)
            .classed("hidden", false);
          d3.select("#focus-backdrop").classed("active", false);

          setup_scrollama();
        }, 500);
        // Drag is already setup above
      }
    }

    compute_batch();
  })
  .catch((error) => {
    console.error("error loading data:", error);
    // Even if map fails, we might want to show something, but map is critical for globe.
    loading_text.text("system failure: data missing");
  });

// Process studies data to extract locations and dates
function processStudiesData(studies) {
  const validStudies = [];

  studies.forEach(function (study) {
    const protocol = study.protocolSection;
    if (!protocol) return;

    const statusModule = protocol.statusModule;
    const locationsModule = protocol.contactsLocationsModule;

    if (!statusModule || !locationsModule || !locationsModule.locations) return;

    const startDateStruct = statusModule.startDateStruct;
    if (!startDateStruct || !startDateStruct.date) return;

    // Parse date
    const date = new Date(startDateStruct.date);
    if (isNaN(date.getTime())) return;

    const year = date.getFullYear();

    // Process each location
    locationsModule.locations.forEach(function (location) {
      if (location.geoPoint && location.geoPoint.lat && location.geoPoint.lon) {
        const lat = location.geoPoint.lat;
        const lon = location.geoPoint.lon;

        // Basic validation
        if (
          isNaN(lat) ||
          isNaN(lon) ||
          lat < -90 ||
          lat > 90 ||
          lon < -180 ||
          lon > 180
        ) {
          return;
        }

        const idModule = protocol.identificationModule || {};
        validStudies.push({
          year: year,
          date: date,
          lat: lat,
          lon: lon,
          country: location.country || "Unknown",
          city: location.city || "",
          facility: location.facility || "",
          title: idModule.briefTitle || "Unknown Study",
          nctId: idModule.nctId || "",
        });
      }
    });
  });

  // Sort by year and date
  validStudies.sort(function (a, b) {
    if (a.year !== b.year) {
      return a.year - b.year;
    }
    return a.date - b.date;
  });

  time_sorted_studies = validStudies;

  // Group by year
  all_years = [];
  studies_by_year = {};

  validStudies.forEach(function (study) {
    if (!studies_by_year[study.year]) {
      studies_by_year[study.year] = [];
      all_years.push(study.year);
    }
    studies_by_year[study.year].push(study);
  });

  all_years.sort((a, b) => a - b);

  console.log(`[main] Processed ${validStudies.length} study locations`);
  console.log(
    `[main] Years range: ${all_years[0]} - ${all_years[all_years.length - 1]}`
  );

  // Don't initialize studies visible until countries are active
  // Studies will be shown when final step is reached
  if (all_years.length > 0) {
    // Prepare studies data but don't activate yet
    updateStudyPoints(all_years.length - 1);
  }
}

// Update study points based on year index
function updateStudyPoints(yearIndex) {
  if (all_years.length === 0) {
    study_points = [];
    return;
  }

  if (yearIndex < 0 || yearIndex >= all_years.length) {
    return;
  }

  current_year_index = yearIndex;
  const currentYear = all_years[yearIndex];

  // Calculate cumulative studies up to this year
  study_points = time_sorted_studies.filter(function (study) {
    return study.year <= currentYear;
  });

  console.log(
    `[main] Showing ${study_points.length} studies up to year ${currentYear}`
  );
}

// 7. interaction: scroll
function setup_scrollama() {
  const scroller = scrollama();
  scroller
    .setup({
      step: ".step-trigger",
      offset: 0.5,
    })
    .onStepEnter((response) => {
      const element = response.element;
      const widget_id = d3.select(element).attr("data-widget");
      const phase = d3.select(element).attr("data-phase");

      // Mark this step as active (for story card visibility)
      d3.selectAll(".step-trigger").classed("is-active", false);
      d3.select(element).classed("is-active", true);

      // 1. Handle Spacer (Rest / Start)
      if (element.classList.contains("spacer")) {
        // Reset to "Rest" state: all visible in corners, no focus, no blur
        d3.selectAll(".widget")
          .classed("focused", false)
          .classed("focused-left", false)
          .classed("hidden", false);
        d3.select("#focus-backdrop").classed("active", false);

        is_countries_active = false;
        is_timeline_active = false;

        if (response.index === 0) {
          // Ensure loading overlay is hidden so we see the widgets
          d3.select("#loading-overlay").style("opacity", 0);
        }
        return;
      }

      // Hide loading overlay for all other steps
      d3.select("#loading-overlay").style("opacity", 0);

      // 2. Handle Final Temporal Globe Step
      if (widget_id === "final-temporal-globe") {
        is_countries_active = true;
        is_timeline_active = true;

        // Hide all widgets (fade out)
        d3.selectAll(".widget")
          .classed("hidden", true)
          .classed("focused", false)
          .classed("focused-left", false);

        // Remove backdrop to show globe clearly
        d3.select("#focus-backdrop").classed("active", false);

        // Show temporal globe controls
        if (typeof showTemporalGlobeControls === "function") {
          showTemporalGlobeControls();
        }

        redraw_globe();
        return;
      }

      // 2b. Handle old final-countries step (backward compatibility)
      if (widget_id === "final-countries") {
        is_countries_active = true;
        is_timeline_active = true;

        d3.selectAll(".widget")
          .classed("hidden", true)
          .classed("focused", false)
          .classed("focused-left", false);

        d3.select("#focus-backdrop").classed("active", false);

        redraw_globe();
        return;
      }

      // 3. Standard Widget Step with 3-Phase support
      is_countries_active = false;

      // Ensure widgets are visible (in corners)
      d3.selectAll(".widget").classed("hidden", false);

      if (widget_id) {
        // Remove all focus classes first
        d3.selectAll(".widget")
          .classed("focused", false)
          .classed("focused-left", false);

        // Apply phase-based positioning
        if (phase === "center") {
          // Phase 1: Chart in CENTER
          d3.select(`#${widget_id}`).classed("focused", true);
        } else if (phase === "left") {
          // Phase 2: Chart moves to LEFT
          d3.select(`#${widget_id}`).classed("focused-left", true);
        } else if (phase === "text") {
          // Phase 3: Text appears (chart stays LEFT)
          d3.select(`#${widget_id}`).classed("focused-left", true);
        } else {
          // Default: center focus (for backward compatibility)
          d3.select(`#${widget_id}`).classed("focused", true);
        }
      } else {
        // Fallback: unfocus all if no ID
        d3.selectAll(".widget")
          .classed("focused", false)
          .classed("focused-left", false);
      }

      // Activate backdrop to dim background
      d3.select("#focus-backdrop").classed("active", true);

      redraw_globe();
    })
    .onStepExit((response) => {
      // Remove active class when exiting
      d3.select(response.element).classed("is-active", false);

      // Handle scrolling back up from final step
      if (response.direction === "up") {
        const widget_id = d3.select(response.element).attr("data-widget");
        if (
          widget_id === "final-temporal-globe" ||
          widget_id === "final-countries"
        ) {
          // Hide temporal controls
          if (typeof hideTemporalGlobeControls === "function") {
            hideTemporalGlobeControls();
          }
          // Restore widgets to corners (remove hidden)
          d3.selectAll(".widget").classed("hidden", false);
          is_countries_active = false;
          is_timeline_active = false;
          redraw_globe();
        }
      }
    });

  // Add resize handler to ensure scroll triggers are recalculated
  window.addEventListener("resize", () => {
    scroller.resize();
  });
}

function initializeAllCharts() {
  console.log("[main] Initializing all charts...");

  // 1. Bloom Chart
  if (!bloom_chart_drawn) {
    draw_bloom_chart("#bar-chart-container");
    bloom_chart_drawn = true;
  }

  // 3. Bubble Chart
  if (!bubble_chart_drawn) {
    if (typeof initBubbleChart === "function") {
      initBubbleChart("#bubble-chart-container");
      bubble_chart_drawn = true;
    } else {
      console.warn("[main] initBubbleChart is not defined yet.");
    }
  }

  // 4. Cas9 Network
  if (!cas9NetworkDrawn) {
    if (window.initCas9Network) {
      window.initCas9Network();
      cas9NetworkDrawn = true;
    } else {
      console.warn("initCas9Network is not defined yet.");
    }
  }

  // 5. Timeline Chart (Exponential Growth)
  if (typeof initTimelineChart === "function") {
    console.log("[main] Initializing Timeline Chart...");
    initTimelineChart();
  } else {
    console.warn("[main] initTimelineChart is not defined yet.");
  }

  // 6. Sankey Diagram (Path to Approval)
  if (typeof initSankeyDiagram === "function") {
    console.log("[main] Initializing Sankey Diagram...");
    initSankeyDiagram();
  } else {
    console.warn("[main] initSankeyDiagram is not defined yet.");
  }

  // 7. Temporal Globe Controls (3D globe timeline)
  if (typeof initTemporalGlobe === "function") {
    console.log("[main] Initializing Temporal Globe...");
    initTemporalGlobe();
  } else {
    console.warn("[main] initTemporalGlobe is not defined yet.");
  }
}

// 8. helper functions (Bloom chart logic is in bloom_chart.js)

function draw_area_chart(container_id) {
  const data = d3
    .range(40)
    .map((i) => ({ x: i * 5 + 100, y: Math.random() * 75 + 25 }));
  const el = document.querySelector(container_id);
  if (!el) return;
  const margin = { top: 10, right: 10, bottom: 20, left: 30 };
  const chart_width = el.clientWidth - margin.left - margin.right;
  const chart_height = 150 - margin.top - margin.bottom;
  const svg = d3
    .select(container_id)
    .append("svg")
    .attr("class", "chart-svg")
    .attr("width", el.clientWidth)
    .attr("height", 150)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.x))
    .range([0, chart_width]);
  const y = d3.scaleLinear().domain([0, 100]).range([chart_height, 0]);
  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${chart_height})`)
    .call(d3.axisBottom(x).ticks(5));
  svg.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(4));

  const curve = d3.curveCatmullRom;
  const area = d3
    .area()
    .x((d) => x(d.x))
    .y0(chart_height)
    .y1((d) => y(d.y))
    .curve(curve);
  const line = d3
    .line()
    .x((d) => x(d.x))
    .y((d) => y(d.y))
    .curve(curve);

  svg.append("path").datum(data).attr("class", "area").attr("d", area);
  svg.append("path").datum(data).attr("class", "area-line").attr("d", line);
}
