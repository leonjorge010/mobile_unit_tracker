"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useEvents } from "@/lib/events-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Paintbrush, ExternalLink } from "lucide-react";
import { IncidentModal } from "./incident-modal";

interface Note {
  text: string;
  createdBy: string;
  createdByEmail: string;
  createdAt: Timestamp;
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
  eventId?: string;
}

type FilterType = "active" | "resolved" | "all";

const statusOptions = [
  "Dispatched",
  "Responding",
  "On Scene",
  "Transporting",
  "Arrived",
  "Resolved",
];

const statusOrder: Record<string, number> = {
  "Dispatched": 0,
  "Responding": 1,
  "On Scene": 2,
  "Transporting": 3,
  "Arrived": 4,
  "Resolved": 5,
};

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Dispatched":
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
      return "text-orange-600";
    case "high":
      return "text-red-600";
    case "medium":
      return "text-yellow-600";
    case "low":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
};

const getRowStatusColor = (status: string) => {
  switch (status) {
    case "Dispatched":
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
  const { user } = useAuth();
  const { selectedEventId } = useEvents();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("active");
  const [showStatusColors, setShowStatusColors] = useState(false);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || null;
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!selectedEventId) {
      setIncidents([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "incidents"),
      where("eventId", "==", selectedEventId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incidentData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Incident[];
      setIncidents(incidentData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedEventId]);

  const handleOpenModal = (incident: Incident) => {
    setSelectedIncidentId(incident.id);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedIncidentId(null);
  };

  const handleStatusChange = async (incidentId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "incidents", incidentId), {
        status: newStatus,
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleAddNote = async (incidentId: string) => {
    const noteText = noteInputs[incidentId]?.trim();
    if (!noteText || !user) return;

    try {
      await updateDoc(doc(db, "incidents", incidentId), {
        notes: arrayUnion({
          text: noteText,
          createdBy: user.uid,
          createdByEmail: user.email,
          createdAt: Timestamp.now(),
        }),
      });
      setNoteInputs((prev) => ({ ...prev, [incidentId]: "" }));
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const formatTime = (timestamp: { seconds: number } | null) => {
    if (!timestamp) return "—";
    return new Date(timestamp.seconds * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredIncidents = incidents
    .filter((incident) => {
      if (filter === "active") return incident.status !== "Resolved";
      if (filter === "resolved") return incident.status === "Resolved";
      return true;
    })
    .sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  const activeCount = incidents.filter((i) => i.status !== "Resolved").length;
  const resolvedCount = incidents.filter((i) => i.status === "Resolved").length;

  if (!selectedEventId) {
    return (
      <Card>
        <CardHeader>
          <p className="text-muted-foreground">Please select an event to view incidents.</p>
        </CardHeader>
      </Card>
    );
  }

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
    <>
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
        <CardContent>
          {filteredIncidents.length === 0 ? (
            <p className="text-muted-foreground p-4">No incidents found.</p>
          ) : (
            <div className="max-h-[340px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[80px]">Incident #</TableHead>
                    <TableHead className="w-[80px]">Time</TableHead>
                    <TableHead className="w-[75px]">Priority</TableHead>
                    <TableHead className="w-[60px]">Type</TableHead>
                    <TableHead className="w-[120px]">Party of Concern</TableHead>
                    <TableHead className="w-[60px]">Location</TableHead>
                    <TableHead className="w-[80px]">Unit</TableHead>
                    <TableHead className="w-[270px]">Description</TableHead>
                    <TableHead className="w-[225px]">Notes</TableHead>
                    <TableHead className="w-[50px]">Details</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.map((incident) => (
                    <TableRow
                      key={incident.id}
                      className={showStatusColors ? getRowStatusColor(incident.status) : ""}
                    >
                      <TableCell className="font-mono font-medium truncate">
                        {incident.incidentNumber || "—"}
                      </TableCell>
                      <TableCell className="font-mono truncate">
                        {formatTime(incident.createdAt)}
                      </TableCell>
                      <TableCell className={`font-medium truncate ${getPriorityColor(incident.priority)}`}>
                        {priorityLabels[incident.priority] || "—"}
                      </TableCell>
                      <TableCell className="truncate max-w-[60px]" title={incident.incidentType}>
                        {incident.incidentType}
                      </TableCell>
                      <TableCell className="truncate max-w-[120px]" title={incident.partyOfConcern}>
                        {incident.partyOfConcern}
                      </TableCell>
                      <TableCell className="truncate max-w-[60px]" title={incident.location}>
                        {incident.location}
                      </TableCell>
                      <TableCell className="truncate max-w-[80px]" title={incident.mobileUnit}>
                        {incident.mobileUnit || "—"}
                      </TableCell>
                      <TableCell className="truncate max-w-[270px]" title={incident.description}>
                        {incident.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-xs truncate"
                          placeholder="Add note..."
                          value={noteInputs[incident.id] || ""}
                          onChange={(e) =>
                            setNoteInputs((prev) => ({ ...prev, [incident.id]: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === "Enter" && handleAddNote(incident.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(incident)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={incident.status}
                          onValueChange={(value) => handleStatusChange(incident.id, value)}
                        >
                          <SelectTrigger className={`h-8 w-full overflow-hidden ${getStatusColor(incident.status)}`}>
                            <SelectValue className="truncate" />
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

      <IncidentModal
        incident={selectedIncident}
        open={modalOpen}
        onClose={handleModalClose}
      />
    </>
  );
}