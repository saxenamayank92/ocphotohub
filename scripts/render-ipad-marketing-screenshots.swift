import AppKit
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let outputDir = root.appendingPathComponent("marketing/app-store/ipad-capture")
try FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)

// Palette matching user screenshot
let bgTop = NSColor(calibratedRed: 247/255, green: 243/255, blue: 233/255, alpha: 1)
let bgBottom = NSColor(calibratedRed: 235/255, green: 228/255, blue: 213/255, alpha: 1)
let navy = NSColor(calibratedRed: 13/255, green: 23/255, blue: 40/255, alpha: 1)
let goldEyebrow = NSColor(calibratedRed: 40/255, green: 90/255, blue: 85/255, alpha: 1)
let textSubtitle = NSColor(calibratedRed: 80/255, green: 95/255, blue: 105/255, alpha: 1)
let cardBg = NSColor.white
let borderGray = NSColor(calibratedRed: 226/255, green: 232/255, blue: 240/255, alpha: 1)
let pillBg = NSColor(calibratedRed: 254/255, green: 251/255, blue: 242/255, alpha: 1)
let pillBorder = NSColor(calibratedRed: 218/255, green: 195/255, blue: 145/255, alpha: 1)
let teal = NSColor(calibratedRed: 31/255, green: 79/255, blue: 74/255, alpha: 1)

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

func fillImage(_ path: String, rect: NSRect, radius: CGFloat = 0) {
    guard let image = NSImage(contentsOfFile: root.appendingPathComponent(path).path) else { return }
    NSGraphicsContext.current?.saveGraphicsState()
    if radius > 0 {
        NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius).addClip()
    }
    let source = NSRect(origin: .zero, size: image.size)
    let scale = max(rect.width / source.width, rect.height / source.height)
    let target = NSSize(width: source.width * scale, height: source.height * scale)
    let drawRect = NSRect(x: rect.midX - target.width/2, y: rect.midY - target.height/2, width: target.width, height: target.height)
    image.draw(in: drawRect, from: source, operation: .sourceOver, fraction: 1)
    NSGraphicsContext.current?.restoreGraphicsState()
}

func floatingPill(_ label: String, at point: NSPoint, alignment: NSTextAlignment = .left) {
    let paddingH: CGFloat = 20
    let h: CGFloat = 46
    let fontObj = font("Inter", 16, .bold)
    let width = (label as NSString).size(withAttributes: [.font: fontObj]).width + paddingH * 2 + 10
    
    var originX = point.x
    if alignment == .right { originX = point.x - width }
    else if alignment == .center { originX = point.x - width / 2 }
    
    let rect = NSRect(x: originX, y: point.y, width: width, height: h)
    
    // Shadow
    NSGraphicsContext.current?.saveGraphicsState()
    let shadow = NSShadow()
    shadow.shadowColor = NSColor(calibratedWhite: 0, alpha: 0.18)
    shadow.shadowBlurRadius = 12
    shadow.shadowOffset = NSSize(width: 0, height: -4)
    shadow.set()
    rounded(rect, 23, pillBg, stroke: pillBorder, width: 1.5)
    NSGraphicsContext.current?.restoreGraphicsState()
    
    text(label, rect: NSRect(x: rect.minX + paddingH, y: rect.minY + 12, width: rect.width - paddingH*2, height: 24), size: 16, color: navy, weight: .bold, alignment: .center)
}

func save(_ image: NSImage, name: String) throws {
    guard let tiff = image.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff),
          let data = bitmap.representation(using: .png, properties: [:]) else { throw NSError(domain: "render", code: 1) }
    let dest = outputDir.appendingPathComponent(name)
    try data.write(to: dest)
    print("Saved \(name) (\(Int(image.size.width))x\(Int(image.size.height)))")
}

// Common Header (Logo + Brand)
func renderTopHeader(width: CGFloat, topY: CGFloat) {
    fillImage("splash_master.png", rect: NSRect(x: width/2 - 140, y: topY - 26, width: 44, height: 44), radius: 12)
    text("Club PhotoHub", rect: NSRect(x: width/2 - 82, y: topY - 18, width: 220, height: 32), size: 24, color: navy, weight: .bold, serif: true)
}

// Common Bottom Footer
func renderBottomFooter(width: CGFloat, bottomY: CGFloat) {
    fillImage("splash_master.png", rect: NSRect(x: width/2 - 125, y: bottomY - 10, width: 36, height: 36), radius: 10)
    text("Club PhotoHub", rect: NSRect(x: width/2 - 76, y: bottomY - 4, width: 200, height: 28), size: 20, color: navy, weight: .bold, serif: true)
}

