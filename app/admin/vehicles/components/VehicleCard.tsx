"use client";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Weight, Map } from "lucide-react";
import {
  DeployState,
  deployVehicleAction,
  VehicleWithOrders,
} from "../actions";
import VehicleRouteModal from "./VehicleRouteModal";

interface VehicleCardProps {
  vehicle: VehicleWithOrders;
  isSelected: boolean;
  tempVehicleWeight: number; // Weight from temporarily assigned orders
  tempAssignedOrderCount: number; // Count from temporarily assigned orders
  assignedOrders: number[];
  onSelect: () => void;
  changeDeployState: (state: DeployState) => void;
  onClearPendingAssignments?: () => void; // Add callback to clear pending assignments
}

export function VehicleCard({
  vehicle,
  isSelected,
  tempVehicleWeight,
  tempAssignedOrderCount,
  assignedOrders,
  onSelect,
  changeDeployState,
  onClearPendingAssignments
}: VehicleCardProps) {
  // Deploy action state
  const [deployState, deployAction, isDeploying] = useActionState(
    async (prevState: DeployState, formData: FormData) => {
      const newState = await deployVehicleAction(prevState, formData);
      changeDeployState(newState);
      if (newState.success) setIsModalOpen(true);
      return newState;
    },
    {} as DeployState
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Local vehicle state so we can optimistically reset after route completion
  const [vehicleState, setVehicleState] = useState(vehicle);

  // Keep local state in sync when parent passes new vehicle (e.g. after revalidation)
  useEffect(() => {
    setVehicleState(vehicle);
    // Clear pending assignments when vehicle updates (e.g., after deployment)
    if (vehicle.status === "IN_TRANSIT" && onClearPendingAssignments) {
      onClearPendingAssignments();
    }
  }, [vehicle, onClearPendingAssignments]);

  // Total weight = persistent weight + temporary weight
  const totalWeight = vehicleState.totalAssignedWeight + tempVehicleWeight;
  const isOverloaded = totalWeight > 200;

  // Total orders = persistent orders + temporary orders
  const totalOrderCount = vehicleState.assignedOrdersCount + tempAssignedOrderCount;

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected
          ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
          : "hover:bg-gray-50"
      } ${isOverloaded ? "ring-2 ring-red-500 bg-red-50 border-red-200" : ""}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            <span className="text-base font-semibold">
              Vehicle #{vehicleState.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="default"
              className={
                vehicleState.status === "STANDBY"
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }
            >
              {vehicleState.status === "STANDBY" ? "Available" : "In Transit"}
            </Badge>
            {vehicleState.status === "IN_TRANSIT" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-blue-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
              >
                <Map className="h-5 w-5 transition-colors hover:text-blue-600" />
                <span className="sr-only">View Route</span>
              </Button>
            )}
            {isOverloaded && (
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                Overloaded
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Weight className="h-4 w-4" />
              <span
                className={`font-medium ${
                  isOverloaded
                    ? "text-red-600"
                    : totalWeight > 150
                    ? "text-orange-600"
                    : "text-green-600"
                }`}
              >
                {totalWeight.toFixed(1)} / 200 lbs
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isOverloaded
                    ? "bg-red-500"
                    : totalWeight > 150
                    ? "bg-orange-500"
                    : "bg-green-500"
                }`}
                style={{
                  width: `${Math.min((totalWeight / 200) * 100, 100)}%`,
                }}
              ></div>
            </div>

            {/* Show persistent orders info */}
            {vehicleState.assignedOrdersCount > 0 && (
              <p className="text-green-600 font-medium text-xs mb-1">
                ✓ {vehicleState.assignedOrdersCount} deployed orders (
                {vehicleState.totalAssignedWeight.toFixed(1)} lbs)
              </p>
            )}

            {/* Show temporary orders info */}
            {tempAssignedOrderCount > 0 && (
              <p className="text-blue-600 font-medium text-xs">
                📋 {tempAssignedOrderCount} pending assignment (
                {tempVehicleWeight.toFixed(1)} lbs)
              </p>
            )}

            {/* Show total if both exist */}
            {vehicleState.assignedOrdersCount > 0 && tempAssignedOrderCount > 0 && (
              <p className="text-gray-700 font-medium text-xs border-t pt-1 mt-1">
                Total: {totalOrderCount} orders ({totalWeight.toFixed(1)} lbs)
              </p>
            )}
          </div>
          <form action={deployAction}>
            <input type="hidden" name="vehicleId" value={vehicleState.id} />
            <input
              type="hidden"
              name="orderIds"
              value={JSON.stringify(assignedOrders)}
            />
            <Button
              type="submit"
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={
                isDeploying ||
                tempAssignedOrderCount === 0 ||
                vehicleState.status === "IN_TRANSIT"
              }
            >
              {isDeploying
                ? "Deploying..."
                : vehicleState.status === "IN_TRANSIT"
                ? "Already Deployed"
                : tempAssignedOrderCount === 0
                ? "No New Orders"
                : "Deploy"}
            </Button>
          </form>
        </div>
      </CardContent>

      {isModalOpen && vehicleState.status === "IN_TRANSIT" && (
        <VehicleRouteModal
          isOpen={isModalOpen}
          changeIsOpen={setIsModalOpen}
          vehicleId={vehicleState.id}
          orders={vehicleState.orders.map((order) => ({
            id: order.id,
            address: order.toAddress,
            status: order.status,
          }))}
          onVehicleReset={() => {
            // Optimistically reset vehicle state; server revalidation will correct if needed
            setVehicleState((prev) => ({
              ...prev,
              status: "STANDBY",
              orders: [],
              assignedOrdersCount: 0,
              totalAssignedWeight: 0,
              tempAssignedOrderCount: 0,
              tempVehicleWeight: 0,
            }));
          }}
        />
      )}
    </Card>
  );
}