"use client";
import React from "react";
import { LampContainer } from "@/components/ui/lamp";

export function LampDemo() {
  return (
    <LampContainer className="mt-0 pt-0">
      {/* Empty div to satisfy the children prop requirement */}
      <div></div>
    </LampContainer>
  );
} 