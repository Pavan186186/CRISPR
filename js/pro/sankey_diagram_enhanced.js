/**
 * Enhanced Sankey Diagram - Path to FDA Approval
 * Beautiful animated flow visualization showing trial progression
 * Uses D3 Sankey plugin for proper flow layout
 */

let sankeyState = {
  data: null,
  svg: null,
  isAnimated: false
};

/**
 * Initialize the enhanced Sankey diagram
 */
async function initSankeyDiagram() {
  const container = document.getElementById('sankey-container');
  if (!container) {
    console.error('Sankey container not found');
    return;
  }

  // Load data
  try {
    const data = await d3.json('../data/processed/sankey_data.json');
    sankeyState.data = data;
    createEnhancedSankey(container, data);
  } catch (error) {
    console.error('Error loading Sankey data:', error);
    container.innerHTML = '<p style="color: #ff6b6b;">Error loading data. Please check console.</p>';
  }
}

/**
 * Create enhanced Sankey diagram with proper D3 Sankey layout
 */
function createEnhancedSankey(container, data) {
  // Clear existing content
  container.innerHTML = '';

  // Set up dimensions
  const width = container.offsetWidth || 1000;
  const height = 700;
  const margin = { top: 60, right: 200, bottom: 100, left: 150 };

  // Create SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  sankeyState.svg = svg;

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Prepare Sankey data structure
  const sankeyData = {
    nodes: data.nodes.map((d, i) => ({
      ...d,
      index: i,
      color: getSankeyNodeColor(d.name)
    })),
    links: data.links.map(d => ({
      ...d,
      color: getSankeyLinkColor(d)
    }))
  };

  // Create manual Sankey layout (simplified but effective)
  const nodeWidth = 30;
  const nodePadding = 40;

  // Position nodes in columns
  const columns = [
    [0], // All Clinical Trials
    [1], // Phase 1
    [2], // Phase 2
    [3], // Phase 3
    [4], // FDA Approval
    [5]  // Long-term Follow-up
  ];

  // Calculate node positions
  sankeyData.nodes.forEach((node, i) => {
    const colIndex = columns.findIndex(col => col.includes(i));
    const colNodeIndex = columns[colIndex].indexOf(i);

    node.x0 = (colIndex * chartWidth) / (columns.length - 1);
    node.x1 = node.x0 + nodeWidth;

    // Vertical positioning
    const totalNodesInCol = columns[colIndex].length;
    const verticalSpace = chartHeight / (totalNodesInCol + 1);
    node.y0 = verticalSpace * (colNodeIndex + 1) - 30;
    node.y1 = node.y0 + 60;
  });

  // Calculate link paths
  sankeyData.links.forEach(link => {
    const source = sankeyData.nodes[link.source];
    const target = sankeyData.nodes[link.target];

    link.width = (link.value / d3.max(data.links, d => d.value)) * 60 + 10;
    link.path = createSankeyPath(source, target, link.width);
  });

  // Draw links with animation
  const linksGroup = g.append('g').attr('class', 'links');

  sankeyData.links.forEach((link, i) => {
    const linkGroup = linksGroup.append('g')
      .attr('opacity', 0);

    // Create gradient for each link
    const gradientId = `link-gradient-${i}`;
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', link.path.x1)
      .attr('y1', link.path.y1)
      .attr('x2', link.path.x2)
      .attr('y2', link.path.y2);

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', link.color)
      .attr('stop-opacity', 0.6);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', link.color)
      .attr('stop-opacity', 0.3);

    // Draw link path
    const path = linkGroup.append('path')
      .attr('d', link.path.d)
      .attr('fill', `url(#${gradientId})`)
      .attr('stroke', 'none')
      .style('cursor', 'pointer');

    // Add link label
    const label = linkGroup.append('text')
      .attr('x', (link.path.x1 + link.path.x2) / 2)
      .attr('y', (link.path.y1 + link.path.y2) / 2)
      .attr('text-anchor', 'middle')
      .attr('dy', '-5')
      .style('fill', '#2dfaff')
      .style('font-family', '"Courier New", monospace')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(`${link.value} trials`);

    // Hover effects
    path.on('mouseover', function() {
      d3.select(this.parentNode).attr('opacity', 1);
      label.attr('opacity', 1);
    })
    .on('mouseout', function() {
      d3.select(this.parentNode).attr('opacity', 0.8);
      label.attr('opacity', 0.7);
    });

    // Animate link appearing
    setTimeout(() => {
      linkGroup.transition()
        .duration(1200)
        .attr('opacity', 0.8);
    }, i * 500 + 500);
  });

  // Draw nodes with animation
  const nodesGroup = g.append('g').attr('class', 'nodes');

  sankeyData.nodes.forEach((node, i) => {
    const nodeGroup = nodesGroup.append('g')
      .attr('transform', `translate(${node.x0},${node.y0})`)
      .attr('opacity', 0);

    const isFDA = node.name.includes('FDA');
    const isPhase = node.name.includes('Phase');

    // Node rectangle
    nodeGroup.append('rect')
      .attr('width', node.x1 - node.x0)
      .attr('height', node.y1 - node.y0)
      .attr('fill', node.color)
      .attr('stroke', isFDA ? '#ffd700' : isPhase ? '#00ff88' : '#2dfaff')
      .attr('stroke-width', isFDA ? 4 : 3)
      .attr('rx', 6)
      .style('filter', isFDA ? 'drop-shadow(0 0 10px #ffd700)' : 'none');

    // Node label
    const label = nodeGroup.append('text')
      .attr('x', (node.x1 - node.x0) / 2)
      .attr('y', (node.y1 - node.y0) / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('fill', '#ffffff')
      .style('font-family', '"Courier New", monospace')
      .style('font-size', isFDA ? '11px' : '10px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none');

    // Split text into multiple lines if needed
    const words = node.name.split(' ');
    if (words.length > 2) {
      words.forEach((word, j) => {
        label.append('tspan')
          .attr('x', (node.x1 - node.x0) / 2)
          .attr('dy', j === 0 ? -(words.length - 1) * 6 : 12)
          .text(word);
      });
    } else {
      label.text(node.name);
    }

    // Animate node appearing
    setTimeout(() => {
      nodeGroup.transition()
        .duration(800)
        .attr('opacity', 1);
    }, i * 400);
  });

  // Add Casgevy highlight
  setTimeout(() => {
    addCasgevyHighlight(g, data, sankeyData.nodes[4]);
  }, 4000);

  // Add statistics panel
  setTimeout(() => {
    addStatisticsPanel(container, data);
  }, 4500);
}

/**
 * Create smooth Sankey path
 */
function createSankeyPath(source, target, width) {
  const x0 = source.x1;
  const x1 = target.x0;
  const y0 = (source.y0 + source.y1) / 2;
  const y1 = (target.y0 + target.y1) / 2;

  const xi = d3.interpolateNumber(x0, x1);
  const x2 = xi(0.3);
  const x3 = xi(0.7);

  const halfWidth = width / 2;

  const path = `
    M ${x0},${y0 - halfWidth}
    C ${x2},${y0 - halfWidth} ${x3},${y1 - halfWidth} ${x1},${y1 - halfWidth}
    L ${x1},${y1 + halfWidth}
    C ${x3},${y1 + halfWidth} ${x2},${y0 + halfWidth} ${x0},${y0 + halfWidth}
    Z
  `;

  return {
    d: path,
    x1: x0,
    y1: y0,
    x2: x1,
    y2: y1
  };
}

/**
 * Get color for Sankey node
 */
function getSankeyNodeColor(name) {
  if (name.includes('FDA')) return 'rgba(255, 215, 0, 0.4)';
  if (name.includes('Phase 1')) return 'rgba(45, 250, 255, 0.3)';
  if (name.includes('Phase 2')) return 'rgba(0, 255, 136, 0.3)';
  if (name.includes('Phase 3')) return 'rgba(255, 215, 0, 0.3)';
  if (name.includes('Follow-up')) return 'rgba(74, 158, 255, 0.3)';
  return 'rgba(45, 250, 255, 0.25)';
}

/**
 * Get color for Sankey link
 */
function getSankeyLinkColor(link) {
  const colors = ['#2dfaff', '#00ff88', '#ffd700', '#ffd700', '#4a9eff'];
  return colors[link.source] || '#2dfaff';
}

/**
 * Add Casgevy highlight
 */
function addCasgevyHighlight(g, data, fdaNode) {
  const highlightGroup = g.append('g').attr('class', 'casgevy-highlight');

  // Add animated particles along the golden path
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      highlightGroup.append('circle')
        .attr('cx', fdaNode.x0 - 100)
        .attr('cy', (fdaNode.y0 + fdaNode.y1) / 2)
        .attr('r', 3)
        .attr('fill', '#ffd700')
        .attr('opacity', 1)
        .transition()
        .duration(2000)
        .attr('cx', fdaNode.x1 + 20)
        .attr('opacity', 0)
        .remove();
    }, i * 200);
  }

  // Add title
  highlightGroup.append('text')
    .attr('x', fdaNode.x0 + (fdaNode.x1 - fdaNode.x0) / 2)
    .attr('y', fdaNode.y0 - 40)
    .attr('text-anchor', 'middle')
    .style('fill', '#ffd700')
    .style('font-family', '"Courier New", monospace')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .attr('opacity', 0)
    .text('🏆 CASGEVY SUCCESS')
    .transition()
    .duration(800)
    .attr('opacity', 1);

  // Add info box
  const casgevy = data.casgevy_path;
  const infoBox = highlightGroup.append('g')
    .attr('transform', `translate(${fdaNode.x1 + 20}, ${fdaNode.y0 - 30})`)
    .attr('opacity', 0);

  infoBox.append('rect')
    .attr('width', 180)
    .attr('height', 90)
    .attr('fill', 'rgba(0, 0, 0, 0.9)')
    .attr('stroke', '#ffd700')
    .attr('stroke-width', 2)
    .attr('rx', 8);

  const textData = [
    { y: 20, text: casgevy.trialName, color: '#ffd700', size: '12px', weight: 'bold' },
    { y: 38, text: casgevy.disease, color: '#2dfaff', size: '10px', weight: 'normal' },
    { y: 55, text: `Approved: ${casgevy.approvalDate}`, color: '#00ff88', size: '10px', weight: 'normal' },
    { y: 72, text: 'First CRISPR therapy', color: '#ffffff', size: '9px', weight: 'normal' }
  ];

  textData.forEach(item => {
    infoBox.append('text')
      .attr('x', 90)
      .attr('y', item.y)
      .attr('text-anchor', 'middle')
      .style('fill', item.color)
      .style('font-family', '"Courier New", monospace')
      .style('font-size', item.size)
      .style('font-weight', item.weight)
      .text(item.text);
  });

  infoBox.transition()
    .duration(800)
    .attr('opacity', 1);
}

