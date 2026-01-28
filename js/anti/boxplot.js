// js/anti/boxplot.js
// OPTIMIZED: Loads pre-calculated summary JSON, no client-side CSV parsing.

(function () {
  if (!window.d3) {
    console.error("[boxplot] d3 not found; aborting boxplot init.");
    return;
  }

  const tooltip = d3.select("#tooltip");
  const boxplotSvg = d3.select("#boxplot-svg");

  if (boxplotSvg.empty()) {
    console.warn("[boxplot] No #boxplot-svg element found; skipping boxplot.");
    return;
  }

  // --- Dimensions ---
  // High res for crisp text
  const bpWidth = 1400;
  const bpHeight = 700; // Increased height

  const margin = { top: 60, right: 30, bottom: 200, left: 80 }; // Larger bottom margin for rotated text
  const innerWidth = bpWidth - margin.left - margin.right;
  const innerHeight = bpHeight - margin.top - margin.bottom;

  boxplotSvg.attr("viewBox", `0 0 ${bpWidth} ${bpHeight}`);

  const bpG = boxplotSvg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr("class", "boxplot");

  const xAxisG = bpG
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerHeight})`);

  const yAxisG = bpG.append("g").attr("class", "axis");

  // Y-axis label
  bpG
    .append("text")
    .attr("x", -innerHeight / 2)
    .attr("y", -55)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("fill", "#ffcccc")
    .attr("font-size", 16)
    .attr("font-family", "monospace")
    .style("letter-spacing", "2px")
    .text("OFF-TARGET SCORE");

  const xScale = d3
    .scaleBand()
    .paddingInner(0.5)
    .paddingOuter(0.3)
    .range([0, innerWidth]);

  let yScaleMode = "log";
  let sortMode = "name";

  // --- LOAD DATA (SUMMARY JSON) ---
  const dataPath = "../data/processed/anti_boxplot_summary.json";

  d3.json(dataPath)
    .then((summaryData) => {
      if (!summaryData || !summaryData.length) {
        console.error("[boxplot] Summary data empty:", dataPath);
        return;
      }

      console.log(`[boxplot] Loaded summary for ${summaryData.length} variants`);

      // Filter to top 20 variants if dataset is huge (User request)
      // Or just render all if it's manageable (summary is light)
      // Let's keep all for now but render efficiently.
      let cas9Data = summaryData;

      // Global stats for scales
      // Note: Summary JSON should have min/max/q1/q3/median/outliers
      const allMins = cas9Data.map(d => d.min).filter(v => v != null);
      const allMaxs = cas9Data.map(d => d.max).filter(v => v != null);
      const globalMin = d3.min(allMins) || 0;
      const globalMax = d3.max(allMaxs) || 100;

      // --- SCALES & SORTING ---
      function getYScale(mode) {
        let minScore = globalMin > 0 ? globalMin : 0.01;
        let maxScore = globalMax;

        if (mode === "log") {
          return d3
            .scaleLog()
            .domain([minScore, maxScore * 2]) // More headroom
            .range([innerHeight, 0])
            .nice();
        } else {
          return d3
            .scaleLinear()
            .domain([0, maxScore * 1.1])
            .range([innerHeight, 0])
            .nice();
        }
      }

      function sortCas9Data() {
        if (sortMode === "name") {
          cas9Data.sort((a, b) => d3.ascending(a.cas9, b.cas9));
        } else if (sortMode === "medianAsc") {
          cas9Data.sort((a, b) => d3.ascending(a.median, b.median));
        } else if (sortMode === "medianDesc") {
          cas9Data.sort((a, b) => d3.descending(a.median, b.median));
        }
      }

      // --- RENDER ---
      function renderBoxplot() {
        sortCas9Data();

        // Limit to top 30 for performance if needed, but summary is fast
        // const renderData = cas9Data.slice(0, 30); 
        const renderData = cas9Data;

        const yScale = getYScale(yScaleMode);
        xScale.domain(renderData.map((d) => d.cas9));

        // X-axis (Rotated Labels Restored)
        const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
        xAxisG.call(xAxis);

        xAxisG.selectAll("text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end")
          .attr("dx", "-0.5em")
          .attr("dy", "0.5em")
          .attr("fill", "#e5e7eb")
          .style("font-family", "monospace")
          .style("font-size", "10px");

        // Y-axis
        const yAxis = yScaleMode === "log"
          ? d3.axisLeft(yScale).ticks(5, "~g")
          : d3.axisLeft(yScale).ticks(5);

        yAxisG.call(yAxis).selectAll("text")
          .attr("fill", "#e5e7eb")
          .style("font-family", "monospace")
          .style("font-size", "12px");

        yAxisG.selectAll("path,line").attr("stroke", "#6b7280");

        // JOIN
        const groups = bpG.selectAll(".cas9-group").data(renderData, (d) => d.cas9);

        // ENTER
        const groupsEnter = groups
          .enter()
          .append("g")
          .attr("class", "cas9-group");

        // Box (Hollow with light outline)
        groupsEnter
          .append("rect")
          .attr("class", "box")
          .attr("fill", "#fff") // Must have fill for events
          .attr("fill-opacity", 0) // But invisible
          .style("pointer-events", "all")
          .attr("stroke", "#a3b8cc") // Light blue-grey
          .attr("stroke-width", 1.5);

        // Median (Red)
        groupsEnter
          .append("line")
          .attr("class", "median")
          .attr("stroke", "#ff4d4d")
          .attr("stroke-width", 2);

        // Whiskers
        groupsEnter.append("line").attr("class", "whisker-vert").attr("stroke", "#a3b8cc");
        groupsEnter.append("line").attr("class", "whisker-top").attr("stroke", "#a3b8cc");
        groupsEnter.append("line").attr("class", "whisker-bottom").attr("stroke", "#a3b8cc");

        // Outliers (Red dots)
        groupsEnter.append("g").attr("class", "outliers-group");

        // MERGE
        const groupsMerged = groupsEnter.merge(groups);

        // Transition for position
        groupsMerged
          .transition()
          .duration(800)
          .attr("transform", (d) => `translate(${xScale(d.cas9)},0)`);

        const bw = xScale.bandwidth();

        groupsMerged.select(".box")
          .on("mouseover", function (event, d) {
            // Highlight Group
            const group = d3.select(this.parentNode);
            group.selectAll("line").attr("stroke", "#ff4d4d").attr("stroke-width", 2);
            d3.select(this)
              .attr("stroke", "#ff4d4d")
              .attr("stroke-width", 2)
              .attr("fill-opacity", 0.2) // Faint red fill
              .attr("fill", "#ff4d4d");

            tooltip.style("opacity", 1)
              .html(`
                        <strong style="color:#ff4d4d">${d.cas9}</strong><br/>
                        <span style="color:#ccc">Median:</span> ${d.median}<br/>
                        <span style="color:#ccc">Q1 - Q3:</span> ${d.q1} - ${d.q3}<br/>
                        <span style="color:#ccc">Range:</span> ${d.nonOutlierMin} - ${d.nonOutlierMax}
                     `)
              .style("left", (event.clientX + 15) + "px")
              .style("top", (event.clientY - 15) + "px");
          })
          .on("mousemove", function (event) {
            tooltip.style("left", (event.clientX + 15) + "px")
              .style("top", (event.clientY - 15) + "px");
          })
          .on("mouseout", function () {
            // Revert Group
            const group = d3.select(this.parentNode);
            group.selectAll(".whisker-vert, .whisker-top, .whisker-bottom").attr("stroke", "#a3b8cc").attr("stroke-width", 1);
            group.select(".median").attr("stroke", "#ff4d4d").attr("stroke-width", 2); // Keep median red

            d3.select(this)
              .attr("stroke", "#a3b8cc")
              .attr("stroke-width", 1.5)
              .attr("fill-opacity", 0)
              .attr("fill", "#fff");

            tooltip.style("opacity", 0);
          })
          .transition().duration(800)
          .attr("x", 0)
          .attr("y", d => yScale(d.q3))
          .attr("width", bw)
          .attr("height", d => Math.max(1, yScale(d.q1) - yScale(d.q3)));

        groupsMerged.select(".median")
          .transition().duration(800)
          .attr("x1", 0).attr("x2", bw)
          .attr("y1", d => yScale(d.median)).attr("y2", d => yScale(d.median));

        groupsMerged.select(".whisker-vert")
          .transition().duration(800)
          .attr("x1", bw / 2).attr("x2", bw / 2)
          .attr("y1", d => yScale(d.nonOutlierMin)).attr("y2", d => yScale(d.nonOutlierMax));

        groupsMerged.select(".whisker-top")
          .transition().duration(800)
          .attr("x1", bw * 0.25).attr("x2", bw * 0.75)
          .attr("y1", d => yScale(d.nonOutlierMax)).attr("y2", d => yScale(d.nonOutlierMax));

        groupsMerged.select(".whisker-bottom")
          .transition().duration(800)
          .attr("x1", bw * 0.25).attr("x2", bw * 0.75)
          .attr("y1", d => yScale(d.nonOutlierMin)).attr("y2", d => yScale(d.nonOutlierMin));

        // Outliers: Render ALL outliers but optimized
        groupsMerged.each(function (d) {
          const g = d3.select(this).select(".outliers-group");

          // Render all outliers but as simple circles
          const out = g.selectAll("circle").data(d.outliers || []);

          out.enter()
            .append("circle")
            .attr("r", 2)
            .attr("fill", "#ff4d4d")
            .attr("opacity", 0) // Start invisible
            .attr("cx", bw / 2)
            .attr("cy", o => yScale(o.value || o))
            .merge(out)
            .on("mouseover", function (event, d) {
              d3.select(this).attr("r", 4).attr("opacity", 1);
              tooltip.style("opacity", 1)
                .html(`<strong>Outlier</strong><br>Value: ${d.value || d}`)
                .style("left", (event.clientX + 10) + "px")
                .style("top", (event.clientY - 28) + "px");
            })
            .on("mouseout", function () {
              d3.select(this).attr("r", 2).attr("opacity", 0.6);
              tooltip.style("opacity", 0);
            })
            .transition() // Animate in/move
            .duration(800)
            .attr("opacity", 0.6)
            .attr("cx", bw / 2)
            .attr("cy", o => yScale(o.value || o));

          out.exit().remove();
        });

        groups.exit().remove();
      }

      renderBoxplot();
      window.renderBoxplot = renderBoxplot;

      // Controls
      d3.selectAll("#boxplot-controls button[data-scale]").on("click", function () {
        d3.selectAll("#boxplot-controls button[data-scale]").classed("active", false);
        d3.select(this).classed("active", true);
        yScaleMode = this.getAttribute("data-scale");
        renderBoxplot();
      });

      d3.selectAll("#boxplot-controls button[data-sort]").on("click", function () {
        d3.selectAll("#boxplot-controls button[data-sort]").classed("active", false);
        d3.select(this).classed("active", true);
        sortMode = this.getAttribute("data-sort");
        renderBoxplot();
      });

    })
    .catch((err) => {
      console.error("[boxplot] Error loading summary data:", err);
    });
})();
