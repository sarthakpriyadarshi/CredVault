import { NextRequest, NextResponse } from "next/server";
import { withIssuerUnverified, handleApiError } from "@/lib/api/middleware";
import { parseBody } from "@/lib/api/utils";
import { Types } from "mongoose";
import { Organization, User } from "@/models";
import connectDB from "@/lib/db/mongodb";
import { notifyAdminsOfOrganizationSignup } from "@/lib/notifications";

async function handler(
  req: NextRequest,
  _context?: {
    params?: Promise<Record<string, string>> | Record<string, string>;
  },
  user?: Record<string, unknown>
) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    await connectDB();

    const userId = user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Check if user already has an organization
    const dbUser = await User.findById(userId);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (dbUser.organizationId) {
      return NextResponse.json(
        { error: "Organization already exists for this user" },
        { status: 400 }
      );
    }

    const body = await parseBody<{
      organizationName: string;
      website?: string;
      verificationProof?: string;
    }>(req);

    const { organizationName, website, verificationProof } = body;

    if (!organizationName) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    // Check if organization with this name already exists
    const existingOrg = await Organization.findOne({
      name: { $regex: new RegExp(`^${organizationName}$`, "i") },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: "Organization already exists" },
        { status: 409 }
      );
    }

    // Create organization
    const organization = await Organization.create({
      name: organizationName,
      website: website || undefined,
      verificationStatus: "pending",
      verificationProof: verificationProof || null,
    });

    // Update user with organization ID
    // Convert to ObjectId for type safety (organization._id is already ObjectId, but this ensures consistency)
    dbUser.organizationId = new Types.ObjectId(organization._id.toString());
    await dbUser.save();

    // Notify admins about new organization signup
    await notifyAdminsOfOrganizationSignup({
      _id: organization._id,
      name: organization.name,
      website: organization.website,
      creatorEmail: dbUser.email, // Pass the email directly
    });

    return NextResponse.json({
      message: "Organization created successfully",
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        verificationStatus: organization.verificationStatus,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export const POST = withIssuerUnverified(handler);
