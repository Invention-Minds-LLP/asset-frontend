import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { TenantConfigService } from '../../services/tenant-config/tenant-config';

@Component({
  selector: 'app-tenant-config',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, InputTextModule, SelectModule,
  ],
  templateUrl: './tenant-config.html',
  styleUrl: './tenant-config.css',
  providers: [MessageService]
})
export class TenantConfig implements OnInit {
  configs: any[] = [];
  loading = false;
  saving: { [key: string]: boolean } = {};

  configGroups: string[] = ['PROCUREMENT', 'STORE', 'WORKORDER', 'RCA', 'ANALYTICS'];

  constructor(
    private configService: TenantConfigService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadConfigs();
  }

  loadConfigs() {
    this.loading = true;
    this.configService.getAll().subscribe({
      next: (data: any) => {
        this.configs = Array.isArray(data) ? data : (data?.data ?? []);
        this.loading = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.loading = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  getConfigsByGroup(group: string): any[] {
    return this.configs.filter(c => c.group === group);
  }

  isBoolean(config: any): boolean {
    return config.value === 'true' || config.value === 'false' || config.dataType === 'boolean';
  }

  getBoolValue(config: any): boolean {
    return config.value === 'true';
  }

  toggleConfig(config: any) {
    const newValue = config.value === 'true' ? 'false' : 'true';
    this.updateConfig(config.key, newValue);
  }

  updateConfig(key: string, value: string) {
    this.saving[key] = true;
    this.configService.update(key, { value }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: `Configuration "${key}" updated.` });
        this.saving[key] = false;
        const cfg = this.configs.find(c => c.key === key);
        if (cfg) cfg.value = value;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to update configuration.' });
        this.saving[key] = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  seedDefaults() {
    this.loading = true;
    this.configService.seedDefaults().subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Seeded', detail: 'Default configurations have been created.' });
        this.loadConfigs();
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to seed defaults.' });
        this.loading = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  getGroupIcon(group: string): string {
    const map: any = {
      PROCUREMENT: 'pi pi-shopping-cart',
      STORE: 'pi pi-warehouse',
      WORKORDER: 'pi pi-wrench',
      RCA: 'pi pi-search',
      ANALYTICS: 'pi pi-chart-bar',
    };
    return map[group] || 'pi pi-cog';
  }
}
