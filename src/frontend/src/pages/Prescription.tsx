import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddPrescription,
  useDeletePrescription,
  usePrescriptions,
} from "../hooks/useQueries";

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function Prescription() {
  const { data: prescriptions, isLoading, isError } = usePrescriptions();
  const addPrescription = useAddPrescription();
  const deletePrescription = useDeletePrescription();

  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setCustomerName("");
    setCustomerMobile("");
    setNotes("");
  };

  const handleAdd = async () => {
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!customerMobile.trim()) {
      toast.error("Mobile number is required");
      return;
    }
    try {
      await addPrescription.mutateAsync({
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        notes: notes.trim(),
        date: new Date().toISOString(),
      });
      toast.success("Prescription added");
      setOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to add prescription");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deletePrescription.mutateAsync(id);
      toast.success("Prescription deleted");
    } catch {
      toast.error("Failed to delete prescription");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Prescriptions
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {prescriptions?.length ?? 0} prescription records
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="prescription.add_prescription.button"
              className="pharmacy-gradient text-white border-0 hover:opacity-90"
            >
              <Plus size={16} className="mr-1" /> Add Prescription
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="prescription.dialog">
            <DialogHeader>
              <DialogTitle>New Prescription</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Customer Name</Label>
                  <Input
                    data-ocid="prescription.customer_name.input"
                    placeholder="e.g. Sunita Devi"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Mobile Number</Label>
                  <Input
                    data-ocid="prescription.mobile.input"
                    placeholder="e.g. 9876543210"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Notes / Medicines</Label>
                <Textarea
                  data-ocid="prescription.notes.textarea"
                  placeholder="Write prescription details, medicines, dosage..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                data-ocid="prescription.cancel_button"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={addPrescription.isPending}
                className="pharmacy-gradient text-white border-0"
                data-ocid="prescription.submit_button"
              >
                {addPrescription.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {addPrescription.isPending ? "Adding..." : "Add Prescription"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isError && (
        <div
          data-ocid="prescription.error_state"
          className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm"
        >
          Failed to load prescriptions.
        </div>
      )}

      {isLoading ? (
        <div data-ocid="prescription.loading_state" className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Customer</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!prescriptions?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="prescription.empty_state"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileText
                        size={32}
                        className="text-muted-foreground/40"
                      />
                      No prescriptions yet.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                prescriptions.map((rx, idx) => (
                  <TableRow
                    key={rx.id.toString()}
                    data-ocid={`prescription.item.${idx + 1}`}
                  >
                    <TableCell className="font-medium">
                      {rx.customerName}
                    </TableCell>
                    <TableCell>{rx.customerMobile}</TableCell>
                    <TableCell className="max-w-xs">
                      <p
                        className="text-sm text-muted-foreground truncate"
                        title={rx.notes}
                      >
                        {rx.notes || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(rx.date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        data-ocid={`prescription.delete_button.${idx + 1}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rx.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
