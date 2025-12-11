"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Paintbrush } from "lucide-react";

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
}

type FilterType = "active" | "resolved" | "all";

const statusOptions = [
  "AOR",
  "Responding",
  "On Scene",
  "Transporting",
  "Arrived",
  "Resolved",
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "AOR":
      return "bg-red-200 border-red-500";
    case "Responding":
      return "bg-orange-200 border-orange-500";
    case "On Scene":
      return "bg-yellow-200 border-yellow-500";
    case "Transporting":
      return "bg-blue-200 border-blue-500";
    case "Arrived":
      return "bg-purple-200 border-purple-500";
    case "Resolved":
      return "bg-green-200 border-green-500";
    default:
      return "bg-gray-200 border-gray-500";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "critical":
      return "border-orange-500";
    case "high":
      return "border-red-500";
    case "medium":
      return "border-yellow-500";
    case "low":
      return "border-green-500";
    default:
      return "border-gray-500";
  }
};

const getRowStatusColor = (status: string) => {
  switch (status) {
    case "AOR":
      return "bg-red-100";
    case "Responding":
      return "bg-orange-100";
    case "On Scene":
      return "bg-yellow-100";
    case "Transporting":
      return "bg-blue-100";
    case "Arrived":
      return "bg-purple-100";
    case "Resolved":
      return "bg-green-100";
    default:
      return "";
  }
};

export function IncidentList() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("active");
  const [showStatusColors, setShowStatusColors] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "incidents"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incidentData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Incident[];
      setIncidents(incidentData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (incidentId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "incidents", incidentId), {
        status: newStatus,
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handlePriorityChange = async (incidentId: string, newPriority: string) => {
    try {
      await updateDoc(doc(db, "incidents", incidentId), {
        priority: newPriority,
      });
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };

  const formatTime = (timestamp: { seconds: number } | null) => {
    if (!timestamp) return "—";
    return new Date(timestamp.seconds * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredIncidents = incidents.filter((incident) => {
    if (filter === "active") return incident.status !== "Resolved";
    if (filter === "resolved") return incident.status === "Resolved";
    return true;
  });

  const activeCount = incidents.filter((i) => i.status !== "Resolved").length;
  const resolvedCount = incidents.filter((i) => i.status === "Resolved").length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <p className="text-muted-foreground">Loading...</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button
            variant={showStatusColors ? "default" : "outline"}
            size="sm"
            onClick={() => setShowStatusColors(!showStatusColors)}
          >
            <Paintbrush className="h-4 w-4 mr-1" />
          </Button>
          <ToggleGroup
            className="border"
            type="single"
            value={filter}
            onValueChange={(value) => value && setFilter(value as FilterType)}
            size="sm"
          >
            <ToggleGroupItem value="active" aria-label="Show active">
              Active ({activeCount})
            </ToggleGroupItem>
            <ToggleGroupItem value="resolved" aria-label="Show resolved">
              Resolved ({resolvedCount})
            </ToggleGroupItem>
            <ToggleGroupItem value="all" aria-label="Show all">
              All ({incidents.length})
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredIncidents.length === 0 ? (
          <p className="text-muted-foreground p-4">No incidents found.</p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Incident #</TableHead>
                  <TableHead className="w-[80px]">Time</TableHead>
                  <TableHead className="w-[100px]">Priority</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead>Party of Concern</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-[80px]">Unit</TableHead>
                  <TableHead className="max-w-[150px]">Description</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.map((incident) => (
                  <TableRow
                    key={incident.id}
                    className={showStatusColors ? getRowStatusColor(incident.status) : ""}
                  >
                    <TableCell className="font-mono font-medium">
                      {incident.incidentNumber || "—"}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatTime(incident.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={incident.priority}
                        onValueChange={(value) => handlePriorityChange(incident.id, value)}
                      >
                        <SelectTrigger className={`h-8 ${getPriorityColor(incident.priority)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {incident.incidentType}
                    </TableCell>
                    <TableCell>{incident.partyOfConcern}</TableCell>
                    <TableCell>{incident.location}</TableCell>
                    <TableCell>{incident.mobileUnit || "—"}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={incident.description}>
                      {incident.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={incident.status}
                        onValueChange={(value) => handleStatusChange(incident.id, value)}
                      >
                        <SelectTrigger className={`h-8 ${getStatusColor(incident.status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}