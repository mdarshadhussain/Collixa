export type ToastType = 'success' | 'error' | 'info' | 'warning'

type ToastEvent = {
  message: string
  type: ToastType
  duration?: number
}

type CreditEvent = {
  amount: number
}

type Listener<T> = (data: T) => void

class EventEmitter {
  private toastListeners: Listener<ToastEvent>[] = []
  private creditListeners: Listener<CreditEvent>[] = []

  subscribeToast(listener: Listener<ToastEvent>) {
    this.toastListeners.push(listener)
    return () => {
      this.toastListeners = this.toastListeners.filter(l => l !== listener)
    }
  }

  subscribeCredit(listener: Listener<CreditEvent>) {
    this.creditListeners.push(listener)
    return () => {
      this.creditListeners = this.creditListeners.filter(l => l !== listener)
    }
  }

  emitToast(data: ToastEvent) {
    this.toastListeners.forEach(l => l(data))
  }

  emitCredit(data: CreditEvent) {
    this.creditListeners.forEach(l => l(data))
  }
}

export const eventBus = new EventEmitter()
