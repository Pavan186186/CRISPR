// ============================================================================
// ANTI/MAIN.JS - CRISPR PERIL DASHBOARD
// ============================================================================

// 1. Setup
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
let land_particles = [];
let country_features = [];
let csv_data_global = [];
let is_choropleth_active = false;
let current_mouse_pos = null;
let hovered_country_data = null;

// 2. Projection
const projection = d3
  .geoOrthographic()
  .scale(Math.min(width, height) / 2.2)
  .translate([width / 2, height / 2])
  .clipAngle(90);

const path = d3.geoPath(projection, context);
const graticule = d3.geoGraticule10();

// 3. Gradients for charts
const defs = d3
  .select("body")
  .append("svg")
  .attr("width", 0)
  .attr("height", 0)
  .append("defs");

const bar_gradient = defs
  .append("linearGradient")
  .attr("id", "bar-gradient")
  .attr("x1", "0%")
  .attr("y1", "100%")
  .attr("x2", "0%")
  .attr("y2", "0%");
bar_gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ff4d4d");
bar_gradient
  .append("stop")
  .attr("offset", "100%")
  .attr("stop-color", "#800000");

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
  .attr("stop-color", "#ff0000")
  .attr("stop-opacity", 0.6);
area_gradient
  .append("stop")
  .attr("offset", "100%")
  .attr("stop-color", "#200000")
  .attr("stop-opacity", 0.1);

// Tooltip
let globe_tooltip = d3.select("body").select(".globe-tooltip");
if (globe_tooltip.empty()) {
  globe_tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "globe-tooltip");
}

// 4. Animation loop (OPTIMIZED - Only redraw when needed)
function animate(elapsed) {
  const dt = elapsed - last_time;
  last_time = elapsed;

  let needs_redraw = false;

  if (!is_dragging) {
    const current_rotate = projection.rotate();
    projection.rotate([
      current_rotate[0] + rotation_speed * dt,
      current_rotate[1],
      current_rotate[2],
    ]);
    needs_redraw = true;
  }

  // Only redraw if globe rotated or choropleth is active (for hover effects)
  if (needs_redraw || is_choropleth_active) {
    redraw_globe();
  }
}

function redraw_globe() {
  context.clearRect(0, 0, width, height);

  context.globalAlpha = 1;
  context.shadowBlur = 0;
  context.shadowColor = "rgba(0,0,0,0)";

  // Graticule
  context.beginPath();
  path(graticule);
  context.strokeStyle = is_choropleth_active ? "#551122" : "#4c1a1a";
  context.lineWidth = 0.5;
  context.stroke();

  if (is_choropleth_active) {
    if (
      typeof plot_choropleth === "function" &&
      country_features.length > 0 &&
      choropleth_data_global.length > 0
    ) {
      hovered_country_data = plot_choropleth(
        context,
        projection,
        path,
        country_features,
        choropleth_data_global,
        current_mouse_pos
      );

      if (hovered_country_data && current_mouse_pos) {
        globe_tooltip
          .style("opacity", 1)
          .html(
            `<strong>${hovered_country_data.name}</strong><br>` +
            `Allowance Score: ${hovered_country_data.value === "N/A"
              ? "N/A"
              : hovered_country_data.value + "/10"
            }`
          )
          .style("left", current_mouse_pos[0] + 15 + "px")
          .style("top", current_mouse_pos[1] + 15 + "px");
      } else {
        globe_tooltip.style("opacity", 0);
      }
    }
  } else {
    if (land_particles.length > 0) {
      context.fillStyle = "#ff4d4d";
      context.globalAlpha = 0.9;
      context.beginPath(); // Batch rendering
      for (const p of land_particles) {
        const coords = projection(p.coordinates);
        if (coords) {
          context.rect(coords[0], coords[1], 1.5, 1.5); // Slightly larger to compensate for lower density
        }
      }
      context.fill();
    }
    globe_tooltip.style("opacity", 0);
  }
}

// 5. Start timer
console.log("[anti/main] starting animation...");
auto_rotate_timer = d3.timer(animate);

// Data paths
// Data paths
const map_url = "../data/processed/world-110m.json";
const ethical_url = "../data/processed/anti_ethical_violations.json"; // Renamed
const choropleth_url = "../data/processed/anti_choropleth_data.json";

let ethical_data_global = []; // Renamed
let choropleth_data_global = [];

