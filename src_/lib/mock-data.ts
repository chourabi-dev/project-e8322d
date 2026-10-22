export type Restaurant = {
  id: string;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  hours: string;
  delivery: boolean;
  pickup: boolean;
  active: boolean;
  ordersToday: number;
  revenueToday: number;
  products: number;
  accent: string;
};

export type MenuCategory = { id: string; name: string; products: number; visible: boolean };
export type KitchenCategory = { id: string; name: string; station: string; screens: number };

export type Product = {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  discountPrice?: number;
  menuCategory: string;
  kitchenCategory: string;
  prepMinutes: number;
  available: boolean;
  featured: boolean;
  allergens: string[];
  ingredients: string[];
  order: number;
  restaurantId: string;
};

export type OrderStatus = "Pending" | "Accepted" | "Preparing" | "Ready" | "Completed" | "Cancelled";

export type OrderItem = { name: string; qty: number; kitchenCategory: string; note?: string };

export type Order = {
  id: string;
  number: number;
  restaurantId: string;
  table: string;
  customer?: string;
  placedAt: string;
  status: OrderStatus;
  type: "Dine-in" | "Delivery" | "Pickup";
  payment: "Paid" | "Unpaid" | "Refunded";
  total: number;
  priority: "Normal" | "High" | "Rush";
  instructions?: string;
  items: OrderItem[];
};

export const restaurants: Restaurant[] = [
  {
    id: "aveline-centrale",
    name: "Dalu Centrale",
    tagline: "Wood-fired Italian · Downtown",
    address: "14 Rue de la Kasbah, Tunis",
    phone: "+216 71 220 118",
    email: "centrale@aveline.co",
    description: "Flagship trattoria with a wood-fired oven and a 90-seat terrace.",
    hours: "11:30 – 23:30 · Daily",
    delivery: true,
    pickup: true,
    active: true,
    ordersToday: 184,
    revenueToday: 7420,
    products: 68,
    accent: "chart-1",
  },
  {
    id: "aveline-marina",
    name: "Dalu Marina",
    tagline: "Seafood & grill · Marina",
    address: "Quai 7, La Marsa",
    phone: "+216 71 884 902",
    email: "marina@aveline.co",
    description: "Coastal grill house focused on day-boat fish and charcoal cooking.",
    hours: "12:00 – 00:00 · Tue – Sun",
    delivery: false,
    pickup: true,
    active: true,
    ordersToday: 121,
    revenueToday: 6180,
    products: 54,
    accent: "chart-2",
  },
  {
    id: "aveline-atelier",
    name: "Dalu Atelier",
    tagline: "Pastry & coffee bar",
    address: "3 Avenue Habib Bourguiba, Tunis",
    phone: "+216 71 331 447",
    email: "atelier@aveline.co",
    description: "All-day pastry atelier and specialty coffee counter.",
    hours: "07:00 – 20:00 · Daily",
    delivery: true,
    pickup: true,
    active: true,
    ordersToday: 96,
    revenueToday: 2140,
    products: 41,
    accent: "chart-4",
  },
  {
    id: "aveline-nord",
    name: "Dalu Nord",
    tagline: "Neighbourhood bistro",
    address: "22 Rue du Lac, Les Berges du Lac",
    phone: "+216 71 909 220",
    email: "nord@aveline.co",
    description: "Seasonal bistro menu, currently closed for a kitchen refit.",
    hours: "18:00 – 23:00 · Wed – Sun",
    delivery: false,
    pickup: false,
    active: false,
    ordersToday: 0,
    revenueToday: 0,
    products: 33,
    accent: "chart-5",
  },
];

export const menuCategories: MenuCategory[] = [
  { id: "pizza", name: "Pizza", products: 14, visible: true },
  { id: "pasta", name: "Pasta", products: 11, visible: true },
  { id: "burgers", name: "Burgers", products: 8, visible: true },
  { id: "salads", name: "Salads", products: 7, visible: true },
  { id: "desserts", name: "Desserts", products: 9, visible: true },
  { id: "drinks", name: "Drinks", products: 19, visible: true },
];

