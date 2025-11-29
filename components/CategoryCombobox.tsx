"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
  onAddCategory?: (category: string) => Promise<void> | void;
  placeholder?: string;
  className?: string;
}

export function CategoryCombobox({
  value,
  onChange,
  categories,
  onAddCategory,
  placeholder = "Select or create category...",
  className = "",
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Filter categories based on input
  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Check if input value is a new category
  const isNewCategory =
    inputValue.trim() &&
    !categories.some(
      (cat) => cat.toLowerCase() === inputValue.trim().toLowerCase()
    );

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        comboboxRef.current &&
        !comboboxRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setInputValue("");
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      // Focus input when opened
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSelect = (category: string) => {
    onChange(category);
    setOpen(false);
    setInputValue("");
  };

  const handleCreate = async () => {
    const newCategory = inputValue.trim();
    if (!newCategory || isCreating) return;

    setIsCreating(true);
    try {
      if (onAddCategory) {
        await onAddCategory(newCategory);
      }
      onChange(newCategory);
      setOpen(false);
      setInputValue("");
    } catch (error) {
      console.error("Failed to create category:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isNewCategory && !isCreating) {
      e.preventDefault();
      handleCreate();
    } else if (e.key === "Escape") {
      setOpen(false);
      setInputValue("");
    }
  };

  return (
    <div ref={comboboxRef} className={`relative ${className}`}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={() => setOpen(!open)}
      >
        <span className={value ? "" : "text-muted-foreground"}>
          {value || placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or create category..."
              className="flex-1 border-0 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => setInputValue("")}
                className="ml-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-auto p-1">
            {/* Existing Categories */}
            {filteredCategories.length > 0 && (
              <>
                {filteredCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleSelect(category)}
                    className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${
                      value === category ? "bg-accent" : ""
                    }`}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value === category ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {category}
                  </button>
                ))}
                {isNewCategory && <div className="border-t my-1" />}
              </>
            )}

            {/* Create New Category Option */}
            {isNewCategory && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                {isCreating
                  ? `Creating "${inputValue.trim()}"...`
                  : `Create "${inputValue.trim()}"`}
              </button>
            )}

            {/* No Results */}
            {!isNewCategory &&
              filteredCategories.length === 0 &&
              inputValue && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No categories found. Type to create a new one.
                </div>
              )}

            {/* Empty State */}
            {!inputValue && filteredCategories.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No categories available. Type to create one.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

