# SpendWise India - Firestore Security Spec

This specification outlines the data invariants and access controls implemented inside `/firestore.rules` for the RupeeFlow application.

## 1. Core Data Invariants

*   **Owner Privacy**: Users can only read, write, create, or update data stored under their own `/users/{userId}` path hierarchy. Blanket reads are strictly blocked.
*   **Immutable Types**: Transactions must maintain positive amounts (`amount > 0`) and valid types (`type == 'expense'` or `type == 'saving'`).
*   **Secure System Lock**: Users cannot wipe or delete their root user configuration record, preventing orphan transaction records.

## 2. The "Dirty Dozen" Forbidden Payloads

All the following write patterns attempt to breach boundaries and are blocked (Permission Denied):

1.  **Identity Theft**: Creating a transaction in user A's portfolio signed with user B's auth credentials.
2.  **Negative Currency Spoofing**: Recording an expense amount of `-₹1,25,000` to magically inflate remaining budget limit estimates.
3.  **Invalid Type Insertion**: Logging a transaction type of `banking-integration` which violates type rules.
4.  **Buffer Poisoning**: Submitting a description string of 1.5MB to cause buffer bloats.
5.  **Path Traversal ID Attack**: Injecting special characters like `../../../hack` into sub-documents tags.
6.  **Budget Purging**: Unauthenticated guest trying to edit budget limit numbers.
7.  **Goal Inflation Spoof**: Modifying another user's savings goal targets.
8.  **Orphan Generation**: Deleting a User document while leaving transaction logs behind.
9.  **Stash Theft**: Querying all savings goals without a strict `userId` filter.
10. **Timestamp Forgera**: Providing custom spoofed server times for creation timestamps.
11. **Malicious Enum Insertion**: Saving a category outside the specified enum tags.
12. **Future Goal Spill**: Setting current saved amount higher than the target amount constraint.
