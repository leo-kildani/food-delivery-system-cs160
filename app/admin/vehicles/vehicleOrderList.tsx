"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Order, Vehicle } from "@prisma/client";
import { useState, useActionState } from "react";
import { Truck, Package, MapPin, DollarSign, Weight } from "lucide-react";
import { deployVehicleAction, DeployState } from "./actions";

type PendingOrder = {
  order: Order,
  totalPrice: number,
  totalWeight: number,
}

export default function VehicleOrderList({ vehicles , pendingOrders }: { vehicles: Vehicle[] , pendingOrders: PendingOrder[] }) {
  const [selectedVehicle, setSelectedVehicle] = useState(0);
  const [assignedOrders, setAssignedOrders] = useState<{ [key: number]: number[] }>({}); // vehicleId -> orderIds[]
  
  // Deploy action state
  const [deployState, deployAction, isDeploying] = useActionState(
    deployVehicleAction,
    {} as DeployState
  );
  
  console.log(assignedOrders)

  // Calculate total weight for a vehicle
  const getVehicleTotalWeight = (vehicleId: number): number => {
    const orderIds = assignedOrders[vehicleId] || [];
    return orderIds.reduce((total, orderId) => {
      const order = pendingOrders.find(o => o.order.id === orderId);
      return total + (order?.totalWeight || 0);
    }, 0);
  };

  // Check if adding an order would exceed weight limit
  const wouldExceedWeightLimit = (vehicleId: number, orderWeight: number): boolean => {
    const currentWeight = getVehicleTotalWeight(vehicleId);
    return (currentWeight + orderWeight) > 200;
  };

  return (
      <div className="space-y-8 p-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Management</h2>
          <p className="text-gray-600">Assign pending orders to available vehicles</p>
        </div>
        
        <Separator />
        
        <div className="grid gap-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Available Vehicles
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => {
              const vehicleWeight = getVehicleTotalWeight(vehicle.id);
              const isOverloaded = vehicleWeight > 200;
              const assignedOrderCount = assignedOrders[vehicle.id]?.length || 0;
              
              return (
                <Card 
                  key={vehicle.id} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedVehicle === vehicle.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50'
                  } ${isOverloaded ? 'ring-2 ring-red-500 bg-red-50 border-red-200' : ''}`}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Vehicle #{vehicle.id}
                    </span>
                    <div className="flex gap-2">
                      <Badge 
                        variant="default"
                        className={vehicle.status === 'STANDBY' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                      >
                        {vehicle.status === 'STANDBY' ? 'Available' : 'In Transit'}
                      </Badge>
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
                        <span className={`font-medium ${isOverloaded ? 'text-red-600' : vehicleWeight > 150 ? 'text-orange-600' : 'text-green-600'}`}>
                          {vehicleWeight.toFixed(1)} / 200 lbs
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isOverloaded ? 'bg-red-500' : vehicleWeight > 150 ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((vehicleWeight / 200) * 100, 100)}%` }}
                        ></div>
                      </div>
                      {assignedOrderCount > 0 && (
                        <p className="text-blue-600 font-medium">
                          {assignedOrderCount} orders assigned
                        </p>
                      )}
                    </div>
                    <form action={deployAction}>
                      <input type="hidden" name="vehicleId" value={vehicle.id} />
                      <input 
                        type="hidden" 
                        name="orderIds" 
                        value={JSON.stringify(assignedOrders[vehicle.id] || [])} 
                      />
                      <Button 
                        type="submit"
                        size="sm" 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={isDeploying || assignedOrderCount === 0 || vehicle.status === 'IN_TRANSIT'}
                      >
                        {isDeploying ? 'Deploying...' : 
                         vehicle.status === 'IN_TRANSIT' ? 'Already Deployed' :
                         assignedOrderCount === 0 ? 'No Orders' : 'Deploy'}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        </div>
        
        {/* Deploy feedback messages */}
        {deployState.success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              ✅ Vehicle #{deployState.deployedVehicleId} deployed successfully!
            </p>
          </div>
        )}
        
        {deployState.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">
              ❌ {deployState.error}
            </p>
          </div>
        )}
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
                  const isAssigned = assignedOrders[selectedVehicle]?.includes(order.order.id);
                  const isOrderAssignedElsewhere = Object.values(assignedOrders).some(orders => 
                                orders.includes(order.order.id)
                              );
                  const wouldExceedLimit = wouldExceedWeightLimit(selectedVehicle, order.totalWeight);
                  const canAssign = !isOrderAssignedElsewhere && !wouldExceedLimit;
                  
                  return (
                    <Card 
                      key={order.order.id} 
                      className={`transition-all duration-200 ${
                        isAssigned 
                          ? 'ring-2 ring-green-500 bg-green-50 border-green-200' 
                          : isOrderAssignedElsewhere 
                          ? 'bg-gray-50 border-gray-300 opacity-60'
                          : wouldExceedLimit
                          ? 'bg-red-50 border-red-300 opacity-75'
                          : 'bg-white hover:shadow-md'
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Order #{order.order.id}
                          </span>
                          <Badge 
                            variant={isAssigned ? 'default' : 'secondary'}
                            className={isAssigned ? 'bg-green-100 text-green-800' : wouldExceedLimit ? 'bg-red-100 text-red-800' : ''}
                          >
                            {isAssigned 
                              ? 'Assigned' 
                              : isOrderAssignedElsewhere 
                              ? 'Assigned Elsewhere' 
                              : wouldExceedLimit 
                              ? 'Too Heavy' 
                              : 'Pending'}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{order.order.toAddress}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-600">
                                ${order.totalPrice.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Weight className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-600">
                                {order.totalWeight} lbs
                              </span>
                            </div>
                          </div>
                          <div className="pt-2">
                            {wouldExceedLimit && !isAssigned && (
                              <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
                                Adding this order would exceed 200 lb weight limit
                              </div>
                            )}
                            <Button 
                              className={`w-full ${
                                (isAssigned || isOrderAssignedElsewhere) 
                                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                              }`}
                              disabled={!isAssigned && !canAssign}
                              onClick={() => {
                                setAssignedOrders((prev) => {
                                  const currentOrders = prev[selectedVehicle] || [];
                                  if (isAssigned) {
                                    // Unassign order
                                    return {
                                      ...prev,
                                      [selectedVehicle]: currentOrders.filter(id => id !== order.order.id),
                                    };
                                  } else {
                                    if (!canAssign) {
                                      return prev; // Don't assign if can't assign
                                    }
                                    // Assign order
                                    return {
                                      ...prev,
                                      [selectedVehicle]: [...currentOrders, order.order.id],
                                    };
                                  }
                                });
                              }}
                            >
                              {isAssigned 
                                ? 'Unassign Order' 
                                : wouldExceedLimit 
                                ? 'Weight Limit Exceeded' 
                                : isOrderAssignedElsewhere 
                                ? 'Already Assigned' 
                                : 'Assign Order'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    
  )
}