// Common Device Screen Render Container
func renderIPadMarketingCard(
    name: String,
    eyebrow: String,
    titleLine1: String,
    titleLine2: String,
    subtitle: String,
    leftPill: (String, NSPoint)?,
    rightPill: (String, NSPoint)?,
    renderScreen: (NSRect) -> Void
) throws {
    let width: CGFloat = 2048
    let height: CGFloat = 2732
    let size = NSSize(width: width, height: height)
    let image = NSImage(size: size)
    image.lockFocus()

    // Background Gradient
    NSGradient(colors: [bgTop, bgBottom])?.draw(in: NSRect(origin: .zero, size: size), angle: 270)

    // Top Brand Header
    renderTopHeader(width: width, topY: height - 100)

    // Marketing Typography
    let contentTop = height - 220
    text(eyebrow.uppercased(), rect: NSRect(x: 100, y: contentTop, width: width - 200, height: 36), size: 22, color: goldEyebrow, weight: .bold, alignment: .center)
    
    text(titleLine1, rect: NSRect(x: 120, y: contentTop - 110, width: width - 240, height: 85), size: 72, color: navy, weight: .bold, serif: true, alignment: .center)
    text(titleLine2, rect: NSRect(x: 120, y: contentTop - 195, width: width - 240, height: 85), size: 72, color: navy, weight: .bold, serif: true, alignment: .center)
    
    text(subtitle, rect: NSRect(x: 200, y: contentTop - 295, width: width - 400, height: 90), size: 28, color: textSubtitle, weight: .medium, alignment: .center)

    // iPad Tablet Device Frame (Center Below Copy)
    let deviceWidth: CGFloat = 1680
    let deviceHeight: CGFloat = 1880
    let deviceX = (width - deviceWidth) / 2
    let deviceY: CGFloat = 140
    let deviceRect = NSRect(x: deviceX, y: deviceY, width: deviceWidth, height: deviceHeight)

    // Outer Bezel Shadow
    NSGraphicsContext.current?.saveGraphicsState()
    let shadow = NSShadow()
    shadow.shadowColor = NSColor(calibratedWhite: 0, alpha: 0.35)
    shadow.shadowBlurRadius = 36
    shadow.shadowOffset = NSSize(width: 0, height: -18)
    shadow.set()
    rounded(deviceRect, 44, navy)
    NSGraphicsContext.current?.restoreGraphicsState()

    // Inner Screen Canvas
    let screenRect = NSRect(x: deviceRect.minX + 28, y: deviceRect.minY + 28, width: deviceRect.width - 56, height: deviceRect.height - 56)
    rounded(screenRect, 28, cardBg)

    // Render App Screen UI
    NSGraphicsContext.current?.saveGraphicsState()
    NSBezierPath(roundedRect: screenRect, xRadius: 28, yRadius: 28).addClip()
    renderScreen(screenRect)
    NSGraphicsContext.current?.restoreGraphicsState()

    // Render Floating Callout Badges
    if let (lpLabel, lpPoint) = leftPill {
        floatingPill(lpLabel, at: NSPoint(x: deviceRect.minX + lpPoint.x, y: deviceRect.minY + lpPoint.y), alignment: .left)
    }
    if let (rpLabel, rpPoint) = rightPill {
        floatingPill(rpLabel, at: NSPoint(x: deviceRect.minX + rpPoint.x, y: deviceRect.minY + rpPoint.y), alignment: .right)
    }

    // Bottom Footer
    renderBottomFooter(width: width, bottomY: 60)

    image.unlockFocus()
    try save(image, name: name)
}

// App Header Bar inside Device UI
func renderAppHeaderUI(in screen: NSRect, activeTab: String = "Gallery") {
    let barH: CGFloat = 100
    let barRect = NSRect(x: screen.minX, y: screen.maxY - barH, width: screen.width, height: barH)
    rounded(barRect, 0, cardBg, stroke: borderGray)

    fillImage("splash_master.png", rect: NSRect(x: barRect.minX + 32, y: barRect.midY - 24, width: 48, height: 48), radius: 12)
    text("Club PhotoHub", rect: NSRect(x: barRect.minX + 94, y: barRect.midY - 4, width: 300, height: 32), size: 24, color: navy, weight: .bold, serif: true)
    text("Your Club · Private Gallery", rect: NSRect(x: barRect.minX + 94, y: barRect.midY - 24, width: 300, height: 20), size: 14, color: teal, weight: .semibold)

    let tabs = ["Gallery", "Upload", "Profile", "Admin"]
    let tWidth: CGFloat = 140
    let startX = barRect.maxX - CGFloat(tabs.count) * tWidth - 30
    for (i, t) in tabs.enumerated() {
        let tx = startX + CGFloat(i) * tWidth
        let isSel = t == activeTab
        text(t, rect: NSRect(x: tx, y: barRect.midY - 12, width: tWidth, height: 28), size: 18, color: isSel ? navy : textSubtitle, weight: isSel ? .bold : .semibold, alignment: .center)
    }
}

