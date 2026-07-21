// Master catalog of asset-table columns. Keys must match the backend
// (department-columns.controller COLUMN_KEYS). `path` is a dotted accessor into
// the asset row; `type` drives how the cell renders.
export type ColType = 'text' | 'mono' | 'date' | 'currency' | 'photo';

export interface ColumnDef {
  key: string;
  label: string;
  path: string;
  type: ColType;
  fallback?: string;   // shown when the value is empty
  branchGated?: boolean; // only usable when branch features are on
  // Backend `filterField` this column maps to (assets.controller search).
  // Present only on columns the server can filter; absent → not offered in the
  // filter dropdown (e.g. photo, dates, currency, branch — branch has its own filter).
  filterField?: string;
}

export const COLUMN_CATALOG: ColumnDef[] = [
  { key: 'assetId', label: 'Asset ID', path: 'assetId', type: 'text', filterField: 'assetId' },
  { key: 'storeAssetId', label: 'Stores Ref', path: 'storeAssetId', type: 'mono', fallback: '-', filterField: 'storeAssetId' },
  { key: 'referenceCode', label: 'Reference Code', path: 'referenceCode', type: 'text', fallback: '-', filterField: 'referenceCode' },
  { key: 'assetName', label: 'Asset Name', path: 'assetName', type: 'text', filterField: 'assetName' },
  { key: 'assetType', label: 'Asset Type', path: 'assetType', type: 'text', fallback: '-', filterField: 'assetType' },
  { key: 'departmentName', label: 'Department', path: 'department.name', type: 'text', fallback: '-', filterField: 'department' },
  { key: 'currentBranchName', label: 'Branch', path: 'currentBranch.name', type: 'text', fallback: '-', branchGated: true },
  { key: 'assetCategoryName', label: 'Asset Category', path: 'assetCategory.name', type: 'text', fallback: '-', filterField: 'categoryName' },
  { key: 'allottedToName', label: 'Allotted To', path: 'allottedTo.name', type: 'text', fallback: 'Not Allotted', filterField: 'allottedTo' },
  { key: 'supervisorName', label: 'Supervisor', path: 'supervisor.name', type: 'text', fallback: '-', filterField: 'supervisor' },
  { key: 'subTypeName', label: 'Sub-Type', path: 'assetSubType.name', type: 'text', fallback: '-' },
  { key: 'serialNumber', label: 'Serial Number', path: 'serialNumber', type: 'text', fallback: '-', filterField: 'serialNumber' },
  { key: 'manufacturer', label: 'Manufacturer', path: 'manufacturer', type: 'text', fallback: '-', filterField: 'manufacturer' },
  { key: 'modelNumber', label: 'Model', path: 'modelNumber', type: 'text', fallback: '-', filterField: 'modelNumber' },
  { key: 'status', label: 'Status', path: 'status', type: 'text', fallback: '-', filterField: 'status' },
  { key: 'purchaseDate', label: 'Purchase Date', path: 'purchaseDate', type: 'date', fallback: '-' },
  { key: 'purchaseCost', label: 'Purchase Cost', path: 'purchaseCost', type: 'currency', fallback: '-' },
  { key: 'currentLocation', label: 'Current Location', path: 'currentLocation', type: 'text', fallback: '-', filterField: 'currentLocation' },
  { key: 'criticalityLevel', label: 'Criticality', path: 'criticalityLevel', type: 'text', fallback: '-', filterField: 'criticalityLevel' },
  { key: 'warrantyStatus', label: 'Warranty', path: 'warrantyStatus', type: 'text', fallback: '-', filterField: 'warrantyStatus' },
  { key: 'workingCondition', label: 'Condition', path: 'workingCondition', type: 'text', fallback: '-', filterField: 'workingCondition' },
  { key: 'installedAt', label: 'Installed Date', path: 'installedAt', type: 'date', fallback: '-' },
  { key: 'assetPhoto', label: 'Photo', path: 'assetPhoto', type: 'photo' },
];

export const CATALOG_BY_KEY: Record<string, ColumnDef> =
  COLUMN_CATALOG.reduce((m, c) => { m[c.key] = c; return m; }, {} as Record<string, ColumnDef>);

// Always shown; the picker cannot remove these.
export const MANDATORY_KEYS = ['assetId', 'assetName'];

// Read a dotted path (e.g. "department.name") off a row.
export function readPath(row: any, path: string): any {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), row);
}

// Resolve saved keys → ColumnDefs, dropping unknowns and branch-gated columns
// when branch features are off.
export function resolveColumns(keys: string[], branchFeatures: boolean): ColumnDef[] {
  return (keys || [])
    .map((k) => CATALOG_BY_KEY[k])
    .filter((c): c is ColumnDef => !!c && (!c.branchGated || branchFeatures));
}
