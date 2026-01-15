// In-memory watch party store
// Parties are stored in memory and reset on server restart

export interface WatchPartyMember {
  id: string
  userId: string
  name: string
  avatar?: string
  isHost: boolean
  lastSeenAt: Date
}

export interface ChatMessage {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  message: string
  createdAt: Date
}

export interface WatchParty {
  id: string
  contentId: string
  contentType: 'movie' | 'series'
  episodeId?: string
  hostId: string
  members: Map<string, WatchPartyMember>
  playback: {
    currentTime: number
    isPlaying: boolean
    updatedAt: Date
  }
  chat: ChatMessage[]
  createdAt: Date
  lastActivityAt: Date
}

class WatchPartyStore {
  private parties = new Map<string, WatchParty>()
  private readonly PARTY_EXPIRY_MS = 2 * 60 * 60 * 1000 // 2 hours
  private readonly MEMBER_TIMEOUT_MS = 30 * 1000 // 30 seconds

  generatePartyId(): string {
    // Generate a 6-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  createParty(
    contentId: string,
    contentType: 'movie' | 'series',
    hostId: string,
    hostName: string,
    hostAvatar?: string,
    episodeId?: string
  ): WatchParty {
    const partyId = this.generatePartyId()
    const now = new Date()

    const party: WatchParty = {
      id: partyId,
      contentId,
      contentType,
      episodeId,
      hostId,
      members: new Map(),
      playback: {
        currentTime: 0,
        isPlaying: false,
        updatedAt: now,
      },
      chat: [],
      createdAt: now,
      lastActivityAt: now,
    }

    // Add host as first member
    party.members.set(hostId, {
      id: hostId,
      userId: hostId,
      name: hostName,
      avatar: hostAvatar,
      isHost: true,
      lastSeenAt: now,
    })

    this.parties.set(partyId, party)
    this.cleanupExpiredParties()
    return party
  }

  getParty(partyId: string): WatchParty | null {
    const party = this.parties.get(partyId)
    if (!party) return null

    // Check if expired
    if (Date.now() - party.lastActivityAt.getTime() > this.PARTY_EXPIRY_MS) {
      this.parties.delete(partyId)
      return null
    }

    return party
  }

  joinParty(
    partyId: string,
    userId: string,
    userName: string,
    userAvatar?: string
  ): WatchParty | null {
    const party = this.getParty(partyId)
    if (!party) return null

    // Check if already a member
    if (party.members.has(userId)) {
      // Update last seen
      const member = party.members.get(userId)!
      member.lastSeenAt = new Date()
      party.lastActivityAt = new Date()
      return party
    }

    // Add new member
    party.members.set(userId, {
      id: userId,
      userId,
      name: userName,
      avatar: userAvatar,
      isHost: false,
      lastSeenAt: new Date(),
    })

    party.lastActivityAt = new Date()
    return party
  }

  leaveParty(partyId: string, userId: string): boolean {
    const party = this.getParty(partyId)
    if (!party) return false

    party.members.delete(userId)
    party.lastActivityAt = new Date()

    // If host left, transfer to first member or delete party
    if (userId === party.hostId) {
      if (party.members.size > 0) {
        const newHost = Array.from(party.members.values())[0]
        newHost.isHost = true
        party.hostId = newHost.userId
      } else {
        // No members left, delete party
        this.parties.delete(partyId)
        return true
      }
    }

    // Delete party if no members left
    if (party.members.size === 0) {
      this.parties.delete(partyId)
      return true
    }

    return false
  }

  updatePlayback(
    partyId: string,
    userId: string,
    currentTime: number,
    isPlaying: boolean
  ): boolean {
    const party = this.getParty(partyId)
    if (!party) return false

    // Only host can update playback
    if (party.hostId !== userId) return false

    party.playback = {
      currentTime,
      isPlaying,
      updatedAt: new Date(),
    }
    party.lastActivityAt = new Date()

    // Update host's last seen
    const host = party.members.get(userId)
    if (host) {
      host.lastSeenAt = new Date()
    }

    return true
  }

  addChatMessage(
    partyId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    message: string
  ): ChatMessage | null {
    const party = this.getParty(partyId)
    if (!party) return null

    // Verify user is a member
    if (!party.members.has(userId)) return null

    const chatMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName,
      userAvatar,
      message: message.trim(),
      createdAt: new Date(),
    }

    party.chat.push(chatMessage)
    party.lastActivityAt = new Date()

    // Update member's last seen
    const member = party.members.get(userId)
    if (member) {
      member.lastSeenAt = new Date()
    }

    // Keep only last 100 messages
    if (party.chat.length > 100) {
      party.chat = party.chat.slice(-100)
    }

    return chatMessage
  }

  getChatMessages(partyId: string, since?: Date): ChatMessage[] {
    const party = this.getParty(partyId)
    if (!party) return []

    if (!since) return party.chat

    return party.chat.filter((msg) => msg.createdAt > since)
  }

  updateMemberLastSeen(partyId: string, userId: string): void {
    const party = this.getParty(partyId)
    if (!party) return

    const member = party.members.get(userId)
    if (member) {
      member.lastSeenAt = new Date()
      party.lastActivityAt = new Date()
    }
  }

  cleanupExpiredParties(): void {
    const now = Date.now()
    for (const [partyId, party] of this.parties.entries()) {
      // Remove expired parties
      if (now - party.lastActivityAt.getTime() > this.PARTY_EXPIRY_MS) {
        this.parties.delete(partyId)
        continue
      }

      // Remove inactive members (not seen in 30 seconds)
      for (const [memberId, member] of party.members.entries()) {
        if (now - member.lastSeenAt.getTime() > this.MEMBER_TIMEOUT_MS) {
          party.members.delete(memberId)
        }
      }

      // Delete party if no members left
      if (party.members.size === 0) {
        this.parties.delete(partyId)
      }
    }
  }

  // Convert party to JSON-serializable format
  serializeParty(party: WatchParty) {
    return {
      id: party.id,
      contentId: party.contentId,
      contentType: party.contentType,
      episodeId: party.episodeId,
      hostId: party.hostId,
      members: Array.from(party.members.values()),
      playback: {
        currentTime: party.playback.currentTime,
        isPlaying: party.playback.isPlaying,
        updatedAt: party.playback.updatedAt.toISOString(),
      },
      chatCount: party.chat.length,
      createdAt: party.createdAt.toISOString(),
      lastActivityAt: party.lastActivityAt.toISOString(),
    }
  }
}

export const watchPartyStore = new WatchPartyStore()
