// WebSocket server for watch parties and real-time features
// Run this as a separate process or integrate with Next.js API routes

import { WebSocketServer, WebSocket } from 'ws'
import { verifyToken } from '../lib/auth'

interface WatchPartyMessage {
  type: 'sync' | 'play' | 'pause' | 'seek' | 'member_joined' | 'member_left'
  partyId: string
  userId?: string
  currentTime?: number
  isPlaying?: boolean
}

class WatchPartyWebSocketServer {
  private wss: WebSocketServer | null = null
  private parties: Map<string, Set<WebSocket>> = new Map()
  private userSockets: Map<string, WebSocket> = new Map()

  initialize(port: number = 3001) {
    this.wss = new WebSocketServer({ port })

    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('WebSocket client connected')

      ws.on('message', async (data: Buffer) => {
        try {
          const message: WatchPartyMessage = JSON.parse(data.toString())
          await this.handleMessage(ws, message)
        } catch (error) {
          console.error('WebSocket message error:', error)
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }))
        }
      })

      ws.on('close', () => {
        this.handleDisconnect(ws)
      })

      ws.on('error', (error) => {
        console.error('WebSocket error:', error)
      })
    })

    console.log(`WebSocket server running on port ${port}`)
  }

  private async handleMessage(ws: WebSocket, message: WatchPartyMessage) {
    const { type, partyId, userId } = message

    // Authenticate user (get from token in connection URL)
    if (!userId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }))
      return
    }

    switch (type) {
      case 'join':
        this.joinParty(ws, partyId, userId)
        break
      case 'sync':
        this.broadcastToParty(partyId, userId, {
          type: 'sync',
          currentTime: message.currentTime,
          isPlaying: message.isPlaying,
        })
        break
      case 'play':
        this.broadcastToParty(partyId, userId, { type: 'play' })
        break
      case 'pause':
        this.broadcastToParty(partyId, userId, { type: 'pause' })
        break
      case 'seek':
        this.broadcastToParty(partyId, userId, {
          type: 'seek',
          currentTime: message.currentTime,
        })
        break
    }
  }

  private joinParty(ws: WebSocket, partyId: string, userId: string) {
    if (!this.parties.has(partyId)) {
      this.parties.set(partyId, new Set())
    }

    this.parties.get(partyId)!.add(ws)
    this.userSockets.set(userId, ws)

    // Notify other members
    this.broadcastToParty(partyId, userId, {
      type: 'member_joined',
      userId,
    })
  }

  private broadcastToParty(
    partyId: string,
    senderId: string,
    message: any
  ) {
    const party = this.parties.get(partyId)
    if (!party) return

    party.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ ...message, senderId }))
      }
    })
  }

  private handleDisconnect(ws: WebSocket) {
    // Remove from all parties
    this.parties.forEach((sockets, partyId) => {
      if (sockets.has(ws)) {
        sockets.delete(ws)
        // Notify other members
        this.broadcastToParty(partyId, '', {
          type: 'member_left',
        })
      }
    })

    // Remove from user sockets
    this.userSockets.forEach((socket, userId) => {
      if (socket === ws) {
        this.userSockets.delete(userId)
      }
    })
  }

  close() {
    if (this.wss) {
      this.wss.close()
    }
  }
}

export const watchPartyServer = new WatchPartyWebSocketServer()

// Start server if run directly
if (require.main === module) {
  const port = parseInt(process.env.WS_PORT || '3001')
  watchPartyServer.initialize(port)
}


