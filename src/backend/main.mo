import Float "mo:core/Float";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  public type Product = {
    id : Nat;
    name : Text;
    price : Float;
    stock : Nat;
  };

  public type OrderItem = {
    productName : Text;
    qty : Nat;
    price : Float;
  };

  public type Order = {
    id : Nat;
    customerName : Text;
    customerMobile : Text;
    items : [OrderItem];
    grandTotal : Float;
    status : OrderStatus;
    date : Text;
  };

  public type OrderStatus = {
    #pending;
    #delivered;
  };

  public type Prescription = {
    id : Nat;
    customerName : Text;
    customerMobile : Text;
    notes : Text;
    date : Text;
  };

  public type DashboardStats = {
    totalBills : Float;
    activeBills : Nat;
    deliveredBills : Nat;
  };

  var nextProductId = 0;
  var nextOrderId = 0;
  var nextPrescriptionId = 0;

  let userProfiles = Map.empty<Principal, UserProfile>();
  let products = Map.empty<Principal, Map.Map<Nat, Product>>();
  let orders = Map.empty<Principal, Map.Map<Nat, Order>>();
  let prescriptions = Map.empty<Principal, Map.Map<Nat, Prescription>>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  func getUserProducts(caller : Principal) : Map.Map<Nat, Product> {
    switch (products.get(caller)) {
      case (null) {
        let emptyMap = Map.empty<Nat, Product>();
        products.add(caller, emptyMap);
        emptyMap;
      };
      case (?userProducts) { userProducts };
    };
  };

  func getUserOrders(caller : Principal) : Map.Map<Nat, Order> {
    switch (orders.get(caller)) {
      case (null) {
        let emptyMap = Map.empty<Nat, Order>();
        orders.add(caller, emptyMap);
        emptyMap;
      };
      case (?userOrders) { userOrders };
    };
  };

  func getUserPrescriptions(caller : Principal) : Map.Map<Nat, Prescription> {
    switch (prescriptions.get(caller)) {
      case (null) {
        let emptyMap = Map.empty<Nat, Prescription>();
        prescriptions.add(caller, emptyMap);
        emptyMap;
      };
      case (?userPrescriptions) { userPrescriptions };
    };
  };

  // Product Management
  public shared ({ caller }) func addProduct(name : Text, price : Float, stock : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add products");
    };

    let id = nextProductId;
    nextProductId += 1;

    let userProducts = getUserProducts(caller);
    userProducts.add(
      id,
      {
        id;
        name;
        price;
        stock;
      },
    );
    id;
  };

  public shared ({ caller }) func updateProduct(id : Nat, name : Text, price : Float, stock : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update products");
    };

    let userProducts = getUserProducts(caller);
    if (not userProducts.containsKey(id)) {
      Runtime.trap("Product not found");
    };
    userProducts.add(
      id,
      {
        id;
        name;
        price;
        stock;
      },
    );
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete products");
    };

    let userProducts = getUserProducts(caller);
    if (not userProducts.containsKey(id)) {
      Runtime.trap("Product not found");
    };
    userProducts.remove(id);
  };

  public query ({ caller }) func getProducts() : async [Product] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };

    getUserProducts(caller).values().toArray();
  };

  // Order Management
  public shared ({ caller }) func addOrder(
    customerName : Text,
    customerMobile : Text,
    items : [OrderItem],
    grandTotal : Float,
    date : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add orders");
    };

    let id = nextOrderId;
    nextOrderId += 1;

    let userOrders = getUserOrders(caller);
    userOrders.add(
      id,
      {
        id;
        customerName;
        customerMobile;
        items;
        grandTotal;
        status = #pending;
        date;
      },
    );
    id;
  };

  public shared ({ caller }) func updateOrderStatus(id : Nat, status : OrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update order status");
    };

    let userOrders = getUserOrders(caller);
    switch (userOrders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        userOrders.add(
          id,
          {
            order with
            status;
          },
        );
      };
    };
  };

  public shared ({ caller }) func deleteOrder(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete orders");
    };

    let userOrders = getUserOrders(caller);
    if (not userOrders.containsKey(id)) {
      Runtime.trap("Order not found");
    };
    userOrders.remove(id);
  };

  public query ({ caller }) func getOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };

    getUserOrders(caller).values().toArray();
  };

  public query ({ caller }) func getPendingOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view pending orders");
    };

    getUserOrders(caller).values().toArray().filter(
      func(order) {
        order.status == #pending;
      }
    );
  };

  public query ({ caller }) func getDeliveredOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view delivered orders");
    };

    getUserOrders(caller).values().toArray().filter(
      func(order) {
        order.status == #delivered;
      }
    );
  };

  // Prescription Management
  public shared ({ caller }) func addPrescription(
    customerName : Text,
    customerMobile : Text,
    notes : Text,
    date : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add prescriptions");
    };

    let id = nextPrescriptionId;
    nextPrescriptionId += 1;

    let userPrescriptions = getUserPrescriptions(caller);
    userPrescriptions.add(
      id,
      {
        id;
        customerName;
        customerMobile;
        notes;
        date;
      },
    );
    id;
  };

  public shared ({ caller }) func deletePrescription(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete prescriptions");
    };

    let userPrescriptions = getUserPrescriptions(caller);
    if (not userPrescriptions.containsKey(id)) {
      Runtime.trap("Prescription not found");
    };
    userPrescriptions.remove(id);
  };

  public query ({ caller }) func getPrescriptions() : async [Prescription] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view prescriptions");
    };

    getUserPrescriptions(caller).values().toArray();
  };

  // Dashboard
  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard stats");
    };

    let userOrders = getUserOrders(caller).values();
    let activeBills = userOrders.toArray().filter(
      func(o) { o.status == #pending }
    ).size();
    let deliveredBills = userOrders.toArray().filter(
      func(o) { o.status == #delivered }
    ).size();
    let totalBills = userOrders.toArray().foldLeft(
      0.0,
      func(acc, order) {
        acc + order.grandTotal;
      },
    );

    {
      totalBills;
      activeBills;
      deliveredBills;
    };
  };
  public type RegisteredUser = {
    principal : Text;
    name : Text;
    role : Text;
  };

  public query ({ caller }) func getAllRegisteredUsers() : async [RegisteredUser] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list all users");
    };
    userProfiles.entries().toArray().map(
      func((p, profile)) : RegisteredUser {
        let role = switch (AccessControl.getUserRole(accessControlState, p)) {
          case (#admin) "admin";
          case (#user) "user";
          case (#guest) "guest";
        };
        { principal = p.toText(); name = profile.name; role }
      }
    );
  };

};
