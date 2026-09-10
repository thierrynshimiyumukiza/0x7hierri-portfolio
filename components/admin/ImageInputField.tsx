"use client";

import MediaPickerField from "@/components/admin/MediaPickerField";

type ImageInputFieldProps = {
  name: string;
  label: string;
  bucket: string;
  defaultValue?: string;
  shape?: "rect" | "circle";
  hint?: string;
};

/**
 * Thin wrapper kept so every existing admin page picks up the upgraded picker
 * (drag and drop, media library, live preview) without changing its call sites.
 */
export default function ImageInputField({
  name,
  label,
  bucket,
  defaultValue = "",
  shape = "rect",
  hint,
}: ImageInputFieldProps) {
  return (
    <MediaPickerField
      name={name}
      label={label}
      bucket={bucket}
      defaultValue={defaultValue}
      shape={shape}
      hint={hint}
    />
  );
}
