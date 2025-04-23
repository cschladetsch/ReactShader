import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const MathShaders = () => {
  const canvasRef = useRef(null);
  const [currentShader, setCurrentShader] = useState(0);
  const [timeSpeed, setTimeSpeed] = useState(1.0);
  const [parameter1, setParameter1] = useState(0.5);
  const [parameter2, setParameter2] = useState(0.5);
  
  const shaderOptions = [
    { name: "Plasma", description: "Classic plasma effect using sine waves" },
    { name: "Fractal Brownian Motion", description: "FBM noise pattern" },
    { name: "Mandelbrot Set", description: "Classic fractal visualization" },
    { name: "Voronoi", description: "Cellular pattern formation" },
    { name: "Wave Interference", description: "Wave interference patterns" },
    { name: "Hypnotic Spiral", description: "Animated spiral patterns" }
  ];
  
  useEffect(() => {
    // Initialize Three.js Scene
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true 
    });
    renderer.setSize(window.innerWidth * 0.85, window.innerHeight * 0.6);
    
    // Define shader materials
    const shaderMaterials = [
      // 1. Plasma shader
      new THREE.ShaderMaterial({
        uniforms: {
          u_time: { value: 0.0 },
          u_resolution: { value: new THREE.Vector2() },
          u_intensity: { value: parameter1 },
          u_speed: { value: parameter2 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float u_time;
          uniform vec2 u_resolution;
          uniform float u_intensity;
          uniform float u_speed;
          varying vec2 vUv;
          
          void main() {
            vec2 p = -1.0 + 2.0 * vUv;
            float time = u_time * u_speed;
            
            float v1 = sin((p.x * 10.0) + time);
            float v2 = sin((p.y * 10.0) + time);
            float v3 = sin((p.x * 10.0) + (p.y * 10.0) + time);
            float v4 = sin(sqrt(p.x * p.x + p.y * p.y) * 10.0 + time);
            
            float intensity = u_intensity * 2.0;
            float v = (v1 + v2 + v3 + v4) * intensity;
            
            vec3 color = vec3(
              0.5 + 0.5 * sin(v + 0.0),
              0.5 + 0.5 * sin(v + 2.0),
              0.5 + 0.5 * sin(v + 4.0)
            );
            
            gl_FragColor = vec4(color, 1.0);
          }
        `
      }),
      
      // 2. Fractal Brownian Motion (FBM) noise
      new THREE.ShaderMaterial({
        uniforms: {
          u_time: { value: 0.0 },
          u_resolution: { value: new THREE.Vector2() },
          u_octaves: { value: parameter1 * 10.0 },
          u_scale: { value: parameter2 * 10.0 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float u_time;
          uniform vec2 u_resolution;
          uniform float u_octaves;
          uniform float u_scale;
          varying vec2 vUv;
          
          // Random function
          float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
          }
          
          // 2D noise
          float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            
            // Four corners of a tile
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            
            // Smooth interpolation
            vec2 u = f * f * (3.0 - 2.0 * f);
            
            return mix(a, b, u.x) + 
                  (c - a) * u.y * (1.0 - u.x) + 
                  (d - b) * u.x * u.y;
          }
          
          // Fractal Brownian Motion
          float fbm(vec2 st) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            int octaves = int(u_octaves);
            
            for(int i = 0; i < 10; i++) {
              if(i >= octaves) break;
              value += amplitude * noise(st * frequency);
              st *= 2.0;
              amplitude *= 0.5;
              frequency *= 2.0;
            }
            
            return value;
          }
          
          void main() {
            vec2 st = vUv * u_scale;
            st.x *= u_resolution.x / u_resolution.y;
            
            vec2 q = vec2(0.0);
            q.x = fbm(st + vec2(0.0, 0.0) + 0.1 * u_time);
            q.y = fbm(st + vec2(5.2, 1.3) + 0.2 * u_time);
            
            vec2 r = vec2(0.0);
            r.x = fbm(st + 4.0 * q + vec2(1.7, 9.2) + 0.15 * u_time);
            r.y = fbm(st + 4.0 * q + vec2(8.3, 2.8) + 0.126 * u_time);
            
            float f = fbm(st + r);
            
            vec3 color = mix(
              vec3(0.101961, 0.619608, 0.666667),
              vec3(0.666667, 0.666667, 0.498039),
              clamp((f * f) * 4.0, 0.0, 1.0)
            );
            
            color = mix(
              color,
              vec3(0, 0, 0.164706),
              clamp(length(q), 0.0, 1.0)
            );
            
            color = mix(
              color,
              vec3(0.666667, 1, 1),
              clamp(length(r.x), 0.0, 1.0)
            );
            
            gl_FragColor = vec4(color, 1.0);
          }
        `
      }),
      
      // 3. Mandelbrot Set
      new THREE.ShaderMaterial({
        uniforms: {
          u_time: { value: 0.0 },
          u_resolution: { value: new THREE.Vector2() },
          u_zoom: { value: parameter1 * 4.0 + 0.1 },
          u_iterations: { value: parameter2 * 100.0 + 10.0 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float u_time;
          uniform vec2 u_resolution;
          uniform float u_zoom;
          uniform float u_iterations;
          varying vec2 vUv;
          
          void main() {
            vec2 c = (vUv * 4.0 - vec2(2.0)) / u_zoom;
            c.x -= 0.5;
            
            vec2 z = vec2(0.0);
            float iterations = 0.0;
            int maxIterations = int(u_iterations);
            
            for(int i = 0; i < 300; i++) {
              if(i >= maxIterations) break;
              z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
              
              if(dot(z, z) > 4.0) break;
              iterations++;
            }
            
            if(iterations < float(maxIterations)) {
              float normalized = iterations / float(maxIterations);
              vec3 color = 0.5 + 0.5 * cos(3.0 + normalized * 15.0 + vec3(0.0, 0.6, 1.0));
              gl_FragColor = vec4(color, 1.0);
            } else {
              gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            }
          }
        `
      }),
      
      // 4. Voronoi Cells
      new THREE.ShaderMaterial({
        uniforms: {
          u_time: { value: 0.0 },
          u_resolution: { value: new THREE.Vector2() },
          u_cells: { value: parameter1 * 20.0 + 2.0 },
          u_smoothness: { value: parameter2 * 0.2 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float u_time;
          uniform vec2 u_resolution;
          uniform float u_cells;
          uniform float u_smoothness;
          varying vec2 vUv;
          
          // Random function
          vec2 random2(vec2 st) {
            st = vec2(dot(st, vec2(127.1, 311.7)),
                     dot(st, vec2(269.5, 183.3)));
            return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
          }
          
          void main() {
            // Scale
            vec2 st = vUv * u_cells;
            
            // Tile the space
            vec2 i_st = floor(st);
            vec2 f_st = fract(st);
            
            float m_dist = 1.0;  // minimum distance
            vec2 m_point;        // minimum point
            
            // Check 9 neighboring cells
            for (int j = -1; j <= 1; j++) {
              for (int i = -1; i <= 1; i++) {
                vec2 neighbor = vec2(float(i), float(j));
                vec2 point = random2(i_st + neighbor);
                
                // Animate points
                point = 0.5 + 0.5 * sin(u_time + 6.2831 * point);
                
                vec2 diff = neighbor + point - f_st;
                float dist = length(diff);
                
                if (dist < m_dist) {
                  m_dist = dist;
                  m_point = point;
                }
              }
            }
            
            // Coloring
            vec3 color = vec3(0.0);
            
            // Border distance
            float border = u_smoothness;
            color = mix(vec3(m_point, 0.5), vec3(1.0), step(border, m_dist));
            
            // Add distance field for lines
            color = mix(color, vec3(1.0), 1.0 - smoothstep(0.0, border, m_dist));
            
            // Color based on position
            color = mix(color, vec3(m_point, 0.5 + 0.5 * sin(u_time)), 1.0 - step(border, m_dist));
            
            gl_FragColor = vec4(color, 1.0);
          }
        `
      }),
      
      // 5. Wave Interference
      new THREE.ShaderMaterial({
        uniforms: {
          u_time: { value: 0.0 },
          u_resolution: { value: new THREE.Vector2() },
          u_waves: { value: parameter1 * 10.0 + 1.0 },
          u_intensity: { value: parameter2 * 3.0 + 0.5 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float u_time;
          uniform vec2 u_resolution;
          uniform float u_waves;
          uniform float u_intensity;
          varying vec2 vUv;
          
          void main() {
            vec2 p = -1.0 + 2.0 * vUv;
            p.x *= u_resolution.x / u_resolution.y;
            
            float time = u_time * 0.5;
            
            // Initialize wave sum
            float sum = 0.0;
            
            // Create multiple wave sources
            int numWaves = int(u_waves);
            for(int i = 0; i < 10; i++) {
              if(i >= numWaves) break;
              
              // Generate wave source positions
              float angle = float(i) / float(numWaves) * 6.28;
              vec2 waveSource = vec2(
                0.7 * cos(angle + time * (float(i) * 0.1 + 0.5)),
                0.7 * sin(angle + time * (float(i) * 0.1 + 0.5))
              );
              
              // Compute distance to source
              float dist = length(p - waveSource);
              
              // Add the wave from this source
              sum += sin(dist * 20.0 - time * 4.0) / (1.0 + dist * 5.0);
            }
            
            // Normalize and apply intensity
            sum = 0.5 + 0.5 * sum * u_intensity;
            
            // Generate color based on the wave sum
            vec3 color = vec3(
              sum,
              sum * 0.5 + 0.3,
              sum * 0.5 + 0.5
            );
            
            gl_FragColor = vec4(color, 1.0);
          }
        `
      }),
      
      // 6. Hypnotic Spiral
      new THREE.ShaderMaterial({
        uniforms: {
          u_time: { value: 0.0 },
          u_resolution: { value: new THREE.Vector2() },
          u_spiral_density: { value: parameter1 * 20.0 + 2.0 },
          u_rotation_speed: { value: parameter2 * 2.0 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float u_time;
          uniform vec2 u_resolution;
          uniform float u_spiral_density;
          uniform float u_rotation_speed;
          varying vec2 vUv;
          
          void main() {
            // Convert uv to polar coordinates
            vec2 center = vUv - 0.5;
            float radius = length(center) * 2.0;
            float angle = atan(center.y, center.x);
            
            // Create spiral pattern
            float t = u_time * u_rotation_speed;
            float spiral = sin(angle * u_spiral_density + radius * 10.0 - t * 2.0);
            
            // Add radial rings
            float rings = sin(radius * 20.0 - t * 3.0);
            
            // Combine patterns
            float pattern = spiral * rings;
            
            // Add color
            vec3 color = vec3(0.5) + 0.5 * sin(vec3(0.0, 0.333, 0.667) * 6.28318 + pattern * 3.0);
            
            // Add vignette
            float vignette = 1.0 - radius * radius;
            vignette = smoothstep(0.0, 0.7, vignette);
            color *= vignette;
            
            gl_FragColor = vec4(color, 1.0);
          }
        `
      })
    ];
    
    // Create a simple plane to render the shader
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, shaderMaterials[currentShader]);
    scene.add(mesh);
    
    // Set initial resolution
    shaderMaterials.forEach(material => {
      if (material.uniforms.u_resolution) {
        material.uniforms.u_resolution.value.x = window.innerWidth * 0.85;
        material.uniforms.u_resolution.value.y = window.innerHeight * 0.6;
      }
    });
    
    // Update the uniform values when parameters change
    const updateUniforms = () => {
      if (currentShader === 0) {
        shaderMaterials[currentShader].uniforms.u_intensity.value = parameter1;
        shaderMaterials[currentShader].uniforms.u_speed.value = parameter2;
      } else if (currentShader === 1) {
        shaderMaterials[currentShader].uniforms.u_octaves.value = parameter1 * 10.0;
        shaderMaterials[currentShader].uniforms.u_scale.value = parameter2 * 10.0;
      } else if (currentShader === 2) {
        shaderMaterials[currentShader].uniforms.u_zoom.value = parameter1 * 4.0 + 0.1;
        shaderMaterials[currentShader].uniforms.u_iterations.value = parameter2 * 100.0 + 10.0;
      } else if (currentShader === 3) {
        shaderMaterials[currentShader].uniforms.u_cells.value = parameter1 * 20.0 + 2.0;
        shaderMaterials[currentShader].uniforms.u_smoothness.value = parameter2 * 0.2;
      } else if (currentShader === 4) {
        shaderMaterials[currentShader].uniforms.u_waves.value = parameter1 * 10.0 + 1.0;
        shaderMaterials[currentShader].uniforms.u_intensity.value = parameter2 * 3.0 + 0.5;
      } else if (currentShader === 5) {
        shaderMaterials[currentShader].uniforms.u_spiral_density.value = parameter1 * 20.0 + 2.0;
        shaderMaterials[currentShader].uniforms.u_rotation_speed.value = parameter2 * 2.0;
      }
    };
    
    updateUniforms();
    
    // Animation loop
    let lastTime = 0;
    const animate = (time) => {
      const delta = (time - lastTime) / 1000; // Convert to seconds
      lastTime = time;
      
      mesh.material = shaderMaterials[currentShader];
      shaderMaterials[currentShader].uniforms.u_time.value += delta * timeSpeed;
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    
    animate(0);
    
    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth * 0.85;
      const height = window.innerHeight * 0.6;
      
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      
      // Update resolution uniforms
      shaderMaterials.forEach(material => {
        if (material.uniforms.u_resolution) {
          material.uniforms.u_resolution.value.x = width;
          material.uniforms.u_resolution.value.y = height;
        }
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      shaderMaterials.forEach(material => material.dispose());
      renderer.dispose();
    };
  }, [currentShader, parameter1, parameter2, timeSpeed]);
  
  // Update parameters UI
  const getParameterLabels = () => {
    switch (currentShader) {
      case 0: return ['Intensity', 'Speed'];
      case 1: return ['Octaves', 'Scale'];
      case 2: return ['Zoom', 'Iterations'];
      case 3: return ['Cell Count', 'Smoothness'];
      case 4: return ['Wave Count', 'Intensity'];
      case 5: return ['Spiral Density', 'Rotation Speed'];
      default: return ['Parameter 1', 'Parameter 2'];
    }
  };
  
  const paramLabels = getParameterLabels();
  
  return (
    <div className="flex flex-col items-center w-full">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg mb-4">
        <div className="text-xl font-bold text-gray-100 mb-2">
          {shaderOptions[currentShader].name}
        </div>
        <p className="text-gray-300 mb-4">{shaderOptions[currentShader].description}</p>
        <canvas ref={canvasRef} className="w-full h-full rounded-md"></canvas>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-2xl">
        <div className="mb-4">
          <label className="block text-gray-200 mb-2">Shader Type</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {shaderOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => setCurrentShader(index)}
                className={`py-2 px-3 rounded ${
                  currentShader === index 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-200 mb-2">
            {paramLabels[0]}: {parameter1.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={parameter1}
            onChange={(e) => setParameter1(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-200 mb-2">
            {paramLabels[1]}: {parameter2.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={parameter2}
            onChange={(e) => setParameter2(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div>
          <label className="block text-gray-200 mb-2">
            Time Speed: {timeSpeed.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={timeSpeed}
            onChange={(e) => setTimeSpeed(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default MathShaders;
