// ============================================================================
// CRISPR Trial Sample Size Bubble Chart - OPTIMIZED (Static Layout)
// ============================================================================

function draw_bubble_trial_chart(container_id) {
  const el = document.querySelector(container_id);
  if (!el) {
    console.error(`[bubble-chart] Container ${container_id} not found`);
    return;
  }

  // Clear any existing content
  d3.select(container_id).selectAll("*").remove();

  const width = el.clientWidth;
  const height = 360;

  // Create SVG
  const svg = d3
    .select(container_id)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("background", "transparent");

  // Load data
  d3.json("../data/processed/anti-bubble_trial_data.json")
    .then((data) => {
      const validTrials = data.trials;
      console.log(
        `[bubble-chart] Loaded ${validTrials.length} trials (Optimized)`
      );

      // Helper to update stats dynamically
      function updateStats(dataset) {
        const total = dataset.length;
        if (total === 0) {
          if (document.getElementById("stat-total"))
            document.getElementById("stat-total").textContent = "0";
          if (document.getElementById("stat-median"))
            document.getElementById("stat-median").textContent = "0";
          if (document.getElementById("stat-under50"))
            document.getElementById("stat-under50").textContent = "0%";
          return;
        }

        const enrollments = dataset
          .map((d) => d.enrollment)
          .sort((a, b) => a - b);
        const median = d3.median(enrollments);
        const under50 = dataset.filter((d) => d.enrollment < 50).length;
        const pct = Math.round((under50 / total) * 100);

        if (document.getElementById("stat-total"))
          document.getElementById("stat-total").textContent = total;
        if (document.getElementById("stat-median"))
          document.getElementById("stat-median").textContent =
            Math.round(median);
        if (document.getElementById("stat-under50"))
          document.getElementById("stat-under50").textContent = `${pct}%`;
      }

      // Initial Stats (All)
      updateStats(validTrials);

      // --- CONFIGURATION ---
      const phaseColors = {
        "Phase 1": "#ff9999",
        "Phase 2": "#ff4d4d",
        "Phase 3": "#ff0000",
        "N/A": "#b36666",
      };

      const phases = ["Phase 1", "Phase 2", "Phase 3"];
      const xCenters = {
        "Phase 1": width * 0.2,
        "N/A": width * 0.2,
        "Phase 2": width * 0.5,
        "Phase 3": width * 0.8,
      };

      const radiusScale = d3
        .scaleSqrt()
        .domain([0, 100])
        .range([6, 24]) // Larger bubbles for better visibility
        .clamp(true);

      // --- DATA PREP (STATIC PACKING) ---
      // Group by phase
      const grouped = d3.group(validTrials, (d) => d.phase || "N/A");

      let nodes = [];
      const centerY = height * 0.55;

      // Simple packing: spiral or grid around center
      grouped.forEach((groupTrials, phase) => {
        // Sort by size (largest in middle usually looks best, or random)
        groupTrials.sort((a, b) => b.enrollment - a.enrollment);

        const cx = xCenters[phase] || xCenters["Phase 1"];

        // Spiral packing algorithm
        let angle = 0;
        let radius = 0;
        const step = 0.5; // distance between spiral arms

        groupTrials.forEach((d, i) => {
          // Calculate radius
          const r = radiusScale(d.enrollment);

          // Simple phyllotaxis arrangement
          const theta = i * 2.4; // golden angle approx
          const dist = 10 * Math.sqrt(i); // spread factor (increased for larger bubbles)

          const x = cx + Math.cos(theta) * dist;
          const y = centerY + Math.sin(theta) * dist;

          nodes.push({
            ...d,
            x: x,
            y: y,
            r: r,
            color: phaseColors[d.phase] || "#666",
          });
        });
      });

      // --- RENDER ---

      // Phase Labels
      svg
        .selectAll(".phase-label")
        .data(phases)
        .enter()
        .append("text")
        .attr("class", "phase-label")
        .attr("x", (d) => xCenters[d])
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .text((d) => (d === "Phase 1" ? "PHASE 1 / UNKNOWN" : d.toUpperCase()))
        .style("fill", "#ff4d4d")
        .style("font-size", (d) => (d === "Phase 1" ? "12px" : "14px"))
        .style("font-family", "monospace")
        .style("font-weight", "bold")
        .style("opacity", 0.9);

      const bubblesGroup = svg.append("g").attr("class", "bubbles-group");

      // Draw Circles (One-time render, no simulation)
      const circles = bubblesGroup
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", (d) => d.r)
        .attr("fill", (d) => d.color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", 0.3)
        .style("fill-opacity", 0.85)
        .style("cursor", "crosshair");

      // --- INTERACTION (Tooltip) ---
      const tooltip = d3.select("#tooltip");

      circles
        .on("mouseover", function (event, d) {
          d3.select(this)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 1)
            .attr("r", d.r * 1.3); // Simple pop, no transition

          tooltip.style("opacity", 1).html(`
                      <div style="font-family:monospace; color:#ff4d4d; margin-bottom:4px;">
                          ${d.id}
                      </div>
                      <div style="font-size:1.1em; font-weight:bold; color:#fff;">
                          ${d.enrollment} Patients
                      </div>
                      <div style="font-size:0.8em; color:#aaa; margin-top:4px;">
                          ${d.condition}<br/>
                          ${d.phase}
                      </div>
                  `);
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", event.clientX + 15 + "px")
            .style("top", event.clientY - 15 + "px");
        })
        .on("mouseout", function (event, d) {
          d3.select(this)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
            .attr("stroke-opacity", 0.3)
            .attr("r", d.r);

          tooltip.style("opacity", 0);
        });

      // Filter buttons (Simple opacity toggle)
      d3.selectAll("#bubble-controls button[data-phase]").on(
        "click",
        function () {
          const phase = this.getAttribute("data-phase");

          // UI
          d3.selectAll("#bubble-controls button[data-phase]").classed(
            "active",
            false
          );
          d3.select(this).classed("active", true);

          if (phase === "all") {
            circles.style("opacity", 1).style("pointer-events", "all");
            updateStats(validTrials);
          } else {
            const map = {
              phase1: "Phase 1",
              phase2: "Phase 2",
              phase3: "Phase 3",
            };
            const target = map[phase];

            circles
              .style("opacity", (d) => (d.phase === target ? 1 : 0.05))
              .style("pointer-events", (d) =>
                d.phase === target ? "all" : "none"
              );

            const subset = validTrials.filter((d) => d.phase === target);
            updateStats(subset);
          }
        }
      );
    })
    .catch((err) => {
      console.error("Bubble Chart Error:", err);
    });
}
