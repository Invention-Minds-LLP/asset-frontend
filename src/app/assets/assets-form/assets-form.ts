import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { InputTextModule } from "primeng/inputtext";
import { FloatLabelModule } from "primeng/floatlabel";
import { SelectModule } from "primeng/select";
import { MultiSelectModule } from "primeng/multiselect";
import { DatePickerModule } from "primeng/datepicker";
import { TableModule } from "primeng/table";
import { CheckboxModule } from "primeng/checkbox";
import { DialogModule } from "primeng/dialog";
import { TabViewModule } from "primeng/tabview";
import { ButtonModule } from "primeng/button";
import { TextareaModule } from "primeng/textarea";
import { SelectButtonModule } from "primeng/selectbutton";

// Services
import { Assets } from "../../services/assets/assets";
import { AssetPoolService } from "../../services/asset-pool/asset-pool";
import { Branches } from "../../services/branches/branches";
import { StoreService } from "../../services/store/store";
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
import { QuickActionsService } from "../../services/quick-actions/quick-actions";
import { printQrLabels } from "../qr-label-print";

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
    MultiSelectModule,
    DatePickerModule,
    TableModule,
    TextareaModule,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    TabViewModule,
    SelectButtonModule,
    WarrantyForm,
    ToastModule,
    AssetQr,
    QRCodeComponent
  ],
  providers: [MessageService],
  templateUrl: "./assets-form.html",
  styleUrl: "./assets-form.css",
})
export class AssetsForm implements OnInit {

  role: "store_user" | "department_user" | "superadmin" = "store_user";
  activeTab = 0;
  saving = false;
  savingDuplicate = false;
  savingInsurance = false;
  renewalSubmitting = false;
  updatingSpec = false;
  addingSpec = false;
  savingSubAsset = false;
  savingSLA = false;
  updatingLocation = false;
  submittingTransfer = false;
  updatingDepreciation = false;
  submitting = false;
  editingSpec = false;
  savingSpec = false;

  // =============================
  // DROPDOWNS
  // =============================
  assetNatureOptions = [
    { label: "Tangible (Physical asset)", value: "TANGIBLE" },
    { label: "Intangible (Non-physical asset)", value: "INTANGIBLE" }
  ];

  intangibleSubTypes = [
    { label: "Software", value: "SOFTWARE" },
    { label: "License", value: "LICENSE" },
    { label: "Patent", value: "PATENT" },
    { label: "Copyright", value: "COPYRIGHT" },
    { label: "Trademark", value: "TRADEMARK" },
    { label: "Franchise Rights", value: "FRANCHISE_RIGHTS" },
    { label: "Goodwill", value: "GOODWILL" },
    { label: "Accreditation Rights (NABH/JCI)", value: "ACCREDITATION_RIGHTS" },
    { label: "Subscription (SaaS/Cloud)", value: "SUBSCRIPTION" },
    { label: "Other", value: "OTHER" }
  ];

