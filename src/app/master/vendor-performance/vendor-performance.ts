import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { VendorPerformanceService } from '../../services/vendor-performance/vendor-performance';

@Component({
  selector: 'app-vendor-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule, InputNumberModule],
  templateUrl: './vendor-performance.html',
  styleUrl: './vendor-performance.css',
  providers: [MessageService]
})
export class VendorPerformance implements OnInit {
  vendors: any[] = [];
  loading = false;
  editingRatings: { [key: number]: number } = {};

  constructor(
    private vpService: VendorPerformanceService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadVendors();
  }

  loadVendors() {
    this.loading = true;
    this.vpService.getAll().subscribe({
      next: (data) => {
        setTimeout(() => {
          this.vendors = data;
          this.vendors.forEach(v => { this.editingRatings[v.vendorId] = v.currentRating || 0; });
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load vendor performance' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  updateRating(vendor: any) {
    const rating = this.editingRatings[vendor.vendorId];
    if (!rating || rating < 1 || rating > 5) {
      this.messageService.add({ severity: 'warn', summary: 'Invalid', detail: 'Rating must be between 1 and 5' });
      return;
    }
    this.vpService.updateRating(vendor.vendorId, rating).subscribe({
      next: () => {
        vendor.currentRating = rating;
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: `Rating updated for ${vendor.name}` });
        this.cdr.detectChanges();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update rating' })
    });
  }

  getComplianceSeverity(rate: number): "success" | "warn" | "danger" {
    if (rate >= 90) return 'success';
    if (rate >= 70) return 'warn';
    return 'danger';
  }

  getRatingStars(rating: number): string {
    return '★'.repeat(Math.round(rating || 0)) + '☆'.repeat(5 - Math.round(rating || 0));
  }

  formatCurrency(val: number): string {
    if (val == null) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN');
  }
}
