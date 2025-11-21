"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CollapsibleSection({
  title,
  icon,
  count,
  children,
  emptyMessage,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
  emptyMessage: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (count === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {icon}
            {title}
            <span className="text-muted-foreground text-base font-normal">
              ({count})
            </span>
          </h2>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              {isOpen ? (
                <>
                  Hide <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  View More <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="space-y-3">{children}</div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
