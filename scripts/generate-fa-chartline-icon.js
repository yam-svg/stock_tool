const fs = require('fs')
const path = require('path')
const { deflateSync } = require('zlib')
const pngToIcoModule = require('png-to-ico')
const pngToIco = pngToIcoModule.default || pngToIcoModule

function crc32(buffer) {
  let crc = 0xffffffff
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i]
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const lengthBuffer = Buffer.alloc(4)
  lengthBuffer.writeUInt32BE(data.length, 0)

  const crcBuffer = Buffer.alloc(4)
  const chunkData = Buffer.concat([typeBuffer, data])
  crcBuffer.writeUInt32BE(crc32(chunkData), 0)

  return Buffer.concat([lengthBuffer, chunkData, crcBuffer])
}

function createPng(size) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6

  const raw = Buffer.alloc((size * 4 + 1) * size)

  const setPixel = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const rowStart = y * (size * 4 + 1)
    const pixel = rowStart + 1 + x * 4
    raw[pixel] = r
    raw[pixel + 1] = g
    raw[pixel + 2] = b
    raw[pixel + 3] = a
  }

  const scale = size / 32

  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0
    for (let x = 0; x < size; x += 1) {
      setPixel(x, y, 37, 99, 235, 255)
    }
  }

  const points = [
    [6, 23],
    [11, 18],
    [16, 20],
    [22, 12],
    [27, 14],
  ]

  for (let i = 0; i < points.length - 1; i += 1) {
    const [sx1, sy1] = points[i]
    const [sx2, sy2] = points[i + 1]
    const x1 = Math.round(sx1 * scale)
    const y1 = Math.round(sy1 * scale)
    const x2 = Math.round(sx2 * scale)
    const y2 = Math.round(sy2 * scale)

    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))
    const thickness = Math.max(1, Math.round(scale * 1.25))

    for (let s = 0; s <= steps; s += 1) {
      const x = Math.round(x1 + ((x2 - x1) * s) / steps)
      const y = Math.round(y1 + ((y2 - y1) * s) / steps)
      for (let dx = -thickness; dx <= thickness; dx += 1) {
        for (let dy = -thickness; dy <= thickness; dy += 1) {
          setPixel(x + dx, y + dy, 255, 255, 255, 255)
        }
      }
    }
  }

  const axisXStart = Math.round(5 * scale)
  const axisXEnd = Math.round(27 * scale)
  const axisY = Math.round(25 * scale)
  const axisYStart = Math.round(7 * scale)

  for (let x = axisXStart; x <= axisXEnd; x += 1) setPixel(x, axisY, 255, 255, 255, 220)
  for (let y = axisYStart; y <= axisY; y += 1) setPixel(axisXStart, y, 255, 255, 255, 220)

  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

async function main() {
  const outputDir = path.join(__dirname, '..', 'build', 'icons')
  fs.mkdirSync(outputDir, { recursive: true })

  const pngPath = path.join(outputDir, 'fa-chart-line.png')
  const icoPath = path.join(outputDir, 'fa-chart-line.ico')

  const png256 = createPng(256)
  fs.writeFileSync(pngPath, png256)

  const icoBuffer = await pngToIco([createPng(16), createPng(24), createPng(32), createPng(48), createPng(64), createPng(128), createPng(256)])
  fs.writeFileSync(icoPath, icoBuffer)

  console.log('Icon generated:')
  console.log(' -', pngPath)
  console.log(' -', icoPath)
}

main().catch((error) => {
  console.error('Failed to generate icon:', error)
  process.exit(1)
})


