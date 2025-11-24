"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Navigation, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import { STORE_LOCATION } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

interface VehicleRouteModalProps {
  isOpen: boolean;
  changeIsOpen: (open: boolean) => void;
  vehicleId: number;
  orders: Array<{
    id: number;
    address: string;
    status: string;
  }>;
  onVehicleReset?: () => void; // called when all orders complete and vehicle set to STANDBY
}

export default function VehicleRouteModal({
  isOpen,
  changeIsOpen,
  vehicleId,
  orders,
  onVehicleReset,
}: VehicleRouteModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInit = useRef(false);
  const fetchedRef = useRef(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const channelRef = useRef<any>(null);
  const standbyUpdateSentRef = useRef(false);
  const [eta, setEta] = useState<number>(-1);
  const [pendingEtaUpdates, setPendingEtaUpdates] = useState<
    Array<{ orderId: number; etaMinutes: number }>
  >([]);
  const [optimizedOrders, setOptimizedOrders] = useState<
    Array<{ id: number; address: string; status: string; etaMinutes?: number }>
    >([]);
  const [orderEtas, setOrderEtas] = useState<Record<number, number | null>>({});
  // Flag indicating we've finished attempting to load existing ETAs from the DB
  const [etasLoaded, setEtasLoaded] = useState(false);
  // Duration (minutes) of the return leg from last stop back to store.
  const [returnLegMinutes, setReturnLegMinutes] = useState<number | null>(null);
  // Helper to compute total ETA from per-order ETAs and return leg in one pass without waiting an extra render.
  const computeTotalEta = (
    etas: Record<number, number | null>,
    returnLeg: number | null,
    currentOrders: Array<{ id: number }>
  ) => {
    if (!currentOrders.length) return -1;
    const arrivalEtas = currentOrders
      .map(o => etas[o.id])
      .filter(v => v != null) as number[];
    if (!arrivalEtas.length) return -1;
    console.log("Arrival ETAs:", arrivalEtas);
    const maxArrival = arrivalEtas.reduce((a, b) => a + b, 0);
    // return returnLeg != null ? maxArrival + returnLeg : maxArrival;
    return maxArrival;
  };

  // Realtime subscription for order updates (eta/status)
  useEffect(() => {
    if (!isOpen) return;
    // Initialize client once
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    // Avoid duplicate channel
    if (channelRef.current) return;
    const supabase = supabaseRef.current;
    channelRef.current = supabase
      .channel(`vehicle-orders-${vehicleId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Order',
          filter: `VehicleId=eq.${vehicleId}`,
        },
        (payload: any) => {
          const updated = payload.new as {
            id: number;
            eta: number | null;
            status: string;
          };
          if (!updated?.id) return;
          // Merge ETA and immediately recompute total ETA.
          setOrderEtas(prev => {
            const next = {
              ...prev,
              [updated.id]: updated.eta ?? prev[updated.id] ?? null,
            };
            setEta(computeTotalEta(next, returnLegMinutes, orders));
            return next;
          });
          // Merge status + eta into optimizedOrders
          setOptimizedOrders(prev =>
            prev.map(o =>
              o.id === updated.id
                ? {
                    ...o,
                    status: updated.status,
                    etaMinutes: updated.eta ?? o.etaMinutes,
                  }
                : o
            )
          );
        }
      )
      .subscribe();
  }, [isOpen, vehicleId, returnLegMinutes]);

  // Cleanup channel on close/unmount
  useEffect(() => {
    if (!isOpen && supabaseRef.current && channelRef.current) {
      supabaseRef.current.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    return () => {
      if (supabaseRef.current && channelRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isOpen]);
  
  // Initialize Google Maps API options once
  useEffect(() => {
    if (!mapInit.current) {
      setOptions({
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        v: "weekly",
      });
      mapInit.current = true;
    }
  }, []);

  // Load existing ETAs first so we avoid recomputing them if already persisted.
  useEffect(() => {
    if (!orders.length) {
      setOrderEtas({});
      setEtasLoaded(true);
      return;
    }
    setEtasLoaded(false);
    let cancelled = false;
    const fetchAll = async () => {
      await Promise.all(
        orders.map(async (o) => {
          try {
            const res = await fetch(`/api/orders/update-etas?orderId=${o.id}`);
            if (!res.ok) return;
            const data = await res.json();
            if (cancelled) return;
            setOrderEtas(prev => ({ ...prev, [o.id]: data.etaMinutes ?? null }));
          } catch {
            console.error("Error fetching current ETA for order", o.id);
          }
        })
      );
      if (!cancelled) setEtasLoaded(true);
    };
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [orders]);

  //   Retrieve Google Maps HTML Elements on re-renders
  useEffect(() => {
    // Wait until ETAs have been loaded (or attempted) before computing route so we don't overwrite existing ETAs.
    if (!isOpen || fetchedRef.current || !etasLoaded) return;

    fetchedRef.current = true; // ensure single computation per mount/open
    
    const initMaps = async () => {
      try {
        const [
          { Map },
          { PinElement },
          // @ts-ignore
          { Route },
        ] = await Promise.all([
          importLibrary("maps"),
          importLibrary("marker"),
          importLibrary("routes"),
        ]);

        // Initialize map - recreate each time since DOM element is remounted
        if (mapRef.current) {
          const map = new Map(mapRef.current, {
            center: STORE_LOCATION,
            zoom: 10,
            mapId: "ADDR",
            // Disable UI controls for a cleaner map
            disableDefaultUI: true,
            zoomControl: true, // Keep only zoom control
            gestureHandling: "greedy", // Allow scrolling without Ctrl key
          });

          // Compute route for delivery
          const request = {
            origin: STORE_LOCATION,
            destination: STORE_LOCATION,
            travelMode: "DRIVING",
            intermediates: orders.map((o) => ({
              location: o.address,
              vehicleStopover: true,
            })),
            optimizeWaypointOrder: true, // Enable route optimization
            computeAlternativeRoutes: false,
            fields: ["*"],
          };

          // Alter style for each order drop-off and store location.
          function markerOptionsMaker(
            defaultOptions: google.maps.marker.AdvancedMarkerElementOptions,
            //@ts-ignore
            waypointMarkerDetails: google.maps.routes.WaypointMarkerDetails
          ) {
            const { index, totalMarkers, leg } = waypointMarkerDetails;

            // Style the origin and destination waypoint (both are store).
            if (index === 0 || index == totalMarkers - 1) {
              return {
                ...defaultOptions,
                map: map,
                content: new PinElement({
                  // @ts-ignore
                  glyphText: "Store",
                  glyphColor: "white",
                  background: "green",
                  borderColor: "green",
                }).element,
              };
            }

            // Style all intermediate waypoints.
            if (!(index === 0 || index === totalMarkers - 1)) {
              return {
                ...defaultOptions,
                map: map,
                content: new PinElement({
                  // @ts-ignore
                  glyphText: index.toString(),
                  glyphColor: "white",
                  background: "blue",
                  borderColor: "blue",
                }).element,
              };
            }

            return { ...defaultOptions, map: map };
          }

          // Call computeRoutes to get the directions.
          const result = await Route.computeRoutes(request);

          // Check if result and routes exist
          if (!result || !result.routes || result.routes.length === 0) {
            console.warn("No routes found in result");
            return;
          }

          const route = result.routes[0];

          // Reorder orders based on optimized route and compute ETA for each order.
          // Only assign / persist ETA if it was missing (null) from DB load.
          console.log(route.optimizedIntermediateWaypointIndices, route.legs);
          if (route.optimizedIntermediateWaypointIndices && route.legs) {
            const optimizedIndices = route.optimizedIntermediateWaypointIndices;
            let cumulativeDurationMs = 0;
            const newEtasMap: Record<number, number> = {};
            const reorderedOrders = optimizedIndices.map(
              (originalIndex: number, i: number) => {
                const order = orders[originalIndex];
                const leg = route.legs[i];

                cumulativeDurationMs += leg.durationMillis || 0;
                const etaMinutes = Math.round(cumulativeDurationMs / 60000);

                // If we still have no stored ETA (null/undefined), queue for persistence; otherwise keep existing one
                if (orderEtas[order.id] == null) {
                  newEtasMap[order.id] = etaMinutes;
                }

                return {
                  ...order,
                  etaMinutes: orderEtas[order.id] ?? etaMinutes,
                };
              }
            );
            setOptimizedOrders(reorderedOrders);
            if (Object.keys(newEtasMap).length) {
              // Merge newly computed ETAs locally & update total ETA in same render cycle.
              setOrderEtas(prev => {
                const merged = { ...prev, ...newEtasMap };
                setEta(computeTotalEta(merged, returnLegMinutes, orders));
                return merged;
              });
              // Queue for DB persistence
              setPendingEtaUpdates(
                Object.entries(newEtasMap).map(([orderId, etaMinutes]) => ({
                  orderId: Number(orderId),
                  etaMinutes,
                }))
              );
            } else {
              // Even if no new ETAs persisted, recompute total from existing values after ordering known.
              setEta(computeTotalEta(orderEtas, returnLegMinutes, orders));
            }
          }

          // Ensure the 'legs' field is requested in your ComputeRoutesRequest
          // For example: fields: ['legs', 'path']

          if (route.legs) {
            // @ts-ignore
            route.legs.forEach((leg, legIndex) => {
              const totalLegs = route.legs.length;
              let polylineColor: string;

              // Last leg (return to store) should be red
              if (legIndex === totalLegs - 1) {
                polylineColor = "#FF0000"; // Red for return route
              } else {
                polylineColor = "#4285F4"; // Blue for delivery routes
              }

              // Create a polyline for each leg with the desired color
              const legPolyline = new google.maps.Polyline({
                path: leg.path, // Assuming each leg has a 'path' property
                strokeColor: polylineColor,
                strokeOpacity: 1.0,
                strokeWeight: 5,
                map: map,
              });

              // If you want to store them in an array like mapPolylines:
              // mapPolylines.push(legPolyline);
            });
          }

          // Create waypoint markers
          const markers = await route.createWaypointAdvancedMarkers(
            markerOptionsMaker
          );

          // Fit the map to the route.
          map.fitBounds(route.viewport);

          // Capture return leg duration separately so total ETA can be derived from per-order ETAs + return leg.
          if (route.legs && route.legs.length) {
            const lastLeg = route.legs[route.legs.length - 1];
            const lastLegMinutes = Math.round((lastLeg.durationMillis || 0) / 60000);
            const rl = lastLegMinutes > 0 ? lastLegMinutes : null;
            setReturnLegMinutes(rl);
            // Recalculate total immediately with updated return leg.
            setEta(computeTotalEta(orderEtas, rl, orders));
          }
        }
      } catch (e) {
        console.error("Error initializing map:", e);
      }
    };
    initMaps();
  }, [orders, isOpen, orderEtas, etasLoaded]);

  // Keep ETA in sync when return leg changes independently (without route recompute).
  useEffect(() => {
    setEta(computeTotalEta(orderEtas, returnLegMinutes, orders));
  }, [returnLegMinutes]);

  // Persist pending ETAs once
  useEffect(() => {
    if (!pendingEtaUpdates.length) return;
    fetch("/api/orders/update-etas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderETAs: pendingEtaUpdates }),
    })
      .then(res => {
        if (!res.ok) console.error("Failed to save ETAs");
      })
      .catch(err => console.error("Error saving ETAs:", err))
      .finally(() => setPendingEtaUpdates([]));
  }, [pendingEtaUpdates]);

  // When all orders COMPLETE and total ETA == 0, set vehicle to STANDBY (once)
  useEffect(() => {
    if (!isOpen) return;
    if (
      optimizedOrders.length &&
      optimizedOrders.every(o => o.status === 'COMPLETE') &&
      eta === 0 &&
      !standbyUpdateSentRef.current
    ) {
      standbyUpdateSentRef.current = true;
      fetch('/api/vehicles/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, status: 'STANDBY' }),
      }).then(res => {
        if (!res.ok) {
          // Allow retry if failed
          standbyUpdateSentRef.current = false;
        }
        if (res.ok) {
          // Invoke callback so parent (VehicleCard) can reset local state
          onVehicleReset?.();
          // Close modal to return focus to card view
          changeIsOpen(false);
        }
      }).catch(() => {
        standbyUpdateSentRef.current = false;
      });
    }
  }, [optimizedOrders, eta, isOpen, vehicleId]);

  return (
    <Dialog open={isOpen} onOpenChange={changeIsOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Vehicle #{vehicleId} Route
          </DialogTitle>
          <DialogDescription>
            View the delivery route and order details for this vehicle
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-4">
            {/* Map Display */}
            <div className="relative">
              <div
                ref={mapRef}
                className="w-full h-[400px] rounded-lg border border-gray-200 bg-gray-100"
              />
              {!mapRef.current && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">Loading map...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Order List */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Delivery Stops ({optimizedOrders.length})
              </h3>
              {optimizedOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No orders assigned to this vehicle</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {optimizedOrders.map((order, index) => (
                    <div
                      key={order.id}
                      className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-semibold text-sm">
                            Order #{order.id}
                          </p>
                          <Badge
                            variant="outline"
                            className={
                              order.status === "COMPLETE"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : order.status === "IN_TRANSIT"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }
                          >
                            {order.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="break-words">{order.address}</span>
                        </div>
                        {(orderEtas[order.id] ?? order.etaMinutes) != null && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>
                              ETA:{" "}
                              {(orderEtas[order.id] ?? order.etaMinutes)! >= 60
                                ? `${Math.floor(
                                    (orderEtas[order.id] ?? order.etaMinutes)! / 60
                                  )}h ${(orderEtas[order.id] ?? order.etaMinutes)! % 60}m`
                                : `${(orderEtas[order.id] ?? order.etaMinutes)!} min`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ETA Display */}
            {eta >= 0 && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                    Total Estimated Time
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {eta} minutes
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Complete route with {optimizedOrders.length}{" "}
                    {optimizedOrders.length === 1 ? "stop" : "stops"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
