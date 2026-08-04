"use client";

/*
 *   Stripe WebGL Gradient Animation
 *   All Credits to Stripe.com
 *   ScrollObserver functionality to disable animation when not scrolled into view has been disabled.
 *   https://kevinhufnagl.com
 */
import { useEffect, useRef } from "react";

// Converting colors to proper format
function normalizeColor(hexCode: number | string): number[] {
  const code: number = parseInt(String(hexCode), 16);
  const r: number = (code >> 16) & 255;
  const g: number = (code >> 8) & 255;
  const b: number = code & 255;
  return [r / 255, g / 255, b / 255];
}

// Essential functionality of WebGL
class MiniGl {
  canvas: any;
  gl: any;
  meshes: any[] = [];
  commonUniforms: any = {};
  width?: number;
  height?: number;
  lastDebugMsg: any;
  debug: (e: string, ...args: any[]) => void;
  Uniform: any;
  Material: any;
  PlaneGeometry: any;
  Mesh: any;
  Attribute: any;

  constructor(canvas: HTMLCanvasElement, width?: number, height?: number, debug = false) {
    const _miniGl = this;
    const debug_output = -1 !== document.location.search.toLowerCase().indexOf("debug=webgl");

    _miniGl.canvas = canvas;
    _miniGl.gl = canvas.getContext("webgl", { antialias: true });
    _miniGl.meshes = [];

    const context = _miniGl.gl;
    if (width && height) this.setSize(width, height);

_miniGl.debug = debug && debug_output ? (e: string, ...args: any[]) => {
      const t: number = Date.now();
      if (t - _miniGl.lastDebugMsg > 1000) console.log("---");
      console.log(`${new Date(t).toLocaleTimeString() + Array(Math.max(0, 32 - e.length)).join(" ") + e}: `, ...args);
      _miniGl.lastDebugMsg = t;
    } : () => {};

    _miniGl.Material = class {
      vertexSource: string;
      Source: string;
      vertexShader: any;
      fragmentShader: any;
      program: any;
      uniforms: any;
      uniformInstances: any[] = [];
      constructor(vertexShaders: string, fragments: string, uniforms: any = {}) {
        const material = this;

        function getShaderByType(type: number, source: string) {
          const shader = context.createShader(type);
          context.shaderSource(shader, source);
          context.compileShader(shader);
          context.getShaderParameter(shader, context.COMPILE_STATUS) || console.error(context.getShaderInfoLog(shader));
          return shader;
        }

        function getUniformVariableDeclarations(uniforms: any, type: string) {
          return Object.entries(uniforms).map(([uniform, value]: any) => value.getDeclaration(uniform, type)).join("\n");
        }

        material.uniforms = uniforms;
        material.uniformInstances = [];

        const prefix = "\n              precision highp float;\n            ";
        material.vertexSource = `
              ${prefix}
              attribute vec4 position;
              attribute vec2 uv;
              attribute vec2 uvNorm;
              ${getUniformVariableDeclarations(_miniGl.commonUniforms, "vertex")}
              ${getUniformVariableDeclarations(uniforms, "vertex")}
              ${vertexShaders}
            `;
        material.Source = `
              ${prefix}
              ${getUniformVariableDeclarations(_miniGl.commonUniforms, "fragment")}
              ${getUniformVariableDeclarations(uniforms, "fragment")}
              ${fragments}
            `;
        material.vertexShader = getShaderByType(context.VERTEX_SHADER, material.vertexSource);
        material.fragmentShader = getShaderByType(context.FRAGMENT_SHADER, material.Source);
        material.program = context.createProgram();
        context.attachShader(material.program, material.vertexShader);
        context.attachShader(material.program, material.fragmentShader);
        context.linkProgram(material.program);
        context.getProgramParameter(material.program, context.LINK_STATUS) || console.error(context.getProgramInfoLog(material.program));
        context.useProgram(material.program);
        material.attachUniforms(void 0, _miniGl.commonUniforms);
        material.attachUniforms(void 0, material.uniforms);
      }

      attachUniforms(name: string | undefined, uniforms: any) {
        const material = this;
        if (void 0 === name) {
          Object.entries(uniforms).forEach(([name, uniform]: any) => {
            material.attachUniforms(name, uniform);
          });
        } else if ("array" == uniforms.type) {
          uniforms.value.forEach((uniform: any, i: number) => material.attachUniforms(`${name}[${i}]`, uniform));
        } else if ("struct" == uniforms.type) {
          Object.entries(uniforms.value).forEach(([uniform, i]: any) => material.attachUniforms(`${name}.${uniform}`, i));
        } else {
          material.uniformInstances.push({
            uniform: uniforms,
            location: context.getUniformLocation(material.program, name),
          });
        }
      }
    };

    _miniGl.Uniform = class {
      type = "float";
      value: any;
      typeFn: string;
      transpose: boolean = false;
      excludeFrom?: string;
constructor(e: any) {
        this.type = "float";
        Object.assign(this, e);
        this.typeFn = {
          float: "1f",
          int: "1i",
          vec2: "2fv",
          vec3: "3fv",
          vec4: "4fv",
          mat4: "Matrix4fv",
        }[this.type] || "1f";
      }
      update(location: any) {
        if (void 0 !== this.value && location != null) {
          if (this.typeFn === "Matrix4fv") {
            context.uniformMatrix4fv(location, this.transpose, this.value);
          } else {
            context[`uniform${this.typeFn}`](location, this.value);
          }
        }
      }
      getDeclaration(name: string, type: string, length = 0) {
        const uniform = this;
        if (uniform.excludeFrom !== type) {
          if ("array" === uniform.type) {
            return `${uniform.value[0].getDeclaration(name, type, uniform.value.length)}\nconst int ${name}_length = ${uniform.value.length};`;
          }
          if ("struct" === uniform.type) {
            let name_no_prefix = name.replace("u_", "");
            name_no_prefix = name_no_prefix.charAt(0).toUpperCase() + name_no_prefix.slice(1);
            return `uniform struct ${name_no_prefix}\n{\n${Object.entries(uniform.value).map(([name, uniform]: any) => uniform.getDeclaration(name, type).replace(/^uniform/, "")).join("")}\n} ${name}${length > 0 ? `[${length}]` : ""};`;
          }
          return `uniform ${uniform.type} ${name}${length > 0 ? `[${length}]` : ""};`;
        }
        return "";
      }
    };

    _miniGl.PlaneGeometry = class {
      attributes: any;
      xSegCount = 1;
      ySegCount = 1;
      vertexCount = 0;
      quadCount = 0;
      width = 1;
      height = 1;
      orientation = "xz";
      constructor(width: number, height: number, n: number, i: number, orientation: string) {
        this.attributes = {
          position: new _miniGl.Attribute({ target: context.ARRAY_BUFFER, size: 3 }),
          uv: new _miniGl.Attribute({ target: context.ARRAY_BUFFER, size: 2 }),
          uvNorm: new _miniGl.Attribute({ target: context.ARRAY_BUFFER, size: 2 }),
          index: new _miniGl.Attribute({ target: context.ELEMENT_ARRAY_BUFFER, size: 3, type: context.UNSIGNED_SHORT }),
        };
        this.setTopology(n, i);
        this.setSize(width, height, orientation);
      }
      setTopology(e = 1, t = 1) {
        const n = this;
        n.xSegCount = e;
        n.ySegCount = t;
        n.vertexCount = (n.xSegCount + 1) * (n.ySegCount + 1);
        n.quadCount = n.xSegCount * n.ySegCount * 2;
        n.attributes.uv.values = new Float32Array(2 * n.vertexCount);
        n.attributes.uvNorm.values = new Float32Array(2 * n.vertexCount);
        n.attributes.index.values = new Uint16Array(3 * n.quadCount);
        for (let e = 0; e <= n.ySegCount; e++)
          for (let t = 0; t <= n.xSegCount; t++) {
            const i = e * (n.xSegCount + 1) + t;
            if ((n.attributes.uv.values[2 * i] = t / n.xSegCount, n.attributes.uv.values[2 * i + 1] = 1 - e / n.ySegCount, n.attributes.uvNorm.values[2 * i] = t / n.xSegCount * 2 - 1, n.attributes.uvNorm.values[2 * i + 1] = 1 - e / n.ySegCount * 2, t < n.xSegCount && e < n.ySegCount)) {
              const s = e * n.xSegCount + t;
              n.attributes.index.values[6 * s] = i;
              n.attributes.index.values[6 * s + 1] = i + 1 + n.xSegCount;
              n.attributes.index.values[6 * s + 2] = i + 1;
              n.attributes.index.values[6 * s + 3] = i + 1;
              n.attributes.index.values[6 * s + 4] = i + 1 + n.xSegCount;
              n.attributes.index.values[6 * s + 5] = i + 2 + n.xSegCount;
            }
          }
        n.attributes.uv.update();
        n.attributes.uvNorm.update();
        n.attributes.index.update();
      }
      setSize(width = 1, height = 1, orientation = "xz") {
        const geometry = this;
        geometry.width = width;
        geometry.height = height;
        geometry.orientation = orientation;
        if (!geometry.attributes.position.values || geometry.attributes.position.values.length !== 3 * geometry.vertexCount) {
          geometry.attributes.position.values = new Float32Array(3 * geometry.vertexCount);
        }
        const o = width / -2;
        const r = height / -2;
        const segment_width = width / geometry.xSegCount;
        const segment_height = height / geometry.ySegCount;
        for (let yIndex = 0; yIndex <= geometry.ySegCount; yIndex++) {
          const t = r + yIndex * segment_height;
          for (let xIndex = 0; xIndex <= geometry.xSegCount; xIndex++) {
            const r = o + xIndex * segment_width;
            const l = yIndex * (geometry.xSegCount + 1) + xIndex;
            geometry.attributes.position.values[3 * l + "xyz".indexOf(orientation[0])] = r;
            geometry.attributes.position.values[3 * l + "xyz".indexOf(orientation[1])] = -t;
          }
        }
        geometry.attributes.position.update();
      }
    };

    _miniGl.Mesh = class {
      geometry: any;
      material: any;
      wireframe = false;
      attributeInstances: any[] = [];
      constructor(geometry: any, material: any) {
        const mesh = this;
        mesh.geometry = geometry;
        mesh.material = material;
        mesh.wireframe = false;
        mesh.attributeInstances = [];
        Object.entries(mesh.geometry.attributes).forEach(([e, attribute]: any) => {
          mesh.attributeInstances.push({ attribute, location: attribute.attach(e, mesh.material.program) });
        });
        _miniGl.meshes.push(mesh);
      }
      draw() {
        context.useProgram(this.material.program);
        this.material.uniformInstances.forEach(({ uniform, location }: any) => uniform.update(location));
        this.attributeInstances.forEach(({ attribute, location }: any) => attribute.use(location));
        context.drawElements(this.wireframe ? context.LINES : context.TRIANGLES, this.geometry.attributes.index.values.length, context.UNSIGNED_SHORT, 0);
      }
      remove() {
        _miniGl.meshes = _miniGl.meshes.filter((e) => e != this);
      }
    };

    _miniGl.Attribute = class {
      type = context.FLOAT;
      normalized = false;
      buffer: any;
      target: any;
      size: number;
      values: any;
      constructor(e: any) {
        this.type = context.FLOAT;
        this.normalized = false;
        this.buffer = context.createBuffer();
        Object.assign(this, e);
        this.update();
      }
      update() {
        if (void 0 !== this.values) {
          context.bindBuffer(this.target, this.buffer);
          context.bufferData(this.target, this.values, context.STATIC_DRAW);
        }
      }
      attach(e: string, t: any) {
        const n = context.getAttribLocation(t, e);
        if (this.target === context.ARRAY_BUFFER) {
          context.enableVertexAttribArray(n);
          context.vertexAttribPointer(n, this.size, this.type, this.normalized, 0, 0);
        }
        return n;
      }
      use(e: any) {
        context.bindBuffer(this.target, this.buffer);
        if (this.target === context.ARRAY_BUFFER) {
          context.enableVertexAttribArray(e);
          context.vertexAttribPointer(e, this.size, this.type, this.normalized, 0, 0);
        }
      }
    };

    const a = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    _miniGl.commonUniforms = {
      projectionMatrix: new _miniGl.Uniform({ type: "mat4", value: a }),
      modelViewMatrix: new _miniGl.Uniform({ type: "mat4", value: a }),
      resolution: new _miniGl.Uniform({ type: "vec2", value: [1, 1] }),
      aspectRatio: new _miniGl.Uniform({ type: "float", value: 1 }),
    };
  }

