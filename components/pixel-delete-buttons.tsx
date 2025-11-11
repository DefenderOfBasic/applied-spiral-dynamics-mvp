"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast";
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

export function PixelDeleteButton({ pixelId }: { pixelId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/pixels?id=${pixelId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete pixel");
      }

      toast({
        type: "success",
        description: "Pixel deleted successfully",
      });
      router.refresh();
    } catch (error) {
      toast({
        type: "error",
        description: "Failed to delete pixel",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isDeleting}>
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Pixel</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this pixel? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeleteAllPixelsButton() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/pixels", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete all pixels");
      }

      const data = await response.json();
      toast({
        type: "success",
        description: `Deleted ${data.deletedCount} pixel(s) successfully`,
      });
      router.refresh();
    } catch (error) {
      toast({
        type: "error",
        description: "Failed to delete all pixels",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isDeleting}>
          Delete All
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete All Pixels</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete all pixels? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAll}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

