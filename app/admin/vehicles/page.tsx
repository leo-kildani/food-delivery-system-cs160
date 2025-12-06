import { requireAdmin } from "../actions";
import { getPendingOrders, getVehicles } from "./actions";
import VehicleOrderList from "./vehicleOrderList";

export default async function DeployVehicles() {
  await requireAdmin();
  const vehicles = await getVehicles();
  const pendingOrders = await getPendingOrders();   
  return (
    <div>
      <VehicleOrderList vehicles={vehicles} pendingOrders={pendingOrders} />
    </div>
  )  
}