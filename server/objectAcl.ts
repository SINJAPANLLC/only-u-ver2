// Reference: blueprint:javascript_object_storage integration
// Object ACL (Access Control List) for managing file access permissions
import { File } from "@google-cloud/storage";

const ACL_POLICY_METADATA_KEY = "custom:aclPolicy";

// The type of the access group for Only-U platform
// SUBSCRIBER: Users who have subscribed to a specific creator
export enum ObjectAccessGroupType {
  SUBSCRIBER = "subscriber",
}

// The logic user group that can access the object
export interface ObjectAccessGroup {
  type: ObjectAccessGroupType;
  // For SUBSCRIBER: the creator user ID
  id: string;
}

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclRule {
  group: ObjectAccessGroup;
  permission: ObjectPermission;
}

// The ACL policy of the object
export interface ObjectAclPolicy {
  owner: string; // Firebase user ID
  visibility: "public" | "private";
  aclRules?: Array<ObjectAclRule>;
}

// Check if the requested permission is allowed based on the granted permission
function isPermissionAllowed(
  requested: ObjectPermission,
  granted: ObjectPermission,
): boolean {
  if (requested === ObjectPermission.READ) {
    return [ObjectPermission.READ, ObjectPermission.WRITE].includes(granted);
  }
  return granted === ObjectPermission.WRITE;
}

// Base class for access groups
abstract class BaseObjectAccessGroup implements ObjectAccessGroup {
  constructor(
    public readonly type: ObjectAccessGroupType,
    public readonly id: string,
  ) {}

  public abstract hasMember(userId: string): Promise<boolean>;
}

// Subscriber access group - users who subscribed to a creator
class SubscriberAccessGroup extends BaseObjectAccessGroup {
  constructor(creatorId: string) {
    super(ObjectAccessGroupType.SUBSCRIBER, creatorId);
  }

  async hasMember(userId: string): Promise<boolean> {
    try {
      // Check Firestore for active subscription
      const { firestore } = await import('./firebase');
      
      // Check if user has an active subscription to this creator
      // Query subscriptions collection where subscriber=userId and creator=creatorId
      const subscriptionQuery = await firestore
        .collection('subscriptions')
        .where('subscriberId', '==', userId)
        .where('creatorId', '==', this.id)
        .where('status', '==', 'active')
        .limit(1)
        .get();
      
      return !subscriptionQuery.empty;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      // Fail closed: deny access if we cannot verify subscription
      return false;
    }
  }
}

function createObjectAccessGroup(
  group: ObjectAccessGroup,
): BaseObjectAccessGroup {
  switch (group.type) {
    case ObjectAccessGroupType.SUBSCRIBER:
      return new SubscriberAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}

// Sets the ACL policy to the object metadata
export async function setObjectAclPolicy(
  objectFile: File,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }

  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy),
    },
  });
}

// Gets the ACL policy from the object metadata
export async function getObjectAclPolicy(
  objectFile: File,
): Promise<ObjectAclPolicy | null> {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy as string);
}

// Checks if the user can access the object
export async function canAccessObject({
  userId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile: File;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }

  // Public objects are always accessible for read
  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
  ) {
    return true;
  }

  // Access control requires the user id
  if (!userId) {
    return false;
  }

  // The owner of the object can always access it
  if (aclPolicy.owner === userId) {
    return true;
  }

  // Go through the ACL rules to check if the user has the required permission
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (
      (await accessGroup.hasMember(userId)) &&
      isPermissionAllowed(requestedPermission, rule.permission)
    ) {
      return true;
    }
  }

  return false;
}
