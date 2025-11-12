"use server";

import { getActivity, getPopularProducts, getRecentOrders } from "./actions";
import { SectionCards } from "./components/section-cards";

export default async function AdminAnalytics() {
  const recentActivity = await getActivity();
  const activeUsers = recentActivity.activeUsers;
  const activeOrders = recentActivity.activeOrders;
  const orderList = await getRecentOrders();
  const popularProductData = await getPopularProducts();

  return (
    <div className="">
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Analytics</h1>
          {/* <AddEmployeeButton /> */}
        </div>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards
                activeUsers={activeUsers}
                activeOrders={activeOrders}
                orderList={orderList}
                popularProductData={popularProductData}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
