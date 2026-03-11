import axios, { type AxiosError } from "axios";

export function extractMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;

    // Check if the response is an HTML page (often sent by Nginx for 502/504/404)
    const contentType = axiosError.response?.headers?.["content-type"];
    if (typeof contentType === "string" && contentType.includes("text/html")) {
      const status = axiosError.response?.status;
      const statusText = axiosError.response?.statusText;

      switch (status) {
        case 502:
          return "Gateway Error: The server is temporarily unavailable (502).";
        case 504:
          return "Gateway Timeout: The server took too long to respond (504).";
        case 404:
          return "Not Found: The requested API endpoint does not exist (404).";
        case 403:
          return "Forbidden: Access to this resource is denied (403).";
        default:
          return `Server Error (${status || "Unknown"}): ${statusText || "HTML response received"}`;
      }
    }

    return axiosError.response?.data?.message ?? axiosError.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}
