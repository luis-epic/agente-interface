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
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorDetails: any = `HTTP error! status: ${response.status}`;
      try {
          const errorData = await response.json();
          errorDetails = errorData; // Store the full error data if available
      } catch (e) {
          // If parsing fails, use the status text
          errorDetails = response.statusText || errorDetails;
      }
      return {
          error: true,
          message: `Webhook request failed with status ${response.status}.`,
          details: errorDetails
      };
    }

    // Try to parse the JSON response
    try {
        const result: N8NSuccessResponse = await response.json();
        return result;
    } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        return {
            error: true,
            message: "Failed to parse JSON response from webhook.",
            details: jsonError instanceof Error ? jsonError.message : String(jsonError)
        };
    }

  } catch (error) {
    console.error('Error interacting with webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown network error occurred.';
    return {
        error: true,
        message: 'Failed to send data to webhook.',
        details: errorMessage
    };
  }
}

/**
* Extracts a meaningful text response from the N8N success data.
* Prioritizes common fields like 'message', 'output', 'text'.
* Falls back to stringifying the whole data object if no specific field is found.
*
* @param responseData The data received from a successful N8N webhook call.
* @returns A string representation of the response, or null if data is empty/undefined.
*/
export function extractN8NResponseText(responseData: N8NSuccessResponse | null | undefined): string | null {
    if (!responseData) {
        return null;
    }

    if (typeof responseData.message === 'string' && responseData.message.trim() !== '') {
        return responseData.message;
    }
    if (typeof responseData.output === 'string' && responseData.output.trim() !== '') {
        return responseData.output;
    }
    if (typeof responseData.text === 'string' && responseData.text.trim() !== '') {
        return responseData.text;
    }

    // Fallback: If specific fields aren't found or are empty, try to stringify the whole object prettily
    // Avoid stringifying if it just contains the empty specific fields we already checked
    const keys = Object.keys(responseData);
    const significantDataExists = keys.some(key =>
        !['message', 'output', 'text'].includes(key) && responseData[key] !== undefined && responseData[key] !== null && responseData[key] !== ''
    );

    if (significantDataExists) {
       try {
           return JSON.stringify(responseData, null, 2); // Pretty print JSON
       } catch (e) {
           return String(responseData); // Basic string conversion if JSON fails
       }
    }


    // If no specific field found and no other significant data, return null
    return null;
}
