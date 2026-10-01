/**
 * "Virtual frame" patch for the paper-design Heatmap fragment shader
 * (@paper-design/shaders 0.0.80). See docs/parked-decisions.md §69.
 *
 * The heatmap's edge glow comes from the texture: toProcessedHeatmap() pads
 * the shape with white, and its three blur passes "see" that white near the
 * frame. Where the shape's dark gap meets the frame, the inner glow and the
 * contour light up. Our shape is square and fitted with `cover`, so on any
 * non-square hero one axis of that frame is cropped off screen — the top and
 * bottom on a laptop, the sides on a phone — and the effect goes with it.
 *
 * This patch moves the frame to the edge of the viewport on the cropped axis.
 * Each texture channel is a blur of the grey field, and (1 - channel) is a
 * blur of the "darkness" (1 - grey) inside the frame. Near a straight edge
 * that darkness is scaled by the share of the blur kernel still inside, so
 * a frame at the viewport edge instead of the texture edge is
 *
 *   1 - V' = (1 - V) * C(viewport ∩ frame) / C(frame)
 *
 * where C is the kernel's coverage of a rectangle — a product of one 1D tail
 * per edge. On an axis where the viewport edge *is* the frame edge, the two
 * coverages are equal and the channel is untouched, so nothing doubles up.
 *
 * Kernel widths are toProcessedHeatmap's, in units of the 1000px shape box:
 * R (the sharp channel the shader calls `shape`) is one box pass of radius 5,
 * G (the big outer-glow blur) three passes of 150, B (inner glow / contour)
 * three passes of 18. n box passes of radius r have sigma r*sqrt(n/3), and a
 * logistic stands in for the normal CDF.
 *
 * It costs a handful of ALU ops per pixel and no extra texture reads.
 */

/** The anchor the patch is spliced around. If a library update changes this
 *  text the patch can't apply, and withViewportFrame returns null rather
 *  than shipping a half-patched shader. */
const ANCHOR = `float shape = img[0];

  img[1] = blurEdge3x3(u_image, imgUV, dudx, dudy, 8., img[1]);`

const REPLACEMENT = `img[1] = blurEdge3x3(u_image, imgUV, dudx, dudy, 8., img[1]);
  img.rgb = viewportFrame(img.rgb);
  float shape = img[0];`

// Declared mediump to match the vertex shader's u_resolution: GLSL ES 3.00
// won't link a uniform shared across stages at two precisions.
const FUNCTIONS = `
uniform mediump vec2 u_resolution;
uniform float u_frameStrength;

// Share of a blur kernel (sigma s) lying beyond an edge d box-units away.
float frameTail(float d, float s) {
  return 1. / (1. + exp(clamp(1.702 * d / s, -30., 30.)));
}

// Kernel coverage of a rectangle, from the four distances to its edges.
float frameCover(vec4 d, float s) {
  return (1. - frameTail(d.x, s)) * (1. - frameTail(d.y, s))
       * (1. - frameTail(d.z, s)) * (1. - frameTail(d.w, s));
}

vec3 viewportFrame(vec3 v) {
  // The viewport in shape-box units. v_imageUV is affine in screen space,
  // so its derivatives are exact constants — this follows cover, the mobile
  // pan and u_scale without being told about any of them.
  vec2 size = vec2(abs(dFdx(v_imageUV.x)), abs(dFdy(v_imageUV.y))) * u_resolution;
  vec2 p = gl_FragCoord.xy / u_resolution;
  // left, right, top, bottom. v_imageUV.y runs top-down, gl_FragCoord.y up.
  vec4 toFrame = vec4(v_imageUV.x, 1. - v_imageUV.x, v_imageUV.y, 1. - v_imageUV.y);
  vec4 toView = vec4(p.x * size.x, (1. - p.x) * size.x, (1. - p.y) * size.y, p.y * size.y);
  vec4 toBoth = min(toView, toFrame);

  vec3 sigma = vec3(.005 / sqrt(3.), .15, .018);
  vec3 ratio = vec3(
    frameCover(toBoth, sigma.r) / max(1e-4, frameCover(toFrame, sigma.r)),
    frameCover(toBoth, sigma.g) / max(1e-4, frameCover(toFrame, sigma.g)),
    frameCover(toBoth, sigma.b) / max(1e-4, frameCover(toFrame, sigma.b))
  );
  ratio = mix(vec3(1.), ratio, u_frameStrength);
  return 1. - (1. - v) * ratio;
}

void main() {`

export function withViewportFrame(source: string): string | null {
  if (!source.includes(ANCHOR) || !source.includes('\nvoid main() {')) return null
  return source.replace(ANCHOR, REPLACEMENT).replace('\nvoid main() {', FUNCTIONS)
}
