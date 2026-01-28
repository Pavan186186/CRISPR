// js/pro/network.js
(function () {
  let cas9NetworkBuilt = false;

  // expose a function to be called from main.js when the user scrolls
  window.initCas9Network = function () {
    if (cas9NetworkBuilt) return;
    cas9NetworkBuilt = true;

    const networkSvg = d3.select("#network-svg");
    if (networkSvg.empty()) {
      console.warn(
        "Network: #network-svg not found on this page, skipping init."
      );
      return;
    }

    // --- tooltip: use a dedicated ID for Cas9 network ---
    let tooltip = d3.select("#cas9-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body").append("div").attr("id", "cas9-tooltip");
    }

    const networkWidth = networkSvg.node().clientWidth;
    const networkHeight = networkSvg.node().clientHeight;

    const networkG = networkSvg.append("g");

    const MAX_ZOOM = 40;
    const zoom = d3
      .zoom()
      .scaleExtent([0.2, MAX_ZOOM])
      .on("zoom", (event) => networkG.attr("transform", event.transform));

    networkSvg.call(zoom);

    const dataPath = "../data/processed/network_data.json";
    console.log("[network] loading data from:", dataPath);

    function buildDemoGraph() {
      console.warn(
        "[network] Using demo data because real data was empty or failed."
      );

      const demoNodes = [
        {
          id: "Cas9-A",
          label: "Cas9-A",
          medianScore: 0.2,
          success: 90,
          precision: 0.9,
          technique: "RNP",
          time: "24h",
        },
        {
          id: "Cas9-B",
          label: "Cas9-B",
          medianScore: 0.4,
          success: 70,
          precision: 0.7,
          technique: "RNP",
          time: "48h",
        },
        {
          id: "Cas9-C",
          label: "Cas9-C",
          medianScore: 0.6,
          success: 50,
          precision: 0.5,
          technique: "mRNA",
          time: "48h",
        },
      ];

      const demoLinks = [
        { source: "Cas9-A", target: "Cas9-B", kind: "technique", value: 1 },
        { source: "Cas9-B", target: "Cas9-C", kind: "time", value: 1 },
      ];

      buildNetwork(demoNodes, demoLinks, true);
    }

    d3.json(dataPath)
      .then((data) => {
        console.log("[network] loaded data:", data);

        if (!data || !data.nodes || !data.nodes.length) {
          console.error("[network] invalid data format or empty nodes.");
          buildDemoGraph();
          return;
        }

        // Ensure cas9 property exists for color scale
        const nodes = data.nodes.map((n) => ({
          ...n,
          cas9: n.id, // Map id to cas9 for the color scale
        }));

        buildNetwork(nodes, data.links || [], false);
      })
      .catch((err) => {
        console.error("[network] error loading data:", err);
        buildDemoGraph();
      });

    function buildNetwork(networkNodes, networkLinks, isDemo) {
      console.log(
        "[network] building graph. nodes:",
        networkNodes.length,
        "links:",
        networkLinks.length,
        "demo?",
        isDemo
      );

      const maxSuccess = d3.max(networkNodes, (d) => d.success);
      const sizeScale = d3
        .scaleSqrt()
        .domain([0, maxSuccess || 1])
        .range([4, 26]);

      const precisionExtent = d3.extent(networkNodes, (d) => d.precision);
      const precisionScale = d3
        .scaleSequential(d3.interpolateCool)
        .domain(precisionExtent);

      const techniqueScale = d3.scaleOrdinal([
        "#2dfaff",
        "#0099ff",
        "#00ffcc",
        "#0055ff",
        "#89f7fe",
        "#2a4a6c",
        "#00ff88",
      ]);
      const cas9Scale = d3.scaleOrdinal([
        "#00ffcc",
        "#2dfaff",
        "#0099ff",
        "#0055ff",
        "#00ff88",
        "#89f7fe",
        "#2a4a6c",
      ]);

      const linkSelection = networkG
        .append("g")
        .attr("stroke-linecap", "round")
        .selectAll("line")
        .data(networkLinks)
        .enter()
        .append("line")
        .attr("class", "link");

      const nodeSelection = networkG
        .append("g")
        .selectAll("circle")
        .data(networkNodes)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("r", (d) => sizeScale(d.success))
        .style("cursor", "pointer")
        .call(
          d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

      const labelSelection = networkG
        .append("g")
        .selectAll("text")
        .data(networkNodes)
        .enter()
        .append("text")
        .attr("font-size", 10)
        .attr("dy", -10)
        .attr("text-anchor", "middle")
        .text((d) => d.label);

      const simulation = d3
        .forceSimulation(networkNodes)
        .force(
          "link",
          d3
            .forceLink(networkLinks)
            .id((d) => d.id)
            .distance(120)
        )
        .force("charge", d3.forceManyBody().strength(-260))
        .force("center", d3.forceCenter(networkWidth / 2, networkHeight / 2))
        .force(
          "collision",
          d3.forceCollide().radius((d) => sizeScale(d.success) + 8)
        )
        .on("tick", ticked);

      simulation.on("end", () => {
        const xs = networkNodes.flatMap((d) => [
          d.x - sizeScale(d.success),
          d.x + sizeScale(d.success),
        ]);
        const ys = networkNodes.flatMap((d) => [
          d.y - sizeScale(d.success),
          d.y + sizeScale(d.success),
        ]);

        const minX = d3.min(xs);
        const maxX = d3.max(xs);
        const minY = d3.min(ys);
        const maxY = d3.max(ys);

        const graphWidth = maxX - minX || 1;
        const graphHeight = maxY - minY || 1;

        const padding = 50;

        const fitScale = Math.min(
          (networkWidth - padding * 2) / graphWidth,
          (networkHeight - padding * 2) / graphHeight
        );

        const scale = Math.min(MAX_ZOOM, Math.max(0.2, fitScale * 0.9));

        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;

        const translateX = networkWidth / 2 - midX * scale;
        const translateY = networkHeight / 2 - midY * scale;

        networkSvg
          .transition()
          .duration(900)
          .ease(d3.easeCubicOut)
          .call(
            zoom.transform,
            d3.zoomIdentity.translate(translateX, translateY).scale(scale)
          );
      });

      function ticked() {
        linkSelection
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        nodeSelection.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

        labelSelection.attr("x", (d) => d.x).attr("y", (d) => d.y);
      }

      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = d.x;
        d.fy = d.y;
      }

      let colorMode = "precision";
      let successThreshold = 0;
      let selectedNodeId = null;

      function updateNodeStyles() {
        nodeSelection
          .attr("fill", (d) => {
            if (colorMode === "precision") return precisionScale(d.precision);
            if (colorMode === "technique") return techniqueScale(d.technique);
            if (colorMode === "cas9") return cas9Scale(d.cas9);
            return "#cccccc";
          })
          .attr("opacity", (d) => {
            const isSelected = d.id === selectedNodeId;
            const below = d.success < successThreshold;
            if (isSelected) return 1;
            if (below) return 0.12;
            return 0.9;
          });

        labelSelection.attr("opacity", (d) => {
          const isSelected = d.id === selectedNodeId;
          const below = d.success < successThreshold;
          if (isSelected) return 1;
          if (below) return 0.2;
          return 0.85;
        });

        linkSelection.attr("opacity", (d) => {
          const bothBelow =
            d.source.success < successThreshold &&
            d.target.success < successThreshold;

          if (selectedNodeId) {
            const connected =
              d.source.id === selectedNodeId || d.target.id === selectedNodeId;
            return connected ? 0.9 : 0.08;
          }

          return bothBelow ? 0.05 : 0.35;
        });
      }

      updateNodeStyles();

      nodeSelection
        .on("mouseover", (event, d) => {
          const activeColor = "#2dfaff"; // Neon blue for highlight
          const highlight = (mode) =>
            colorMode === mode
              ? `style="color: ${activeColor}; font-weight: bold; border-left: 2px solid ${activeColor}; padding-left: 4px;"`
              : "";

          tooltip.style("opacity", 1).html(`
              <strong>${d.label}</strong><br/>
              <span ${highlight(
                "cas9"
              )}>Median off-target score: <strong>${d.medianScore.toFixed(
            3
          )}</strong></span><br/>
              <span ${highlight(
                "success"
              )}>Success (scaled): <strong>${d.success.toFixed(
            1
          )}%</strong></span><br/>
              <span ${highlight("precision")}>Precision (scaled): <strong>${(
            d.precision * 100
          ).toFixed(1)}%</strong></span><br/>
              <span ${highlight("technique")}>Technique: ${
            d.technique
          }</span><br/>
              <span ${highlight("time")}>Time: ${d.time}</span>
            `);

          highlightNeighbors(d.id, true);
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", event.clientX + 14 + "px")
            .style("top", event.clientY - 10 + "px");
        })
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
          highlightNeighbors(null, false);
        })
        .on("click", (event, d) => {
          selectedNodeId = selectedNodeId === d.id ? null : d.id;
          updateNodeStyles();
        });

      function highlightNeighbors(nodeId, hoverOn) {
        if (!hoverOn || nodeId == null) {
          updateNodeStyles();
          return;
        }

        const neighborIds = new Set();
        networkLinks.forEach((l) => {
          if (l.source.id === nodeId) neighborIds.add(l.target.id);
          if (l.target.id === nodeId) neighborIds.add(l.source.id);
        });

        nodeSelection.attr("opacity", (d) => {
          if (d.id === nodeId) return 1;
          if (neighborIds.has(d.id)) return 0.9;
          return 0.08;
        });

        labelSelection.attr("opacity", (d) => {
          if (d.id === nodeId || neighborIds.has(d.id)) return 1;
          return 0.15;
        });

        linkSelection.attr("opacity", (l) => {
          const isNeighborLink =
            l.source.id === nodeId || l.target.id === nodeId;
          return isNeighborLink ? 0.9 : 0.08;
        });
      }

      d3.select("#successThreshold").on("input", function () {
        successThreshold = +this.value;
        d3.select("#successLabel").text(successThreshold + "%");
        updateNodeStyles();
      });

      d3.selectAll("#network-controls button[data-color-mode]").on(
        "click",
        function () {
          colorMode = d3.select(this).attr("data-color-mode");
          d3.selectAll("#network-controls button[data-color-mode]").classed(
            "active",
            false
          );
          d3.select(this).classed("active", true);
          updateNodeStyles();
        }
      );

      d3.select("#toggleEdges").on("change", function () {
        linkSelection.style("display", this.checked ? null : "none");
      });
    }
  };
})();
