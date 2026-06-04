"use client";

import { useState } from "react";
import RichEditor from "@/components/admin/RichEditor";

type RichTextFieldProps = {
  name: string;
  label?: string;
  defaultValue?: string;
  mediaBucket?: string;
};

export default function RichTextField({
  name,
  label,
  defaultValue = "",
  mediaBucket,
}: RichTextFieldProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="space-y-2">
      {label ? <p className="text-sm text-[--text-muted]">{label}</p> : null}
      <RichEditor value={value} onChange={setValue} mediaBucket={mediaBucket} />
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