/**
 * Add statistics panel
 */
function addStatisticsPanel(container, data) {
  const statsDiv = d3.select(container)
    .append('div')
    .attr('class', 'sankey-stats')
    .style('margin-top', '30px')
    .style('padding', '25px')
    .style('background', 'rgba(0, 0, 0, 0.6)')
    .style('border', '2px solid #2dfaff')
    .style('border-radius', '12px')
    .style('font-family', '"Courier New", monospace')
    .style('opacity', 0);

  const stats = data.statistics;

  statsDiv.append('h4')
    .style('color', '#2dfaff')
    .style('margin-top', '0')
    .style('margin-bottom', '20px')
    .style('font-size', '16px')
    .text('📊 TRIAL PROGRESSION STATISTICS');

  const gridDiv = statsDiv.append('div')
    .style('display', 'grid')
    .style('grid-template-columns', 'repeat(3, 1fr)')
    .style('gap', '20px');

  const statBoxes = [
    {
      label: 'Phase 1 → Phase 2',
      value: `${stats.progression_rates.phase1_to_phase2}%`,
      color: '#00ff88',
      icon: '→'
    },
    {
      label: 'Phase 2 → Phase 3',
      value: `${stats.progression_rates.phase2_to_phase3}%`,
      color: '#ffd700',
      icon: '→'
    },
    {
      label: 'Phase 3 → FDA Approval',
      value: `${stats.progression_rates.phase3_to_approval}%`,
      color: '#ffd700',
      icon: '🏆'
    }
  ];

  statBoxes.forEach(stat => {
    const box = gridDiv.append('div')
      .style('padding', '15px')
      .style('background', 'rgba(45, 250, 255, 0.05)')
      .style('border-radius', '8px')
      .style('border', `2px solid ${stat.color}`)
      .style('text-align', 'center')
      .style('transition', 'all 0.3s');

    box.append('div')
      .style('color', '#ffffff')
      .style('font-size', '11px')
      .style('margin-bottom', '8px')
      .style('opacity', '0.8')
      .text(stat.label);

    box.append('div')
      .style('color', stat.color)
      .style('font-size', '32px')
      .style('font-weight', 'bold')
      .style('margin-bottom', '5px')
      .text(stat.value);

    box.append('div')
      .style('color', stat.color)
      .style('font-size', '20px')
      .text(stat.icon);
  });

  statsDiv.transition()
    .duration(800)
    .style('opacity', 1);
}

/**
 * Cleanup function
 */
function cleanupSankeyDiagram() {
  sankeyState = {
    data: null,
    svg: null,
    isAnimated: false
  };
}
