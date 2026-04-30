"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import ReminderReviewModal from "./ReminderReviewModal";

export default function ReminderButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-outline">
        <Send size={16}/> Send reminder
      </button>
      <ReminderReviewModal open={open} onClose={() => setOpen(false)}/>
    </>
  );
}
