import { Suspense } from "react";
import { getProducts } from "./actions";
import HomePageContent from "./home-client";

async function HomePage() {
  const initialProducts = await getProducts();

  return (
    <Suspense
      fallback={<div className="min-h-screen bg-gray-50 p-6">Loading...</div>}
    >
      <HomePageContent initialProducts={initialProducts} />
    </Suspense>
  );
}

export default HomePage;
