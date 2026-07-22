import AppKit
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let frames = root.appendingPathComponent("artifacts/video/frames")
try FileManager.default.createDirectory(at: frames, withIntermediateDirectories: true)

let navy = NSColor(calibratedRed: 13/255, green: 23/255, blue: 40/255, alpha: 1)
let gold = NSColor(calibratedRed: 200/255, green: 167/255, blue: 107/255, alpha: 1)
let cream = NSColor(calibratedRed: 247/255, green: 245/255, blue: 240/255, alpha: 1)
let teal = NSColor(calibratedRed: 40/255, green: 92/255, blue: 89/255, alpha: 1)

func font(_ name: String, _ size: CGFloat, _ weight: NSFont.Weight = .regular) -> NSFont {
    NSFont(name: name, size: size) ?? NSFont.systemFont(ofSize: size, weight: weight)
}

func text(_ value: String, rect: NSRect, size: CGFloat, color: NSColor, weight: NSFont.Weight = .regular, serif: Bool = false, alignment: NSTextAlignment = .left) {
    let paragraph = NSMutableParagraphStyle()
    paragraph.alignment = alignment
    paragraph.lineSpacing = size * 0.08
    let attributes: [NSAttributedString.Key: Any] = [
        .font: serif ? font("Cormorant Garamond", size, weight) : font("Inter", size, weight),
        .foregroundColor: color,
        .paragraphStyle: paragraph
    ]
    value.draw(with: rect, options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: attributes)
}

func fillImage(_ path: String, rect: NSRect) {
    guard let image = NSImage(contentsOfFile: root.appendingPathComponent(path).path) else { return }
    let source = NSRect(origin: .zero, size: image.size)
    let scale = max(rect.width / source.width, rect.height / source.height)
    let target = NSSize(width: source.width * scale, height: source.height * scale)
    let drawRect = NSRect(x: rect.midX - target.width/2, y: rect.midY - target.height/2, width: target.width, height: target.height)
    image.draw(in: drawRect, from: source, operation: .sourceOver, fraction: 1)
}

func save(_ image: NSImage, to url: URL) throws {
    guard let tiff = image.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff),
          let data = bitmap.representation(using: .png, properties: [:]) else { throw NSError(domain: "render", code: 1) }
    try data.write(to: url)
}

func videoFrame(name: String, photo: String?, eyebrow: String, title: String, subtitle: String, final: Bool = false) throws {
    let size = NSSize(width: 1920, height: 1080)
    let image = NSImage(size: size)
    image.lockFocus()
    navy.setFill(); NSBezierPath(rect: NSRect(origin: .zero, size: size)).fill()
    if let photo {
        fillImage(photo, rect: NSRect(origin: .zero, size: size))
        NSGradient(colors: [NSColor(calibratedWhite: 0, alpha: 0.82), NSColor(calibratedWhite: 0, alpha: 0.10)])?.draw(in: NSRect(origin: .zero, size: size), angle: 0)
    } else {
        NSGradient(colors: [navy, teal])?.draw(in: NSRect(origin: .zero, size: size), angle: 18)
    }
    gold.setFill(); NSBezierPath(roundedRect: NSRect(x: 150, y: 835, width: 78, height: 7), xRadius: 4, yRadius: 4).fill()
    text(eyebrow.uppercased(), rect: NSRect(x: 150, y: 780, width: 1000, height: 45), size: 24, color: gold, weight: .bold)
    text(title, rect: NSRect(x: 145, y: final ? 445 : 455, width: final ? 1300 : 1080, height: 320), size: final ? 108 : 92, color: .white, weight: .semibold, serif: true)
    text(subtitle, rect: NSRect(x: 152, y: 315, width: 920, height: 125), size: 30, color: NSColor(calibratedWhite: 1, alpha: 0.82), weight: .medium)
    text("CLUB PHOTOHUB", rect: NSRect(x: 150, y: 82, width: 500, height: 36), size: 20, color: .white, weight: .bold)
    text("Private moments. Shared with members.", rect: NSRect(x: 148, y: 45, width: 650, height: 30), size: 18, color: NSColor(calibratedWhite: 1, alpha: 0.58))
    image.unlockFocus()
    try save(image, to: frames.appendingPathComponent(name))
}

