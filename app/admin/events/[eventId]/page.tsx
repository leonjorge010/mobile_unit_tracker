"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import { MobileUnit } from "@/lib/types";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Truck, MapPin } from "lucide-react";

const unitStatusOptions = [
  { value: "available", label: "Available", color: "bg-green-500" },
  { value: "dispatched", label: "Dispatched", color: "bg-yellow-500" },
  { value: "out-of-service", label: "Out of Service", color: "bg-red-500" },
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
  const eventId = params.eventId as string;

  const { selectEvent } = useEvents();
  const { mobileUnits, locations, loading } = useResources();

  const [eventName, setEventName] = useState("");

  // Unit form state
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitStatus, setNewUnitStatus] = useState<MobileUnit["status"]>("available");
  const [addingUnit, setAddingUnit] = useState(false);

  // Location form state
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationLat, setNewLocationLat] = useState("");
  const [newLocationLng, setNewLocationLng] = useState("");
  const [newLocationCategory, setNewLocationCategory] = useState("general");
  const [addingLocation, setAddingLocation] = useState(false);

  useEffect(() => {
    selectEvent(eventId);
  }, [eventId, selectEvent]);

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

  const getStatusBadge = (status: string) => {
    const option = unitStatusOptions.find((o) => o.value === status);
    return (
      <Badge variant="outline" className="gap-1.5">
        <span className={`h-2 w-2 rounded-full ${option?.color || "bg-gray-500"}`} />
        {option?.label || status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader breadcrumbs={[{ label: eventName || "Event" }]} />

      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{eventName || "Loading..."}</h1>
          <p className="text-muted-foreground mt-1">Configure mobile units and locations for this event</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="units" className="space-y-6">
          <TabsList>
            <TabsTrigger value="units" className="gap-2">
              <Truck className="h-4 w-4" />
              Mobile Units ({mobileUnits.length})
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2">
              <MapPin className="h-4 w-4" />
              Locations ({locations.length})
            </TabsTrigger>
          </TabsList>

          {/* Mobile Units Tab */}
          <TabsContent value="units">
            <Card>
              <CardHeader>
                <CardTitle>Mobile Units</CardTitle>
                <CardDescription>Add and manage mobile units for this event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Unit Form */}
                <div className="flex gap-2 p-4 bg-muted/50 rounded-lg">
                  <Input
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    placeholder="Unit name (e.g., Medic 1)"
                    disabled={addingUnit}
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleAddUnit()}
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
                    <Plus className="h-4 w-4 mr-1" />
                    Add Unit
                  </Button>
                </div>

                {/* Units List */}
                {loading ? (
                  <p className="text-sm text-muted-foreground py-4">Loading...</p>
                ) : mobileUnits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No mobile units yet. Add your first unit above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mobileUnits.map((unit) => (
                      <div
                        key={unit.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-background"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{unit.name}</span>
                          {getStatusBadge(unit.status)}
                        </div>
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
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {unit.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this mobile unit.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUnit(unit.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle>Locations</CardTitle>
                <CardDescription>Add and manage locations for this event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Location Form */}
                <div className="flex gap-2 p-4 bg-muted/50 rounded-lg flex-wrap">
                  <Input
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="Location name"
                    disabled={addingLocation}
                    className="flex-1 min-w-[200px]"
                  />
                  <Input
                    value={newLocationLat}
                    onChange={(e) => setNewLocationLat(e.target.value)}
                    placeholder="Latitude"
                    disabled={addingLocation}
                    className="w-[120px]"
                    type="number"
                    step="any"
                  />
                  <Input
                    value={newLocationLng}
                    onChange={(e) => setNewLocationLng(e.target.value)}
                    placeholder="Longitude"
                    disabled={addingLocation}
                    className="w-[120px]"
                    type="number"
                    step="any"
                  />
                  <Select value={newLocationCategory} onValueChange={setNewLocationCategory}>
                    <SelectTrigger className="w-[130px]">
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
                    <Plus className="h-4 w-4 mr-1" />
                    Add Location
                  </Button>
                </div>

                {/* Locations List */}
                {loading ? (
                  <p className="text-sm text-muted-foreground py-4">Loading...</p>
                ) : locations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No locations yet. Add your first location above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {locations.map((location) => (
                      <div
                        key={location.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-background"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{location.name}</span>
                          <Badge variant="secondary">{location.category}</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground font-mono">
                            {location.coordinates.lat.toFixed(5)}, {location.coordinates.lng.toFixed(5)}
                          </span>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {location.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this location.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteLocation(location.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}