import * as THREE from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';

self.onmessage = (e: MessageEvent) => {
  const { volume, depth, rows, cols, targets } = e.data;
  
  // Downsample target resolution
  const res = 64;
  
  try {
    const results: any[] = [];
    let progress = 0;
    
    // Create one effect instance to reuse
    // MarchingCubes(resolution, material, enableUvs, enableColors, maxPolyCount)
    const effect = new MarchingCubes(res, new THREE.MeshBasicMaterial(), false, false, 200000);
    
    for (let t = 0; t < targets.length; t++) {
      const target = targets[t];
      
      // Update progress
      progress = Math.round((t / targets.length) * 100);
      self.postMessage({ type: 'progress', progress, message: `Extracting ${target.id}...` });
      
      // Reset field
      effect.reset();
      
      // We will sample the volume into the 64x64x64 field
      // The field array in MarchingCubes is flat: index = z + res * y + res * res * x
      // Let's populate it based on our HU ranges
      const minHU = target.minHU;
      const maxHU = target.maxHU;
      
      let voxelCount = 0;
      let sumX = 0, sumY = 0, sumZ = 0;
      
      for (let k = 0; k < res; k++) {
        for (let j = 0; j < res; j++) {
          for (let i = 0; i < res; i++) {
            // Map [i,j,k] in [0, res-1] to [x,y,z] in [0, cols-1, rows-1, depth-1]
            const x = Math.floor((i / (res - 1)) * (cols - 1));
            const y = Math.floor((j / (res - 1)) * (rows - 1));
            const z = Math.floor((k / (res - 1)) * (depth - 1));
            
            const idx = z * rows * cols + y * cols + x;
            const hu = volume[idx];
            
            // MarchingCubes expects values to cross an isolation threshold (usually 0).
            // We'll set 1 for inside the range, -1 for outside.
            let val = -1;
            if (hu >= minHU && hu <= maxHU) {
              val = 1;
              voxelCount++;
              sumX += i; sumY += j; sumZ += k;
            }
            
            // In THREE.MarchingCubes, field index is: k + res * j + res * res * i
            const fieldIdx = k + j * res + i * res * res;
            effect.field[fieldIdx] = val;
          }
        }
      }
      
      // Generate geometry
      // isolation is typically 0 for THREE.MarchingCubes
      effect.isolation = 0;
      effect.update();
      
      // Extract geometry buffers
      const positionAttr = effect.geometry.getAttribute('position');
      const normalAttr = effect.geometry.getAttribute('normal');
      
      // If no geometry was generated, skip
      if (!positionAttr || positionAttr.count === 0) {
        results.push({
          id: target.id,
          positions: new Float32Array(0),
          normals: new Float32Array(0),
          centroid: { x: 0, y: 0, z: 0 },
          volume: 0
        });
        continue;
      }
      
      const positions = new Float32Array(positionAttr.array);
      const normals = new Float32Array(normalAttr.array);
      
      let centroid = { x: 0, y: 0, z: 0 };
      if (voxelCount > 0) {
        // Centroid in [-1, 1] normalized space (since THREE.MarchingCubes renders in [-1, 1] cube)
        // Actually THREE.MarchingCubes renders in a scale of 1.0 ([-1, 1] bounds).
        // Let's compute centroid precisely from generated geometry
        let cx = 0, cy = 0, cz = 0;
        for (let p = 0; p < positions.length; p += 3) {
          cx += positions[p];
          cy += positions[p + 1];
          cz += positions[p + 2];
        }
        const pts = positions.length / 3;
        centroid = { x: cx / pts, y: cy / pts, z: cz / pts };
      }
      
      // Voxel volume estimation
      // Original volume = depth * rows * cols voxels
      
      results.push({
        id: target.id,
        positions,
        normals,
        centroid,
        voxelCount // Send back voxelCount for accurate volume calc in main thread
      });
    }
    
    // Transfer back
    (self as any).postMessage({ type: 'done', results }, results.map(r => r.positions.buffer).concat(results.map(r => r.normals.buffer)));
    
  } catch (error: any) {
    self.postMessage({ type: 'error', message: error.message });
  }
};
