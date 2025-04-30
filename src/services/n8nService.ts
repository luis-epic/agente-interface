/**
 * Represents the expected data structure for sending data to the N8N workflow.
 * For now, assumes a simple object with a text input.
 */
export interface N8NInputData {
  instruction: string; // Changed from input to instruction to match AgentForm
  sessionId: string; // Added sessionId
  [key: string]: any; // Allow for other potential fields
}

/**
 * Represents the potential structure of a successful response from the N8N workflow.
 * Adapt based on your actual workflow output.
 */
export interface N8NSuccessResponse {
  message?: string;
  output?: string;
  text?: string;
  data?: any; // Catch-all for other data structures
  sessionId?: string; // Explicitly define sessionId to easily delete it later
  [key: string]: any; // Allow flexibility
}

/**
 * Represents the structure of an error response from the N8N workflow or fetch error.
 */
export interface N8NErrorResponse {
  error: boolean;
  message: string;
  details?: any;
}

/**
 * Type guard to check if the response is an error.
 */
function isErrorResponse(response: any): response is N8NErrorResponse {
    return response && response.error === true && typeof response.message === 'string';
}


/**
 * Asynchronously sends data to the N8N workflow via the provided webhook URL.
 *
 * @param webhookUrl The URL of the N8N webhook.
 * @param data The data to send to the workflow.
 * @returns A promise that resolves to either an N8NSuccessResponse or an N8NErrorResponse.
 */
export async function sendDataToN8N(
  webhookUrl: string,
  data: N8NInputData
): Promise<N8NSuccessResponse | N8NErrorResponse> {
  console.log(`Attempting to send data to N8N webhook: ${webhookUrl}`);
  console.log(`Sending data with Session ID: ${data.sessionId}`); // Log session ID being sent
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any other necessary headers, e.g., API keys, if required by your N8N webhook
        // 'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify(data),
      // Consider adding a timeout if requests hang indefinitely
      // signal: AbortSignal.timeout(15000) // 15 seconds timeout
    });

    console.log(`N8N Response Status: ${response.status}`);

    if (!response.ok) {
      let errorDetails: any = `HTTP error! status: ${response.status}`;
      let errorMessage = `Webhook request failed with status ${response.status}.`;
      try {
          const errorBody = await response.text(); // Read body as text first
          console.error(`N8N Error Response Body: ${errorBody}`);
          try {
            // Attempt to parse as JSON if possible
            errorDetails = JSON.parse(errorBody);
            // If N8N returns a specific error message in JSON format
            if (errorDetails && errorDetails.message) {
              errorMessage = `Error from N8N: ${errorDetails.message}`;
            }
          } catch (e) {
             // If not JSON, use the raw text body as details
             errorDetails = errorBody || response.statusText; // Fallback to statusText if body is empty
          }
      } catch (e) {
          console.error("Could not read error response body:", e);
          errorDetails = response.statusText || errorDetails; // Fallback if reading body fails
      }
      return {
          error: true,
          message: errorMessage,
          details: errorDetails
      };
    }

    // Try to parse the JSON response for successful requests
    try {
        const result: N8NSuccessResponse = await response.json();
        console.log("N8N Success Response Parsed:", result);
        return result;
    } catch (jsonError) {
        console.error("Error parsing JSON response from N8N:", jsonError);
        // It's possible N8N returned a 2xx status but non-JSON body (unlikely but possible)
        let responseBodyText = '';
        try {
           // Try to get the raw response text for context
           // Note: This might fail if the body was already consumed by response.json() attempt.
           // A more robust solution might involve cloning the response first.
           responseBodyText = await response.text();
           console.log("Raw non-JSON response body:", responseBodyText);
        } catch(readError) {
            console.error("Could not read response body after JSON parse failure:", readError);
        }

        return {
            error: true,
            message: "Failed to parse JSON response from N8N, though request was successful.",
            details: {
                parseError: jsonError instanceof Error ? jsonError.message : String(jsonError),
                responseBody: responseBodyText || "Could not read response body."
            }
        };
    }

  } catch (error) {
    // This catches network errors (fetch failed), timeouts, CORS issues etc.
    console.error('Network or other error interacting with N8N webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown network error occurred.';

    // Provide more specific feedback for common fetch errors
    let userFriendlyMessage = 'Failed to send data to N8N webhook.';
    if (errorMessage.includes('Failed to fetch')) {
        userFriendlyMessage = 'Could not connect to the N8N service. Check the webhook URL and network connection.';
    } else if (errorMessage.includes('timeout')) {
        userFriendlyMessage = 'The request to N8N timed out.';
    }

    return {
        error: true,
        message: userFriendlyMessage,
        details: errorMessage // Keep technical details for console/debugging
    };
  }
}

