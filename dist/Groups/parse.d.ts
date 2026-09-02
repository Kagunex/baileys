/**
 * Parse group IQ result nodes into GroupMetadata / modification responses.
 */
import type { BinaryNode } from "../WABinary/types.js";
import type { GroupMetadata, GroupModificationResponse } from "../Types/Groups.js";
export declare function parseGroupMetadata(node: BinaryNode): GroupMetadata | undefined;
export declare function parseGroupCreateResult(node: BinaryNode): GroupMetadata | undefined;
export declare function parseGroupModification(node: BinaryNode): GroupModificationResponse;
export declare function parseInviteCode(node: BinaryNode): string | undefined;
//# sourceMappingURL=parse.d.ts.map