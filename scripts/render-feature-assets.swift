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

func rounded(_ rect: NSRect, _ radius: CGFloat, _ color: NSColor, stroke: NSColor? = nil, width: CGFloat = 1) {
    let path = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
    color.setFill(); path.fill()
    if let stroke { stroke.setStroke(); path.lineWidth = width; path.stroke() }
}

func line(_ from: NSPoint, _ to: NSPoint, color: NSColor, width: CGFloat = 1) {
    let path = NSBezierPath(); path.move(to: from); path.line(to: to); path.lineWidth = width; color.setStroke(); path.stroke()
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
    let size = NSSize(width: 1600, height: 1100)
    let image = NSImage(size: size)
    image.lockFocus()
    
    // Background canvas
    NSColor(calibratedRed: 247/255, green: 245/255, blue: 240/255, alpha: 1).setFill()
    NSBezierPath(rect: NSRect(origin: .zero, size: size)).fill()
    
    // Top App Bar Header (Navy)
    let headerRect = NSRect(x: 0, y: 990, width: 1600, height: 110)
    navy.setFill(); NSBezierPath(rect: headerRect).fill()
    
    // Brand & Club Info
    gold.setFill(); NSBezierPath(ovalIn: NSRect(x: 50, y: 1025, width: 40, height: 40)).fill()
    text("★", rect: NSRect(x: 50, y: 1032, width: 40, height: 30), size: 20, color: navy, weight: .bold, alignment: .center)
    text("HERITAGE OAKS COUNTRY CLUB", rect: NSRect(x: 102, y: 1045, width: 480, height: 28), size: 18, color: .white, weight: .bold)
    text("PRIVATE MEMBER GALLERY · 248 ACTIVE MEMBERS", rect: NSRect(x: 102, y: 1025, width: 450, height: 20), size: 10, color: gold, weight: .bold)
    
    // Navigation Tabs
    let tabs = [("Member Feed", true), ("Events & Galas", false), ("Roster Directory", false), ("Upload Photo", false)]
    for (index, (tab, active)) in tabs.enumerated() {
        let x = 580 + CGFloat(index) * 170
        text(tab, rect: NSRect(x: x, y: 1033, width: 160, height: 25), size: 14, color: active ? .white : NSColor(calibratedWhite: 0.72, alpha: 1), weight: active ? .bold : .medium, alignment: .center)
        if active {
            gold.setFill()
            NSBezierPath(roundedRect: NSRect(x: x + 20, y: 1018, width: 120, height: 3), xRadius: 1.5, yRadius: 1.5).fill()
        }
    }
    
    // Header User Profile Pill
    rounded(NSRect(x: 1380, y: 1025, width: 170, height: 40), 20, NSColor(calibratedWhite: 1, alpha: 0.12), stroke: NSColor(calibratedWhite: 1, alpha: 0.25))
    text("Alex Morgan ▾", rect: NSRect(x: 1395, y: 1035, width: 140, height: 20), size: 13, color: .white, weight: .semibold, alignment: .center)
    
    // Sub-header Filter & Category Bar
    let filterBar = NSRect(x: 0, y: 920, width: 1600, height: 70)
    NSColor.white.setFill(); NSBezierPath(rect: filterBar).fill()
    line(NSPoint(x: 0, y: 920), NSPoint(x: 1600, y: 920), color: NSColor(calibratedWhite: 0.88, alpha: 1))
    
    let categories = [("All Moments", true, "124"), ("Summer Regatta", false, "42"), ("Championship Golf", false, "28"), ("Dining & Socials", false, "35"), ("Racquets & Tennis", false, "19")]
    var currentX: CGFloat = 50
    for (cat, active, count) in categories {
        let textWidth: CGFloat = CGFloat(cat.count * 8 + 48)
        let pillRect = NSRect(x: currentX, y: 935, width: textWidth, height: 38)
        if active {
            navy.setFill(); NSBezierPath(roundedRect: pillRect, xRadius: 19, yRadius: 19).fill()
            text("\(cat) (\(count))", rect: NSRect(x: currentX, y: 945, width: textWidth, height: 20), size: 12, color: .white, weight: .bold, alignment: .center)
        } else {
            NSColor(calibratedWhite: 0.95, alpha: 1).setFill()
            let path = NSBezierPath(roundedRect: pillRect, xRadius: 19, yRadius: 19)
            path.fill()
            NSColor(calibratedWhite: 0.84, alpha: 1).setStroke()
            path.lineWidth = 1; path.stroke()
            text("\(cat) (\(count))", rect: NSRect(x: currentX, y: 945, width: textWidth, height: 20), size: 12, color: navy, weight: .medium, alignment: .center)
        }
        currentX += textWidth + 12
    }
    
    // Search Box (Right side of filter bar)
    rounded(NSRect(x: 1280, y: 935, width: 270, height: 38), 19, NSColor(calibratedWhite: 0.96, alpha: 1), stroke: NSColor(calibratedWhite: 0.86, alpha: 1))
    text("🔍 Search members or events...", rect: NSRect(x: 1300, y: 945, width: 230, height: 20), size: 12, color: NSColor(calibratedWhite: 0.5, alpha: 1))

    // MAIN FEED CONTENT GRID (Left Column Main Card, Right Column Secondary Cards)
    // --- MAIN CARD (Left) ---
    let mainCard = NSRect(x: 50, y: 40, width: 920, height: 850)
    NSColor.white.setFill()
    let mainCardPath = NSBezierPath(roundedRect: mainCard, xRadius: 20, yRadius: 20)
    mainCardPath.fill()
    NSColor(calibratedWhite: 0.88, alpha: 1).setStroke()
    mainCardPath.lineWidth = 1; mainCardPath.stroke()
    
    // Main Card Post Header
    navy.setFill(); NSBezierPath(ovalIn: NSRect(x: 80, y: 805, width: 54, height: 54)).fill()
    text("AM", rect: NSRect(x: 80, y: 820, width: 54, height: 26), size: 15, color: .white, weight: .bold, alignment: .center)
    text("Alex Morgan", rect: NSRect(x: 150, y: 832, width: 350, height: 26), size: 18, color: navy, weight: .bold)
    text("Heritage Oaks Country Club · 15 minutes ago", rect: NSRect(x: 150, y: 810, width: 350, height: 20), size: 12, color: NSColor(calibratedWhite: 0.45, alpha: 1))
    
    // Category Tag Pill
    gold.setStroke()
    let regattaTag = NSBezierPath(roundedRect: NSRect(x: 810, y: 815, width: 130, height: 34), xRadius: 17, yRadius: 17)
    regattaTag.lineWidth = 1.5; regattaTag.stroke()
    text("SUMMER REGATTA", rect: NSRect(x: 810, y: 824, width: 130, height: 18), size: 10, color: NSColor(calibratedRed: 0.55, green: 0.40, blue: 0.15, alpha: 1), weight: .bold, alignment: .center)
    
    // Main Photo
    fillImage("public/demo/lakeside-social.jpg", rect: NSRect(x: 50, y: 220, width: 920, height: 565))
    
    // Main Card Actions & Caption
    text("♡  48 Likes       ⇩  18 Downloads       💬  7 Comments", rect: NSRect(x: 80, y: 170, width: 600, height: 30), size: 16, color: navy, weight: .bold)
    text("Golden hour cocktail reception on the marina terrace. Spectacular turnout for our annual summer regatta!", rect: NSRect(x: 80, y: 100, width: 860, height: 55), size: 16, color: navy, weight: .medium)
    
    // --- SECONDARY CARD 1 (Top Right) ---
    let card2 = NSRect(x: 1000, y: 470, width: 550, height: 420)
    NSColor.white.setFill()
    let card2Path = NSBezierPath(roundedRect: card2, xRadius: 20, yRadius: 20)
    card2Path.fill()
    NSColor(calibratedWhite: 0.88, alpha: 1).setStroke()
    card2Path.lineWidth = 1; card2Path.stroke()
    
    // Card 2 Header
    teal.setFill(); NSBezierPath(ovalIn: NSRect(x: 1025, y: 825, width: 42, height: 42)).fill()
    text("JL", rect: NSRect(x: 1025, y: 836, width: 42, height: 22), size: 13, color: .white, weight: .bold, alignment: .center)
    text("Jordan Lee", rect: NSRect(x: 1080, y: 844, width: 260, height: 22), size: 15, color: navy, weight: .bold)
    text("Golf Captain · 1 hour ago", rect: NSRect(x: 1080, y: 828, width: 260, height: 18), size: 11, color: NSColor(calibratedWhite: 0.45, alpha: 1))
    
    // Card 2 Photo
    fillImage("public/demo/golf-morning.jpg", rect: NSRect(x: 1000, y: 580, width: 550, height: 235))
    
    // Card 2 Footer
    text("♡  34 Likes       ⇩  9 Downloads", rect: NSRect(x: 1025, y: 535, width: 400, height: 24), size: 14, color: navy, weight: .bold)
    text("Championship weekend begins! Perfect morning on the greens.", rect: NSRect(x: 1025, y: 495, width: 500, height: 35), size: 13, color: navy, weight: .medium)

    // --- SECONDARY CARD 2 (Bottom Right) ---
    let card3 = NSRect(x: 1000, y: 40, width: 550, height: 410)
    NSColor.white.setFill()
    let card3Path = NSBezierPath(roundedRect: card3, xRadius: 20, yRadius: 20)
    card3Path.fill()
    NSColor(calibratedWhite: 0.88, alpha: 1).setStroke()
    card3Path.lineWidth = 1; card3Path.stroke()
    
    // Card 3 Header
    navy.setFill(); NSBezierPath(ovalIn: NSRect(x: 1025, y: 390, width: 42, height: 42)).fill()
    text("SC", rect: NSRect(x: 1025, y: 401, width: 42, height: 22), size: 13, color: .white, weight: .bold, alignment: .center)
    text("Sophia Chen", rect: NSRect(x: 1080, y: 409, width: 260, height: 22), size: 15, color: navy, weight: .bold)
    text("Social Chair · Yesterday", rect: NSRect(x: 1080, y: 393, width: 260, height: 18), size: 11, color: NSColor(calibratedWhite: 0.45, alpha: 1))
    
    // Card 3 Photo
    fillImage("public/demo/tennis-social.jpg", rect: NSRect(x: 1000, y: 150, width: 550, height: 225))
    
    // Card 3 Footer
    text("♡  29 Likes       ⇩  6 Downloads", rect: NSRect(x: 1025, y: 105, width: 400, height: 24), size: 14, color: navy, weight: .bold)
    text("Mixed doubles tournament finals under the pavilion lights.", rect: NSRect(x: 1025, y: 65, width: 500, height: 35), size: 13, color: navy, weight: .medium)

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
try videoFrame(name: "06-pricing.png", photo: nil, eyebrow: "Private pilot now open", title: "$60 monthly. $600 annually.", subtitle: "Approved pilots receive 30 days free. clubphotohub.xtide.io", final: true)
