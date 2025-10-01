"use client";
import { useMemo, useState, useCallback } from "react";
import { normalize } from "@/lib/normalize";

export default function useDonorState(donationsByDonor) {
  const [donorFilter, setDonorFilter] = useState("");
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isDonorSheetOpen, setIsDonorSheetOpen] = useState(false);

  const openDonorSheet = useCallback((donor) => {
    setSelectedDonor(donor || null);
    setIsDonorSheetOpen(true);
  }, []);

  const closeDonorSheet = useCallback(() => setIsDonorSheetOpen(false), []);

  const selectedDonorDonations = useMemo(() => {
    if (!selectedDonor) return [];
    return donationsByDonor.get(normalize(selectedDonor.name)) || [];
  }, [selectedDonor, donationsByDonor]);

  return {
    donorFilter, setDonorFilter,
    selectedDonor, openDonorSheet, closeDonorSheet, isDonorSheetOpen,
    selectedDonorDonations,
  };
}
