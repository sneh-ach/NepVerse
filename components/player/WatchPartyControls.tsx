'use client'

import { useState, useEffect, useRef } from 'react'
import { Users, UserPlus, Copy, Check, X, MessageSquare, Send } from 'lucide-react'
import { watchPartyService, WatchParty, WatchPartyMember, ChatMessage } from '@/lib/watchParty'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'

interface WatchPartyControlsProps {
  contentId: string
  contentType: 'movie' | 'series'
  episodeId?: string
}

export function WatchPartyControls({
  contentId,
  contentType,
  episodeId,
}: WatchPartyControlsProps) {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [party, setParty] = useState<WatchParty | null>(null)
  const [partyCode, setPartyCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [members, setMembers] = useState<WatchPartyMember[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Poll for party updates
  useEffect(() => {
    const interval = setInterval(() => {
      const currentParty = watchPartyService.getCurrentParty()
      if (currentParty) {
        setParty(currentParty)
        setMembers(currentParty.members)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Set up event handlers
    watchPartyService.onMemberJoined = (member) => {
      setMembers((prev) => {
        if (prev.find(m => m.id === member.id)) return prev
        return [...prev, member]
      })
      toast.success(`${member.name} joined the party`)
    }
    watchPartyService.onMemberLeft = (memberId) => {
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    }
    watchPartyService.onChatMessage = (message) => {
      setChatMessages((prev) => {
        // Avoid duplicates
        if (prev.find(m => m.id === message.id)) return prev
        const newMessages = [...prev, message]
        // Keep only last 50 messages in UI
        return newMessages.slice(-50)
      })
      
      // Increment unread if chat is not visible
      if (!showChat) {
        setUnreadCount((prev) => prev + 1)
      }
      
      // Scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }

    return () => {
      watchPartyService.onMemberJoined = undefined
      watchPartyService.onMemberLeft = undefined
      watchPartyService.onChatMessage = undefined
    }
  }, [showChat])

  // Scroll chat to bottom when messages change
  useEffect(() => {
    if (showChat && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages, showChat])

  // Reset unread count when chat is opened
  useEffect(() => {
    if (showChat) {
      setUnreadCount(0)
    }
  }, [showChat])

  const getUserName = () => {
    if (user) {
      try {
        const profileStr = localStorage.getItem(`profile_${user.id}`)
        if (profileStr) {
          const profile = JSON.parse(profileStr)
          return profile.name || profile.firstName || user.email?.split('@')[0] || 'User'
        }
      } catch (e) {
        // Ignore
      }
      return user.email?.split('@')[0] || 'User'
    }
    return 'User'
  }

  const getUserAvatar = () => {
    if (user) {
      try {
        const profileStr = localStorage.getItem(`profile_${user.id}`)
        if (profileStr) {
          const profile = JSON.parse(profileStr)
          return profile.avatar
        }
      } catch (e) {
        // Ignore
      }
    }
    return undefined
  }

  const createParty = async () => {
    try {
      const newParty = await watchPartyService.createParty(
        contentId,
        contentType,
        episodeId,
        getUserName(),
        getUserAvatar()
      )
      setParty(newParty)
      setMembers(newParty.members)
      setShowModal(false)
      toast.success('Watch party created!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create watch party')
    }
  }

  const joinParty = async () => {
    if (!partyCode.trim()) {
      toast.error('Please enter a party code')
      return
    }

    try {
      const joinedParty = await watchPartyService.joinParty(
        partyCode.toUpperCase(),
        getUserName(),
        getUserAvatar()
      )
      setParty(joinedParty)
      setMembers(joinedParty.members)
      setShowModal(false)
      toast.success('Joined watch party!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to join watch party')
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return

    try {
      await watchPartyService.sendChat(chatInput.trim())
      setChatInput('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
    }
  }

  const leaveParty = () => {
    watchPartyService.leaveParty()
    setParty(null)
    setMembers([])
    toast.success('Left watch party')
  }

  const copyPartyCode = () => {
    if (party?.id) {
      navigator.clipboard.writeText(party.id)
      setCopied(true)
      toast.success('Party code copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isHost = party?.hostId === user?.id || (party && watchPartyService.getIsHost())

  return (
    <>
      <div className="flex items-center">
        {party ? (
          <div className="flex items-center space-x-2 bg-primary/30 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary/50 shadow-lg">
            <Users size={20} className="text-primary" fill="currentColor" />
            <span className="text-white text-sm font-semibold">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
            <button
              onClick={() => setShowModal(true)}
              className="relative text-gray-300 hover:text-white transition-colors ml-2 p-1 hover:bg-white/10 rounded"
              title="Open watch party"
              aria-label="Open watch party"
            >
              <MessageSquare size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {isHost && (
              <button
                onClick={copyPartyCode}
                className="text-gray-300 hover:text-white transition-colors ml-2 p-1 hover:bg-white/10 rounded"
                title="Copy party code"
                aria-label="Copy party code"
              >
                {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
              </button>
            )}
            <button
              onClick={leaveParty}
              className="text-gray-300 hover:text-white transition-colors ml-2 p-1 hover:bg-white/10 rounded"
              aria-label="Leave watch party"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowModal(true)
            }}
            className="flex items-center space-x-1.5 sm:space-x-2 bg-gradient-to-r from-purple-600/40 to-pink-600/30 backdrop-blur-md hover:from-purple-600/50 hover:to-pink-600/40 px-2.5 sm:px-4 py-2 rounded-lg border-2 border-purple-400/60 hover:border-purple-300 transition-all hover:scale-105 active:scale-100 shadow-xl hover:shadow-2xl hover:shadow-purple-500/50 text-white font-bold min-w-[100px] sm:min-w-[130px] justify-center transform-gpu group relative overflow-hidden"
            aria-label="Start watch party"
            style={{ 
              boxShadow: '0 4px 20px 0 rgba(147, 51, 234, 0.5)',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              visibility: 'visible',
              opacity: 1,
              maxWidth: '100%'
            }}
          >
            <span className="absolute inset-0 bg-white/20 rounded-lg scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
            <Users size={18} className="text-purple-200 fill-current relative z-10 group-hover:scale-125 transition-transform duration-300 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold relative z-10 truncate">Watch Party</span>
          </button>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => {
        setShowModal(false)
        setShowChat(false)
      }} size="lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Watch Party</h2>

          {!party ? (
            <div className="space-y-4">
              <Button
                variant="primary"
                onClick={createParty}
                className="w-full flex items-center justify-center space-x-2"
              >
                <UserPlus size={20} />
                <span>Create Party</span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">or</span>
                </div>
              </div>

              <div>
                <Input
                  label="Party Code"
                  value={partyCode}
                  onChange={(e) => setPartyCode(e.target.value.toUpperCase())}
                  placeholder="Enter party code"
                  maxLength={6}
                />
                <Button
                  variant="outline"
                  onClick={joinParty}
                  className="w-full mt-4 group/btn font-bold backdrop-blur-md"
                >
                  <span className="group-hover/btn:scale-105 transition-transform duration-300 inline-block">Join Party</span>
                </Button>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4 text-sm text-gray-400">
                <p className="mb-2">
                  <strong className="text-white">Watch together:</strong> Synchronize playback
                  with friends in real-time
                </p>
                <p>
                  <strong className="text-white">Host controls:</strong> The party creator
                  controls play/pause for everyone
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex space-x-2 border-b border-gray-700">
                <button
                  onClick={() => setShowChat(false)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    !showChat
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Party Info
                </button>
                <button
                  onClick={() => {
                    setShowChat(true)
                    setUnreadCount(0)
                  }}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                    showChat
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Chat
                  {unreadCount > 0 && !showChat && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {!showChat ? (
                <>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Party Code</p>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={party.id}
                        readOnly
                        className="font-mono text-lg"
                      />
                      <Button variant="outline" onClick={copyPartyCode}>
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm mb-2">Members ({members.length})</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-semibold">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-semibold">
                              {member.name}
                              {member.isHost && (
                                <span className="ml-2 text-xs text-primary">(Host)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isHost && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-primary text-sm font-semibold mb-1">You are the host</p>
                      <p className="text-gray-400 text-xs">
                        Your play/pause actions will sync with all members
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col h-[400px]">
                  {/* Chat Messages */}
                  <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2"
                  >
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      chatMessages.map((message) => {
                        const isOwnMessage = message.userId === user?.id
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] ${
                                isOwnMessage ? 'bg-primary/30' : 'bg-gray-800'
                              } rounded-lg p-3`}
                            >
                              {!isOwnMessage && (
                                <p className="text-xs text-gray-400 mb-1">{message.userName}</p>
                              )}
                              <p className="text-white text-sm">{message.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(message.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendChatMessage()
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button
                      onClick={sendChatMessage}
                      disabled={!chatInput.trim()}
                      variant="primary"
                      className="px-4"
                    >
                      <Send size={18} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

