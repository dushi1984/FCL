# FCL Container Loader

The application lives in `index.html` and can be served as a static site without a build step. Three.js and OrbitControls use the existing CDN scripts.

## Full shipment planning

Enter each SKU's outer dimensions in centimeters, gross weight per unit in kilograms, and the complete quantity. Calculate to allocate the shipment across containers of the selected type. Select a container to view its 3D layout or report. The shipment CSV covers all containers and unallocated units; the existing report exports cover the selected container.

Rows use actual carton depth and supported upright stacks. Floor rotation is optional. Payload limits apply to each container. This is a conservative single-SKU-row heuristic, not a proof of minimum container count. Partial rows are not shared by SKUs. Verify door clearance, stacking strength, securing space, load distribution and actual equipment specifications before loading. Planning is limited to 50,000 units and 100 containers, with unallocated quantities shown explicitly.

Input edits invalidate old allocations. Optional snapshot generation is off by default for responsiveness.

## Tests

With Node.js installed:

```sh
node --test tests/*.cjs
```

Tests read the planner directly from `index.html`. They cover JavaScript syntax, capacity, multi-container overflow, payload, input validation, upright rotation, quantity conservation, placement bounds and overlap. GPU rendering and live CDN availability are not covered.
