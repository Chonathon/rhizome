import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {ReportReason} from "@/types";
import {BAD_DATA_DESC_LIMIT} from "@/constants";

interface ReportIncorrectInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reasons: ReportReason[];
  onSubmit: (reason: string, details: string ) => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  descriptionLimit?: number;
}

export function ReportIncorrectInfoDialog({
  open,
  onOpenChange,
  reasons,
  onSubmit,
  title = "Report Incorrect Information",
  description =
    "Please let us know what seems incorrect. Select a reason and provide any extra details if you’d like.",
  submitLabel = "Submit",
  cancelLabel = "Cancel",
    descriptionLimit = BAD_DATA_DESC_LIMIT,
}: ReportIncorrectInfoDialogProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");

  const handleSubmit = () => {
    if (reason) {
      onSubmit(reason, details);
      onOpenChange(false);
      setReason(null);
      setDetails("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-sidebar backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="reason" className="text-sm sr-only font-medium">
              Reason
            </Label>
            <Select value={reason ?? undefined} onValueChange={setReason}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="sr-only">Reasons</SelectLabel>
                  {reasons.map((r) => (
                    <SelectItem key={r.value} value={r.value} disabled={r.disabled}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="details" className="text-sm sr-only font-medium">
              Details (optional)
            </Label>
            <Textarea
              id="details"
              placeholder="Additional details..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{cancelLabel}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="submit" onClick={handleSubmit} disabled={!reason || details.length > descriptionLimit}>
              {submitLabel}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReportIncorrectInfoDialog;

