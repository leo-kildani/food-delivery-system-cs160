"use client";
import { Separator } from "@/components/ui/separator";
import { Order } from "@prisma/client";
import { useState, useActionState } from "react";
import { Truck, Package } from "lucide-react";
import { deployVehicleAction, DeployState, VehicleWithOrders } from "./actions";
import { VehicleCard, OrderCard, DeployFeedback } from "./components";

type PendingOrder = {
  order: Order;
  totalPrice: number;
  totalWeight: number;
};

export default function VehicleOrderList({
  vehicles,
  pendingOrders,
}: {
  vehicles: VehicleWithOrders[];
  pendingOrders: PendingOrder[];
}) {
  const [selectedVehicle, setSelectedVehicle] = useState(0);
  const [assignedOrders, setAssignedOrders] = useState<{
    [key: number]: number[];
  }>({}); // vehicleId -> orderIds[]

  // Deploy action state
  const [deployState, deployAction, isDeploying] = useActionState(
    deployVehicleAction,
    {} as DeployState
  );

  console.log(assignedOrders);

  // Calculate total weight for a vehicle
  const getVehicleTotalWeight = (vehicleId: number): number => {
    const orderIds = assignedOrders[vehicleId] || [];
    return orderIds.reduce((total, orderId) => {
      const order = pendingOrders.find((o) => o.order.id === orderId);
      return total + (order?.totalWeight || 0);
    }, 0);
  };

  // Check if adding an order would exceed weight limit
  const wouldExceedWeightLimit = (
    vehicleId: number,
    orderWeight: number
  ): boolean => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return true;

    const tempWeight = getVehicleTotalWeight(vehicleId);
    const totalCurrentWeight = vehicle.totalAssignedWeight + tempWeight;
    return totalCurrentWeight + orderWeight > 200;
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Vehicle Management
        </h2>
        <p className="text-gray-600">
          Assign pending orders to available vehicles
        </p>
      </div>

      <Separator />

      <div className="grid gap-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Available Vehicles
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => {
            const tempVehicleWeight = getVehicleTotalWeight(vehicle.id);
            const tempAssignedOrderCount =
              assignedOrders[vehicle.id]?.length || 0;

            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isSelected={selectedVehicle === vehicle.id}
                tempVehicleWeight={tempVehicleWeight}
                tempAssignedOrderCount={tempAssignedOrderCount}
                assignedOrders={assignedOrders[vehicle.id] || []}
                isDeploying={isDeploying}
                onSelect={() => setSelectedVehicle(vehicle.id)}
                deployAction={deployAction}
              />
            );
          })}
        </div>
      </div>

      <DeployFeedback deployState={deployState} />
      {selectedVehicle > 0 && (
        <div className="space-y-6">
          <Separator />
          <div>
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <Package className="h-5 w-5" />
              Pending Orders
            </h3>
            <div className="grid gap-4">
              {pendingOrders.map((order) => {
                const isAssigned = assignedOrders[selectedVehicle]?.includes(
                  order.order.id
                );
                const isOrderAssignedElsewhere = Object.values(
                  assignedOrders
                ).some((orders) => orders.includes(order.order.id));
                const wouldExceedLimit = wouldExceedWeightLimit(
                  selectedVehicle,
                  order.totalWeight
                );
                const canAssign =
                  !isOrderAssignedElsewhere && !wouldExceedLimit;

                return (
                  <OrderCard
                    key={order.order.id}
                    pendingOrder={order}
                    isAssigned={isAssigned}
                    isOrderAssignedElsewhere={isOrderAssignedElsewhere}
                    wouldExceedLimit={wouldExceedLimit}
                    canAssign={canAssign}
                    onToggleAssignment={() => {
                      setAssignedOrders((prev) => {
                        const currentOrders = prev[selectedVehicle] || [];
                        if (isAssigned) {
                          // Unassign order
                          return {
                            ...prev,
                            [selectedVehicle]: currentOrders.filter(
                              (id) => id !== order.order.id
                            ),
                          };
                        } else {
                          if (!canAssign) {
                            return prev; // Don't assign if can't assign
                          }
                          // Assign order
                          return {
                            ...prev,
                            [selectedVehicle]: [
                              ...currentOrders,
                              order.order.id,
                            ],
                          };
                        }
                      });
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
