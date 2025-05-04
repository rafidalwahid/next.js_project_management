"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  onSelect?: (date: Date | undefined) => void;
  defaultDate?: Date;
  selected?: Date | null;
}

export function DatePicker({ onSelect, defaultDate, selected }: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(selected || defaultDate)

  // Update date state when defaultDate or selected prop changes
  React.useEffect(() => {
    setDate(selected || defaultDate)
  }, [defaultDate, selected])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Select date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => {
            setDate(newDate);
            if (onSelect) onSelect(newDate);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
