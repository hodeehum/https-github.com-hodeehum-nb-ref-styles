
export interface Style {
  category: string;
  name: string;
  prompt: string;
}

export interface GeneratedImage {
  id: string;
  base64: string;
  prompt: string;
  mimeType: 'image/jpeg' | 'image/png';
  width?: number;
  height?: number;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '3:4' | '4:3' | 'source';