"use client";

import { useResources } from "@/lib/resources-context";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UnitStatusProps {
  className?: string;
}

export function UnitStatus({ className }: UnitStatusProps) {
  const { mobileUnits, incidents, loading } = useResources();

  const getIncidentForUnit = (unitName: string) => {
    return incidents.find((incident) => 
      incident.mobileUnits?.includes(unitName)
    );
  };

  const availableCount = mobileUnits.filter(
    (unit) => !getIncidentForUnit(unit.name)
  ).length;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="h-full flex items-center justify-center p-4">
          <p className="text-muted-foreground">Loading units...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="h-full flex flex-col p-4">
        {mobileUnits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No units configured</p>
        ) : (
          <>
            {/* Summary */}
            <div className="text-sm mb-3">
              <span className="font-medium">{availableCount} Available</span>
            </div>

            {/* Unit Grid */}
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                {mobileUnits.map((unit) => {
                  const incident = getIncidentForUnit(unit.name);
                  const isBusy = !!incident;

                  const unitDisplay = (
                    <div className="flex items-center gap-2 text-sm cursor-default">
                      <span className="truncate">{unit.name}</span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                          isBusy ? "bg-red-500" : "bg-green-500"
                        }`}
                      />
                    </div>
                  );

                  if (isBusy) {
                    return (
                      <Tooltip key={unit.id}>
                        <TooltipTrigger asChild>
                          {unitDisplay}
                        </TooltipTrigger>
                        <TooltipContent>
                          On incident #{incident.incidentNumber}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <div key={unit.id}>{unitDisplay}</div>;
                })}
              </div>
            </TooltipProvider>
          </>
        )}
      </CardContent>
    </Card>
  );
}