"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getProducts, ProductWithNumbers } from "./actions";
import { searchProducts, SearchResult } from "./search-actions";
import LoadingOverlay from "../components/loading-overlay";

function HomePageContent() {
  const [products, setProducts] = useState<ProductWithNumbers[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();

  // Load initial products
  useEffect(() => {
    async function loadProducts() {
      const initialProducts = await getProducts();
      setProducts(initialProducts);
    }
    loadProducts();
  }, []);

  // Handle search from URL params
  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      handleSearch(query);
    } else {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [searchParams]);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setSearchQuery(query);
    
    try {
      const results = await searchProducts(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const displayProducts = searchQuery ? searchResults : products;
  const isNoResults = searchQuery && searchResults.length === 0 && !isSearching;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isSearching} />
      
      {/* Results Section */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Search Status */}
          {searchQuery && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {isSearching ? "Searching..." : `Search results for "${searchQuery}"`}
              </h2>
              {searchResults.length > 0 && (
                <p className="text-gray-600">
                  Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* No Results */}
          {isNoResults && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Not found your favorite food
              </h3>
              <p className="text-gray-500">
                Try searching with different keywords or check your spelling
              </p>
            </div>
          )}

          {/* Products Grid */}
          {!isNoResults && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 shadow-md bg-white hover:shadow-lg transition-shadow duration-200">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-2">{product.description}</p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Price:</span> $
                      {product.pricePerUnit}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Weight:</span>{" "}
                      {product.weightPerUnit}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Quantity:</span>{" "}
                      {product.quantityOnHand}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 p-6">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
