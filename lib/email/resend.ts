/**
 * Backwards compatibility adapter forwarding to SendByte (https://sendbyte.africa).
 */
export {
  sendEmail,
  sendMultipleEmails,
  sendWelcomeEmail,
  type SendEmailResult,
  type BulkSendResult,
  type SendByteEmailPayload,
} from "./sendbyte";
