// ─── Types ───────────────────────────────────────────────────────────────────

export type TransactionType = "Subscription" | "Receive" | "Payment" | "Transfer";
export type TransactionStatus = "Completed" | "Pending" | "Failed";
export type DealStage = "Lead" | "Qualified" | "Proposal" | "Won" | "Lost";
export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";
export type EmployeeStatus = "Active" | "OnLeave" | "Remote";

export interface Transaction {
  id: string;
  name: string;
  category: string;
  type: TransactionType;
  date: string;
  amount: number;
  status: TransactionStatus;
  avatar: string;
}

export interface SavingPlan {
  id: string;
  name: string;
  monthlySavings: number;
  current: number;
  target: number;
  icon: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: EmployeeStatus;
  salary: number;
  avatar: string;
  joinDate: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  price: number;
  category: string;
  warehouse: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  deal: string;
  value: number;
  stage: DealStage;
  lastContact: string;
  avatar: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  customer: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  issuedDate: string;
  editingBy?: string[];
}

export interface PayrollRecord {
  id: string;
  employee: string;
  role: string;
  department: string;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  payDate: string;
  status: "Paid" | "Processing" | "Pending";
  avatar: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const transactions: Transaction[] = [
  {
    id: "1",
    name: "Figma Pro Plan",
    category: "Application",
    type: "Subscription",
    date: "Oct 20, 2022  10:32 PM",
    amount: -64,
    status: "Completed",
    avatar: "https://i.pravatar.cc/40?u=figma",
  },
  {
    id: "2",
    name: "Fiver International",
    category: "Freelance platform",
    type: "Receive",
    date: "Oct 20, 2022  10:32 PM",
    amount: 100,
    status: "Completed",
    avatar: "https://i.pravatar.cc/40?u=fiver",
  },
  {
    id: "3",
    name: "Adobe Creative Cloud",
    category: "Software",
    type: "Subscription",
    date: "Oct 19, 2022  09:15 AM",
    amount: -54.99,
    status: "Completed",
    avatar: "https://i.pravatar.cc/40?u=adobe",
  },
  {
    id: "4",
    name: "Client Payment - Kigali Tech",
    category: "Consulting",
    type: "Receive",
    date: "Oct 18, 2022  02:44 PM",
    amount: 2500,
    status: "Completed",
    avatar: "https://i.pravatar.cc/40?u=kigali",
  },
  {
    id: "5",
    name: "AWS Services",
    category: "Cloud Infrastructure",
    type: "Subscription",
    date: "Oct 17, 2022  12:00 AM",
    amount: -189.34,
    status: "Pending",
    avatar: "https://i.pravatar.cc/40?u=aws",
  },
  {
    id: "6",
    name: "Payroll Transfer",
    category: "HR",
    type: "Transfer",
    date: "Oct 15, 2022  08:00 AM",
    amount: -12500,
    status: "Completed",
    avatar: "https://i.pravatar.cc/40?u=payroll",
  },
  {
    id: "7",
    name: "Office Rent",
    category: "Operations",
    type: "Payment",
    date: "Oct 14, 2022  10:00 AM",
    amount: -1800,
    status: "Completed",
    avatar: "https://i.pravatar.cc/40?u=rent",
  },
  {
    id: "8",
    name: "Upwork Contract",
    category: "Freelance",
    type: "Receive",
    date: "Oct 13, 2022  06:20 PM",
    amount: 730,
    status: "Completed",
    avatar: "https://i.pravatar.cc/40?u=upwork",
  },
];

export const savingPlans: SavingPlan[] = [
  {
    id: "1",
    name: "Get new car",
    monthlySavings: 100,
    current: 5000,
    target: 25000,
    icon: "🚗",
  },
  {
    id: "2",
    name: "Marriage plan",
    monthlySavings: 100,
    current: 351,
    target: 25000,
    icon: "💒",
  },
  {
    id: "3",
    name: "Buy PS5",
    monthlySavings: 100,
    current: 200,
    target: 600,
    icon: "🎮",
  },
];

export const employees: Employee[] = [
  {
    id: "1",
    name: "Alice Uwimana",
    role: "Senior Developer",
    department: "Engineering",
    status: "Active",
    salary: 4200,
    avatar: "https://i.pravatar.cc/40?u=alice",
    joinDate: "Jan 15, 2021",
  },
  {
    id: "2",
    name: "Bob Mugisha",
    role: "Product Manager",
    department: "Product",
    status: "Remote",
    salary: 3800,
    avatar: "https://i.pravatar.cc/40?u=bob",
    joinDate: "Mar 2, 2020",
  },
  {
    id: "3",
    name: "Carol Ingabire",
    role: "UI/UX Designer",
    department: "Design",
    status: "Active",
    salary: 3200,
    avatar: "https://i.pravatar.cc/40?u=carol",
    joinDate: "Jun 10, 2022",
  },
  {
    id: "4",
    name: "David Nkurunziza",
    role: "DevOps Engineer",
    department: "Engineering",
    status: "Active",
    salary: 4000,
    avatar: "https://i.pravatar.cc/40?u=david",
    joinDate: "Sep 18, 2021",
  },
  {
    id: "5",
    name: "Eva Mutesi",
    role: "Account Manager",
    department: "Finance",
    status: "OnLeave",
    salary: 2900,
    avatar: "https://i.pravatar.cc/40?u=eva",
    joinDate: "Feb 28, 2022",
  },
  {
    id: "6",
    name: "Frank Habimana",
    role: "Sales Lead",
    department: "Sales",
    status: "Active",
    salary: 3500,
    avatar: "https://i.pravatar.cc/40?u=frank",
    joinDate: "Nov 1, 2020",
  },
];

export const inventoryItems: InventoryItem[] = [
  {
    id: "1",
    name: "MacBook Pro 16\"",
    sku: "MBP-16-M3",
    stock: 12,
    minStock: 5,
    price: 2499,
    category: "Electronics",
    warehouse: "Kigali Main",
  },
  {
    id: "2",
    name: "Wireless Keyboard",
    sku: "KB-WL-001",
    stock: 3,
    minStock: 10,
    price: 89,
    category: "Accessories",
    warehouse: "Kigali Main",
  },
  {
    id: "3",
    name: "4K Monitor 27\"",
    sku: "MON-4K-27",
    stock: 8,
    minStock: 4,
    price: 549,
    category: "Electronics",
    warehouse: "Butare Branch",
  },
  {
    id: "4",
    name: "Office Chair Ergonomic",
    sku: "CHAIR-ERG-02",
    stock: 2,
    minStock: 5,
    price: 399,
    category: "Furniture",
    warehouse: "Kigali Main",
  },
  {
    id: "5",
    name: "USB-C Hub 7-in-1",
    sku: "HUB-USB-7",
    stock: 45,
    minStock: 15,
    price: 59,
    category: "Accessories",
    warehouse: "Musanze Branch",
  },
  {
    id: "6",
    name: "Standing Desk",
    sku: "DESK-ST-01",
    stock: 0,
    minStock: 3,
    price: 699,
    category: "Furniture",
    warehouse: "Kigali Main",
  },
];

export const customers: Customer[] = [
  {
    id: "1",
    name: "Ines Muhoza",
    email: "ines@rwandatel.rw",
    company: "Rwanda Telecom",
    deal: "ERP Enterprise License",
    value: 48000,
    stage: "Won",
    lastContact: "Oct 18, 2022",
    avatar: "https://i.pravatar.cc/40?u=ines",
  },
  {
    id: "2",
    name: "James Kaberuka",
    email: "james@banquedev.rw",
    company: "Banque de Développement",
    deal: "Analytics Module",
    value: 22000,
    stage: "Proposal",
    lastContact: "Oct 20, 2022",
    avatar: "https://i.pravatar.cc/40?u=james",
  },
  {
    id: "3",
    name: "Sarah Akello",
    email: "sarah@kampala-fintech.ug",
    company: "Kampala FinTech",
    deal: "Payroll + HR Suite",
    value: 15000,
    stage: "Qualified",
    lastContact: "Oct 15, 2022",
    avatar: "https://i.pravatar.cc/40?u=sarah",
  },
  {
    id: "4",
    name: "Omar Shariff",
    email: "omar@nairobitrade.ke",
    company: "Nairobi Trade Co.",
    deal: "Inventory System",
    value: 9500,
    stage: "Lead",
    lastContact: "Oct 10, 2022",
    avatar: "https://i.pravatar.cc/40?u=omar",
  },
  {
    id: "5",
    name: "Amara Diallo",
    email: "amara@dakar-logistics.sn",
    company: "Dakar Logistics",
    deal: "Fleet Management",
    value: 31000,
    stage: "Proposal",
    lastContact: "Oct 19, 2022",
    avatar: "https://i.pravatar.cc/40?u=amara",
  },
];

export const invoices: Invoice[] = [
  {
    id: "1",
    invoiceNo: "INV-2022-001",
    customer: "Rwanda Telecom",
    amount: 12000,
    status: "Paid",
    dueDate: "Oct 30, 2022",
    issuedDate: "Oct 1, 2022",
    editingBy: [],
  },
  {
    id: "2",
    invoiceNo: "INV-2022-002",
    customer: "Banque de Développement",
    amount: 5500,
    status: "Sent",
    dueDate: "Nov 5, 2022",
    issuedDate: "Oct 6, 2022",
    editingBy: ["Alice U.", "Bob M."],
  },
  {
    id: "3",
    invoiceNo: "INV-2022-003",
    customer: "Kampala FinTech",
    amount: 3750,
    status: "Draft",
    dueDate: "Nov 15, 2022",
    issuedDate: "Oct 15, 2022",
    editingBy: ["Carol I."],
  },
  {
    id: "4",
    invoiceNo: "INV-2022-004",
    customer: "Nairobi Trade Co.",
    amount: 2100,
    status: "Overdue",
    dueDate: "Oct 10, 2022",
    issuedDate: "Sep 10, 2022",
    editingBy: [],
  },
  {
    id: "5",
    invoiceNo: "INV-2022-005",
    customer: "Dakar Logistics",
    amount: 8900,
    status: "Sent",
    dueDate: "Nov 20, 2022",
    issuedDate: "Oct 20, 2022",
    editingBy: [],
  },
];

export const payrollRecords: PayrollRecord[] = [
  {
    id: "1",
    employee: "Alice Uwimana",
    role: "Senior Developer",
    department: "Engineering",
    grossSalary: 4200,
    deductions: 420,
    netSalary: 3780,
    payDate: "Oct 31, 2022",
    status: "Paid",
    avatar: "https://i.pravatar.cc/40?u=alice",
  },
  {
    id: "2",
    employee: "Bob Mugisha",
    role: "Product Manager",
    department: "Product",
    grossSalary: 3800,
    deductions: 380,
    netSalary: 3420,
    payDate: "Oct 31, 2022",
    status: "Paid",
    avatar: "https://i.pravatar.cc/40?u=bob",
  },
  {
    id: "3",
    employee: "Carol Ingabire",
    role: "UI/UX Designer",
    department: "Design",
    grossSalary: 3200,
    deductions: 320,
    netSalary: 2880,
    payDate: "Oct 31, 2022",
    status: "Processing",
    avatar: "https://i.pravatar.cc/40?u=carol",
  },
  {
    id: "4",
    employee: "David Nkurunziza",
    role: "DevOps Engineer",
    department: "Engineering",
    grossSalary: 4000,
    deductions: 400,
    netSalary: 3600,
    payDate: "Oct 31, 2022",
    status: "Pending",
    avatar: "https://i.pravatar.cc/40?u=david",
  },
];

export const revenueChartData = [
  { month: "Jan", income: 28000, expense: 18000 },
  { month: "Feb", income: 32000, expense: 21000 },
  { month: "Mar", income: 27000, expense: 19000 },
  { month: "Apr", income: 35000, expense: 22000 },
  { month: "May", income: 31000, expense: 20000 },
  { month: "Jun", income: 38000, expense: 24000 },
  { month: "Jul", income: 42000, expense: 26000 },
  { month: "Aug", income: 39000, expense: 25000 },
  { month: "Sep", income: 44000, expense: 28000 },
  { month: "Oct", income: 48000, expense: 30000 },
  { month: "Nov", income: 52000, expense: 32000 },
  { month: "Dec", income: 56000, expense: 35000 },
];

export const onlineUsers = [
  { name: "Alice U.", avatar: "https://i.pravatar.cc/32?u=alice", color: "#6C5DD3" },
  { name: "Bob M.", avatar: "https://i.pravatar.cc/32?u=bob", color: "#4CA3FF" },
  { name: "Carol I.", avatar: "https://i.pravatar.cc/32?u=carol", color: "#12B76A" },
];
