# CRISPR Visualizations Documentation

This document describes all visualizations implemented for both the **Pro** (promoting CRISPR) and **Anti** (highlighting CRISPR risks) sides of the dual visual data story.

---

## Pro Side Visualizations

### 1. Bloom Chart (Regulatory Openness)
**Location:** Top-left widget  
**File:** `js/pro/bloom_chart.js`  
**Data:** `data/processed/bloom_data.json`

**Description:**  
A radial/petal chart (bloom chart) that visualizes regulatory openness scores for different countries for CRISPR in agriculture. Each country is represented as a petal extending from the center, with the length indicating the normalized regulatory openness metric (0-10 scale). The chart uses a color gradient from dark blue (low openness) to cyan/green (high openness).

**Features:**
- Interactive tooltips showing country name and regulatory score
- Color-coded petals based on regulatory openness level
- Radial layout with countries arranged around a central point

**Purpose:** Demonstrates which countries have more permissive regulatory environments for CRISPR research and clinical trials.

---

### 2. Bubble Chart (Studies by Year & Species)
**Location:** Top-center widget  
**File:** `js/pro/bubble_chart.js`  
**Data:** `data/processed/bubble_chart_data.csv`

**Description:**  
An interactive bubble chart displaying CRISPR studies organized by year (x-axis) and species (y-axis). Each bubble represents a combination of year and species, with bubble size proportional to the selected metric.

**Features:**
- **Metric Selection:** Users can toggle between:
  - Number of Screenings
  - Number of Genes
  - Number of Diseases
- **View Modes:**
  - Separate view: Species are positioned at different y-coordinates
  - Combined view: All species are grouped together
- Interactive tooltips showing species, year, and metric values
- Force-directed layout to prevent bubble overlap
- Automatic view switching with manual toggle option

**Purpose:** Shows the breadth and diversity of CRISPR research across different species and time periods, highlighting the expanding scope of applications.

---

### 3. Timeline Chart (Exponential Hope)
**Location:** Top-right widget  
**File:** `js/pro/timeline_chart.js`  
**Data:** `data/processed/timeline_data.json`

**Description:**  
An animated area chart showing the exponential growth of CRISPR clinical trials from 2015 to 2025. The visualization displays both individual trial counts per year and cumulative totals, with milestone markers highlighting key achievements.

**Features:**
- Animated area chart with gradient fill
- Dual metrics: annual trials and cumulative totals
- Milestone markers for significant events (e.g., FDA approvals)
- Smooth transitions and animations
- Responsive design

**Purpose:** Emphasizes the rapid growth and increasing momentum of CRISPR research, from 19 studies in early years to 119 peak studies in 2021, with 707 total trials shaping the future.

---

### 4. Sankey Diagram (Path to Approval)
**Location:** Bottom-left widget  
**File:** `js/pro/sankey_diagram.js`  
**Data:** `data/processed/sankey_data.json`

**Description:**  
A flow diagram (Sankey) showing the journey of CRISPR trials through regulatory phases (Phase 1 → Phase 2 → Phase 3 → FDA Approval). The width of each flow represents the number of trials moving through that pathway.

**Features:**
- Interactive flow visualization
- Highlights the successful path of approved treatments (e.g., Casgevy)
- Shows statistics for each phase
- Color-coded flows using the pro-side palette (neon blue, cyan, green)
- Tooltips with detailed phase information

**Purpose:** Illustrates the rigorous but successful path from early-phase trials to FDA approval, demonstrating the regulatory validation process.

---

### 5. Cas9 Network (Neural Link Hub)
**Location:** Bottom-right widget  
**File:** `js/pro/network.js`  
**Data:** `data/processed/network_data.json`

**Description:**  
A force-directed network graph where each node represents a Cas9 variant, and edges connect variants that share experimental context (technique, timing, performance). Node size reflects success metrics, and the network can be re-encoded by different attributes.

**Features:**
- **Color Modes:**
  - Precision mode: Colors nodes by relative on-target specificity
  - Technique mode: Groups nodes by delivery/assay type
  - Cas9 mode: Highlights relationships across Cas9 families
- **Success Threshold Slider:** Filters out variants below a selected success threshold
- **Edge Toggle:** Show/hide connections between variants
- Interactive zoom and pan
- Tooltips showing variant details, success scores, and relationships

**Purpose:** Reveals the interconnected nature of Cas9 research, showing how different variants relate to each other and highlighting the most successful approaches.

---

### 6. Temporal Globe (3D Globe with Timeline Controls)
**Location:** Final step (full-screen globe)  
**File:** `js/pro/temporal_globe_controls.js`  
**Data:** `data/processed/temporal_map_data.json`

