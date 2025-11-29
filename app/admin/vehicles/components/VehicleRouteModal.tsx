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
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { createClient } from "@/lib/supabase/client";

interface VehicleRouteModalProps {
  isOpen: boolean;
  changeIsOpen: (open: boolean) => void;
  vehicleId: number;
  orders: Array<{
    id: number;
    address: string;
    status: string;
  }>;
  onVehicleReset?: () => void;
}

interface OrderWithETA {
  id: number;
  address: string;
  status: string;
  etaMinutes?: number;
}

export default function VehicleRouteModal({
  isOpen,
  changeIsOpen,
  vehicleId,
  orders,
  onVehicleReset,
}: VehicleRouteModalProps) {
  // map and order states/refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInit = useRef(false);
  const [eta, setEta] = useState<number | null>(null); // setting it to 1 to avoid immediate completion
  const [optimizedOrders, setOptimizedOrders] = useState<OrderWithETA[]>([]);
  const routeStartedRef = useRef(false);
  // supabase refs
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const channelRef = useRef<any>(null);

  // 1. One-time Google Maps options init
  useEffect(() => {
    if (!mapInit.current) {
      setOptions({
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        v: "weekly",
      });
      mapInit.current = true;
    }
  }, []);

  // 2. Map + route initialization (depends on isOpen/orders)
  useEffect(() => {
    if (!isOpen || orders.length === 0) return;

    // Only compute route for active (non-complete) orders
    const activeOrders = orders.filter((o) => o.status !== "COMPLETE");
    if (activeOrders.length === 0) {
      // If no active orders, keep showing previously completed ones
      return;
    }

    const initMap = async () => {
      try {
        // Fetch existing data first
        const vehicleDataResponse = await fetch(`/api/vehicles/${vehicleId}`);
        const vehicleData = vehicleDataResponse.ok
          ? await vehicleDataResponse.json()
          : null;

        const [{ Map }, { PinElement }, routesLib] = await Promise.all([
          importLibrary("maps"),
          importLibrary("marker"),
          importLibrary("routes"),
        ]);
        // @ts-ignore - Route class exists but not in type definitions
        const { Route } = routesLib;

        if (!mapRef.current) return;

        const map = new Map(mapRef.current, {
          center: STORE_LOCATION,
          zoom: 10,
          mapId: "ADDR",
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
        });

        // First time: compute optimized routes with active orders only
        const result = await Route.computeRoutes({
          origin: STORE_LOCATION,
          destination: STORE_LOCATION,
          travelMode: "DRIVING",
          intermediates: activeOrders.map((order) => ({
            location: order.address,
            vehicleStopover: true,
          })),
          optimizeWaypointOrder: true,
          computeAlternativeRoutes: false,
          fields: ["*"],
        });

        if (!result?.routes?.[0]) {
          console.error("No routes found");
          return;
        }

        const route = result.routes[0];

        if (route.legs?.length) {
          const { reorderedOrders, orderETAs } = calculateOrderETAs(
            activeOrders,
            route.legs,
            route.optimizedIntermediateWaypointIndices
          );

          // Check if we should use existing ETAs
          let finalOrders = reorderedOrders;
          let shouldSaveOrders = true;

          if (vehicleData?.orders && Array.isArray(vehicleData.orders)) {
            const hasExistingEtas = vehicleData.orders.some(
              (o: any) => o.eta !== null
            );
            if (hasExistingEtas) {
              shouldSaveOrders = false;
              finalOrders = reorderedOrders.map((order) => {
                const existing = vehicleData.orders.find(
                  (o: any) => o.id === order.id
                );
                return existing && existing.eta !== null
                  ? { ...order, etaMinutes: existing.eta }
                  : order;
              });
            }
          }

          // Preserve previously completed orders that are no longer in active list
          const previousCompleted = optimizedOrders.filter(
            (o) =>
              o.status === "COMPLETE" &&
              !finalOrders.some((f) => f.id === o.id)
          );

          const mergedDisplayOrders = [...finalOrders, ...previousCompleted];

          setOptimizedOrders(mergedDisplayOrders);

          if (shouldSaveOrders) {
            await saveOrderETAs(orderETAs);
          }

          renderRoutePolylines(route.legs, map);
        }

        await route.createWaypointAdvancedMarkers(
          (defaultOptions: any, details: any) =>
            createMarkerOptions(defaultOptions, details, PinElement, map)
        );

        map.fitBounds(route.viewport);

        if (route.durationMillis) {
          let totalEta = Math.round(route.durationMillis / 60000);
          let shouldSaveVehicle = true;

          if (vehicleData?.eta !== null && vehicleData?.eta !== undefined) {
            totalEta = vehicleData.eta;
            shouldSaveVehicle = false;
          }

          setEta(totalEta);
          routeStartedRef.current = true;
          if (shouldSaveVehicle) {
            await saveVehicleETA(totalEta);
          }
        }

        // Mark routes as initialized to prevent recomputation
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    initMap();
  }, [orders, isOpen, vehicleId]); // optimizedOrders intentionally not included to avoid recompute loops

  // 3. Realtime Supabase subscription (after route init so optimizedOrders exists)
  useEffect(() => {
    if (!isOpen) return;
    if (!supabaseRef.current) supabaseRef.current = createClient();
    if (channelRef.current) return;

    const supabase = supabaseRef.current;
    channelRef.current = supabase
      .channel(`vehicle-orders-${vehicleId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Order",
          filter: `VehicleId=eq.${vehicleId}`,
        },
        (payload: any) => {
          const updated = payload.new as {
            id: number;
            eta: number | null;
            status: string;
          };
          if (!updated.id) return;
          setOptimizedOrders((prev) =>
            prev.map((o) =>
              o.id === updated.id
                ? {
                    ...o,
                    status: updated.status,
                    etaMinutes: updated.eta ?? undefined,
                  }
                : o
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Vehicle",
          filter: `id=eq.${vehicleId}`,
        },
        (payload: any) => {
          const updated = payload.new as {
            id: number;
            eta: number | null;
            status: string;
          };
          if (!updated || updated.id !== vehicleId) return;
          // Update local ETA state from vehicle table
          if (updated.eta !== null && updated.eta !== undefined) {
            setEta(updated.eta);
          }
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, [isOpen, vehicleId]);

  // 4. Watch ETA for completion
  useEffect(() => {
    if (!routeStartedRef.current) return;
    if (eta === null) return;
    if (eta <= 0) {
      const completeVehicle = async () => {
        try {
          await fetch("/api/vehicles/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vehicleId }),
          });
        } catch (err) {
          console.error("Error completing vehicle:", err);
        }
      };
      completeVehicle();
      onVehicleReset?.();
      routeStartedRef.current = false;
      setEta(null); // prevent re-trigger
    }
  }, [eta, vehicleId, onVehicleReset]);

  // 5. Cleanup when dialog closes
  useEffect(() => {
    if (!isOpen) {
      routeStartedRef.current = false;
    }
  }, [isOpen]);

  const calculateOrderETAs = (
    orders: Array<{ id: number; address: string; status: string }>,
    legs: any[],
    optimizedIndices: number[] | undefined
  ): {
    reorderedOrders: OrderWithETA[];
    orderETAs: Array<{ orderId: number; etaMinutes: number }>;
  } => {
    if (!orders?.length) {
      return { reorderedOrders: [], orderETAs: [] };
    }

    // Use optimized indices if valid, otherwise use original order
    const indices =
      optimizedIndices?.length &&
      optimizedIndices.every((idx) => idx >= 0 && idx < orders.length)
        ? optimizedIndices
        : orders.map((_, i) => i);

    let cumulativeDurationMs = 0;
    const orderETAs: Array<{ orderId: number; etaMinutes: number }> = [];

    const reorderedOrders = indices.map((originalIndex: number, i: number) => {
      const order = orders[originalIndex];
      const leg = legs[i];

      if (leg?.durationMillis) {
        cumulativeDurationMs += leg.durationMillis;
      }

      const etaMinutes = Math.round(cumulativeDurationMs / 60000);
      orderETAs.push({ orderId: order.id, etaMinutes });

      return { ...order, etaMinutes };
    });

    return { reorderedOrders, orderETAs };
  };

  const saveOrderETAs = async (
    orderETAs: Array<{ orderId: number; etaMinutes: number }>
  ) => {
    try {
      const response = await fetch("/api/orders/update-etas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderETAs }),
      });

      if (!response.ok) {
        console.error("Failed to save ETAs:", response.statusText);
      }
    } catch (error) {
      console.error("Error saving ETAs:", error);
    }
  };

  const saveVehicleETA = async (etaMinutes: number) => {
    try {
      const response = await fetch("/api/vehicles/update-eta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, etaMinutes }),
      });

      if (!response.ok) {
        console.error("Failed to save vehicle ETA:", response.statusText);
      }
    } catch (error) {
      console.error("Error saving vehicle ETA:", error);
    }
  };

  const renderRoutePolylines = (legs: any[], map: any) => {
    legs.forEach((leg, legIndex) => {
      const isReturnLeg = legIndex === legs.length - 1;

      new google.maps.Polyline({
        path: leg.path,
        strokeColor: isReturnLeg ? "#FF0000" : "#4285F4",
        strokeOpacity: 1.0,
        strokeWeight: 5,
        map,
      });
    });
  };

  const createMarkerOptions = (
    defaultOptions: google.maps.marker.AdvancedMarkerElementOptions,
    waypointMarkerDetails: any,
    PinElement: any,
    map: any
  ) => {
    const { index, totalMarkers } = waypointMarkerDetails;
    const isStore = index === 0 || index === totalMarkers - 1;

    return {
      ...defaultOptions,
      map,
      content: new PinElement({
        glyphText: isStore ? "Store" : index.toString(),
        glyphColor: "white",
        background: isStore ? "green" : "blue",
        borderColor: isStore ? "green" : "blue",
      }).element,
    };
  };

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
                        {order.etaMinutes !== undefined && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>
                              ETA:{" "}
                              {order.etaMinutes >= 60
                                ? `${Math.floor(order.etaMinutes / 60)}h ${
                                    order.etaMinutes % 60
                                  }m`
                                : `${order.etaMinutes} min`}
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
            {eta !== undefined && eta > 0 && (
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
