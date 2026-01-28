// js/anti/damage_radar_chart.js
// OPTIMIZED: No text strokes, fewer levels, no transitions

function draw_damage_radar_chart(container_id) {
  console.log("[radar] Initializing radar chart in", container_id);
  const el = document.querySelector(container_id);
  if (!el) {
    console.error("[radar] Container not found:", container_id);
    return;
  }

  // Clear
  d3.select(container_id).selectAll("*").remove();

  const width = el.clientWidth || 600; // Fallback width
  const height = 500;
  const margin = { top: 80, right: 80, bottom: 80, left: 80 };


  // Config
  const levels = 3; // number of concentric circles
  const maxValue = 100; // max value
  const minValue = 0;

  const svg = d3
    .select(container_id)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "radar-chart");

  const g = svg
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  // Load Data
  const dataPath = "../data/processed/anti_damage_radar_data.json";
  d3.json(dataPath)
    .then((data) => {
      if (!data || !data.length) {
        return;
      }

      // data is [ [ {axis, value, description}, ... ] ]
      // Our script outputs [categories], where categories is the array of axis objects.
      // So data[0] is the dataset.
      const dataset = data[0];
      const allAxis = dataset.map((d) => d.axis);
      const total = allAxis.length;
      const radius = Math.min(width / 2 - margin.left, height / 2 - margin.top);
      const angleSlice = (Math.PI * 2) / total;

      // Scale
      const rScale = d3.scaleLinear().range([0, radius]).domain([0, maxValue]);

      // --- 1. Circular Grid (Web) ---
      const axisGrid = g.append("g").attr("class", "axisWrapper");

      // Concentric circles
      axisGrid
        .selectAll(".levels")
        .data(d3.range(1, levels + 1).reverse())
        .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", (d) => (radius / levels) * d)
        .style("fill", "#CDCDCD")
        .style("stroke", "#CDCDCD")
        .style("fill-opacity", 0.05); // faint background
      //.style("filter", "url(#glow)"); // Use glow if defined in main SVG, else omit

      // Text indicating levels (Improved readability)
      axisGrid
        .selectAll(".axisLabel")
        .data(d3.range(1, levels + 1).reverse())
        .enter()
        .append("text")
        .attr("class", "axisLabel")
        .attr("x", 4)
        .attr("y", (d) => (-radius / levels) * d)
        .attr("dy", "0.4em")
        .style("font-size", "10px")
        .attr("fill", "#ffcccc")
        .text((d) => Math.round((maxValue * d) / levels));

      // --- 2. Axes ---
      const axes = axisGrid
        .selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");

      // Lines
      axes
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr(
          "x2",
          (d, i) =>
            rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2)
        )
        .attr(
          "y2",
          (d, i) =>
            rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2)
        )
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "1px")
        .style("stroke-opacity", 0.3);

      // Labels (Improved readability with smart positioning)
      axes
        .append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .attr("text-anchor", (d, i) => {
          // Smart text-anchor based on position
          const angle = (angleSlice * i - Math.PI / 2);
          const x = Math.cos(angle);
          if (Math.abs(x) < 0.1) return "middle"; // Top/Bottom
          return x > 0 ? "start" : "end"; // Right/Left
        })
        .attr("dy", "0.35em")
        .attr(
          "x",
          (d, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const baseX = rScale(maxValue * 1.25) * Math.cos(angle);
            return baseX;
          }
        )
        .attr(
          "y",
          (d, i) =>
            rScale(maxValue * 1.25) * Math.sin(angleSlice * i - Math.PI / 2)
        )
        .text((d) => d)
        .style("fill", "#ffcccc")
        .style("font-family", "monospace");

      // --- 3. The Radar Blob ---
      const radarLine = d3
        .lineRadial()
        .curve(d3.curveLinearClosed)
        .radius((d) => rScale(d.value))
        .angle((d, i) => i * angleSlice);

      // Wrapper
      const blobWrapper = g
        .selectAll(".radarWrapper")
        .data([dataset])
        .enter()
        .append("g")
        .attr("class", "radarWrapper");

      // Draw the blob wrapper
      // const blobWrapper = g.append("g").attr("class", "radar-blob-wrapper"); // DUPLICATE REMOVED
      // Use the existing blobWrapper from line 153 (which was a selection)
      // Actually, line 153 was: const blobWrapper = g.selectAll(".radarWrapper")...
      // That was for the wrapper group.
      // Let's rename the new one to 'blobGroup' to avoid confusion and append it to g.

      const blobGroup = g.append("g").attr("class", "radar-blob-group");

      // Draw the path
      blobGroup
        .append("path")
        .attr("class", "radar-area")
        .attr("d", radarLine(dataset)) // Changed data to dataset
        .attr("fill", "#ff4d4d")
        .attr("fill-opacity", 0.1)
        .attr("stroke", "#ff4d4d")
        .attr("stroke-width", 2)
        .style("filter", "drop-shadow(0 0 8px rgba(255, 77, 77, 0.5))")
        // Animation
        .attr("stroke-dasharray", function () {
          const len = this.getTotalLength();
          return len + " " + len;
        })
        .attr("stroke-dashoffset", function () {
          return this.getTotalLength();
        })
        .transition()
        .duration(2000)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0)
        .attr("fill-opacity", 0.4);

      // Draw the circles (vertices)
      blobGroup
        .selectAll(".radar-circle")
        .data(dataset) // Changed data to dataset
        .enter()
        .append("circle")
        .attr("class", "radar-circle")
        .attr("r", 4)
        .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("fill", "#ff4d4d")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .style("opacity", 0)
        .transition()
        .duration(500)
        .delay((d, i) => i * 100 + 1000)
        .style("opacity", 1);

      // Hover effects (Simplified but present)
      blobGroup
        .selectAll(".radar-circle")
        .on("mouseover", function (event, d) {
          d3.select(this).attr("r", 7).attr("fill", "#fff");

          // Tooltip
          const tooltip = d3.select("#tooltip");
          if (!tooltip.empty()) { // Added check for tooltip existence
            tooltip
              .style("opacity", 1)
              .html(
                `
                            <div style="font-family:monospace; color:#ff4d4d; border-bottom:1px solid #444; padding-bottom:4px; margin-bottom:4px;">
                                ${d.axis}
                            </div>
                            <div style="font-size:1.4em; font-weight:bold; color:#fff;">
                                ${d.value}<span style="font-size:0.6em; color:#aaa;">/100</span>
                            </div>
                            <div style="color:#ccc; font-size:0.85em; margin-top:5px; max-width:220px; line-height:1.4;">
                                ${d.description}
                            </div>
                        `
              )
              .style("left", event.clientX + 15 + "px")
              .style("top", event.clientY - 15 + "px");
          }

          d3.select(this)
            .attr("r", 6)
            .style("fill", "white");
        })
        .on("mouseout", function () {
          const tooltip = d3.select("#tooltip");
          if (!tooltip.empty()) tooltip.style("opacity", 0);
          d3.select(this)
            .attr("r", 4)
            .style("fill", "#800000");
        });
    })
    .catch((err) => {
      console.error("[radar] Error loading data:", err);
    });
}
