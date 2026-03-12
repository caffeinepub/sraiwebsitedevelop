import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DashboardStats {
    activeBills: bigint;
    deliveredBills: bigint;
    totalBills: number;
}
export interface OrderItem {
    qty: bigint;
    productName: string;
    price: number;
}
export interface Prescription {
    id: bigint;
    customerName: string;
    date: string;
    customerMobile: string;
    notes: string;
}
export interface Order {
    id: bigint;
    customerName: string;
    status: OrderStatus;
    date: string;
    customerMobile: string;
    grandTotal: number;
    items: Array<OrderItem>;
}
export interface UserProfile {
    name: string;
}
export interface Product {
    id: bigint;
    name: string;
    stock: bigint;
    price: number;
}
export enum OrderStatus {
    pending = "pending",
    delivered = "delivered"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface RegisteredUser {
    principal: string;
    name: string;
    role: string;
}
export interface backendInterface {
    getAllRegisteredUsers(): Promise<Array<RegisteredUser>>;
    addOrder(customerName: string, customerMobile: string, items: Array<OrderItem>, grandTotal: number, date: string): Promise<bigint>;
    addPrescription(customerName: string, customerMobile: string, notes: string, date: string): Promise<bigint>;
    addProduct(name: string, price: number, stock: bigint): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteOrder(id: bigint): Promise<void>;
    deletePrescription(id: bigint): Promise<void>;
    deleteProduct(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    getDeliveredOrders(): Promise<Array<Order>>;
    getOrders(): Promise<Array<Order>>;
    getPendingOrders(): Promise<Array<Order>>;
    getPrescriptions(): Promise<Array<Prescription>>;
    getProducts(): Promise<Array<Product>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateOrderStatus(id: bigint, status: OrderStatus): Promise<void>;
    updateProduct(id: bigint, name: string, price: number, stock: bigint): Promise<void>;
}
