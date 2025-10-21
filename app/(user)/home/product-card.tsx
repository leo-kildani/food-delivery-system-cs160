import { SerializedProduct } from "./actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ProductCardProps {
  product: SerializedProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="border-black/10 hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold leading-tight flex-1">
            {product.name}
          </h2>
        </div>
        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full w-fit">
          {product.category}
        </span>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Price per Unit</p>
              <p className="text-lg font-bold text-green-600">
                ${product.pricePerUnit.toFixed(2)}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Weight per Unit</p>
              <p className="text-lg font-bold text-blue-600">
                {product.weightPerUnit.toFixed(3)} lbs
              </p>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">Available</p>
            <p className="text-lg font-bold text-orange-600">
              {product.quantityOnHand} in stock
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
