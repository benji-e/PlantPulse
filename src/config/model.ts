export type ImageNormalization = 'inside-model' | 'minus-one-to-one' | 'zero-to-one';

export const MODEL_CONFIG: {
  modelUrl: string;
  labelsUrl: string;
  inputSize: number;
  normalization: ImageNormalization;
  confidenceThreshold: number;
  maxImageDimension: number;
} = {
  modelUrl: '/model/v2/model.json',
  labelsUrl: '/model/v2/labels.json',
  inputSize: 160,
  normalization: 'inside-model' as const,
  confidenceThreshold: 0.6,
  maxImageDimension: 1600
};
