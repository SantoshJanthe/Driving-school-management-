"use client";

import { Plus } from "lucide-react";

import { UploadForm } from "@/components/documents/upload-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddDocumentDialog({
  applicants,
}: {
  applicants: { id: string; full_name: string; application_number: string | null }[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-11">
          <Plus aria-hidden />
          Add document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add document</DialogTitle>
          <DialogDescription>
            Choose the applicant this file belongs to. PDF, JPG, PNG, or WEBP, up to 10 MB.
          </DialogDescription>
        </DialogHeader>
        <UploadForm applicants={applicants} returnTo="/documents" bare />
      </DialogContent>
    </Dialog>
  );
}
