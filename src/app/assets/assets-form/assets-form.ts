import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { InputTextModule } from "primeng/inputtext";
import { FloatLabelModule } from "primeng/floatlabel";
import { SelectModule } from "primeng/select";
import { DatePickerModule } from "primeng/datepicker";
import { TableModule } from "primeng/table";
import { CheckboxModule } from "primeng/checkbox";
import { DialogModule } from "primeng/dialog";
import { TabViewModule } from "primeng/tabview";
import { ButtonModule } from "primeng/button";
import { TextareaModule } from "primeng/textarea";

// Services
import { Assets } from "../../services/assets/assets";
import { Branches } from "../../services/branches/branches";
import { Location } from "../../services/location/location";
import { Transferr } from "../../services/transfer/transferr";
import { Auth } from "../../services/auth/auth";

// router + toast
import { ActivatedRoute } from "@angular/router";
import { MessageService } from "primeng/api";

@Component({
  selector: "app-assets-form",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    FloatLabelModule,
    SelectModule,
    DatePickerModule,
    TableModule,
    TextareaModule,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    TabViewModule
  ],
  providers: [MessageService],
  templateUrl: "./assets-form.html",
  styleUrl: "./assets-form.css",
})
export class AssetsForm implements OnInit {

  role: "store_user" | "department_user" | "superadmin" = "store_user";
  activeTab = 0;

  // =============================
  // DROPDOWNS
  // =============================
  assetTypes = [
    { label: "Fixed", value: "FIXED" },
    { label: "Movable", value: "MOVABLE" }
  ];

  procurementModes = [
    { label: "Purchase", value: "PURCHASE" },
    { label: "Donation", value: "DONATION" },
    { label: "Lease", value: "LEASE" },
    { label: "Rental / On-Hire", value: "RENTAL" },
  ];

  donationConditions = [
    { label: "New", value: "NEW" },
    { label: "Used", value: "USED" }
  ];

  assignmentTypes = [
    { label: "Permanent", value: "PERMANENT" },
    { label: "Temporary", value: "TEMPORARY" }
  ];

  inspectionStatuses = [
    { label: "Accepted", value: "ACCEPTED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Accepted with Remarks", value: "ACCEPTED_WITH_REMARKS" }
  ];

  depreciationMethods = [
    { label: "Straight Line", value: "SL" },
    { label: "Declining Balance", value: "DB" },
    { label: "Other", value: "OTHER" }
  ];

  slaUnits = [
    { label: "Hours", value: "HOURS" },
    { label: "Days", value: "DAYS" },
    { label: "Months", value: "MONTHS" },
    { label: "Years", value: "YEARS" }
  ];

  departments: any[] = [];
  vendors: any[] = [];
  categories: any[] = [];
  employees: any[] = [];
  branches: any[] = [];

  // ==============================
  // ASSET DATA MODEL (frontend)
  // ==============================
  asset: any = {
    id: null,
    assetId: "",
    assetName: "",
    assetType: "",
    assetCategoryId: null,
    serialNumber: "",
    assetPhoto: "",
    rfidCode: "",
    modeOfProcurement: "",

    // purchase
    invoiceNumber: "",
    purchaseOrderNo: "",
    purchaseOrderDate: null,
    purchaseDate: null,
    purchaseCost: null,
    vendorId: null,
    warrantyStart: null,
    warrantyEnd: null,
    amcDetails: "",

    // donation
    donorName: "",
    donationDate: null,
    assetCondition: "",
    estimatedValue: null,

    // lease
    leaseStartDate: null,
    leaseEndDate: null,
    leaseAmount: null,

    // rental
    rentalStartDate: null,
    rentalEndDate: null,
    rentalAmount: null,

    // GRN
    grnNumber: "",
    grnDate: null,
    grnValue: null,
    inspectionStatus: "",
    inspectionRemarks: "",

    // Assignment
    departmentId: null,
    assignmentType: "",

    // Depreciation
    depreciationMethod: "",
    depreciationRate: null,
    expectedLifeYears: null,
    salvageValue: null,
    depreciationStartDate: null,

    // Insurance
    insuranceProvider: "",
    policyNumber: "",
    coverageAmount: null,
    premiumAmount: null,
    insuranceStartDate: null,
    insuranceEndDate: null,
    notes: "",

    // SLA
    slaExpectedValue: null,
    slaExpectedUnit: "",
    slaDetails: "",
    expectedLifetime: null,
    expectedLifetimeUnit: "",

    // Location
    branchId: null,
    block: "",
    floor: "",
    room: "",
    employeeResponsibleId: null,

    status: "PENDING_COMPLETION",
  };

