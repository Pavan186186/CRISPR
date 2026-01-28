# CRISPR: Promise vs Peril - CSE 578 Project

An interactive data visualization storytelling project exploring the dual narratives of CRISPR gene-editing technology.

##  How to Run

Start a local server:
```bash
python3 -m http.server 8090
```

Then open in browser:
```
http://localhost:8090/index.html
```

## 📁 Project Structure

```
├── index.html                    # Landing page - Project Hub
├── pages/
│   ├── pro.html                  # "The Revolution" - Pro-CRISPR story
│   └── anti.html                 # "The Warning" - Anti-CRISPR story
│
├── css/
│   ├── main.css                  # Landing page styles
│   ├── pro.css                   # Pro narrative styles
│   ├── pro_story.css             # Pro story section styles
│   ├── anti.css                  # Anti narrative styles
│   └── anti_story.css            # Anti story section styles
│
├── js/
│   ├── pro/                      # Pro-CRISPR visualizations
│   │   ├── main.js               # Main controller
│   │   ├── bloom_chart.js        # Bloom chart
│   │   ├── bubble_chart.js       # Bubble chart
│   │   ├── network.js            # Network diagram
│   │   ├── sankey_diagram.js     # Sankey flow diagram
│   │   ├── temporal_map.js       # Temporal world map
│   │   └── timeline_chart.js     # Timeline visualization
│   │
│   └── anti/                     # Anti-CRISPR visualizations
│       ├── main.js               # Main controller
│       ├── boxplot.js            # Box plot chart
│       ├── bubble_trial_chart.js # Bubble trial chart
│       ├── damage_radar_chart.js # Radar chart
│       ├── plot_choropleth.js    # Choropleth map
│       └── price_inequality.js   # Price inequality viz
│
├── data/processed/               # Visualization data (JSON/CSV)
│
├── assets/images/                # Icons and 3D models
│
├── scripts/                      # Python data preprocessing
│
└── info/                         # Documentation & analysis
```

##  Navigation

- **Landing Page** (`index.html`) - Choose your narrative
- **VIEW DASHBOARD** → Pro-CRISPR story ("The Revolution")
- **LAUNCH STORY** → Anti-CRISPR story ("The Warning")

##  Development

- **Data**: Process raw data using scripts in `scripts/` → outputs to `data/processed/`
- **Visualizations**: Add D3.js scripts in `js/pro/` or `js/anti/`
- **Styles**: Update CSS in respective files under `css/`
