// ============================================================================
// ANTI/PRICE_INEQUALITY.JS - OPTIMIZED
// ============================================================================

let price_inequality_data = null;

function draw_price_inequality_chart(container_id) {
  const container = d3.select(container_id);
  if (container.empty()) return;

  // Clear previous
  container.selectAll("*").remove();

  // Dimensions
  const width = container.node().clientWidth;
  const height = container.node().clientHeight;

  // Create SVG
  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("overflow", "visible");

  // Center coordinates - Shifted to Left 2/3
  const cx = width * 0.35;
  const cy = height / 2;

  if (!price_inequality_data) return;

  // --- 1. Central Price Node ---
  const centerGroup = svg
    .append("g")
    .attr("class", "price-center-group")
    .attr("transform", `translate(${cx}, ${cy})`);

  // Circle
  centerGroup.append("circle").attr("class", "price-circle").attr("r", 80);

  // Text
  centerGroup
    .append("text")
    .attr("class", "price-text")
    .attr("dy", "0.1em")
    .text("$2.2M");

  centerGroup
    .append("text")
    .attr("class", "price-subtext")
    .attr("dy", "1.8em")
    .text("CASGEVY PRICE");

  // --- 2. Radiating Comparison Nodes ---
  const comparisons = price_inequality_data.comparisons;
  const radius = 220;

  // Calculate positions
  comparisons.forEach((d, i) => {
    const angle = (i / comparisons.length) * 2 * Math.PI - Math.PI / 2;
    d.x = cx + Math.cos(angle) * radius;
    d.y = cy + Math.sin(angle) * radius;
    d.angle = angle;
  });

  const comparisonGroups = svg
    .selectAll(".comparison-node")
    .data(comparisons)
    .enter()
    .append("g")
    .attr("class", "comparison-node")
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .style("opacity", 1); // Visible immediately

  // Connecting Lines
  const lines = svg
    .selectAll(".comparison-line")
    .data(comparisons)
    .enter()
    .insert("line", ".comparison-node")
    .attr("class", "comparison-line")
    .attr("x1", cx)
    .attr("y1", cy)
    .attr("x2", (d) => d.x)
    .attr("y2", (d) => d.y)
    .style("opacity", 0.6);

  // Rectangles and Text for Comparisons
  comparisonGroups.each(function (d) {
    const g = d3.select(this);
    const boxW = 140;
    const boxH = 50;

    g.append("rect")
      .attr("x", -boxW / 2)
      .attr("y", -boxH / 2)
      .attr("width", boxW)
      .attr("height", boxH)
      .attr("rx", 5);

    g.append("text")
      .attr("dy", "-0.2em")
      .style("font-weight", "bold")
      .style("fill", "#ff4d4d")
      .text(d.label.split(" ").slice(0, 2).join(" "));

    g.append("text")
      .attr("dy", "1.0em")
      .style("font-size", "0.6rem")
      .style("fill", "#ccc")
      .text(d.label.split(" ").slice(2).join(" "));
  });

  // Tooltip Interaction
  comparisonGroups
    .on("mouseover", function (event, d) {
      const tooltip = d3.select("#tooltip");
      tooltip
        .style("opacity", 1)
        .html(`<strong>${d.label}</strong><br><br>${d.context}`)
        .style("left", (event.clientX + 15) + "px")
        .style("top", (event.clientY - 15) + "px");

      d3.select(this).select("rect").style("fill", "#300");
    })
    .on("mouseout", function () {
      d3.select("#tooltip").style("opacity", 0);
      d3.select(this).select("rect").style("fill", "rgba(20, 0, 0, 0.8)");
    });

  // --- Animation Trigger ---
  container.node().animate_in = () => {
    // Reset to center/invisible for the pop effect
    comparisonGroups
      .attr("transform", `translate(${cx}, ${cy})`)
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 150)
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .style("opacity", 1);

    lines
      .attr("x2", cx)
      .attr("y2", cy)
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 150)
      .attr("x2", (d) => d.x)
      .attr("y2", (d) => d.y)
      .style("opacity", 0.6);
  };

  // Initialize Pie Chart
  draw_pie_chart();
}

function draw_pie_chart() {
  if (!price_inequality_data) return;

  const container = d3.select(".pie-container");
  if (container.empty()) return;

  container.selectAll("*").remove();

  const width = 280;
  const height = 250;
  const radius = Math.min(width, height) / 2 - 20; // Reduced radius to prevent overlap

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("margin-top", "20px") // Add margin to separate from title
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const colorMap = {
    "Sub-Saharan Africa": "#e63946",
    "India / Middle East": "#f4a261",
    "US / Europe": "#2a9d8f",
  };

  const pie = d3
    .pie()
    .value((d) => d.percentage)
    .sort(null);

  const data_ready = pie(price_inequality_data.regional_distribution);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);
  const labelArc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius * 0.6);

  // Slices
  svg
    .selectAll("path")
    .data(data_ready)
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", (d) => colorMap[d.data.region] || d.data.color)
    .attr("stroke", "#1a0505")
    .style("stroke-width", "2px")
    .style("opacity", 0.9)
    .on("mouseover", function (event, d) {
      d3.select(this).style("opacity", 1).attr("stroke", "#fff");
      const tooltip = d3.select("#tooltip"); // Use standard tooltip
      tooltip
        .style("opacity", 1)
        .html(`<strong>${d.data.region}</strong><br>${d.data.percentage}% of patients`)
        .style("left", (event.clientX + 15) + "px")
        .style("top", (event.clientY - 15) + "px");
    })
    .on("mousemove", function (event) {
      d3.select("#tooltip")
        .style("left", (event.clientX + 15) + "px")
        .style("top", (event.clientY - 15) + "px");
    })
    .on("mouseout", function () {
      d3.select(this).style("opacity", 0.9).attr("stroke", "#1a0505");
      d3.select("#tooltip").style("opacity", 0);
    });

  // Labels
  svg
    .selectAll("text")
    .data(data_ready)
    .enter()
    .append("text")
    .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
    .style("text-anchor", "middle")
    .style("font-size", "0.8rem")
    .style("font-weight", "bold")
    .style("fill", "#fff")
    .style("pointer-events", "none")
    .each(function (d) {
      const el = d3.select(this);
      el.append("tspan")
        .text(d.data.percentage + "%")
        .attr("x", 0)
        .attr("dy", "-0.2em")
        .style("font-size", "1.1rem");

      el.append("tspan")
        .text(
          d.data.region === "Sub-Saharan Africa"
            ? "Africa"
            : d.data.region === "India / Middle East"
              ? "India, ME"
              : "US/EU"
        )
        .attr("x", 0)
        .attr("dy", "1.1em")
        .style("font-size", "0.7rem");
    });
}
