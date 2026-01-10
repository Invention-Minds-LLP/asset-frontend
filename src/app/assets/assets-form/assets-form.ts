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
import { WarrantyForm } from "../../warranty/warranty-form/warranty-form";

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
    TabViewModule,
    WarrantyForm
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
    supervisorId: null,     // ✅ NEW
    allottedToId: null,     // end user

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
    // slaDetails: "",
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
  transfer = {
    transferType: 'INTERNAL', // INTERNAL | EXTERNAL
    externalType: null,       // BRANCH | SERVICE | DEAD

    toBranchId: null,

    block: '',
    floor: '',
    room: '',

    temporary: false,
    expiresAt: null,
    approvedBy: '',
    assetId: null
  };

  pendingAssetImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  currentLocationId?: number;


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
  ) { }

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
      // this.asset = { ...res };
      this.loadAsset(res);
      this.transfer.assetId = res.id;

      this.loadLocationHistory(res.id);
      this.loadTransferHistory(res.id);
      this.loadCurrentLocation();

    });

  }
  loadAsset(asset: any) {

    // convert ISO strings → Date objects
    const dateFields = [
      "purchaseDate",
      "purchaseOrderDate",
      "donationDate",
      "leaseStartDate",
      "leaseEndDate",
      "rentalStartDate",
      "rentalEndDate",
      "grnDate",
      "insuranceStartDate",
      "insuranceEndDate",
      "depreciationStartDate"
    ];

    dateFields.forEach(field => {
      if (asset[field]) {
        asset[field] = new Date(asset[field]);
      }
    });

    if (asset.locations?.length) {
      const loc = asset.locations[0];
      asset.branchId = loc.branchId;
      asset.block = loc.block;
      asset.floor = loc.floor;
      asset.room = loc.room;
      asset.employeeResponsibleId = loc.employeeResponsibleId;

      this.currentLocationId = loc.id;
    }
    // 🔥 MAP DEPRECIATION
    if (asset.depreciation) {
      asset.depreciationMethod = asset.depreciation.depreciationMethod;
      asset.depreciationRate = asset.depreciation.depreciationRate;
      asset.expectedLifeYears = asset.depreciation.expectedLifeYears;
      asset.salvageValue = asset.depreciation.salvageValue;
      asset.depreciationStartDate = asset.depreciation.depreciationStart;
    } else {
      // ensure object exists to avoid undefined errors
      asset.depreciation = {};
    }// 🔥 MAP INSURANCE (take active/latest insurance)
    if (asset.insurance && asset.insurance.length > 0) {
      const ins = asset.insurance.find((i: any) => i.isActive) || asset.insurance[0];

      asset.insurance = ins; // keep reference for update
      asset.insuranceProvider = ins.provider;
      asset.policyNumber = ins.policyNumber;
      asset.coverageAmount = ins.coverageAmount;
      asset.premiumAmount = ins.premiumAmount;
      asset.insuranceStartDate = ins.startDate ? new Date(ins.startDate) : null;
      asset.insuranceEndDate = ins.endDate ? new Date(ins.endDate) : null;
      asset.notes = ins.notes;
    } else {
      // ensure object exists to avoid undefined errors
      asset.insurance = {};
    }

    asset.slaExpectedValue = asset.slaExpectedValue ?? null;
asset.slaExpectedUnit = asset.slaExpectedUnit ?? '';


    this.asset = asset;
    console.log(this.asset)


    // FIX ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
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
        if (this.pendingAssetImageFile) {
          this.assetAPI.uploadAssetImage(this.pendingAssetImageFile, res.assetId)
            .subscribe({
              next: (imageUrl) => {
                console.log("Uploaded image URL:", imageUrl);

                // Update backend model
                this.asset.assetPhoto = imageUrl;

                // Update UI immediately
                this.imagePreviewUrl = imageUrl;

                this.pendingAssetImageFile = null;

                this.toastService.add({
                  severity: "success",
                  summary: "Image Uploaded",
                  detail: `Image for asset '${this.asset.assetName}' uploaded successfully`
                });

                // // Ask for warranty
                // const hasWarranty = confirm("Does this product have warranty or AMC?");
                // if (hasWarranty) {
                //   this.router.navigate(['/warranty/new'], { queryParams: { assetId: response.assetId } });
                // }
              },

              error: (error) => {
                console.error("Asset image upload failed:", error);
                this.toastService.add({
                  severity: "error",
                  summary: "Image Upload Failed",
                  detail: `Failed to upload image for asset '${this.asset.assetName}'`
                });
              }
            });
        }

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
  saveDepreciation() {
    const payload = {
      assetId: this.asset.id,
      depreciationMethod: this.asset.depreciationMethod,
      depreciationRate: this.asset.depreciationRate,
      expectedLifeYears: this.asset.expectedLifeYears,
      salvageValue: this.asset.salvageValue,
      depreciationStart: this.asset.depreciationStartDate
    };

    console.log(payload)

    // If depreciation does NOT exist → CREATE
    if (!this.asset.depreciation?.id) {
      this.assetAPI.addDepreciation(this.asset.assetId, payload).subscribe({
        next: res => {
          this.asset.depreciation = res;
          this.toast("success", "Depreciation added");
        },
        error: () => this.toast("error", "Failed to add depreciation")
      });
      return;
    }

    // If depreciation exists → UPDATE
    this.assetAPI.updateDepreciation(this.asset.depreciation.id, payload).subscribe({
      next: res => {
        this.asset.depreciation = res;
        this.toast("success", "Depreciation updated");
      },
      error: () => this.toast("error", "Failed to update depreciation")
    });
  }

  saveInsurance() {
    const payload = {
      assetId: this.asset.id,
      id: this.asset.insurance.id,
      provider: this.asset.insuranceProvider,
      policyNumber: this.asset.policyNumber,
      coverageAmount: this.asset.coverageAmount,
      premiumAmount: this.asset.premiumAmount,
      startDate: this.asset.insuranceStartDate,
      endDate: this.asset.insuranceEndDate,
      notes: this.asset.notes
    };

    // If asset does NOT exist → CREATE
    if (!this.asset.insurance.id) {
      this.assetAPI.addInsurance(payload).subscribe({
        next: res => {
          this.asset = res;
          this.toast("success", "Insurance policy added");
        },
        error: () => this.toast("error", "Failed to add Insurance")
      });
      return;
    }

    // If asset exists → UPDATE
    this.assetAPI.updateInsurance(this.asset.insurance.id, payload).subscribe({
      next: res => {
        this.asset = res;
        this.toast("success", "Insurance policy updated");
      },
      error: () => this.toast("error", "Failed to update insurance")
    });
  }

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
      employeeResponsibleId: this.asset.employeeResponsibleId
    };

    // 👉 CREATE (first time)
    if (!this.currentLocationId) {
      this.locationAPI.addLocation(payload).subscribe({
        next: () => {
          this.toast('success', 'Location added');
          this.loadCurrentLocation();
          this.loadLocationHistory(this.asset.id);
        },
        error: () => this.toast('error', 'Failed to add location')
      });
      return;
    }

    // 👉 UPDATE (existing row)
    this.locationAPI.updateLocation(this.currentLocationId, payload).subscribe({
      next: () => {
        this.toast('success', 'Location updated');
        this.loadLocationHistory(this.asset.id);
      },
      error: () => this.toast('error', 'Failed to update location')
    });
  }
  loadCurrentLocation() {
    this.locationAPI.getCurrentLocation(this.asset.id).subscribe(loc => {
      this.currentLocationId = loc.id;
      this.asset.branchId = loc.branchId;
      this.asset.block = loc.block;
      this.asset.floor = loc.floor;
      this.asset.room = loc.room;
      this.asset.employeeResponsibleId = loc.employeeResponsibleId;
    });
  }


  loadLocationHistory(id: number) {
    this.locationAPI.getHistory(id).subscribe(res => this.locationHistory = res);
  }

  saveAssignment() {
    if (!this.asset.id) {
      this.toast("error", "Save basic details first");
      return;
    }
  
    const payload = {
      departmentId: this.asset.departmentId,
      supervisorId: this.asset.supervisorId,
      allottedToId: this.asset.allottedToId
    };
  
    this.assetAPI.updateAssignment(this.asset.id, payload).subscribe({
      next: () => this.toast("success", "Assignment updated"),
      error: () => this.toast("error", "Failed to update assignment")
    });
  }
  
  

  // ================================
  // TRANSFER
  // ================================
  submitTransfer() {
    if (!this.asset.id) return;

    const payload = {
      ...this.transfer
    };

    this.transferAPI.makeTransfer(payload).subscribe({
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
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      const file = input.files[0];

      this.pendingAssetImageFile = file;

      // Set preview image
      this.imagePreviewUrl = URL.createObjectURL(file);

      // ❌ REMOVE this line — it breaks preview and shows only filename
      // this.asset.assetPhoto = file.name;

      console.log("Selected image:", file);
    }
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
