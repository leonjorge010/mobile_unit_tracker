"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight } from "lucide-react";

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
  mobileUnit: string;
  incidentType: string;
  reportedVia: string;
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

const reportedViaOptions = [
  "Radio",
  "In Person",
  "Text",
  "Phone Call",
  "Email",
  "Other",
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const statusOptions = [
  "AOR",
  "Responding",
  "On Scene",
  "Transporting",
  "Arrived",
  "Resolved",
];

export function IncidentModal({ incident, open, onClose }: IncidentModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<Incident>>({});
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  useEffect(() => {
    if (incident) {
      setFormData({
        reportingParty: incident.reportingParty || "",
        partyOfConcern: incident.partyOfConcern || "",
        location: incident.location || "",
        mobileUnit: incident.mobileUnit || "",
        incidentType: incident.incidentType || "",
        reportedVia: incident.reportedVia || "",
        priority: incident.priority || "",
        description: incident.description || "",
        status: incident.status || "",
      });
      setNewNote("");
    }
  }, [incident]);

  if (!incident) return null;

  const handleChange = (field: keyof Incident, value: string) => {
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
        "mobileUnit",
        "incidentType",
        "reportedVia",
        "priority",
        "description",
        "status",
      ];

      fieldsToTrack.forEach((field) => {
        const oldValue = incident[field] || "";
        const newValue = formData[field] || "";
        if (oldValue !== newValue) {
          activityEntries.push({
            field,
            from: oldValue as string,
            to: newValue as string,
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
            <Input
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Location *"
              className="truncate"
            />
            <Input
              value={formData.mobileUnit}
              onChange={(e) => handleChange("mobileUnit", e.target.value)}
              placeholder="Mobile Unit"
              className="truncate"
            />
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-3">
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
            <Select
              value={formData.reportedVia}
              onValueChange={(value) => handleChange("reportedVia", value)}
            >
              <SelectTrigger className="w-full overflow-hidden">
                <SelectValue placeholder="Reported Via" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                {reportedViaOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

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
            <h4 className="text-sm font-medium">Notes</h4>
            <div className="max-h-[150px] overflow-y-auto space-y-2 border rounded-md p-2">
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