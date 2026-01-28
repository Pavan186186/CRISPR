// --- Bloom Chart Component ---
function draw_bloom_chart(container_id) {
  // Ensure this path matches your folder structure
  const data_url = "../data/processed/bloom_data.json";

  d3.json(data_url)
    .then((data) => {
      if (!data || data.length === 0) {
        console.error("Bloom Chart: No data found in JSON");
        return;
      }

      // Data is already processed in the JSON file
      // Just ensure it's sorted if needed
      data.sort((a, b) => b.Value - a.Value);

      const el = document.querySelector(container_id);
      if (!el) return;

      // --- CLEAR PREVIOUS CHART FOR RE-ANIMATION ---
      d3.select(container_id).selectAll("*").remove();

      // Create a wrapper for positioning the button
      const wrapper = d3
        .select(container_id)
        .style("position", "relative")
        .style("width", "100%")
        .style("height", "100%");

      // --- READ MORE BUTTON ---
      wrapper
        .append("div")
        .attr("class", "read-more-btn")
        .style("position", "absolute")
        .style("top", "0px")
        .style("right", "0px")
        .style("cursor", "pointer")
        .style("background", "rgba(0, 255, 204, 0.1)")
        .style("border", "1px solid #00ffcc")
        .style("color", "#00ffcc")
        .style("padding", "4px 8px")
        .style("border-radius", "4px")
        .style("font-size", "0.6rem")
        .style("font-family", "Courier New")
        .style("text-transform", "uppercase")
        .style("z-index", "10")
        .text("+ READ MORE")
        .on("click", showModal);

      // --- CHART SETUP ---
      const width = el.clientWidth;
      const height = 300;

      // Square size for radial chart
      const size = Math.min(width, height);
      // Decreased margin to make the bloom bigger
      const margin = 40;
      const chartRadius = size / 2 - margin;

      const svg = wrapper
        .append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `${-size / 2} ${-size / 2} ${size} ${size}`)
        .style("overflow", "visible")
        .append("g");

      const inner_radius = 20;
      const outer_radius = chartRadius;

      const angle = d3
        .scaleLinear()
        .domain([0, data.length])
        .range([0, 2 * Math.PI]);

      const radius_scale = d3
        .scaleLinear()
        .domain([0, 10]) // Normalized Metric is 0-10
        .range([inner_radius, outer_radius]);

      // --- NEW COLOR SCALE (REVERSED) ---
      // Dark Blue (Low/0) -> Blue (Mid/5) -> Green/Cyan (High/10)
      const color_scale = d3
        .scaleLinear()
        .domain([0, 5, 10])
        .range(["#2a4a6c", "#0099ff", "#00ffcc"]);

      // Tooltip
      let tooltip = d3.select("body").select(".bloom-tooltip");
      if (tooltip.empty()) {
        tooltip = d3
          .select("body")
          .append("div")
          .attr("class", "bloom-tooltip")
          .style("position", "fixed")
          .style("background", "rgba(10, 20, 40, 0.95)")
          .style("border", "1px solid #2dfaff")
          .style("padding", "8px")
          .style("border-radius", "4px")
          .style("color", "#fff")
          .style("font-family", "Courier New")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("opacity", 0)
          .style("z-index", "9999");
      }

      // Draw Petals
      svg
        .selectAll("path.petal")
        .data(data)
        .join("path")
        .attr("class", "petal")
        .attr("fill", (d) => color_scale(d.Value))
        .attr("fill-opacity", 0.7)
        .attr("stroke", "#fff")
        // Thinner stroke for more petals
        .attr("stroke-width", 0.3)
        .attr("d", (d, i) => {
          // Start path at center (radius = inner_radius) for "bloom" effect
          const r = inner_radius;
          const a0 = angle(i);
          const a1 = angle(i + 1);
          const arc = d3.path();
          arc.moveTo(0, 0);
          arc.arc(0, 0, r, a0, a1);
          arc.closePath();
          return arc.toString();
        })
        .on("mouseover", function (event, d) {
          d3.select(this).attr("fill-opacity", 1).attr("stroke-width", 1.5);
          tooltip.transition().duration(200).style("opacity", 1);
          tooltip
            .html(
              `
                    <strong>${d.Country_Region}</strong><br>
                    <span style="color:#aaa; font-size:10px">${
                      d.Category
                    }</span><br>
                    Score: ${d.OriginalValue} -> ${d.Value.toFixed(1)}/10
                    ${d.Notes ? `<br><em>${d.Notes}</em>` : ""}
                `
            )
            .style("left", event.clientX + 15 + "px")
            .style("top", event.clientY - 25 + "px");
        })
        .on("mouseout", function () {
          d3.select(this).attr("fill-opacity", 0.7).attr("stroke-width", 0.3);
          tooltip.transition().duration(200).style("opacity", 0);
        })
        .transition()
        .delay((d, i) => i * 10) // Faster animation per petal
        .duration(800)
        .attrTween("d", function (d, i) {
          const r_final = radius_scale(d.Value);
          const a0 = angle(i);
          const a1 = angle(i + 1);
          const arc = d3.path();
          return (t) => {
            const r_current = d3.interpolate(inner_radius, r_final)(t);
            arc.moveTo(0, 0);
            arc.arc(0, 0, r_current, a0, a1);
            arc.closePath();
            return arc.toString();
          };
        });

      // Center Circle
      svg
        .append("circle")
        .attr("r", inner_radius)
        .attr("fill", "#050a14")
        .attr("stroke", "#2dfaff")
        .attr("stroke-width", 2);

      // --- LEGEND ---
      const legendGroup = svg
        .append("g")
        .attr("transform", `translate(${size / 2 - 70}, ${size / 2 - 30})`); // Bottom right

      legendGroup
        .append("text")
        .attr("x", 0)
        .attr("y", -8)
        .text("Openness Scale")
        .attr("fill", "#89f7fe")
        .attr("font-size", "9px")
        .attr("font-family", "Courier New");

      const legendGradient = svg
        .append("defs")
        .append("linearGradient")
        .attr("id", "bloom-legend-gradient");

      // Updated Legend Gradient Stops (Reversed)
      legendGradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#2a4a6c"); // Dark Blue (Low)
      legendGradient
        .append("stop")
        .attr("offset", "50%")
        .attr("stop-color", "#0099ff"); // Blue (Mid)
      legendGradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#00ffcc"); // Green (High)

      legendGroup
        .append("rect")
        .attr("width", 70)
        .attr("height", 6)
        .style("fill", "url(#bloom-legend-gradient)");

      legendGroup
        .append("text")
        .attr("x", 0)
        .attr("y", 16)
        .text("0")
        .attr("fill", "#aaa")
        .attr("font-size", "7px")
        .attr("font-family", "Courier New");
      legendGroup
        .append("text")
        .attr("x", 70)
        .attr("y", 16)
        .text("10")
        .attr("fill", "#aaa")
        .attr("font-size", "7px")
        .attr("font-family", "Courier New")
        .attr("text-anchor", "end");

      // --- MODAL LOGIC ---
      function showModal() {
        let modal = d3.select("body").select("#info-modal");
        if (modal.empty()) {
          modal = d3
            .select("body")
            .append("div")
            .attr("id", "info-modal")
            .style("position", "fixed")
            .style("top", "0")
            .style("left", "0")
            .style("width", "100%")
            .style("height", "100%")
            .style("background", "rgba(0,0,0,0.8)")
            .style("display", "none")
            .style("justify-content", "center")
            .style("align-items", "center")
            .style("z-index", "20000")
            .style("backdrop-filter", "blur(5px)");

          const content = modal
            .append("div")
            .style("background", "#050a14")
            .style("border", "1px solid #2dfaff")
            .style("padding", "2rem")
            .style("max-width", "600px")
            .style("border-radius", "10px")
            .style("position", "relative")
            .style("box-shadow", "0 0 30px rgba(45, 250, 255, 0.2)");

          content
            .append("span")
            .html("&times;")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "20px")
            .style("font-size", "2rem")
            .style("cursor", "pointer")
            .style("color", "#2dfaff")
            .on("click", () => modal.style("display", "none"));

          content
            .append("h2")
            .text("Agricultural Gene Editing: Global Regulations")
            .style("color", "#2dfaff")
            .style("font-family", "Courier New")
            .style("margin-top", "0")
            .style("border-bottom", "1px solid #1a2a4c")
            .style("padding-bottom", "10px");

          content
            .append("div")
            .html(
              `
                        <p style="color: #e0e0e0; line-height: 1.6;">
                            This chart visualizes the regulatory openness of various countries regarding <strong>CRISPR-edited crops and animals</strong>.
                        </p>
                        <p style="color: #e0e0e0; line-height: 1.6;">
                            Scores for crops (originally out of 8) have been normalized to a 10-point scale to match animal regulations.
                        </p>
                        <ul style="color: #ccc; line-height: 1.6; margin-bottom: 1.5rem;">
                            <li><strong>Longer Petals (Score 8-10):</strong> Countries with permissive regulations (e.g., USA, Argentina).</li>
                            <li><strong>Shorter Petals (Score 0-4):</strong> Countries with restrictive GMO-like regulations (e.g., EU, New Zealand).</li>
                        </ul>
                        <p style="color: #89f7fe; font-size: 0.9rem;">
                            <em>Data Source: Global Gene Editing Regulation Tracker (2023)</em>
                        </p>
                    `
            )
            .style("font-family", "sans-serif");
        }
        modal.style("display", "flex");
      }
    })
    .catch((error) => {
      console.error("Error loading Bloom Chart data:", error);
    });
}