  amortizationMethods = [
    { label: "Straight Line", value: "STRAIGHT_LINE" },
    { label: "Accelerated", value: "ACCELERATED" }
  ];

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
    { label: "Straight Line / Life-based (SL)", value: "SL" },
    { label: "Written Down Value / Rate-based (WDV)", value: "DB" },
    { label: "Other", value: "OTHER" }
  ];

  depreciationFrequencies = [
    { label: "Yearly", value: "YEARLY" },
    { label: "Monthly", value: "MONTHLY" }
  ];

  decimalPlacesOptions = [
    { label: "Nearest Rupee (0 decimal)", value: 0 },
    { label: "2 Decimal Places (paise)", value: 2 },
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
  subTypes: any[] = [];
  // Co-supervisors (excludes the primary in asset.supervisorId) for shift-wise duty.
  additionalSupervisorIds: number[] = [];
  savingSupervisors = false;
  stores: any[] = [];
  employees: any[] = [];
  branches: any[] = [];

  /**
   * Whether the currently-selected category requires a serial number.
   * Defaults to true if no category is selected yet, or if the category
   * doesn't have the flag set (back-compat with older rows).
   */
  get isSerialRequiredForCategory(): boolean {
    const catId = this.asset?.assetCategoryId;
    if (!catId) return true;
    const cat = this.categories.find((c: any) => c.id === catId);
    if (!cat) return true;
    return cat.serialRequired !== false;
  }

  /**
   * Effective placement profile for the Location tab fields.
   * Per-asset choice wins; falls back to the category's default, then ROOM.
   * (Categories are broad — IT Equipment, Furniture — so the asset-level pick
   * is what distinguishes a camera from a laptop within the same category.)
   */
  get currentLocationProfile(): string {
    if (this.asset?.placementProfile) return this.asset.placementProfile;
    const cat = this.categories.find((c: any) => c.id === this.asset?.assetCategoryId);
    return cat?.locationProfile || 'ROOM';
  }

  placementProfileOptions = [
    { label: 'Room — Block / Floor / Room only', value: 'ROOM' },
    { label: 'Camera / sensor — mount, coverage, GPS', value: 'CAMERA' },
    { label: 'Network gear — rack, U-position, port', value: 'NETWORK' },
    { label: 'Outdoor — GPS', value: 'OUTDOOR' },
    { label: 'Generic — mount + label', value: 'GENERIC' },
  ];

  sendingAssignment = false;

  // ==============================
  // ASSET DATA MODEL (frontend)
  // ==============================
  asset: any = {
    id: null,
    assetId: "",
    storeAssetId: "",
    referenceCode: "",
    assetName: "",
    assetType: "",
    assetNature: "TANGIBLE",

    // Intangible-specific
    intangibleSubType: null,
    usefulLifeYears: null,
    amortizationMethod: "STRAIGHT_LINE",
    amortizationStartDate: null,
    residualValuePercent: 0,

    assetCategoryId: null,
    assetSubTypeId: null,
    currentStoreId: null,
    serialNumber: "",
    assetPhoto: "",
    rfidCode: "",
    modeOfProcurement: "",

    // purchase
    invoiceNumber: "",
    purchaseOrderNo: "",
    purchaseOrderDate: null,
    purchaseDate: null,
    installedAt: null,
    purchaseCost: null,
    purchaseVoucherNo: "",
    purchaseVoucherDate: null,
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

    // Legacy asset onboarding
    assetPoolId: null as number | null,
    financialYearAdded: null as string | null,
    isLegacyAsset: false,
    dataAvailableSince: null,
    historicalMaintenanceCost: null,
    historicalSparePartsCost: null,
    historicalOtherCost: null,
    historicalCostAsOf: null,
    historicalCostNote: "",

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
    slaMode: 'CATEGORY',       // CATEGORY = inherit from SLA matrix; CUSTOM = manual entry
    slaCategory: null,
    slaExpectedValue: null,
    slaExpectedUnit: "",
    slaResolutionValue: null,
    slaResolutionUnit: "",

    slaLevel: '',

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

  // Pool lookup state
  poolOptions: any[] = [];
  propDepLoading = false;

  depreciationForm = {
    depreciationMethod: '',
    depreciationRate: null as number | null,
    expectedLifeYears: null as number | null,
    salvageValue: null as number | null,
    depreciationStart: null as Date | null,
    depreciationFrequency: 'YEARLY' as 'YEARLY' | 'MONTHLY',
    roundOff: false,
    decimalPlaces: 2,
    openingAccumulatedDepreciation: null as number | null,
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
    { key: 'serial', label: 'Serial number / asset tag verified and matches physical unit' },
    { key: 'condition', label: 'Physical condition inspected and documented' },
    { key: 'accessories', label: 'All accessories / components accounted for' },
    { key: 'docs', label: 'Invoice / GRN / delivery note received and filed' },
    { key: 'location', label: 'Storage location / department confirmed' },
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


  // An asset assigned outside the acknowledgement flow (imported / directly
  // assigned): it has a real (non-TEMP) ID and no acknowledgement records at all.
  // For these, the assignment fields are editable directly and saved via the
  // normal Save — they don't need to re-run the HOD → Supervisor → End-User
  // handover. A TEMP- id (source HOD not yet acknowledged) or any in-progress
  // flow keeps the strict gating.
  get isDirectAssignAsset(): boolean {
    if (!this.asset?.id) return false;
    if (String(this.asset?.assetId || '').startsWith('TEMP')) return false;
    // Non-TEMP assets only get a real ID via the source-HOD acknowledgement, so a
    // real ID with sourceHodStatus still NONE means it was assigned outside the
    // flow (imported). Keyed on sourceHodStatus alone so that sending per-role
    // acknowledgement requests (which set supervisor/end-user to PENDING) does
    // NOT flip the asset back into the strict flow UI.
    return this.flowState.sourceHodStatus === 'NONE';
  }

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
    private storeService: StoreService,
    private locationAPI: Location,
    private transferAPI: Transferr,
    private auth: Auth,
    private route: ActivatedRoute,
    private toastService: MessageService,
    private cdr: ChangeDetectorRef,
    private moduleAccessService: ModuleAccessService,
    private poolService: AssetPoolService,
    private quickActions: QuickActionsService
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

    // Sub-types are department-owned; the dropdown is loaded per the asset's
    // department once the asset is loaded (loadSubTypesForAsset).

    this.assetAPI.getVendors().subscribe({
      next: (res) => {
        this.vendors = res || [];
      }
    });

    this.storeService.getAll().subscribe({
      next: (res: any) => {
        this.stores = Array.isArray(res) ? res : (res?.data ?? []);
        // On create, default to the Main Store so the asset is parked there.
        if (!this.asset.id && !this.asset.currentStoreId && this.stores.length) {
          const mainStore = this.stores.find((s: any) => s.storeType === 'MAIN_STORE') || this.stores[0];
          this.asset.currentStoreId = mainStore?.id ?? null;
        }
        this.cdr.detectChanges();
      },
      error: () => { }
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

    this.poolService.listPools().subscribe({
      next: (res: any) => {
        this.poolOptions = (res || []).map((p: any) => ({
          label: `${p.poolCode} — ${p.financialYear} (${p.originalQuantity - (p._count?.assets || 0)} remaining)`,
          value: p.id,
        }));
      },
      error: () => { }
    });
  }

  onPoolChange() {
    const poolId = this.asset.assetPoolId;
    const cost = this.asset.purchaseCost;
    if (!poolId || !cost || !this.asset.isLegacyAsset) return;
    this.propDepLoading = true;
    this.poolService.getProportionalDep(poolId, cost).subscribe({
      next: (res: any) => {
        if (res?.openingAccumulatedDep != null) {
          this.depreciationForm.openingAccumulatedDepreciation = res.openingAccumulatedDep;
          this.toast('info', `Proportional dep auto-filled: ₹${Math.round(res.openingAccumulatedDep).toLocaleString('en-IN')}`);
        }
        this.propDepLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.propDepLoading = false; }
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
      "purchaseVoucherDate",
      "donationDate",
      "leaseStartDate",
      "leaseEndDate",
      "rentalStartDate",
      "rentalEndDate",
      "grnDate",
      "installedAt",
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
        depreciationFrequency: asset.depreciation.depreciationFrequency || 'YEARLY',
        roundOff: asset.depreciation.roundOff ?? false,
        decimalPlaces: asset.depreciation.decimalPlaces ?? 2,
        openingAccumulatedDepreciation: null,
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

    asset.slaMode = asset.slaMode ?? 'CATEGORY';
    asset.slaLevel = asset.slaLevel ?? '';
    asset.slaExpectedValue = asset.slaExpectedValue ?? null;
    asset.slaExpectedUnit = asset.slaExpectedUnit ?? '';
    asset.slaResolutionValue = asset.slaResolutionValue ?? null;
    asset.slaResolutionUnit = asset.slaResolutionUnit ?? '';
    this.targetDepartmentId = asset.targetDepartmentId ?? null;
    this.targetAllottedToId = asset.allottedToId ?? null;

    this.selectedParentAssetId = asset.parentAsset?.assetId || null;

    // If asset already exists (has id), mark checklist as done (it was completed at creation time)
    if (asset.id) {
      this.creationChecklist.forEach(item => {
        this.creationChecklistDone[item.key] = true;
      });
    }

    this.asset = asset;
    if (this.asset?.assetId) {
      this.loadSubAssets();
      this.loadInsuranceHistory();
      this.evaluateAccessRights()
      this.loadSpecifications();
      this.loadSupervisors();
      this.loadSubTypesForAsset();
      // preserveExisting: keep the asset's stored SLA times on load — don't
      // recompute/overwrite from the (possibly changed) matrix. (#2 fix)
      this.loadSlaOptionsByCategory(true);
    }
    console.log(this.asset)
  }


  // ================================
  // PHASE 1 SAVE BASIC DETAILS
  // ================================
  // Set by the "Save & Duplicate" button so the post-save handler
  // preserves PO/GRN/vendor/etc. instead of clearing the whole form.
  pendingDuplicate = false;

  isSaving = this.saving;

  saveAndDuplicate(form: any) {
    this.savingDuplicate = true;
    this.pendingDuplicate = true;
    this.saveBasicDetails(form);
  }

  saveBasicDetails(form: any) {
        // Existing asset (loaded for edit) → PUT update. New asset → POST create.
    // Without this branch, editing an existing asset re-hits the create endpoint
    // and fails on the unique serial-number constraint.
    const isEdit = !!this.asset.id;

    if (!form.valid) {
      this.pendingDuplicate = false;
      return this.toast("error", "Fill required fields");
    }

    // The store-receipt checklist is a creation-time gate only; it must not block
    // edits (e.g. an HOD just renaming an existing asset).
    if (!isEdit && !this.allCreationItemsChecked) {
      this.pendingDuplicate = false;
      this.saving = false;
      return this.toast("error", "Complete all checklist items before saving");
    }

    const isDuplicate = this.pendingDuplicate;
    this.pendingDuplicate = false;

    const request$ = isEdit
      ? this.assetAPI.updateAsset(this.asset.id, this.asset)
      : this.assetAPI.createAsset(this.asset);

    request$.subscribe({
      next: res => {
        this.asset.id = res.id;
        this.asset.assetId = res.assetId;
        this.asset.storeAssetId = res.storeAssetId;
        this.toast("success", isDuplicate ? "Saved — form ready for next unit" : "Basic details saved");
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
        // 🔥 After creating asset, start HOD acknowledgement flow (if department selected).
        // Skipped on edit so re-saving an existing asset doesn't restart the ack workflow.
        if (!isEdit && this.asset.departmentId) {
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
        if (isDuplicate) {
          this.prepareDuplicate();
          // Keep on Basic Details tab; mark form pristine so required-field errors don't flash.
          this.activeTab = 0;
          setTimeout(() => {
            form.form.markAsPristine();
            form.form.markAsUntouched();
          });
        } else {
          form.resetForm();
          this.clearForm();
          this.savingDuplicate = false;
          this.activeTab = 0;
        }
      },
      error: () => {
        setTimeout(() => this.saving = false);
        this.toast("error", "Failed to save");
      }
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

  /**
   * Reset the form for the next unit in the same batch:
   * keep PO/GRN/vendor/category/cost/dates/department/inspection/etc.,
   * blank out per-unit identifiers (assetId, storeAssetId, serial, reference, photo, rfid).
   */
  private prepareDuplicate() {
    const a = this.asset;
    const shared: any = {
      // identification (shared across batch)
      assetName: a.assetName,
      assetType: a.assetType,
      assetNature: a.assetNature,
      assetCategoryId: a.assetCategoryId,
      assetSubTypeId: a.assetSubTypeId,
      modeOfProcurement: a.modeOfProcurement,

      // intangible details (if applicable)
      intangibleSubType: a.intangibleSubType,
      usefulLifeYears: a.usefulLifeYears,
      amortizationMethod: a.amortizationMethod,
      amortizationStartDate: a.amortizationStartDate,
      residualValuePercent: a.residualValuePercent,

      // procurement / vendor / cost (shared across same PO)
      invoiceNumber: a.invoiceNumber,
      purchaseOrderNo: a.purchaseOrderNo,
      purchaseOrderDate: a.purchaseOrderDate,
      purchaseDate: a.purchaseDate,
      purchaseCost: a.purchaseCost,
      vendorId: a.vendorId,
      purchaseVoucherNo: a.purchaseVoucherNo,
      purchaseVoucherDate: a.purchaseVoucherDate,

      // GRN (shared across same receipt)
      grnNumber: a.grnNumber,
      grnDate: a.grnDate,
      grnValue: a.grnValue,
      inspectionStatus: a.inspectionStatus,
      inspectionRemarks: a.inspectionRemarks,

      // donation / lease / rental (shared across batch)
      donorName: a.donorName,
      donationDate: a.donationDate,
      assetCondition: a.assetCondition,
      estimatedValue: a.estimatedValue,
      leaseStartDate: a.leaseStartDate,
      leaseEndDate: a.leaseEndDate,
      leaseAmount: a.leaseAmount,
      rentalStartDate: a.rentalStartDate,
      rentalEndDate: a.rentalEndDate,
      rentalAmount: a.rentalAmount,

      // inspection (typically done for whole batch)
      inspectionDoneBy: a.inspectionDoneBy,
      inspectionCondition: a.inspectionCondition,
      inspectionRemark: a.inspectionRemark,
      physicalInspectionStatus: a.physicalInspectionStatus,
      physicalInspectionDate: a.physicalInspectionDate,
      functionalInspectionStatus: a.functionalInspectionStatus,
      functionalInspectionDate: a.functionalInspectionDate,
      functionalTestNotes: a.functionalTestNotes,

      // destination (going to same department in the batch)
      departmentId: a.departmentId,
      supervisorId: a.supervisorId,

      // service / SLA / lifetime — same template for the batch
      serviceCoverageType: a.serviceCoverageType,
      expectedLifetime: a.expectedLifetime,
      expectedLifetimeUnit: a.expectedLifetimeUnit,
    };

    this.asset = { ...this.getEmptyAssetModel(), ...shared };
    // per-unit transient state
    this.pendingAssetImageFile = null;
    this.imagePreviewUrl = null;
    // checklist already completed for the batch — leave creationChecklistDone alone
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

  get depreciationCostBasis(): number {
    return Number(this.asset.purchaseCost) || Number(this.asset.estimatedValue) || 0;
  }

  get computedResidualValue(): number {
    return Number((this.depreciationCostBasis * 0.05).toFixed(2));
  }

  onDepreciationMethodChange() {
    // Clear rate when switching to SL (rate not used); keep for DB/WDV
    if (this.depreciationForm.depreciationMethod === 'SL') {
      this.depreciationForm.depreciationRate = null;
    }
    // DB/WDV: rate is disabled in the UI, so pull it from the category default when missing
    if (this.depreciationForm.depreciationMethod === 'DB') {
      if (!this.depreciationForm.depreciationRate) {
        const cat = this.categories.find((c: any) => c.id === Number(this.asset?.assetCategoryId));
        if (cat?.defaultDepreciationRate != null) this.depreciationForm.depreciationRate = Number(cat.defaultDepreciationRate);
      }
      if (!this.depreciationForm.expectedLifeYears) {
        const rate = Number(this.depreciationForm.depreciationRate || 15);
        this.depreciationForm.expectedLifeYears = rate > 0 ? Math.ceil(100 / rate) : 10;
      }
    }
    // Auto-fill residual value as 5% of cost basis if not yet set
    if (!this.depreciationForm.salvageValue && this.depreciationCostBasis > 0) {
      this.depreciationForm.salvageValue = this.computedResidualValue;
    }
  }

  saveDepreciation() {
    this.updatingDepreciation = true;
    const payload: any = {
      assetId: this.asset.id,
      depreciationMethod: this.depreciationForm.depreciationMethod,
      depreciationRate: this.depreciationForm.depreciationRate,
      expectedLifeYears: this.depreciationForm.expectedLifeYears,
      salvageValue: this.depreciationForm.salvageValue,
      depreciationStart: this.depreciationForm.depreciationStart,
      depreciationFrequency: this.depreciationForm.depreciationFrequency,
      roundOff: this.depreciationForm.roundOff,
      decimalPlaces: this.depreciationForm.decimalPlaces,
    };
    // Only pass opening balance on first-time create for legacy assets
    if (this.asset.isLegacyAsset && !this.asset.depreciation?.id && this.depreciationForm.openingAccumulatedDepreciation != null) {
      payload.openingAccumulatedDepreciation = this.depreciationForm.openingAccumulatedDepreciation;
    }

    // Asset-level fields on this tab (Voucher Details, Revenue Tracking) live on
    // the Asset record. Send the full asset object — matches existing section-save
    // pattern (see updateSection) and avoids accidentally blanking unrelated fields.
    this.assetAPI.updateAsset(this.asset.id, this.asset).subscribe({
      error: () => this.toast("error", "Failed to update voucher / revenue details"),
    });

    // If depreciation does NOT exist → CREATE
    if (!this.asset.depreciation?.id) {
      this.assetAPI.addDepreciation(this.asset.assetId, payload).subscribe({
        next: res => {
          this.asset.depreciation = res;
          this.toast("success", "Saved");
          this.updatingDepreciation = false;
          this.loadDepreciation()
        },
        error: () => {
          setTimeout(() => this.updatingDepreciation = false);
          this.toast("error", "Failed to add depreciation")
        }
      });
      return;
    }

    // If depreciation exists → UPDATE
    this.assetAPI.updateDepreciation(this.asset.depreciation.id, payload).subscribe({
      next: res => {
        this.asset.depreciation = res;
        this.toast("success", "Saved");
        this.updatingDepreciation = false;
      },
      error: () => {
        setTimeout(() => this.updatingDepreciation = false);
        this.toast("error", "Failed to update depreciation")
      }
    });
  }

  saveInsurance() {
    this.savingInsurance = true;
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
          this.savingInsurance = false;
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

  saveSLA() {
    this.savingSLA = true;
    this.updateSection("SLA updated");
  }

  // ================================
  // LOCATION MANAGEMENT
  // ================================
  // Phase 1 — precise placement option lists (label + value)
  placementTypeOptions = [
    { label: 'Room — inside a room', value: 'ROOM' },
    { label: 'Corridor / Hallway', value: 'CORRIDOR' },
    { label: 'Entrance / Lobby', value: 'ENTRANCE' },
    { label: 'Reception', value: 'RECEPTION' },
    { label: 'Staircase / Stairwell', value: 'STAIRWELL' },
    { label: 'Lift / Lift Lobby', value: 'LIFT_LOBBY' },
    { label: 'Ward / Bay', value: 'WARD' },
    { label: 'Parking', value: 'PARKING' },
    { label: 'Perimeter / Boundary Wall', value: 'PERIMETER' },
    { label: 'Rooftop / Terrace', value: 'ROOFTOP' },
    { label: 'Gate / Barrier', value: 'GATE' },
    { label: 'Server / Network Rack', value: 'RACK' },
    { label: 'Cable Duct / Shaft', value: 'DUCT' },
    { label: 'Wall / Ceiling Mounted', value: 'MOUNTED' },
    { label: 'Open Area / Zone', value: 'AREA' },
    { label: 'Outdoor / Open Ground', value: 'OUTDOOR' },
  ];
  mountTypeOptions = [
    { label: 'Wall', value: 'WALL' },
    { label: 'Ceiling', value: 'CEILING' },
    { label: 'Pole / Mast', value: 'POLE' },
    { label: 'Desk / Table', value: 'DESK' },
    { label: 'Floor Stand', value: 'FLOOR' },
    { label: 'Rack Mount (U-position)', value: 'RACK' },
    { label: 'Pedestal', value: 'PEDESTAL' },
    { label: 'Tripod', value: 'TRIPOD' },
    { label: 'Overhead Gantry / Beam', value: 'GANTRY' },
    { label: 'Bracket / Arm', value: 'BRACKET' },
    { label: 'Concealed / In-wall', value: 'CONCEALED' },
  ];

  saveLocation() {
    this.updatingLocation = true;
    if (!this.asset.id) return;

    const payload = {
      assetId: this.asset.id,
      branchId: this.asset.branchId,
      block: this.asset.block,
      floor: this.asset.floor,
      room: this.asset.room,
      employeeResponsibleId: this.asset.employeeResponsibleId,
      departmentSnapshot: this.asset.departmentSnapshot,
      // precise placement
      placementProfile: this.currentLocationProfile,
      placementType: this.asset.placementType ?? null,
      placementLabel: this.asset.placementLabel ?? null,
      mountType: this.asset.mountType ?? null,
      rackCode: this.asset.rackCode ?? null,
      rackUnit: this.asset.rackUnit ?? null,
      portRef: this.asset.portRef ?? null,
      coverageArea: this.asset.coverageArea ?? null,
      latitude: this.asset.latitude ?? null,
      longitude: this.asset.longitude ?? null,
    };

    // 👉 CREATE (first time)
    if (!this.currentLocationId) {
      this.locationAPI.addLocation(payload).subscribe({
        next: (res: any) => this.afterLocationSaved(res, 'added'),
        error: () => {
          setTimeout(() => this.updatingLocation = false);
          this.toast('error', 'Failed to add location')
        }
      });
      return;
    }

    // 👉 UPDATE (existing row)
    this.locationAPI.updateLocation(this.currentLocationId, payload).subscribe({
      next: (res: any) => this.afterLocationSaved(res, 'updated'),
      error: () => {
        setTimeout(() => this.updatingLocation = false);
        this.toast('error', 'Failed to update location')
      }
    });
  }

  /**
   * A location change routes through the approval module, so a 2xx does NOT
   * mean the asset has moved — only management/admin edits apply immediately.
   * Reporting "Location updated" on a queued request left people believing a
   * move was live when it was still sitting with their HOD.
   */
  private afterLocationSaved(res: any, verb: 'added' | 'updated') {
    if (res?.pending) {
      const approver = res.level === 'MANAGEMENT' ? 'management' : 'your HOD';
      this.toast(
        'warn',
        `Sent to ${approver} for approval. The asset's location is unchanged until it is signed off.`
      );
    } else {
      this.toast('success', `Location ${verb}`);
    }
    this.resetLocationForm();
    this.loadLocationHistory(this.asset.id);
    setTimeout(() => {
      this.updatingLocation = false;
      this.cdr.detectChanges();
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
      // precise placement — seed the per-asset profile from saved value, else category default
      const cat = this.categories.find((c: any) => c.id === this.asset?.assetCategoryId);
      this.asset.placementProfile = loc.placementProfile || cat?.locationProfile || 'ROOM';
      this.asset.placementType = loc.placementType;
      this.asset.placementLabel = loc.placementLabel;
      this.asset.mountType = loc.mountType;
      this.asset.rackCode = loc.rackCode;
      this.asset.rackUnit = loc.rackUnit;
      this.asset.portRef = loc.portRef;
      this.asset.coverageArea = loc.coverageArea;
      this.asset.latitude = loc.latitude;
      this.asset.longitude = loc.longitude;
    });
  }


  loadLocationHistory(id: number) {
    this.locationAPI.getHistory(id).subscribe(res => this.locationHistory = res);
  }

  // Approval status of a location-history row (REQUESTED = awaiting sign-off).
  locationStatusLabel(status: string | null | undefined): string {
    switch ((status || '').toUpperCase()) {
      case 'APPROVED': return 'Approved';
      case 'REQUESTED': return 'Pending approval';
      case 'REJECTED': return 'Rejected';
      default: return status || '—';
    }
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

  // Direct assignment for imported / already-assigned assets — no acknowledgement
  // chain. Persists department / supervisor / end-user straight to the asset.
  saveDirectAssignment() {
    if (!this.asset?.id) return this.toast("error", "Save basic details first");
    if (!this.asset.departmentId) return this.toast("error", "Select Source Department");

    this.sendingAssignment = true;
    const payload: any = { departmentId: Number(this.asset.departmentId) };
    if (this.asset.supervisorId) payload.supervisorId = Number(this.asset.supervisorId);
    if (this.asset.allottedToId) payload.allottedToId = Number(this.asset.allottedToId);
    if (this.targetDepartmentId) payload.targetDepartmentId = Number(this.targetDepartmentId);

    this.assetAPI.directAssignWithAck(this.asset.id, payload).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.sendingAssignment = false;
          const n = res?.acknowledgementRequested?.length || 0;
          this.toast("success", n
            ? `Assignment updated. Acknowledgement requested from ${n} ${n === 1 ? 'person' : 'people'}.`
            : "Assignment updated");
          this.refreshFlowState();
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        setTimeout(() => { this.sendingAssignment = false; this.cdr.detectChanges(); });
        this.toast("error", err?.error?.message || "Failed to update assignment");
      },
    });
    return;
  }

  saveAssignment() {
    this.sendingAssignment = true;
    if (!this.asset?.id) return this.toast("error", "Save basic details first");
    if (!this.handoverCondition?.trim()) {
      this.sendingAssignment = false;
      return this.toast("error", "Condition at Handover is required")
    };

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
            this.sendingAssignment = false;
            this.refreshFlowState();
          },
          error: () => {
            setTimeout(() => this.sendingAssignment = false);
            this.toast("error", "Failed to send Supervisor acknowledgement");
          }
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
            error: () => {
              setTimeout(() => this.sendingAssignment = false);
              this.toast("error", "Failed to send Target HOD acknowledgement")
            }
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
            this.sendingAssignment = false;
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
    this.submittingTransfer = true;
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
        this.submittingTransfer = false;
        this.resetTransferForm();
      },
      error: (err) => {
        setTimeout(() => this.submittingTransfer = false);
        this.toast("error", err?.error?.message || "Transfer request failed")
      }
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
    // this.renewalSubmitting = true;
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
        // this.renewalSubmitting = false;
        this.checkEditMode(); // reload active policy
      },
      error: () =>
        this.toast('error', 'Renewal failed')
    });
  }
  submitClaim() {
    this.renewalSubmitting = true;
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
        this.renewalSubmitting = false;
      },
      error: (err) => {
        setTimeout(() => this.renewalSubmitting = false);
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

  // ── QR label printing (main asset + all descendant sub-assets) ────────────
  // Hidden QR canvases are rendered for labelQrData, then captured and laid out
  // one-per-30×30mm-sticker. Reuses the bulk endpoint, which expands a single id
  // to its whole sub-asset tree server-side.
  labelQrData: { assetId: string; assetName: string }[] = [];
  loadingLabels = false;

  qrUrlFor(assetId: string): string {
    return `${window.location.origin}/assets/scan/${encodeURIComponent(assetId)}`;
  }

  printAssetLabels() {
    if (!this.asset?.id) {
      this.toastService.add({ severity: 'warn', summary: 'Save first', detail: 'Save the asset before printing labels.' });
      return;
    }
    this.loadingLabels = true;
    this.quickActions.getQRBulkPrintData([this.asset.id]).subscribe({
      next: (rows: any[]) => {
        this.labelQrData = (rows || []).map(r => ({ assetId: r.assetId, assetName: r.assetName }));
        this.loadingLabels = false;
        this.cdr.detectChanges();
        // Wait a tick so the hidden <qrcode> canvases finish rendering.
        setTimeout(() => {
          const cards = Array.from(document.querySelectorAll('#asset-label-area .qr-card')) as HTMLElement[];
          const tiles = cards.map(card => {
            const canvas = card.querySelector('canvas') as HTMLCanvasElement | null;
            return {
              dataUrl: canvas?.toDataURL('image/png') ?? '',
              id: card.getAttribute('data-asset-id') ?? '',
            };
          });
          printQrLabels(tiles, { widthMm: 30, heightMm: 30 });
        }, 300);
      },
      error: () => {
        this.loadingLabels = false;
        this.toastService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load QR data for labels.' });
        this.cdr.detectChanges();
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
    this.savingSubAsset = true;
    if (!this.asset?.assetId) return;

    const f = this.subAssetForm;

    // INVENTORY SPARE FLOW
    if (f.sourceType === 'INVENTORY_SPARE') {
      if (!f.sparePartId) return this.toast("error", "Select spare item");
      if (!f.assetName?.trim()) return this.toast("error", "Sub Asset Name is required");
      if (!f.serialNumber?.trim() && !this.asset?.isLegacyAsset) return this.toast("error", "Serial Number is required");
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
          this.savingSubAsset = false;
          this.loadSubAssets();
        },
        error: (err) => {
          setTimeout(() => this.savingSubAsset = false);
          this.toast("error", err?.error?.message || "Failed to create sub-asset from spare");
        }
      });
    }

    // NEW FLOW
    if (!f.assetName?.trim()) return this.toast("error", "Sub Asset Name is required");
    if (!f.serialNumber?.trim() && !this.asset?.isLegacyAsset) return this.toast("error", "Serial Number is required");
    if (!f.assetType) return this.toast("error", "Asset Type is required");
    if (!f.assetCategoryId) return this.toast("error", "Category is required");
    if (!f.status) return this.toast("error", "Status is required");
    if (!f.modeOfProcurement) return this.toast("error", "Mode of Procurement is required");

    if (f.modeOfProcurement === 'PURCHASE' && !this.asset?.isLegacyAsset) {
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
        this.savingSubAsset = false;
        this.loadSubAssets();
      },
      error: (err) => {
        setTimeout(() => this.savingSubAsset = false);
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

  savingMakeModel = false;
  // Sub-types shown are those owned by the asset's department.
  loadSubTypesForAsset() {
    const deptId = this.asset?.departmentId ? Number(this.asset.departmentId) : undefined;
    this.assetAPI.getSubTypes(deptId).subscribe({
      next: (res) => { this.subTypes = res || []; this.cdr.markForCheck(); },
      error: () => { this.subTypes = []; this.cdr.markForCheck(); },
    });
  }

  // Load the asset's supervisor set; primary lands on asset.supervisorId, the
  // rest populate the co-supervisor multi-select.
  loadSupervisors() {
    if (!this.asset?.id) return;
    this.assetAPI.getAssetSupervisors(this.asset.id).subscribe({
      next: (rows: any[]) => {
        const list = rows || [];
        const primary = list.find(r => r.isPrimary);
        if (primary) this.asset.supervisorId = primary.employeeId;
        this.additionalSupervisorIds = list
          .filter(r => !r.isPrimary)
          .map(r => r.employeeId);
        this.cdr.markForCheck();
      },
      error: () => { }
    });
  }

  // Persist the full supervisor set: primary (asset.supervisorId) + co-supervisors.
  saveSupervisors() {
    if (!this.asset?.id) { this.toast('error', 'Save asset first'); return; }
    if (!this.asset.supervisorId) { this.toast('error', 'Select the primary Source Supervisor first'); return; }

    const supervisors = [
      { employeeId: Number(this.asset.supervisorId), isPrimary: true },
      ...this.additionalSupervisorIds
        .filter(id => Number(id) !== Number(this.asset.supervisorId))
        .map(id => ({ employeeId: Number(id), isPrimary: false })),
    ];

    this.savingSupervisors = true;
    this.assetAPI.setAssetSupervisors(this.asset.id, supervisors).subscribe({
      next: () => { this.savingSupervisors = false; this.toast('success', 'Supervisors saved'); this.cdr.markForCheck(); },
      error: (err: any) => { this.savingSupervisors = false; this.toast('error', err?.error?.message || 'Failed to save supervisors'); this.cdr.markForCheck(); }
    });
  }

  saveMakeModel() {
    if (!this.asset?.id) { this.toast('error', 'Save asset first'); return; }
    this.savingMakeModel = true;
    this.assetAPI.updateAssetMakeModel(this.asset.id, {
      manufacturer: this.asset.manufacturer?.trim() || null,
      modelNumber: this.asset.modelNumber?.trim() || null,
      assetSubTypeId: this.asset.assetSubTypeId ? Number(this.asset.assetSubTypeId) : null,
    }).subscribe({
      next: () => { this.savingMakeModel = false; this.toast('success', 'Saved'); this.cdr.markForCheck(); },
      error: (err: any) => { this.savingMakeModel = false; this.toast('error', err?.error?.message || 'Failed to save'); this.cdr.markForCheck(); }
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

  selectedValue: string | null = null; //set null initially
  storedData: string[] = [];  //stores all groups in array
  dropdown = true;
  adding = false;

  // 1. This variable tracks what is inside the filter in real-time
  currentFilterText: string = '';

  // 2. This method runs automatically on every keystroke in the filter box
  onDropdownFilter(event: any): void {
    // PrimeNG passes the typed text via event.filter
    this.currentFilterText = event.filter ? event.filter.trim() : '';
    console.log(this.currentFilterText)
  }

  addNew(typedSearchQuery: string): void {

    console.log(typedSearchQuery)
    this.adding = true;

    // 1: Read directly from your form model variable instead of selectedValue
    // if (!this.specFormModel?.specificationGroup) {
    //   this.adding = false;
    //   return;
    // }

    const typedText = this.currentFilterText;
    console.log(typedText)

    // Force uppercase transformation
    const formattedValue = typedText.toUpperCase().replace(/\s+/g, '_');
    console.log(formattedValue)

    // Check dropdown options duplication
    const optionExists = this.specGroupOptions.some(
      option => option.value === formattedValue
    );

    if (!optionExists) {
      const formattedLabel = typedText.charAt(0).toUpperCase() + typedText.slice(1);
      this.specGroupOptions.push({
          label: formattedLabel,
          value: formattedValue
      });
    }

    console.log(this.storedData)

    // Add to your final stored array
    if (!this.storedData.includes(formattedValue)) {
      this.storedData.push(formattedValue);

      console.log(formattedValue)

      // FIX 2: Set the actual form value to the uppercase string 
      this.specFormModel.specificationGroup = formattedValue;
      console.log(this.specFormModel.specificationGroup)

      // Turn off loading state
      this.adding = false;
      this.cdr.detectChanges();
    } else {
      this.adding = false;
      alert('This group is already added!');
    }
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

  /**
   * The asset name stays editable for anyone who can edit basic details, PLUS the
   * HOD of the asset's own department — even though the rest of the basic-detail
   * fields remain locked for them. Lets HODs correct/rename an asset and save.
   */
  get canEditAssetName(): boolean {
    return this.canEditBasicDetails
      || (!!this.asset?.id && this.isHod && this.isAssetDepartmentUser);
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

  get isFinance(): boolean {
    return this.currentUser?.role === 'FINANCE';
  }

  // Depreciation inputs are editable only by Finance (admins override).
  get canEditDepreciation(): boolean {
    return this.isFinance || this.isAdmin;
  }

  // Depreciation tab is visible to the dept HOD/supervisor, the end user, Finance, and admin.
  get canSeeDepreciationTab(): boolean {
    return this.canAccessDepartmentTabs || this.canAccessAsEndUser || (this.isFinance && !!this.asset?.id);
  }

  // Autofill depreciation defaults from the selected category (rate is category-driven).
  onCategoryChange() {
    const cat = this.categories.find((c: any) => c.id === Number(this.asset?.assetCategoryId));
    if (!cat) return;
    if (cat.defaultDepreciationMethod) this.depreciationForm.depreciationMethod = cat.defaultDepreciationMethod;
    if (cat.defaultDepreciationRate != null) this.depreciationForm.depreciationRate = Number(cat.defaultDepreciationRate);
    if (cat.defaultLifeYears != null) this.depreciationForm.expectedLifeYears = Number(cat.defaultLifeYears);
  }

  private evaluateAccessRights(): void {
    const inEditMode = !!this.route.snapshot.paramMap.get('id');
    const hasModuleConfig = this.allowedAssetItems.size > 0;

    // ── ADMIN: unrestricted access to everything ──────────────────────────
    if (this.isAdmin) {
      this.canEditBasicDetails = true;
      this.canAccessDepartmentTabs = true;
      this.canAccessAsEndUser = true;
      this.canDeleteAsset = true;
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
    this.canAccessAsEndUser = false;

    // Department tabs require the asset to already be assigned to a department
    if (!this.asset?.id || !this.asset?.departmentId) return;

    this.canAccessDepartmentTabs = this.isHod || this.isSupervisor;
    this.canAccessAsEndUser = this.isEndUser;
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

    if (!f.serialNumber?.trim() && !this.asset?.isLegacyAsset) { this.toast('error', 'Serial number is required'); return; }
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
  slaModeOptions = [
    { label: 'Based on Category', value: 'CATEGORY' },
    { label: 'Custom', value: 'CUSTOM' }
  ];

  // Full lists for CUSTOM mode (nothing tied to the matrix).
  fullSlaCategoryOptions = [
    { label: 'LOW', value: 'LOW' },
    { label: 'MEDIUM', value: 'MEDIUM' },
    { label: 'HIGH', value: 'HIGH' }
  ];

  // Options shown in the form depend on the SLA source mode.
  get displaySlaCategoryOptions() {
    return this.asset?.slaMode === 'CUSTOM' ? this.fullSlaCategoryOptions : this.slaCategoryOptions;
  }

  get displayLevelOptions() {
    if (this.asset?.slaMode === 'CUSTOM') return this.levelOptions;
    // CATEGORY: only the levels actually configured for the chosen SLA category.
    const cat = this.asset?.slaCategory;
    const levels = [...new Set(
      this.slaMatrixRows
        .filter(r => !cat || r.slaCategory === cat)
        .map(r => r.level)
    )];
    return levels.map(l => ({ label: l, value: l }));
  }

  get isCustomSla(): boolean {
    return this.asset?.slaMode === 'CUSTOM';
  }

  // Toggle between matrix-driven (CATEGORY) and manual (CUSTOM) SLA.
  onSlaModeChange() {
    if (this.asset.slaMode === 'CATEGORY') {
      // Rebuild the configured options and re-derive times from the matrix.
      this.loadSlaOptionsByCategory(false);
    }
    // CUSTOM: keep whatever is there; the fields just become editable.
  }

  // preserveExisting: when loading an existing asset, build the dropdowns but
  // keep the stored SLA times — don't recompute from the (possibly changed)
  // matrix. Only a user-driven change recomputes. (#2 fix)
  loadSlaOptionsByCategory(preserveExisting = false) {
    if (!this.asset.assetCategoryId) {
      this.slaCategoryOptions = [];
      this.slaMatrixRows = [];
      if (!this.isCustomSla) this.asset.slaCategory = null;
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

        if (!preserveExisting && !this.isCustomSla && this.asset.slaCategory) {
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
    // In CUSTOM mode the user types the values — never overwrite them.
    if (this.isCustomSla) return;

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
        x.level === this.asset.slaLevel &&
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
    // CUSTOM keeps its manual values; CATEGORY resets and re-derives from matrix.
    if (!this.isCustomSla) {
      this.asset.slaCategory = null;
      this.asset.slaLevel = '';
      this.asset.slaExpectedValue = null;
      this.asset.slaExpectedUnit = null;
      this.asset.slaResolutionValue = null;
      this.asset.slaResolutionUnit = null;
    }
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

      // Legacy asset onboarding
      assetPoolId: null as number | null,
      financialYearAdded: null as string | null,
      isLegacyAsset: false,
      dataAvailableSince: null,
      historicalMaintenanceCost: null,
      historicalSparePartsCost: null,
      historicalOtherCost: null,
      historicalCostAsOf: null,
      historicalCostNote: "",

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

      slaMode: 'CATEGORY',
      slaCategory: null,
      slaLevel: '',
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
    // precise placement
    this.asset.placementProfile = null;
    this.asset.placementType = null;
    this.asset.placementLabel = '';
    this.asset.mountType = null;
    this.asset.rackCode = '';
    this.asset.rackUnit = '';
    this.asset.portRef = '';
    this.asset.coverageArea = '';
    this.asset.latitude = null;
    this.asset.longitude = null;
    this.currentLocationId = undefined;
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
    this.submitting = true;
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
        this.submitting = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        setTimeout(() => this.submitting = false);
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
