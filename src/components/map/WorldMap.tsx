'use client';
import { useEffect } from "react";
import type { University } from "@/types";
import { scoreColor } from "@/lib/utils";

export function WorldMap({ universities }: { universities: University[] }) {
  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    (async () => {
      const L = await import("leaflet");
      const el = document.getElementById("gucair-map");
      if (!el || (el as HTMLElement).dataset.init === "1") return;
      (el as HTMLElement).dataset.init = "1";
      map = L.map("gucair-map").setView([20, 0], 2);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      universities.forEach((u) => {
        if (typeof u.lat !== "number" || typeof u.lng !== "number") return;
        const color = scoreColor(u.score);
        const marker = L!.circleMarker([u.lat, u.lng], {
          radius: 8,
          color,
          fillColor: color,
          fillOpacity: 0.8,
        });
        const scoreText = u.score == null ? "Awaiting first assessment" : `Score: ${u.score}`;
        marker.bindPopup(
          `<strong>${u.name}</strong><br/>${u.country} — ${scoreText}<br/><a href="/universities/${u.id}">View profile</a>`
        );
        marker.addTo(map!);
      });
    })();
    return () => {
      map?.remove();
      const el = document.getElementById("gucair-map");
      if (el) delete (el as HTMLElement).dataset.init;
    };
  }, [universities]);

  return (
    <div
      id="gucair-map"
      className="h-[420px] w-full rounded-xl border border-slate-200"
      role="application"
      aria-label="World map of member universities"
    />
  );
}

export function ScoreLegend() {
  const items = [
    { label: "Not assessed", color: "#94a3b8" },
    { label: "< 40 Emerging", color: "#ef4444" },
    { label: "40–70 Developing", color: "#eab308" },
    { label: "70–90 Advanced", color: "#22c55e" },
    { label: "90+ Leading", color: "#2563eb" },
  ];
  return (
    <div className="flex flex-wrap gap-3 text-xs" aria-label="Map legend">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
