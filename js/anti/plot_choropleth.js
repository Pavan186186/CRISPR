// --- Choropleth Logic ---

// 1. Static Definitions (Moved outside render loop)
const color_scale = d3
  .scaleLinear()
  .domain([0, 10])
  .range(["#800000", "#ff9999"]);

const id_to_name = {
  36: "Australia",
  76: "Brazil",
  124: "Canada",
  152: "Chile",
  156: "China",
  170: "Colombia",
  188: "Costa Rica",
  192: "Cuba",
  218: "Ecuador",
  222: "El Salvador",
  320: "Guatemala",
  340: "Honduras",
  356: "India",
  360: "Indonesia",
  376: "Israel",
  392: "Japan",
  404: "Kenya",
  484: "Mexico",
  554: "New Zealand",
  566: "Nigeria",
  578: "Norway",
  586: "Pakistan",
  600: "Paraguay",
  604: "Peru",
  608: "Philippines",
  643: "Russia",
  710: "South Africa",
  756: "Switzerland",
  804: "Ukraine",
  826: "United Kingdom",
  840: "United States",
  858: "Uruguay",
  32: "Argentina",
  50: "Bangladesh",
  68: "Bolivia",
  288: "Ghana",
  454: "Malawi",
};

// Cache for data map to avoid rebuilding if data object reference is same
let last_choropleth_data = null;
let cached_data_map = new Map();

function plot_choropleth(
  globe_context,
  projection,
  path_generator,
  country_features,
  choropleth_data,
  mouse_pos
) {
  // 2. Prepare Data Map (Memoized)
  if (choropleth_data !== last_choropleth_data) {
    cached_data_map.clear();
    choropleth_data.forEach((d) => {
      cached_data_map.set(d.country, +d.value);
    });
    last_choropleth_data = choropleth_data;
  }
  const data_map = cached_data_map;

  globe_context.save();

  // Data to return if hovered
  let hovered_data = null;

  country_features.forEach((feature) => {
    const country_name = id_to_name[feature.id];
    const value = data_map.get(country_name);

    globe_context.beginPath();
    path_generator(feature);

    // Check for hover
    if (mouse_pos && globe_context.isPointInPath(mouse_pos[0], mouse_pos[1])) {
      if (country_name && value !== undefined) {
        hovered_data = { name: country_name, value: value };
        // Highlight hovered country (lighter pink)
        globe_context.fillStyle = "#ffcccc";
      } else {
        globe_context.fillStyle = "rgba(255, 255, 255, 0.2)"; // Highlight empty country slightly
      }
    } else {
      if (value !== undefined) {
        globe_context.fillStyle = color_scale(value);
      } else {
        // Use faint white fill for non-plotted countries
        globe_context.fillStyle = "rgba(255, 255, 255, 0.05)";
      }
    }

    globe_context.fill();

    // Stroke logic
    if (value !== undefined) {
      globe_context.strokeStyle = "#330000";
      globe_context.lineWidth = 0.5;
      globe_context.stroke();
    }
  });

  globe_context.restore();

  return hovered_data;
}
