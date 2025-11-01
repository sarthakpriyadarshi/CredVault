/**
 * VAULT Protocol Health Check Service
 * 
 * Provides health check functionality for VAULT Protocol services
 * before performing blockchain operations.
 */

const VAULT_PROTOCOL_URL = process.env.VAULT_PROTOCOL_URL || 'http://localhost:3001'

export interface VaultHealthStatus {
  isHealthy: boolean
  services: {
    ipfs: string
    blockchain: string
  }
  error?: string
}

/**
 * Check VAULT Protocol health status
 * @returns Health status object
 */
export async function checkVaultHealth(): Promise<VaultHealthStatus> {
  try {
    const response = await fetch(`${VAULT_PROTOCOL_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return {
        isHealthy: false,
        services: {
          ipfs: 'unknown',
          blockchain: 'unknown',
        },
        error: `VAULT Protocol health check failed with status ${response.status}`,
      }
    }

    const data = await response.json()

    const isHealthy = 
      data.success === true &&
      data.status === 'healthy' &&
      data.services?.ipfs === 'connected' &&
      data.services?.blockchain === 'connected'

    return {
      isHealthy,
      services: {
        ipfs: data.services?.ipfs || 'unknown',
        blockchain: data.services?.blockchain || 'unknown',
      },
      error: !isHealthy ? 'One or more VAULT Protocol services are not healthy' : undefined,
    }
  } catch (error) {
    console.error('VAULT Protocol health check error:', error)
    return {
      isHealthy: false,
      services: {
        ipfs: 'error',
        blockchain: 'error',
      },
      error: error instanceof Error ? error.message : 'Failed to connect to VAULT Protocol',
    }
  }
}

/**
 * Get user-friendly error message for health check failure
 * @param health Health status object
 * @returns User-friendly error message
 */
export function getHealthErrorMessage(health: VaultHealthStatus): string {
  if (health.isHealthy) {
    return ''
  }

  const { services } = health
  const errors: string[] = []

  if (services.ipfs !== 'connected') {
    errors.push('IPFS service is not available')
  }

  if (services.blockchain !== 'connected') {
    errors.push('Blockchain service is not available')
  }

  if (errors.length === 0 && health.error) {
    return health.error
  }

  if (errors.length === 0) {
    return 'VAULT Protocol services are not available. Please ensure IPFS daemon and Quorum blockchain are running.'
  }

  return `${errors.join('. ')}. Please start the required services:\n\n` +
    `1. IPFS: Run 'ipfs daemon' (port 5001)\n` +
    `2. Quorum: Start Quorum blockchain (port 8545)\n` +
    `3. VAULT API: Run 'npm run dev:encrypted' in VaultProtocol directory (port 3001)`
}
