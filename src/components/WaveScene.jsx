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

      pos[i*3+1] = baseY + w1 + w2 + w3 + mripple
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
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WaveCrestLine — draws continuous glowing crest lines parallel to camera
// ─────────────────────────────────────────────────────────────────────────────
function WaveCrestLine({ zRow, color, opacity, thickness = 0.06, xSpan = 24 }) {
  const ref = useRef()
  const segments = 120

  const { xs, baseZ } = useMemo(() => {
    const arr = new Float32Array(segments)
    for (let i = 0; i < segments; i++) {
      arr[i] = (i / (segments - 1) - 0.5) * xSpan
    }
    return { xs: arr, baseZ: zRow }
  }, [zRow, segments, xSpan])

  const initialPositions = useMemo(() => {
    const pos = new Float32Array(segments * 3)
    for (let i = 0; i < segments; i++) {
      pos[i*3]   = xs[i]
      pos[i*3+1] = 0
      pos[i*3+2] = baseZ
    }
    return pos
  }, [xs, baseZ, segments])

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3))
    return g
  }, [initialPositions])

  useFrame(({ clock }) => {
    const t   = clock.getElapsedTime()
    const pos = ref.current.geometry.attributes.position.array
    for (let i = 0; i < segments; i++) {
      const x = xs[i]
      const z = baseZ

      const w1 = Math.sin(z * 0.55 + t * 0.9) * 1.4
      const w2 = Math.sin(x * 0.30 + z * 0.20 + t * 0.65) * 0.8
      const w3 = Math.sin(x * 0.6 + z * 0.8 + t * 1.4) * 0.3

      const mx = mouse.x * 6
      const mz = mouse.y * -4
      const dist = Math.sqrt((x - mx) ** 2 + (z - mz) ** 2)
      const mripple = Math.exp(-dist * dist * 0.04) * Math.sin(dist * 0.8 - t * 4) * 1.2

      pos[i*3+1] = w1 + w2 + w3 + mripple + 0.06
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <line ref={ref} geometry={geo}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        linewidth={thickness}
        depthWrite={false}
      />
    </line>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AmbientParticles — slow floating motes
// ─────────────────────────────────────────────────────────────────────────────
function AmbientParticles({ isDark = true }) {
  const ref = useRef()
  const count = 140

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
      <pointsMaterial
        color={isDark ? '#00D4FF' : '#0284C7'}
        size={0.08}
        transparent
        opacity={isDark ? 0.4 : 0.35}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene
// ─────────────────────────────────────────────────────────────────────────────
export default function WaveScene({ isDark = true }) {
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
      <color attach="background" args={[isDark ? '#020810' : '#F1F5F9']} />

      {/* ── PARTICLE GRID — the core 3D wave surface ── */}
      <group rotation={[0.52, 0, 0]} position={[0, -1.8, -2]}>

        {/* Deep background grid */}
        <ParticleGrid
          cols={132} rows={72} spacingX={0.30} spacingZ={0.30}
          baseY={0}
          color={isDark ? '#003A5C' : '#CBD5E1'}
          size={0.055}
          opacity={isDark ? 0.55 : 0.65}
        />

        {/* Mid grid */}
        <ParticleGrid
          cols={120} rows={64} spacingX={0.30} spacingZ={0.30}
          baseY={0.02}
          color={isDark ? '#005F88' : '#94A3B8'}
          size={0.068}
          opacity={isDark ? 0.70 : 0.75}
        />

        {/* Foreground grid */}
        <ParticleGrid
          cols={108} rows={56} spacingX={0.30} spacingZ={0.30}
          baseY={0.04}
          color={isDark ? '#00AADD' : '#0284C7'}
          size={0.082}
          opacity={isDark ? 0.85 : 0.85}
        />

        {/* Brightest top-layer dots */}
        <ParticleGrid
          cols={98} rows={48} spacingX={0.31} spacingZ={0.31}
          baseY={0.06}
          color={isDark ? '#40CCFF' : '#0369A1'}
          size={0.10}
          opacity={0.9}
        />

        {/* Crest highlight lines */}
        {crests.map((z) => (
          <WaveCrestLine
            key={z}
            zRow={z}
            color={isDark ? '#00D4FF' : '#0284C7'}
            opacity={isDark ? 0.75 : 0.8}
            thickness={0.09}
            xSpan={crestXSpan}
          />
        ))}
        {crests.map((z) => (
          <WaveCrestLine
            key={`w${z}`}
            zRow={z + 0.04}
            color={isDark ? '#AAEEFF' : '#1D4ED8'}
            opacity={isDark ? 0.35 : 0.4}
            thickness={0.04}
            xSpan={crestXSpan}
          />
        ))}
      </group>

      {/* Ambient floating bokeh above */}
      <AmbientParticles isDark={isDark} />

      {/* Lighting */}
      <ambientLight intensity={isDark ? 0.04 : 0.8} color={isDark ? '#00AAFF' : '#FFFFFF'} />
      <pointLight position={[0,  6, 2]} intensity={isDark ? 2.5 : 2.0} color={isDark ? '#00D4FF' : '#0284C7'} />
      <pointLight position={[-8, 4, 0]} intensity={isDark ? 1.0 : 1.2} color={isDark ? '#0055FF' : '#38BDF8'} />
      <pointLight position={[8,  3, -4]} intensity={isDark ? 0.8 : 0.9} color={isDark ? '#00AAFF' : '#0EA5E9'} />
    </>
  )
}
