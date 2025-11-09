import { NextRequest, NextResponse } from "next/server";
import { withAdmin, handleApiError } from "@/lib/api/middleware";
import {
  getPagination,
  createPaginatedResponse,
  getQueryParams,
} from "@/lib/api/utils";
import { User } from "@/models";
import connectDB from "@/lib/db/mongodb";

interface OrganizationPopulated {
  _id: { toString: () => string };
  name: string;
  verificationStatus: string;
}

async function handler(
  req: NextRequest,
  context?: {
    params?: Promise<Record<string, string>> | Record<string, string>;
  },
  user?: Record<string, unknown>
) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  // Log admin action for audit purposes
  if (user?.id) {
    console.log(`[Admin Action] User ${user.id} fetching users list`);
  }
  // Context is available but not needed for this endpoint (no route params required)
  if (context && process.env.NODE_ENV === "development") {
    console.log("[Admin Users] Context available:", Object.keys(context));
  }

  try {
    await connectDB();

    const pagination = getPagination(req, 20);
    const searchParams = getQueryParams(req);
    const role = searchParams.get("role"); // recipient, issuer, admin, or all
    const search = searchParams.get("search"); // search by name or email

    // Build filter
    const filter: {
      role?: string;
      $or?: Array<{
        name?: { $regex: string; $options: string };
        email?: { $regex: string; $options: string };
      }>;
    } = {};
    if (role && role !== "all") {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate("organizationId", "name verificationStatus")
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const usersWithOrg = users.map((user) => {
      // Check if organizationId is populated (has name property) or just an ObjectId
      const orgId = user.organizationId;
      const isPopulated = orgId && typeof orgId === "object" && "name" in orgId;

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        organization: isPopulated
          ? {
              id: (orgId as unknown as OrganizationPopulated)._id.toString(),
              name: (orgId as unknown as OrganizationPopulated).name,
              verificationStatus: (orgId as unknown as OrganizationPopulated)
                .verificationStatus,
            }
          : null,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });

    return NextResponse.json(
      createPaginatedResponse(usersWithOrg, total, pagination)
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export const GET = withAdmin(handler);
