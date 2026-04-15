'use client'

import React from 'react';
import DatePicker from 'react-datepicker';
import { Clock, Calendar } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
}

export default function CustomDatePicker({ selected, onChange, placeholderText = "Select date and time" }: CustomDatePickerProps) {
  return (
    <div className="custom-datetime-container">
      <Clock size={16} className="icon" />
      <Calendar size={16} className="absolute right-4 text-[var(--color-accent)] pointer-events-none opacity-60 z-10" />
      <DatePicker
        selected={selected}
        onChange={onChange}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        dateFormat="MMMM d, yyyy h:mm aa"
        placeholderText={placeholderText}
        className="editorial-input !pr-10 cursor-pointer w-full"
        calendarClassName="collixa-calendar"
        wrapperClassName="w-full"
        popperClassName="collixa-calendar-popper"
        popperPlacement="bottom-start"
      />
      <style jsx global>{`
        .collixa-calendar {
          background-color: var(--color-bg-secondary) !important;
          border: 1px solid var(--color-border) !important;
          border-radius: 1.5rem !important;
          box-shadow: 0 20px 60px -15px rgba(2, 26, 84, 0.15) !important;
          font-family: 'Nunito', sans-serif !important;
          padding: 0.75rem !important;
          display: flex !important;
          flex-direction: row !important;
          width: auto !important;
        }
        .collixa-calendar .react-datepicker__month-container {
          float: none !important;
        }
        .collixa-calendar .react-datepicker__time-container {
          border-left: 1px solid var(--color-border) !important;
          border-top: none !important;
          width: 85px !important;
          margin-left: 0.5rem !important;
        }
        .collixa-calendar .react-datepicker__time {
          border-radius: 0 1rem 1rem 0 !important;
        }
        .collixa-calendar .react-datepicker__time-box {
          border-radius: 0 1rem 1rem 0 !important;
          width: 85px !important;
        }
        .collixa-calendar .react-datepicker__header {
          background-color: var(--color-bg-secondary) !important;
          border-bottom: 1px solid var(--color-border) !important;
          border-radius: 1rem 1rem 0 0 !important;
          padding-top: 1rem !important;
        }
        .collixa-calendar .react-datepicker__current-month {
          color: var(--color-text-primary) !important;
          font-weight: 700 !important;
          font-size: 1rem !important;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .collixa-calendar .react-datepicker__day-names {
          margin-top: 0.75rem !important;
        }
        .collixa-calendar .react-datepicker__day-name {
          color: var(--color-accent) !important;
          font-weight: 700 !important;
          font-size: 0.65rem !important;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          width: 1.75rem !important;
          line-height: 1.75rem !important;
        }
        .collixa-calendar .react-datepicker__day {
          color: var(--color-text-primary) !important;
          font-weight: 600 !important;
          font-size: 0.75rem !important;
          width: 1.75rem !important;
          line-height: 1.75rem !important;
          border-radius: 50% !important;
          margin: 0.1rem !important;
          transition: all 0.2s ease;
          border: 2px solid transparent !important;
        }
        .collixa-calendar .react-datepicker__month {
          margin: 0.5rem !important;
        }
        .collixa-calendar .react-datepicker__week {
          margin-bottom: 0.1rem !important;
        }
        .collixa-calendar .react-datepicker__day:hover {
          background-color: var(--color-accent-soft) !important;
          border-color: var(--color-accent) !important;
          color: var(--color-text-primary) !important;
        }
        .collixa-calendar .react-datepicker__day--selected,
        .collixa-calendar .react-datepicker__day--keyboard-selected {
          background-color: var(--color-accent) !important;
          border-color: var(--color-accent) !important;
          color: white !important;
          font-weight: 700 !important;
        }
        .collixa-calendar .react-datepicker__day--today {
          background-color: var(--color-accent-soft) !important;
          color: var(--color-accent) !important;
          font-weight: 700 !important;
        }
        .collixa-calendar .react-datepicker__day--disabled {
          color: var(--color-border) !important;
        }
        .collixa-calendar .react-datepicker__navigation {
          top: 0.75rem !important;
          width: 1.75rem !important;
          height: 1.75rem !important;
          border-radius: 50% !important;
          background-color: var(--color-bg-primary) !important;
          border: 1px solid var(--color-border) !important;
        }
        .collixa-calendar .react-datepicker__navigation-icon::before {
          top: 8px !important;
        }
        .collixa-calendar .react-datepicker__navigation:hover {
          background-color: var(--color-accent-soft) !important;
          border-color: var(--color-accent) !important;
        }
        .collixa-calendar .react-datepicker__navigation-icon::before {
          border-color: var(--color-text-primary) !important;
          border-width: 2px 2px 0 0 !important;
          width: 8px !important;
          height: 8px !important;
          top: 10px !important;
        }
        .collixa-calendar .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: var(--color-accent) !important;
        }
        .collixa-calendar .react-datepicker__time-container {
          border-left: 1px solid var(--color-border) !important;
        }
        .collixa-calendar .react-datepicker__time-box {
          background-color: var(--color-bg-secondary) !important;
        }
        .collixa-calendar .react-datepicker__time-list {
          height: 160px !important;
        }
        .collixa-calendar .react-datepicker__time-list-item {
          color: var(--color-text-primary) !important;
          font-weight: 600 !important;
          font-family: 'Nunito', sans-serif !important;
          padding: 0.35rem 0.75rem !important;
          font-size: 0.8rem !important;
          transition: all 0.2s ease;
        }
        .collixa-calendar .react-datepicker__time-list-item:hover {
          background-color: var(--color-accent-soft) !important;
          color: var(--color-text-primary) !important;
        }
        .collixa-calendar .react-datepicker__time-list-item--selected {
          background-color: var(--color-accent) !important;
          color: white !important;
          font-weight: 700 !important;
        }
        .collixa-calendar-popper {
          z-index: 100 !important;
        }
        .react-datepicker__triangle {
          display: none !important;
        }
        .react-datepicker__input-container input {
          width: 100% !important;
        }
      `}</style>
    </div>
  );
}
