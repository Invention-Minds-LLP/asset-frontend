import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Assets } from '../../services/assets/assets';
import { ChangeDetectorRef } from '@angular/core';
import { AssetEditService } from '../../services/assets/assets-edit';
import { Router } from '@angular/router';
import { Skeleton } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';

type FilterField = 'assetName' | 'assetId' | 'assignedTo' | 'assignedBy';

@Component({
  selector: 'app-asset-assignment',
  imports: [TableModule, ButtonModule, InputTextModule, DropdownModule, FormsModule,
    CommonModule, IconFieldModule, InputIconModule, Skeleton, DialogModule, TextareaModule],
  templateUrl: './asset-assignment.html',
  styleUrl: './asset-assignment.css'
})
export class AssetAssignment {
  assignments: any[] = [];
  darkMode = false;
  currentPage = 1;
  rowsPerPage = 10;
  selectedFilter: FilterField = 'assetName';
  searchTerm: string = '';
  filteredActive: boolean = false;
  assets: any[] = [];
  assetsLoaded = false;
  activeAssets: number = 0;
  isLoading: boolean = true;
  filterOptions = [
    { label: 'Asset Name', value: 'assetName' },
    { label: 'Asset ID', value: 'assetId' },
    { label: 'Assigned To', value: 'assignedTo' },
    { label: 'Assigned By', value: 'assignedBy' }
  ];


  dropdownVisible = false;

  showRejectDialog = false;
  rejectReason = '';
  selectedAssignmentId!: number;
  selectedAssignment: any = null;

  showAckDialog = false;
  ackNote = '';
  selectedFile!: File | null;

  @ViewChild('signatureCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private lastX = 0;
  private lastY = 0;
  checklistItems: any[] = [];
  checklistResponses: {
    itemId: number;
    checked: boolean;
    remarks: string;
  }[] = [];

  checklistLoading = false;
  ackError = '';



  constructor(private assetService: Assets, private cdr: ChangeDetectorRef, private assetEditService: AssetEditService, private router: Router) { }

  @ViewChild('filterContainer') filterContainerRef!: ElementRef;
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const targetElement = event.target as HTMLElement;
    if (
      !targetElement.closest('.filter') ||
      !targetElement.closest('.filter-menu')
    ) {
      this.dropdownVisible = false;
      console.log("Clicked outside the filter dropdown, closing it.");
    }
  }

  ngOnInit() {
    this.assetService.getMyPendingAcknowledgements().subscribe((res) => {
      setTimeout(() => {
        this.assignments = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    });
  }

  get paginatedAssignments() {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredAssignments.slice(start, start + this.rowsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredAssignments.length / this.rowsPerPage) || 1;
  }
  refresh() {
    console.log("Refreshing data...");
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
  applyFilter() {
    this.currentPage = 1;
  }

  selectFilter(value: any, event: MouseEvent) {
    event.stopPropagation();
    this.selectedFilter = value;
    this.dropdownVisible = false;
    this.filteredActive = true;
    console.log(this.dropdownVisible);
  }
  get isFilterActive(): boolean {
    return this.filteredActive;
  }
  clearFilter() {
    this.searchTerm = '';
    this.currentPage = 1;
    this.selectedFilter = 'assetName';
    this.filteredActive = false;
    console.log('Filter cleared.');
  }


  toggleFilterDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.dropdownVisible = !this.dropdownVisible;
  }


  refreshList() {
    this.assetService.getMyPendingAcknowledgements().subscribe(res => {
      this.assignments = res;
    });
  }
  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'ACKNOWLEDGED': return 'green';
      case 'REJECTED': return 'red';
      default: return 'gray';
    }
  }
  get filteredAssignments() {
    if (!this.searchTerm) return this.assignments;

    const term = this.searchTerm.toLowerCase();

    return this.assignments.filter(item => {
      switch (this.selectedFilter) {
        case 'assetName':
          return item.asset?.assetName?.toLowerCase().includes(term);

        case 'assetId':
          return item.asset?.assetId?.toLowerCase().includes(term);

        case 'assignedTo':
          return item.assignedTo?.name?.toLowerCase().includes(term);

        case 'assignedBy':
          return item.assignedBy?.name?.toLowerCase().includes(term);

        default:
          return false;
      }
    });
  }
  openReject(item: any) {
    this.selectedAssignmentId = item.id;
    this.selectedAssignment = item;
    this.rejectReason = '';
    this.showRejectDialog = true;
  }
openAcknowledge(item: any) {
  this.selectedAssignmentId = item.id;
  this.selectedAssignment = item;
  this.showAckDialog = true;

  this.ackNote = '';
  this.selectedFile = null;
  this.ackError = '';
  this.checklistItems = [];
  this.checklistResponses = [];
  this.checklistLoading = true;

  this.assetService.getAssignmentChecklist(item.id).subscribe({
    next: (res) => {
      this.checklistItems = res?.items || [];
      this.checklistResponses = this.checklistItems.map((x: any) => ({
        itemId: x.id,
        checked: false,
        remarks: ''
      }));

      this.checklistLoading = false;

      setTimeout(() => this.initCanvas(), 0);
    },
    error: () => {
      this.checklistLoading = false;
      this.ackError = 'Failed to load checklist';
      setTimeout(() => this.initCanvas(), 0);
    }
  });
}
isChecklistValid(): boolean {
  for (let i = 0; i < this.checklistItems.length; i++) {
    const item = this.checklistItems[i];
    const response = this.checklistResponses[i];

    if (item?.isRequired && !response?.checked) {
      return false;
    }
  }
  return true;
}

getChecklistError(): string {
  for (let i = 0; i < this.checklistItems.length; i++) {
    const item = this.checklistItems[i];
    const response = this.checklistResponses[i];

    if (item?.isRequired && !response?.checked) {
      return `${item.title} is required`;
    }
  }
  return '';
}
  confirmReject() {
    this.assetService.rejectAssignment(this.selectedAssignmentId, {
      rejectionReason: this.rejectReason
    }).subscribe(() => {
      this.showRejectDialog = false;
      this.refreshList();
    });
  }
  // confirmAcknowledge() {
  //   const signature = this.canvas.nativeElement.toDataURL();

