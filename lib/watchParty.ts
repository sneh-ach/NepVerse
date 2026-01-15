// Watch Party - Synchronized playback for multiple users
// Uses HTTP polling for synchronization

export interface WatchPartyMember {
  id: string
  userId: string
  name: string
  avatar?: string
  isHost: boolean
  lastSeenAt: string
}

export interface WatchParty {
  id: string
  contentId: string
  contentType: 'movie' | 'series'
  episodeId?: string
  hostId: string
  members: WatchPartyMember[]
  playback: {
    currentTime: number
    isPlaying: boolean
    updatedAt: string
  }
  chatCount: number
  createdAt: string
  lastActivityAt: string
}

export interface ChatMessage {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  message: string
  createdAt: string
}

class WatchPartyService {
  private currentParty: WatchParty | null = null
  private pollingInterval: NodeJS.Timeout | null = null
  private chatPollingInterval: NodeJS.Timeout | null = null
  private lastStateTime: string | null = null
  private lastChatTime: string | null = null
  private isHost = false
  private syncInterval: NodeJS.Timeout | null = null
  private lastSyncTime = 0
  private userName = 'User'
  private userAvatar: string | undefined

  // Create a watch party
  async createParty(
    contentId: string,
    contentType: 'movie' | 'series',
    episodeId?: string,
    userName?: string,
    userAvatar?: string
  ): Promise<WatchParty> {
    try {
      this.userName = userName || 'User'
      this.userAvatar = userAvatar

      const response = await fetch('/api/watch-party/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          contentId, 
          contentType, 
          episodeId,
          userName: this.userName,
          userAvatar: this.userAvatar,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create watch party' }))
        throw new Error(error.message || 'Failed to create watch party')
      }

      const party = await response.json()
      this.currentParty = party
      this.isHost = party.hostId === this.getUserId()
      this.startPolling(party.id)
      return party
    } catch (error) {
      console.error('Create watch party error:', error)
      throw error
    }
  }

