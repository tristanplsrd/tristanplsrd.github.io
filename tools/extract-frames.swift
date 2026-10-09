// Turns the visor video into the image sequence the About section scrubs on scroll.
// Usage: swift tools/extract-frames.swift _archive/source/visor.mp4 assets/visor [endFrame=104] [step=2]
// - frames 0...endFrame (every `step` frames) → f00.jpg, f01.jpg … at 630×840
// - start.jpg / end.jpg at 1080×1440 for the two resting states
// - blacks are pulled down so the studio backdrop melts into the page's black
import AVFoundation
import AppKit

let args = CommandLine.arguments
let src = URL(fileURLWithPath: args[1])
let out = args[2]
let endFrame = args.count > 3 ? Int(args[3])! : 104
let step = args.count > 4 ? Int(args[4])! : 2
let black = 14.0 // backdrop level (0–255) mapped to pure black

let asset = AVURLAsset(url: src)
let fps = asset.tracks(withMediaType: .video).first!.nominalFrameRate
let gen = AVAssetImageGenerator(asset: asset)
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
gen.appliesPreferredTrackTransform = true
try? FileManager.default.createDirectory(atPath: out, withIntermediateDirectories: true)

func write(frame: Int, size: CGSize, quality: Double, name: String) {
  let t = CMTime(value: CMTimeValue(frame) * 600 / CMTimeValue(fps), timescale: 600)
  guard let img = try? gen.copyCGImage(at: t, actualTime: nil) else { print("skip", frame); return }
  let W = Int(size.width), H = Int(size.height)
  var buf = [UInt8](repeating: 0, count: W * H * 4)
  let ctx = CGContext(data: &buf, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W * 4,
                      space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
  ctx.interpolationQuality = .high
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: W, height: H))
  let k = 255.0 / (255.0 - black)
  var lut = [UInt8](repeating: 0, count: 256)
  for v in 0..<256 { lut[v] = UInt8(max(0, min(255, (Double(v) - black) * k)).rounded()) }
  for i in stride(from: 0, to: buf.count, by: 4) { buf[i] = lut[Int(buf[i])]; buf[i+1] = lut[Int(buf[i+1])]; buf[i+2] = lut[Int(buf[i+2])] }
  let cg = ctx.makeImage()!
  let rep = NSBitmapImageRep(cgImage: cg)
  let data = rep.representation(using: .jpeg, properties: [.compressionFactor: quality])!
  try! data.write(to: URL(fileURLWithPath: "\(out)/\(name)"))
}

var n = 0
var frames = Array(stride(from: 0, through: endFrame, by: step))
if frames.last != endFrame { frames.append(endFrame) }
for f in frames {
  write(frame: f, size: CGSize(width: 630, height: 840), quality: 0.6, name: String(format: "f%02d.jpg", n))
  n += 1
}
write(frame: 0, size: CGSize(width: 1080, height: 1440), quality: 0.8, name: "start.jpg")
write(frame: endFrame, size: CGSize(width: 1080, height: 1440), quality: 0.8, name: "end.jpg")
print("frames:", n)
