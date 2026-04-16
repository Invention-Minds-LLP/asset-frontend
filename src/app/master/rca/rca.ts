import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { RcaService } from '../../services/rca/rca';

@Component({
  selector: 'app-rca',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, DialogModule, InputTextModule, TextareaModule],
  templateUrl: './rca.html',
  styleUrl: './rca.css',
  providers: [MessageService]
})
export class RcaPage implements OnInit {
  rcas: any[] = [];
  loading = false;

  selectedRca: any = null;
  showDetailDialog = false;

  constructor(
    private rcaService: RcaService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading = true;
    this.rcaService.getAll().subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.rcas = res.data || res || [];
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load RCA records' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  viewRca(rca: any) {
    this.rcaService.getById(rca.id).subscribe({
      next: (res: any) => {
        this.selectedRca = res;
        this.showDetailDialog = true;
        this.cdr.detectChanges();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load RCA detail' })
    });
  }

  getStatusSeverity(status: string): 'warn' | 'success' | 'danger' | 'secondary' {
    if (status === 'CLOSED') return 'success';
    if (status === 'IN_PROGRESS') return 'warn';
    if (status === 'DRAFT') return 'secondary';
    return 'secondary';
  }

  getFrameworkSeverity(fw: string): 'info' | 'warn' | 'success' {
    if (fw === 'FIVE_WHYS') return 'info';
    if (fw === 'SIX_M') return 'warn';
    return 'success';
  }

  formatDate(d: any): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