  setSize(e = 640, t = 480) {
    this.width = e;
    this.height = t;
    this.canvas.width = e;
    this.canvas.height = t;
    this.gl.viewport(0, 0, e, t);
    this.commonUniforms.resolution.value = [e, t];
    this.commonUniforms.aspectRatio.value = e / t;
  }

  setOrthographicCamera(e = 0, t = 0, n = 0, i = -2000, s = 2000) {
    this.commonUniforms.projectionMatrix.value = [2 / this.width, 0, 0, 0, 0, 2 / this.height, 0, 0, 0, 0, 2 / (i - s), 0, e, t, n, 1];
  }

  render() {
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clearDepth(1);
    this.meshes.forEach((e) => e.draw());
  }
}

// Gradient object
class Gradient {
  el: any;
  cssVarRetries = 0;
  maxCssVarRetries = 200;
  angle = 0;
  isLoadedClass = false;
  isScrolling = false;
  isStatic = false;
  scrollingTimeout: any;
  scrollingRefreshDelay = 200;
  isIntersecting = false;
  shaderFiles: any;
  vertexShader: any;
  sectionColors: any;
  computedCanvasStyle: any;
  conf: any;
  uniforms: any;
t = 0;
  last = 0;
  width: any;
  minWidth = 1111;
  height = 600;
  xSegCount: any;
  ySegCount: any;
  mesh: any;
  material: any;
  geometry: any;
  minigl: any;
  scrollObserver: any;
amp = 420;
  seed = 5;
  freqX = 30e-5;
  freqY = 55e-5;
  freqDelta = 1e-5;
  activeColors = [1, 1, 1, 1];
  isMetaKey = false;
  isGradientLegendVisible = false;
  isMouseDown = false;

