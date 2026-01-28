// ============================================================================
// CRISPR PERIL VISUALIZATIONS - Compact versions for corner widgets
// ============================================================================

// ============================================================================
// TIMELINE VISUALIZATION (Compact)
// ============================================================================

function draw_timeline_chart(container_id) {
  const el = document.querySelector(container_id);
  if (!el) return;

  d3.select(container_id).selectAll("*").remove();

  // Load real data
  d3.json("../data/processed/anti_timeline_data.json").then((failedTrials) => {
    if (!failedTrials || failedTrials.length === 0) {
      d3.select(container_id).append("p").text("No data available");
      return;
    }

    // Parse dates
    failedTrials.forEach((d) => {
      d.date = new Date(d.date);
    });

    const margin = { top: 20, right: 15, bottom: 30, left: 15 };
    const width = el.clientWidth - margin.left - margin.right;
    // Use container height to fill space (responsive)
    const height = el.clientHeight - margin.top - margin.bottom;

    const svg = d3
      .select(container_id)
      .append("svg")
      .attr("class", "chart-svg")
      .attr("width", el.clientWidth)
      .attr("height", el.clientHeight) // Match container
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleTime()
      // Focus on 2020-2028 as requested
      .domain([new Date(2020, 0, 1), new Date(2028, 0, 1)])
      .range([0, width]);

    const colorScale = d3
      .scaleOrdinal()
      .domain(["Terminated", "Withdrawn", "Suspended"])
      .range(["#ff4d4d", "#ff8533", "#ffaa00"]);

    // Group trials by month for vertical positioning
    const trialsByMonth = d3.group(failedTrials, (d) => d3.timeMonth(d.date));

    failedTrials.forEach((trial) => {
      const monthKey = d3.timeMonth(trial.date);
      const trialsInMonth = Array.from(trialsByMonth.get(monthKey));
      const index = trialsInMonth.indexOf(trial);
      trial.yPosition = height / 2 + (index - trialsInMonth.length / 2) * 18;
    });

    // Add glow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "timeline-glow");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "2")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Draw timeline base
    svg
      .append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", height / 2)
      .attr("y2", height / 2)
      .attr("stroke", "rgba(255, 77, 77, 0.4)")
      .attr("stroke-width", 2)
      .transition()
      .duration(1000)
      .attr("x2", width);

    // X-axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(5) // Adjust tick count for focused range
      .tickFormat(d3.timeFormat("%Y"));
    svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height + 5})`)
      .style("opacity", 0)
      .call(xAxis)
      .transition()
      .duration(600)
      .delay(1000)
      .style("opacity", 1);

    // Draw markers
    const markers = svg
      .selectAll(".failure-marker")
      .data(failedTrials)
      .enter()
      .append("circle")
      .attr("class", "failure-marker")
      .attr("cx", (d) => xScale(d.date))
      .attr("cy", height / 2)
      .attr("r", 0)
      .attr("fill", (d) => colorScale(d.status))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .style("filter", "url(#timeline-glow)");

    // Animate markers
    markers
      .transition()
      .duration(400)
      .delay((d, i) => 1200 + i * 30)
      .attr("cy", (d) => d.yPosition)
      .attr("r", 4);

    // Tooltip
    const tooltip = d3.select("#tooltip");

    markers
      .on("mouseenter", function (event, d) {
        d3.select(this).transition().duration(100).attr("r", 6);
        tooltip.style(
          "opacity",
          1
        ).html(`<strong style="color:#ff4d4d">${d.id}</strong><br/>
                       ${d.status} | ${d.phase}<br/>
                       <span style="color:#888">${d.reason}</span>`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.clientX + 15 + "px")
          .style("top", event.clientY - 15 + "px");
      })
      .on("mouseleave", function () {
        d3.select(this).transition().duration(100).attr("r", 4);
        tooltip.style("opacity", 0);
      });

    // Legend
    const legend = svg.append("g").attr("transform", `translate(0, -10)`);
    ["Terminated", "Withdrawn", "Suspended"].forEach((status, i) => {
      const g = legend
        .append("g")
        .attr("transform", `translate(${i * 75}, 0)`)
        .style("opacity", 0);
      g.append("circle").attr("r", 4).attr("fill", colorScale(status));
      g.append("text")
        .attr("x", 7)
        .attr("y", 3)
        .attr("fill", "#9c5555")
        .attr("font-size", "0.6rem")
        .text(status);
      g.transition()
        .duration(400)
        .delay(800 + i * 100)
        .style("opacity", 1);
    });
  });
}

// ============================================================================
// COST COMPARISON VISUALIZATION (Compact)
// ============================================================================

function draw_cost_chart(container_id) {
  const el = document.querySelector(container_id);
  if (!el) return;

  d3.select(container_id).selectAll("*").remove();

  const margin = { top: 10, right: 50, bottom: 10, left: 80 };
  const width = el.clientWidth - margin.left - margin.right;
  const height = 160 - margin.top - margin.bottom;

  const svg = d3
    .select(container_id)
    .append("svg")
    .attr("class", "chart-svg")
    .attr("width", el.clientWidth)
    .attr("height", 160)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(costData, (d) => d.cost)])
    .range([0, width]);

  const yScale = d3
    .scaleBand()
    .domain(costData.map((d) => d.treatment))
    .range([0, height])
    .padding(0.3);

  // Background bars
  svg
    .selectAll(".bar-bg")
    .data(costData)
    .enter()
    .append("rect")
    .attr("y", (d) => yScale(d.treatment))
    .attr("height", yScale.bandwidth())
    .attr("x", 0)
    .attr("width", width)
    .attr("fill", "rgba(255, 255, 255, 0.03)")
    .attr("rx", 3);

  // Main bars
  svg
    .selectAll(".cost-bar")
    .data(costData)
    .enter()
    .append("rect")
    .attr("class", "cost-bar")
    .attr("y", (d) => yScale(d.treatment))
    .attr("height", yScale.bandwidth())
    .attr("x", 0)
    .attr("width", 0)
    .attr("fill", (d) => d.color)
    .attr("rx", 3)
    .transition()
    .duration(800)
    .delay((d, i) => i * 150)
    .ease(d3.easeElasticOut.amplitude(1).period(0.5))
    .attr("width", (d) => xScale(d.cost));

  // Value labels
  svg
    .selectAll(".cost-label")
    .data(costData)
    .enter()
    .append("text")
    .attr("y", (d) => yScale(d.treatment) + yScale.bandwidth() / 2)
    .attr("x", 0)
    .attr("dy", "0.35em")
    .attr("fill", "#f0f0f0")
    .attr("font-size", "0.65rem")
    .attr("font-weight", "600")
    .style("opacity", 0)
    .text(
      (d) =>
        "$" +
        (d.cost >= 1000000
          ? (d.cost / 1000000).toFixed(1) + "M"
          : d.cost / 1000 + "K")
    )
    .transition()
    .duration(500)
    .delay((d, i) => 900 + i * 150)
    .attr("x", (d) => Math.min(xScale(d.cost) + 5, width - 30))
    .style("opacity", 1);

  // Y-axis labels
  svg
    .selectAll(".y-label")
    .data(costData)
    .enter()
    .append("text")
    .attr("x", -5)
    .attr("y", (d) => yScale(d.treatment) + yScale.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .attr("fill", "#9c5555")
    .attr("font-size", "0.6rem")
    .text((d) => d.treatment)
    .style("opacity", 0)
    .transition()
    .duration(400)
    .delay((d, i) => i * 100)
    .style("opacity", 1);
}

// ============================================================================
// ACCESS MAP VISUALIZATION (Compact)
// ============================================================================

function draw_access_map(container_id) {
  const el = document.querySelector(container_id);
  if (!el) return;

  d3.select(container_id).selectAll("*").remove();

  const width = el.clientWidth;
  const height = 180;

  const svg = d3
    .select(container_id)
    .append("svg")
    .attr("class", "chart-svg")
    .attr("width", width)
    .attr("height", height);

  const projection = d3
    .geoMercator()
    .scale(width / 5.5)
    .translate([width / 2, height / 1.3]);

  const path = d3.geoPath().projection(projection);
  const tooltip = d3.select("#tooltip");

  // Load world map
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    .then((world) => {
      const countries = topojson.feature(world, world.objects.countries);

      // Draw countries
      svg
        .selectAll(".country")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("class", (d) =>
          accessCountries.includes(d.properties.name)
            ? "country has-access"
            : "country"
        )
        .attr("d", path)
        .attr("fill", (d) =>
          accessCountries.includes(d.properties.name) ? "#8B0000" : "#1a1a1a"
        )
        .attr("stroke", "#4c1a1a")
        .attr("stroke-width", 0.3)
        .style("opacity", 0)
        .transition()
        .duration(400)
        .delay((d, i) => i * 3)
        .style("opacity", 1);

      // Add treatment centers
      const centers = svg
        .selectAll(".center-marker")
        .data(treatmentCenters)
        .enter()
        .append("circle")
        .attr("class", "center-marker")
        .attr("cx", (d) => projection([d.lon, d.lat])[0])
        .attr("cy", (d) => projection([d.lon, d.lat])[1])
        .attr("r", 0)
        .attr("fill", "#ffaa00")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.8)
        .style("cursor", "pointer");

      centers
        .transition()
        .duration(500)
        .delay((d, i) => 1000 + i * 80)
        .ease(d3.easeElasticOut.amplitude(1).period(0.5))
        .attr("r", (d) => Math.sqrt(d.centers) * 2);

      // Tooltip
      centers
        .on("mouseenter", function (event, d) {
          d3.select(this)
            .transition()
            .duration(100)
            .attr("r", (d) => Math.sqrt(d.centers) * 3);
          tooltip.style(
            "opacity",
            1
          ).html(`<strong style="color:#ffaa00">${d.city}, ${d.country}</strong><br/>
                       Centers: ${d.centers}`);
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", event.clientX + 12 + "px")
            .style("top", event.clientY - 10 + "px");
        })
        .on("mouseleave", function (event, d) {
          d3.select(this)
            .transition()
            .duration(100)
            .attr("r", (d) => Math.sqrt(d.centers) * 2);
          tooltip.style("opacity", 0);
        });
    })
    .catch((err) => {
      console.error("[access-map] Error loading map:", err);
      d3.select(container_id)
        .append("p")
        .attr(
          "style",
          "color:#ff4d4d; text-align:center; padding:1rem; font-size:0.8rem;"
        )
        .text("Map data unavailable");
    });
}

// ============================================================================
// REGULATORY LANDSCAPE CHART (Stacked Area/Bar Chart)
// ============================================================================

function draw_regulatory_chart(container_id) {
  const el = document.querySelector(container_id);
  if (!el) return;

  // Load real data
  d3.json("../data/processed/anti_regulatory_landscape.json").then(
    (regulatoryData) => {
      if (!regulatoryData || regulatoryData.length === 0) {
        d3.select(container_id).html("<p>No data available</p>");
        return;
      }

      d3.select(container_id).selectAll("*").remove();

      const margin = { top: 40, right: 100, bottom: 60, left: 100 }; // Balanced margins
      const width = el.clientWidth - margin.left - margin.right;
      const height = (el.clientHeight || 400) - margin.top - margin.bottom;

      const svg = d3
        .select(container_id)
        .append("svg")
        .attr("class", "chart-svg")
        .attr("width", el.clientWidth)
        .attr("height", el.clientHeight || 400)
        .style("display", "block") // Ensure block display
        .style("margin", "0 auto") // Center SVG if container allows
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Stack the data
      const keys = ["restrictive", "moderate", "permissive"];
      const stack = d3.stack().keys(keys);

      const series = stack(regulatoryData);

      const y = d3
        .scaleBand()
        .domain(regulatoryData.map((d) => d.region))
        .range([0, height])
        .padding(0.4);

      const x = d3.scaleLinear().domain([0, 100]).range([0, width]);

      const colorScale = d3
        .scaleOrdinal()
        .domain(keys)
        .range(["#8B0000", "#ff4d4d", "#ff9999"]); // Dark Red -> Light Red

      // Y-axis (Region Labels)
      svg
        .append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll("text")
        .style("fill", "#ff4d4d")
        .style("font-size", "0.75rem")
        .style("font-weight", "bold")
        .style("text-anchor", "end")
        .attr("dx", "-10px");

      // Remove Axis Line
      svg.select(".domain").remove();

      // Add title
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("fill", "#ff4d4d")
        .style("font-size", "0.9rem")
        .style("font-weight", "600")
        .style("text-transform", "uppercase")
        .style("letter-spacing", "2px")
        .text("Regulatory Stringency");

      // Draw stacked bars (Horizontal)
      const groups = svg
        .selectAll("g.layer")
        .data(series)
        .enter()
        .append("g")
        .attr("class", "layer")
        .attr("fill", (d) => colorScale(d.key));

      groups
        .selectAll("rect")
        .data((d) => d)
        .enter()
        .append("rect")
        .attr("y", (d) => y(d.data.region))
        .attr("height", y.bandwidth())
        .attr("x", (d) => x(d[0]))
        .attr("width", 0) // Animate width
        .transition()
        .duration(1000)
        .delay((_, i) => i * 100)
        .attr("width", (d) => x(d[1]) - x(d[0]));

      // Add Separator Lines (Tech Aesthetic)
      groups
        .selectAll("line")
        .data((d) => d)
        .enter()
        .append("line")
        .attr("x1", (d) => x(d[1]))
        .attr("x2", (d) => x(d[1]))
        .attr("y1", (d) => y(d.data.region))
        .attr("y2", (d) => y(d.data.region) + y.bandwidth())
        .attr("stroke", "#111")
        .attr("stroke-width", 2);

      // Tooltip Interactions
      const tooltip = d3.select("#tooltip");

      svg
        .selectAll("rect")
        .on("mouseenter", function (event, d) {
          const key = d3.select(this.parentNode).datum().key;
          const value = d[1] - d[0];

          // Highlight
          d3.select(this)
            .style("opacity", 0.8)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);

          tooltip.style(
            "opacity",
            1
          ).html(`<strong style="color:#ff4d4d">${d.data.region}</strong><br/>
                 <span style="color:#ccc; text-transform:capitalize">${key}</span>: ${Math.round(value)}%`);
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", event.clientX + 15 + "px")
            .style("top", event.clientY - 15 + "px");
        })
        .on("mouseleave", function () {
          d3.select(this).style("opacity", 1).attr("stroke", "none");
          tooltip.style("opacity", 0);
        });

      // Legend
      const legend = svg
        .append("g")
        .attr("transform", `translate(0, ${height + 20})`); // Bottom legend

      const legendData = [
        { key: "restrictive", label: "Restrictive" },
        { key: "moderate", label: "Moderate" },
        { key: "permissive", label: "Permissive" },
      ];

      let legendX = 0;
      legendData.forEach((item, i) => {
        const g = legend
          .append("g")
          .attr("transform", `translate(${legendX}, 0)`)
          .style("cursor", "default");

        g.append("rect")
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", colorScale(item.key));

        g.append("text")
          .attr("x", 15)
          .attr("y", 9)
          .attr("fill", "#aaa")
          .attr("font-size", "0.7rem")
          .text(item.label);

        legendX += 100; // Spacing
      });

      // Center Legend
      const totalLegendWidth = legendX - 20;
      legend.attr(
        "transform",
        `translate(${width / 2 - totalLegendWidth / 2}, ${height + 25})`
      );
    }
  );
}

// ============================================================================
// STAT COUNTER ANIMATION
// ============================================================================

function animateStatCounters(container_id) {
  const container = document.querySelector(container_id);
  if (!container) return;

  const statCards = container.querySelectorAll(".stat-card");

  statCards.forEach((card, index) => {
    const targetValue = parseFloat(card.dataset.count);
    const valueElement = card.querySelector(".stat-number");
    const labelText = card.querySelector(".stat-label").textContent;
    const isPercentage = labelText.includes("Rate") || labelText.includes("%");

    valueElement.textContent = isPercentage ? "0%" : "0";

    setTimeout(() => {
      animateValue(valueElement, 0, targetValue, 1000, isPercentage);
    }, index * 120);
  });
}

function animateValue(element, start, end, duration, isPercentage = false) {
  const startTime = performance.now();

  const updateValue = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = start + (end - start) * easeOut;

    element.textContent = isPercentage
      ? Math.round(current) + "%"
      : Math.round(current);

    if (progress < 1) {
      requestAnimationFrame(updateValue);
    }
  };

  requestAnimationFrame(updateValue);
}
