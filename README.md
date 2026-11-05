# FCL shipment planner

Run with Node.js 22 or later:

```sh
npm install
npm start
```

Open port 3000. Run `npm test` for packing and DOM integration tests. Three.js is served locally; no CDN connection is required.

## Planning a shipment

1. Choose a container type and enter its actual allowable payload.
2. Enter each SKU's outer dimensions in centimeters, gross unit weight in kg, and **entire shipment quantity**. A pallet is one unit: include the loaded pallet dimensions and gross weight.
3. Calculate the full shipment. The summary reports total allocated units, containers, mass and volume.
4. Select each container for its 3D view and report. Existing report/print exports apply to the selected container. **Shipment CSV** exports allocations across all containers, including unallocated cargo.

Editing shipment inputs invalidates the previous plan. Optional report images are off by default for faster planning.

## Assumptions and limitations

The planner uses supported single-SKU rows, chooses an upright floor orientation, and advances by actual row depth. It enforces rectangular internal dimensions and per-container payload, and repeats packing until quantities are exhausted or no progress is possible. It does not use volume alone to claim that cargo fits.

This conservative heuristic provides a feasible geometric plan, **not a guaranteed minimum number of containers**. Partial rows are not shared between SKUs. Door openings, pallet stackability, carton crush limits, center of gravity, securing space, dangerous-goods separation, and real equipment-specific payloads require operator verification. All units are assumed stackable. Planning is capped at 50,000 units and 100 containers; unallocated units are explicitly shown.

Automated tests cover exact capacity, overflow, payload, invalid inputs, upright rotation, bounds, overlap, SKU conservation, container selection, report generation, CSV export and invalidation. DOM tests stub WebGL; they do not visually validate GPU rendering.

## Vercel deployment

`npm run build` produces a self-contained static site in `dist/`, including
`index.html`, the planner and locally bundled Three.js/OrbitControls assets.
`vercel.json` specifies the install command, build command and output directory.
Vercel does not need to run `server.js` (that server is for local preview only).

Import/use the existing `fcl` project with the repository root as its root
directory and framework preset **Other**. Deploy the branch containing these
changes. If Vercel requests first-deployment framework confirmation, confirm
these settings in its dashboard before redeploying.