  handleScroll = () => {
    clearTimeout(this.scrollingTimeout);
    this.scrollingTimeout = setTimeout(this.handleScrollEnd, this.scrollingRefreshDelay);
    if (this.isGradientLegendVisible) this.hideGradientLegend();
    if (this.conf.playing) {
      this.isScrolling = true;
      this.pause();
    }
  };

  handleScrollEnd = () => {
    this.isScrolling = false;
    if (this.isIntersecting) this.play();
  };

  resize = () => {
    this.width = window.innerWidth;
    this.minigl.setSize(this.width, this.height);
    this.minigl.setOrthographicCamera();
    this.xSegCount = Math.ceil(this.width * this.conf.density[0]);
    this.ySegCount = Math.ceil(this.height * this.conf.density[1]);
    this.mesh.geometry.setTopology(this.xSegCount, this.ySegCount);
    this.mesh.geometry.setSize(this.width, this.height);
    this.mesh.material.uniforms.u_shadow_power.value = this.width < 600 ? 5 : 6;
  };

  handleMouseDown = (e: MouseEvent) => {
    if (this.isGradientLegendVisible) {
      this.isMetaKey = e.metaKey;
      this.isMouseDown = true;
      if (this.conf.playing === false) requestAnimationFrame(this.animate);
    }
  };

handleMouseUp = () => {
    this.isMouseDown = false;
  };

