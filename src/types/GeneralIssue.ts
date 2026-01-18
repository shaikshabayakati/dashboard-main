// Type definitions for General Issues

// Enum types based on database constraints
export type PrimaryIssueType =
    | 'Road'
    | 'Footpath'
    | 'Electricity'
    | 'Garbage/sewage'
    | 'Stray animals'
    | 'None';

export type SubCategoryType =
    | 'Domestic'
    | 'Construction'
    | 'Potholes'
    | 'Manholes'
    | 'None';

export type RejectionReasonType =
    | 'None'
    | 'Screen Capture Detected'
    | 'Irrelevant Content';

// Next step structure (flexible JSON)
export interface NextStep {
    [key: string]: any;
}

// Database schema interface (matches PostgreSQL table)
export interface DatabaseGeneralIssue {
    id: number;
    address: string;
    latitude: number | null;
    longitude: number | null;
    is_authentic: boolean;
    rejection_reason: RejectionReasonType | null;
    is_issue_present: boolean;
    primary_issue: PrimaryIssueType | null;
    sub_category: SubCategoryType | null;
    evidence: string | null;

    next_step: NextStep | null;
    user_phone: string | null;
    image_url: string | null;
    image_path: string | null;
    created_at: string;
    updated_at: string;
    ward_number: number | null;
    zone: string | null;
    corporator_name_address: string | null;
    severity: string | null;
}

// Frontend interface (camelCase for React components)
export interface GeneralIssue {
    id: number;
    address: string;
    latitude: number | null;
    longitude: number | null;
    // Aliases for map compatibility
    lat: number | null;
    lng: number | null;
    isAuthentic: boolean;
    rejectionReason: RejectionReasonType | null;
    isIssuePresent: boolean;
    primaryIssue: PrimaryIssueType | null;
    subCategory: SubCategoryType | null;
    evidence: string | null;

    nextStep: NextStep | null;
    userPhone: string | null;
    imageUrl: string | null;
    imagePath: string | null;
    createdAt: string;
    updatedAt: string;
    wardNumber: number | null;
    zone: string | null;
    corporatorNameAddress: string | null;
    severity: string | null;
}