// -------------------------------------------------------------
// SCREENSHOT 1: LIGHTBOX / DETAIL FOCUS
// -------------------------------------------------------------
try renderIPadMarketingCard(
    name: "ClubPhotoHub-iPad-13-1-detail.png",
    eyebrow: "KEEP THE MEMORIES CLOSE",
    titleLine1: "Celebrate what",
    titleLine2: "members share.",
    subtitle: "A focused, easy-to-enjoy photo experience designed for every generation in your club.",
    leftPill: ("💛  Love a photo", NSPoint(x: -40, y: 780)),
    rightPill: ("📥  Download it easily", NSPoint(x: 1720, y: 520))
) { screen in
    renderAppHeaderUI(in: screen, activeTab: "Gallery")

    // Full photo card
    let card = NSRect(x: screen.minX + 60, y: screen.minY + 60, width: screen.width - 120, height: screen.height - 180)
    rounded(card, 28, cardBg, stroke: borderGray)

    // Image Left (58%)
    let imgW = card.width * 0.58
    fillImage("public/demo/lakeside-social.jpg", rect: NSRect(x: card.minX, y: card.minY, width: imgW, height: card.height), radius: 28)

    // Details Right
    let dX = card.minX + imgW + 40
    let dW = card.width - imgW - 80

    text("EVENTS", rect: NSRect(x: dX, y: card.maxY - 70, width: 140, height: 28), size: 14, color: goldEyebrow, weight: .bold)
    text("Golden hour on the terrace with friends.", rect: NSRect(x: dX, y: card.maxY - 190, width: dW, height: 110), size: 36, color: navy, weight: .bold, serif: true)

    text("Alex Morgan", rect: NSRect(x: dX, y: card.maxY - 250, width: dW, height: 32), size: 22, color: navy, weight: .bold)
    text("Oakville Photography Club · Member #1001", rect: NSRect(x: dX, y: card.maxY - 285, width: dW, height: 24), size: 16, color: textSubtitle)

    // Heart Badge
    rounded(NSRect(x: dX, y: card.maxY - 390, width: dW, height: 70), 20, pillBg, stroke: pillBorder)
    text("❤️ Liked by 28 members", rect: NSRect(x: dX + 24, y: card.maxY - 366, width: dW - 48, height: 28), size: 18, color: navy, weight: .bold)

    text("This is what summer at the club feels like. Sunset over the lake, great conversations, and wonderful company.", rect: NSRect(x: dX, y: card.maxY - 550, width: dW, height: 130), size: 18, color: navy, weight: .regular)

    // Action Button
    rounded(NSRect(x: dX, y: card.minY + 60, width: dW, height: 68), 20, navy)
    text("Download Original Photo ⇩", rect: NSRect(x: dX, y: card.minY + 80, width: dW, height: 30), size: 20, color: .white, weight: .bold, alignment: .center)
}

