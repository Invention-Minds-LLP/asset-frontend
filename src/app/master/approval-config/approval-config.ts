import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ApprovalConfigService } from '../../services/approval-config/approval-config.service';

interface ApprovalConfigRow {
  id?: number;
  module: string;
  level: number;
  roleName: string;
  minAmount: number;
  maxAmount: number | null;
  isActive: boolean;
}

@Component({
  selector: 'app-approval-config',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, InputTextModule, InputNumberModule, SelectModule,
    DialogModule, ToggleSwitchModule, ConfirmPopupModule,
  ],
  templateUrl: './approval-config.html',
  providers: [MessageService, ConfirmationService],
})
export class ApprovalConfigComponent implements OnInit {
  configs: ApprovalConfigRow[] = [];
  loading = false;
  seeding = false;

  // Dialog
  dialogVisible = false;
  dialogTitle = '';
  saving = false;
  editRow: ApprovalConfigRow = this.emptyRow();

  readonly modules = ['PURCHASE_ORDER', 'WORK_ORDER', 'DISPOSAL'];
  readonly activeModule: Record<string, boolean> = {
    PURCHASE_ORDER: true,
    WORK_ORDER: true,
    DISPOSAL: true,
  };

  readonly moduleLabels: Record<string, string> = {
    PURCHASE_ORDER: 'Purchase Orders',
    WORK_ORDER: 'Work Orders',
    DISPOSAL: 'Disposals',
  };

  readonly moduleIcons: Record<string, string> = {
    PURCHASE_ORDER: 'pi pi-shopping-cart',
    WORK_ORDER: 'pi pi-wrench',
    DISPOSAL: 'pi pi-trash',
  };

  readonly roleOptions = [
    { label: 'HOD — Department Head', value: 'HOD' },
    { label: 'MANAGEMENT — Finance / Senior Mgmt', value: 'MANAGEMENT' },
    { label: 'COO — Chief Operating Officer', value: 'COO' },
    { label: 'CFO — Chief Financial Officer / Admin', value: 'CFO' },
  ];

  readonly roleAuthority: Record<string, string> = {
    HOD:        'HOD, Finance, CEO/COO, Admin',
    MANAGEMENT: 'Finance, CEO/COO, Admin',
    COO:        'CEO/COO, Admin',
    CFO:        'Admin only',
  };

  constructor(
    private svc: ApprovalConfigService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: (data: any) => {
        this.configs = Array.isArray(data) ? data : (data?.data ?? []);
        this.loading = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.loading = false;
        setTimeout(() => this.cdr.detectChanges());
      },
    });
  }

  configsForModule(module: string): ApprovalConfigRow[] {
    return this.configs
      .filter(c => c.module === module)
      .sort((a, b) => a.level - b.level);
  }

  openAdd(module: string) {
    const existing = this.configsForModule(module);
    this.editRow = {
      ...this.emptyRow(),
      module,
      level: existing.length + 1,
    };
    this.dialogTitle = `Add Level — ${this.moduleLabels[module]}`;
    this.dialogVisible = true;
  }

  openEdit(row: ApprovalConfigRow) {
    this.editRow = { ...row };
    this.dialogTitle = `Edit Level ${row.level} — ${this.moduleLabels[row.module]}`;
    this.dialogVisible = true;
  }

  save() {
    if (!this.editRow.roleName || this.editRow.minAmount == null) {
      this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'Role and Min Amount are required.' });
      return;
    }
    this.saving = true;
    const call = this.editRow.id
      ? this.svc.update(this.editRow.id, this.editRow)
      : this.svc.create(this.editRow);

    call.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Approval config saved.' });
        this.dialogVisible = false;
        this.saving = false;
        this.loadAll();
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.error || 'Save failed.' });
        this.saving = false;
      },
    });
  }

  confirmDelete(event: Event, row: ApprovalConfigRow) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete Level ${row.level} (${row.roleName}) for ${this.moduleLabels[row.module]}?`,
      accept: () => {
        this.svc.delete(row.id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Config deleted.' });
            this.loadAll();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Delete failed.' }),
        });
      },
    });
  }

  seedDefaults() {
    this.seeding = true;
    this.svc.seedDefaults().subscribe({
      next: (res: any) => {
        this.messageService.add({ severity: 'success', summary: 'Seeded', detail: `${res.count} default configs loaded.` });
        this.seeding = false;
        this.loadAll();
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.error || 'Seeding failed.' });
        this.seeding = false;
      },
    });
  }

  toggleActive(row: ApprovalConfigRow) {
    this.svc.update(row.id!, { isActive: row.isActive }).subscribe({
      next: () => this.messageService.add({ severity: 'success', summary: 'Updated', detail: `Level ${row.level} ${row.isActive ? 'enabled' : 'disabled'}.` }),
      error: () => { row.isActive = !row.isActive; },
    });
  }

  formatAmount(val: number | null): string {
    if (val == null) return '∞';
    return '₹' + val.toLocaleString('en-IN');
  }

  private emptyRow(): ApprovalConfigRow {
    return { module: 'PURCHASE_ORDER', level: 1, roleName: '', minAmount: 0, maxAmount: null, isActive: true };
  }
}
