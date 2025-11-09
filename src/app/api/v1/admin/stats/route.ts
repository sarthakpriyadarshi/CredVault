import { NextRequest, NextResponse } from "next/server";
import { withAdmin, handleApiError } from "@/lib/api/middleware";
import { User, Organization, Credential, Template } from "@/models";
import connectDB from "@/lib/db/mongodb";

async function handler(req: NextRequest) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    await connectDB();

    // Get all statistics in parallel
    const [
      totalUsers,
      totalRecipients,
      totalIssuers,
      totalAdmins,
      totalOrganizations,
      pendingOrganizations,
      approvedOrganizations,
      rejectedOrganizations,
      totalCredentials,
      blockchainCredentials,
      totalTemplates,
      activeTemplates,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "recipient" }),
      User.countDocuments({ role: "issuer" }),
      User.countDocuments({ role: "admin" }),
      Organization.countDocuments(),
      Organization.countDocuments({ verificationStatus: "pending" }),
      Organization.countDocuments({ verificationStatus: "approved" }),
      Organization.countDocuments({ verificationStatus: "rejected" }),
      Credential.countDocuments(),
      Credential.countDocuments({ isOnBlockchain: true }),
      Template.countDocuments(),
      Template.countDocuments({ isActive: true }),
    ]);

    // Get recent activity counts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentUsers, recentCredentials, recentOrganizations] =
      await Promise.all([
        User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        Credential.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        Organization.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        recipients: totalRecipients,
        issuers: totalIssuers,
        admins: totalAdmins,
        recent: recentUsers, // Last 30 days
      },
      organizations: {
        total: totalOrganizations,
        pending: pendingOrganizations,
        approved: approvedOrganizations,
        rejected: rejectedOrganizations,
        recent: recentOrganizations, // Last 30 days
      },
      credentials: {
        total: totalCredentials,
        onBlockchain: blockchainCredentials,
        recent: recentCredentials, // Last 30 days
      },
      templates: {
        total: totalTemplates,
        active: activeTemplates,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export const GET = withAdmin(handler);
