"use client";
import { Spinner } from "@ryy1109/web-components";
export default function Loading() {
  return (
    <Spinner
      label="Loading your workspace"
      ariaLabel="Loading your workspace"
    />
  );
}
