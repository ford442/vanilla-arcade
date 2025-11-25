// WebGPU shader code for the Asteroids game
export const shaderCode = /* wgsl */`
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
}

struct Uniforms {
  resolution: vec2<f32>,
  time: f32,
  padding: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn vertexMain(@location(0) position: vec2<f32>, @location(1) color: vec4<f32>) -> VertexOutput {
  var output: VertexOutput;
  
  // Convert from pixel coordinates to normalized device coordinates
  let ndcX = (position.x / uniforms.resolution.x) * 2.0 - 1.0;
  let ndcY = 1.0 - (position.y / uniforms.resolution.y) * 2.0;
  
  output.position = vec4<f32>(ndcX, ndcY, 0.0, 1.0);
  output.color = color;
  
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  return input.color;
}
`;

export interface Vertex {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

export class WebGPURenderer {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private pipeline: GPURenderPipeline | null = null;
  private uniformBuffer: GPUBuffer | null = null;
  private uniformBindGroup: GPUBindGroup | null = null;
  private canvas: HTMLCanvasElement;
  private format: GPUTextureFormat = 'bgra8unorm';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async initialize(): Promise<boolean> {
    if (!navigator.gpu) {
      console.error('WebGPU is not supported in this browser');
      return false;
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      console.error('Failed to get GPU adapter');
      return false;
    }

    this.device = await adapter.requestDevice();
    this.context = this.canvas.getContext('webgpu');
    
    if (!this.context) {
      console.error('Failed to get WebGPU context');
      return false;
    }

    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'premultiplied',
    });

    // Create shader module
    const shaderModule = this.device.createShaderModule({
      code: shaderCode,
    });

    // Create uniform buffer
    this.uniformBuffer = this.device.createBuffer({
      size: 16, // 2 floats for resolution + 1 float for time + 1 padding
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create bind group layout
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
      }],
    });

    // Create bind group
    this.uniformBindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [{
        binding: 0,
        resource: { buffer: this.uniformBuffer },
      }],
    });

    // Create pipeline layout
    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    // Create render pipeline
    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [{
          arrayStride: 24, // 2 floats for position + 4 floats for color = 6 * 4 bytes
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x2' },
            { shaderLocation: 1, offset: 8, format: 'float32x4' },
          ],
        }],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{ format: this.format }],
      },
      primitive: {
        topology: 'line-list',
      },
    });

    return true;
  }

  render(vertices: Vertex[], time: number): void {
    if (!this.device || !this.context || !this.pipeline || !this.uniformBuffer || !this.uniformBindGroup) {
      return;
    }

    // Update uniforms
    const uniformData = new Float32Array([
      this.canvas.width,
      this.canvas.height,
      time,
      0, // padding
    ]);
    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

    // Create vertex buffer
    if (vertices.length === 0) {
      return;
    }

    const vertexData = new Float32Array(vertices.length * 6);
    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      vertexData[i * 6 + 0] = v.x;
      vertexData[i * 6 + 1] = v.y;
      vertexData[i * 6 + 2] = v.r;
      vertexData[i * 6 + 3] = v.g;
      vertexData[i * 6 + 4] = v.b;
      vertexData[i * 6 + 5] = v.a;
    }

    const vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(vertexBuffer, 0, vertexData);

    // Create command encoder
    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.0, g: 0.0, b: 0.02, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.uniformBindGroup);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.draw(vertices.length);
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
    vertexBuffer.destroy();
  }

  destroy(): void {
    this.uniformBuffer?.destroy();
    this.device?.destroy();
  }
}
