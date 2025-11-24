# Route Calculations Documentation

## Overview

This document explains how the vehicle route optimization and ETA (Estimated Time of Arrival) calculations work in the vehicle management system.

## Components Involved

### 1. VehicleRouteModal.tsx

The main component responsible for displaying the optimized delivery route on a map and calculating ETAs for each order.

### 2. API Route: /api/orders/update-etas

Backend endpoint that saves calculated ETAs to the database.

## How It Works

### Route Optimization Flow

1. **Input Data**

   - Store location (origin and destination)
   - List of order addresses (intermediate waypoints)
   - Vehicle ID

2. **Google Maps Routes API Request**

   ```
   origin: STORE_LOCATION
   destination: STORE_LOCATION (returns to store after deliveries)
   intermediates: [order addresses]
   optimizeWaypointOrder: true (enables route optimization)
   ```

3. **Route Response Structure**
   - The API returns a `route` object with:
     - `legs`: Array of route segments (length = number of orders + 1)
       - Each leg represents travel between two points
       - For N orders: legs[0] to legs[N-1] are deliveries, legs[N] is return to store
     - `optimizedIntermediateWaypointIndices`: Reordered order indices for optimal route
     - `durationMillis`: Total trip duration in milliseconds
     - `viewport`: Map bounds for the route

### ETA Calculation Logic

The `calculateOrderETAs` function processes the route data:

```typescript
calculateOrderETAs(orders, legs, optimizedIndices);
```

**Key Logic:**

1. **Handle Edge Cases**:

   - If `optimizedIndices` is undefined/empty (single order), use original order
   - This fixes the bug where single-order routes failed

2. **Cumulative Time Calculation**:

   ```
   For each order i:
     - Get the leg that goes TO this order (legs[i])
     - Add leg duration to cumulative time
     - Calculate ETA = cumulative time in minutes
   ```

3. **Example (3 orders)**:

   ```
   legs[0]: Store → Order A (15 min) → ETA for Order A: 15 min
   legs[1]: Order A → Order B (10 min) → ETA for Order B: 25 min
   legs[2]: Order B → Order C (8 min) → ETA for Order C: 33 min
   legs[3]: Order C → Store (12 min) → (not used for order ETAs)
   ```

4. **Output**:
   - `reorderedOrders`: Orders sorted in optimal delivery sequence with ETAs
   - `orderETAs`: Array of `{orderId, etaMinutes}` for database storage

### Map Visualization

1. **Polylines**:

   - Blue lines for delivery routes (legs 0 to N-1)
   - Red line for return to store (leg N)

2. **Markers**:

   - Green "Store" markers at start/end points
   - Blue numbered markers (1, 2, 3...) for delivery stops

3. **Map Bounds**: Automatically fits all waypoints in view

### Database Persistence

After calculating ETAs, they are saved via API call:

```typescript
POST /api/orders/update-etas
Body: { orderETAs: [{ orderId: 123, etaMinutes: 15 }, ...] }
```

The API updates the `eta` field in the `Order` table for each order in a database transaction.

## Bug Fix Summary

**Previous Bug**: Single-order deployments failed because:

- The code assumed `optimizedIntermediateWaypointIndices` would always exist
- For 1 order, this field was undefined/empty
- This caused array access errors and missing ETA calculations

**Fix**:

- Check if `optimizedIndices` exists
- Fall back to original order indices if not present
- Ensures single-order routes work correctly

## Code Structure Improvements

1. **Extracted Functions**:

   - `calculateOrderETAs`: Handles all ETA logic
   - `saveOrderETAs`: Manages API calls
   - `renderRoutePolylines`: Draws route lines
   - `createMarkerOptions`: Styles map markers

2. **Removed Unnecessary State**:

   - Eliminated `fetchedRef` that prevented re-renders
   - Map now properly reinitializes when modal reopens

3. **Better Error Handling**:
   - Validates route existence before processing
   - Logs errors for debugging
   - Handles API failures gracefully

## Total Trip ETA

The total ETA displayed is calculated from `route.durationMillis`:

- Includes all delivery legs + return leg
- Represents complete round-trip time from store back to store
- Converted to minutes for display