// Track which charts have been drawn
let bar_chart_drawn = false;
let area_chart_drawn = false;
let timeline_drawn = false;
let cost_chart_drawn = false;
let bubble_chart_drawn = false;

const progress_bar = d3.select("#progress-fill");
const loading_text = d3.select("#loading-text");
const scroll_prompt = d3.select("#scroll-prompt");
const progress_container = d3.select("#progress-bar-container");

// Drag interaction
const sensitivity = 50;
d3.select(canvas).call(
  d3
    .drag()
    .on("start", () => {
      is_dragging = true;
    })
    .on("drag", (event) => {
      const current_rotate = projection.rotate();
      const k = sensitivity / projection.scale();

      const new_rotate = [
        current_rotate[0] + event.dx * k,
        current_rotate[1] - event.dy * k,
        current_rotate[2],
      ];
      new_rotate[1] = Math.max(-90, Math.min(90, new_rotate[1]));
      projection.rotate(new_rotate);
      redraw_globe();
    })
    .on("end", () => {
      is_dragging = false;
    })
);

// Mousemove for tooltip (THROTTLED for performance)
let mousemove_timer = null;
d3.select(canvas).on("mousemove", (event) => {
  current_mouse_pos = d3.pointer(event);

  // Throttle redraws to max 30fps during choropleth hover
  if (is_choropleth_active && !is_dragging) {
    if (!mousemove_timer) {
      mousemove_timer = setTimeout(() => {
        redraw_globe();
        mousemove_timer = null;
      }, 33); // ~30fps (1000ms / 30 = 33ms)
    }
  }
});

// Load data
Promise.all([
  d3.json(map_url),
  d3.json(ethical_url),
  d3.json(choropleth_url),
  d3.json("../data/processed/price_inequality_data.json"),
])
  .then(([land_topo, eth_data, choro_data, price_data]) => {
    console.log("[anti/main] data loaded...");

    const land = topojson.feature(land_topo, land_topo.objects.land);
    country_features = topojson.feature(
      land_topo,
      land_topo.objects.countries
    ).features;

    ethical_data_global = eth_data;
    choropleth_data_global = choro_data;

    // Assign global for price inequality
    if (typeof draw_price_inequality_chart !== "undefined") {
      price_inequality_data = price_data;
    }

    const density = 2.0; // Matched to Pro side for high density
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
        console.log(
          `[anti/main] done! ${land_particles.length} particles live.`
        );

        loading_text.text("threat assessment complete");
        progress_container.transition().duration(500).style("opacity", 0);
        scroll_prompt.style("opacity", 1);

        // 1. Prevent browser from restoring scroll position (Pro optimization)
        if ("scrollRestoration" in history) {
          history.scrollRestoration = "manual";
        }
        window.scrollTo(0, 0);

        // Initialize and setup scroll animations
        initializeAllCharts();

        // Delay scrollama setup slightly to ensure proper initialization
        setTimeout(() => {
          // Reset all widgets to corner "Rest" state
          d3.selectAll(".widget")
            .classed("focused", false)
            .classed("hidden", false);
          d3.select("#focus-backdrop").classed("active", false);

          // Activate scrollama
          setup_scrollama();
        }, 500);
      }
    }

    compute_batch();
  })
  .catch((error) => {
    console.error("[anti/main] error loading data:", error);
  });

