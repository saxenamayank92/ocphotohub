import AppKit
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let inputDir = root.appendingPathComponent("marketing/app-store")
let outputDir = root.appendingPathComponent("marketing/app-store/ipad-capture")
try FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)

let targetWidth: CGFloat = 2048
let targetHeight: CGFloat = 2732
let canvasSize = NSSize(width: targetWidth, height: targetHeight)

let bgTop = NSColor(calibratedRed: 247/255, green: 243/255, blue: 233/255, alpha: 1)
let bgBottom = NSColor(calibratedRed: 235/255, green: 228/255, blue: 213/255, alpha: 1)

let files = [
    ("ClubPhotoHub-detail-1284x2778.png", "ClubPhotoHub-iPad-13-1-detail.png"),
    ("ClubPhotoHub-gallery-1284x2778.png", "ClubPhotoHub-iPad-13-2-gallery.png"),
    ("ClubPhotoHub-upload-1284x2778.png", "ClubPhotoHub-iPad-13-3-upload.png"),
    ("ClubPhotoHub-profile-1284x2778.png", "ClubPhotoHub-iPad-13-4-profile.png"),
    ("ClubPhotoHub-feed-1284x2778.png", "ClubPhotoHub-iPad-13-5-experience.png")
]

func save(_ image: NSImage, destUrl: URL) throws {
    guard let tiff = image.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff),
          let data = bitmap.representation(using: .png, properties: [:]) else {
        throw NSError(domain: "render", code: 1)
    }
    try data.write(to: destUrl)
}

for (srcName, outName) in files {
    let srcUrl = inputDir.appendingPathComponent(srcName)
    guard let srcImage = NSImage(contentsOfFile: srcUrl.path) else {
        print("Error: Could not load \(srcName)")
        continue
    }

    let canvasImage = NSImage(size: canvasSize)
    canvasImage.lockFocus()

    // Render smooth matching champagne background gradient
    NSGradient(colors: [bgTop, bgBottom])?.draw(in: NSRect(origin: .zero, size: canvasSize), angle: 270)

    // Calculate scale to fit within canvas bounds without clipping
    let srcSize = srcImage.size
    let scale = min(targetWidth / srcSize.width, targetHeight / srcSize.height) * 0.96
    let drawWidth = srcSize.width * scale
    let drawHeight = srcSize.height * scale
    let drawX = (targetWidth - drawWidth) / 2
    let drawY = (targetHeight - drawHeight) / 2

    let targetRect = NSRect(x: drawX, y: drawY, width: drawWidth, height: drawHeight)
    let srcRect = NSRect(origin: .zero, size: srcSize)

    srcImage.draw(in: targetRect, from: srcRect, operation: .sourceOver, fraction: 1.0)

    canvasImage.unlockFocus()

    let destUrl = outputDir.appendingPathComponent(outName)
    try save(canvasImage, destUrl: destUrl)
    print("Fitted \(srcName) -> \(outName) (\(Int(targetWidth))x\(Int(targetHeight)))")
}

print("All 5 iPad marketing screenshots resized and fitted successfully.")
