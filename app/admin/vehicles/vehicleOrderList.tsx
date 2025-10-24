"use client"
import { Button } from "@/components/ui/button";
import { Order, Vehicle } from "@prisma/client";
import { useState } from "react";

type PendingOrder = {
  order: Order,
  totalPrice: number,
  totalWeight: number,
}

export default function VehicleOrderList({ vehicles , pendingOrders }: { vehicles: Vehicle[] , pendingOrders: PendingOrder[] }) {
  const [selectedVehicle, setSelectedVehicle] = useState(0);
  
  return (
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4">Vehicles</h2>
        <div className="grid gap-4">
          {vehicles.map((vehicle) => (
            <div 
              key={vehicle.id} 
              className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer transition-colors ${
          selectedVehicle === vehicle.id 
            ? 'bg-blue-100 border-blue-500' 
            : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedVehicle(vehicle.id)}
            >
              <div>
          <p className="font-semibold">Vehicle ID: {vehicle.id}</p>
          <p className="text-sm text-gray-600">Status: {vehicle.status}</p>
              </div>
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Deploy Vehicle
              </button>
            </div>
          ))}
      </div>
      {selectedVehicle > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Pending Orders</h3>
          <div className="grid gap-3">
            {pendingOrders.map((order) => (
              <div 
          key={order.order.id} 
          className="border rounded-lg p-3 flex items-center justify-between bg-yellow-50 border-yellow-200"
              >
          <div>
            <p className="font-medium">Order #{order.order.id}</p>
            <p className="text-sm text-gray-600">Address: {order.order.toAddress}</p>
            <p className="text-sm text-gray-600">Total Price: ${order.totalPrice.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Total Weight: {order.totalWeight} lbs</p>
          </div>
          <button 
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              // Handle order assignment to selected vehicle
              console.log(`Assigning order ${order.order.id} to vehicle ${selectedVehicle}`);
            }}
          >
            Assign Order
          </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <Button>
        Save Selection
      </Button>
    </div>
    
  )
}