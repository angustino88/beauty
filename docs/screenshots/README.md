# 3D dashboard examples

These screenshots were captured from the dashboard with synthetic inventory and original sample GLB
models. They demonstrate room → station → bench → equipment navigation and imported model rendering.

[Room overview](standard-3d-room.png) shows racks and workstations.
[Bench assembly](standard-3d-setup.png) shows an ESD workstation with an oscilloscope, DC supply,
multimeter, network switch, and control laptop.

The model files and demonstration inventory used for capture are temporary fixtures.

[Temperature heatmap](dcim-heatmap.png), [station detail with camera focus](dcim-station-detail.png) and
[enhanced rendering](dcim-enhanced-rendering.png) show the data overlays and the redesigned inventory panel.
Their temperature, humidity and power values are synthetic: the stations API does not report telemetry yet.

## Floor plan, capacity and live telemetry

- `dcim-floor-plan.png`: measured floor plan (9 × 12 m) with zones, metre ruler and live room conditions in the top bar.
- `dcim-capacity.png`: Capacity overlay (highest of power, weight, rack units and bench positions per station).
- `dcim-station-capacity.png`: station panel with live readings, capacity meters and bench widths in 3D.
- `dcim-top-view.png`: top view of the floor plan.
- `dcim-reference-models.png`: built-in reference models (rack with mounted units, lab workbenches) and the rack elevation panel.
