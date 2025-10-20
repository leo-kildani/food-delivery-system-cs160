"use client";

import { useState, useEffect } from "react";

const SEARCH_HISTORY_KEY = "food-delivery-search-history";
const MAX_HISTORY_ITEMS = 5;

export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const history = JSON.parse(stored);
        setSearchHistory(Array.isArray(history) ? history : []);
      }
    } catch (error) {
      console.error("Error loading search history:", error);
      setSearchHistory([]);
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return;

    try {
      const newHistory = [
        query.trim(),
        ...searchHistory.filter(item => item !== query.trim())
      ].slice(0, MAX_HISTORY_ITEMS);

      setSearchHistory(newHistory);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  return {
    searchHistory,
    saveSearchHistory,
    clearSearchHistory
  };
}