**Description:**  
A 3D interactive globe showing the global distribution of CRISPR clinical trials. The visualization includes timeline controls that allow users to see studies appearing cumulatively over time (2015-2025).

**Features:**
- 3D orthographic projection globe
- Interactive rotation (drag to rotate, auto-rotate when idle)
- Timeline slider to filter studies by year
- Play/pause animation to automatically advance through years
- Study counter showing cumulative count
- Study points appear on the globe at their geographic locations
- Hover tooltips showing study details (NCT ID, title, location, phase, status)

**Purpose:** Provides a global perspective on CRISPR research, showing how clinical trials have spread worldwide over time and demonstrating the international scope of the technology.

---

### 7. Study Points on Globe
**Location:** Integrated with main globe  
**File:** `js/pro/plot_studies.js`

**Description:**  
Renders individual study locations as points on the 3D globe. Points are color-coded and include hover interactions.

**Features:**
- Geographic positioning of studies
- Color coding by study attributes
- Interactive hover tooltips
- Jitter algorithm to prevent overlapping points at the same location

---

### 8. Country Borders on Globe
**Location:** Integrated with main globe  
**File:** `js/pro/plot_countries.js`

**Description:**  
Renders country borders on the 3D globe, providing geographic context for the study locations.

**Features:**
- TopoJSON-based country boundaries
- Styled borders matching the pro-side aesthetic
- Integrated with globe rotation and interaction

---

## Anti Side Visualizations

### 1. Ethical Violations Bar Chart
**Location:** Top-left widget  
**File:** `js/anti/anti_visualizations.js`  
**Data:** `data/processed/anti_ethical_violations.json`

**Description:**  
A bar chart displaying various types of ethical violations associated with CRISPR research and applications. Each bar represents a category of ethical concern, with height indicating the frequency or severity.

**Features:**
- Vertical or horizontal bar layout
- Color gradient from red to dark red (matching anti-side theme)
- Interactive tooltips with violation details
- Animated transitions

**Purpose:** Highlights ethical concerns and violations in CRISPR research, emphasizing the need for careful oversight and regulation.

---

### 2. Trial Failures Timeline
**Location:** Top-right widget  
**File:** `js/anti/anti_visualizations.js`  
**Data:** `data/processed/anti_timeline_data.json`

**Description:**  
A timeline visualization showing failed, terminated, withdrawn, and suspended CRISPR clinical trials over time (focused on 2020-2028). Each trial is represented as a point or marker along the timeline, color-coded by failure type.

**Features:**
- Time-based x-axis (2020-2028)
- Color coding:
  - Red: Terminated trials
  - Orange: Withdrawn trials
  - Yellow: Suspended trials
- Vertical stacking for trials occurring in the same month
- Animated timeline drawing
- Interactive tooltips showing trial details

**Purpose:** Reveals the frequency and patterns of trial failures, challenging the narrative of unmitigated success.

---

### 3. Boxplot (Off-Target Scores Distribution)
**Location:** Bottom-left widget  
**File:** `js/anti/boxplot.js`  
**Data:** `data/processed/anti_boxplot_data.csv`

**Description:**  
A boxplot visualization showing the distribution of off-target activity scores across different Cas9 types. Each box represents a Cas9 variant, showing quartiles, median, and outliers.

**Features:**
- **Y-axis Scale Toggle:**
  - Log scale (default): Better for wide value ranges
  - Linear scale: Standard view
- **Sorting Options:**
  - By name (alphabetical)
  - By median (ascending/descending)
- Interactive hover showing quartile and median values
- Click to focus on a specific Cas9 type
- Click outliers to see detailed information
- Dark color scheme with red accents emphasizing risks

**Purpose:** Demonstrates the variability and potential risks of off-target effects across different Cas9 variants, highlighting safety concerns.

---

### 4. Regulatory Landscape Chart
**Location:** Bottom-right widget  
**File:** `js/anti/anti_visualizations.js`  
**Data:** `data/processed/anti_regulation_data.json` or `anti_regulatory_landscape.json`

**Description:**  
A visualization showing the regulatory landscape for CRISPR across different countries or regions. Displays regulatory restrictions, bans, or concerns.

**Features:**
- Country/region-based visualization
- Color coding by regulatory status
- Interactive elements showing regulatory details

**Purpose:** Shows the complex and often restrictive regulatory environment, contrasting with the pro-side's focus on regulatory openness.

---

### 5. Bubble Trial Chart (The Sample Size Problem)
**Location:** Bubble widget  
**File:** `js/anti/bubble_trial_chart.js`  
**Data:** `data/processed/anti-bubble_trial_data.json`

**Description:**  
A bubble chart highlighting the small sample sizes in many CRISPR clinical trials. Each bubble represents a trial, with size proportional to the number of patients enrolled.

