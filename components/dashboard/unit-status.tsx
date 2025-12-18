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

  const tabs: { key: TabType; label: string; shortLabel: string }[] = [
    { key: "zones", label: "Zones", shortLabel: "Zones" },
    { key: "carts", label: "Carts", shortLabel: "Carts" },
    { key: "management", label: "Management", shortLabel: "Mgmt" },
  ];

  return (
    <Card className={className}>
      <CardContent className="h-full p-3 sm:p-4 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-2 sm:mb-2">
          {/* Mobile: pill-style tabs */}
          <div className="flex sm:hidden gap-1 bg-muted/50 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors min-h-[36px] ${
                  activeTab === tab.key
                    ? "bg-background font-semibold shadow-sm"
                    : "text-muted-foreground active:bg-background/50"
                }`}
              >
                {tab.shortLabel}
              </button>
            ))}
          </div>

          {/* Desktop: original text tabs */}
          <div className="hidden sm:flex gap-3 text-sm">
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

          {/* Mobile: styled available button */}
          <button
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
            className={`sm:hidden text-sm px-3 py-1.5 rounded-md min-h-[36px] transition-colors ${
              showAvailableOnly
                ? "bg-green-600/10 text-green-600 font-medium"
                : "text-muted-foreground active:bg-muted"
            }`}
          >
            Available
          </button>

          {/* Desktop: original available button */}
          <button
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
            className={`hidden sm:block text-sm ${
              showAvailableOnly
                ? "underline decoration-green-600 underline-offset-2"
                : "text-muted-foreground"
            }`}
          >
            Available
          </button>
        </div>

        {getActiveUnits().length === 0 ? (
          <p className="text-sm text-muted-foreground sm:text-left text-center py-8 sm:py-0">
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

            {/* Mobile: Card layout */}
            <div className="sm:hidden space-y-2">
              {getActiveUnits().map((unit) => {
                const incident = getIncidentForUnit(unit.name);
                const isAvailable = !incident;
                const status = isAvailable ? "Available" : incident?.status || "Assigned";

                return (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between py-3 px-3 bg-muted/30 rounded-lg"
                  >
                    <span className="font-medium text-sm truncate flex-shrink min-w-0">
                      {unit.name}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span
                        className={`px-2.5 py-1 rounded-full border text-xs font-medium ${
                          isAvailable
                            ? "border-green-600 text-green-600 bg-green-600/5"
                            : "border-red-600 text-red-600 bg-red-600/5"
                        }`}
                      >
                        {status}
                      </span>
                      {incident && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          #{incident.incidentNumber}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: Original table layout */}
            <table className="hidden sm:table w-full text-sm table-fixed">
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