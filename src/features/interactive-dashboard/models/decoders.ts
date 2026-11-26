import type { WebGLRenderer } from "three";
import { KTX2Loader, type GLTFLoader } from "three-stdlib";

/** Draco decoder copied into public/decoders (see its README); never fetched from a CDN. */
export const DRACO_DECODER_PATH = "/decoders/draco/";
const BASIS_TRANSCODER_PATH = "/decoders/basis/";

// One KTX2 loader per renderer: transcoding targets depend on that renderer's GPU support.
const ktx2Loaders = new WeakMap<WebGLRenderer, KTX2Loader>();

/** Adds KTX2/Basis texture support to a GLTF loader for the given renderer. */
export function withKtx2(gl: WebGLRenderer) {
  return (loader: GLTFLoader) => {
    let ktx2 = ktx2Loaders.get(gl);
    if (!ktx2) {
      ktx2 = new KTX2Loader().setTranscoderPath(BASIS_TRANSCODER_PATH).detectSupport(gl);
      ktx2Loaders.set(gl, ktx2);
    }
    loader.setKTX2Loader(ktx2);
  };
}
