"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface Incident {
  id: string;
  reportingParty: string;
  partyOfConcern: string;
  location: string;
  mobileUnit: string;
  incidentType: string;
  reportedVia: string;
  comments: string;
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "AOR":
      return "bg-red-100 text-red-800 border-red-300";
    case "Responding":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "On Scene":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "Transporting":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "Arrived":
      return "bg-purple-100 text-purple-800 border-purple-300";
    case "Resolved":
      return "bg-green-100 text-green-800 border-green-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

export function IncidentList() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("active");

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
        <CardHeader className="py-3">
          <CardTitle>Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle>Incidents ({filteredIncidents.length})</CardTitle>
          <ToggleGroup
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
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead className="w-[80px]">Time</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead>Party of Concern</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-[80px]">Unit</TableHead>
                  <TableHead className="max-w-[200px]">Description</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.map((incident, index) => (
                  <TableRow key={incident.id}>
                    <TableCell className="font-medium">
                      {filteredIncidents.length - index}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatTime(incident.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {incident.incidentType}
                    </TableCell>
                    <TableCell>{incident.partyOfConcern}</TableCell>
                    <TableCell>{incident.location}</TableCell>
                    <TableCell>{incident.mobileUnit || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={incident.comments}>
                      {incident.comments || "—"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={incident.status}
                        onValueChange={(value) => handleStatusChange(incident.id, value)}
                      >
                        <SelectTrigger className={`h-8 text-xs ${getStatusColor(incident.status)}`}>
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