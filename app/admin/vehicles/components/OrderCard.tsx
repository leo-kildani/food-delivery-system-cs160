"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Order } from "@prisma/client";
import { Package, MapPin, DollarSign, Weight } from "lucide-react";

type PendingOrder = {
  order: Omit<Order, 'totalAmount'> & { totalAmount: number | null },
  totalPrice: number,
  totalWeight: number,
}

interface OrderCardProps {
  pendingOrder: PendingOrder;
  isAssigned: boolean;
  isOrderAssignedElsewhere: boolean;
  wouldExceedLimit: boolean;
  canAssign: boolean;
  onToggleAssignment: () => void;
}

export function OrderCard({
  pendingOrder: order,
  isAssigned,
  isOrderAssignedElsewhere,
  wouldExceedLimit,
  canAssign,
  onToggleAssignment
}: OrderCardProps) {
  return (
    <Card 
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
              onClick={onToggleAssignment}
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
}