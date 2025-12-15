"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useEvents } from "@/lib/events-context";
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
import { Card, CardContent } from "@/components/ui/card";

interface IncidentData {
  reportingParty: string;
  partyOfConcern: string;
  location: string;
  mobileUnit: string;
  incidentType: string;
  reportedVia: string;
  priority: string;
  description: string;
  status: string;
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
  "Dispatched",
  "Responding",
  "On Scene",
  "Transporting",
  "Arrived",
  "Resolved",
];

const initialFormData: IncidentData = {
  reportingParty: "",
  partyOfConcern: "",
  location: "",
  mobileUnit: "",
  incidentType: "",
  reportedVia: "",
  priority: "",
  description: "",
  status: "",
};

const generateIncidentNumber = async (): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

  const q = query(
    collection(db, "incidents"),
    where("createdAt", ">=", yearStart),
    where("createdAt", "<", yearEnd),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  const snapshot = await getDocs(q);

  let sequence = 1;
  if (!snapshot.empty) {
    const lastIncident = snapshot.docs[0].data();
    const lastNumber = lastIncident.incidentNumber;
    if (lastNumber && lastNumber.startsWith(year)) {
      sequence = parseInt(lastNumber.slice(2)) + 1;
    }
  }

  return `${year}${sequence.toString().padStart(4, "0")}`;
};

export function IncidentForm() {
  const { user } = useAuth();
  const { selectedEventId } = useEvents();
  const [formData, setFormData] = useState<IncidentData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleChange = (field: keyof IncidentData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    setFormData(initialFormData);
    setStatus("");
  };

  const isFormValid = () => {
    return (
      formData.location.trim() &&
      formData.incidentType &&
      formData.priority &&
      selectedEventId
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setStatus("error");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const incidentNumber = await generateIncidentNumber();

      await addDoc(collection(db, "incidents"), {
        ...formData,
        incidentNumber,
        eventId: selectedEventId,
        createdBy: user?.uid,
        createdByEmail: user?.email,
        createdAt: serverTimestamp(),
      });

      setStatus("nominal");
      setFormData(initialFormData);
    } catch (error) {
      setStatus("error");
      console.error("Error creating incident:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-[300px]">
      <CardContent className="p-4 h-full">
        <form onSubmit={handleSubmit} className="flex flex-col h-full gap-3">
          {/* Row 1 */}
          <div className="grid grid-cols-4 gap-3">
            <Select
              value={formData.reportingParty}
              onValueChange={(value) => handleChange("reportingParty", value)}
            >
              <SelectTrigger className="w-full overflow-hidden">
                <SelectValue placeholder="Reporting Department" className="truncate" />
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
                <SelectValue placeholder="Division" className="truncate" />
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
                <SelectValue placeholder="Source" className="truncate" />
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

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-2">
            <Input
              value={formData.mobileUnit}
              onChange={(e) => handleChange("mobileUnit", e.target.value)}
              placeholder="Mobile Unit"
              className="truncate"
            />
            <Input
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Location *"
              className="truncate"
            />
            <Select
              value={formData.priority}
              onValueChange={(value) => handleChange("priority", value)}
            >
              <SelectTrigger
                className={`w-full overflow-hidden ${
                  formData.priority === "critical"
                    ? "border-orange-500"
                    : formData.priority === "high"
                    ? "border-red-500"
                    : formData.priority === "medium"
                    ? "border-yellow-500"
                    : formData.priority === "low"
                    ? "border-green-500"
                    : ""
                }`}
              >
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

          {/* Row 3 - Description and Buttons */}
          <div className="flex gap-3 flex-1">
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Description"
              className="flex-1 resize-none"
            />
            <div className="flex flex-col gap-1 w-20">
              <Button type="submit" disabled={loading || !isFormValid()} className="flex-[2]">
                {loading ? "..." : "Submit"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="flex-1"
              >
                Clear
              </Button>
              <div
                className={`flex-1 flex items-center justify-center text-xs font-medium rounded-md ${
                  !selectedEventId
                    ? "bg-yellow-100 text-yellow-600"
                    : status === "nominal"
                    ? "bg-green-100 text-green-600"
                    : status === "error"
                    ? "bg-red-100 text-red-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {!selectedEventId ? "No Event" : status === "nominal" ? "Nominal" : status === "error" ? "Error" : "—"}
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}