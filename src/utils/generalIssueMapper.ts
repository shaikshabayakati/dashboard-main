import { DatabaseGeneralIssue, GeneralIssue } from '@/types/GeneralIssue';

/**
 * Maps database general issue records (snake_case) to frontend format (camelCase)
 */
export function mapDatabaseGeneralIssuesToFrontend(
    dbIssues: DatabaseGeneralIssue[]
): GeneralIssue[] {
    return dbIssues.map((dbIssue) => ({
        id: dbIssue.id,
        address: dbIssue.address,
        latitude: dbIssue.latitude,
        longitude: dbIssue.longitude,
        isAuthentic: dbIssue.is_authentic,
        rejectionReason: dbIssue.rejection_reason,
        isIssuePresent: dbIssue.is_issue_present,
        primaryIssue: dbIssue.primary_issue,
        subCategory: dbIssue.sub_category,
        evidence: dbIssue.evidence,
        isInfrastructureSafe: dbIssue.is_infrastructure_safe,
        nextStep: dbIssue.next_step,
        userPhone: dbIssue.user_phone,
        imageUrl: dbIssue.image_url,
        imagePath: dbIssue.image_path,
        createdAt: dbIssue.created_at,
        updatedAt: dbIssue.updated_at,
        wardNumber: dbIssue.ward_number,
        zone: dbIssue.zone,
        corporatorNameAddress: dbIssue.corporator_name_address,
    }));
}
