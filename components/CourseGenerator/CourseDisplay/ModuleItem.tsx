"use client"

import type { Module } from "@/types"
import { LessonItem } from "./LessonItem"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface ModuleItemProps {
  module: Module
  moduleNumber: number
  isSelected?: boolean
  onSelect?: () => void
  isStreaming?: boolean
  isExpanded?: boolean
  onExpandChange?: (isExpanded: boolean) => void
  onLessonSelect?: (moduleIndex: number, lessonIndex: number) => void
  selectedLessonIndex?: number
}

export function ModuleItem({
  module,
  moduleNumber,
  isSelected,
  onSelect,
  isStreaming = false,
  isExpanded,
  onExpandChange,
  onLessonSelect,
  selectedLessonIndex,
}: ModuleItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const prevIsSelected = useRef(isSelected)
  
  // Sync with parent's expanded state when controlled externally
  useEffect(() => {
    if (isExpanded !== undefined) {
      setIsOpen(isExpanded);
    }
  }, [isExpanded]);
  
  // Automatically expand module when newly selected
  useEffect(() => {
    if (isSelected && !prevIsSelected.current) {
      setIsOpen(true);
      if (onExpandChange) {
        onExpandChange(true);
      }
    }
    prevIsSelected.current = isSelected;
  }, [isSelected, onExpandChange]);

  // Notify parent of expansion state changes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (onExpandChange) {
      onExpandChange(open);
    }
  };

  const handleModuleClick = () => {
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <div
      className={cn(
        "mb-2 overflow-hidden transition-all duration-300",
        isSelected && "bg-primary/5 rounded-lg",
      )}
    >
      <Collapsible open={isOpen} onOpenChange={handleOpenChange} className="w-full">
        <CollapsibleTrigger
          className={cn(
            "flex items-center justify-between w-full p-3 rounded-lg transition-colors",
            isSelected 
              ? "bg-primary/10 text-primary" 
              : "hover:bg-primary/5 hover:text-primary",
          )}
          onClick={handleModuleClick}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center min-w-8 min-h-8 rounded-full text-white",
                isSelected ? "bg-primary" : "bg-primary/80",
              )}
            >
              <span className="text-sm font-bold">{moduleNumber}</span>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm text-left">
                {module.title}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <span>{module.lessons.length} lessons</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStreaming && (
              <div className="flex items-center mr-1">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </div>
              </div>
            )}
            {isOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          <ul className="space-y-1 py-2 pl-11 pr-2">
            {module.lessons.map((lesson, index) => (
              <LessonItem
                key={lesson}
                lesson={lesson}
                lessonNumber={index + 1}
                isActive={isSelected && selectedLessonIndex === index}
                isStreaming={isStreaming && index === module.lessons.length - 1}
                onClick={() => onLessonSelect && onLessonSelect(moduleNumber - 1, index)}
              />
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}