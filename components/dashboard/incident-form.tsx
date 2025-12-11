"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
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
  comments: string;
  status: string;
}

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
  "Text",
  "Radio",
  "Phone Call",
  "In Person",
  "Email",
  "Other",
];

const statusOptions = [
  "AOR",
  "Responding",
  "On Scene",
  "Transporting",
  "Arrived",
  "Resolved",
];

export function IncidentForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<IncidentData>({
    reportingParty: "",
    partyOfConcern: "",
    location: "",
    mobileUnit: "",
    incidentType: "",
    reportedVia: "",
    comments: "",
    status: "AOR",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleChange = (field: keyof IncidentData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      await addDoc(collection(db, "incidents"), {
        ...formData,
        createdBy: user?.uid,
        createdByEmail: user?.email,
        createdAt: serverTimestamp(),
      });

      setStatus("nominal");
      setFormData({
        reportingParty: "",
        partyOfConcern: "",
        location: "",
        mobileUnit: "",
        incidentType: "",
        reportedVia: "",
        comments: "",
        status: "AOR",
      });
    } catch (error) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-[300px]">
      <CardContent className="p-4 h-full">
        <form onSubmit={handleSubmit} className="flex flex-col h-full gap-3">
          {/* Row 1 */}
          <div className="grid grid-cols-3 gap-3">
            <Input
              value={formData.reportingParty}
              onChange={(e) => handleChange("reportingParty", e.target.value)}
              placeholder="Reporting Party"
              required
            />
            <Input
              value={formData.partyOfConcern}
              onChange={(e) => handleChange("partyOfConcern", e.target.value)}
              placeholder="Party of Concern"
              required
            />
            <Input
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Location"
              required
            />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-3">
            <Input
              value={formData.mobileUnit}
              onChange={(e) => handleChange("mobileUnit", e.target.value)}
              placeholder="Mobile Unit"
            />
            <Select
              value={formData.incidentType}
              onValueChange={(value) => handleChange("incidentType", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Incident Type" />
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
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Reported Via" />
              </SelectTrigger>
              <SelectContent>
                {reportedViaOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
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

          {/* Row 3 - Comments and Submit */}
          <div className="flex gap-3 flex-1">
            <Textarea
              value={formData.comments}
              onChange={(e) => handleChange("comments", e.target.value)}
              placeholder="Comments..."
              className="flex-1 resize-none"
            />
            <div className="flex flex-col gap-1 w-20">
              <Button type="submit" disabled={loading} className="flex-[3]">
                {loading ? "..." : "Submit"}
              </Button>
              <div
                className={`flex-1 flex items-center justify-center text-xs font-medium rounded-md ${
                  status === "nominal"
                    ? "bg-green-100 text-green-600"
                    : status === "error"
                    ? "bg-red-100 text-red-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {status === "nominal" ? "Nominal" : status === "error" ? "Error" : "—"}
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}