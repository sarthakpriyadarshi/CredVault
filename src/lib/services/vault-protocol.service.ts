/**
 * VAULT Protocol Service
 * Integrates with VAULT Protocol for blockchain-based certificate storage
 * 
 * @see https://github.com/sarthakpriyadarshi/VaultProtocol
 */

interface VaultProtocolConfig {
  baseUrl: string
  encryptionKey?: string
}

interface IssueResponse {
  success: boolean
  message: string
  data: {
    fid: string
    cid: string
    email: string
    transactionHash: string
    vaultUrl: string
    gatewayUrl: string
  }
}

interface VerifyResponse {
  success: boolean
  message: string
  data: {
    fid: string
    email: string
    isValid: boolean
    certificate: {
      fid: string
      cid: string
      email: string
      issueDate: number
      lastModified: number
      issuer: string
      isActive: boolean
    }
  }
}

interface CertificateResponse {
  success: boolean
  message: string
  data: {
    fid: string
    cid: string
    email: string
    issueDate: string
    lastModified: string
    issuer: string
    isActive: boolean
    vaultUrl: string
    gatewayUrl: string
  }
}

interface UpdateResponse {
  success: boolean
  message: string
  data: {
    fid: string
    oldCid: string
    newCid: string
    transactionHash: string
    vaultUrl: string
  }
}

interface DeleteResponse {
  success: boolean
  message: string
  data: {
    fid: string
    cid: string
    transactionHash: string
  }
}

export class VaultProtocolService {
  private baseUrl: string
  private encryptionKey?: string

  constructor(config: VaultProtocolConfig) {
    this.baseUrl = config.baseUrl || process.env.VAULT_PROTOCOL_URL || "http://localhost:3001"
    this.encryptionKey = config.encryptionKey || process.env.FILE_ENCRYPTION_KEY
  }

  /**
   * Issue a certificate on VAULT Protocol blockchain
   * @param file - File buffer to be encrypted and stored
   * @param fileName - Original filename
   * @param email - Recipient email address
   * @returns Issue response with FID, CID, and transaction details
   */
  async issueCertificate(
    file: Buffer,
    fileName: string,
    email: string
  ): Promise<IssueResponse> {
    try {
      const formData = new FormData()
      const blob = new Blob([new Uint8Array(file)], { type: this.getMimeType(fileName) })
      formData.append("file", blob, fileName)
      formData.append("email", email)

      const response = await fetch(`${this.baseUrl}/api/certificates/issue`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to issue certificate on VAULT Protocol")
      }

      const data: IssueResponse = await response.json()
      return data
    } catch (error) {
      console.error("VAULT Protocol issue error:", error)
      throw error
    }
  }

  /**
   * Verify a certificate on VAULT Protocol blockchain
   * @param fid - File ID
   * @param email - Recipient email
   * @returns Verification response
   */
  async verifyCertificate(fid: string, email: string): Promise<VerifyResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/certificates/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fid, email }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to verify certificate on VAULT Protocol")
      }

      const data: VerifyResponse = await response.json()
      return data
    } catch (error) {
      console.error("VAULT Protocol verify error:", error)
      throw error
    }
  }

  /**
   * Get certificate details from VAULT Protocol blockchain
   * @param fid - File ID
   * @returns Certificate details
   */
  async getCertificate(fid: string): Promise<CertificateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/certificates/${fid}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to get certificate from VAULT Protocol")
      }

      const data: CertificateResponse = await response.json()
      return data
    } catch (error) {
      console.error("VAULT Protocol get certificate error:", error)
      throw error
    }
  }

  /**
   * Update a certificate on VAULT Protocol blockchain
   * @param fid - File ID
   * @param file - New file buffer
   * @param fileName - New filename
   * @returns Update response
   */
  async updateCertificate(
    fid: string,
    file: Buffer,
    fileName: string
  ): Promise<UpdateResponse> {
    try {
      const formData = new FormData()
      const blob = new Blob([new Uint8Array(file)], { type: this.getMimeType(fileName) })
      formData.append("file", blob, fileName)

      const response = await fetch(`${this.baseUrl}/api/certificates/${fid}`, {
        method: "PUT",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update certificate on VAULT Protocol")
      }

      const data: UpdateResponse = await response.json()
      return data
    } catch (error) {
      console.error("VAULT Protocol update error:", error)
      throw error
    }
  }

  /**
   * Delete a certificate from VAULT Protocol blockchain
   * @param fid - File ID
   * @returns Delete response
   */
  async deleteCertificate(fid: string): Promise<DeleteResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/certificates/${fid}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete certificate from VAULT Protocol")
      }

      const data: DeleteResponse = await response.json()
      return data
    } catch (error) {
      console.error("VAULT Protocol delete error:", error)
      throw error
    }
  }

  /**
   * Download certificate file from VAULT Protocol
   * @param fid - File ID
   * @param cid - Content ID
   * @returns File buffer
   */
  async downloadCertificate(fid: string, cid: string): Promise<Buffer> {
    try {
      const response = await fetch(`${this.baseUrl}/api/certificates/${fid}/download/${cid}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to download certificate from VAULT Protocol")
      }

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error("VAULT Protocol download error:", error)
      throw error
    }
  }

  /**
   * Get file MIME type based on extension
   */
  private getMimeType(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      txt: "text/plain",
      html: "text/html",
      json: "application/json",
    }
    return mimeTypes[ext || ""] || "application/octet-stream"
  }

  /**
   * Convert base64 data URL to buffer
   */
  static base64ToBuffer(base64DataUrl: string): Buffer {
    // Remove data URL prefix (e.g., "data:image/png;base64,")
    const base64Data = base64DataUrl.replace(/^data:.*?;base64,/, "")
    return Buffer.from(base64Data, "base64")
  }

  /**
   * Get file extension from MIME type or data URL
   */
  static getFileExtension(dataUrl: string): string {
    if (dataUrl.startsWith("data:image/png")) return ".png"
    if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg"))
      return ".jpg"
    if (dataUrl.startsWith("data:application/pdf")) return ".pdf"
    return ".png" // Default
  }
}

// Export singleton instance
export const vaultProtocol = new VaultProtocolService({
  baseUrl: process.env.VAULT_PROTOCOL_URL || "http://localhost:3001",
  encryptionKey: process.env.FILE_ENCRYPTION_KEY,
})