// -------------------------------------------------------------
// SCREENSHOT 2: FEED & CATEGORIES
// -------------------------------------------------------------
try renderIPadMarketingCard(
    name: "ClubPhotoHub-iPad-13-2-gallery.png",
    eyebrow: "PRIVATE PHOTO SHARING FOR CLUBS",
    titleLine1: "Your club.",
    titleLine2: "Every moment.",
    subtitle: "A beautifully simple place for members to relive, save, and share the moments that make your club special.",
    leftPill: ("🏷️  All your events", NSPoint(x: -40, y: 720)),
    rightPill: ("👥  Made for members", NSPoint(x: 1720, y: 460))
) { screen in
    renderAppHeaderUI(in: screen, activeTab: "Gallery")

    let contentY = screen.maxY - 120
    let categories = ["All Photos", "Events", "Golf", "Tennis", "Dining"]
    var cx = screen.minX + 50
    for (i, cat) in categories.enumerated() {
        let isSel = i == 0
        let pWidth: CGFloat = CGFloat(cat.count * 15 + 44)
        rounded(NSRect(x: cx, y: contentY - 50, width: pWidth, height: 44), 22, isSel ? navy : cardBg, stroke: isSel ? navy : borderGray)
        text(cat, rect: NSRect(x: cx, y: contentY - 38, width: pWidth, height: 24), size: 16, color: isSel ? .white : navy, weight: .bold, alignment: .center)
        cx += pWidth + 14
    }

    let gridTop = contentY - 80
    let colW = (screen.width - 120) / 2
    let rowH: CGFloat = 720

    let items = [
        ("public/demo/lakeside-social.jpg", "Alex Morgan", "Golden hour on the terrace with friends.", "Events", "28"),
        ("public/demo/golf-morning.jpg", "Jordan Lee", "First group out on championship morning.", "Golf", "19"),
        ("public/demo/tennis-social.jpg", "Taylor Chen", "Weekend tournament highlights.", "Tennis", "34"),
        ("public/demo/garden-dinner.jpg", "Club Management", "Annual garden dinner gathering.", "Dining", "46")
    ]

    for (index, item) in items.enumerated() {
        let col = CGFloat(index % 2)
        let row = CGFloat(index / 2)
        let cardRect = NSRect(x: screen.minX + 40 + col * (colW + 40), y: gridTop - (row + 1) * (rowH + 30), width: colW, height: rowH)
        rounded(cardRect, 24, cardBg, stroke: borderGray)

        let imgH: CGFloat = 490
        fillImage(item.0, rect: NSRect(x: cardRect.minX, y: cardRect.maxY - imgH, width: colW, height: imgH), radius: 24)

        let infoY = cardRect.maxY - imgH - 18
        text(item.1, rect: NSRect(x: cardRect.minX + 24, y: infoY - 26, width: 260, height: 28), size: 20, color: navy, weight: .bold)

        rounded(NSRect(x: cardRect.maxX - 130, y: infoY - 26, width: 106, height: 34), 17, pillBg, stroke: pillBorder)
        text(item.3.uppercased(), rect: NSRect(x: cardRect.maxX - 130, y: infoY - 20, width: 106, height: 20), size: 12, color: goldEyebrow, weight: .bold, alignment: .center)

        text(item.2, rect: NSRect(x: cardRect.minX + 24, y: infoY - 70, width: colW - 48, height: 40), size: 16, color: navy, weight: .medium)

        text("❤️ \(item.4) likes", rect: NSRect(x: cardRect.minX + 24, y: cardRect.minY + 24, width: 180, height: 26), size: 16, color: navy, weight: .semibold)
        text("Download HD ⇩", rect: NSRect(x: cardRect.maxX - 190, y: cardRect.minY + 24, width: 166, height: 26), size: 16, color: teal, weight: .bold, alignment: .right)
    }
}

// -------------------------------------------------------------
// SCREENSHOT 3: UPLOAD FOCUS
// -------------------------------------------------------------
try renderIPadMarketingCard(
    name: "ClubPhotoHub-iPad-13-3-upload.png",
    eyebrow: "EFFORTLESS CONTRIBUTION",
    titleLine1: "Sharing should",
    titleLine2: "feel effortless.",
    subtitle: "Members can upload a moment, add a caption, and share it with the club in a few simple taps.",
    leftPill: ("⚡  Upload in seconds", NSPoint(x: -40, y: 740)),
    rightPill: ("✨  Add the story", NSPoint(x: 1720, y: 480))
) { screen in
    renderAppHeaderUI(in: screen, activeTab: "Upload")

    let container = NSRect(x: screen.minX + 120, y: screen.minY + 100, width: screen.width - 240, height: screen.height - 240)
    rounded(container, 32, cardBg, stroke: borderGray)

    text("Share a Club Moment", rect: NSRect(x: container.minX + 60, y: container.maxY - 90, width: container.width - 120, height: 48), size: 40, color: navy, weight: .bold, serif: true)
    text("Select high-resolution photos from your camera roll or desktop.", rect: NSRect(x: container.minX + 60, y: container.maxY - 138, width: container.width - 120, height: 32), size: 18, color: textSubtitle)

    let dropBox = NSRect(x: container.minX + 60, y: container.maxY - 680, width: container.width - 120, height: 500)
    rounded(dropBox, 24, pillBg, stroke: pillBorder, width: 2)

    fillImage("public/demo/golf-morning.jpg", rect: NSRect(x: dropBox.minX + 36, y: dropBox.minY + 36, width: 380, height: 428), radius: 20)

    let fX = dropBox.minX + 450
    let fW = dropBox.width - 490

    text("EVENT CATEGORY", rect: NSRect(x: fX, y: dropBox.maxY - 60, width: fW, height: 22), size: 13, color: textSubtitle, weight: .bold)
    rounded(NSRect(x: fX, y: dropBox.maxY - 120, width: fW, height: 52), 14, .white, stroke: borderGray)
    text("Golf Championship", rect: NSRect(x: fX + 20, y: dropBox.maxY - 106, width: fW - 40, height: 26), size: 18, color: navy, weight: .semibold)

    text("CAPTION", rect: NSRect(x: fX, y: dropBox.maxY - 175, width: fW, height: 22), size: 13, color: textSubtitle, weight: .bold)
    rounded(NSRect(x: fX, y: dropBox.maxY - 340, width: fW, height: 150), 14, .white, stroke: borderGray)
    text("First group out and a beautiful start to championship weekend on the 18th green.", rect: NSRect(x: fX + 20, y: dropBox.maxY - 315, width: fW - 40, height: 100), size: 17, color: navy)

    rounded(NSRect(x: container.minX + 60, y: container.minY + 60, width: container.width - 120, height: 68), 20, navy)
    text("Publish to Club Feed", rect: NSRect(x: container.minX + 60, y: container.minY + 80, width: container.width - 120, height: 30), size: 20, color: .white, weight: .bold, alignment: .center)
}

