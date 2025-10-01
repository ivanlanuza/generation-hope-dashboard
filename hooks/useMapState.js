"use client";
import { useState, useCallback } from "react";

export default function useMapState() {
  const [mapCenter, setMapCenter] = useState([14.5995, 120.9842]);
  const [mapZoom, setMapZoom] = useState(6);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isSchoolSheetOpen, setIsSchoolSheetOpen] = useState(false);

  const openSchoolSheet = useCallback((school) => {
    setSelectedSchool(school || null);
    setIsSchoolSheetOpen(true);
  }, []);

  const closeSchoolSheet = useCallback(() => setIsSchoolSheetOpen(false), []);

  return {
    mapCenter, setMapCenter,
    mapZoom, setMapZoom,
    selectedSchool, setSelectedSchool,
    isSchoolSheetOpen, openSchoolSheet, closeSchoolSheet,
  };
}
