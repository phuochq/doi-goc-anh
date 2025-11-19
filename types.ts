
export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '21:9' | '3:2' | '2:3';
export type ImageQuality = 'Standard' | '2K' | '4K';
export type BatchSize = 1 | 2 | 4;
export type VisualizerMode = 'CUBE' | 'HEAD';

export interface AngleState {
  rotation: number; // Yaw: -180 to 180
  tilt: number;     // Pitch: -90 to 90
  zoom: number;     // -10 to 10
  aspectRatio: AspectRatio;
  prompt: string;
  quality: ImageQuality;
  referenceImage: string | null; // Base64 of reference pose
  faceLock: boolean; // If true, subject maintains eye contact/orientation to camera
}

export interface GeneratedImage {
  id: string;
  url: string;
  timestamp: number;
  settings: AngleState;
  isVariation?: boolean;
}

export enum AppStatus {
  IDLE,
  SCANNING, // Analyzing image
  GENERATING, // Creating output
  SUCCESS,
  ERROR
}
