import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ViewChild, ElementRef, ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import SignaturePad from 'signature_pad';
import { EWasteService } from '../../services/e-waste/e-waste';
import { environment } from '../../../environment/environment.prod';

@Component({
  selector: 'app-e-waste',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, DialogModule, SelectModule, InputTextModule,
    CheckboxModule, TooltipModule, FloatLabelModule, DatePickerModule,
  ],
  templateUrl: './e-waste.html',
  styleUrl: './e-waste.css',
  providers: [MessageService],
})
export class EWaste implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sigCanvas') sigCanvasRef!: ElementRef<HTMLCanvasElement>;

  private eWasteService = inject(EWasteService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  userRole = localStorage.getItem('role') || '';
  employeeId = Number(localStorage.getItem('employeeDbId') || 0);

  records: any[] = [];
  total = 0;
  loading = false;
  page = 1;
  limit = 20;

  statusFilter: string | null = null;
  statusOptions = [
    { label: 'All',                value: null },
    { label: 'Pending HOD',        value: 'PENDING_HOD' },
    { label: 'Pending Operations', value: 'PENDING_OPERATIONS' },
    { label: 'Pending Security',   value: 'PENDING_SECURITY' },
    { label: 'Closed',             value: 'CLOSED' },
  ];

  // ── Detail / Certificate panel ─────────────────────────────────
  selectedRecord: any = null;
  showDetail = false;
  detailLoading = false;

  // ── Sign dialog ────────────────────────────────────────────────
  showSignDialog = false;
  signStage: 'HOD' | 'OPERATIONS' | 'SECURITY' = 'HOD';
  signSaving = false;
  signPad: SignaturePad | null = null;

  // Sign form fields
  signRemarks = '';
  signGatePassNo = '';
  signAssetCondition: string | null = null;
  signDataWiped = false;
  signDataWipeMethod: string | null = null;
  signRecyclerName = '';
  signRecyclerAuthNo = '';
  signRecyclerContact = '';
  signHandoverDate: Date | null = null;

  assetConditionOptions = [
    { label: 'Functional',     value: 'FUNCTIONAL' },
    { label: 'Non-Functional', value: 'NON_FUNCTIONAL' },
    { label: 'Damaged',        value: 'DAMAGED' },
  ];
  dataWipeMethodOptions = [
    { label: 'DBAN (Boot & Nuke)',      value: 'DBAN' },
    { label: 'Secure Erase (SSD/NVMe)', value: 'SECURE_ERASE' },
    { label: 'Physical Destruction',    value: 'PHYSICAL_DESTRUCTION' },
    { label: 'Not Applicable',          value: 'NA' },
  ];

  // ── Recycler certificate upload ────────────────────────────────
  certUploading = false;

  uploadRecyclerCert(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.selectedRecord) return;
    this.certUploading = true;
    this.eWasteService.uploadCert(this.selectedRecord.id, file).subscribe({
      next: (res: any) => {
        this.selectedRecord = res.data;
        this.certUploading = false;
        this.messageService.add({ severity: 'success', summary: 'Uploaded', detail: 'Recycler certificate uploaded.' });
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.certUploading = false;
        this.messageService.add({ severity: 'error', summary: 'Upload Failed', detail: err?.error?.message || 'Failed to upload' });
        this.cdr.detectChanges();
      }
    });
    input.value = ''; // reset so same file can be re-uploaded
  }

  get recyclerCertUrl(): string | null {
    if (!this.selectedRecord?.eWasteCertUrl) return null;
    const base = environment.apiUrl.replace(/\/api$/, '');
    return `${base}${this.selectedRecord.eWasteCertUrl}`;
  }

  // ── Certificate print ──────────────────────────────────────────
  showCertificate = false;

  ngOnInit() { this.loadRecords(); }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.destroyPad();
    document.body.classList.remove('printing-ewaste'); // clean up if destroyed mid-print
  }

  loadRecords() {
    this.loading = true;
    const filters: any = { page: this.page, limit: this.limit };
    if (this.statusFilter) filters.status = this.statusFilter;

    this.eWasteService.getAll(filters).subscribe({
      next: (res: any) => {
        this.records = res.data ?? [];
        this.total = res.pagination?.total ?? 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  openDetail(record: any) {
    this.detailLoading = true;
    this.showDetail = true;
    this.showCertificate = false;
    this.eWasteService.getById(record.id).subscribe({
      next: (data: any) => {
        this.selectedRecord = data;
        this.detailLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.detailLoading = false; this.cdr.detectChanges(); }
    });
  }

  // ── Sign dialog ────────────────────────────────────────────────
  openSignDialog(stage: 'HOD' | 'OPERATIONS' | 'SECURITY') {
    this.signStage = stage;
    this.signRemarks = '';
    this.signGatePassNo = '';
    this.signAssetCondition = null;
    this.signDataWiped = false;
    this.signDataWipeMethod = null;
    this.signRecyclerName = this.selectedRecord?.recyclerName || '';
    this.signRecyclerAuthNo = this.selectedRecord?.recyclerAuthNo || '';
    this.signRecyclerContact = this.selectedRecord?.recyclerContact || '';
    this.signHandoverDate = this.selectedRecord?.handoverDate ? new Date(this.selectedRecord.handoverDate) : null;
    this.showSignDialog = true;
    this.cdr.detectChanges();
    // Initialise signature pad after dialog renders
    setTimeout(() => this.initPad(), 200);
  }

  initPad() {
    const canvas = this.sigCanvasRef?.nativeElement;
    if (!canvas) return;
    this.destroyPad();
    // Make canvas fill its container
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width  = rect.width  || 500;
    canvas.height = 180;
    this.signPad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255,255,255)',
      penColor: '#1e3a5f',
      minWidth: 1.5,
      maxWidth: 3,
    });
  }

  clearPad() { this.signPad?.clear(); }

  destroyPad() {
    if (this.signPad) { this.signPad.off(); this.signPad = null; }
  }

  get isSignEmpty(): boolean {
    return !this.signPad || this.signPad.isEmpty();
  }

  submitSign() {
    if (this.isSignEmpty) {
      this.messageService.add({ severity: 'warn', summary: 'Signature Required', detail: 'Please draw your signature before submitting.' });
      return;
    }
    const signature = this.signPad!.toDataURL('image/png');
    const id = this.selectedRecord.id;
    this.signSaving = true;

    let obs;
    if (this.signStage === 'HOD') {
      obs = this.eWasteService.hodSign(id, {
        signature,
        remarks: this.signRemarks,
        assetCondition: this.signAssetCondition,
        dataWiped: this.signDataWiped,
        dataWipeMethod: this.signDataWipeMethod,
        recyclerName: this.signRecyclerName,
        recyclerAuthNo: this.signRecyclerAuthNo,
        recyclerContact: this.signRecyclerContact,
        handoverDate: this.signHandoverDate,
      });
    } else if (this.signStage === 'OPERATIONS') {
      obs = this.eWasteService.operationsSign(id, { signature, remarks: this.signRemarks });
    } else {
      obs = this.eWasteService.securitySign(id, { signature, remarks: this.signRemarks, gatePassNo: this.signGatePassNo });
    }

    obs.subscribe({
      next: (res: any) => {
        this.selectedRecord = res.data;
        this.showSignDialog = false;
        this.signSaving = false;
        this.destroyPad();
        this.loadRecords();
        this.messageService.add({ severity: 'success', summary: 'Signed', detail: res.message });
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.signSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to sign' });
        this.cdr.detectChanges();
      }
    });
  }

  onSignDialogHide() { this.destroyPad(); }

  // ── Helpers ────────────────────────────────────────────────────
  canSignHOD(): boolean {
    return this.selectedRecord?.status === 'PENDING_HOD' &&
      ['ADMIN', 'HOD', 'DEPARTMENT_HEAD'].includes(this.userRole);
  }
  canSignOperations(): boolean {
    return this.selectedRecord?.status === 'PENDING_OPERATIONS' &&
      ['ADMIN', 'OPERATIONS'].includes(this.userRole);
  }
  canSignSecurity(): boolean {
    return this.selectedRecord?.status === 'PENDING_SECURITY' &&
      ['ADMIN', 'SECURITY', 'OPERATIONS'].includes(this.userRole);
  }

  stageLabel(status: string): string {
    const map: Record<string, string> = {
      'PENDING_HOD':        'Awaiting HOD',
      'PENDING_OPERATIONS': 'Awaiting Operations',
      'PENDING_SECURITY':   'Awaiting Security',
      'CLOSED':             'Closed',
    };
    return map[status] ?? status;
  }

  stageSeverity(status: string): string {
    const map: Record<string, string> = {
      'PENDING_HOD':        'warn',
      'PENDING_OPERATIONS': 'warn',
      'PENDING_SECURITY':   'warn',
      'CLOSED':             'success',
    };
    return map[status] ?? 'secondary';
  }

  printCertificate() {
    this.showCertificate = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      const certEl = document.querySelector('.ewaste-print-target') as HTMLElement;
      if (!certEl) return;
      // Move certificate to body level so it isn't hidden by ancestor display:none
      const placeholder = document.createComment('ewaste-cert-placeholder');
      certEl.parentNode!.insertBefore(placeholder, certEl);
      document.body.appendChild(certEl);
      certEl.style.display = 'block';
      document.body.classList.add('printing-ewaste');
      window.print();
      window.addEventListener('afterprint', () => {
        document.body.classList.remove('printing-ewaste');
        // Move it back to its original position
        placeholder.parentNode!.insertBefore(certEl, placeholder);
        placeholder.parentNode!.removeChild(placeholder);
        certEl.style.display = '';
        this.showCertificate = false;
        this.cdr.detectChanges();
      }, { once: true });
    }, 300);
  }

  formatDate(d: string | Date | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