**Features:**
- **Phase Filtering:** Buttons to filter by:
  - All phases
  - Phase 1
  - Phase 2
  - Phase 3
- **Statistics Panel:**
  - Total trials count
  - Median patients per trial
  - Count of trials with under 50 patients
- **Comparison Box:** Shows typical drug trial sizes (1,000-3,000 patients for Phase 3) for context
- Color coding by phase
- Interactive tooltips with trial details

**Purpose:** Exposes the "sample size problem" - many CRISPR trials enroll very few patients compared to standard drug trials, raising questions about statistical validity and generalizability.

---

### 6. Damage Radar Chart (Genetic Damage Assessment)
**Location:** Radar widget  
**File:** `js/anti/damage_radar_chart.js`  
**Data:** `data/processed/anti_damage_radar_data.json`

**Description:**  
A radar/spider chart showing genetic damage assessment across multiple categories. Each axis represents a different type of genetic damage or risk, with values plotted to form a polygon.

**Features:**
- Multi-axis radar chart (typically 5-8 categories)
- Categories may include:
  - Off-target mutations
  - On-target toxicity
  - Immune responses
  - Long-term effects
  - Germline risks
  - etc.
- Color-coded risk levels
- Interactive tooltips with category descriptions
- Concentric circles showing risk levels (0-100 scale)

**Purpose:** Provides a comprehensive view of the various types of genetic damage and risks associated with CRISPR, presenting a holistic assessment of potential harms.

---

### 7. Price Inequality Chart (The $2.2 Million Cure)
**Location:** Price inequality widget  
**File:** `js/anti/price_inequality.js`  
**Data:** `data/processed/price_inequality_data.json`

**Description:**  
A visualization highlighting the high cost of CRISPR-based treatments (e.g., $2.2 million for Casgevy) and the resulting global inequality in access. Combines a map or chart showing treatment costs with statistics on global patient populations.

**Features:**
- Treatment cost visualization
- Global patient population statistics
- Pie chart or similar showing distribution of patients who can afford treatment
- Comparison highlighting that only the richest 5% may have access
- Interactive elements showing country-specific data

**Purpose:** Exposes the economic barriers to CRISPR treatments, questioning who benefits from these "cures" and highlighting global health inequality.

---

### 8. Choropleth Map (Genetic Risk Level)
**Location:** Final step (full-screen globe)  
**File:** `js/anti/plot_choropleth.js`  
**Data:** `data/processed/anti_choropleth_data.json`

**Description:**  
A choropleth map rendered on a 3D globe showing genetic risk levels by country. Countries are colored based on their risk score (0-10 scale), with darker reds indicating higher risk.

**Features:**
- 3D orthographic projection globe
- Color scale from dark red (low risk/restrictive) to light pink (high risk/permissive)
- Interactive rotation
- Hover tooltips showing country name and risk score
- Legend showing risk level gradient
- Countries without data shown in faint white

**Purpose:** Visualizes which countries have more permissive (high risk) or restrictive (low risk) regulatory environments, from the perspective of genetic safety concerns.

---

## Common Features

### Globe Visualization
Both sides feature an interactive 3D globe as the central element:
- **Pro Side:** Shows study locations and includes temporal controls
- **Anti Side:** Shows genetic risk levels via choropleth mapping

### Scroll-Based Navigation
Both sides use scrollama.js for scroll-triggered animations:
- Widgets appear and focus as the user scrolls
- Smooth transitions between visualization states
- Loading screens with progress indicators

### Design Aesthetics
- **Pro Side:** Neon blue/cyan color scheme (#2dfaff), futuristic/scientific theme
- **Anti Side:** Red/dark red color scheme (#ff4d4d, #800000), warning/danger theme

### Data Sources
All visualizations use preprocessed JSON/CSV files stored in `data/processed/`, ensuring fast loading and consistent data formats.

---

## Technical Implementation

### Libraries Used
- **D3.js v7:** Core visualization library
- **D3-geo:** Geographic projections
- **TopoJSON:** Geographic data format
- **Scrollama:** Scroll-triggered animations
- **Canvas API:** 3D globe rendering

### File Structure
- Visualization logic: `js/pro/` and `js/anti/`
- Main application: `js/pro/main.js` and `js/anti/main.js`
- HTML pages: `pages/pro.html` and `pages/anti.html`
- Styling: `css/pro.css` and `css/anti.css`
- Data: `data/processed/`

### Interaction Patterns
- Hover tooltips for detailed information
- Click interactions for filtering and focusing
- Scroll-based progression through the story
- Interactive controls (sliders, buttons, toggles) for dynamic filtering