/**
* Extracts a meaningful text response from the N8N success data.
* Prioritizes common fields like 'message', 'output', 'text'.
* Explicitly removes the 'sessionId' field before falling back to stringifying the data.
*
* @param responseData The data received from a successful N8N webhook call.
* @returns A string representation of the response, or null if data is empty/undefined.
*/
export function extractN8NResponseText(responseData: N8NSuccessResponse | null | undefined): string | null {
    if (!responseData) {
        return null;
    }

    // Create a copy to modify without affecting the original object potentially used elsewhere
    const dataToProcess = { ...responseData };

    // --- Explicitly remove sessionId before checking other fields ---
    if (dataToProcess.sessionId !== undefined) {
        console.log("Removing sessionId from N8N response before display.");
        delete dataToProcess.sessionId;
    }
    // ---

    // Check specific fields first (using the modified dataToProcess)
    if (typeof dataToProcess.message === 'string' && dataToProcess.message.trim() !== '') {
        // Filter out the specific unwanted message about session ID
        if (dataToProcess.message.includes("Parece que has compartido un identificador de sesión")) {
            console.log("Filtering out session ID mention message from N8N.");
            return null; // Return null or a placeholder like "..."
        }
        return dataToProcess.message;
    }
    if (typeof dataToProcess.output === 'string' && dataToProcess.output.trim() !== '') {
         if (dataToProcess.output.includes("Parece que has compartido un identificador de sesión")) {
            console.log("Filtering out session ID mention message from N8N.");
            return null;
         }
        return dataToProcess.output;
    }
    if (typeof dataToProcess.text === 'string' && dataToProcess.text.trim() !== '') {
         if (dataToProcess.text.includes("Parece que has compartido un identificador de sesión")) {
            console.log("Filtering out session ID mention message from N8N.");
            return null;
         }
        return dataToProcess.text;
    }

    // Fallback: Handle potential non-string but present values in common fields
    if (dataToProcess.message) return String(dataToProcess.message);
    if (dataToProcess.output) return String(dataToProcess.output);
    if (dataToProcess.text) return String(dataToProcess.text);

    // Fallback: Stringify the remaining object if no primary field found and data exists
    const keys = Object.keys(dataToProcess);
    const significantDataExists = keys.length > 0; // Simplified check since sessionId is already removed

    if (significantDataExists) {
       try {
           // If the only thing left is an empty object or similar non-displayable data, return null
           const stringified = JSON.stringify(dataToProcess, null, 2);
           if (stringified === '{}' || stringified === '[]' || stringified === '""' || stringified === 'null') {
                return null;
           }
            // Filter out the unwanted message even if it's part of a JSON structure
           if (stringified.includes("Parece que has compartido un identificador de sesión")) {
               console.log("Filtering out session ID mention message from N8N JSON fallback.");
               return null; // Or maybe return a filtered JSON? For now, returning null.
           }
           return stringified; // Pretty print JSON
       } catch (e) {
           // Basic string conversion if JSON fails, but unlikely now
           const strRepresentation = String(dataToProcess);
            if (strRepresentation.includes("Parece que has compartido un identificador de sesión")) {
                console.log("Filtering out session ID mention message from N8N string fallback.");
                return null;
            }
           return strRepresentation === '[object Object]' ? null : strRepresentation; // Avoid showing useless [object Object]
       }
    }

    // If no specific field found and no other significant data, return null
    return null;
}
