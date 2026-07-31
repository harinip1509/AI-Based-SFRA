import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mouse } from './waveMouse'

// ─────────────────────────────────────────────────────────────────────────────
// ParticleGrid  —  the image-reference effect:
//   a perspective-tilted grid of dots that ripple as ocean waves
// ─────────────────────────────────────────────────────────────────────────────
function ParticleGrid({ cols, rows, spacingX, spacingZ, baseY, color, size, opacity }) {
  const ref    = useRef()
  const count  = cols * rows

  // Base X/Z positions (never change)
  const { baseX, baseZ, positions } = useMemo(() => {
    const bx  = new Float32Array(count)
    const bz  = new Float32Array(count)
    const pos = new Float32Array(count * 3)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx  = r * cols + c
        bx[idx]    = (c - cols / 2) * spacingX
        bz[idx]    = (r - rows / 2) * spacingZ
        pos[idx*3]   = bx[idx]
        pos[idx*3+1] = baseY
        pos[idx*3+2] = bz[idx]
      }
    }
    return { baseX: bx, baseZ: bz, positions: pos }
  }, [cols, rows, spacingX, spacingZ, baseY])

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [positions])

  useFrame(({ clock }) => {
    const t  = clock.getElapsedTime()
    // Smooth mouse
    mouse.x += (mouse.targetX - mouse.x) * 0.04
    mouse.y += (mouse.targetY - mouse.y) * 0.04

    const pos = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      const x = baseX[i]
      const z = baseZ[i]

      // Primary ocean swell — moves in Z direction (into screen)
      const w1 = Math.sin(z * 0.55 + t * 0.9) * 1.4
      // Cross-wave
      const w2 = Math.sin(x * 0.30 + z * 0.20 + t * 0.65) * 0.8
      // Fine ripple
      const w3 = Math.sin(x * 0.6 + z * 0.8 + t * 1.4) * 0.3
      // Mouse-driven ripple — gaussian bump following cursor
      const mx = mouse.x * 6
      const mz = mouse.y * -4
      const dist = Math.sqrt((x - mx) ** 2 + (z - mz) ** 2)
      const mripple = Math.exp(-dist * dist * 0.04) * Math.sin(dist * 0.8 - t * 4) * 1.2

      pos[i*3]   = x
      pos[i*3+1] = baseY + w1 + w2 + w3 + mripple
      pos[i*3+2] = z
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WaveLines — horizontal bright crest lines along the grid,
//             rendered as ribbon meshes (real thickness)
// ─────────────────────────────────────────────────────────────────────────────
function WaveCrestLine({ zRow, color, opacity, thickness, xSpan = 14 }) {
  const meshRef = useRef()
  const SEG     = 300
  const VERTS   = (SEG + 1) * 2

  const { positions, indices } = useMemo(() => {
    const pos = new Float32Array(VERTS * 3)
    const idx = []
    for (let i = 0; i <= SEG; i++) {
      if (i < SEG) {
        const a = i*2, b = i*2+1, c = (i+1)*2, d = (i+1)*2+1
        idx.push(a,b,c, b,d,c)
      }
    }
    return { positions: pos, indices: new Uint32Array(idx) }
  }, [])

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setIndex(new THREE.BufferAttribute(indices, 1))
    return g
  }, [positions, indices])

  useFrame(({ clock }) => {
    const t   = clock.getElapsedTime()
    const pos = meshRef.current.geometry.attributes.position.array
    const half = thickness * 0.5

    for (let i = 0; i <= SEG; i++) {
      const x    = (i / SEG) * (xSpan * 2) - xSpan
      const z    = zRow
      const w1   = Math.sin(z * 0.55 + t * 0.9) * 1.4
      const w2   = Math.sin(x * 0.30 + z * 0.20 + t * 0.65) * 0.8
      const w3   = Math.sin(x * 0.6  + z * 0.8  + t * 1.4)  * 0.3
      const mx   = mouse.x * 6
      const mz   = mouse.y * -4
      const dist = Math.sqrt((x - mx) ** 2 + (z - mz) ** 2)
      const mr   = Math.exp(-dist * dist * 0.04) * Math.sin(dist * 0.8 - t * 4) * 1.2
      const cy   = w1 + w2 + w3 + mr

      pos[(i*2)  *3]   = x;  pos[(i*2)  *3+1] = cy + half;  pos[(i*2)  *3+2] = z
      pos[(i*2+1)*3]   = x;  pos[(i*2+1)*3+1] = cy - half;  pos[(i*2+1)*3+2] = z
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <mesh ref={meshRef} geometry={geo} renderOrder={2}>
      <meshBasicMaterial
        color={color} transparent opacity={opacity}
        blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating ambient particles (bokeh / depth haze)
// ─────────────────────────────────────────────────────────────────────────────
function AmbientParticles() {
  const ref   = useRef()
  const count = 180
  const { positions, speeds, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count)
    const ph  = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 28
      pos[i*3+1] = Math.random() * 8 - 1
      pos[i*3+2] = (Math.random() - 0.5) * 16
      spd[i]     = Math.random() * 0.3 + 0.08
      ph[i]      = Math.random() * Math.PI * 2
    }
    return { positions: pos, speeds: spd, phases: ph }
  }, [])

  useFrame(({ clock }) => {
    const t   = clock.getElapsedTime()
    const pos = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      pos[i*3+1] += speeds[i] * 0.005
      if (pos[i*3+1] > 8) pos[i*3+1] = -2
      pos[i*3]   += Math.sin(t * speeds[i] * 0.4 + phases[i]) * 0.004
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#00D4FF" size={0.08} transparent opacity={0.4}
        blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene
// ─────────────────────────────────────────────────────────────────────────────
export default function WaveScene() {
  useFrame(({ camera }) => {
    // Camera tilts slightly to follow mouse — subtle parallax
    camera.position.x += (mouse.x * 1.2  - camera.position.x) * 0.028
    camera.position.y += (mouse.y * 0.5  - camera.position.y) * 0.028
    camera.lookAt(0, 0, 0)
  })

  // Crest line Z positions — match the particle grid rows
  const crests = [-6, -3, 0, 3, 6, 9]
  const crestXSpan = 26

  return (
    <>
      <color attach="background" args={['#020810']} />

      {/* ── PARTICLE GRID — the core 3D wave surface ──
            Tilt the whole scene group so it looks like a perspective ocean
      ── */}
      <group rotation={[0.52, 0, 0]} position={[0, -1.8, -2]}>

        {/* Deep background grid — large, sparse, dark blue */}
        <ParticleGrid
          cols={132} rows={72} spacingX={0.30} spacingZ={0.30}
          baseY={0} color="#003A5C" size={0.055} opacity={0.55}
        />

        {/* Mid grid — medium density, brighter teal */}
        <ParticleGrid
          cols={120} rows={64} spacingX={0.30} spacingZ={0.30}
          baseY={0.02} color="#005F88" size={0.068} opacity={0.70}
        />

        {/* Foreground grid — dense, bright cyan */}
        <ParticleGrid
          cols={108} rows={56} spacingX={0.30} spacingZ={0.30}
          baseY={0.04} color="#00AADD" size={0.082} opacity={0.85}
        />

        {/* Brightest top-layer dots */}
        <ParticleGrid
          cols={98} rows={48} spacingX={0.31} spacingZ={0.31}
          baseY={0.06} color="#40CCFF" size={0.10} opacity={0.9}
        />

        {/* Crest highlight lines — the bright wave ridges in the image */}
        {crests.map((z) => (
          <WaveCrestLine key={z} zRow={z} color="#00D4FF" opacity={0.75} thickness={0.09} xSpan={crestXSpan} />
        ))}
        {crests.map((z) => (
          <WaveCrestLine key={`w${z}`} zRow={z + 0.04} color="#AAEEFF" opacity={0.35} thickness={0.04} xSpan={crestXSpan} />
        ))}
      </group>

      {/* Ambient floating bokeh above */}
      <AmbientParticles />

      {/* Lighting */}
      <ambientLight intensity={0.04} color="#00AAFF" />
      <pointLight position={[0,  6, 2]} intensity={2.5} color="#00D4FF" />
      <pointLight position={[-8, 4, 0]} intensity={1.0} color="#0055FF" />
      <pointLight position={[8,  3, -4]} intensity={0.8} color="#00AAFF" />
    </>
  )
}
