/**
 * Visualization 6: The Path To Approval - Sankey Diagram
 * Shows flow of CRISPR trials through regulatory phases to FDA approval
 * Data: sankey_data.json (nodes, links, casgevy_path, statistics)
 */

let sankeyState = {
  data: null,
  svg: null,
  isAnimated: false,
};

const proPalette = {
  primary: "#2dfaff", // Neon Blue
  secondary: "#4a9eff", // Blue
  accent: "#00ff88", // Green
  gold: "#ffd700", // Gold
  base: "rgba(45, 250, 255, 0.1)",
};

/**
 * Initialize the Sankey diagram
 */
async function initSankeyDiagram() {
  const container = document.getElementById("sankey-container");
  if (!container) {
    console.error("Sankey container not found");
    return;
  }

  // Load data
  try {
    const data = await d3.json("../data/processed/sankey_data.json");
    sankeyState.data = data;
    createSankeyDiagram(container, data);
  } catch (error) {
    console.error("Error loading Sankey data:", error);
    container.innerHTML =
      '<p style="color: #ff6b6b;">Error loading data. Please check console.</p>';
  }
}

/**
 * Create the Sankey diagram visualization
 */
function createSankeyDiagram(container, data) {
  // Clear existing content
  container.innerHTML = "";

  // Set up dimensions - fixed internal coordinate system for consistent layout
  const width = 1400; // Increased internal width to fit everything comfortably
  const height = 700; // Increased internal height
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };

  // Create SVG with viewBox for responsiveness
  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%")
    .style("max-height", "80vh"); // Ensure it doesn't get too tall

  sankeyState.svg = svg;

  // Create tooltip
  const tooltip = d3
    .select("body")
    .selectAll(".sankey-tooltip")
    .data([0])
    .join("div")
    .attr("class", "sankey-tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.9)")
    .style("color", "white")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("z-index", "1000")
    .style("border", `1px solid ${proPalette.primary}`);

  // Manual Sankey layout - positioning nodes and links manually
  const nodeWidth = 140; // Slightly wider nodes
  const nodeHeight = 70; // Slightly taller nodes

  // Calculate positions for nodes based on layers
  // Spread them out more horizontally since we have a wider viewBox
  const startX = 100;
  const gapX = 250; // Increased gap between layers

  const layer1X = startX;
  const layer2X = startX + gapX;
  const layer3X = startX + gapX * 2;
  const layer4X = startX + gapX * 3;
  const layer5X = startX + gapX * 4;

  const centerY = height / 2;

  const nodePositions = [
    { x: layer1X, y: centerY - nodeHeight / 2 }, // 0: All Clinical Trials
    { x: layer2X, y: centerY - 180 }, // 1: Phase 1
    { x: layer3X, y: centerY - 180 }, // 2: Phase 2
    { x: layer4X, y: centerY - 180 }, // 3: Phase 3
    { x: layer5X, y: centerY - 240 }, // 4: FDA Approval
    { x: layer3X, y: centerY + 120 }, // 5: Long-term Follow-up
  ];

  // Draw links (flows) as curved paths
  const linksGroup = svg.append("g").attr("class", "links");

  data.links.forEach((link, i) => {
    const source = nodePositions[link.source];
    const target = nodePositions[link.target];
    const isGold = link.target === 4; // To FDA Approval
    const isFollowUp = link.target === 5;

    // Calculate link thickness based on value
    // Dynamic scaling: Find max value in links to normalize
    const maxLinkValue = d3.max(data.links, (d) => d.value) || 1;

    // Scale thickness relative to nodeHeight (approx 60px max)
    const thickness = Math.max(4, (link.value / maxLinkValue) * 60);

    const sourceX = source.x + nodeWidth;
    const sourceY = source.y + nodeHeight / 2;
    const targetX = target.x;
    const targetY = target.y + nodeHeight / 2;

    // Create curved path
    const path = d3.path();
    path.moveTo(sourceX, sourceY);
    path.bezierCurveTo(
      sourceX + (targetX - sourceX) * 0.5,
      sourceY,
      sourceX + (targetX - sourceX) * 0.5,
      targetY,
      targetX,
      targetY
    );
    const pathString = path.toString();

    // Draw link path
    const linkPath = linksGroup
      .append("path")
      .attr("d", pathString)
      .attr(
        "stroke",
        isGold
          ? proPalette.gold
          : isFollowUp
          ? proPalette.secondary
          : proPalette.primary
      )
      .attr("stroke-width", thickness)
      .attr("fill", "none")
      .attr("opacity", 0.2)
      .style("cursor", "pointer")
      .on("mouseover", function (event) {
        d3.select(this).attr("opacity", 0.6);
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(
            `<strong>${data.nodes[link.source].name} → ${
              data.nodes[link.target].name
            }</strong><br/>${link.label}`
          )
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.2);
        tooltip.transition().duration(500).style("opacity", 0);
      });

    // Animate link appearing (drawing effect)
    const totalLength = linkPath.node().getTotalLength();
    linkPath
      .attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1500)
      .delay(i * 300) // Staggered start
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0)
      .on("end", () => {
        // Start particle animation after path is drawn
        animateParticles(svg, pathString, link.value, isGold, isFollowUp);
      });
  });

  // Draw nodes
  const nodesGroup = svg.append("g").attr("class", "nodes");

  data.nodes.forEach((node, i) => {
    const pos = nodePositions[i];
    const isFDA = node.name.includes("FDA");
    const isFollowUp = node.name.includes("Follow-up");

    // Node group
    const nodeGroup = nodesGroup
      .append("g")
      .attr("transform", `translate(${pos.x},${pos.y})`)
      .attr("opacity", 0);

    // Node rectangle
    nodeGroup
      .append("rect")
      .attr("width", nodeWidth)
      .attr("height", nodeHeight)
      .attr(
        "fill",
        isFDA
          ? "rgba(255, 215, 0, 0.2)"
          : isFollowUp
          ? "rgba(74, 158, 255, 0.2)"
          : "rgba(45, 250, 255, 0.1)"
      )
      .attr(
        "stroke",
        isFDA
          ? proPalette.gold
          : isFollowUp
          ? proPalette.secondary
          : proPalette.primary
      )
      .attr("stroke-width", isFDA ? 3 : 2)
      .attr("rx", 8)
      .style("cursor", "pointer")
      .on("mouseover", function (event) {
        d3.select(this).attr("fill-opacity", 0.4);
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill-opacity", 0.2);
      });

    // Node text
    const words = node.name.split(" ");
    words.forEach((word, j) => {
      nodeGroup
        .append("text")
        .attr("x", nodeWidth / 2)
        .attr("y", nodeHeight / 2 - 10 + j * 18)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("fill", isFDA ? proPalette.gold : "white")
        .style("font-family", '"Courier New", monospace')
        .style("font-size", isFDA ? "16px" : "14px")
        .style("font-weight", "bold")
        .text(word);
    });

    // Animate node appearing
    nodeGroup
      .transition()
      .delay(i * 200)
      .duration(600)
      .attr("opacity", 1);
  });

  // Add Insight Boxes (Phase explanations)
  addInsightBoxes(svg, nodePositions, data);

  // Add Statistics Panel
  setTimeout(() => {
    addStatisticsPanel(container, data);
  }, 3000);
}