export const kitchenCategories: KitchenCategory[] = [
  { id: "pizza-oven", name: "Pizza Oven", station: "Hot line", screens: 1 },
  { id: "pasta-station", name: "Pasta Station", station: "Hot line", screens: 1 },
  { id: "grill", name: "Grill", station: "Hot line", screens: 1 },
  { id: "cold-kitchen", name: "Cold Kitchen", station: "Garde manger", screens: 1 },
  { id: "desserts", name: "Desserts", station: "Pastry", screens: 1 },
  { id: "drinks-bar", name: "Drinks Bar", station: "Bar", screens: 1 },
];

export const products: Product[] = [
  {
    id: "p1",
    name: "Margherita",
    description: "San Marzano, fior di latte, basil, cold-pressed olive oil.",
    sku: "PZ-001",
    price: 24,
    discountPrice: 21,
    menuCategory: "Pizza",
    kitchenCategory: "Pizza Oven",
    prepMinutes: 9,
    available: true,
    featured: true,
    allergens: ["Gluten", "Dairy"],
    ingredients: ["Dough", "Tomato", "Mozzarella", "Basil"],
    order: 1,
    restaurantId: "aveline-centrale",
  },
  {
    id: "p2",
    name: "Pepperoni Nduja",
    description: "Double pepperoni, spicy nduja, honey drizzle.",
    sku: "PZ-004",
    price: 29,
    menuCategory: "Pizza",
    kitchenCategory: "Pizza Oven",
    prepMinutes: 11,
    available: true,
    featured: false,
    allergens: ["Gluten", "Dairy", "Pork"],
    ingredients: ["Dough", "Tomato", "Pepperoni", "Nduja"],
    order: 2,
    restaurantId: "aveline-centrale",
  },
  {
    id: "p3",
    name: "Spaghetti Carbonara",
    description: "Guanciale, pecorino romano, egg yolk, black pepper.",
    sku: "PA-002",
    price: 27,
    menuCategory: "Pasta",
    kitchenCategory: "Pasta Station",
    prepMinutes: 13,
    available: true,
    featured: true,
    allergens: ["Gluten", "Egg", "Dairy"],
    ingredients: ["Spaghetti", "Guanciale", "Pecorino", "Egg"],
    order: 3,
    restaurantId: "aveline-centrale",
  },
  {
    id: "p4",
    name: "Rigatoni Amatriciana",
    description: "Slow tomato, guanciale, chilli, pecorino.",
    sku: "PA-006",
    price: 25,
    menuCategory: "Pasta",
    kitchenCategory: "Pasta Station",
    prepMinutes: 12,
    available: false,
    featured: false,
    allergens: ["Gluten", "Dairy"],
    ingredients: ["Rigatoni", "Tomato", "Guanciale"],
    order: 4,
    restaurantId: "aveline-centrale",
  },
  {
    id: "p5",
    name: "Charcoal Ribeye",
    description: "300g dry-aged ribeye, bone marrow butter.",
    sku: "GR-011",
    price: 62,
    menuCategory: "Burgers",
    kitchenCategory: "Grill",
    prepMinutes: 18,
    available: true,
    featured: true,
    allergens: ["Dairy"],
    ingredients: ["Ribeye", "Butter", "Thyme"],
    order: 5,
    restaurantId: "aveline-marina",
  },
  {
    id: "p6",
    name: "Dalu Burger",
    description: "Dry-aged patty, aged cheddar, pickled onion, house sauce.",
    sku: "BR-002",
    price: 32,
    discountPrice: 28,
    menuCategory: "Burgers",
    kitchenCategory: "Grill",
    prepMinutes: 14,
    available: true,
    featured: false,
    allergens: ["Gluten", "Dairy", "Egg"],
    ingredients: ["Brioche", "Beef", "Cheddar"],
    order: 6,
    restaurantId: "aveline-marina",
  },
  {
    id: "p7",
    name: "Burrata & Peach",
    description: "Burrata, grilled peach, basil oil, sourdough crisp.",
    sku: "SA-003",
    price: 22,
    menuCategory: "Salads",
    kitchenCategory: "Cold Kitchen",
    prepMinutes: 6,
    available: true,
    featured: false,
    allergens: ["Dairy", "Gluten"],
    ingredients: ["Burrata", "Peach", "Basil"],
    order: 7,
    restaurantId: "aveline-centrale",
  },
  {
    id: "p8",
    name: "Pistachio Tiramisu",
    description: "Mascarpone, espresso, Bronte pistachio.",
    sku: "DS-005",
    price: 16,
    menuCategory: "Desserts",
    kitchenCategory: "Desserts",
    prepMinutes: 5,
    available: true,
    featured: true,
    allergens: ["Dairy", "Egg", "Nuts"],
    ingredients: ["Mascarpone", "Espresso", "Pistachio"],
    order: 8,
    restaurantId: "aveline-atelier",
  },
  {
    id: "p9",
    name: "Espresso Tonic",
    description: "Single-origin espresso, tonic, orange peel.",
    sku: "DR-014",
    price: 12,
    menuCategory: "Drinks",
    kitchenCategory: "Drinks Bar",
    prepMinutes: 3,
    available: true,
    featured: false,
    allergens: [],
    ingredients: ["Espresso", "Tonic", "Orange"],
    order: 9,
    restaurantId: "aveline-atelier",
  },
  {
    id: "p10",
    name: "Negroni Barrel-Aged",
    description: "Gin, campari, vermouth, aged 6 weeks in oak.",
    sku: "DR-021",
    price: 21,
    menuCategory: "Drinks",
    kitchenCategory: "Drinks Bar",
    prepMinutes: 4,
    available: true,
    featured: true,
    allergens: [],
    ingredients: ["Gin", "Campari", "Vermouth"],
    order: 10,
    restaurantId: "aveline-marina",
  },
];