  // Join a watch party
  async joinParty(
    partyId: string,
    userName?: string,
    userAvatar?: string
  ): Promise<WatchParty> {
    try {
      this.userName = userName || 'User'
      this.userAvatar = userAvatar

      const response = await fetch(`/api/watch-party/${partyId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userName: this.userName,
          userAvatar: this.userAvatar,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to join watch party' }))
        throw new Error(error.message || 'Failed to join watch party')
      }

      const party = await response.json()
      this.currentParty = party
      this.isHost = party.hostId === this.getUserId()
      this.startPolling(party.id)
      return party
    } catch (error) {
      console.error('Join watch party error:', error)
      throw error
    }
  }

  private getUserId(): string {
    // Try to get from localStorage
    if (typeof window !== 'undefined') {
      try {
        // Try authService first
        const authService = require('@/lib/clientStorage').authService
        const user = authService.getCurrentUser()
        if (user && user.id) {
          return user.id
        }
      } catch (e) {
        // Fallback to localStorage
        try {
          const userStr = localStorage.getItem('user')
          if (userStr) {
            const user = JSON.parse(userStr)
            return user.id || ''
          }
        } catch (e2) {
          // Ignore
        }
      }
    }
    return ''
  }

  private startPolling(partyId: string): void {
    this.stopPolling()

    // Poll state every 1.5 seconds
    this.pollingInterval = setInterval(async () => {
      await this.pollState(partyId)
    }, 1500)

    // Poll chat every 2 seconds
    this.chatPollingInterval = setInterval(async () => {
      await this.pollChat(partyId)
    }, 2000)

    // If host, start periodic sync
    if (this.isHost) {
      this.syncInterval = setInterval(() => {
        // Sync will be called from VideoPlayer on play/pause/seek
      }, 1000)
    }
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    if (this.chatPollingInterval) {
      clearInterval(this.chatPollingInterval)
      this.chatPollingInterval = null
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  private async pollState(partyId: string): Promise<void> {
    try {
      const url = this.lastStateTime
        ? `/api/watch-party/${partyId}/state?since=${encodeURIComponent(this.lastStateTime)}`
        : `/api/watch-party/${partyId}/state`

      const response = await fetch(url, {
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 404) {
          // Party expired or not found
          this.leaveParty()
          return
        }
        return
      }

      const state = await response.json()
      this.lastStateTime = state.serverTime

      // Update current party
      if (state.id) {
        this.currentParty = state
        this.isHost = state.hostId === this.getUserId()
      }

      // Check for member changes
      const currentMemberIds = new Set(
        this.currentParty?.members.map(m => m.id) || []
      )
      const newMemberIds = new Set(state.members.map((m: WatchPartyMember) => m.id))

      // Check for new members
      for (const member of state.members) {
        if (!currentMemberIds.has(member.id)) {
          this.onMemberJoined?.(member)
        }
      }

      // Check for left members
      for (const memberId of currentMemberIds) {
        if (!newMemberIds.has(memberId)) {
          this.onMemberLeft?.(memberId)
        }
      }

      // Apply playback sync (only if not host)
      if (!this.isHost && state.playback) {
        const playback = state.playback
        const timeDiff = Math.abs(
          playback.currentTime - (this.lastSyncTime || playback.currentTime)
        )

        // Only sync if difference is significant (>1 second)
        if (timeDiff > 1) {
          this.onSync?.(playback.currentTime, playback.isPlaying)
          this.lastSyncTime = playback.currentTime
        } else if (playback.isPlaying !== this.currentParty?.playback.isPlaying) {
          // Play/pause state changed
          if (playback.isPlaying) {
            this.onPlay?.()
          } else {
            this.onPause?.()
          }
        }
      }
    } catch (error) {
      console.error('Poll state error:', error)
    }
  }

  private async pollChat(partyId: string): Promise<void> {
    try {
      const url = this.lastChatTime
        ? `/api/watch-party/${partyId}/chat?since=${encodeURIComponent(this.lastChatTime)}`
        : `/api/watch-party/${partyId}/chat`

      const response = await fetch(url, {
        credentials: 'include',
      })

      if (!response.ok) {
        return
      }

      const data = await response.json()
      this.lastChatTime = data.serverTime

      if (data.messages && data.messages.length > 0) {
        for (const message of data.messages) {
          this.onChatMessage?.(message)
        }
      }
    } catch (error) {
      console.error('Poll chat error:', error)
    }
  }

  // Send sync update (host only)
  async sendSync(currentTime: number, isPlaying: boolean): Promise<void> {
    if (!this.isHost || !this.currentParty) return

    // Throttle sync to once per second
    const now = Date.now()
    if (now - this.lastSyncTime < 1000) return
    this.lastSyncTime = now

    try {
      await fetch(`/api/watch-party/${this.currentParty.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentTime, isPlaying }),
      })
    } catch (error) {
      console.error('Send sync error:', error)
    }
  }

  // Send chat message
  async sendChat(message: string): Promise<ChatMessage | null> {
    if (!this.currentParty) return null

    try {
      const response = await fetch(`/api/watch-party/${this.currentParty.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message,
          userName: this.userName,
          userAvatar: this.userAvatar,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send chat message')
      }

      const chatMessage = await response.json()
      return chatMessage
    } catch (error) {
      console.error('Send chat error:', error)
      throw error
    }
  }

  // Leave watch party
  async leaveParty(): Promise<void> {
    if (this.currentParty) {
      try {
        await fetch(`/api/watch-party/${this.currentParty.id}/leave`, {
          method: 'POST',
          credentials: 'include',
        })
      } catch (error) {
        console.error('Leave party error:', error)
      }
    }

    this.stopPolling()
    this.currentParty = null
    this.isHost = false
    this.lastStateTime = null
    this.lastChatTime = null
    this.lastSyncTime = 0
  }

  // Event handlers
  onSync?: (currentTime: number, isPlaying: boolean) => void
  onMemberJoined?: (member: WatchPartyMember) => void
  onMemberLeft?: (memberId: string) => void
  onPlay?: () => void
  onPause?: () => void
  onSeek?: (currentTime: number) => void
  onChatMessage?: (message: ChatMessage) => void

  getCurrentParty(): WatchParty | null {
    return this.currentParty
  }

  getIsHost(): boolean {
    return this.isHost
  }
}

export const watchPartyService = new WatchPartyService()


