/**
 * Utility functions for handling account ID validation and cleaning
 */
/**
 * Cleans and validates an account ID string to ensure it's a valid MongoDB ObjectId
 * @param accountId - The raw account ID string
 * @returns The cleaned account ID if valid
 * @throws Error if the account ID is invalid
 */
export function cleanAndValidateAccountId(accountId) {
    if (!accountId) {
        throw new Error('Account ID is required');
    }
    // Clean the account ID
    let cleanId = String(accountId).trim();
    // Handle case where accountId might be a serialized object string
    if (cleanId.length > 24) {
        // Try to extract ObjectId from serialized object string
        const objectIdMatch = cleanId.match(/ObjectId\('([0-9a-fA-F]{24})'\)/);
        if (objectIdMatch && objectIdMatch[1]) {
            cleanId = objectIdMatch[1];
        }
        else {
            throw new Error('Could not extract valid ObjectId from serialized string');
        }
    }
    // Validate ObjectId format (24 character hex string)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(cleanId)) {
        throw new Error(`Invalid account ID format. Expected 24 character hex string, got: "${cleanId}" (${cleanId.length} chars)`);
    }
    return cleanId;
}
/**
 * Safely extracts an account ID from user object, preferring corporateAccountId over id
 * @param user - User object with potential account IDs
 * @returns Cleaned and validated account ID
 * @throws Error if no valid account ID is found
 */
export function extractAccountIdFromUser(user) {
    const accountId = user.corporateAccountId || user.id;
    return cleanAndValidateAccountId(accountId);
}