/**
 * Animate particles flowing along a path
 */
function animateParticles(svg, pathString, count, isGold, isFollowUp) {
  // Create a temporary path element to get point at length (if not already available)
  // But we can use the pathString to create a new path element if needed,
  // or just assume we can't easily access the DOM element here without passing it.
  // Actually, let's create a hidden path for calculation if we don't have the element.
  const pathNode = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  pathNode.setAttribute("d", pathString);

  const duration = 2500;
  const particlesToShow = Math.min(count, 10); // Limit particles for performance

  for (let p = 0; p < particlesToShow; p++) {
    setTimeout(() => {
      const particle = svg
        .append("circle")
        .attr("r", isGold ? 4 : 3)
        .attr(
          "fill",
          isGold ? proPalette.gold : isFollowUp ? proPalette.secondary : "white"
        )
        .attr("opacity", 0.8);

      const pathLength = pathNode.getTotalLength();

      particle
        .transition()
        .duration(duration)
        .ease(d3.easeLinear)
        .tween("path", function () {
          return function (t) {
            const point = pathNode.getPointAtLength(t * pathLength);
            particle.attr("cx", point.x).attr("cy", point.y);
          };
        })
        .on("end", function () {
          // Explode if reaching FDA approval
          if (isGold) {
            createGoldExplosion(svg, particle.attr("cx"), particle.attr("cy"));
          }
          particle.remove();
          // Repeat
          animateParticles(svg, pathString, 1, isGold, isFollowUp);
        });
    }, p * (duration / particlesToShow) + Math.random() * 500);
  }
}

