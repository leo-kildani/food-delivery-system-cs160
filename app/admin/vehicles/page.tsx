import { getPendingOrders, getVehicles } from "./actions";
import VehicleOrderList from "./vehicleOrderList";

export default async function DeployVehicles() {

  const vehicles = await getVehicles();
  const pendingOrders = await getPendingOrders();   
  console.log(pendingOrders[0]?.order.totalAmount); // Access first order's totalAmount
  return (
    <div>
      <VehicleOrderList vehicles={vehicles} pendingOrders={pendingOrders} />
    </div>
  )  
}