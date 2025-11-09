import { NextRequest, NextResponse } from "next/server";
import { withAdmin, handleApiError } from "@/lib/api/middleware";
import { parseBody } from "@/lib/api/utils";
import { Types } from "mongoose";
import { Organization } from "@/models";
import connectDB from "@/lib/db/mongodb";
import { invalidateAllUsers } from "@/lib/cache/invalidation";

async function handler(
  req: NextRequest,
  context?: {
    params?: Promise<Record<string, string>> | Record<string, string>;
  },
  user?: Record<string, unknown>
) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    await connectDB();

    // Await params if it's a Promise (Next.js 16)
    const params =
      context?.params instanceof Promise
        ? await context.params
        : context?.params;
    const organizationId = params?.id;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    const body = await parseBody<{ reason?: string }>(req);
    const { reason } = body;

    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    if (organization.verificationStatus !== "pending") {
      return NextResponse.json(
        { error: `Organization is already ${organization.verificationStatus}` },
        { status: 400 }
      );
    }

    // Update organization status
    organization.verificationStatus = "rejected";
    if (user?.id) {
      organization.verifiedBy = new Types.ObjectId(user.id as string);
    }
    organization.verifiedAt = new Date();
    organization.rejectionReason = reason || "Rejected by administrator";
    await organization.save();

    // Invalidate cache for all users in the organization (use false for Route Handler)
    await invalidateAllUsers(false);

    // Note: We don't delete issuer users, but they remain unverified
    // They can re-apply or contact support

    return NextResponse.json({
      message: "Organization rejected successfully",
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        verificationStatus: organization.verificationStatus,
        verifiedAt: organization.verifiedAt,
        rejectionReason: organization.rejectionReason,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export const POST = withAdmin(handler);
