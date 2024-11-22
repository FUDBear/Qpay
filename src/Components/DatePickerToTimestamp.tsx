import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../datepicker.css"

interface DatePickerToTimestampProps {
  onDateChange: (timestamp: string) => void;
}

const DatePickerToTimestamp: React.FC<DatePickerToTimestampProps> = ({ onDateChange }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    const timestamp = date ? Math.floor(date.getTime() / 1000).toString() : "";
    onDateChange(timestamp);
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="block text-gray-700 font-bold">Send Date</label>
      <div className="relative">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          className="border bg-slate-100 w-80 rounded-lg py-2 px-4 focus:outline-none focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF]"
          dateFormat="MMMM d, yyyy h:mm aa"
          showTimeSelect
          placeholderText="Select a date and time"
          calendarClassName="custom-datepicker-calendar"
          popperClassName="z-50"
          popperPlacement="bottom-start"
        />  
      </div>
    </div>
  );
};

export default DatePickerToTimestamp;