const mins = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

export const orders: Order[] = [
  {
    id: "o102",
    number: 102,
    restaurantId: "aveline-centrale",
    table: "Table 5",
    customer: "Nadia B.",
    placedAt: mins(4),
    status: "Preparing",
    type: "Dine-in",
    payment: "Unpaid",
    total: 78,
    priority: "High",
    instructions: "One pizza without basil.",
    items: [
      { name: "Margherita", qty: 1, kitchenCategory: "Pizza Oven", note: "No basil" },
      { name: "Pepperoni Nduja", qty: 1, kitchenCategory: "Pizza Oven" },
      { name: "Espresso Tonic", qty: 2, kitchenCategory: "Drinks Bar" },
    ],
  },
  {
    id: "o103",
    number: 103,
    restaurantId: "aveline-centrale",
    table: "Table 12",
    placedAt: mins(11),
    status: "Preparing",
    type: "Dine-in",
    payment: "Paid",
    total: 54,
    priority: "Rush",
    items: [
      { name: "Spaghetti Carbonara", qty: 2, kitchenCategory: "Pasta Station" },
      { name: "Burrata & Peach", qty: 1, kitchenCategory: "Cold Kitchen" },
    ],
  },
  {
    id: "o104",
    number: 104,
    restaurantId: "aveline-marina",
    table: "Delivery",
    customer: "Karim S.",
    placedAt: mins(2),
    status: "Pending",
    type: "Delivery",
    payment: "Paid",
    total: 94,
    priority: "Normal",
    items: [
      { name: "Charcoal Ribeye", qty: 1, kitchenCategory: "Grill" },
      { name: "Dalu Burger", qty: 1, kitchenCategory: "Grill" },
      { name: "Negroni Barrel-Aged", qty: 1, kitchenCategory: "Drinks Bar" },
    ],
  },
  {
    id: "o105",
    number: 105,
    restaurantId: "aveline-atelier",
    table: "Counter 2",
    placedAt: mins(18),
    status: "Ready",
    type: "Pickup",
    payment: "Paid",
    total: 28,
    priority: "Normal",
    items: [{ name: "Pistachio Tiramisu", qty: 2, kitchenCategory: "Desserts" }],
  },
  {
    id: "o106",
    number: 106,
    restaurantId: "aveline-centrale",
    table: "Table 3",
    placedAt: mins(32),
    status: "Completed",
    type: "Dine-in",
    payment: "Paid",
    total: 132,
    priority: "Normal",
    items: [
      { name: "Rigatoni Amatriciana", qty: 2, kitchenCategory: "Pasta Station" },
      { name: "Pistachio Tiramisu", qty: 2, kitchenCategory: "Desserts" },
    ],
  },
  {
    id: "o107",
    number: 107,
    restaurantId: "aveline-marina",
    table: "Table 9",
    placedAt: mins(41),
    status: "Cancelled",
    type: "Dine-in",
    payment: "Refunded",
    total: 46,
    priority: "Normal",
    items: [{ name: "Dalu Burger", qty: 1, kitchenCategory: "Grill" }],
  },
];