  handleKeyDown = () => {
    // no-op — kept for parity with the original script's event wiring
  };

  animate = (e: number) => {
    if (!this.shouldSkipFrame(e) || this.isMouseDown) {
      if ((this.t += Math.min(e - this.last, 1000 / 8), (this.last = e), this.isMouseDown)) {
        let e = 160;
        if (this.isMetaKey) e = -160;
        this.t += e;
      }
      this.mesh.material.uniforms.u_time.value = this.t;
      this.minigl.render();
    }
    if (0 !== this.last && this.isStatic) return this.minigl.render(), void this.disconnect();
    if (this.conf.playing || this.isMouseDown) requestAnimationFrame(this.animate);
  };

  addIsLoadedClass = () => {
    if (!this.isLoadedClass) {
      this.isLoadedClass = true;
      this.el.classList.add("isLoaded");
      setTimeout(() => {
        this.el.parentElement.classList.add("isLoaded");
      }, 3000);
    }
  };

  pause = () => {
    this.conf.playing = false;
  };

  play = () => {
    requestAnimationFrame(this.animate);
    this.conf.playing = true;
  };

  connect() {
    this.shaderFiles = {
      vertex: "varying vec3 v_color;\n\nvoid main() {\n  float time = u_time * u_global.noiseSpeed;\n\n  vec2 noiseCoord = resolution * uvNorm * u_global.noiseFreq;\n\n  vec2 st = 1. - uvNorm.xy;\n\n  // Tilting the plane\n\n  // Front-to-back tilt\n  float tilt = resolution.y / 2.0 * uvNorm.y;\n\n  // Left-to-right angle\n  float incline = resolution.x * uvNorm.x / 2.0 * u_vertDeform.incline;\n\n  // Up-down shift to offset incline\n  float offset = resolution.x / 2.0 * u_vertDeform.incline * mix(u_vertDeform.offsetBottom, u_vertDeform.offsetTop, uv.y);\n\n  // Vertex noise\n\n  float noise = snoise(vec3(\n    noiseCoord.x * u_vertDeform.noiseFreq.x + time * u_vertDeform.noiseFlow,\n    noiseCoord.y * u_vertDeform.noiseFreq.y,\n    time * u_vertDeform.noiseSpeed + u_vertDeform.noiseSeed\n  )) * u_vertDeform.noiseAmp;\n\n  // Fade noise to zero at edges\n  noise *= 1.0 - pow(abs(uvNorm.y), 2.0);\n\n  // Clamp to 0\n  noise = max(0.0, noise);\n\n  vec3 pos = vec3(\n    position.x,\n    position.y + tilt + incline + noise - offset,\n    position.z\n  );\n\n  // Vertex color, to be passed to fragment shader\n\n  if (u_active_colors[0] == 1.) {\n    v_color = u_baseColor;\n  }\n\n  for (int i = 0; i < u_waveLayers_length; i++) {\n    if (u_active_colors[i + 1] == 1.) {\n      WaveLayers layer = u_waveLayers[i];\n\n      float noise = smoothstep(\n        layer.noiseFloor,\n        layer.noiseCeil,\n        snoise(vec3(\n          noiseCoord.x * layer.noiseFreq.x + time * layer.noiseFlow,\n          noiseCoord.y * layer.noiseFreq.y,\n          time * layer.noiseSpeed + layer.noiseSeed\n        )) / 2.0 + 0.5\n      );\n\n      v_color = blendNormal(v_color, layer.color, pow(noise, 4.));\n    }\n  }\n\n  // Finish\n\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);\n}",
      noise: "//\n// Description : Array and textureless GLSL 2D/3D/4D simplex\n//               noise functions.\n//      Author : Ian McEwan, Ashima Arts.\n//  Maintainer : stegu\n//     Lastmod : 20110822 (ijm)\n//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.\n//               Distributed under the MIT License. See LICENSE file.\n//               https://github.com/ashima/webgl-noise\n//               https://github.com/stegu/webgl-noise\n//\n\nvec3 mod289(vec3 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 mod289(vec4 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 permute(vec4 x) {\n    return mod289(((x*34.0)+1.0)*x);\n}\n\nvec4 taylorInvSqrt(vec4 r)\n{\n  return 1.79284291400159 - 0.85373472095314 * r;\n}\n\nfloat snoise(vec3 v)\n{\n  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;\n  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);\n\n// First corner\n  vec3 i  = floor(v + dot(v, C.yyy) );\n  vec3 x0 =   v - i + dot(i, C.xxx) ;\n\n// Other corners\n  vec3 g = step(x0.yzx, x0.xyz);\n  vec3 l = 1.0 - g;\n  vec3 i1 = min( g.xyz, l.zxy );\n  vec3 i2 = max( g.xyz, l.zxy );\n\n  vec3 x1 = x0 - i1  + C.xxx;\n  vec3 x2 = x0 - i2  + C.yyy;\n  vec3 x3 = x0 - D.yyy;\n\n// Permutations\n  i = mod289(i);\n  vec4 p = permute( permute( permute(\n            i.z + vec4(0.0, i1.z, i2.z, 1.0 ))\n          + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))\n          + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));\n\n// Gradients: 7x7 points over a square, mapped onto an octahedron.\n  float n_ = 0.142857142857;\n  vec3  ns = n_ * D.wyz - D.xzx;\n\n  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);\n\n  vec4 x_ = floor(j * ns.z);\n  vec4 y_ = floor(j - 7.0 * x_ );\n\n  vec4 x = x_ *ns.x + ns.yyyy;\n  vec4 y = y_ *ns.x + ns.yyyy;\n  vec4 h = 1.0 - abs(x) - abs(y);\n\n  vec4 b0 = vec4( x.xy, y.xy );\n  vec4 b1 = vec4( x.zw, y.zw );\n\n  vec4 s0 = floor(b0)*2.0 + 1.0;\n  vec4 s1 = floor(b1)*2.0 + 1.0;\n  vec4 sh = -step(h, vec4(0.0));\n\n  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;\n  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;\n\n  vec3 p0 = vec3(a0.xy,h.x);\n  vec3 p1 = vec3(a0.zw,h.y);\n  vec3 p2 = vec3(a1.xy,h.z);\n  vec3 p3 = vec3(a1.zw,h.w);\n\n//Normalise gradients\n  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n  p0 *= norm.x;\n  p1 *= norm.y;\n  p2 *= norm.z;\n  p3 *= norm.w;\n\n// Mix final noise value\n  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);\n  m = m * m;\n  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),\n                                dot(p2,x2), dot(p3,x3) ) );\n}",
      blend: "//\n// https://github.com/jamieowen/glsl-blend\n//\n\n// Normal\n\nvec3 blendNormal(vec3 base, vec3 blend) {\n\treturn blend;\n}\n\nvec3 blendNormal(vec3 base, vec3 blend, float opacity) {\n\treturn (blendNormal(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Screen\n\nfloat blendScreen(float base, float blend) {\n\treturn 1.0-((1.0-base)*(1.0-blend));\n}\n\nvec3 blendScreen(vec3 base, vec3 blend) {\n\treturn vec3(blendScreen(base.r,blend.r),blendScreen(base.g,blend.g),blendScreen(base.b,blend.b));\n}\n\nvec3 blendScreen(vec3 base, vec3 blend, float opacity) {\n\treturn (blendScreen(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Overlay\n\nfloat blendOverlay(float base, float blend) {\n\treturn base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));\n}\n\nvec3 blendOverlay(vec3 base, vec3 blend) {\n\treturn vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));\n}\n\nvec3 blendOverlay(vec3 base, vec3 blend, float opacity) {\n\treturn (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Linear burn\n\nfloat blendLinearBurn(float base, float blend) {\n\treturn max(base+blend-1.0,0.0);\n}\n\nvec3 blendLinearBurn(vec3 base, vec3 blend) {\n\treturn max(base+blend-vec3(1.0),vec3(0.0));\n}\n\nvec3 blendLinearBurn(vec3 base, vec3 blend, float opacity) {\n\treturn (blendLinearBurn(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Linear dodge\n\nfloat blendLinearDodge(float base, float blend) {\n\treturn min(base+blend,1.0);\n}\n\nvec3 blendLinearDodge(vec3 base, vec3 blend) {\n\treturn min(base+blend,vec3(1.0));\n}\n\nvec3 blendLinearDodge(vec3 base, vec3 blend, float opacity) {\n\treturn (blendLinearDodge(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Linear light\n\nfloat blendLinearLight(float base, float blend) {\n\treturn blend<0.5?blendLinearBurn(base,(2.0*blend)):blendLinearDodge(base,(2.0*(blend-0.5)));\n}\n\nvec3 blendLinearLight(vec3 base, vec3 blend) {\n\treturn vec3(blendLinearLight(base.r,blend.r),blendLinearLight(base.g,blend.g),blendLinearLight(base.b,blend.b));\n}\n\nvec3 blendLinearLight(vec3 base, vec3 blend, float opacity) {\n\treturn (blendLinearLight(base, blend) * opacity + base * (1.0 - opacity));\n}",
      fragment: "varying vec3 v_color;\n\nvoid main() {\n  vec3 color = v_color;\n  if (u_darken_top == 1.0) {\n    vec2 st = gl_FragCoord.xy/resolution.xy;\n    color.g -= pow(st.y + sin(-12.0) * st.x, u_shadow_power) * 0.4;\n  }\n  gl_FragColor = vec4(color, 1.0);\n}",
    };

    this.conf = {
      presetName: "",
      wireframe: false,
      density: [0.06, 0.16],
      zoom: 1,
      rotation: 0,
      playing: true,
    };

    if (document.querySelectorAll("canvas").length < 1) {
      console.log("DID NOT LOAD HERO STRIPE CANVAS");
    } else {
      this.minigl = new MiniGl(this.el, null, null, true);
      requestAnimationFrame(() => {
        if (this.el) {
          this.computedCanvasStyle = getComputedStyle(this.el);
          this.waitForCssVars();
        }
      });
    }
  }

