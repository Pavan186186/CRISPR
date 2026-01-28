/**
 * Visualization 5: Exponential Hope - The Revolution Timeline
 * Animated area chart showing explosive growth of CRISPR clinical trials (2015-2025)
 * Data: timeline_data.json (year, trials, cumulative, milestones)
 */

let timelineState = {
  data: null,
  svg: null,
  isAnimated: false,
};

/**
 * Initialize the timeline visualization
 */
async function initTimelineChart() {
  const container = document.getElementById("timeline-chart-container");
  if (!container) {
    console.error("Timeline chart container not found");
    return;
  }

  // Load data
  try {
    const data = await d3.json("../data/processed/timeline_data.json");
    timelineState.data = data;
    createTimelineChart(container, data);
  } catch (error) {
    console.error("Error loading timeline data:", error);
    container.innerHTML =
      '<p style="color: #ff6b6b;">Error loading data. Please check console.</p>';
  }
}

/**
 * Create the timeline area chart with animations
 */
function createTimelineChart(container, data) {
  // Clear existing content
  container.innerHTML = "";

  // Set up dimensions with better margins to prevent overflow
  const width = container.offsetWidth || 1000;
  const height = 650; // Increased to 750px for more vertical space
  const margin = { top: 180, right: 80, bottom: 80, left: 100 }; // Increased top margin
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Create SVG
  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("overflow", "visible"); // Allow milestones to be visible

  timelineState.svg = svg;

  // Create main chart group
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create scales with padding
  const xScale = d3.scaleLinear().domain([2015, 2025]).range([0, chartWidth]);

  const maxTrials = d3.max(data.timeline, (d) => d.trials);
  const yScale = d3
    .scaleLinear()
    .domain([0, maxTrials + 3]) // Add padding at top
    .range([chartHeight, 0])
    .nice();

  // Add grid lines for better readability
  g.append("g")
    .attr("class", "grid")
    .selectAll("line")
    .data(yScale.ticks(6))
    .join("line")
    .attr("x1", 0)
    .attr("x2", chartWidth)
    .attr("y1", (d) => yScale(d))
    .attr("y2", (d) => yScale(d))
    .attr("stroke", "#1a2a4c")
    .attr("stroke-width", 0.5)
    .attr("stroke-dasharray", "2,2")
    .attr("opacity", 0.3);

  // Create gradient for area fill
  const gradient = svg
    .append("defs")
    .append("linearGradient")
    .attr("id", "timeline-area-gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");

  gradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#2dfaff")
    .attr("stop-opacity", 0.8);

  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#00ff88")
    .attr("stop-opacity", 0.2);

  // Create area generator
  const area = d3
    .area()
    .x((d) => xScale(d.year))
    .y0(chartHeight)
    .y1((d) => yScale(d.trials))
    .curve(d3.curveMonotoneX);

  // Create line generator
  const line = d3
    .line()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.trials))
    .curve(d3.curveMonotoneX);

  // Draw axes
  const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(11);

  const yAxis = d3.axisLeft(yScale).ticks(6);

  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(xAxis)
    .style("color", "#2dfaff")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "12px");

  g.append("g")
    .attr("class", "y-axis")
    .call(yAxis)
    .style("color", "#2dfaff")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "12px");

  // Axis labels
  g.append("text")
    .attr("x", chartWidth / 2)
    .attr("y", chartHeight + 50)
    .attr("text-anchor", "middle")
    .style("fill", "#2dfaff")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("YEAR");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -chartHeight / 2)
    .attr("y", -60)
    .attr("text-anchor", "middle")
    .style("fill", "#2dfaff")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("NEW CLINICAL TRIALS");

  // Draw area path (initially hidden)
  const areaPath = g
    .append("path")
    .datum(data.timeline)
    .attr("class", "area-path")
    .attr("fill", "url(#timeline-area-gradient)")
    .attr("d", area)
    .attr("opacity", 0);

  // Draw line path (initially hidden)
  const linePath = g
    .append("path")
    .datum(data.timeline)
    .attr("class", "line-path")
    .attr("fill", "none")
    .attr("stroke", "#ffd700")
    .attr("stroke-width", 3)
    .attr("d", line)
    .attr("opacity", 0);

  // Add data points
  const circles = g
    .selectAll(".data-point")
    .data(data.timeline)
    .join("circle")
    .attr("class", "data-point")
    .attr("cx", (d) => xScale(d.year))
    .attr("cy", (d) => yScale(d.trials))
    .attr("r", 0)
    .attr("fill", "#ffd700")
    .attr("stroke", "#2dfaff")
    .attr("stroke-width", 2)
    .style("cursor", "pointer");

  // Add tooltips to points
  circles
    .on("mouseover", function (event, d) {
      d3.select(this).attr("r", 8).attr("stroke-width", 3);

      // Show tooltip
      g.append("text")
        .attr("class", "point-tooltip")
        .attr("x", xScale(d.year))
        .attr("y", yScale(d.trials) - 15)
        .attr("text-anchor", "middle")
        .style("fill", "#ffd700")
        .style("font-family", '"Courier New", monospace')
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(`${d.trials} trials`);
    })
    .on("mouseout", function () {
      d3.select(this).attr("r", 5).attr("stroke-width", 2);

      g.selectAll(".point-tooltip").remove();
    });

  // Animation function
  function animateChart() {
    if (timelineState.isAnimated) return;
    timelineState.isAnimated = true;

    // Fade in area
    areaPath.transition().duration(2000).attr("opacity", 1);

    // Fade in line
    linePath.transition().duration(2000).attr("opacity", 1);

    // Animate circles appearing
    circles
      .transition()
      .delay((d, i) => i * 150)
      .duration(600)
      .attr("r", 5);

    // Add milestone annotations with particle effects
    // Pass index (i) to stagger heights and prevent overlap
    data.milestones.forEach((milestone, i) => {
      setTimeout(() => {
        createMilestoneAnnotation(g, milestone, xScale, chartHeight, i);
      }, 2000 + i * 800);
    });
  }

  // Start animation after a short delay
  setTimeout(() => {
    animateChart();
  }, 300);
}

