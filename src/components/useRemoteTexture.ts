import { useEffect, useMemo, useState } from 'react'
import { RepeatWrapping, SRGBColorSpace, Texture, TextureLoader } from 'three'
import { useThree } from '@react-three/fiber'

type ColorSpaceMode = 'srgb' | 'linear'

interface TextureOptions {
  repeat?: [number, number]
  colorSpace?: ColorSpaceMode
}

const getRepeatKey = (repeat?: [number, number]) => {
  if (!repeat) {
    return 'none'
  }
  return `${repeat[0]}:${repeat[1]}`
}

export function useRemoteTexture(url?: string, options?: TextureOptions) {
  const { gl } = useThree()
  const [texture, setTexture] = useState<Texture | null>(null)
  const repeat = options?.repeat
  const colorSpace = options?.colorSpace
  const repeatKey = useMemo(() => getRepeatKey(repeat), [repeat])

  useEffect(() => {
    if (!url) {
      return
    }

    let cancelled = false
    const loader = new TextureLoader()
    loader.setCrossOrigin('anonymous')

    loader.load(
      url,
      (loaded) => {
        if (cancelled) {
          loaded.dispose()
          return
        }

        loaded.wrapS = RepeatWrapping
        loaded.wrapT = RepeatWrapping

        if (repeat) {
          loaded.repeat.set(repeat[0], repeat[1])
        }

        if (colorSpace === 'srgb') {
          loaded.colorSpace = SRGBColorSpace
        }

        loaded.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
        setTexture(loaded)
      },
      undefined,
      () => {
        if (!cancelled) {
          setTexture(null)
        }
      },
    )

    return () => {
      cancelled = true
    }
  }, [url, repeatKey, repeat, colorSpace, gl])

  return url ? texture : null
}
