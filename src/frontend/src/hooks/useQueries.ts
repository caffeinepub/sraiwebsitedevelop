import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OrderStatus, UserRole } from "../backend";
import type { OrderItem } from "../backend";
import { useActor } from "./useActor";

export { OrderStatus, UserRole };

export function useDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) return { totalBills: 0, activeBills: 0n, deliveredBills: 0n };
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePendingOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["pendingOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeliveredOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["deliveredOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDeliveredOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProducts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePrescriptions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["prescriptions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPrescriptions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      customerName: string;
      customerMobile: string;
      items: OrderItem[];
      grandTotal: number;
      date: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addOrder(
        data.customerName,
        data.customerMobile,
        data.items,
        data.grandTotal,
        data.date,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["pendingOrders"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useDeleteOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteOrder(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["pendingOrders"] });
      qc.invalidateQueries({ queryKey: ["deliveredOrders"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: bigint; status: OrderStatus }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateOrderStatus(id, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["pendingOrders"] });
      qc.invalidateQueries({ queryKey: ["deliveredOrders"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      price: number;
      stock: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addProduct(data.name, data.price, data.stock);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      price: number;
      stock: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateProduct(data.id, data.name, data.price, data.stock);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteProduct(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useAddPrescription() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      customerName: string;
      customerMobile: string;
      notes: string;
      date: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addPrescription(
        data.customerName,
        data.customerMobile,
        data.notes,
        data.date,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prescriptions"] }),
  });
}

export function useDeletePrescription() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deletePrescription(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prescriptions"] }),
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile({ name });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userProfile"] }),
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLookupUserProfile() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (principalStr: string) => {
      if (!actor) throw new Error("Not connected");
      const principal = Principal.fromText(principalStr);
      return actor.getUserProfile(principal);
    },
  });
}

export function useAssignUserRole() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      principalStr,
      role,
    }: {
      principalStr: string;
      role: UserRole;
    }) => {
      if (!actor) throw new Error("Not connected");
      const principal = Principal.fromText(principalStr);
      return actor.assignCallerUserRole(principal, role);
    },
  });
}

export function useGetAllRegisteredUsers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allRegisteredUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRegisteredUsers();
    },
    enabled: !isFetching && !!actor,
  });
}
