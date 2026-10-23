import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-wasm';
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import { MODEL_CONFIG } from '../config/model';
import diseases from '../data/diseases.json';
import type { Disease, Prediction } from '../lib/types';

type Model = tf.GraphModel;
type ImageSource = File | Blob | HTMLImageElement | HTMLCanvasElement;

let modelPromise: Promise<Model> | undefined;
let labelsPromise: Promise<string[]> | undefined;

export async function cacheModelAssets(): Promise<number> {
  const modelUrl = new URL(MODEL_CONFIG.modelUrl, window.location.origin);
  const labelsUrl = new URL(MODEL_CONFIG.labelsUrl, window.location.origin);
  const response = await fetch(modelUrl);
  if (!response.ok) throw new Error(`Could not prepare offline model files (${response.status}).`);
  const modelJson: unknown = await response.clone().json();
  if (!modelJson || typeof modelJson !== 'object' || !('weightsManifest' in modelJson) || !Array.isArray(modelJson.weightsManifest)) {
    throw new Error('model.json has no valid weightsManifest; offline caching cannot be completed.');
  }
  const shardPaths: string[] = modelJson.weightsManifest.flatMap((group: unknown): string[] => {
    if (!group || typeof group !== 'object' || !('paths' in group) || !Array.isArray(group.paths)) return [];
    return group.paths.filter((path: unknown): path is string => typeof path === 'string');
  });
  if (shardPaths.length === 0) throw new Error('model.json does not list any weight shards.');
  const files = [modelUrl, labelsUrl, ...shardPaths.map((path) => new URL(path, modelUrl))];
  if (files.some((file) => file.origin !== window.location.origin)) {
    throw new Error('Model files must be hosted with PlantPulse to support private offline diagnosis.');
  }
  const cache = await caches.open('plantpulse-model-v2');
  let completed = 0;
  for (const file of files) {
    const cached = await cache.match(file.href, { ignoreSearch: false });
    if (!cached) {
      const asset = await fetch(file.href);
      if (!asset.ok) throw new Error(`Could not cache model file ${file.pathname} (${asset.status}).`);
      await cache.put(file.href, asset);
    }
    completed += 1;
  }
  return completed;
}

