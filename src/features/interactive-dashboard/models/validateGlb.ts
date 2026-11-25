const supportedExtensions = new Set([
  "KHR_materials_unlit",
  "KHR_materials_clearcoat",
  "KHR_materials_transmission",
  "KHR_materials_volume",
  "KHR_materials_ior",
  "KHR_materials_specular",
  "KHR_materials_sheen",
  "KHR_materials_iridescence",
  "KHR_materials_anisotropy",
  "KHR_materials_emissive_strength",
  "KHR_texture_transform",
  "KHR_lights_punctual",
]);
export async function validateGlb(file: File) {
  if (file.size > 15 * 1024 * 1024 || file.size < 20)
    throw new Error("Choose a GLB file up to 15 MB.");
  const buffer = await file.arrayBuffer(),
    view = new DataView(buffer);
  if (
    view.getUint32(0, true) !== 0x46546c67 ||
    view.getUint32(4, true) !== 2 ||
    view.getUint32(8, true) !== buffer.byteLength
  )
    throw new Error("The file must be a valid GLB version 2.");
  const length = view.getUint32(12, true);
  if (
    view.getUint32(16, true) !== 0x4e4f534a ||
    length % 4 ||
    length + 20 > buffer.byteLength
  )
    throw new Error("Invalid GLB metadata.");
  const metadata = JSON.parse(
    new TextDecoder().decode(new Uint8Array(buffer, 20, length)),
  );
  if (!metadata.meshes?.length)
    throw new Error("The model contains no meshes.");
  if (
    metadata.extensionsRequired?.some(
      (extension: string) => !supportedExtensions.has(extension),
    )
  )
    throw new Error(
      "Export uncompressed geometry with embedded PNG/JPEG textures.",
    );
  for (const item of [
    ...(metadata.buffers ?? []),
    ...(metadata.images ?? []),
  ]) {
    if (item.uri && !item.uri.startsWith("data:"))
      throw new Error("Embed all textures and buffers in the GLB.");
  }
}
