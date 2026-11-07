# FCL Container Loader

The static application starts at `index.html` and can be served as a static site without a build step. Three.js and OrbitControls use the existing CDN scripts.

## Full shipment planning

Enter each SKU's outer dimensions in centimeters, gross weight per unit in kilograms, and the complete quantity. Calculate to allocate the shipment across containers of the selected type. Select a container to view its 3D layout or report. The shipment CSV covers all containers and unallocated units; the existing report exports cover the selected container.

Rows use actual carton depth and supported upright stacks. Floor rotation is optional. Payload limits apply to each container. This is a conservative single-SKU-row heuristic, not a proof of minimum container count. Partial rows are not shared by SKUs. Verify door clearance, stacking strength, securing space, load distribution and actual equipment specifications before loading. Planning is limited to 50,000 units and 100 containers, with unallocated quantities shown explicitly.

Input edits invalidate old allocations. Optional snapshot generation is off by default for responsiveness.

## Tests

With Node.js installed:

```sh
node --test tests/*.cjs
```

Tests exercise the packing and fleet modules plus the inline UI integration (with rendering stubs). They cover JavaScript syntax, capacity, multi-container overflow, payload, input validation, upright rotation, quantity conservation, placement bounds and overlap. GPU rendering and live CDN availability are not covered.


## Smart mixed-container planning

**Smart mix** is the default. Enable the equipment types available for your shipment
(20ft, 40ft standard, 40ft High Cube/HQ, optional 45ft High Cube), and enter the
actual payload limits. Recommendations can combine types, e.g. one 40ft HQ and
one 20ft. The fixed-type mode remains available.

Priorities:
- **Fewest containers:** container count first, then smallest total internal volume.
- **Least space:** smallest combined internal volume first, then container count.
- **Lowest cost:** lowest sum of your freight rates. Enter a positive rate for every
  enabled type, all in the same currency. No market rates are assumed.

Up to four distinct feasible fleet combinations are shown with total capacity,
unused volume and freight totals when rates are complete. Selecting an alternative
updates the container picker; selecting a container updates the 3D view and report.
Shipment CSV includes the actual equipment type of each allocation.

### Structure
- `index.html`: interface, 3D visualization and reporting.
- `js/packing.js`: upright row packing, input validation and fixed-type planning.
- `js/fleet.js`: mixed-container search and recommendation ranking.
- `tests/`: packing, fleet and UI integration regression checks.

Serve the whole directory; no build step or npm installation is required.

### Search limits

The fleet engine packs actual geometry for each candidate rather than relying on
CBM alone. It uses bounded beam search: at most 800 trials, eight retained states,
100 container levels, and two extra levels beyond the first complete solution.
These bounds keep planning practical but can exclude better combinations. Therefore
cost/space recommendations are **best among explored candidates**, not guaranteed
global optima. The underlying single-SKU-row packing assumptions still apply.
If no complete plan is found, the best explored partial plan explicitly shows its
unallocated cargo. All cargo is assumed stackable; operational verification remains
necessary. The tests do not visually validate WebGL or external CDN availability.

## Workspace presentation

`css/workspace.css` contains the responsive visual layer. The workspace includes
numbered setup sections, collapsible equipment/preset controls, live SKU/unit/CBM
totals, container volume usage meters, comparison cards, and light/dark themes.
View buttons support keyboard operation and expose pressed state; cargo fields
have associated labels. Mobile calculation scrolls to the results, and a resize
observer keeps the 3D canvas fitted as panels change size.

The UI refresh was smoke-tested in headless Chromium at 1440×1050 and 390×844,
covering calculation, view selection, light theme, report opening and horizontal
overflow. Matching local copies of Three.js r128 and OrbitControls were substituted
for the CDN URLs during that check because sandbox CDN access is restricted.
