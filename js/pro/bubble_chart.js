// Bubble Chart Visualization
// Studies by Year and Species

// Animation duration (in milliseconds)
const BUBBLE_ANIMATION_DURATION = 800;

// Pause duration between view switches (in milliseconds)
const BUBBLE_VIEW_SWITCH_PAUSE_DURATION = 3000;

let bubbleChartDrawn = false;
let bubbleChartData = null;
let bubbleChartSVG = null;
let bubbleChartBubbles = null;
let bubbleChartCurrentMetric = "screenings";
let bubbleChartIsCombinedView = false;
let bubbleChartAutoToggleInterval = null;

function initBubbleChart(containerId) {
  if (bubbleChartDrawn) return;

  const container = d3.select(containerId);
  if (container.empty()) {
    console.error(`[bubble_chart] Container ${containerId} not found`);
    return;
  }

  // Set up dimensions and margins
  const margin = { top: 60, right: 320, bottom: 60, left: 140 };
  const el = document.querySelector(containerId);
  const width = el.clientWidth - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // Create SVG
  bubbleChartSVG = container
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select("#tooltip");

  // Initialize tooltip as hidden
  tooltip.style("opacity", 0).style("display", "none");

  // Load and process data
  d3.csv("../data/processed/bubble_chart_data.csv")
    .then(function (rawData) {
      // Filter out rows with missing YEAR or ORGANISM_OFFICIAL
      const validData = rawData.filter((d) => {
        const year = d.YEAR;
        const organism = d.ORGANISM_OFFICIAL;
        const yearNum = parseInt(year);
        const hasValidYear =
          year &&
          year !== "NaN" &&
          year !== "" &&
          year !== "null" &&
          !isNaN(yearNum) &&
          yearNum > 1900 &&
          yearNum < 2100;
        const hasValidOrg =
          organism &&
          organism !== "" &&
          organism !== "null" &&
          organism.trim() !== "";
        return hasValidYear && hasValidOrg;
      });

      // Store valid data for re-aggregation when metric changes
      let allValidData = validData;

      // Function to aggregate data based on selected metric
      function aggregateData(metric) {
        let aggregated;

        if (metric === "screenings") {
          aggregated = d3.rollup(
            allValidData,
            (v) => v.length,
            (d) => {
              const year = parseInt(d.YEAR);
              return isNaN(year) || year <= 0 ? null : year;
            },
            (d) => {
              const org = (d.ORGANISM_OFFICIAL || "").trim();
              return org && org !== "" && org !== "null" ? org : null;
            }
          );
        } else if (metric === "genes") {
          aggregated = d3.rollup(
            allValidData,
            (v) => {
              return d3.sum(v, (d) => {
                const size = parseFloat(d.FULL_SIZE);
                return isNaN(size) ? 0 : size;
              });
            },
            (d) => {
              const year = parseInt(d.YEAR);
              return isNaN(year) || year <= 0 ? null : year;
            },
            (d) => {
              const org = (d.ORGANISM_OFFICIAL || "").trim();
              return org && org !== "" && org !== "null" ? org : null;
            }
          );
        } else if (metric === "diseases") {
          aggregated = d3.rollup(
            allValidData,
            (v) => {
              const cellTypes = new Set();
              v.forEach((d) => {
                const cellType = (d.CELL_TYPE || "").trim();
                if (cellType && cellType !== "" && cellType !== "null") {
                  cellTypes.add(cellType);
                }
              });
              return cellTypes.size;
            },
            (d) => {
              const year = parseInt(d.YEAR);
              return isNaN(year) || year <= 0 ? null : year;
            },
            (d) => {
              const org = (d.ORGANISM_OFFICIAL || "").trim();
              return org && org !== "" && org !== "null" ? org : null;
            }
          );
        }

        const data = [];
        aggregated.forEach((yearMap, year) => {
          yearMap.forEach((value, species) => {
            if (year !== null && species !== null) {
              data.push({
                year: year,
                species: species,
                count: value,
              });
            }
          });
        });

        return data;
      }

      // Initial aggregation
      bubbleChartData = aggregateData("screenings");
      bubbleChartCurrentMetric = "screenings";

      // Get unique years and species
      const years = Array.from(
        new Set(bubbleChartData.map((d) => d.year))
      ).sort(d3.ascending);
      const species = Array.from(
        new Set(bubbleChartData.map((d) => d.species))
      ).sort();

      if (
        bubbleChartData.length === 0 ||
        years.length === 0 ||
        species.length === 0
      ) {
        console.error("[bubble_chart] No valid data found");
        return;
      }

      // Create scales with break for middle years
      const breakStart = 1975;
      const breakEnd = 2010;
      const breakWidth = width * 0.15;
      const gapWidth = width * 0.05;
      const recentWidth = width - breakWidth - gapWidth;

      const earlyYears = years.filter((y) => y <= breakStart);
      const recentYears = years.filter((y) => y >= breakEnd);
      const minRecent = d3.min(recentYears);
      const maxRecent = d3.max(recentYears);

      const xScale = function (year) {
        if (year <= breakStart) {
          const earlyMin = d3.min(years);
          const earlyMax = breakStart;
          if (earlyMax === earlyMin) return breakWidth / 2;
          return ((year - earlyMin) / (earlyMax - earlyMin)) * breakWidth;
        } else {
          const recentMin = minRecent || breakEnd;
          const recentMax = maxRecent || d3.max(years);
          if (recentMax === recentMin)
            return breakWidth + gapWidth + recentWidth / 2;
          return (
            breakWidth +
            gapWidth +
            ((year - recentMin) / (recentMax - recentMin)) * recentWidth
          );
        }
      };

      xScale.domain = () => [d3.min(years), d3.max(years)];
      xScale.range = () => [0, width];

      const getTickValues = () => {
        const ticks = [];
        if (earlyYears.length > 0) {
          ticks.push(d3.min(earlyYears));
          if (
            earlyYears.length > 1 &&
            d3.max(earlyYears) !== d3.min(earlyYears)
          ) {
            ticks.push(d3.max(earlyYears));
          }
        }
        const sortedRecent = recentYears.sort((a, b) => a - b);
        sortedRecent.forEach((y, i) => {
          if (i === 0 || i === sortedRecent.length - 1 || i % 2 === 0) {
            ticks.push(y);
          }
        });
        return ticks.sort((a, b) => a - b);
      };

      const yScale = d3
        .scaleBand()
        .domain(species)
        .range([0, height])
        .paddingInner(0.2);

      let sizeScale = d3
        .scaleSqrt()
        .domain([0, d3.max(bubbleChartData, (d) => d.count)])
        .range([10, 60]);

      function getMetricLabel(metric) {
        switch (metric) {
          case "screenings":
            return "Number of Screenings";
          case "genes":
            return "Number of Genes";
          case "diseases":
            return "Number of Diseases";
          default:
            return "Value";
        }
      }

      function formatMetricValue(value, metric) {
        if (metric === "genes") {
          return Math.round(value).toLocaleString();
        }
        return value.toLocaleString();
      }

      // Color palette - 5 luminous, bright colors for dark theme with easy differentiation
      const themeColors = [
        "#2dfaff", // Bright cyan/teal (project theme)
        "#0099ff", // Bright Blue
        "#00ffcc", // Bright Turquoise
        "#00ff88", // Bright luminous green/lime
        "#0055ff", // Royal Blue
      ];

      let colorPalette = themeColors;

      while (colorPalette.length < species.length) {
        colorPalette = colorPalette.concat(colorPalette);
      }

      const colorScale = d3
        .scaleOrdinal()
        .domain(species)
        .range(colorPalette.slice(0, species.length));

      // Pre-calculate base positions
      bubbleChartData.forEach((d) => {
        const basePos = xScale(d.year);
        const jitterRange =
          d.year <= breakStart ? breakWidth * 0.05 : recentWidth * 0.005;
        d.baseX = basePos + (Math.random() - 0.5) * jitterRange;
        d.baseY_separate =
          yScale(d.species) +
          yScale.bandwidth() / 2 +
          (Math.random() - 0.5) * yScale.bandwidth() * 0.15;
        d.baseY_combined = height / 2 + (Math.random() - 0.5) * height * 0.04;
      });

      const yAxis = d3.axisLeft(yScale).tickPadding(8);

      const yAxisGroup = bubbleChartSVG
        .append("g")
        .attr("class", "axis")
        .call(yAxis);

      const speciesLabel = bubbleChartSVG
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -100)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#2dfaff")
        .text("Species");

      const title = bubbleChartSVG
        .append("text")
        .attr("x", width / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "#2dfaff")
        .text("Bubble Chart: Studies by Year and Species");

      // Function to update view
      function updateView(combined) {
        bubbleChartIsCombinedView = combined;

        if (combined) {
          bubbleChartData.forEach((d) => {
            d.baseY_combined =
              height / 2 + (Math.random() - 0.5) * height * 0.04;
          });
        }

        const simulation = d3
          .forceSimulation(bubbleChartData)
          .force("x", d3.forceX((d) => d.baseX).strength(0.8))
          .force(
            "y",
            d3
              .forceY((d) => (combined ? d.baseY_combined : d.baseY_separate))
              .strength(combined ? 2.0 : 1.2)
          )
          .force(
            "collision",
            d3.forceCollide(
              (d) => sizeScale(d.count) * 0.95 + (combined ? 0.5 : 1)
            )
          )
          .stop();

        for (let i = 0; i < 150; i++) simulation.tick();

        bubbleChartBubbles
          .transition()
          .duration(BUBBLE_ANIMATION_DURATION)
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y);

        if (combined) {
          yAxisGroup
            .selectAll(".tick")
            .transition()
            .duration(BUBBLE_ANIMATION_DURATION)
            .attr("opacity", 0);

          speciesLabel
            .transition()
            .duration(BUBBLE_ANIMATION_DURATION)
            .attr("opacity", 0);

          title.text("Bubble Chart: Combined View (All Species Unified)");
        } else {
          yAxisGroup
            .selectAll(".tick")
            .transition()
            .duration(BUBBLE_ANIMATION_DURATION)
            .attr("opacity", 1);

          speciesLabel
            .transition()
            .duration(BUBBLE_ANIMATION_DURATION)
            .attr("opacity", 1);

          title.text("Bubble Chart: Studies by Year and Species");
        }
      }

      // Initialize with separate view
      let simulation = d3
        .forceSimulation(bubbleChartData)
        .force("x", d3.forceX((d) => d.baseX).strength(0.8))
        .force("y", d3.forceY((d) => d.baseY_separate).strength(1.2))
        .force(
          "collision",
          d3.forceCollide((d) => sizeScale(d.count) * 0.95 + 1)
        )
        .stop();

      for (let i = 0; i < 150; i++) simulation.tick();

      // Draw bubbles
      bubbleChartBubbles = bubbleChartSVG
        .selectAll(".bubble")
        .data(bubbleChartData)
        .enter()
        .append("circle")
        .attr("class", "bubble")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", (d) => sizeScale(d.count))
        .attr("fill", (d) => colorScale(d.species))
        .attr("opacity", 0.75)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .on("mouseover", function (event, d) {
          d3.select(this).attr("opacity", 1).attr("stroke-width", 2.5);
          tooltip
            .style("opacity", 1)
            .style("display", "block")
            .html(
              `
                        <strong>Species:</strong> ${d.species}<br/>
                        <strong>Year:</strong> ${d.year}<br/>
                        <strong>${getMetricLabel(
                bubbleChartCurrentMetric
              )}:</strong> ${formatMetricValue(
                d.count,
                bubbleChartCurrentMetric
              )}
                    `
            )
            .style("left", event.clientX + 10 + "px")
            .style("top", event.clientY - 10 + "px");
        })
        .on("mouseout", function () {
          d3.select(this).attr("opacity", 0.75).attr("stroke-width", 1.5);
          tooltip.style("opacity", 0).style("display", "none");
        });

      // Add X-axis
      const tickValues = getTickValues();
      const axisGroup = bubbleChartSVG
        .append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`);

      const axisLine = axisGroup
        .selectAll(".domain")
        .data([null])
        .enter()
        .append("path")
        .attr("class", "domain")
        .attr(
          "d",
          `M 0,0 L ${breakWidth},0 M ${breakWidth + gapWidth},0 L ${width},0`
        )
        .attr("stroke", "#556a9c")
        .attr("stroke-width", 1);

      tickValues.forEach((year) => {
        const xPos = xScale(year);
        if (xPos < breakWidth || xPos > breakWidth + gapWidth) {
          axisGroup
            .append("line")
            .attr("x1", xPos)
            .attr("x2", xPos)
            .attr("y1", 0)
            .attr("y2", 6)
            .attr("stroke", "#556a9c")
            .attr("stroke-width", 1);

          axisGroup
            .append("text")
            .attr("x", xPos)
            .attr("y", 9)
            .attr("dy", "0.71em")
            .style("text-anchor", "middle")
            .style("font-size", "10px")
            .style("fill", "#556a9c")
            .text(year);
        }
      });

      const breakY = height + 3;
      axisGroup
        .append("line")
        .attr("x1", breakWidth)
        .attr("x2", breakWidth + 8)
        .attr("y1", breakY)
        .attr("y2", breakY - 8)
        .attr("stroke", "#556a9c")
        .attr("stroke-width", 1.5);

      axisGroup
        .append("line")
        .attr("x1", breakWidth + gapWidth - 8)
        .attr("x2", breakWidth + gapWidth)
        .attr("y1", breakY - 8)
        .attr("y2", breakY)
        .attr("stroke", "#556a9c")
        .attr("stroke-width", 1.5);

      bubbleChartSVG
        .append("text")
        .attr("transform", `translate(${width / 2}, ${height + 40})`)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#2dfaff")
        .text("Year");

      // Add legend
      const legend = bubbleChartSVG
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + 120}, 20)`);

      const legendItems = legend
        .selectAll(".legend-item")
        .data(species)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`);

      legendItems
        .append("circle")
        .attr("r", 6)
        .attr("fill", (d) => colorScale(d))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);

      legendItems
        .append("text")
        .attr("x", 12)
        .attr("y", 4)
        .style("font-size", "9px")
        .style("fill", "#e0e0e0")
        .text((d) => (d.length > 15 ? d.substring(0, 15) + "..." : d));

      // Metric dropdown handler (if exists)
      const metricSelect = document.getElementById("bubbleMetricSelect");
      if (metricSelect) {
        d3.select("#bubbleMetricSelect").on("change", function () {
          const selectedMetric = this.value;
          bubbleChartCurrentMetric = selectedMetric;

          bubbleChartData = aggregateData(selectedMetric);

          const maxCount = d3.max(bubbleChartData, (d) => d.count);
          sizeScale.domain([0, maxCount]).range([10, 60]);

          bubbleChartData.forEach((d) => {
            const basePos = xScale(d.year);
            const jitterRange =
              d.year <= breakStart ? breakWidth * 0.05 : recentWidth * 0.005;
            d.baseX = basePos + (Math.random() - 0.5) * jitterRange;
            d.baseY_separate =
              yScale(d.species) +
              yScale.bandwidth() / 2 +
              (Math.random() - 0.5) * yScale.bandwidth() * 0.15;
            d.baseY_combined =
              height / 2 + (Math.random() - 0.5) * height * 0.04;
          });

          bubbleChartBubbles.data(bubbleChartData);

          const newSimulation = d3
            .forceSimulation(bubbleChartData)
            .force("x", d3.forceX((d) => d.baseX).strength(0.8))
            .force(
              "y",
              d3
                .forceY((d) =>
                  bubbleChartIsCombinedView
                    ? d.baseY_combined
                    : d.baseY_separate
                )
                .strength(bubbleChartIsCombinedView ? 2.0 : 1.2)
            )
            .force(
              "collision",
              d3.forceCollide(
                (d) =>
                  sizeScale(d.count) * 0.95 +
                  (bubbleChartIsCombinedView ? 0.5 : 1)
              )
            )
            .stop();

          for (let i = 0; i < 150; i++) newSimulation.tick();

          bubbleChartBubbles
            .transition()
            .duration(BUBBLE_ANIMATION_DURATION)
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("r", (d) => sizeScale(d.count));

          title.text(
            `Bubble Chart: ${getMetricLabel(
              selectedMetric
            )} by Year and Species`
          );
        });
      }

      // Manual toggle handler
      const viewToggle = document.getElementById("bubbleViewToggle");
      if (viewToggle) {
        // Set initial state
        viewToggle.checked = bubbleChartIsCombinedView;

        viewToggle.addEventListener("change", function () {
          bubbleChartIsCombinedView = this.checked;
          updateView(bubbleChartIsCombinedView);
        });
      }

      bubbleChartDrawn = true;
      console.log("[bubble_chart] Chart initialized");
    })
    .catch(function (error) {
      console.error("[bubble_chart] Error loading data:", error);
    });
}

// Cleanup function
function cleanupBubbleChart() {
  // No interval to clear anymore
}