// Scrollama setup - PRO Style with 3-phase focus/hidden states
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

      // SPACER STEPS (Rest State)
      if (element.classList.contains("spacer")) {
        // Reset to "Rest" state: all visible in corners, no focus, no blur
        d3.selectAll(".widget")
          .classed("focused", false)
          .classed("focused-left", false)
          .classed("hidden", false);
        d3.select("#focus-backdrop").classed("active", false);
        is_choropleth_active = false;
        d3.select("#choropleth-legend").style("opacity", 0);

        // Hide loading overlay on first scroll (like pro version)
        if (response.index === 0) {
          d3.select("#loading-overlay").style("opacity", 0);
        }

        redraw_globe();
        return;
      }

      // Hide loading overlay for all other steps
      d3.select("#loading-overlay").style("opacity", 0);

      // FINAL CHOROPLETH STATE (Globe finale)
      if (widget_id === "final-choropleth") {
        is_choropleth_active = true;
        d3.select("#choropleth-legend").style("opacity", 1);
        d3.select("#choropleth-read-more").style("opacity", 1); // Show Read More Button

        // Shift globe left to make room for story card
        d3.select("#globe-canvas").classed("shift-left", true);

        // Hide all widgets for choropleth view
        d3.selectAll(".widget")
          .classed("focused", false)
          .classed("focused-left", false)
          .classed("hidden", true);
        d3.select("#focus-backdrop").classed("active", false);

        redraw_globe();
        return;
      }

      // Remove shift-left from globe when not on final step
      d3.select("#globe-canvas").classed("shift-left", false);

      // Standard Widget Step with 3-Phase support
      is_choropleth_active = false;
      d3.select("#choropleth-legend").style("opacity", 0);
      d3.select("#choropleth-read-more").style("opacity", 0); // Hide Read More Button

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
          // Hide other widgets
          d3.selectAll(`.widget:not(#${widget_id})`).classed("hidden", true);
        } else if (phase === "left") {
          // Phase 2: Chart moves to LEFT
          d3.select(`#${widget_id}`).classed("focused-left", true);
          // Hide other widgets
          d3.selectAll(`.widget:not(#${widget_id})`).classed("hidden", true);
        } else if (phase === "text") {
          // Phase 3: Text appears (chart stays LEFT)
          d3.select(`#${widget_id}`).classed("focused-left", true);
          // Hide other widgets
          d3.selectAll(`.widget:not(#${widget_id})`).classed("hidden", true);
        } else {
          // Default: center focus (for backward compatibility)
          d3.select(`#${widget_id}`).classed("focused", true);
          d3.selectAll(`.widget:not(#${widget_id})`).classed("hidden", true);
        }

        // Activate backdrop to dim background
        d3.select("#focus-backdrop").classed("active", true);

        // Special case: Boxplot is handled by boxplot.js but we might want to ensure it's updated
        if (widget_id === "bottom-left-widget") {
          // Optional: force update if needed, but should remain responsive
          if (window.renderBoxplot) {
            window.renderBoxplot();
          }
        }

        // PRICE INEQUALITY ANIMATION TRIGGER & RESIZE
        if (widget_id === "price-inequality-widget") {
          const container = d3.select("#price-chart-container").node();

          // Animate in immediately (opacity/transform)
          if (container && container.animate_in) {
            container.animate_in();
          }

          // Re-draw AFTER CSS transition (1.2s) to fit new size
          if (window.draw_price_inequality_chart) {
            setTimeout(() => {
              window.draw_price_inequality_chart("#price-chart-container");
              // Re-trigger animation after redraw
              const newContainer = d3.select("#price-chart-container").node();
              if (newContainer && newContainer.animate_in)
                newContainer.animate_in();
            }, 1200);
          }
        }

        // REGULATORY CHART RESIZE
        if (widget_id === "bottom-right-widget") {
          if (window.draw_regulatory_chart) {
            // Wait for widget to expand (1.2s transition)
            setTimeout(() => {
              window.draw_regulatory_chart("#regulation-chart-container");
            }, 1200);
          }
        }
      }

      redraw_globe();
    })
    .onStepExit((response) => {
      // Remove active class when exiting
      d3.select(response.element).classed("is-active", false);

      if (response.direction === "up") {
        const widget_id = d3.select(response.element).attr("data-widget");
        if (widget_id === "final-choropleth") {
          is_choropleth_active = false;
          d3.select("#choropleth-legend").style("opacity", 0);
          d3.select("#choropleth-read-more").style("opacity", 0); // Hide Read More Button
          d3.select("#globe-canvas").classed("shift-left", false);
          d3.selectAll(".widget").classed("hidden", false);
          redraw_globe();
        }
      }
    });

  // Recalculate on resize
  window.addEventListener("resize", () => {
    scroller.resize();
  });

  // --- MODAL LOGIC ---
  const readMoreBtn = document.querySelector("#choropleth-read-more button");
  const modal = document.querySelector("#choropleth-modal");
  const closeModal = document.querySelector(".close-modal");

  if (readMoreBtn && modal && closeModal) {
    readMoreBtn.addEventListener("click", () => {
      modal.classList.add("active");
    });

    closeModal.addEventListener("click", () => {
      modal.classList.remove("active");
    });

    // Close on click outside
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  }
}