async function selectBackend(): Promise<string> {
  const backends = ['webgl', 'wasm', 'cpu'] as const;
  const errors: string[] = [];
  setWasmPaths('/tfjs-wasm/');
  for (const backend of backends) {
    try {
      if (await tf.setBackend(backend)) {
        await tf.ready();
        return backend;
      }
    } catch (error) {
      errors.push(`${backend}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`No supported TensorFlow.js backend is available. ${errors.join('; ')}`);
}

async function readLabels(): Promise<string[]> {
  const response = await fetch(MODEL_CONFIG.labelsUrl);
  if (!response.ok) {
    throw new Error(`Could not load class labels (${response.status}). Add labels.json beside model.json.`);
  }
  const labels: unknown = await response.json();
  if (!Array.isArray(labels) || labels.length === 0 || !labels.every((label) => typeof label === 'string')) {
    throw new Error('labels.json must be a non-empty array of class label strings in training order.');
  }
  return labels;
}

async function loadModel(onProgress?: (progress: number) => void): Promise<Model> {
  const backend = await selectBackend();
  const response = await fetch(MODEL_CONFIG.modelUrl);
  if (!response.ok) {
    throw new Error(`Could not load the diagnosis model (${response.status}).`);
  }
  let modelJson: unknown;
  try {
    modelJson = await response.clone().json();
  } catch {
    const contentType = response.headers.get('content-type') ?? 'unknown content type';
    throw new Error(`The diagnosis model response is not valid JSON (${contentType}). Check that ${MODEL_CONFIG.modelUrl} is deployed.`);
  }
  if (
    !modelJson ||
    typeof modelJson !== 'object' ||
    !('format' in modelJson) ||
    modelJson.format !== 'graph-model' ||
    !('weightsManifest' in modelJson) ||
    !Array.isArray(modelJson.weightsManifest)
  ) {
    throw new Error('The diagnosis model file is not a valid TensorFlow.js GraphModel export.');
  }
  let loaded: Model;
  try {
    loaded = await tf.loadGraphModel(MODEL_CONFIG.modelUrl, {
      onProgress: (fraction) => onProgress?.(Math.round(fraction * 100))
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to load the TensorFlow.js model using ${backend}. ${details}`);
  }
  const [labels] = await Promise.all([labelsPromise ??= readLabels()]);
  const dummy = tf.zeros([1, MODEL_CONFIG.inputSize, MODEL_CONFIG.inputSize, 3]);
  let output: tf.Tensor | tf.Tensor[] | tf.NamedTensorMap;
  try {
    output = loaded.predict(dummy);
  } finally {
    dummy.dispose();
  }
  const firstOutput = Array.isArray(output) ? output[0] : output instanceof tf.Tensor ? output : Object.values(output)[0];
  if (!(firstOutput instanceof tf.Tensor)) throw new Error('Model did not return a tensor output.');
  const outputShape = firstOutput.shape;
  tf.dispose(output);
  const outputSize = outputShape?.[outputShape.length - 1];
  if (outputSize !== labels.length) {
    loaded.dispose();
    throw new Error(`Model outputs ${outputSize} classes but labels.json contains ${labels.length}. Keep these files from the same training run.`);
  }
  return loaded;
}

export async function warmClassifier(onProgress?: (progress: number) => void): Promise<{ backend: string }> {
  const backend = await selectBackend();
  modelPromise ??= loadModel(onProgress);
  const model = await modelPromise;
  tf.tidy(() => {
    const dummy = tf.zeros([1, MODEL_CONFIG.inputSize, MODEL_CONFIG.inputSize, 3]);
    const result = model.predict(dummy);
    const tensor = Array.isArray(result) ? result[0] : result instanceof tf.Tensor ? result : Object.values(result)[0];
    if (tensor instanceof tf.Tensor) tensor.dataSync();
  });
  return { backend };
}

function asTensor(source: HTMLImageElement | HTMLCanvasElement | ImageBitmap): tf.Tensor3D {
  const pixels = tf.browser.fromPixels(source);
  const resized = tf.image.resizeBilinear(pixels, [MODEL_CONFIG.inputSize, MODEL_CONFIG.inputSize], false, true).toFloat();
  if (MODEL_CONFIG.normalization === 'minus-one-to-one') {
    return resized.div(127.5).sub(1) as tf.Tensor3D;
  }
  if (MODEL_CONFIG.normalization === 'zero-to-one') {
    return resized.div(255) as tf.Tensor3D;
  }
  return resized as tf.Tensor3D;
}

export async function classifyImage(
  source: ImageSource,
  onProgress?: (progress: number) => void
): Promise<{ predictions: Prediction[]; inferenceMs: number; backend: string }> {
  const backend = await selectBackend();
  modelPromise ??= loadModel(onProgress);
  const [model, labels] = await Promise.all([modelPromise, labelsPromise ??= readLabels()]);
  const decoded = source instanceof Blob ? await createImageBitmap(source) : source;
  const start = performance.now();
  let scores: number[];
  try {
    scores = tf.tidy(() => {
      const input = asTensor(decoded).expandDims(0);
      const result = model.predict(input);
      const output = Array.isArray(result) ? result[0] : result instanceof tf.Tensor ? result : Object.values(result)[0];
      if (!(output instanceof tf.Tensor)) throw new Error('Model did not return class scores.');
      return Array.from(output.dataSync());
    });
  } finally {
    if (decoded instanceof ImageBitmap && source instanceof Blob) decoded.close();
  }
  const inferenceMs = performance.now() - start;
  const allDiseases = diseases as Disease[];
  const predictions = scores
    .map((confidence, index) => {
      const label = labels[index];
      const disease = allDiseases.find((item) => item.label === label || item.id === label);
      if (!disease) throw new Error(`No local disease guide entry matches model label "${label}".`);
      return { label, confidence, disease };
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
  return { predictions, inferenceMs, backend };
}
