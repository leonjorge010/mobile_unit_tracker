// app/admin/events/[eventId]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useResources } from "@/lib/resources-context";
import { useEvents } from "@/lib/events-context";
import { MobileUnit, Location } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Trash2, Plus } from "lucide-react";

type Tab = "units" | "locations";

const unitStatusOptions = [
  { value: "available", label: "Available" },
  { value: "dispatched", label: "Dispatched" },
  { value: "out-of-service", label: "Out of Service" },
];

const locationCategoryOptions = [
  { value: "medical", label: "Medical" },
  { value: "security", label: "Security" },
  { value: "stage", label: "Stage" },
  { value: "gate", label: "Gate" },
  { value: "general", label: "General" },
];

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const { selectEvent } = useEvents();
  const { mobileUnits, locations, loading } = useResources();

  const [eventName, setEventName] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("units");

  // Unit form state
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitStatus, setNewUnitStatus] = useState<MobileUnit["status"]>("available");
  const [addingUnit, setAddingUnit] = useState(false);

  // Location form state
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationLat, setNewLocationLat] = useState("");
  const [newLocationLng, setNewLocationLng] = useState("");
  const [newLocationCategory, setNewLocationCategory] = useState<string>("general");
  const [addingLocation, setAddingLocation] = useState(false);

  // Set selected event so resources-context loads the right data
  useEffect(() => {
    selectEvent(eventId);
  }, [eventId, selectEvent]);

  // Fetch event name
  useEffect(() => {
    const fetchEvent = async () => {
      const eventDoc = await getDoc(doc(db, "events", eventId));
      if (eventDoc.exists()) {
        setEventName(eventDoc.data().name);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) return;
    setAddingUnit(true);
    try {
      await addDoc(collection(db, "events", eventId, "mobileUnits"), {
        name: newUnitName.trim(),
        status: newUnitStatus,
        createdAt: serverTimestamp(),
      });
      setNewUnitName("");
      setNewUnitStatus("available");
    } catch (error) {
      console.error("Error adding unit:", error);
    } finally {
      setAddingUnit(false);
    }
  };

  const handleUpdateUnitStatus = async (unitId: string, status: MobileUnit["status"]) => {
    try {
      await updateDoc(doc(db, "events", eventId, "mobileUnits", unitId), { status });
    } catch (error) {
      console.error("Error updating unit:", error);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    try {
      await deleteDoc(doc(db, "events", eventId, "mobileUnits", unitId));
    } catch (error) {
      console.error("Error deleting unit:", error);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim() || !newLocationLat || !newLocationLng) return;
    setAddingLocation(true);
    try {
      await addDoc(collection(db, "events", eventId, "locations"), {
        name: newLocationName.trim(),
        coordinates: {
          lat: parseFloat(newLocationLat),
          lng: parseFloat(newLocationLng),
        },
        category: newLocationCategory,
        createdAt: serverTimestamp(),
      });
      setNewLocationName("");
      setNewLocationLat("");
      setNewLocationLng("");
      setNewLocationCategory("general");
    } catch (error) {
      console.error("Error adding location:", error);
    } finally {
      setAddingLocation(false);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    try {
      await deleteDoc(doc(db, "events", eventId, "locations", locationId));
    } catch (error) {
      console.error("Error deleting location:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{eventName || "Loading..."}</h1>
          <p className="text-muted-foreground">Manage units and locations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("units")}
          className={`px-4 py-2 -mb-px ${
            activeTab === "units"
              ? "border-b-2 border-primary font-medium"
              : "text-muted-foreground"
          }`}
        >
          Mobile Units ({mobileUnits.length})
        </button>
        <button
          onClick={() => setActiveTab("locations")}
          className={`px-4 py-2 -mb-px ${
            activeTab === "locations"
              ? "border-b-2 border-primary font-medium"
              : "text-muted-foreground"
          }`}
        >
          Locations ({locations.length})
        </button>
      </div>

      {/* Mobile Units Tab */}
      {activeTab === "units" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Mobile Units</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="Unit name (e.g., Medic 1)"
                disabled={addingUnit}
                className="flex-1"
              />
              <Select
                value={newUnitStatus}
                onValueChange={(value) => setNewUnitStatus(value as MobileUnit["status"])}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddUnit} disabled={addingUnit || !newUnitName.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>

            <div className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : mobileUnits.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mobile units yet</p>
              ) : (
                mobileUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                  >
                    <span className="font-medium">{unit.name}</span>
                    <div className="flex items-center gap-2">
                      <Select
                        value={unit.status}
                        onValueChange={(value) =>
                          handleUpdateUnitStatus(unit.id, value as MobileUnit["status"])
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {unitStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUnit(unit.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locations Tab */}
      {activeTab === "locations" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Locations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="Location name"
                disabled={addingLocation}
                className="flex-1"
              />
              <Input
                value={newLocationLat}
                onChange={(e) => setNewLocationLat(e.target.value)}
                placeholder="Latitude"
                disabled={addingLocation}
                className="w-[100px]"
                type="number"
                step="any"
              />
              <Input
                value={newLocationLng}
                onChange={(e) => setNewLocationLng(e.target.value)}
                placeholder="Longitude"
                disabled={addingLocation}
                className="w-[100px]"
                type="number"
                step="any"
              />
              <Select
                value={newLocationCategory}
                onValueChange={setNewLocationCategory}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locationCategoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddLocation}
                disabled={addingLocation || !newLocationName.trim() || !newLocationLat || !newLocationLng}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>

            <div className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : locations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No locations yet</p>
              ) : (
                locations.map((location) => (
                  <div
                    key={location.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                  >
                    <div>
                      <span className="font-medium">{location.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {location.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {location.coordinates.lat.toFixed(5)}, {location.coordinates.lng.toFixed(5)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLocation(location.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}