  disconnect() {
    if (this.scrollObserver) {
      window.removeEventListener("scroll", this.handleScroll);
      window.removeEventListener("mousedown", this.handleMouseDown);
      window.removeEventListener("mouseup", this.handleMouseUp);
      window.removeEventListener("keydown", this.handleKeyDown);
      this.scrollObserver.disconnect();
    }
    window.removeEventListener("resize", this.resize);
  }

  initMaterial() {
    this.uniforms = {
      u_time: new this.minigl.Uniform({ value: 0 }),
      u_shadow_power: new this.minigl.Uniform({ value: 5 }),
      u_darken_top: new this.minigl.Uniform({ value: "" === this.el.dataset.jsDarkenTop ? 1 : 0 }),
      u_active_colors: new this.minigl.Uniform({ value: this.activeColors, type: "vec4" }),
      u_global: new this.minigl.Uniform({
        value: {
          noiseFreq: new this.minigl.Uniform({ value: [this.freqX, this.freqY], type: "vec2" }),
          noiseSpeed: new this.minigl.Uniform({ value: 1.5e-5 }),
        },
        type: "struct",
      }),
      u_vertDeform: new this.minigl.Uniform({
        value: {
          incline: new this.minigl.Uniform({ value: Math.sin(this.angle) / Math.cos(this.angle) }),
          offsetTop: new this.minigl.Uniform({ value: -0.5 }),
          offsetBottom: new this.minigl.Uniform({ value: -0.5 }),
noiseFreq: new this.minigl.Uniform({ value: [1, 1.5], type: "vec2" }),
          noiseAmp: new this.minigl.Uniform({ value: this.amp }),
          noiseSpeed: new this.minigl.Uniform({ value: 6 }),
          noiseFlow: new this.minigl.Uniform({ value: 2 }),
          noiseSeed: new this.minigl.Uniform({ value: this.seed }),
        },
        type: "struct",
        excludeFrom: "fragment",
      }),
      u_baseColor: new this.minigl.Uniform({ value: this.sectionColors[0], type: "vec3", excludeFrom: "fragment" }),
      u_waveLayers: new this.minigl.Uniform({ value: [], excludeFrom: "fragment", type: "array" }),
    };
    for (let e = 1; e < this.sectionColors.length; e += 1) {
      this.uniforms.u_waveLayers.value.push(new this.minigl.Uniform({
        value: {
color: new this.minigl.Uniform({ value: this.sectionColors[e], type: "vec3" }),
          noiseFreq: new this.minigl.Uniform({ value: [0.6, 1 + e / this.sectionColors.length], type: "vec2" }),
          noiseSpeed: new this.minigl.Uniform({ value: 5 + 0.15 * e }),
          noiseFlow: new this.minigl.Uniform({ value: 3 + 0.15 * e }),
          noiseSeed: new this.minigl.Uniform({ value: this.seed + 10 * e }),
          noiseFloor: new this.minigl.Uniform({ value: 0.1 }),
          noiseCeil: new this.minigl.Uniform({ value: 0.63 + 0.07 * e }),
        },
        type: "struct",
      }));
    }
    this.vertexShader = [this.shaderFiles.noise, this.shaderFiles.blend, this.shaderFiles.vertex].join("\n\n");
    return new this.minigl.Material(this.vertexShader, this.shaderFiles.fragment, this.uniforms);
  }

