/**
 * Template service layer
 * Business logic for template operations
 */

import { Template } from "@/models"
import type { ITemplate, IPlaceholder } from "@/models"

export interface CreateTemplateData {
  name: string
  description?: string
  category: string
  organizationId: string
  createdBy: string
  type: "certificate" | "badge" | "both"
  certificateImage?: string
  badgeImage?: string
  placeholders: IPlaceholder[]
}

/**
 * Create a new template
 */
export async function createTemplateService(data: CreateTemplateData): Promise<ITemplate> {
  const template = await Template.create({
    name: data.name,
    description: data.description || null,
    category: data.category || "general",
    organizationId: data.organizationId,
    createdBy: data.createdBy,
    type: data.type,
    certificateImage: data.certificateImage || null,
    badgeImage: data.badgeImage || null,
    placeholders: data.placeholders,
    isActive: true,
  })

  return template
}

/**
 * Get template by ID
 */
export async function getTemplateByIdService(templateId: string): Promise<ITemplate | null> {
  return await Template.findById(templateId)
    .populate("organizationId", "name")
    .populate("createdBy", "name email")
    .lean()
}

/**
 * Get templates by organization ID
 */
export async function getTemplatesByOrganizationIdService(
  organizationId: string,
  options?: { isActive?: boolean; limit?: number; skip?: number }
): Promise<ITemplate[]> {
  const query: Record<string, unknown> = { organizationId }
  
  if (options?.isActive !== undefined) {
    query.isActive = options.isActive
  }

  const templates = Template.find(query)
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })

  if (options?.limit) {
    templates.limit(options.limit)
  }
  if (options?.skip) {
    templates.skip(options.skip)
  }

  return await templates.lean()
}

/**
 * Update template
 */
export async function updateTemplateService(
  templateId: string,
  data: Partial<CreateTemplateData>
): Promise<ITemplate | null> {
  const updateData: Record<string, unknown> = {}
  
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.category !== undefined) updateData.category = data.category
  if (data.type !== undefined) updateData.type = data.type
  if (data.certificateImage !== undefined) updateData.certificateImage = data.certificateImage || null
  if (data.badgeImage !== undefined) updateData.badgeImage = data.badgeImage || null
  if (data.placeholders !== undefined) updateData.placeholders = data.placeholders

  return await Template.findByIdAndUpdate(templateId, updateData, { new: true }).lean()
}

/**
 * Archive template (set isActive to false)
 */
export async function archiveTemplateService(templateId: string): Promise<ITemplate | null> {
  return await Template.findByIdAndUpdate(
    templateId,
    { isActive: false },
    { new: true }
  ).lean()
}

/**
 * Delete template
 */
export async function deleteTemplateService(templateId: string): Promise<boolean> {
  const result = await Template.findByIdAndDelete(templateId)
  return !!result
}

/**
 * Count templates by filter
 */
export async function countTemplatesService(filter: Record<string, unknown>): Promise<number> {
  return await Template.countDocuments(filter)
}

