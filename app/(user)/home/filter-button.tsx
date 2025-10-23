"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Category, FilterButtonProps } from "./search-actions";
import { ProductCategory } from "@prisma/client";

export default function FilterButton({ activeCategory, onCategoryChange }: FilterButtonProps) {
  const categories: { value: Category; label: string }[] = [
    { value: "FRUIT", label: "Fruit" },
    { value: "VEGETABLE", label: "Vegetable" },
    { value: "DAIRY", label: "Dairy" },
    { value: "MEAT", label: "Meat" },
  ];

  const handleCategoryClick = (category: ProductCategory) => {
    if (activeCategory === category) {
      onCategoryChange(null);
    } else {
      onCategoryChange(category);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {categories.map((category) => {
        const isActive = activeCategory === category.value;

        return (
          <Button
            key={category.value}
            variant={isActive ? "default" : "outline"}
            onClick={() => handleCategoryClick(category.value)}
            className="relative"
          >
            {category.label}
            {isActive && <X className="ml-2 h-4 w-4" />}
          </Button>
        );
      })}
    </div>
  );
}