  // histories
  locationHistory: any[] = [];
  transferHistory: any[] = [];

  // transfer modal
  showTransferModal = false;
  transfer: any = {
    assetId: null,
    toBranchId: null,
    temporary: false,
    expiresAt: null,
    approvedBy: ""
  };

  // =============================
  // INIT
  // =============================
  constructor(
    private assetAPI: Assets,
    private branchAPI: Branches,
    private locationAPI: Location,
    private transferAPI: Transferr,
    private auth: Auth,
    private route: ActivatedRoute,
    private toastService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.role = this.auth.getRole() as any;

    this.loadDropdowns();
    this.checkEditMode();
  }

  // load dropdown dependencies
  loadDropdowns() {
    this.assetAPI.getCategories().subscribe(res => {
      setTimeout(() => {
        this.categories = res;
        this.cdr.detectChanges();
      });
    });

    this.assetAPI.getVendors().subscribe(res => {
      setTimeout(() => this.vendors = res);
    });

    this.assetAPI.getDepartments().subscribe(res => {
      setTimeout(() => this.departments = res);
    });

    this.assetAPI.getEmployees().subscribe(res => {
      setTimeout(() => this.employees = res);
    });

    this.branchAPI.getBranches().subscribe(res => {
      setTimeout(() => this.branches = res);
    });
  }

  checkEditMode() {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) return;

    this.assetAPI.getAssetByAssetId(id).subscribe(res => {
      this.asset = { ...res };
      this.transfer.assetId = res.id;

      this.loadLocationHistory(res.id);
      this.loadTransferHistory(res.id);
    });
  }

  // ================================
  // PHASE 1 SAVE BASIC DETAILS
  // ================================
  saveBasicDetails(form: any) {
    if (!form.valid)
      return this.toast("error", "Fill required fields");

    this.assetAPI.createAsset(this.asset).subscribe({
      next: res => {
        this.asset.id = res.id;
        this.asset.assetId = res.assetId;
        this.toast("success", "Basic details saved");
      },
      error: () => this.toast("error", "Failed to save")
    });
  }

  // RESET FORM
  clearForm() {
    this.asset = {};
  }

  // ================================
  // UPDATE SECTIONS (PHASE 2)
  // ================================
  updateSection(message: string) {
    if (!this.asset.id) return this.toast("error", "Save basic details first");

    this.assetAPI.updateAsset(this.asset.id, this.asset).subscribe({
      next: () => this.toast("success", message),
      error: () => this.toast("error", "Failed to update")
    });
  }

  saveProcurement() { this.updateSection("Procurement updated"); }
  saveDepreciation() { this.updateSection("Depreciation updated"); }
  saveInsurance() { this.updateSection("Insurance updated"); }
  saveSLA() { this.updateSection("SLA updated"); }

  // ================================
  // LOCATION MANAGEMENT
  // ================================
  saveLocation() {
    if (!this.asset.id) return;

    const payload = {
      assetId: this.asset.id,
      branchId: this.asset.branchId,
      block: this.asset.block,
      floor: this.asset.floor,
      room: this.asset.room,
      employeeResponsibleId: this.asset.employeeResponsibleId,
    };

    this.locationAPI.updateLocation(this.asset.id, payload).subscribe({
      next: () => {
        this.toast("success", "Location updated");
        this.loadLocationHistory(this.asset.id);
      },
      error: () => this.toast("error", "Failed")
    });
  }

  loadLocationHistory(id: number) {
    this.locationAPI.getHistory(id).subscribe(res => this.locationHistory = res);
  }

  // ================================
  // TRANSFER
  // ================================
  submitTransfer() {
    if (!this.asset.id) return;

    this.transferAPI.makeTransfer(this.asset.id, this.transfer).subscribe({
      next: () => {
        this.toast("success", "Transferred");
        this.loadTransferHistory(this.asset.id);
        this.showTransferModal = false;
      },
      error: () => this.toast("error", "Transfer failed")
    });
  }

  loadTransferHistory(id: number) {
    this.transferAPI.getHistory(id).subscribe(res => this.transferHistory = res);
  }

  // ================================
  // IMAGE UPLOAD
  // ================================
  handlePhotoUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.asset.assetPhoto = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // ================================
  // TOAST
  // ================================
  toast(severity: string, detail: string) {
    this.toastService.add({
      severity,
      summary: "Info",
      detail
    });
  }
}
