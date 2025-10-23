"use server";

import prisma from "@/lib/prisma";
import { ProductCategory } from "@prisma/client";

export interface ProductWithNumbers {
  id: number;
  name: string;
  description: string;
  category: string;
  pricePerUnit: number;
  weightPerUnit: number;
  quantityOnHand: number;
  imageUrl: string | null;
}

export interface SearchResult extends ProductWithNumbers {
  similarity: number;
}

// Calculate word similarity between two strings
function calculateWordSimilarity(str1: string, str2: string): number {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  
  let matches = 0;
  let totalWords = Math.max(words1.length, words2.length);
  
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || 
          word1.includes(word2) || 
          word2.includes(word1) ||
          calculateLevenshteinSimilarity(word1, word2) > 0.7) {
        matches++;
        break;
      }
    }
  }
  
  return totalWords > 0 ? (matches / totalWords) * 100 : 0;
}

// Calculate Levenshtein distance similarity
function calculateLevenshteinSimilarity(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
}

export async function searchProducts(query: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  const products = await prisma.product.findMany();
  
  const results: SearchResult[] = [];
  
  for (const product of products) {
    const similarity = calculateWordSimilarity(query, product.name);
    
    if (similarity > 50) {
      results.push({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        pricePerUnit: product.pricePerUnit.toNumber(),
        weightPerUnit: product.weightPerUnit.toNumber(),
        quantityOnHand: product.quantityOnHand,
        imageUrl: product.imageUrl,
        similarity
      });
    }
  }
  
  // Sort by similarity (highest first)
  return results.sort((a, b) => b.similarity - a.similarity);
}

export async function getSearchHistory(userId: string): Promise<string[]> {
  // For now, return empty array. In a real app, you'd store this in database
  // This could be implemented with a SearchHistory table
  return [];
}

export async function saveSearchHistory(userId: string, query: string): Promise<void> {
  // For now, do nothing. In a real app, you'd save this to database
  // This could be implemented with a SearchHistory table
}

//FILTER ACTIONS TYPES
export type Category = ProductCategory; 
export type FilterButtonProps = {
  activeCategory: ProductCategory | null;
  onCategoryChange: (category: ProductCategory | null) => void;
}; 