/**
 * Create a gold explosion effect
 */
function createGoldExplosion(svg, cx, cy) {
  for (let e = 0; e < 8; e++) {
    const angle = (e / 8) * Math.PI * 2;
    svg
      .append("circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", 2)
      .attr("fill", proPalette.gold)
      .attr("opacity", 1)
      .transition()
      .duration(800)
      .attr("cx", parseFloat(cx) + Math.cos(angle) * 30)
      .attr("cy", parseFloat(cy) + Math.sin(angle) * 30)
      .attr("r", 0)
      .attr("opacity", 0)
      .remove();
  }
}

/**
 * Add Insight Boxes explaining the phases
 */
function addInsightBoxes(svg, nodePositions, data) {
  const insights = [
    {
      title: "Phase 1: Safety",
      lines: ["75 trials entered", "✓ 44% advanced"],
      x: nodePositions[1].x - 20, // Shift left to center (Node 140, Box 180 -> diff 40 -> shift 20)
      y: nodePositions[1].y + 90,
    },
    {
      title: "Phase 2: Efficacy",
      lines: ["33 trials tested", "✓ 24% advanced"],
      x: nodePositions[2].x - 20,
      y: nodePositions[2].y + 90,
    },
    {
      title: "Phase 3: Approval",
      lines: ["8 global trials", "✓ 1 Approved (Casgevy)"],
      x: nodePositions[3].x - 20,
      y: nodePositions[3].y + 90,
    },
  ];

  insights.forEach((insight, i) => {
    const g = svg
      .append("g")
      .attr("transform", `translate(${insight.x}, ${insight.y})`)
      .attr("opacity", 0);

    g.append("rect")
      .attr("width", 180) // Increased from 120
      .attr("height", 70) // Increased from 60
      .attr("fill", "rgba(0, 0, 0, 0.6)")
      .attr("stroke", proPalette.primary)
      .attr("stroke-width", 1)
      .attr("rx", 4);

    g.append("text")
      .attr("x", 90) // Centered (180/2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("fill", proPalette.primary)
      .style("font-family", '"Courier New", monospace')
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(insight.title);

    insight.lines.forEach((line, j) => {
      g.append("text")
        .attr("x", 90) // Centered (180/2)
        .attr("y", 38 + j * 16) // Increased spacing
        .attr("text-anchor", "middle")
        .style("fill", line.includes("✓") ? proPalette.accent : "white")
        .style("font-family", '"Courier New", monospace')
        .style("font-size", "12px")
        .text(line);
    });

    g.transition()
      .delay(2000 + i * 500)
      .duration(800)
      .attr("opacity", 1);
  });

  // Add Casgevy highlight
  const highlightGroup = svg.append("g").attr("class", "casgevy-highlight");

  // Add title
  highlightGroup
    .append("text")
    .attr("x", nodePositions[4].x + 70)
    .attr("y", nodePositions[4].y - 30)
    .attr("text-anchor", "middle")
    .style("fill", "#ffd700")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .attr("opacity", 0)
    .text("🏆 CASGEVY SUCCESS STORY")
    .transition()
    .duration(800)
    .attr("opacity", 1);

  // Add description box
  const infoBox = highlightGroup
    .append("g")
    .attr(
      "transform",
      `translate(${nodePositions[4].x - 40}, ${nodePositions[4].y + 90})`
    )
    .attr("opacity", 0);

  infoBox
    .append("rect")
    .attr("width", 240)
    .attr("height", 130) // Increased height for extra line
    .attr("fill", "rgba(0, 0, 0, 0.8)")
    .attr("stroke", "#ffd700")
    .attr("stroke-width", 2)
    .attr("rx", 8);

  const casgevy = data.casgevy_path;

  infoBox
    .append("text")
    .attr("x", 120)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("fill", "#ffd700")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text(casgevy.trialName);

  // Split disease into two lines
  infoBox
    .append("text")
    .attr("x", 120)
    .attr("y", 45)
    .attr("text-anchor", "middle")
    .style("fill", "#2dfaff")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "14px")
    .text("Sickle Cell Disease");

  infoBox
    .append("text")
    .attr("x", 120)
    .attr("y", 60) // Second line
    .attr("text-anchor", "middle")
    .style("fill", "#2dfaff")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "14px")
    .text("& Beta-Thalassemia");

  infoBox
    .append("text")
    .attr("x", 120)
    .attr("y", 80) // Shifted down
    .attr("text-anchor", "middle")
    .style("fill", "#00ff88")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "14px")
    .text(`Approved: ${casgevy.approvalDate}`);

  infoBox
    .append("text")
    .attr("x", 120)
    .attr("y", 100) // Shifted down
    .attr("text-anchor", "middle")
    .style("fill", "#ffffff")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "12px")
    .text("First CRISPR therapy");

  infoBox
    .append("text")
    .attr("x", 120)
    .attr("y", 115) // Shifted down
    .attr("text-anchor", "middle")
    .style("fill", "#ffffff")
    .style("font-family", '"Courier New", monospace')
    .style("font-size", "12px")
    .text("approved by FDA");

  infoBox.transition().delay(3000).duration(800).attr("opacity", 1);
}