  initMesh() {
    this.material = this.initMaterial();
    this.geometry = new this.minigl.PlaneGeometry();
    this.mesh = new this.minigl.Mesh(this.geometry, this.material);
  }

  shouldSkipFrame(e: number) {
    return !!window.document.hidden || !this.conf.playing;
  }

  updateFrequency(e: number) {
    this.freqX += e;
    this.freqY += e;
  }

  toggleColor(index: number) {
    this.activeColors[index] = 0 === this.activeColors[index] ? 1 : 0;
  }

  showGradientLegend() {
    if (this.width > this.minWidth) {
      this.isGradientLegendVisible = true;
      document.body.classList.add("isGradientLegendVisible");
    }
  }

  hideGradientLegend() {
    this.isGradientLegendVisible = false;
    document.body.classList.remove("isGradientLegendVisible");
  }

  init() {
    this.initGradientColors();
    this.initMesh();
    this.resize();
    requestAnimationFrame(this.animate);
    window.addEventListener("resize", this.resize);
  }

  waitForCssVars() {
    if (this.computedCanvasStyle && -1 !== this.computedCanvasStyle.getPropertyValue("--gradient-color-1").indexOf("#")) {
      this.init();
      this.addIsLoadedClass();
    } else {
      if ((this.cssVarRetries += 1, this.cssVarRetries > this.maxCssVarRetries)) {
        this.sectionColors = [16711680, 16711680, 16711935, 65280, 255];
        return void this.init();
      }
      requestAnimationFrame(() => this.waitForCssVars());
    }
  }

  initGradientColors() {
    this.sectionColors = ["--gradient-color-1", "--gradient-color-2", "--gradient-color-3", "--gradient-color-4"].map((cssPropertyName: string) => {
      let hex = this.computedCanvasStyle.getPropertyValue(cssPropertyName).trim();
      if (4 === hex.length) {
        const hexTemp = hex.substr(1).split("").map((hexTemp: string) => hexTemp + hexTemp).join("");
        hex = `#${hexTemp}`;
      }
      return hex && `0x${hex.substr(1)}`;
    }).filter(Boolean).map(normalizeColor);
  }
}

export default function StripeGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const gradient = new Gradient();
    gradient.el = canvasRef.current;
    gradient.connect();
    return () => {
      gradient.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-js-darken-top=""
      className="stripe-gradient-canvas"
      aria-hidden="true"
    />
  );
}
