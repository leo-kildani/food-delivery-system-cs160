"use client";

import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuCheckboxItem, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"; // Fixed import path
import { Filter } from "lucide-react";

export default function FilterDropDown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-2 pb-3">
          <Filter className="mr-2 h-4 w-4" />
          Filter By
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Filters will go here */}
        <DropdownMenuCheckboxItem>
            Price
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem>
            Weight
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem>
            Quantity
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}