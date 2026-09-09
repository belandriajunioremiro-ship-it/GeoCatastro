import { writeFileSync } from 'fs'
import { deflateSync } from 'zlib'

function createPNG(size) {
  const cx = size / 2
  const cy = size / 2
  const r = Math.round(size * 0.22)
  const pixels = []

  for (let y = 0; y < size; y++) {
    pixels.push(0) // filter byte
    for (let x = 0; x < size; x++) {
      // Rounded rectangle background
      let inside = false
      const m = size * 0.08
      const rect = { l: m, t: m, w: size - m * 2, h: size - m * 2 }

      if (x >= rect.l + r && x <= rect.l + rect.w - r &&
          y >= rect.t && y <= rect.t + rect.h) inside = true
      if (x >= rect.l && x <= rect.l + rect.w &&
          y >= rect.t + r && y <= rect.t + rect.h - r) inside = true
      // corners
      const corners = [
        [rect.l + r, rect.t + r], [rect.l + rect.w - r, rect.t + r],
        [rect.l + r, rect.t + rect.h - r], [rect.l + rect.w - r, rect.t + rect.h - r]
      ]
      for (const [ccx, ccy] of corners) {
        if (Math.hypot(x - ccx, y - ccy) <= r) {
          inside = true; break
        }
      }

      if (inside) {
        // Draw house icon
        const hx = (x - m) / (size - m * 2)
        const hy = (y - m) / (size - m * 2)

        // Roof
        const roofBot = 0.42
        const roofTop = 0.18
        const roofL = 0.15, roofR = 0.85, roofM = 0.5
        const roofProgress = (roofBot - hy) / (roofBot - roofTop)
        const roofLeftEdge = roofM - roofProgress * (roofM - roofL)
        const roofRightEdge = roofM + roofProgress * (roofR - roofM)
        const inRoof = hy >= roofTop && hy <= roofBot && hx >= roofLeftEdge && hx <= roofRightEdge

        // Walls
        const inWalls = hy >= roofBot && hy <= 0.9 && hx >= 0.22 && hx <= 0.78

        // Door
        const inDoor = hy >= 0.62 && hy <= 0.9 && hx >= 0.42 && hx <= 0.58

        // Window circle
        const winCx = 0.32, winCy = 0.52, winR2 = 0.04
        const inWindow = Math.hypot(hx - winCx, hy - winCy) <= winR2

        if (inRoof || inWalls || inDoor || inWindow) {
          pixels.push(255, 255, 255, 255) // white icon
        } else {
          pixels.push(17, 17, 17, 255) // #111 background
        }
      } else {
        pixels.push(0, 0, 0, 0) // transparent outside
      }
    }
  }

  const raw = Buffer.from(pixels)
  const compressed = deflateSync(raw)

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  function makeChunk(type, data) {
    const typeB = Buffer.from(type, 'ascii')
    const lenB = Buffer.alloc(4)
    lenB.writeUInt32BE(data.length)
    const body = Buffer.concat([typeB, data])
    const crcB = Buffer.alloc(4)
    crcB.writeUInt32BE(crc32(body) >>> 0)
    return Buffer.concat([lenB, body, crcB])
  }

  function crc32(buf) {
    let c = 0xffffffff
    const table = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let v = n
      for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1
      table[n] = v
    }
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ])
}

writeFileSync('public/icon-192.png', createPNG(192))
writeFileSync('public/icon-512.png', createPNG(512))
console.log('PNG icons generated: icon-192.png, icon-512.png')