// -------------------------------------------------------------
// SCREENSHOT 4: MEMBER PROFILE FOCUS
// -------------------------------------------------------------
try renderIPadMarketingCard(
    name: "ClubPhotoHub-iPad-13-4-profile.png",
    eyebrow: "MADE FOR REAL COMMUNITIES",
    titleLine1: "Built for",
    titleLine2: "every member.",
    subtitle: "A personal place to see your club, your contributions, and the memories you have helped create.",
    leftPill: ("🏡  Your club, your space", NSPoint(x: -40, y: 720)),
    rightPill: ("✨  Simple to use", NSPoint(x: 1720, y: 460))
) { screen in
    renderAppHeaderUI(in: screen, activeTab: "Profile")

    let container = NSRect(x: screen.minX + 120, y: screen.minY + 100, width: screen.width - 240, height: screen.height - 240)
    rounded(container, 32, cardBg, stroke: borderGray)

    fillImage("splash_master.png", rect: NSRect(x: container.minX + 60, y: container.maxY - 150, width: 90, height: 90), radius: 22)
    text("Alex Morgan", rect: NSRect(x: container.minX + 170, y: container.maxY - 105, width: 500, height: 40), size: 34, color: navy, weight: .bold, serif: true)
    text("Member #DEMO-1001 · Your Club · Verified Account", rect: NSRect(x: container.minX + 170, y: container.maxY - 140, width: 500, height: 26), size: 17, color: teal, weight: .semibold)

    let statBox = NSRect(x: container.minX + 60, y: container.maxY - 310, width: container.width - 120, height: 120)
    rounded(statBox, 24, pillBg, stroke: pillBorder)

    let cW = statBox.width / 3
    text("PHOTOS SHARED", rect: NSRect(x: statBox.minX, y: statBox.maxY - 38, width: cW, height: 20), size: 13, color: textSubtitle, weight: .bold, alignment: .center)
    text("14", rect: NSRect(x: statBox.minX, y: statBox.minY + 25, width: cW, height: 40), size: 36, color: navy, weight: .bold, alignment: .center)

    text("TOTAL HEARTS", rect: NSRect(x: statBox.minX + cW, y: statBox.maxY - 38, width: cW, height: 20), size: 13, color: textSubtitle, weight: .bold, alignment: .center)
    text("128", rect: NSRect(x: statBox.minX + cW, y: statBox.minY + 25, width: cW, height: 40), size: 36, color: navy, weight: .bold, alignment: .center)

    text("MEMBER SINCE", rect: NSRect(x: statBox.minX + cW * 2, y: statBox.maxY - 38, width: cW, height: 20), size: 13, color: textSubtitle, weight: .bold, alignment: .center)
    text("June 2026", rect: NSRect(x: statBox.minX + cW * 2, y: statBox.minY + 25, width: cW, height: 40), size: 28, color: navy, weight: .bold, alignment: .center)

    text("My Uploaded Photos", rect: NSRect(x: container.minX + 60, y: container.maxY - 370, width: 400, height: 32), size: 22, color: navy, weight: .bold)

    let thumbW = (container.width - 160) / 3
    let thumbH: CGFloat = 360
    let photos = ["public/demo/lakeside-social.jpg", "public/demo/golf-morning.jpg", "public/demo/tennis-social.jpg"]

    for (i, p) in photos.enumerated() {
        let px = container.minX + 60 + CGFloat(i) * (thumbW + 20)
        let pr = NSRect(x: px, y: container.minY + 60, width: thumbW, height: thumbH)
        fillImage(p, rect: pr, radius: 20)
    }
}

