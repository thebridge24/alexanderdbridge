declare module "framer-motion" {
  export const AnimatePresence: any;
  export const motion: any;
  export type Variants = Record<string, unknown>;
}

declare module "firebase/app" {
  export type FirebaseApp = unknown;
  export const getApps: any;
  export const getApp: any;
  export const initializeApp: any;
}

declare module "firebase/messaging" {
  export type Messaging = unknown;
  export interface MessagePayload {
    notification?: {
      title?: string;
      body?: string;
    };
  }

  export const getToken: any;
  export const getMessaging: any;
  export const isSupported: () => Promise<boolean>;
  export const onMessage: any;
}