import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from "@angular/core";
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
import { ModuleAccessService } from "../../services/module-access/module-access";

// router + toast
import { ActivatedRoute } from "@angular/router";
import { MessageService } from "primeng/api";
import { WarrantyForm } from "../../warranty/warranty-form/warranty-form";
import { ToastModule } from "primeng/toast";
import { QRCodeComponent } from "angularx-qrcode";
import { AssetQr } from "../asset-qr/asset-qr";

type FlowStatus = "NONE" | "PENDING" | "ACKNOWLEDGED" | "REJECTED";
type PendingRole = "HOD" | "SUPERVISOR" | "END_USER" | null;

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
    WarrantyForm,
    ToastModule,
    AssetQr
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
    { label: 'Minutes', value: 'MINUTES' },
    { label: "Hours", value: "HOURS" },
    { label: "Days", value: "DAYS" },
    { label: "Months", value: "MONTHS" },
    { label: "Years", value: "YEARS" }
  ];

  policyTypes = [
    { label: 'Comprehensive', value: 'COMPREHENSIVE' },
    { label: 'Fire', value: 'FIRE' },
    { label: 'Theft', value: 'THEFT' },
    { label: 'Damage', value: 'DAMAGE' }
  ];

  levelOptions = [
    { label: 'L1', value: 'L1' },
    { label: 'L2', value: 'L2' },
    { label: 'L3', value: 'L3' }
  ];

  slaCategoryOptions: { label: string; value: string }[] = [];
  slaMatrixRows: any[] = [];

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
    referenceCode: "",
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

    // Inspection (DONATION / LEASE / RENTAL)
    inspectionDoneBy: "",
    inspectionCondition: "",
    inspectionRemark: "",
    physicalInspectionStatus: "",
    physicalInspectionDate: null,
    functionalInspectionStatus: "",
    functionalInspectionDate: null,
    functionalTestNotes: "",

    // Service coverage
    serviceCoverageType: "",

    // Assignment
    departmentId: null,
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
    slaResolutionValue: null,
    slaResolutionUnit: "",

    level: '',

    // slaDetails: "",
    expectedLifetime: null,
    expectedLifetimeUnit: "",

    // Location
    branchId: null,
    block: "",
    floor: "",
    room: "",
    employeeResponsibleId: null,
    departmentSnapshot: "",

    status: "PENDING_COMPLETION",
  };

  depreciationForm = {
    depreciationMethod: '',
    depreciationRate: null as number | null,
    expectedLifeYears: null as number | null,
    salvageValue: null as number | null,
    depreciationStart: null as Date | null,
    depreciationFrequency: 'YEARLY' as 'YEARLY' | 'MONTHLY'
  };
  // histories
  locationHistory: any[] = [];
  transferHistory: any[] = [];

  // transfer modal
  showTransferModal = false;
  transfer = {
    transferType: 'INTERNAL',
    externalType: null,

    toBranchId: null,

    block: '',
    floor: '',
    room: '',

    destinationType: null,
    destinationName: '',
    destinationAddress: '',
    destinationContactPerson: '',
    destinationContactNumber: '',

    temporary: false,
    expiresAt: null,

    reason: '',
    assetId: null
  };

  insuranceHistory: any[] = [];

  claimForm = {
    claimNumber: '',
    claimDate: null,
    claimAmount: null,
    reason: ''
  };

  claims: any[] = [];
  showClaimDialog = false;

  pendingAssetImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  currentLocationId?: number;
  // Resolved dynamically from the departments list (name contains "store").
  // Falls back to 5 only if no match is found.
  storeDepartmentId: number = 5

  // ================================
  // ASSIGNMENT FLOW UI STATE
  // ================================
  flowState: {
    sourceHodStatus: FlowStatus;
    supervisorStatus: FlowStatus;
    targetHodStatus: FlowStatus;
    endUserStatus: FlowStatus;
    currentPendingRole: PendingRole;
  } = {
      sourceHodStatus: "NONE",
      supervisorStatus: "NONE",
      targetHodStatus: "NONE",
      endUserStatus: "NONE",
      currentPendingRole: null,
    };
  handoverCondition = ''; // mandatory before sending any request
  //target dept UI fields
  targetDepartmentId: number | null = null;
  targetAllottedToId: number | null = null;
  depreciationResult: any = null;

  // ===== Renewal Dialog =====
  showRenewDialog = false;

  renewForm = {
    provider: '',
    policyNumber: '',
    coverageAmount: null as number | null,
    premiumAmount: null as number | null,
    startDate: null as Date | null,
    endDate: null as Date | null,
    policyType: null as string | null,
    renewalReminderDays: 30 as number | null,
    notes: ''
  };

  parentAssetOptions: { label: string; value: string }[] = [];
  selectedParentAssetId: string | null = null;

  subAssets: any[] = [];
  parentSearch = "";

  // inside class:
  showSubAssetDialog = false;

  // subAssetForm: any = {
  //   assetName: "",
  //   serialNumber: "",
  //   assetType: "",
  //   assetCategoryId: null,
  //   inheritFromParent: true,
  // };
  subAssetForm: any = {
    sourceType: 'NEW', // NEW | INVENTORY_SPARE

    // common
    assetName: "",
    serialNumber: "",
    assetType: "",
    assetCategoryId: null,
    referenceCode: "",
    status: "PENDING_COMPLETION",
    inheritFromParent: true,
    vendorId: null,
    departmentId: null,
    workingCondition: "WORKING",
    remarks: "",
    sourceReference: "",

    // new asset flow
    modeOfProcurement: "PURCHASE",

    invoiceNumber: "",
    purchaseDate: null,
    purchaseOrderNo: "",
    purchaseOrderDate: null,
    purchaseCost: null,

    donorName: "",
    donationDate: null,
    assetCondition: "",
    estimatedValue: null,

    leaseStartDate: null,
    leaseEndDate: null,
    leaseAmount: null,

    rentalStartDate: null,
    rentalEndDate: null,
    rentalAmount: null,

    // inventory spare flow
    sparePartId: null,
    quantity: 1
  };
  specifications: any[] = [];

  specFormModel: any = {
    id: null,
    key: '',
    value: '',
    specificationGroup: null,
    valueType: 'TEXT',
    unit: '',
    sortOrder: 0,
    isMandatory: false,
    source: null,
    remarks: '',
  };
  currentUser: any = {
    employeeId: null,
    departmentId: null,
    role: null // HOD | ADMIN | SUPERVISOR | USER
  };

  specGroupOptions = [
    { label: 'General', value: 'GENERAL' },
    { label: 'Electrical', value: 'ELECTRICAL' },
    { label: 'Mechanical', value: 'MECHANICAL' },
    { label: 'Software', value: 'SOFTWARE' },
    { label: 'Accessory', value: 'ACCESSORY' },
    { label: 'Sub Asset', value: 'SUB_ASSET' },
  ];

  specValueTypeOptions = [
    { label: 'Text', value: 'TEXT' },
    { label: 'Number', value: 'NUMBER' },
    { label: 'Boolean', value: 'BOOLEAN' },
    { label: 'Date', value: 'DATE' },
    { label: 'JSON', value: 'JSON' },
  ];

  specSourceOptions = [
    { label: 'OEM', value: 'OEM' },
    { label: 'Client', value: 'CLIENT' },
    { label: 'Technician', value: 'TECHNICIAN' },
    { label: 'Import', value: 'IMPORT' },
  ];

  canEditBasicDetails = false;
  canAccessDepartmentTabs = false;
  canAccessAsEndUser = false;
  canDeleteAsset = false;

  // Sub-item names returned by getMyAccess for the 'assets' module
  // Empty set = no module-access config → fall back to role/dept logic
  private allowedAssetItems = new Set<string>();

  subAssetSourceOptions = [
    { label: 'New', value: 'NEW' },
    { label: 'From Inventory Spare', value: 'INVENTORY_SPARE' }
  ];

  subAssetStatusOptions = [
    { label: 'Pending Completion', value: 'PENDING_COMPLETION' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'In Store', value: 'IN_STORE' },
    { label: 'In Use', value: 'IN_USE' },
    { label: 'Under Repair', value: 'UNDER_REPAIR' },
    { label: 'Retired', value: 'RETIRED' }
  ];

  workingConditionOptions = [
    { label: 'Working', value: 'WORKING' },
    { label: 'Partial', value: 'PARTIAL' },
    { label: 'Not Working', value: 'NOT_WORKING' }
  ];

  inventorySpareOptions: { label: string; value: number }[] = [];
  inventorySearch = "";

  // ── Asset Creation Checklist (mandatory before Basic Details save) ──────────
  readonly creationChecklist = [
    { key: 'serial',     label: 'Serial number / asset tag verified and matches physical unit' },
    { key: 'condition',  label: 'Physical condition inspected and documented' },
    { key: 'accessories',label: 'All accessories / components accounted for' },
    { key: 'docs',       label: 'Invoice / GRN / delivery note received and filed' },
    { key: 'location',   label: 'Storage location / department confirmed' },
  ];
  creationChecklistDone: Record<string, boolean> = {};

  get allCreationItemsChecked(): boolean {
    return this.creationChecklist.every(item => this.creationChecklistDone[item.key]);
  }

  inspectionConditionOptions = [
    { label: 'Good', value: 'GOOD' },
    { label: 'Fair', value: 'FAIR' },
    { label: 'Sealed (Unopened)', value: 'SEALED' },
    { label: 'Unsealed', value: 'UNSEALED' },
    { label: 'Damaged', value: 'DAMAGED' },
  ];

  inspectionPassFailOptions = [
    { label: 'Pass', value: 'PASS' },
    { label: 'Fail', value: 'FAIL' },
    { label: 'Pending', value: 'PENDING' },
  ];

  serviceCoverageOptions = [
    { label: '24/7', value: '24/7' },
    { label: '8/5', value: '8/5' },
    { label: '9/6', value: '9/6' },
    { label: '12/7', value: '12/7' },
    { label: 'Custom', value: 'CUSTOM' },
  ];