export const ordersByHour = [
  { hour: "10:00", orders: 8 },
  { hour: "11:00", orders: 21 },
  { hour: "12:00", orders: 58 },
  { hour: "13:00", orders: 74 },
  { hour: "14:00", orders: 41 },
  { hour: "15:00", orders: 18 },
  { hour: "16:00", orders: 14 },
  { hour: "17:00", orders: 26 },
  { hour: "18:00", orders: 44 },
  { hour: "19:00", orders: 69 },
  { hour: "20:00", orders: 88 },
  { hour: "21:00", orders: 63 },
  { hour: "22:00", orders: 34 },
];

export const revenueEvolution = [
  { day: "Mon", revenue: 9800, orders: 212 },
  { day: "Tue", revenue: 11250, orders: 248 },
  { day: "Wed", revenue: 10420, orders: 231 },
  { day: "Thu", revenue: 13980, orders: 294 },
  { day: "Fri", revenue: 18640, orders: 386 },
  { day: "Sat", revenue: 21310, orders: 428 },
  { day: "Sun", revenue: 15740, orders: 341 },
];

export const topProducts = [
  { name: "Margherita", sold: 412 },
  { name: "Carbonara", sold: 366 },
  { name: "Dalu Burger", sold: 298 },
  { name: "Tiramisu", sold: 254 },
  { name: "Negroni", sold: 191 },
];

export const ordersByRestaurant = [
  { name: "Centrale", value: 184 },
  { name: "Marina", value: 121 },
  { name: "Atelier", value: 96 },
];

export const salesByCategory = [
  { name: "Pizza", value: 34 },
  { name: "Pasta", value: 24 },
  { name: "Grill", value: 18 },
  { name: "Desserts", value: 13 },
  { name: "Drinks", value: 11 },
];

export const prepTimes = [
  { station: "Pizza Oven", target: 10, actual: 11.4 },
  { station: "Pasta Station", target: 12, actual: 12.2 },
  { station: "Grill", target: 16, actual: 18.6 },
  { station: "Cold Kitchen", target: 6, actual: 5.4 },
  { station: "Desserts", target: 5, actual: 5.9 },
  { station: "Drinks Bar", target: 4, actual: 3.6 },
];

export const activity = {
  orders: [
    { label: "Order #104 · Marina", meta: "Delivery · €94", time: "2 min ago" },
    { label: "Order #103 · Centrale", meta: "Table 12 · €54", time: "11 min ago" },
    { label: "Order #102 · Centrale", meta: "Table 5 · €78", time: "4 min ago" },
  ],
  products: [
    { label: "Burrata & Peach", meta: "Salads · Cold Kitchen", time: "1 h ago" },
    { label: "Espresso Tonic", meta: "Drinks · Drinks Bar", time: "3 h ago" },
    { label: "Charcoal Ribeye", meta: "Grill · price updated", time: "Yesterday" },
  ],
  restaurants: [
    { label: "Dalu Nord", meta: "Set to inactive · kitchen refit", time: "2 d ago" },
    { label: "Dalu Marina", meta: "Delivery disabled", time: "3 d ago" },
    { label: "Dalu Atelier", meta: "Hours extended to 20:00", time: "5 d ago" },
  ],
};

export const users = [
  { name: "Yasmine Haddad", email: "yasmine@aveline.co", role: "Administrator", restaurants: "All", active: true },
  { name: "Marco Salvi", email: "marco@aveline.co", role: "Restaurant Manager", restaurants: "Centrale", active: true },
  { name: "Ines Trabelsi", email: "ines@aveline.co", role: "Restaurant Manager", restaurants: "Marina", active: true },
  { name: "Omar Bnouni", email: "omar@aveline.co", role: "Kitchen Staff", restaurants: "Centrale", active: true },
  { name: "Lina Feriani", email: "lina@aveline.co", role: "Cashier", restaurants: "Atelier", active: true },
  { name: "Paul Girard", email: "paul@aveline.co", role: "Viewer", restaurants: "All", active: false },
];

export const currency = (n: number) =>
  `€${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
