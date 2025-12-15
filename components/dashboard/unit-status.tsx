"use client";

import { useState } from "react";
import { useResources } from "@/lib/resources-context";
import { Card, CardContent } from "@/components/ui/card";

interface UnitStatusProps {
  className?: string;
}

type TabType = "zones" | "carts" | "management";

export function UnitStatus({ className }: UnitStatusProps) {
  const { mobileUnits, incidents, loading } = useResources();
  const [activeTab, setActiveTab] = useState<TabType>("zones");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const getIncidentForUnit = (unitName: string) => {
    return incidents.find((incident) =>
      incident.mobileUnits?.includes(unitName)
    );
  };

  const categorizeUnits = () => {
    const zones: typeof mobileUnits = [];
    const carts: typeof mobileUnits = [];
    const management: typeof mobileUnits = [];

    mobileUnits.forEach((unit) => {
      const name = unit.name.toLowerCase();
      if (name.startsWith("zone") || name.startsWith("mobile")) {
        zones.push(unit);
      } else if (name.startsWith("rescue") || name.startsWith("cart")) {
        carts.push(unit);
      } else if (
        name.startsWith("ops") ||
        name.startsWith("safety") ||
        name.startsWith("vip")
      ) {
        management.push(unit);
      }
    });

    return { zones, carts, management };
  };

  const { zones, carts, management } = categorizeUnits();

  const getActiveUnits = () => {
    let units;
    switch (activeTab) {
      case "zones":
        units = zones;
        break;
      case "carts":
        units = carts;
        break;
      case "management":
        units = management;
        break;
    }

    if (showAvailableOnly) {
      return units.filter((unit) => !getIncidentForUnit(unit.name));
    }
    return units;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="h-full flex items-center justify-center p-4">
          <p className="text-muted-foreground">Loading units...</p>
        </CardContent>
      </Card>
    );
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: "zones", label: "Zones" },
    { key: "carts", label: "Carts" },
    { key: "management", label: "Management" },
  ];

  return (
    <Card className={className}>
      <CardContent className="h-full p-4 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-3 text-sm">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={activeTab === tab.key ? "font-bold" : "text-muted-foreground"}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
            className={`text-sm ${
              showAvailableOnly
                ? "underline decoration-green-600 underline-offset-2"
                : "text-muted-foreground"
            }`}
          >
            Available
          </button>
        </div>

        {getActiveUnits().length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {showAvailableOnly ? "No available units" : "No units in this category"}
          </p>
        ) : (
          <div
            className="flex-1 overflow-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[35%]" />
                <col className="w-[40%]" />
                <col className="w-[25%]" />
              </colgroup>
              <tbody>
                {getActiveUnits().map((unit) => {
                  const incident = getIncidentForUnit(unit.name);
                  const isAvailable = !incident;
                  const status = isAvailable ? "Available" : incident?.status || "Assigned";

                  return (
                    <tr key={unit.id} className="border-b last:border-0">
                      <td className="py-2 text-center truncate">{unit.name}</td>
                      <td className="py-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full border text-xs ${
                            isAvailable
                              ? "border-green-600"
                              : "border-red-600"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-2 text-center text-muted-foreground truncate">
                        {incident ? `#${incident.incidentNumber}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}