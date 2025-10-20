"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Clock } from "lucide-react";
import { useSearchHistory } from "@/hooks/use-search-history";
import LoadingOverlay from "./loading-overlay";

export default function NavigationSearch() {
  const [query, setQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { searchHistory, saveSearchHistory } = useSearchHistory();

  // Handle click outside to close history
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        historyRef.current && 
        !historyRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearch = () => {
    if (query.trim()) {
      setIsSearching(true);
      // Save to search history
      saveSearchHistory(query.trim());
      // Navigate to home page with search query
      router.push(`/home?search=${encodeURIComponent(query.trim())}`);
      setShowHistory(false);
      
      // Reset loading state after navigation
      setTimeout(() => {
        setIsSearching(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    router.push(`/home?search=${encodeURIComponent(historyQuery)}`);
    setShowHistory(false);
  };

  const handleInputFocus = () => {
    if (searchHistory.length > 0) {
      setShowHistory(true);
    }
  };

  return (
    <div className="relative w-full">
      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isSearching} />
      
      {/* Search Input */}
      <div className="relative flex items-center">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Find your favorite food"
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={handleInputFocus}
          className="pr-20 pl-4 h-10 bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
        />
        
        {/* Clear Button */}
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-12 h-8 w-8 p-0 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Search Button */}
        <Button
          type="button"
          onClick={handleSearch}
          disabled={!query.trim()}
          className="absolute right-2 h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Search className="h-4 w-4 text-white" />
        </Button>
      </div>

      {/* Search History Dropdown */}
      {showHistory && (
        <div
          ref={historyRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto"
        >
          <div className="p-2">
            {searchHistory.length > 0 ? (
              <>
                <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                  Recent searches
                </div>
                {searchHistory.slice(0, 5).map((historyQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(historyQuery)}
                    className="w-full flex items-center space-x-2 px-2 py-2 text-left hover:bg-gray-50 rounded-md transition-colors duration-150"
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 truncate">
                      {historyQuery}
                    </span>
                  </button>
                ))}
              </>
            ) : (
              <div className="px-2 py-3 text-center">
                <div className="text-sm text-gray-500">
                  What would you like to eat today?
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
