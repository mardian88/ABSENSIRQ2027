"use client"

import * as React from "react"
import { format, isValid, parse } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { id } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

export function DatePicker({
  date,
  setDate,
  placeholder = "DD/MM/YYYY",
  name
}: {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  placeholder?: string
  name?: string
}) {
  const [inputValue, setInputValue] = React.useState("")
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)

  // Sync input value when date changes externally or via calendar click
  React.useEffect(() => {
    if (date && isValid(date)) {
      setInputValue(format(date, "dd/MM/yyyy"))
    } else {
      setInputValue("")
    }
  }, [date])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // detect if user is backspacing
    const isDeleting = val.length < inputValue.length;
    
    val = val.replace(/[^0-9/]/g, ''); // keep only numbers and slash
    
    if (!isDeleting) {
      const digitsOnly = val.replace(/[^0-9]/g, '');
      if (digitsOnly.length > 2 && digitsOnly.length <= 4) {
        val = digitsOnly.slice(0, 2) + '/' + digitsOnly.slice(2);
      } else if (digitsOnly.length > 4) {
        val = digitsOnly.slice(0, 2) + '/' + digitsOnly.slice(2, 4) + '/' + digitsOnly.slice(4, 8);
      }
    }

    setInputValue(val);

    // Try parsing if length is 10 (DD/MM/YYYY)
    if (val.length === 10) {
      const parsed = parse(val, 'dd/MM/yyyy', new Date());
      if (isValid(parsed) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
        setDate(parsed);
      } else {
        setDate(undefined);
      }
    } else if (val === "") {
      setDate(undefined);
    }
  }

  const handleBlur = () => {
    if (date && isValid(date)) {
      setInputValue(format(date, "dd/MM/yyyy"))
    } else {
      setInputValue("")
      setDate(undefined)
    }
  }

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    setIsPopoverOpen(false)
  }

  return (
    <div className="relative flex items-center w-full">
      {name && <input type="hidden" name={name} value={date && isValid(date) ? format(date, 'yyyy-MM-dd') : ''} />}
      
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute left-3 text-slate-500 hover:text-slate-700 z-10 transition-colors"
            aria-label="Pilih tanggal"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <Input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="pl-10 w-full bg-white h-10 border-input"
        />
        <PopoverContent className="w-auto p-0 z-[200]" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleCalendarSelect}
            initialFocus
            locale={id}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