func productFeed() throws {
    let size = NSSize(width: 1200, height: 900)
    let image = NSImage(size: size)
    image.lockFocus()
    cream.setFill(); NSBezierPath(rect: NSRect(origin: .zero, size: size)).fill()
    NSColor.white.setFill(); NSBezierPath(rect: NSRect(x: 0, y: 790, width: 1200, height: 110)).fill()
    text("CLUB PHOTOHUB", rect: NSRect(x: 68, y: 838, width: 380, height: 35), size: 20, color: navy, weight: .bold)
    text("Your Club · Private gallery", rect: NSRect(x: 68, y: 806, width: 420, height: 30), size: 14, color: teal, weight: .medium)
    text("Member Gallery", rect: NSRect(x: 480, y: 825, width: 245, height: 32), size: 17, color: navy, weight: .bold, alignment: .center)
    text("Upload Photo", rect: NSRect(x: 750, y: 825, width: 210, height: 32), size: 17, color: NSColor(calibratedWhite: 0.45, alpha: 1), weight: .semibold, alignment: .center)
    let card = NSRect(x: 245, y: 35, width: 710, height: 720)
    NSColor.white.setFill(); NSBezierPath(roundedRect: card, xRadius: 24, yRadius: 24).fill()
    navy.setFill(); NSBezierPath(ovalIn: NSRect(x: 278, y: 675, width: 52, height: 52)).fill()
    text("AM", rect: NSRect(x: 278, y: 690, width: 52, height: 25), size: 13, color: .white, weight: .bold, alignment: .center)
    text("Alex Morgan", rect: NSRect(x: 348, y: 698, width: 230, height: 25), size: 17, color: navy, weight: .bold)
    text("Your Club · Today", rect: NSRect(x: 348, y: 678, width: 230, height: 22), size: 12, color: NSColor(calibratedWhite: 0.48, alpha: 1))
    gold.setStroke(); let pill = NSBezierPath(roundedRect: NSRect(x: 830, y: 684, width: 92, height: 30), xRadius: 15, yRadius: 15); pill.lineWidth = 1.5; pill.stroke()
    text("EVENTS", rect: NSRect(x: 830, y: 691, width: 92, height: 18), size: 10, color: NSColor(calibratedRed: 0.55, green: 0.40, blue: 0.15, alpha: 1), weight: .bold, alignment: .center)
    fillImage("public/demo/lakeside-social.jpg", rect: NSRect(x: 245, y: 165, width: 710, height: 490))
    text("♡  28       ⇩", rect: NSRect(x: 278, y: 118, width: 260, height: 34), size: 25, color: navy, weight: .semibold)
    text("Alex Morgan  Golden hour on the terrace with friends.", rect: NSRect(x: 278, y: 67, width: 620, height: 38), size: 14, color: navy, weight: .medium)
    image.unlockFocus()
    try save(image, to: root.appendingPathComponent("public/demo/product-feed.png"))
    try save(image, to: root.appendingPathComponent("artifacts/screenshots/your-club-demo.png"))
}

try FileManager.default.createDirectory(at: root.appendingPathComponent("artifacts/screenshots"), withIntermediateDirectories: true)
try productFeed()
try videoFrame(name: "01-intro.png", photo: nil, eyebrow: "Introducing", title: "Every community moment, in one private place.", subtitle: "Club PhotoHub is the photo-sharing home built for membership organizations.")
try videoFrame(name: "02-private.png", photo: "public/demo/lakeside-social.jpg", eyebrow: "Organization-owned access", title: "Your roster decides who belongs.", subtitle: "Members verify their number, name and registered email before creating an account.")
try videoFrame(name: "03-upload.png", photo: "public/demo/golf-morning.jpg", eyebrow: "Effortless sharing", title: "Upload, caption and organize from any device.", subtitle: "A familiar mobile-first feed—without the noise of public social media.")
try videoFrame(name: "04-community.png", photo: "public/demo/tennis-social.jpg", eyebrow: "Designed for belonging", title: "Every photo feels at home in your brand.", subtitle: "Categories, likes, downloads, touch zoom and practical club moderation.")
try videoFrame(name: "05-memories.png", photo: "public/demo/garden-dinner.jpg", eyebrow: "More than a folder", title: "Give your memories the experience they deserve.", subtitle: "Private clubs, communities, alumni groups and hospitality organizations.")
try videoFrame(name: "06-pricing.png", photo: nil, eyebrow: "Private pilot now open", title: "$60 CAD monthly. $600 annually.", subtitle: "Approved pilots receive 30 days free. clubphotohub.xtide.io", final: true)
