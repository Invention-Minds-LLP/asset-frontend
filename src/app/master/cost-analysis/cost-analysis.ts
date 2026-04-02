import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { CostAnalysisService } from '../../services/cost-analysis/cost-analysis';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-cost-analysis',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, SelectModule, DialogModule, InputNumberModule, TooltipModule,
  ],
  templateUrl: './cost-analysis.html',
  styleUrl: './cost-analysis.css',
  providers: [MessageService]
})
export class CostAnalysis implements OnInit {
  assetOptions: any[] = [];
  selectedAssetId: number | null = null;

  analysis: any = null;
  alerts: any[] = [];
  revenueEntries: any[] = [];

  loadingAnalysis = false;
  loadingAlerts = false;
  activeView: 'analysis' | 'alerts' = 'analysis';

  // Revenue dialog
  showRevenueDialog = false;
  savingRevenue = false;
  revenueForm = this.emptyRevenueForm();

  revenueTypeOptions = [
    { label: 'Procedure / Surgery', value: 'PROCEDURE' },
    { label: 'Diagnostic Test', value: 'TEST' },
    { label: 'Bed / Room Charge', value: 'BED_CHARGE' },
    { label: 'Equipment Rental', value: 'RENTAL' },
    { label: 'Service Charge', value: 'SERVICE' },
    { label: 'Other', value: 'OTHER' },
  ];

  constructor(
    private caService: CostAnalysisService,
    private assetsService: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAssets();
    this.loadAlerts();
  }

