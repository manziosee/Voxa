"use client";

import React, { useState } from "react";
import { Search, Plus, AlertTriangle, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { inventoryItems } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const filtered = inventoryItems.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));

  const lowStock = inventoryItems.filter((i) => i.stock <= i.minStock && i.stock > 0).length;
  const outOfStock = inventoryItems.filter((i) => i.stock === 0).length;
  const totalValue = inventoryItems.reduce((s, i) => s + i.price * i.stock, 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="nav-card rounded-2xl px-6 py-5 mb-6" style={{ background: "linear-gradient(135deg, #0B1D3A, #132042)" }}>
        <div className="flex items-center justify-between mb-5">
          <div><h1 className="text-white text-xl font-bold">Inventory</h1><p className="text-white/50 text-sm">Multi-warehouse stock management</p></div>
          <Button className="bg-primary hover:bg-primary/90 text-white gap-2"><Plus className="w-4 h-4" />Add Item</Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[{ label: "Total Value", val: `$${(totalValue / 1000).toFixed(1)}K`, icon: TrendingUp, color: "text-green-400" }, { label: "Low Stock", val: lowStock, icon: AlertTriangle, color: "text-yellow-400" }, { label: "Out of Stock", val: outOfStock, icon: Package, color: "text-red-400" }].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white/[0.07] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1"><Icon className={cn("w-4 h-4", s.color)} /><p className="text-white/50 text-xs">{s.label}</p></div>
                <p className={cn("text-2xl font-bold", s.color)}>{s.val}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Low stock alert */}
      {(lowStock > 0 || outOfStock > 0) && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">{outOfStock} item(s)</span> out of stock and <span className="font-semibold">{lowStock} item(s)</span> below minimum stock level.
          </p>
          <Button size="sm" variant="outline" className="ml-auto border-yellow-300 text-yellow-700 hover:bg-yellow-100 shrink-0">
            Reorder Now
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name, SKU, category…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card" />
      </div>

      {/* Items grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const stockPct = (item.stock / (item.minStock * 3)) * 100;
          const isLow = item.stock <= item.minStock && item.stock > 0;
          const isOut = item.stock === 0;
          return (
            <div key={item.id} className={cn("bg-card border rounded-2xl p-5 hover:shadow-md transition-all", isOut ? "border-red-200" : isLow ? "border-yellow-200" : "border-border")}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.sku}</p>
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", isOut ? "badge-destructive" : isLow ? "badge-pending" : "badge-success")}>
                  {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span className="text-foreground font-bold text-base">{item.stock}</span>
                <span>Min: {item.minStock}</span>
              </div>
              <Progress value={Math.min(stockPct, 100)} className={cn("h-1.5 mb-3", isOut ? "[&>div]:bg-red-500" : isLow ? "[&>div]:bg-yellow-500" : "[&>div]:bg-primary")} />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.warehouse}</span>
                <span className="font-semibold text-foreground">${item.price.toLocaleString()}/unit</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