  //   const formData = new FormData();
  //   formData.append('acknowledgementNote', this.ackNote || '');
  //   formData.append('digitalSignature', signature);

  //   if (this.selectedFile) {
  //     formData.append('photo', this.selectedFile);
  //   }

  //   this.assetService.acknowledgeAssignment(this.selectedAssignmentId, formData)
  //     .subscribe(() => {
  //       this.showAckDialog = false;
  //       this.refreshList();
  //     });
  // }
  confirmAcknowledge() {
  this.ackError = '';

  if (!this.isChecklistValid()) {
    this.ackError = this.getChecklistError();
    return;
  }

  const signature = this.canvas?.nativeElement?.toDataURL() || '';

  const formData = new FormData();
  formData.append('acknowledgementNote', this.ackNote || '');
  formData.append('digitalSignature', signature);
  formData.append('checklist', JSON.stringify(this.checklistResponses));

  if (this.selectedFile) {
    formData.append('photo', this.selectedFile);
  }

  this.assetService.acknowledgeAssignment(this.selectedAssignmentId, formData)
    .subscribe({
      next: () => {
        this.showAckDialog = false;
        this.refreshList();
      },
      error: (err) => {
        this.ackError =
          err?.error?.message ||
          'Failed to acknowledge assignment';
      }
    });
}
  initCanvas() {
    const canvas = this.canvas.nativeElement;

    // (optional) high-DPI crisp drawing
    const dpr = window.devicePixelRatio || 1;

    // Match internal buffer to displayed size
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    this.ctx = canvas.getContext('2d')!;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // normalize drawing coordinates
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#111'; // or use var based color if you want

    // IMPORTANT: remove old listeners if dialog opens multiple times
    canvas.onpointerdown = (e) => this.onPointerDown(e);
    canvas.onpointermove = (e) => this.onPointerMove(e);
    canvas.onpointerup = () => this.onPointerUp();
    canvas.onpointerleave = () => this.onPointerUp();

    // Prevent scrolling while signing on touch devices
    canvas.style.touchAction = 'none';
  }

  private getCanvasPoint(e: PointerEvent) {
    const canvas = this.canvas.nativeElement;
    const rect = canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    return { x, y };
  }

  private onPointerDown(e: PointerEvent) {
    e.preventDefault();
    const canvas = this.canvas.nativeElement;
    canvas.setPointerCapture(e.pointerId);

    this.drawing = true;

    const p = this.getCanvasPoint(e);
    this.lastX = p.x;
    this.lastY = p.y;

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.drawing) return;
    e.preventDefault();

    const p = this.getCanvasPoint(e);

    this.ctx.lineTo(p.x, p.y);
    this.ctx.stroke();

    // prepare for next segment
    this.lastX = p.x;
    this.lastY = p.y;
  }

  private onPointerUp() {
    this.drawing = false;
    this.ctx.beginPath();
  }

  clearSignature() {
    const canvas = this.canvas.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.beginPath();
  }

  draw(event: MouseEvent) {
    if (!this.drawing) return;

    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';

    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }


  onFileSelect(event: any) {
    this.selectedFile = event.target.files[0];
  }
  resetAckDialog() {
  this.showAckDialog = false;
  this.ackNote = '';
  this.selectedFile = null;
  this.ackError = '';
  this.checklistItems = [];
  this.checklistResponses = [];
}
}

