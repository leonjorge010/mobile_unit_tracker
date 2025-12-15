// components/dashboard/incident-modal.tsx

"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useResources } from "@/lib/resources-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronRight, ChevronsUpDown, X } from "lucide-react";

interface Note {
  text: string;
  createdBy: string;
  createdByEmail: string;
  createdAt: Timestamp;
}

interface ActivityLogEntry {
  field: string;
  from: string;
  to: string;
  changedBy: string;
  changedByEmail: string;
  changedAt: Timestamp;
}

interface Incident {
  id: string;
  incidentNumber: string;
  reportingParty: string;
  partyOfConcern: string;
  location: string;
  mobileUnits: string[];
  incidentType: string;
  priority: string;
  description: string;
  status: string;
  createdByEmail: string;
  createdAt: { seconds: number } | null;
  notes?: Note[];
  activityLog?: ActivityLogEntry[];
}

interface IncidentModalProps {
  incident: Incident | null;
  open: boolean;
  onClose: () => void;
}

const partyOptions = [
  "Public Safety / Prevent Medical",
  "Site Ops",
];

const incidentTypes = [
  "Medical Emergency",
  "Security Threat",
  "Fire",
  "Disturbance",
  "Theft",
  "Suspicious Activity",
  "Lost Person",
  "Other",
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const statusOptions = [
  "Dispatched",
  "Responding",
  "On Scene",
  "Transporting",
  "Arrived",
  "Resolved",
];

export function IncidentModal({ incident, open, onClose }: IncidentModalProps) {
  const { user } = useAuth();
  const { mobileUnits, locations, incidents, loading: resourcesLoading } = useResources();
  const [formData, setFormData] = useState<Partial<Incident>>({});
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [unitsOpen, setUnitsOpen] = useState(false);

  // Get units that are available OR currently assigned to this incident
  const busyUnitNames = new Set(
    incidents
      .filter((inc) => inc.id !== incident?.id)
      .flatMap((inc) => inc.mobileUnits || [])
  );
  
  const availableUnits = mobileUnits.filter(
    (unit) => !busyUnitNames.has(unit.name) || (formData.mobileUnits || []).includes(unit.name)
  );

  useEffect(() => {
    if (incident) {
      setFormData({
        reportingParty: incident.reportingParty || "",
        partyOfConcern: incident.partyOfConcern || "",
        location: incident.location || "",
        mobileUnits: incident.mobileUnits || [],
        incidentType: incident.incidentType || "",
        priority: incident.priority || "",
        description: incident.description || "",
        status: incident.status || "",
      });
      setNewNote("");
    }
  }, [incident]);

  if (!incident) return null;

  const handleChange = (field: keyof Incident, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;

    try {
      await updateDoc(doc(db, "incidents", incident.id), {
        notes: arrayUnion({
          text: newNote.trim(),
          createdBy: user.uid,
          createdByEmail: user.email,
          createdAt: Timestamp.now(),
        }),
      });
      setNewNote("");
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const activityEntries: ActivityLogEntry[] = [];
      const fieldsToTrack: (keyof Incident)[] = [
        "reportingParty",
        "partyOfConcern",
        "location",
        "mobileUnits",
        "incidentType",
        "priority",
        "description",
        "status",
      ];

      fieldsToTrack.forEach((field) => {
        const oldValue = incident[field];
        const newValue = formData[field];
        
        let oldStr: string;
        let newStr: string;

        if (Array.isArray(oldValue)) {
          oldStr = oldValue.join(", ");
        } else if (typeof oldValue === "string") {
          oldStr = oldValue;
        } else {
          oldStr = "";
        }

        if (Array.isArray(newValue)) {
          newStr = newValue.join(", ");
        } else if (typeof newValue === "string") {
          newStr = newValue;
        } else {
          newStr = "";
        }
        
        if (oldStr !== newStr) {
          activityEntries.push({
            field,
            from: oldStr,
            to: newStr,
            changedBy: user.uid,
            changedByEmail: user.email || "",
            changedAt: Timestamp.now(),
          });
        }
      });

      const updateData: Record<string, unknown> = { ...formData };

      if (activityEntries.length > 0) {
        updateData.activityLog = arrayUnion(...activityEntries);
      }

      await updateDoc(doc(db, "incidents", incident.id), updateData);
      onClose();
    } catch (error) {
      console.error("Error saving incident:", error);
    } finally {
      setSaving(false);
    }
  };

  const formatTimestamp = (timestamp: Timestamp | { seconds: number }) => {
    const date = timestamp instanceof Timestamp
      ? timestamp.toDate()
      : new Date(timestamp.seconds * 1000);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFieldName = (field: string) => {
    return field
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Incident #{incident.incidentNumber || "—"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={formData.reportingParty}
              onValueChange={(value) => handleChange("reportingParty", value)}
            >
              <SelectTrigger className="w-full overflow-hidden">
                <SelectValue placeholder="Reporting Party" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                {partyOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formData.partyOfConcern}
              onValueChange={(value) => handleChange("partyOfConcern", value)}
            >
              <SelectTrigger className="w-full overflow-hidden">
                <SelectValue placeholder="Party of Concern" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                {partyOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={formData.location}
              onValueChange={(value) => handleChange("location", value)}
            >
              <SelectTrigger className="w-full overflow-hidden">
                <SelectValue
                  placeholder={resourcesLoading ? "Loading..." : "Location *"}
                  className="truncate"
                />
              </SelectTrigger>
              <SelectContent>
                {locations.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    No locations
                  </SelectItem>
                ) : (
                  locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.name}>
                      {loc.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Select
              value={formData.incidentType}
              onValueChange={(value) => handleChange("incidentType", value)}
            >
              <SelectTrigger className="w-full overflow-hidden">
                <SelectValue placeholder="Incident Type *" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                {incidentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
            >
              <SelectTrigger className="w-full overflow-hidden">
                <SelectValue placeholder="Status" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleChange("priority", value)}
            >
              <SelectTrigger className="w-full overflow-hidden">
                <SelectValue placeholder="Priority *" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Units Multi-Select */}
          <Popover open={unitsOpen} onOpenChange={setUnitsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={unitsOpen}
                className="w-full justify-between h-auto min-h-10"
              >
                <div className="flex flex-wrap gap-1">
                  {(formData.mobileUnits || []).length > 0 ? (
                    (formData.mobileUnits || []).map((unitName) => (
                      <Badge
                        key={unitName}
                        variant="secondary"
                        className="mr-1"
                      >
                        {unitName}
                        <span
                          role="button"
                          className="ml-1 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChange(
                              "mobileUnits",
                              (formData.mobileUnits || []).filter((u) => u !== unitName)
                            );
                          }}
                        >
                          <X className="h-3 w-3" />
                        </span>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Select units...</span>
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search units..." />
                <CommandList>
                  <CommandEmpty>No units found.</CommandEmpty>
                  <CommandGroup>
                    {availableUnits.map((unit) => {
                      const isSelected = (formData.mobileUnits || []).includes(unit.name);
                      return (
                        <CommandItem
                          key={unit.id}
                          value={unit.name}
                          onSelect={() => {
                            if (isSelected) {
                              handleChange(
                                "mobileUnits",
                                (formData.mobileUnits || []).filter((u) => u !== unit.name)
                              );
                            } else {
                              handleChange("mobileUnits", [
                                ...(formData.mobileUnits || []),
                                unit.name,
                              ]);
                            }
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              isSelected ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          {unit.name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Description */}
          <Textarea
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Description"
            className="resize-none"
            rows={3}
          />

          {/* Notes Section */}
          <div className="space-y-2">
            <div className="max-h-[120px] overflow-y-auto space-y-2 border rounded-md p-2">
              {incident.notes && incident.notes.length > 0 ? (
                [...incident.notes]
                  .sort((a, b) => a.createdAt.seconds - b.createdAt.seconds)
                  .map((note, index) => (
                    <div key={index} className="text-sm border-b pb-2 last:border-0">
                      <span className="text-muted-foreground">
                        {formatTimestamp(note.createdAt)} — {note.createdByEmail}:
                      </span>{" "}
                      {note.text}
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground">No notes yet</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              />
              <Button type="button" variant="outline" onClick={handleAddNote} disabled={!newNote.trim()}>
                Add
              </Button>
            </div>
          </div>

          {/* Activity Log */}
          <Collapsible open={activityOpen} onOpenChange={setActivityOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium">
              <ChevronRight
                className={`h-4 w-4 transition-transform ${activityOpen ? "rotate-90" : ""}`}
              />
              Activity Log
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 max-h-[150px] overflow-y-auto space-y-2 border rounded-md p-2">
                {incident.activityLog && incident.activityLog.length > 0 ? (
                  [...incident.activityLog]
                    .sort((a, b) => b.changedAt.seconds - a.changedAt.seconds)
                    .map((entry, index) => (
                      <div key={index} className="text-sm border-b pb-2 last:border-0">
                        <span className="text-muted-foreground">
                          {formatTimestamp(entry.changedAt)} — {entry.changedByEmail}:
                        </span>{" "}
                        Changed <span className="font-medium">{formatFieldName(entry.field)}</span> from{" "}
                        <span className="text-red-600">{entry.from || "(empty)"}</span> to{" "}
                        <span className="text-green-600">{entry.to || "(empty)"}</span>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}