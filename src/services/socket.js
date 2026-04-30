import { io } from 'socket.io-client'

const API_URL = 'http://localhost:8000'

let socket = null
let listeners = {}

export const initSocket = () => {
  if (socket) return socket

  socket = io(API_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    withCredentials: true,
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected')
  })

  // Handle wallet updates
  socket.on('wallet-updated', (data) => {
    console.log('Wallet updated:', data)
    if (listeners.walletUpdate) {
      listeners.walletUpdate(data)
    }
  })

  return socket
}

export const getSocket = () => socket || initSocket()

export const joinWalletRoom = (userId) => {
  const sock = getSocket()
  if (sock && userId) {
    sock.emit('join-wallet', userId)
  }
}

export const leaveWalletRoom = (userId) => {
  const sock = getSocket()
  if (sock && userId) {
    sock.emit('leave-wallet', userId)
  }
}

export const onWalletUpdate = (callback) => {
  listeners.walletUpdate = callback
  const sock = getSocket()
  if (sock) {
    sock.on('wallet-updated', callback)
  }
}

export const offWalletUpdate = () => {
  delete listeners.walletUpdate
  const sock = getSocket()
  if (sock) {
    sock.off('wallet-updated')
  }
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
