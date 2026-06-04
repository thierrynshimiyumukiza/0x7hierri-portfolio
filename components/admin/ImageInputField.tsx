"use client";

import { useState } from "react";
import ImageField from "@/components/admin/ImageField";

type ImageInputFieldProps = {
  name: string;
  label: string;
  bucket: string;
  defaultValue?: string;
  shape?: "rect" | "circle";
};

export default function ImageInputField({
  name,
  label,
  bucket,
  defaultValue = "",
  shape = "rect",
}: ImageInputFieldProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="space-y-2">
      <ImageField label={label} bucket={bucket} value={value} onChange={setValue} shape={shape} />
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