showReturnChecklistDialog = false;
selectedReturnTransfer: any = null;
selectedReturnTransferId: number | null = null;

returnChecklistItems: any[] = [];
returnChecklistResponses: {
  itemId: number;
  checked: boolean;
  remarks: string;
}[] = [];

returnChecklistLoading = false;
returnError = '';
returnNote = '';
returnSelectedFile: File | null = null;

@ViewChild('returnSignatureCanvas') returnCanvas!: ElementRef<HTMLCanvasElement>;
private returnCtx!: CanvasRenderingContext2D;
private returnDrawing = false;
private returnLastX = 0;
private returnLastY = 0;


  get assignmentButtonLabel(): string {
    // guide user based on state
    if (this.flowState.sourceHodStatus !== "ACKNOWLEDGED") return "Send Source HOD Acknowledgement";
    if (this.flowState.supervisorStatus !== "ACKNOWLEDGED") return "Send Supervisor Acknowledgement";

    // after supervisor ack:
    if (this.targetDepartmentId) {
      if (this.flowState.targetHodStatus !== "ACKNOWLEDGED") return "Send Target HOD Acknowledgement";
      return this.targetAllottedToId ? "Send Target End User Acknowledgement" : "Close (No Target End User)";
    }

    // no target dept:
    return this.asset.allottedToId ? "Send End User Acknowledgement" : "Close (No End User)";
  }

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
    private cdr: ChangeDetectorRef,
    private moduleAccessService: ModuleAccessService
  ) { }

  ngOnInit() {
    this.role = localStorage.getItem("role") as any || "store_user";

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUser = {
      employeeId: user?.employeeDbId || null,
      departmentId: user?.departmentId || null,
      role: user?.role || null
    };

    this.loadModuleAccess();
    this.evaluateAccessRights();
    this.loadDropdowns();
    this.checkEditMode();
  }

  private loadModuleAccess() {
    this.moduleAccessService.getMyAccess().subscribe({
      next: (result) => {
        if (result.isAdmin) {
          // Admin can do everything — populate with all known sub-item names
          this.allowedAssetItems = new Set(['view', 'create', 'edit', 'delete', 'assignments', 'transfer', 'import']);
        } else {
          const assetsMod = result.modules?.find((m: any) => m.name === 'assets');
          if (assetsMod) {
            this.allowedAssetItems = new Set(
              (assetsMod.subItems || []).map((s: any) => s.name as string)
            );
          }
        }
        // Re-evaluate now that we have permission data
        setTimeout(() => {
          this.evaluateAccessRights();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        // API failed — keep existing role/dept based logic (fail open)
      }
    });
  }

  // load dropdown dependencies
  loadDropdowns() {
    this.assetAPI.getCategories().subscribe({
      next: (res) => {
        this.categories = res || [];
      }
    });

    this.assetAPI.getVendors().subscribe({
      next: (res) => {
        this.vendors = res || [];
      }
    });

    this.assetAPI.getDepartments().subscribe({
      next: (res) => {
        this.departments = res || [];
        // Resolve store department ID by finding a dept whose name includes "store" (case-insensitive).
        // This replaces the hardcoded ID=5 with a name-based lookup.
        const storeDept = this.departments.find(
          (d: any) => d.name?.toLowerCase().includes('store')
        );
        if (storeDept) {
          this.storeDepartmentId = storeDept.id;
        }
        this.evaluateAccessRights();
      }
    });

    this.assetAPI.getEmployees().subscribe({
      next: (res) => {
        this.employees = res || [];
      }
    });

    this.branchAPI.getBranches().subscribe({
      next: (res) => {
        this.branches = res || [];
      }
    });
  }


  get hasInsurance(): boolean {
    return !!(
      this.asset &&
      this.asset.insurance &&
      (
        // case 1: array (from backend)
        (Array.isArray(this.asset.insurance) && this.asset.insurance.length > 0) ||
        // case 2: mapped single insurance object
        this.asset.insurance.id
      )
    );
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
      this.loadDepreciation();
      this.refreshFlowState();
      // this.loadInsuranceHistory()

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
      const loc = asset.locations.find((l: any) => l.isActive) || asset.locations[0];
      asset.branchId = loc.branchId;
      asset.block = loc.block;
      asset.floor = loc.floor;
      asset.room = loc.room;
      asset.employeeResponsibleId = loc.employeeResponsibleId;
      asset.departmentSnapshot = loc.departmentSnapshot;

      this.currentLocationId = loc.id;
    }
    // 🔥 MAP DEPRECIATION
    if (asset.depreciation) {
      this.depreciationForm = {
        depreciationMethod: asset.depreciation.depreciationMethod,
        depreciationRate: Number(asset.depreciation.depreciationRate),
        expectedLifeYears: asset.depreciation.expectedLifeYears,
        salvageValue: Number(asset.depreciation.salvageValue ?? 0),
        depreciationStart: asset.depreciation.depreciationStart
          ? new Date(asset.depreciation.depreciationStart)
          : null,
        depreciationFrequency: asset.depreciation.depreciationFrequency || 'YEARLY'
      };
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
      console.log('loading the insurance')
    } else {
      // ensure object exists to avoid undefined errors
      asset.insurance = {};
    }

    asset.slaExpectedValue = asset.slaExpectedValue ?? null;
    asset.slaExpectedUnit = asset.slaExpectedUnit ?? '';
    asset.slaResolutionValue = asset.slaResolutionValue ?? null;
    asset.slaResolutionUnit = asset.slaResolutionUnit ?? '';
    this.targetDepartmentId = asset.targetDepartmentId ?? null;
    this.targetAllottedToId = asset.allottedToId ?? null;

    this.selectedParentAssetId = asset.parentAsset?.assetId || null;

    // Load children list

    this.asset = asset;
    if (this.asset?.assetId) {
      this.loadSubAssets();
      this.loadInsuranceHistory();
      this.evaluateAccessRights()
      this.loadSpecifications();
      this.loadSlaOptionsByCategory();
    }
    console.log(this.asset)
  }


  // ================================
  // PHASE 1 SAVE BASIC DETAILS
  // ================================
  saveBasicDetails(form: any) {
    if (!form.valid)
      return this.toast("error", "Fill required fields");

    if (!this.allCreationItemsChecked)
      return this.toast("error", "Complete all checklist items before saving");

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
        // 🔥 After creating asset, start HOD acknowledgement flow (if department selected)
        if (this.asset.departmentId) {
          console.log(this.asset.departmentId, 'departmentId')
          if (!this.handoverCondition?.trim()) {
            this.toast("error", "Enter Condition at Handover to send HOD acknowledgement");
          } else {
            this.assetAPI.initiateHodAck(this.asset.id, {
              departmentId: this.asset.departmentId,
              conditionAtHandover: this.handoverCondition.trim(),
            }).subscribe({
              next: () => {
                this.toast("success", "HOD acknowledgement request sent");
                this.refreshFlowState();
              },
              error: () => this.toast("error", "Failed to send HOD acknowledgement request")
            });
          }
        }
        form.resetForm();
        this.clearForm();
        this.activeTab = 0;
      },
      error: () => this.toast("error", "Failed to save")
    });
  }

  // RESET FORM
  clearForm() {
    this.asset = this.getEmptyAssetModel();
    this.handoverCondition = '';
    this.pendingAssetImageFile = null;
    this.imagePreviewUrl = null;
    this.creationChecklistDone = {};
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
      depreciationMethod: this.depreciationForm.depreciationMethod,
      depreciationRate: this.depreciationForm.depreciationRate,
      expectedLifeYears: this.depreciationForm.expectedLifeYears,
      salvageValue: this.depreciationForm.salvageValue,
      depreciationStart: this.depreciationForm.depreciationStart
    };

    console.log(payload)

    // If depreciation does NOT exist → CREATE
    if (!this.asset.depreciation?.id) {
      this.assetAPI.addDepreciation(this.asset.assetId, payload).subscribe({
        next: res => {
          this.asset.depreciation = res;
          this.toast("success", "Depreciation added");
          this.loadDepreciation()
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
      provider: this.asset.insuranceProvider,
      policyNumber: this.asset.policyNumber,
      coverageAmount: this.asset.coverageAmount,
      premiumAmount: this.asset.premiumAmount,
      startDate: this.asset.insuranceStartDate,
      endDate: this.asset.insuranceEndDate,
      policyType: this.asset.policyType,
      renewalReminderDays: this.asset.renewalReminderDays,
      notes: this.asset.notes
    };

    // If asset does NOT exist → CREATE
    if (!this.asset.insurance.id) {
      this.assetAPI.addInsurance(payload).subscribe({
        next: res => {
          this.asset.insurance = res;
          this.toast("success", "Insurance policy added");
        },
        error: () => this.toast("error", "Failed to add Insurance")
      });
      return;
    }

    // If asset exists → UPDATE
    this.assetAPI.updateInsurance(this.asset.insurance.id, payload).subscribe({
      next: res => {
        this.asset.insurance = res;
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
      employeeResponsibleId: this.asset.employeeResponsibleId,
      departmentSnapshot: this.asset.departmentSnapshot
    };

    // 👉 CREATE (first time)
    if (!this.currentLocationId) {
      this.locationAPI.addLocation(payload).subscribe({
        next: () => {
          this.toast('success', 'Location added');
          // this.loadCurrentLocation();
          this.resetLocationForm();
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
      this.asset.departmentSnapshot = loc.departmentSnapshot;
    });
  }


  loadLocationHistory(id: number) {
    this.locationAPI.getHistory(id).subscribe(res => this.locationHistory = res);
  }

  // saveAssignment() {
  //   if (!this.asset.id) {
  //     this.toast("error", "Save basic details first");
  //     return;
  //   }

  //   const payload = {
  //     departmentId: this.asset.departmentId,
  //     supervisorId: this.asset.supervisorId,
  //     allottedToId: this.asset.allottedToId
  //   };

  //   this.assetAPI.updateAssignment(this.asset.id, payload).subscribe({
  //     next: () => this.toast("success", "Assignment updated"),
  //     error: () => this.toast("error", "Failed to update assignment")
  //   });
  // }

  saveAssignment() {
    if (!this.asset?.id) return this.toast("error", "Save basic details first");
    if (!this.handoverCondition?.trim()) return this.toast("error", "Condition at Handover is required");

    // 1) Source HOD must ACK before supervisor assignment
    if (this.flowState.sourceHodStatus !== "ACKNOWLEDGED") {
      return this.toast("error", "Source HOD has not acknowledged yet.");
    }

    // 2) Supervisor assignment (if not yet acknowledged)
    if (this.flowState.supervisorStatus === "NONE" || this.flowState.supervisorStatus === "REJECTED") {
      if (!this.asset.supervisorId) return this.toast("error", "Select Source Supervisor");

      return this.assetAPI
        .hodAssignSupervisor(this.asset.id, {
          supervisorId: this.asset.supervisorId,
          conditionAtHandover: this.handoverCondition.trim(),
        })
        .subscribe({
          next: () => {
            this.toast("success", "Supervisor acknowledgement request sent");
            this.refreshFlowState();
          },
          error: () => this.toast("error", "Failed to send Supervisor acknowledgement"),
        });
    }

    // 3) Supervisor must ACK before target/no-target decision
    if (this.flowState.supervisorStatus !== "ACKNOWLEDGED") {
      return this.toast("error", "Supervisor has not acknowledged yet.");
    }

    // ==========================
    // ✅ TARGET DEPARTMENT FLOW
    // ==========================
    if (this.targetDepartmentId) {
      // 3A) create Target HOD assignment (if not yet acknowledged)
      if (this.flowState.targetHodStatus === "NONE" || this.flowState.targetHodStatus === "REJECTED") {
        return this.assetAPI
          .supervisorAssignTargetDepartment(this.asset.id, {
            targetDepartmentId: this.targetDepartmentId,
            conditionAtHandover: this.handoverCondition.trim(),
          })
          .subscribe({
            next: () => {
              this.toast("success", "Target HOD acknowledgement request sent");
              this.refreshFlowState();
            },
            error: () => this.toast("error", "Failed to send Target HOD acknowledgement"),
          });
      }

      // 3B) Target HOD must ACK before target end user
      if (this.flowState.targetHodStatus !== "ACKNOWLEDGED") {
        return this.toast("error", "Target HOD has not acknowledged yet.");
      }

      // 3C) Target end user optional -> create END_USER assignment or close
      if (!this.targetAllottedToId) {
        return this.assetAPI
          .targetHodAssignEndUser(this.asset.id, {
            skipEndUser: true,
            conditionAtHandover: this.handoverCondition.trim(),
          })
          .subscribe({
            next: () => {
              this.toast("success", "Flow closed (No Target End User)");
              this.refreshFlowState();
            },
            error: () => this.toast("error", "Failed to close flow"),
          });
      }

      return this.assetAPI
        .targetHodAssignEndUser(this.asset.id, {
          allottedToId: this.targetAllottedToId,
          conditionAtHandover: this.handoverCondition.trim(),
        })
        .subscribe({
          next: () => {
            this.toast("success", "Target End User acknowledgement request sent");
            this.refreshFlowState();
          },
          error: () => this.toast("error", "Failed to send Target End User acknowledgement"),
        });
    }

    // ==========================
    // ✅ NO TARGET FLOW (same dept)
    // ==========================
    if (!this.asset.allottedToId) {
      return this.assetAPI
        .supervisorAssignEndUser(this.asset.id, {
          skipEndUser: true,
          conditionAtHandover: this.handoverCondition.trim(),
        })
        .subscribe({
          next: () => {
            this.toast("success", "Flow closed (No End User)");
            this.refreshFlowState();
          },
          error: () => this.toast("error", "Failed to close flow"),
        });
    }

    return this.assetAPI
      .supervisorAssignEndUser(this.asset.id, {
        allottedToId: this.asset.allottedToId,
        conditionAtHandover: this.handoverCondition.trim(),
      })
      .subscribe({
        next: () => {
          this.toast("success", "End User acknowledgement request sent");
          this.refreshFlowState();
        },
        error: () => this.toast("error", "Failed to send End User acknowledgement"),
      });
  }



  // ================================
  // TRANSFER
  // ================================
  submitTransfer() {
    if (!this.asset.id) return;

    const payload = {
      ...this.transfer,
      assetId: this.asset.id,
      toBranchId: this.transfer.toBranchId ? Number(this.transfer.toBranchId) : null
    };

    this.transferAPI.requestTransfer(payload).subscribe({
      next: () => {
        this.toast("success", "Transfer request submitted");
        this.loadTransferHistory(this.asset.id);
        this.showTransferModal = false;
        this.resetTransferForm();
      },
      error: (err) => this.toast("error", err?.error?.message || "Transfer request failed")
    });
  }
  resetTransferForm() {
    this.transfer = {
      transferType: 'INTERNAL',
      externalType: null,
      toBranchId: null,
      block: '',
      floor: '',
      room: '',
      destinationType: null,
      destinationName: '',
      destinationAddress: '',
      destinationContactPerson: '',
      destinationContactNumber: '',
      temporary: false,
      expiresAt: null,
      reason: '',
      assetId: this.asset?.id ?? null
    };
  }
returnAsset(row: any) {
  if (!row?.id) return;

  const returnReason = prompt('Enter return reason') || '';

  this.transferAPI.returnTransfer(row.id, { returnReason }).subscribe({
    next: () => {
      this.toast('success', 'Return request submitted successfully');
      this.loadTransferHistory(this.asset.id);
    },
    error: (err) => {
      this.toast('error', err?.error?.message || 'Failed to submit return request');
    }
  });
}

  getTransferToLabel(row: any): string {
    return row?.toBranch?.name || row?.destinationName || '-';
  }

  getTransferTypeLabel(row: any): string {
    if (row?.transferType === 'RETURN') return 'Return';
    if (row?.transferType === 'INTERNAL') return 'Internal';
    if (row?.transferType === 'EXTERNAL') return row?.externalType || 'External';
    return '-';
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
  private refreshFlowState() {
    if (!this.asset?.id) return;

    this.assetAPI.getAssignmentState(this.asset.id).subscribe({
      next: (state: any) => {
        setTimeout(() => {
          this.flowState = state;

          if (state.targetDepartmentId !== undefined) {
            this.targetDepartmentId = state.targetDepartmentId != null ? Number(state.targetDepartmentId) : null;
          }
          if (state.targetAllottedToId !== undefined) {
            this.targetAllottedToId = state.targetAllottedToId != null ? Number(state.targetAllottedToId) : null;
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error(err),
    });
  }
  loadDepreciation() {
    if (!this.asset?.id) return;

    this.assetAPI.calculateDepreciation(this.asset.id).subscribe({
      next: (res) => {
        this.depreciationResult = res;
      },
      error: () => {
        this.depreciationResult = null;
      }
    });
  }

  getDepStatusClass(data: any) {
    const status = this.getDepStatus(data);

    switch (status) {
      case 'FULLY DEPRECIATED': return 'red';
      case 'EXPIRED': return 'orange';
      case 'LOW VALUE': return 'yellow';
      default: return 'green';
    }
  }
  getDepStatus(data: any): string {
    if (!data) return 'N/A';

    if (data.bookValue <= data.salvageValue) {
      return 'FULLY DEPRECIATED';
    }

    if (data.yearsUsed >= data.expectedLifeYears) {
      return 'EXPIRED';
    }

    if (data.bookValue < data.purchaseCost * 0.3) {
      return 'LOW VALUE';
    }

    return 'ACTIVE';
  }
  getInsuranceStatus(ins: any): string {
    if (!ins) return 'N/A';

    const today = new Date();
    const end = ins.endDate ? new Date(ins.endDate) : null;

    if (end && end < today) return 'EXPIRED';

    const diffDays = end
      ? (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      : null;

    if (diffDays !== null && diffDays <= (ins.renewalReminderDays || 30)) {
      return 'EXPIRING_SOON';
    }

    return 'ACTIVE';
  }

  get depreciationButtonLabel(): string {
    return this.asset?.depreciation?.id ? 'Update Depreciation' : 'Save Depreciation';
  }

  getInsuranceStatusClass(ins: any) {
    const status = this.getInsuranceStatus(ins);

    switch (status) {
      case 'EXPIRED': return 'red';
      case 'EXPIRING_SOON': return 'orange';
      default: return 'green';
    }
  }
  loadInsuranceHistory() {
    console.log('loading')
    this.assetAPI.getInsuranceHistory(this.asset.id)
      .subscribe(res => this.insuranceHistory = res);
  }
  renewPolicy() {
    const payload = {
      assetId: this.asset.id,
      provider: this.asset.insuranceProvider,
      policyNumber: this.asset.policyNumber,
      coverageAmount: this.asset.coverageAmount,
      premiumAmount: this.asset.premiumAmount,
      startDate: this.asset.insuranceStartDate,
      endDate: this.asset.insuranceEndDate,
      notes: this.asset.notes
    };

    this.assetAPI.renewInsurance(payload).subscribe(() => {
      this.toast('success', 'Policy renewed');
      this.loadInsuranceHistory();
    });
  }
  openClaimDialog() {
    this.showClaimDialog = true;
  }

  loadClaims() {
    this.assetAPI.getClaims(this.asset.id)
      .subscribe(res => this.claims = res);
  }
  openRenewDialog() {
    if (!this.asset?.insurance?.id) {
      this.toast('error', 'No active policy to renew');
      return;
    }

    this.renewForm = {
      provider: this.asset.insuranceProvider || '',
      policyNumber: '',
      coverageAmount: this.asset.coverageAmount ?? null,
      premiumAmount: this.asset.premiumAmount ?? null,
      startDate: null,
      endDate: null,
      policyType: this.asset.policyType ?? null,
      renewalReminderDays: this.asset.renewalReminderDays ?? 30,
      notes: this.asset.notes || ''
    };

    this.showRenewDialog = true;
  }
  submitRenewal() {
    if (!this.asset?.id) return;

    const f = this.renewForm;

    // validation
    if (!f.provider || !f.policyNumber || !f.startDate || !f.endDate) {
      this.toast('error', 'Fill all required fields');
      return;
    }
    if (new Date(f.endDate) <= new Date(f.startDate)) {
      this.toast('error', 'End Date must be after Start Date');
      return;
    }

    const payload = {
      assetId: this.asset.id,
      provider: f.provider,
      policyNumber: f.policyNumber,
      coverageAmount: f.coverageAmount,
      premiumAmount: f.premiumAmount,
      startDate: f.startDate,
      endDate: f.endDate,
      policyType: f.policyType,
      renewalReminderDays: f.renewalReminderDays,
      notes: f.notes
    };

    this.assetAPI.renewInsurance(payload).subscribe({
      next: (res: any) => {
        this.toast('success', 'Policy renewed');
        this.showRenewDialog = false;

        // refresh
        this.loadInsuranceHistory();
        this.checkEditMode(); // reload active policy
      },
      error: () => this.toast('error', 'Renewal failed')
    });
  }
  submitClaim() {
    if (!this.asset?.id) return this.toast('error', 'Save asset first');
    if (!this.asset?.insurance?.id) return this.toast('error', 'Add/Select an active insurance policy first');

    if (!this.claimForm.claimNumber?.trim()) return this.toast('error', 'Claim Number is required');
    if (!this.claimForm.claimDate) return this.toast('error', 'Claim Date is required');
    if (this.claimForm.claimAmount == null || this.claimForm.claimAmount <= 0)
      return this.toast('error', 'Claim Amount must be > 0');

    const payload = {
      assetId: this.asset.id,
      insuranceId: this.asset.insurance.id, // active policy id
      claimNumber: this.claimForm.claimNumber.trim(),
      claimDate: this.claimForm.claimDate,
      claimAmount: this.claimForm.claimAmount,
      reason: this.claimForm.reason
    };

    this.assetAPI.createClaim(payload).subscribe({
      next: () => {
        this.toast('success', 'Claim submitted');
        this.showClaimDialog = false;

        // reset form
        this.claimForm = { claimNumber: '', claimDate: null, claimAmount: null, reason: '' };

        this.loadClaims();
      },
      error: (err) => {
        // common error: duplicate claimNumber for same insurance
        this.toast('error', err?.error?.message || 'Claim submit failed');
      }
    });
  }
  get activeInsurance() {
    return this.asset?.insurance;
  }
  downloadClaimFile(c: any) {
    // Example: if c.documents is a URL
    if (!c?.documents) {
      this.toast('error', 'No file attached');
      return;
    }
    window.open(c.documents, '_blank');
  }
  get canResend(): boolean {
    // must have asset
    if (!this.asset?.id) return false;

    // show resend only if any stage is REJECTED
    if (this.flowState.sourceHodStatus === 'REJECTED') return true;
    if (this.flowState.supervisorStatus === 'REJECTED') return true;
    if (this.flowState.targetHodStatus === 'REJECTED') return true;
    if (this.flowState.endUserStatus === 'REJECTED') return true;

    return false;
  }
  resendCurrentStage() {
    if (!this.asset?.id) return;
    if (!this.handoverCondition?.trim()) return this.toast("error", "Condition at Handover is required");

    // 1) Source HOD rejected -> resend initiateHodAck
    if (this.flowState.sourceHodStatus === 'REJECTED') {
      if (!this.asset.departmentId) return this.toast("error", "Select Source Department first");

      return this.assetAPI.initiateHodAck(this.asset.id, {
        departmentId: this.asset.departmentId,
        conditionAtHandover: this.handoverCondition.trim(),
      }).subscribe({
        next: () => { this.toast("success", "Source HOD request resent"); this.refreshFlowState(); },
        error: () => this.toast("error", "Failed to resend Source HOD request"),
      });
    }

    // 2) Supervisor rejected -> resend hodAssignSupervisor
    if (this.flowState.supervisorStatus === 'REJECTED') {
      if (!this.asset.supervisorId) return this.toast("error", "Select Source Supervisor first");

      return this.assetAPI.hodAssignSupervisor(this.asset.id, {
        supervisorId: this.asset.supervisorId,
        conditionAtHandover: this.handoverCondition.trim(),
      }).subscribe({
        next: () => { this.toast("success", "Supervisor request resent"); this.refreshFlowState(); },
        error: () => this.toast("error", "Failed to resend Supervisor request"),
      });
    }

    // 3) Target HOD rejected -> resend supervisorAssignTargetDepartment
    if (this.flowState.targetHodStatus === 'REJECTED') {
      if (!this.targetDepartmentId) return this.toast("error", "Select Target Department first");

      return this.assetAPI.supervisorAssignTargetDepartment(this.asset.id, {
        targetDepartmentId: this.targetDepartmentId,
        conditionAtHandover: this.handoverCondition.trim(),
      }).subscribe({
        next: () => { this.toast("success", "Target HOD request resent"); this.refreshFlowState(); },
        error: () => this.toast("error", "Failed to resend Target HOD request"),
      });
    }

    // 4) End User rejected
    if (this.flowState.endUserStatus === 'REJECTED') {
      // if target dept flow exists -> resend target end user
      if (this.targetDepartmentId) {
        if (!this.targetAllottedToId) return this.toast("error", "Select Target End User first");

        return this.assetAPI.targetHodAssignEndUser(this.asset.id, {
          allottedToId: this.targetAllottedToId,
          conditionAtHandover: this.handoverCondition.trim(),
        }).subscribe({
          next: () => { this.toast("success", "Target End User request resent"); this.refreshFlowState(); },
          error: () => this.toast("error", "Failed to resend Target End User request"),
        });
      }

      // no target dept -> resend supervisorAssignEndUser
      if (!this.asset.allottedToId) return this.toast("error", "Select End User first");

      return this.assetAPI.supervisorAssignEndUser(this.asset.id, {
        allottedToId: this.asset.allottedToId,
        conditionAtHandover: this.handoverCondition.trim(),
      }).subscribe({
        next: () => { this.toast("success", "End User request resent"); this.refreshFlowState(); },
        error: () => this.toast("error", "Failed to resend End User request"),
      });
    }
  }
  get canResendSourceHod(): boolean {
    return (
      !!this.asset?.id &&
      this.flowState.sourceHodStatus === 'REJECTED'
    );
  }
  resendSourceHod() {
    if (!this.asset?.id) return;
    if (!this.asset.departmentId) return this.toast('error', 'Select Source Department');
    if (!this.handoverCondition?.trim())
      return this.toast('error', 'Condition at Handover is required');

    this.assetAPI.initiateHodAck(this.asset.id, {
      departmentId: this.asset.departmentId,
      conditionAtHandover: this.handoverCondition.trim(),
    }).subscribe({
      next: () => {
        this.toast('success', 'Source HOD acknowledgement resent');
        this.refreshFlowState();
      },
      error: () => this.toast('error', 'Failed to resend Source HOD acknowledgement'),
    });
  }
  onTargetDepartmentChange() {
    if (this.targetDepartmentId) {
      this.asset.allottedToId = null; // prevent wrong flow value
    } else {
      this.targetAllottedToId = null; // prevent leftover target value
    }
  }
  loadSubAssets() {
    if (!this.asset?.assetId) return;

    this.assetAPI.getChildren(this.asset.assetId).subscribe({
      next: (res: any) => {
        this.subAssets = res.children || [];
      },
      error: () => {
        this.subAssets = [];
      }
    });
  }

  // typeahead/search dropdown
  searchParentAssets(query: string) {
    this.parentSearch = query;
    this.assetAPI.getParentOptions(query, this.asset?.assetId).subscribe({
      next: (opts) => (this.parentAssetOptions = opts || []),
      error: () => (this.parentAssetOptions = [])
    });
  }

  // user selects a parent and clicks Save Parent
  saveParentLink() {
    if (!this.asset?.assetId) return this.toast("error", "Save asset first");

    this.assetAPI.linkParent(this.asset.assetId, this.selectedParentAssetId).subscribe({
      next: () => {
        this.toast("success", "Parent updated");
        this.loadSubAssets();
        this.checkEditMode();
      },
      error: (err) => this.toast("error", err?.error?.message || "Failed to update parent")
    });
  }

  // detach parent
  detachParent() {
    if (!this.asset?.assetId) return;

    this.assetAPI.linkParent(this.asset.assetId, null).subscribe({
      next: () => {
        this.selectedParentAssetId = null;
        this.toast("success", "Parent removed");
      },
      error: (err) => this.toast("error", err?.error?.message || "Failed to remove parent")
    });
  }
  // openSubAssetDialog() {
  //   if (!this.asset?.assetId) {
  //     this.toast("error", "Save parent asset first");
  //     return;
  //   }

  //   this.subAssetForm = {
  //     assetName: "",
  //     serialNumber: "",
  //     assetType: this.asset.assetType || "",
  //     assetCategoryId: this.asset.assetCategoryId || null,
  //     inheritFromParent: true,
  //   };

  //   this.showSubAssetDialog = true;
  // }
  openSubAssetDialog() {
    if (!this.asset?.assetId) {
      this.toast("error", "Save parent asset first");
      return;
    }

    this.subAssetForm = {
      sourceType: 'NEW',

      assetName: "",
      serialNumber: "",
      assetType: this.asset.assetType || "",
      assetCategoryId: this.asset.assetCategoryId || null,
      referenceCode: "",
      status: "PENDING_COMPLETION",
      inheritFromParent: true,
      vendorId: null,
      departmentId: null,
      workingCondition: "WORKING",
      remarks: "",
      sourceReference: "",

      modeOfProcurement: "PURCHASE",

      invoiceNumber: "",
      purchaseDate: null,
      purchaseOrderNo: "",
      purchaseOrderDate: null,
      purchaseCost: null,

      donorName: "",
      donationDate: null,
      assetCondition: "",
      estimatedValue: null,

      leaseStartDate: null,
      leaseEndDate: null,
      leaseAmount: null,

      rentalStartDate: null,
      rentalEndDate: null,
      rentalAmount: null,

      sparePartId: null,
      quantity: 1
    };

    this.inventorySpareOptions = [];
    this.inventorySearch = "";
    this.showSubAssetDialog = true;
  }
  createSubAsset() {
    if (!this.asset?.assetId) return;

    const f = this.subAssetForm;

    // INVENTORY SPARE FLOW
    if (f.sourceType === 'INVENTORY_SPARE') {
      if (!f.sparePartId) return this.toast("error", "Select spare item");
      if (!f.assetName?.trim()) return this.toast("error", "Sub Asset Name is required");
      if (!f.serialNumber?.trim()) return this.toast("error", "Serial Number is required");
      if (!f.assetType) return this.toast("error", "Asset Type is required");
      if (!f.assetCategoryId) return this.toast("error", "Category is required");
      if (!f.status) return this.toast("error", "Status is required");
      if (!f.quantity || Number(f.quantity) <= 0) return this.toast("error", "Quantity must be greater than 0");

      const payload = {
        sourceType: 'INVENTORY_SPARE',
        sparePartId: Number(f.sparePartId),
        quantity: Number(f.quantity),

        assetName: f.assetName.trim(),
        serialNumber: f.serialNumber.trim(),
        assetType: f.assetType,
        assetCategoryId: Number(f.assetCategoryId),
        referenceCode: f.referenceCode?.trim() || null,
        status: f.status,

        inheritFromParent: !!f.inheritFromParent,
        vendorId: f.inheritFromParent ? null : (f.vendorId ? Number(f.vendorId) : null),
        departmentId: f.inheritFromParent ? null : (f.departmentId ? Number(f.departmentId) : null),
        workingCondition: f.workingCondition || null,
        remarks: f.remarks || null,
        sourceReference: f.sourceReference || null
      };

      return this.assetAPI.createSubAsset(this.asset.assetId, payload).subscribe({
        next: () => {
          this.toast("success", "Sub-asset created from inventory spare");
          this.showSubAssetDialog = false;
          this.loadSubAssets();
        },
        error: (err) => {
          this.toast("error", err?.error?.message || "Failed to create sub-asset from spare");
        }
      });
    }

    // NEW FLOW
    if (!f.assetName?.trim()) return this.toast("error", "Sub Asset Name is required");
    if (!f.serialNumber?.trim()) return this.toast("error", "Serial Number is required");
    if (!f.assetType) return this.toast("error", "Asset Type is required");
    if (!f.assetCategoryId) return this.toast("error", "Category is required");
    if (!f.status) return this.toast("error", "Status is required");
    if (!f.modeOfProcurement) return this.toast("error", "Mode of Procurement is required");

    if (f.modeOfProcurement === 'PURCHASE') {
      if (!f.invoiceNumber?.trim()) return this.toast("error", "Invoice Number is required");
      if (!f.purchaseDate) return this.toast("error", "Purchase Date is required");
      if (f.purchaseCost == null) return this.toast("error", "Purchase Cost is required");
    }

    if (f.modeOfProcurement === 'DONATION') {
      if (!f.donorName?.trim()) return this.toast("error", "Donor Name is required");
      if (!f.donationDate) return this.toast("error", "Donation Date is required");
      if (!f.assetCondition) return this.toast("error", "Condition is required");
    }

    if (f.modeOfProcurement === 'LEASE') {
      if (!f.leaseStartDate) return this.toast("error", "Lease Start Date is required");
      if (!f.leaseEndDate) return this.toast("error", "Lease End Date is required");
    }

    if (f.modeOfProcurement === 'RENTAL') {
      if (!f.rentalStartDate) return this.toast("error", "Rental Start Date is required");
      if (!f.rentalEndDate) return this.toast("error", "Rental End Date is required");
    }

    const payload = {
      sourceType: 'NEW',
      assetName: f.assetName.trim(),
      serialNumber: f.serialNumber.trim(),
      assetType: f.assetType,
      assetCategoryId: Number(f.assetCategoryId),
      referenceCode: f.referenceCode?.trim() || null,
      modeOfProcurement: f.modeOfProcurement,
      status: f.status,
      inheritFromParent: !!f.inheritFromParent,

      invoiceNumber: f.invoiceNumber || null,
      purchaseDate: f.purchaseDate || null,
      purchaseOrderNo: f.purchaseOrderNo || null,
      purchaseOrderDate: f.purchaseOrderDate || null,
      purchaseCost: f.purchaseCost != null ? Number(f.purchaseCost) : null,

      donorName: f.donorName || null,
      donationDate: f.donationDate || null,
      assetCondition: f.assetCondition || null,
      estimatedValue: f.estimatedValue != null ? Number(f.estimatedValue) : null,

      leaseStartDate: f.leaseStartDate || null,
      leaseEndDate: f.leaseEndDate || null,
      leaseAmount: f.leaseAmount != null ? Number(f.leaseAmount) : null,

      rentalStartDate: f.rentalStartDate || null,
      rentalEndDate: f.rentalEndDate || null,
      rentalAmount: f.rentalAmount != null ? Number(f.rentalAmount) : null,

      vendorId: f.inheritFromParent ? null : (f.vendorId ? Number(f.vendorId) : null),
      departmentId: f.inheritFromParent ? null : (f.departmentId ? Number(f.departmentId) : null),
      workingCondition: f.workingCondition || null,
      remarks: f.remarks || null,
      sourceReference: f.sourceReference || null
    };

    this.assetAPI.createSubAsset(this.asset.assetId, payload).subscribe({
      next: () => {
        this.toast("success", "Sub-asset created");
        this.showSubAssetDialog = false;
        this.loadSubAssets();
      },
      error: (err) => {
        this.toast("error", err?.error?.message || "Failed to create sub-asset");
      }
    });
  }
  loadSpecifications() {
    if (!this.asset?.id) return;

    this.assetAPI.getSpecifications(this.asset.id).subscribe({
      next: (res) => {
        this.specifications = res || [];
      },
      error: () => {
        this.specifications = [];
      }
    });
  }

  saveSpecification(form: any) {
    if (!this.asset?.id) {
      this.toast('error', 'Save asset first');
      return;
    }

    if (!this.specFormModel.key?.trim() || !this.specFormModel.value?.trim()) {
      this.toast('error', 'Key and Value are required');
      return;
    }

    const payload = {
      assetId: this.asset.id,
      key: this.specFormModel.key.trim(),
      value: this.specFormModel.value.trim(),
      specificationGroup: this.specFormModel.specificationGroup || null,
      valueType: this.specFormModel.valueType || null,
      unit: this.specFormModel.unit || null,
      sortOrder: this.specFormModel.sortOrder != null ? Number(this.specFormModel.sortOrder) : 0,
      isMandatory: !!this.specFormModel.isMandatory,
      source: this.specFormModel.source || null,
      remarks: this.specFormModel.remarks || null,
    };

    const request$ = this.specFormModel.id
      ? this.assetAPI.updateSpecification(this.specFormModel.id, payload)
      : this.assetAPI.createSpecification(payload);

    request$.subscribe({
      next: () => {
        this.toast('success', this.specFormModel.id ? 'Specification updated' : 'Specification added');
        this.loadSpecifications();
        this.resetSpecificationForm(form);
      },
      error: (err) => {
        this.toast('error', err?.error?.message || 'Failed to save specification');
      }
    });
  }

  editSpecification(spec: any) {
    this.specFormModel = {
      id: spec.id,
      key: spec.key || '',
      value: spec.value || '',
      specificationGroup: spec.specificationGroup || null,
      valueType: spec.valueType || 'TEXT',
      unit: spec.unit || '',
      sortOrder: spec.sortOrder ?? 0,
      isMandatory: spec.isMandatory ?? false,
      source: spec.source || null,
      remarks: spec.remarks || '',
    };
  }

  resetSpecificationForm(form?: any) {
    if (form) {
      form.resetForm();
    }

    this.specFormModel = {
      id: null,
      key: '',
      value: '',
      specificationGroup: null,
      valueType: 'TEXT',
      unit: '',
      sortOrder: 0,
      isMandatory: false,
      source: null,
      remarks: '',
    };
  }
  get isStoreDepartmentUser(): boolean {
    return Number(this.currentUser?.departmentId) === this.storeDepartmentId;
  }

  get isAssetDepartmentUser(): boolean {
    return Number(this.currentUser?.departmentId) === Number(this.asset?.departmentId);
  }

  get isHod(): boolean {
    return this.currentUser?.role === 'HOD';
  }

  get isSupervisor(): boolean {
    return this.currentUser?.role === 'SUPERVISOR';
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  get isEndUser(): boolean {
    return this.currentUser?.role === 'USER';
  }

  private evaluateAccessRights(): void {
    const inEditMode = !!this.route.snapshot.paramMap.get('id');
    const hasModuleConfig = this.allowedAssetItems.size > 0;

    // ── ADMIN: unrestricted access to everything ──────────────────────────
    if (this.isAdmin) {
      this.canEditBasicDetails    = true;
      this.canAccessDepartmentTabs = true;
      this.canAccessAsEndUser      = true;
      this.canDeleteAsset          = true;
      return;
    }

    // ── Basic details (form fields enabled/disabled) ──────────────────────
    // Store department users fill in the basic asset info.
    // With module-access config: 'create' permission = can fill basic details.
    // Without config: fall back to isStoreDepartmentUser (dept ID check).
    if (hasModuleConfig) {
      this.canEditBasicDetails = inEditMode
        ? this.allowedAssetItems.has('edit') || this.allowedAssetItems.has('create')
        : this.allowedAssetItems.has('create');
    } else {
      this.canEditBasicDetails = this.isStoreDepartmentUser;
    }

    // ── Delete permission ─────────────────────────────────────────────────
    this.canDeleteAsset = hasModuleConfig ? this.allowedAssetItems.has('delete') : false;

    // ── Department tabs (Assignment, Specs, QR, Depreciation, etc.) ───────
    // Only the HOD or Supervisor of the department the asset is ASSIGNED TO
    // can see these tabs. A HOD from a different department cannot.
    this.canAccessDepartmentTabs = false;
    this.canAccessAsEndUser      = false;

    // Department tabs require the asset to already be assigned to a department
    if (!this.asset?.id || !this.asset?.departmentId) return;

    this.canAccessDepartmentTabs = this.isHod || this.isSupervisor;
    this.canAccessAsEndUser      = this.isEndUser;
  }
  onSubAssetSourceChange() {
    if (this.subAssetForm.sourceType === 'NEW') {
      this.subAssetForm.status = 'PENDING_COMPLETION';
      this.subAssetForm.sparePartId = null;
      this.subAssetForm.quantity = 1;
    } else {
      this.subAssetForm.status = 'IN_STORE';
      this.subAssetForm.modeOfProcurement = 'PURCHASE';
      this.subAssetForm.sparePartId = null;
      this.subAssetForm.quantity = 1;
    }
  }

  // ── Replace sub-asset ────────────────────────────────────────────────────
  showReplaceDialog = false;
  replaceTarget: any = null;
  replaceSaving = false;
  replaceForm: any = {};

  get assetTypeOptions() { return this.assetTypes; }
  get categoryOptions() { return this.categories.map((c: any) => ({ label: c.name, value: c.id })); }
  get procurementOptions() { return this.procurementModes; }
  get conditionOptions() {
    return [
      { label: 'Working', value: 'WORKING' },
      { label: 'Partial', value: 'PARTIAL' },
      { label: 'Not Working', value: 'NOT_WORKING' },
    ];
  }
  get sparePartOptions() { return this.inventorySpareOptions; }

  openReplaceDialog(sub: any) {
    this.replaceTarget = sub;
    this.replaceForm = {
      sourceType: 'INVENTORY_SPARE',
      sparePartId: null,
      assetName: '',
      serialNumber: '',
      assetType: '',
      assetCategoryId: null,
      modeOfProcurement: 'PURCHASE',
      purchaseCost: null,
      invoiceNumber: '',
      purchaseDate: null,
      cost: null,
      reason: '',
      workingCondition: 'WORKING',
    };
    this.searchInventorySpares('');
    this.showReplaceDialog = true;
  }

  onReplaceSourceChange() {
    this.replaceForm.sparePartId = null;
    this.replaceForm.assetName = '';
    this.replaceForm.serialNumber = '';
  }

  submitReplace() {
    if (!this.asset?.assetId || !this.replaceTarget) return;
    const f = this.replaceForm;

    if (!f.serialNumber?.trim()) { this.toast('error', 'Serial number is required'); return; }
    if (!f.assetCategoryId) { this.toast('error', 'Category is required'); return; }
    if (f.sourceType === 'INVENTORY_SPARE' && !f.sparePartId) { this.toast('error', 'Select a spare part'); return; }
    if (f.sourceType === 'NEW' && (!f.assetName?.trim() || !f.assetType || !f.modeOfProcurement)) {
      this.toast('error', 'Name, type and procurement mode are required'); return;
    }

    const payload: any = {
      sourceType: f.sourceType,
      serialNumber: f.serialNumber.trim(),
      assetCategoryId: Number(f.assetCategoryId),
      cost: f.cost ? Number(f.cost) : null,
      reason: f.reason || null,
      workingCondition: f.workingCondition || 'WORKING',
    };

    if (f.sourceType === 'INVENTORY_SPARE') {
      payload.sparePartId = Number(f.sparePartId);
    } else {
      payload.assetName = f.assetName.trim();
      payload.assetType = f.assetType;
      payload.modeOfProcurement = f.modeOfProcurement;
      if (f.purchaseCost) payload.purchaseCost = Number(f.purchaseCost);
      if (f.invoiceNumber) payload.invoiceNumber = f.invoiceNumber;
      if (f.purchaseDate) payload.purchaseDate = f.purchaseDate;
    }

    this.replaceSaving = true;
    this.assetAPI.replaceSubAsset(this.asset.assetId, this.replaceTarget.assetId, payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.replaceSaving = false;
          this.showReplaceDialog = false;
          this.toast('success', 'Component replaced successfully');
          this.loadSubAssets();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.replaceSaving = false;
          this.toast('error', err?.error?.message || 'Failed to replace component');
          this.cdr.detectChanges();
        });
      }
    });
  }
  searchInventorySpares(query: string) {
    this.inventorySearch = query;

    this.assetAPI.searchSpareParts(query).subscribe({
      next: (res) => {
        this.inventorySpareOptions = res || [];
      },
      error: () => {
        this.inventorySpareOptions = [];
      }
    });
  }
  loadSlaOptionsByCategory() {
    if (!this.asset.assetCategoryId) {
      this.slaCategoryOptions = [];
      this.slaMatrixRows = [];
      this.asset.slaCategory = null;
      return;
    }

    this.assetAPI.getByCategory(this.asset.assetCategoryId).subscribe({
      next: (rows) => {
        this.slaMatrixRows = rows;

        const distinctCategories = [...new Set(rows.map(x => x.slaCategory))];

        this.slaCategoryOptions = distinctCategories.map(category => ({
          label: category,
          value: category
        }));

        if (this.asset.slaCategory) {
          this.onSlaCategoryChange();
        }
      },
      error: () => {
        this.slaCategoryOptions = [];
        this.slaMatrixRows = [];
        this.toast('error', 'Failed to load SLA options');
      }
    });
  }

  onSlaCategoryChange() {
    if (!this.asset.assetCategoryId || !this.asset.slaCategory) {
      this.asset.slaExpectedValue = null;
      this.asset.slaExpectedUnit = null;
      this.asset.slaResolutionValue = null;
      this.asset.slaResolutionUnit = null;
      return;
    }

    const matched = this.slaMatrixRows.find(
      x =>
        x.assetCategoryId === this.asset.assetCategoryId &&
        x.slaCategory === this.asset.slaCategory &&
        x.level === this.asset.level &&
        x.isActive
    );

    if (matched) {
      this.asset.slaExpectedValue = matched.responseTimeValue;
      this.asset.slaExpectedUnit = matched.responseTimeUnit;
      this.asset.slaResolutionValue = matched.resolutionTimeValue;
      this.asset.slaResolutionUnit = matched.resolutionTimeUnit;
    } else {
      this.asset.slaExpectedValue = null;
      this.asset.slaExpectedUnit = null;
      this.asset.slaResolutionValue = null;
      this.asset.slaResolutionUnit = null;
    }
  }

  onAssetCategoryChange() {
    this.asset.slaCategory = null;
    this.asset.slaExpectedValue = null;
    this.asset.slaExpectedUnit = null;
    this.asset.slaResolutionValue = null;
    this.asset.slaResolutionUnit = null;
    this.loadSlaOptionsByCategory();
  }
  private getEmptyAssetModel() {
    return {
      id: null,
      assetId: "",
      referenceCode: "",
      assetName: "",
      assetType: "",
      assetCategoryId: null,
      serialNumber: "",
      assetPhoto: "",
      rfidCode: "",
      modeOfProcurement: "",

      invoiceNumber: "",
      purchaseOrderNo: "",
      purchaseOrderDate: null,
      purchaseDate: null,
      purchaseCost: null,
      vendorId: null,
      warrantyStart: null,
      warrantyEnd: null,
      amcDetails: "",

      donorName: "",
      donationDate: null,
      assetCondition: "",
      estimatedValue: null,

      leaseStartDate: null,
      leaseEndDate: null,
      leaseAmount: null,

      rentalStartDate: null,
      rentalEndDate: null,
      rentalAmount: null,

      grnNumber: "",
      grnDate: null,
      grnValue: null,
      inspectionStatus: "",

      // Inspection
      inspectionDoneBy: "",
      inspectionCondition: "",
      inspectionRemark: "",
      physicalInspectionStatus: "",
      physicalInspectionDate: null,
      functionalInspectionStatus: "",
      functionalInspectionDate: null,
      functionalTestNotes: "",

      // Service coverage
      serviceCoverageType: "",

      departmentId: null,
      supervisorId: null,
      allottedToId: null,

      depreciationMethod: "",
      depreciationRate: null,
      expectedLifeYears: null,
      salvageValue: null,
      depreciationStartDate: null,

      insuranceProvider: "",
      policyNumber: "",
      coverageAmount: null,
      premiumAmount: null,
      insuranceStartDate: null,
      insuranceEndDate: null,
      notes: "",

      slaExpectedValue: null,
      slaExpectedUnit: "",
      slaResolutionValue: null,
      slaResolutionUnit: "",
      expectedLifetime: null,
      expectedLifetimeUnit: "",

      branchId: null,
      block: "",
      floor: "",
      room: "",
      employeeResponsibleId: null,
      departmentSnapshot: "",

      status: "PENDING_COMPLETION",
    };
  }
  resetLocationForm() {
    this.asset.branchId = null;
    this.asset.block = '';
    this.asset.floor = '';
    this.asset.room = '';
    this.asset.employeeResponsibleId = null;
    this.asset.departmentSnapshot = '';
  }
openReturnChecklist(row: any) {
  this.selectedReturnTransfer = row;
  this.selectedReturnTransferId = row.id;
  this.showReturnChecklistDialog = true;

  this.returnChecklistItems = [];
  this.returnChecklistResponses = [];
  this.returnChecklistLoading = true;
  this.returnError = '';
  this.returnNote = '';
  this.returnSelectedFile = null;

  this.transferAPI.getReturnChecklist(row.id).subscribe({
    next: (res: any) => {
      this.returnChecklistItems = res?.items || [];
      this.returnChecklistResponses = this.returnChecklistItems.map((x: any) => ({
        itemId: x.id,
        checked: false,
        remarks: ''
      }));

      this.returnChecklistLoading = false;
      setTimeout(() => this.initReturnCanvas(), 0);
    },
    error: () => {
      this.returnChecklistLoading = false;
      this.returnError = 'Failed to load return checklist';
      setTimeout(() => this.initReturnCanvas(), 0);
    }
  });
}

closeReturnChecklistDialog() {
  this.showReturnChecklistDialog = false;
  this.selectedReturnTransfer = null;
  this.selectedReturnTransferId = null;
  this.returnChecklistItems = [];
  this.returnChecklistResponses = [];
  this.returnChecklistLoading = false;
  this.returnError = '';
  this.returnNote = '';
  this.returnSelectedFile = null;
}

isReturnChecklistValid(): boolean {
  for (let i = 0; i < this.returnChecklistItems.length; i++) {
    const item = this.returnChecklistItems[i];
    const response = this.returnChecklistResponses[i];

    if (item?.isRequired && !response?.checked) {
      return false;
    }
  }
  return true;
}

getReturnChecklistError(): string {
  for (let i = 0; i < this.returnChecklistItems.length; i++) {
    const item = this.returnChecklistItems[i];
    const response = this.returnChecklistResponses[i];

    if (item?.isRequired && !response?.checked) {
      return `${item.title} is required`;
    }
  }
  return '';
}

onReturnFileSelect(event: any) {
  this.returnSelectedFile = event?.target?.files?.[0] || null;
}

completeReturnWithChecklist() {
  this.returnError = '';

  if (!this.selectedReturnTransferId) return;

  if (!this.isReturnChecklistValid()) {
    this.returnError = this.getReturnChecklistError();
    return;
  }

  const signature = this.returnCanvas?.nativeElement?.toDataURL() || '';

  const formData = new FormData();
  formData.append('returnNote', this.returnNote || '');
  formData.append('digitalSignature', signature);
  formData.append('checklist', JSON.stringify(this.returnChecklistResponses));

  if (this.returnSelectedFile) {
    formData.append('photo', this.returnSelectedFile);
  }

  this.transferAPI.completeReturn(this.selectedReturnTransferId, formData).subscribe({
    next: () => {
      this.closeReturnChecklistDialog();
      this.loadTransferHistory(this.asset.id);
    },
    error: (err: any) => {
      this.returnError = err?.error?.message || 'Failed to complete return';
    }
  });
}
initReturnCanvas() {
  const canvas = this.returnCanvas.nativeElement;
  const dpr = window.devicePixelRatio || 1;

  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);

  this.returnCtx = canvas.getContext('2d')!;
  this.returnCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  this.returnCtx.lineWidth = 2;
  this.returnCtx.lineCap = 'round';
  this.returnCtx.lineJoin = 'round';
  this.returnCtx.strokeStyle = '#111';

  canvas.onpointerdown = (e) => this.onReturnPointerDown(e);
  canvas.onpointermove = (e) => this.onReturnPointerMove(e);
  canvas.onpointerup = () => this.onReturnPointerUp();
  canvas.onpointerleave = () => this.onReturnPointerUp();

  canvas.style.touchAction = 'none';
}

private getReturnCanvasPoint(e: PointerEvent) {
  const canvas = this.returnCanvas.nativeElement;
  const rect = canvas.getBoundingClientRect();

  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

private onReturnPointerDown(e: PointerEvent) {
  e.preventDefault();
  const canvas = this.returnCanvas.nativeElement;
  canvas.setPointerCapture(e.pointerId);

  this.returnDrawing = true;

  const p = this.getReturnCanvasPoint(e);
  this.returnLastX = p.x;
  this.returnLastY = p.y;

  this.returnCtx.beginPath();
  this.returnCtx.moveTo(this.returnLastX, this.returnLastY);
}

private onReturnPointerMove(e: PointerEvent) {
  if (!this.returnDrawing) return;
  e.preventDefault();

  const p = this.getReturnCanvasPoint(e);

  this.returnCtx.lineTo(p.x, p.y);
  this.returnCtx.stroke();

  this.returnLastX = p.x;
  this.returnLastY = p.y;
}

private onReturnPointerUp() {
  this.returnDrawing = false;
  this.returnCtx.beginPath();
}

clearReturnSignature() {
  const canvas = this.returnCanvas.nativeElement;
  this.returnCtx.clearRect(0, 0, canvas.width, canvas.height);
  this.returnCtx.beginPath();
}

}
