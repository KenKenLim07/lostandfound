import { useToast } from "@/components/system/ToastProvider"

/**
 * Centralized error handling utility
 * Provides consistent error messaging and user feedback
 */

export type ErrorType = 
  | "auth" 
  | "network" 
  | "validation" 
  | "permission" 
  | "server" 
  | "unknown"

export interface ErrorConfig {
  type?: ErrorType
  title?: string
  description?: string
  durationMs?: number
  showToast?: boolean
}

/**
 * Default error messages for common error types
 */
const DEFAULT_ERROR_MESSAGES: Record<ErrorType, { title: string; description: string }> = {
  auth: {
    title: "Authentication Error",
    description: "Please sign in again to continue."
  },
  network: {
    title: "Connection Error",
    description: "Please check your internet connection and try again."
  },
  validation: {
    title: "Invalid Input",
    description: "Please check your input and try again."
  },
  permission: {
    title: "Access Denied",
    description: "You don't have permission to perform this action."
  },
  server: {
    title: "Server Error",
    description: "Something went wrong on our end. Please try again later."
  },
  unknown: {
    title: "Something Went Wrong",
    description: "An unexpected error occurred. Please try again."
  }
}

/**
 * Extract error message from various error types
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message)
  }
  return "An unknown error occurred"
}

/**
 * Determine error type based on error content
 */
function determineErrorType(error: unknown): ErrorType {
  const message = extractErrorMessage(error).toLowerCase()
  
  if (message.includes("auth") || message.includes("session") || message.includes("login")) {
    return "auth"
  }
  if (message.includes("network") || message.includes("fetch") || message.includes("connection")) {
    return "network"
  }
  if (message.includes("validation") || message.includes("invalid") || message.includes("required")) {
    return "validation"
  }
  if (message.includes("permission") || message.includes("blocked") || message.includes("access")) {
    return "permission"
  }
  if (message.includes("server") || message.includes("500") || message.includes("database")) {
    return "server"
  }
  
  return "unknown"
}

/**
 * Handle error with toast notification
 */
export function handleError(
  error: unknown, 
  config: ErrorConfig = {},
  toast?: ReturnType<typeof useToast>
): void {
  const errorType = config.type || determineErrorType(error)
  const defaultMessage = DEFAULT_ERROR_MESSAGES[errorType]
  const errorMessage = extractErrorMessage(error)
  
  const title = config.title || defaultMessage.title
  const description = config.description || errorMessage || defaultMessage.description
  const durationMs = config.durationMs || (errorType === "permission" ? 5000 : 4000)
  
  // Show toast if available and enabled
  if (toast && config.showToast !== false) {
    toast.toast({
      title,
      description,
      variant: errorType === "permission" ? "destructive" : "destructive",
      durationMs
    })
  }
  
  // Log error for debugging (in development)
  if (process.env.NODE_ENV === "development") {
    console.error(`[${errorType.toUpperCase()}] ${title}:`, error)
  }
}

/**
 * Handle success with toast notification
 */
export function handleSuccess(
  message: string,
  title?: string,
  toast?: ReturnType<typeof useToast>
): void {
  if (toast) {
    toast.toast({
      title: title || "Success",
      description: message,
      variant: "success",
      durationMs: 3000
    })
  }
}

/**
 * Handle warning with toast notification
 */
export function handleWarning(
  message: string,
  title?: string,
  toast?: ReturnType<typeof useToast>
): void {
  if (toast) {
    toast.toast({
      title: title || "Warning",
      description: message,
      variant: "default",
      durationMs: 4000
    })
  }
}

/**
 * Common error handlers for specific scenarios
 */
export const ErrorHandlers = {
  /**
   * Handle authentication errors
   */
  auth: (error: unknown, toast?: ReturnType<typeof useToast>) => {
    handleError(error, { type: "auth" }, toast)
  },
  
  /**
   * Handle permission/blocked user errors
   */
  permission: (error: unknown, toast?: ReturnType<typeof useToast>) => {
    handleError(error, { 
      type: "permission",
      title: "Account Blocked",
      description: "Your account has been blocked. Please contact an administrator if you believe this is an error."
    }, toast)
  },
  
  /**
   * Handle item operation errors (create, update, delete)
   */
  itemOperation: (operation: "create" | "update" | "delete", error: unknown, toast?: ReturnType<typeof useToast>) => {
    const titles = {
      create: "Failed to Create Item",
      update: "Failed to Update Item", 
      delete: "Failed to Delete Item"
    }
    
    handleError(error, { 
      type: "server",
      title: titles[operation],
      description: `Failed to ${operation} item. Please try again.`
    }, toast)
  },
  
  /**
   * Handle form validation errors
   */
  validation: (field: string, error: unknown, toast?: ReturnType<typeof useToast>) => {
    handleError(error, {
      type: "validation",
      title: "Invalid Input",
      description: `Please check the ${field} field and try again.`
    }, toast)
  }
} 