/**
 * Create milestone annotation with particle burst effect
 * Milestones are staggered at different heights to prevent overlap
 */
function createMilestoneAnnotation(g, milestone, xScale, chartHeight, index) {
  const x = xScale(milestone.year);

  // Stagger heights: alternate between different Y positions
  // Pattern with 75px vertical separation
  const yPositions = [-140, -65, -140, -65]; // 75px separation (140-65=75)
  const y = yPositions[index % yPositions.length];

  // Create particle burst
  const particleCount = 15;
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount;
    const distance = 30;

    g.append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", 2)
      .attr("fill", "#ffd700")
      .attr("opacity", 1)
      .transition()
      .duration(1000)
      .attr("cx", x + Math.cos(angle) * distance)
      .attr("cy", y + Math.sin(angle) * distance)
      .attr("r", 0)
      .attr("opacity", 0)
      .remove();
  }

  // Draw vertical line from milestone to chart
  g.append("line")
    .attr("class", "milestone-line")
    .attr("x1", x)
    .attr("x2", x)
    .attr("y1", y + 10)
    .attr("y2", chartHeight)
    .attr("stroke", "#ffd700")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5")
    .attr("opacity", 0)
    .transition()
    .duration(600)
    .attr("opacity", 0.5);

  // Add milestone text box
  const textBox = g
    .append("g")
    .attr("class", "milestone-text")
    .attr("transform", `translate(${x},${y})`)
    .attr("opacity", 0);

  // Calculate box dimensions
  const boxWidth = 220;
  const boxHeight = 65;

  // Background rectangle with better positioning
  textBox
    .append("rect")
    .attr("x", -boxWidth / 2)
    .attr("y", -boxHeight / 2)
    .attr("width", boxWidth)
    .attr("height", boxHeight)
    .attr("fill", "rgba(0, 0, 0, 0.95)")
    .attr("stroke", "#ffd700")
    .attr("stroke-width", 2)
    .attr("rx", 8);

  // Icon
  textBox
    .append("text")
    .attr("x", 0)
    .attr("y", -18)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .text(milestone.icon);

  // Title
  textBox
    .append("text")
    .attr("x", 0)
    .attr("y", 2)
    .attr("text-anchor", "middle")
    .style("fill", "#ffd700")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "11px")
    .style("font-weight", "bold")
    .text(milestone.title);

  // Description - split into two lines if needed
  const words = milestone.description.split(" ");
  const midpoint = Math.ceil(words.length / 2);
  const line1 = words.slice(0, midpoint).join(" ");
  const line2 = words.slice(midpoint).join(" ");

  textBox
    .append("text")
    .attr("x", 0)
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .style("fill", "#2dfaff")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "9px")
    .text(line1);

  if (line2) {
    textBox
      .append("text")
      .attr("x", 0)
      .attr("y", 27)
      .attr("text-anchor", "middle")
      .style("fill", "#2dfaff")
      .style("font-family", '"Courier New", monospace')
      .style("font-size", "9px")
      .text(line2);
  }

  // Fade in text box
  textBox.transition().duration(600).attr("opacity", 1);
}

/**
 * Cleanup function
 */
function cleanupTimelineChart() {
  timelineState = {
    data: null,
    svg: null,
    isAnimated: false,
  };
}