// -------------------------------------------------------------
// SCREENSHOT 5: COMPLETE EXPERIENCE / FEED FOCUS
// -------------------------------------------------------------
try renderIPadMarketingCard(
    name: "ClubPhotoHub-iPad-13-5-experience.png",
    eyebrow: "THE MEMBER EXPERIENCE",
    titleLine1: "All the moments.",
    titleLine2: "One private place.",
    subtitle: "From the first tee to the last toast, your club stays connected around the photos that matter.",
    leftPill: ("📱  A familiar feed", NSPoint(x: -40, y: 740)),
    rightPill: ("🔖  Save favourite photos", NSPoint(x: 1720, y: 480))
) { screen in
    renderAppHeaderUI(in: screen, activeTab: "Gallery")

    let contentY = screen.maxY - 120
    let categories = ["All Photos", "Events", "Golf", "Tennis", "Dining"]
    var cx = screen.minX + 50
    for (i, cat) in categories.enumerated() {
        let isSel = i == 0
        let pWidth: CGFloat = CGFloat(cat.count * 15 + 44)
        rounded(NSRect(x: cx, y: contentY - 50, width: pWidth, height: 44), 22, isSel ? navy : cardBg, stroke: isSel ? navy : borderGray)
        text(cat, rect: NSRect(x: cx, y: contentY - 38, width: pWidth, height: 24), size: 16, color: isSel ? .white : navy, weight: .bold, alignment: .center)
        cx += pWidth + 14
    }

    let gridTop = contentY - 80
    let colW = (screen.width - 120) / 2
    let rowH: CGFloat = 720

    let items = [
        ("public/demo/lakeside-social.jpg", "Alex Morgan", "Golden hour on the terrace with friends.", "Events", "28"),
        ("public/demo/golf-morning.jpg", "Jordan Lee", "First group out on championship morning.", "Golf", "19"),
        ("public/demo/tennis-social.jpg", "Taylor Chen", "Weekend tournament highlights.", "Tennis", "34"),
        ("public/demo/garden-dinner.jpg", "Club Management", "Annual garden dinner gathering.", "Dining", "46")
    ]

    for (index, item) in items.enumerated() {
        let col = CGFloat(index % 2)
        let row = CGFloat(index / 2)
        let cardRect = NSRect(x: screen.minX + 40 + col * (colW + 40), y: gridTop - (row + 1) * (rowH + 30), width: colW, height: rowH)
        rounded(cardRect, 24, cardBg, stroke: borderGray)

        let imgH: CGFloat = 490
        fillImage(item.0, rect: NSRect(x: cardRect.minX, y: cardRect.maxY - imgH, width: colW, height: imgH), radius: 24)

        let infoY = cardRect.maxY - imgH - 18
        text(item.1, rect: NSRect(x: cardRect.minX + 24, y: infoY - 26, width: 260, height: 28), size: 20, color: navy, weight: .bold)

        rounded(NSRect(x: cardRect.maxX - 130, y: infoY - 26, width: 106, height: 34), 17, pillBg, stroke: pillBorder)
        text(item.3.uppercased(), rect: NSRect(x: cardRect.maxX - 130, y: infoY - 20, width: 106, height: 20), size: 12, color: goldEyebrow, weight: .bold, alignment: .center)

        text(item.2, rect: NSRect(x: cardRect.minX + 24, y: infoY - 70, width: colW - 48, height: 40), size: 16, color: navy, weight: .medium)

        text("❤️ \(item.4) likes", rect: NSRect(x: cardRect.minX + 24, y: cardRect.minY + 24, width: 180, height: 26), size: 16, color: navy, weight: .semibold)
        text("Download HD ⇩", rect: NSRect(x: cardRect.maxX - 190, y: cardRect.minY + 24, width: 166, height: 26), size: 16, color: teal, weight: .bold, alignment: .right)
    }
}

print("iPad 13-inch marketing screenshot suite generated successfully.")
