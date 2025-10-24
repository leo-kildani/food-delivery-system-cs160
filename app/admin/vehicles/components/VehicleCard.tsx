"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Vehicle } from "@prisma/client";
import { Truck, Weight } from "lucide-react";
import { DeployState, VehicleWithOrders } from "../actions";

interface VehicleCardProps {
  vehicle: VehicleWithOrders;
  isSelected: boolean;
  tempVehicleWeight: number; // Weight from temporarily assigned orders
  tempAssignedOrderCount: number; // Count from temporarily assigned orders
  assignedOrders: number[];
  isDeploying: boolean;
  onSelect: () => void;
  deployAction: (payload: FormData) => void;
}

export function VehicleCard({
  vehicle,
  isSelected,
  tempVehicleWeight,
  tempAssignedOrderCount,
  assignedOrders,
  isDeploying,
  onSelect,
  deployAction
}: VehicleCardProps) {
  // Total weight = persistent weight + temporary weight
  const totalWeight = vehicle.totalAssignedWeight + tempVehicleWeight;
  const isOverloaded = totalWeight > 200;
  
  // Total orders = persistent orders + temporary orders
  const totalOrderCount = vehicle.assignedOrdersCount + tempAssignedOrderCount;
  
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
          : 'hover:bg-gray-50'
      } ${isOverloaded ? 'ring-2 ring-red-500 bg-red-50 border-red-200' : ''}`}
      onClick={onSelect}
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
              <span className={`font-medium ${isOverloaded ? 'text-red-600' : totalWeight > 150 ? 'text-orange-600' : 'text-green-600'}`}>
                {totalWeight.toFixed(1)} / 200 lbs
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isOverloaded ? 'bg-red-500' : totalWeight > 150 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((totalWeight / 200) * 100, 100)}%` }}
              ></div>
            </div>
            
            {/* Show persistent orders info */}
            {vehicle.assignedOrdersCount > 0 && (
              <p className="text-green-600 font-medium text-xs mb-1">
                ✓ {vehicle.assignedOrdersCount} deployed orders ({vehicle.totalAssignedWeight.toFixed(1)} lbs)
              </p>
            )}
            
            {/* Show temporary orders info */}
            {tempAssignedOrderCount > 0 && (
              <p className="text-blue-600 font-medium text-xs">
                📋 {tempAssignedOrderCount} pending assignment ({tempVehicleWeight.toFixed(1)} lbs)
              </p>
            )}
            
            {/* Show total if both exist */}
            {vehicle.assignedOrdersCount > 0 && tempAssignedOrderCount > 0 && (
              <p className="text-gray-700 font-medium text-xs border-t pt-1 mt-1">
                Total: {totalOrderCount} orders ({totalWeight.toFixed(1)} lbs)
              </p>
            )}
          </div>
          <form action={deployAction}>
            <input type="hidden" name="vehicleId" value={vehicle.id} />
            <input 
              type="hidden" 
              name="orderIds" 
              value={JSON.stringify(assignedOrders)} 
            />
            <Button 
              type="submit"
              size="sm" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isDeploying || tempAssignedOrderCount === 0 || vehicle.status === 'IN_TRANSIT'}
            >
              {isDeploying ? 'Deploying...' : 
               vehicle.status === 'IN_TRANSIT' ? 'Already Deployed' :
               tempAssignedOrderCount === 0 ? 'No New Orders' : 'Deploy'}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}