// ============================================================================
// ORIGINAL CHARTS (Bar and Area)
// ============================================================================

function draw_bar_chart(container_id) {
  // Use global data if available
  if (!ethical_data_global || ethical_data_global.length === 0) return;

  const el = document.querySelector(container_id);
  if (!el) return;

  const data = ethical_data_global;

  d3.select(container_id).selectAll("*").remove();

  // Radial Chart Config
  const width = el.clientWidth;
  const height = el.clientHeight;
  const margin = 60; // More space for horizontal labels
  const innerRadius = 30;
  const outerRadius = Math.min(width, height) / 2 - margin;

  const svg = d3
    .select(container_id)
    .style("overflow", "visible") // Ensure nothing is clipped
    .style("pointer-events", "auto") // Ensure interaction
    .append("svg")
    .attr("class", "chart-svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`); // Center it

  // X scale (Angle)
  const x = d3
    .scaleBand()
    .range([0, 2 * Math.PI])
    .align(0)
    .domain(data.map((d) => d.category));

  // Y scale (Radius)
  const y = d3
    .scaleRadial()
    .range([innerRadius, outerRadius])
    .domain([0, d3.max(data, (d) => d.value) * 1.2]); // 20% headroom

  // Color map
  const colorMap = {
    critical: "#ff0000",
    high: "#ff4d4d",
    medium: "#ff9999",
    low: "#ffcccc",
  };

  // Add "Radar Grid" circles
  const yTicks = y.ticks(3);
  svg
    .append("g")
    .attr("class", "grid-circles")
    .style("pointer-events", "none") // Prevent blocking
    .selectAll("circle")
    .data(yTicks)
    .join("circle")
    .attr("fill", "none")
    .attr("stroke", "#ff4d4d")
    .attr("stroke-opacity", 0.2)
    .attr("stroke-dasharray", "3,3")
    .attr("r", y);

  // Add Axis lines (spokes)
  svg
    .append("g")
    .attr("class", "grid-spokes")
    .style("pointer-events", "none") // Prevent blocking
    .selectAll("line")
    .data(data)
    .join("line")
    .attr("y1", -innerRadius)
    .attr("y2", -outerRadius)
    .attr(
      "transform",
      (d) => `rotate(${((x(d.category) + x.bandwidth() / 2) * 180) / Math.PI})`
    )
    .attr("stroke", "#ff4d4d")
    .attr("stroke-opacity", 0.1);

  // Draw Bars (Arcs)
  svg
    .append("g")
    .selectAll("path")
    .data(data)
    .join("path")
    .attr("class", "bar-arc")
    .style("cursor", "pointer") // Indicate interactive
    .attr("fill", (d) => colorMap[d.severity] || "#ff4d4d")
    .attr("fill-opacity", 0.8)
    .attr(
      "d",
      d3
        .arc()
        .innerRadius(innerRadius)
        .outerRadius(innerRadius) // Start at inner for animation
        .startAngle((d) => x(d.category))
        .endAngle((d) => x(d.category) + x.bandwidth())
        .padAngle(0.05)
        .padRadius(innerRadius)
    )
    .on("mouseenter", function (event, d) {
      // Dim others
      d3.selectAll(".bar-arc").attr("fill-opacity", 0.3);
      d3.select(this)
        .attr("fill-opacity", 1)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

      // Show tooltip
      const tooltip = d3.select("#tooltip");
      tooltip
        .style("opacity", 1)
        .style("pointer-events", "none") // Ensure tooltip doesn't block
        .html(
          `<strong style="color: #ff4d4d">${d.category}</strong><br>
                      <span style="font-size: 0.9em; color: #ccc">${d.details || ""
          }</span><br>
                      <div style="margin-top:5px; font-size:0.8em; color:#888;">Example: ${d.examples || "N/A"
          }</div>
                      <div style="margin-top:5px; font-size:0.8em; color:#fff;">Impact: ${d.value
          }</div>`
        );
    })
    .on("mousemove", function (event) {
      // Use clientX/Y for fixed positioning
      const tooltip = d3.select("#tooltip");
      tooltip
        .style("left", event.clientX + 15 + "px")
        .style("top", event.clientY - 15 + "px");
    })
    .on("mouseleave", function () {
      // Reset
      d3.selectAll(".bar-arc").attr("fill-opacity", 0.8).attr("stroke", "none");
      d3.select("#tooltip").style("opacity", 0);
    })
    .transition()
    .duration(1000)
    .delay((d, i) => i * 100)
    .attrTween("d", function (d) {
      const i = d3.interpolate(innerRadius, y(d.value));
      return (t) =>
        d3
          .arc()
          .innerRadius(innerRadius)
          .outerRadius(i(t))
          .startAngle(x(d.category))
          .endAngle(x(d.category) + x.bandwidth())
          .padAngle(0.05)
          .padRadius(innerRadius)();
    });

  // Labels (Horizontal at Edge)
  svg
    .append("g")
    .style("pointer-events", "none") // TEXT SHOULD NOT BLOCK MOUSE
    .selectAll("text")
    .data(data)
    .join("text")
    .text((d) => d.category)
    .attr("text-anchor", function (d) {
      // Angle in radians (0 is 12 o'clock)
      const angle = x(d.category) + x.bandwidth() / 2;
      // Right half (0 to PI) -> start, Left half (PI to 2PI) -> end
      // Note: D3 arc 0 is -90deg in standard math? No, D3 arc 0 is 12 o'clock.
      // Let's verify angles.
      // 0 -> 12 o'clock. PI/2 -> 3 o'clock. PI -> 6 o'clock. 3PI/2 -> 9 o'clock.
      // So 0 to PI is Right Side. PI to 2PI is Left Side.
      return angle > Math.PI ? "end" : "start";
    })
    .attr("x", function (d) {
      const angle = x(d.category) + x.bandwidth() / 2;
      const r = outerRadius + 10;
      // x = r * sin(a)
      return r * Math.sin(angle);
    })
    .attr("y", function (d) {
      const angle = x(d.category) + x.bandwidth() / 2;
      const r = outerRadius + 10;
      // y = -r * cos(a)
      return -r * Math.cos(angle);
    })
    .style("font-size", "0.6rem")
    .style("fill", "#ffcccc")
    .style("alignment-baseline", "middle")
    .style("opacity", 0)
    .transition()
    .delay(1000)
    .style("opacity", 1);

  // Value Labels in center of bars (optional, maybe too cluttered for radial)
  // Instead, adding a center "Total" or title
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .text("ETHICS")
    .style("fill", "#ff4d4d")
    .style("font-size", "0.6rem")
    .style("font-weight", "bold");
}

// Text wrapping helper
function wrap(text, width) {
  text.each(function () {
    var text = d3.select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.1, // ems
      y = text.attr("y"),
      dy = parseFloat(text.attr("dy")),
      tspan = text
        .text(null)
        .append("tspan")
        .attr("x", 0)
        .attr("y", y)
        .attr("dy", dy + "em");
    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", ++lineNumber * lineHeight + dy + "em")
          .text(word);
      }
    }
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize all charts that are loaded on page load
// Initialize all charts that are loaded on page load
function initializeAllCharts() {
  console.log("[anti/main] Pre-loading all charts...");

  // TOP-LEFT: Ethical Violations
  draw_bar_chart("#bar-chart-container");
  bar_chart_drawn = true;

  // TOP-RIGHT: Timeline
  if (typeof draw_timeline_chart === "function") {
    // Ensure container exists or this check is safe
    draw_timeline_chart("#timeline-container");
    timeline_drawn = true;
  }

  // BOTTOM-RIGHT: Regulatory Landscape
  if (typeof draw_regulatory_chart === "function") {
    draw_regulatory_chart("#regulation-chart-container");
    cost_chart_drawn = true;
  }

  // BUBBLE CHART: Sample Size
  if (typeof draw_bubble_trial_chart === "function") {
    draw_bubble_trial_chart("#bubble-chart-container");
    bubble_chart_drawn = true;
  }

  // RADAR CHART: Genetic Damage (New)
  if (typeof draw_damage_radar_chart === "function") {
    draw_damage_radar_chart("#radar-chart-container");
  }

  // PRICE INEQUALITY CHART (New)
  if (typeof draw_price_inequality_chart === "function") {
    draw_price_inequality_chart("#price-chart-container");
  }

  // BOXPLOT: Off-target scores
  // Boxplot handles its own initialization via IIFE + window.renderBoxplot exposure,
  // but we can ensure it renders if needed.
  if (window.renderBoxplot) {
    window.renderBoxplot();
  }
}
