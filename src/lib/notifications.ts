import { Notification, User, Organization } from "@/models"
import { sendEmail } from "@/lib/email/nodemailer"
import {
  generateOrganizationSignupNotificationEmail,
  generateOrganizationApprovalNotificationEmail,
} from "@/lib/email/templates"

/**
 * Create a notification for a user
 */
export async function createNotification(params: {
  userId: string | any
  type: "organization_signup" | "organization_approved" | "organization_rejected" | "credential_issued" | "credential_verified" | "password_reset"
  title: string
  message: string
  link?: string
}) {
  try {
    await Notification.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      read: false,
    })
  } catch (error) {
    console.error("Error creating notification:", error)
    // Don't throw - notifications are non-critical
  }
}

/**
 * Notify all admins about a new organization signup
 */
export async function notifyAdminsOfOrganizationSignup(organization: {
  _id: any
  name: string
  website?: string
  creatorEmail?: string // Pass email directly if available
}) {
  try {
    console.log(`[NOTIFICATION] Starting admin notification for organization: ${organization.name}`)
    
    // Find all admin users
    const admins = await User.find({ role: "admin" }).select("email name _id")
    console.log(`[NOTIFICATION] Found ${admins.length} admin(s) to notify`)

    if (admins.length === 0) {
      console.warn("[NOTIFICATION] No admin users found - skipping email notification")
      return
    }

    // Get organization creator email - use passed email or look it up
    let organizationEmail = organization.creatorEmail
    if (!organizationEmail) {
      const orgUser = await User.findOne({ organizationId: organization._id }).select("email")
      organizationEmail = orgUser?.email || "N/A"
    }
    console.log(`[NOTIFICATION] Organization creator email: ${organizationEmail}`)

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4300"
    const adminDashboardLink = `${baseUrl}/dashboard/admin/verification`

    // Send email to each admin
    for (const admin of admins) {
      console.log(`[NOTIFICATION] Processing admin: ${admin.email}`)
      try {
        const emailHtml = generateOrganizationSignupNotificationEmail({
          organizationName: organization.name,
          organizationEmail,
          organizationWebsite: organization.website,
          adminDashboardLink,
        })

        console.log(`[NOTIFICATION] Attempting to send email to admin ${admin.email}`)
        const emailResult = await sendEmail({
          to: admin.email,
          subject: `New Organization Registration: ${organization.name}`,
          html: emailHtml,
        })

        if (!emailResult.success) {
          console.error(`[NOTIFICATION] ❌ Failed to send email to admin ${admin.email}:`, emailResult.error)
        } else {
          console.log(`[NOTIFICATION] ✅ Successfully sent organization signup email to admin ${admin.email}`)
          console.log(`[NOTIFICATION] Email message ID: ${emailResult.messageId}`)
        }

        // Create notification for admin (always create, even if email fails)
        await createNotification({
          userId: admin._id,
          type: "organization_signup",
          title: "New Organization Registration",
          message: `${organization.name} has registered and is awaiting verification.`,
          link: adminDashboardLink,
        })
      } catch (error) {
        console.error(`Error notifying admin ${admin.email}:`, error)
        // Still try to create notification even if email fails
        try {
          await createNotification({
            userId: admin._id,
            type: "organization_signup",
            title: "New Organization Registration",
            message: `${organization.name} has registered and is awaiting verification.`,
            link: adminDashboardLink,
          })
        } catch (notifError) {
          console.error(`Failed to create notification for admin ${admin.email}:`, notifError)
        }
      }
    }
  } catch (error) {
    console.error("Error notifying admins of organization signup:", error)
    // Don't throw - email notifications are non-critical
  }
}

/**
 * Notify issuer about organization approval
 */
export async function notifyIssuerOfApproval(organization: {
  _id: any
  name: string
}) {
  try {
    // Find all issuer users for this organization
    const issuers = await User.find({
      organizationId: organization._id,
      role: "issuer",
    }).select("email name _id")

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4300"
    const issuerLoginLink = `${baseUrl}/auth/issuer/login`
    const issuerDashboardLink = `${baseUrl}/dashboard/issuer`

    // Send email and create notification for each issuer
    for (const issuer of issuers) {
      try {
        const emailHtml = generateOrganizationApprovalNotificationEmail({
          organizationName: organization.name,
          issuerName: issuer.name,
          issuerLoginLink,
        })

        const emailResult = await sendEmail({
          to: issuer.email,
          subject: `Organization Approved: ${organization.name}`,
          html: emailHtml,
        })

        if (!emailResult.success) {
          console.error(`Failed to send email to issuer ${issuer.email}:`, emailResult.error)
        } else {
          console.log(`Successfully sent organization approval email to issuer ${issuer.email}`)
        }

        // Create notification for issuer (always create, even if email fails)
        await createNotification({
          userId: issuer._id,
          type: "organization_approved",
          title: "Organization Approved",
          message: `Your organization ${organization.name} has been approved! You can now start issuing credentials.`,
          link: issuerDashboardLink,
        })
      } catch (error) {
        console.error(`Error notifying issuer ${issuer.email}:`, error)
        // Still try to create notification even if email fails
        try {
          await createNotification({
            userId: issuer._id,
            type: "organization_approved",
            title: "Organization Approved",
            message: `Your organization ${organization.name} has been approved! You can now start issuing credentials.`,
            link: issuerDashboardLink,
          })
        } catch (notifError) {
          console.error(`Failed to create notification for issuer ${issuer.email}:`, notifError)
        }
      }
    }
  } catch (error) {
    console.error("Error notifying issuer of approval:", error)
    // Don't throw - email notifications are non-critical
  }
}