  loadAssets() {
    this.assetsService.getAllAssets().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        this.assetOptions = list.map((a: any) => ({
          label: `${a.assetId} — ${a.assetName}`,
          value: a.id
        }));
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadAlerts() {
    this.loadingAlerts = true;
    this.caService.getDepreciationAlerts().subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.alerts = res.data ?? [];
          this.loadingAlerts = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.loadingAlerts = false; this.cdr.detectChanges(); });
      }
    });
  }

  runAnalysis() {
    if (!this.selectedAssetId) return;
    this.loadingAnalysis = true;
    this.analysis = null;
    this.revenueEntries = [];

    this.caService.getAnalysis(this.selectedAssetId).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.analysis = res;
          this.loadingAnalysis = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loadingAnalysis = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load cost analysis' });
          this.cdr.detectChanges();
        });
      }
    });

    this.caService.getRevenueEntries(this.selectedAssetId).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.revenueEntries = res.data ?? [];
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  // ── Revenue ────────────────────────────────────────────────────────────────
  emptyRevenueForm() {
    return {
      entryDate: new Date().toISOString().slice(0, 10),
      revenueType: null as string | null,
      description: '',
      quantity: 1,
      unitRate: null as number | null,
      referenceNo: '',
    };
  }

  openRevenueDialog() {
    this.revenueForm = this.emptyRevenueForm();
    this.showRevenueDialog = true;
  }

  saveRevenue() {
    if (!this.selectedAssetId || !this.revenueForm.revenueType || !this.revenueForm.unitRate) {
      this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'Date, type and unit rate are required' });
      return;
    }
    this.savingRevenue = true;
    this.caService.addRevenueEntry(this.selectedAssetId, this.revenueForm).subscribe({
      next: () => {
        this.showRevenueDialog = false;
        this.savingRevenue = false;
        this.runAnalysis();
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Revenue entry added' });
        this.cdr.detectChanges();
      },
      error: () => {
        this.savingRevenue = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save revenue entry' });
        this.cdr.detectChanges();
      }
    });
  }

  deleteRevenue(entry: any) {
    this.caService.deleteRevenueEntry(entry.id).subscribe({
      next: () => {
        this.revenueEntries = this.revenueEntries.filter(e => e.id !== entry.id);
        if (this.analysis) this.runAnalysis();
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Revenue entry removed' });
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete entry' });
      }
    });
  }

  // ── Tooltip text (shown on ⓘ icons) ───────────────────────────────────────
  bookValueTooltip(): string {
    if (!this.analysis?.calc) return '';
    const c = this.analysis.calc.bookValue;
    const src = c.source === 'depreciation_record'
      ? `From depreciation record (method: ${c.method}, rate: ${c.rate}%/yr)`
      : 'No depreciation record — using original cost as book value';
    return `Formula: ${c.formula}\nOriginal Cost: ${this.fc(c.originalCost)}\nAccumulated Depreciation: ${this.fc(c.accumulatedDepreciation)}\nResult: ${this.fc(c.result)}\nSource: ${src}`;
  }

  ageTooltip(): string {
    if (!this.analysis?.calc) return '';
    const c = this.analysis.calc.age;
    const d = c.basisDate ? new Date(c.basisDate).toLocaleDateString('en-IN') : '—';
    return `Formula: ${c.formula}\nDate used (${c.basisField}): ${d}\nResult: ${c.result} years`;
  }

  maintTooltip(): string {
    if (!this.analysis?.calc) return '';
    const c = this.analysis.calc.maintenanceCost;
    return `Formula: ${c.formula}\n\nPM Sessions (${this.analysis.summary.pmCount}):\n  AMC/CMC contracts: ${this.fc(c.pmBreakdown.amcCmc)}\n  Paid visits: ${this.fc(c.pmBreakdown.paid)}\n  Internal: ${this.fc(c.pmBreakdown.internal)}\n  PM Total: ${this.fc(c.pmBreakdown.total)}\n\nRepair Tickets (${this.analysis.summary.repairCount}):\n  Labour (serviceCost): ${this.fc(c.repairBreakdown.labour)}\n  Parts (partsCost): ${this.fc(c.repairBreakdown.parts)}\n  Repair Total: ${this.fc(c.repairBreakdown.total)}\n\nGrand Total: ${this.fc(c.total)}`;
  }

  avgCostTooltip(): string {
    if (!this.analysis?.calc) return '';
    const c = this.analysis.calc.avgCostPerYear;
    return `Formula: ${c.formula}\nTotal Maintenance Cost: ${this.fc(c.totalMaintenanceCost)}\nAsset Age: ${c.ageYears} years\nResult: ${this.fc(c.result)} per year`;
  }

  replacementTooltip(): string {
    if (!this.analysis?.calc) return '';
    const c = this.analysis.calc.replacementCost;
    return `Formula: ${c.formula}\nOriginal Cost: ${this.fc(c.originalCost)}\nInflation Rate: ${c.inflationRate * 100}% per year (medical equipment index)\nAge (rounded): ${c.ageYearsRounded} year(s)\nResult: ${this.fc(c.result)}`;
  }

  roiTooltip(): string {
    if (!this.analysis?.calc) return '';
    const c = this.analysis.calc.revenue;
    const roi = c.roi != null ? c.roi + '%' : 'N/A (add revenue entries to calculate)';
    return `Formula: ${c.roiFormula}\nTotal Revenue Recorded: ${this.fc(c.totalRevenue)}\nTotal Maintenance Cost: ${this.fc(this.analysis.summary.totalMaintenanceCost)}\nOriginal Cost: ${this.fc(this.analysis.asset.originalCost)}\nROI: ${roi}`;
  }

  // ── Utilities ──────────────────────────────────────────────────────────────
  getRecommendationSeverity(rec: string): 'success' | 'warn' | 'danger' {
    if (rec === 'MONITOR') return 'success';
    if (rec === 'REPAIR')  return 'warn';
    return 'danger';
  }

  getAlertSeverity(types: string[]): 'danger' | 'warn' | 'info' {
    if (types.includes('PAST_LIFE'))           return 'danger';
    if (types.includes('NEARING_END_OF_LIFE')) return 'warn';
    return 'info';
  }

  getAlertLabel(types: string[]): string {
    if (types.includes('PAST_LIFE'))           return 'Past Life';
    if (types.includes('NEARING_END_OF_LIFE')) return 'End of Life Soon';
    return 'Low Book Value';
  }

  fc(val: number | null | undefined): string {
    if (val == null) return '—';
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  formatCurrency(val: number | null): string { return this.fc(val); }

  formatPct(val: number | null): string {
    if (val == null) return '—';
    return val + '%';
  }

  get revenueTotal(): number {
    return this.revenueEntries.reduce((s, e) => s + Number(e.totalRevenue), 0);
  }
}
