import { Module } from '@/types';
import { LessonItem } from './LessonItem';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ModuleItemProps {
  module: Module;
  moduleNumber: number;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function ModuleItem({ module, moduleNumber, isSelected, onSelect }: ModuleItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full"
    >
      <CollapsibleTrigger 
        className={cn(
          "flex items-center justify-between w-full p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
          isSelected && "bg-accent text-accent-foreground"
        )}
        onClick={onSelect}
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          <span className="font-medium text-sm">
            Module {moduleNumber}: {module.title}
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <ul className="space-y-1 py-1 pl-6">
          {module.lessons.map((lesson, index) => (
            <LessonItem 
              key={lesson} 
              lesson={lesson} 
              lessonNumber={index + 1}
            />
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
} 