import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Copy, Loader2, Search, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAssignUserRole,
  useGetAllRegisteredUsers,
  useLookupUserProfile,
} from "../hooks/useQueries";

export function AdminPanel() {
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString() ?? "";
  const [copied, setCopied] = useState(false);
  const [searchPrincipal, setSearchPrincipal] = useState("");
  const [lookupResult, setLookupResult] = useState<
    { name: string } | null | undefined
  >(undefined);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.user);
  const [assignPrincipal, setAssignPrincipal] = useState("");

  const lookupProfile = useLookupUserProfile();
  const assignRole = useAssignUserRole();
  const { data: registeredUsers, isLoading: usersLoading } =
    useGetAllRegisteredUsers();

  const handleCopy = () => {
    if (!principalId) return;
    navigator.clipboard.writeText(principalId).then(() => {
      setCopied(true);
      toast.success("Principal ID copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLookup = async () => {
    if (!searchPrincipal.trim()) return;
    try {
      const result = await lookupProfile.mutateAsync(searchPrincipal.trim());
      setLookupResult(result);
    } catch {
      toast.error("Invalid Principal ID");
    }
  };

  const handleAssignRole = async () => {
    if (!assignPrincipal.trim()) {
      toast.error("Enter a Principal ID");
      return;
    }
    try {
      await assignRole.mutateAsync({
        principalStr: assignPrincipal.trim(),
        role: selectedRole,
      });
      toast.success(`Role assigned: ${selectedRole}`);
      setAssignPrincipal("");
    } catch {
      toast.error("Failed to assign role");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <ShieldCheck size={24} className="text-amber-500" />
          Admin Panel
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage users, roles, and shop data
        </p>
      </div>

      {/* ── My Principal ID ── */}
      <Card
        className="border-2 border-amber-300 bg-amber-50"
        data-ocid="admin.principal.card"
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-amber-700 flex items-center gap-2 text-base">
            <ShieldCheck size={18} />
            Aapka Principal ID
          </CardTitle>
        </CardHeader>
        <CardContent>
          {principalId ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white rounded-lg border border-amber-200 p-2 break-all font-mono text-amber-900 select-all">
                {principalId}
              </code>
              <Button
                data-ocid="admin.copy_principal.button"
                size="sm"
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0"
                onClick={handleCopy}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Login to see your Principal ID
            </p>
          )}
          <p className="text-xs text-amber-600 mt-2">
            Yeh ID admin role assignment ke liye share karein.
          </p>
        </CardContent>
      </Card>

      {/* ── Registered Shopkeepers ── */}
      <Card data-ocid="admin.shopkeepers.card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users size={18} />
            Registered Shopkeepers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div data-ocid="admin.users.loading_state" className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !registeredUsers?.length ? (
            <p
              data-ocid="admin.users.empty_state"
              className="text-sm text-muted-foreground"
            >
              No registered users found.
            </p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Principal ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registeredUsers.map((user, idx) => (
                    <TableRow
                      key={user.principal}
                      data-ocid={`admin.user.item.${idx + 1}`}
                    >
                      <TableCell className="text-muted-foreground text-sm">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.role === "admin"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : "bg-blue-100 text-blue-700 border-blue-200"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground font-mono">
                          {user.principal.length > 20
                            ? `${user.principal.slice(0, 20)}...`
                            : user.principal}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Lookup User ── */}
      <Card data-ocid="admin.lookup.card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search size={18} />
            Lookup User by Principal ID
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              data-ocid="admin.lookup.input"
              placeholder="Enter Principal ID"
              value={searchPrincipal}
              onChange={(e) => setSearchPrincipal(e.target.value)}
              className="flex-1 font-mono text-sm"
            />
            <Button
              data-ocid="admin.lookup.button"
              onClick={handleLookup}
              disabled={lookupProfile.isPending}
              className="sr-gradient text-white border-0"
            >
              {lookupProfile.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search size={16} />
              )}
            </Button>
          </div>
          {lookupResult !== undefined && (
            <div
              data-ocid="admin.lookup.result"
              className={`p-3 rounded-lg text-sm ${
                lookupResult
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {lookupResult ? (
                <>
                  <span className="font-semibold">Found:</span>{" "}
                  {lookupResult.name}
                </>
              ) : (
                "User not found"
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Assign Role ── */}
      <Card data-ocid="admin.assign_role.card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck size={18} />
            Assign Role
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Principal ID</Label>
            <Input
              data-ocid="admin.assign.principal.input"
              placeholder="Enter user's Principal ID"
              value={assignPrincipal}
              onChange={(e) => setAssignPrincipal(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(v) => setSelectedRole(v as UserRole)}
            >
              <SelectTrigger data-ocid="admin.assign.role.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.admin}>Admin</SelectItem>
                <SelectItem value={UserRole.user}>User</SelectItem>
                <SelectItem value={UserRole.guest}>Guest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            data-ocid="admin.assign.submit_button"
            onClick={handleAssignRole}
            disabled={assignRole.isPending}
            className="w-full sr-gradient text-white border-0"
          >
            {assignRole.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {assignRole.isPending ? "Assigning..." : "Assign Role"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