/**
 * Add statistics panel showing progression rates
 */
function addStatisticsPanel(container, data) {
  // Check if stats panel already exists
  if (container.querySelector(".sankey-stats")) return;

  const statsDiv = d3
    .select(container)
    .append("div")
    .attr("class", "sankey-stats")
    .style("margin-top", "20px")
    .style("padding", "20px")
    .style("background", "rgba(45, 250, 255, 0.05)")
    .style("border-top", `1px solid ${proPalette.primary}`)
    .style("font-family", '"Courier New", monospace')
    .style("opacity", 0);

  const stats = data.statistics;

  statsDiv
    .append("h4")
    .style("color", proPalette.primary)
    .style("margin-top", "0")
    .style("margin-bottom", "15px")
    .style("text-align", "center")
    .html(
      '<span style="margin-right: 10px">📊</span>TRIAL PROGRESSION STATISTICS'
    );

  const gridDiv = statsDiv
    .append("div")
    .style("display", "flex")
    .style("justify-content", "space-around")
    .style("flex-wrap", "wrap")
    .style("gap", "15px");

  // Add stat boxes
  const statBoxes = [
    {
      label: "Phase 1 → Phase 2",
      value: `${stats.progression_rates.phase1_to_phase2}%`,
      color: proPalette.accent,
    },
    {
      label: "Phase 2 → Phase 3",
      value: `${stats.progression_rates.phase2_to_phase3}%`,
      color: proPalette.gold,
    },
    {
      label: "Phase 3 → FDA Approval",
      value: `${stats.progression_rates.phase3_to_approval}%`,
      color: proPalette.gold,
    },
  ];

  statBoxes.forEach((stat) => {
    const box = gridDiv
      .append("div")
      .style("padding", "15px")
      .style("background", "rgba(0, 0, 0, 0.4)")
      .style("border-radius", "4px")
      .style("border-left", `4px solid ${stat.color}`)
      .style("min-width", "200px")
      .style("text-align", "center");

    box
      .append("div")
      .style("color", "#ffffff")
      .style("font-size", "14px")
      .style("margin-bottom", "8px")
      .text(stat.label);

    box
      .append("div")
      .style("color", stat.color)
      .style("font-size", "32px")
      .style("font-weight", "bold")
      .text(stat.value);
  });

  statsDiv.transition().duration(800).style("opacity", 1);
}

/**
 * Cleanup function
 */
function cleanupSankeyDiagram() {
  sankeyState = {
    data: null,
    svg: null,
    isAnimated: false,
  };
  // Remove tooltip
  d3.selectAll(".sankey-tooltip").remove();
}
