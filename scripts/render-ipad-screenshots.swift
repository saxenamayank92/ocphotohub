import AppKit
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let outputDir = root.appendingPathComponent("marketing/app-store/ipad-capture")
try FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)

// App Palette
let navy = NSColor(calibratedRed: 11/255, green: 19/255, blue: 41/255, alpha: 1)
let navyDark = NSColor(calibratedRed: 7/255, green: 13/255, blue: 29/255, alpha: 1)
let gold = NSColor(calibratedRed: 197/255, green: 160/255, blue: 89/255, alpha: 1)
let cream = NSColor(calibratedRed: 248/255, green: 249/255, blue: 250/255, alpha: 1)
let teal = NSColor(calibratedRed: 31/255, green: 79/255, blue: 74/255, alpha: 1)
let grayText = NSColor(calibratedRed: 100/255, green: 116/255, blue: 139/255, alpha: 1)
let cardBg = NSColor.white
let borderGray = NSColor(calibratedRed: 226/255, green: 232/255, blue: 240/255, alpha: 1)

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

func save(_ image: NSImage, name: String) throws {
    guard let tiff = image.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff),
          let data = bitmap.representation(using: .png, properties: [:]) else { throw NSError(domain: "render", code: 1) }
    let dest = outputDir.appendingPathComponent(name)
    try data.write(to: dest)
    print("Saved \(name) (\(Int(image.size.width))x\(Int(image.size.height)))")
}

// Render iPad 13-inch frame (2048 x 2732 pixels)
func renderIPadScreenshot(name: String, tag: String, headline: String, subtitle: String, renderContent: (NSRect) -> Void) throws {
    let width: CGFloat = 2048
    let height: CGFloat = 2732
    let size = NSSize(width: width, height: height)
    let image = NSImage(size: size)
    image.lockFocus()

    // Outer Background
    NSGradient(colors: [navyDark, navy])?.draw(in: NSRect(origin: .zero, size: size), angle: 270)

    // Header Marketing Text
    gold.setFill()
    NSBezierPath(roundedRect: NSRect(x: width/2 - 60, y: height - 120, width: 120, height: 6), xRadius: 3, yRadius: 3).fill()

    text(tag.uppercased(), rect: NSRect(x: 100, y: height - 210, width: width - 200, height: 50), size: 32, color: gold, weight: .bold, alignment: .center)
    text(headline, rect: NSRect(x: 80, y: height - 350, width: width - 160, height: 130), size: 68, color: .white, weight: .bold, serif: true, alignment: .center)
    text(subtitle, rect: NSRect(x: 120, y: height - 440, width: width - 240, height: 80), size: 30, color: NSColor(calibratedWhite: 1, alpha: 0.85), weight: .medium, alignment: .center)

    // iPad Device Shell
    let deviceRect = NSRect(x: 100, y: 80, width: width - 200, height: height - 540)
    
    // Shadow
    NSGraphicsContext.current?.saveGraphicsState()
    let shadow = NSShadow()
    shadow.shadowColor = NSColor(calibratedWhite: 0, alpha: 0.5)
    shadow.shadowBlurRadius = 40
    shadow.shadowOffset = NSSize(width: 0, height: -20)
    shadow.set()
    rounded(deviceRect, 48, NSColor(calibratedWhite: 0.15, alpha: 1))
    NSGraphicsContext.current?.restoreGraphicsState()

    // Inner Screen Content (1768 x 2032)
    let screenRect = NSRect(x: deviceRect.minX + 40, y: deviceRect.minY + 40, width: deviceRect.width - 80, height: deviceRect.height - 80)
    rounded(screenRect, 32, cream)

    // Custom Screen Render
    NSGraphicsContext.current?.saveGraphicsState()
    NSBezierPath(roundedRect: screenRect, xRadius: 32, yRadius: 32).addClip()
    renderContent(screenRect)
    NSGraphicsContext.current?.restoreGraphicsState()

    image.unlockFocus()
    try save(image, name: name)
}

// Common iPad App Header
func renderAppHeader(in screenRect: NSRect, activeTab: String) {
    let headerHeight: CGFloat = 120
    let headerRect = NSRect(x: screenRect.minX, y: screenRect.maxY - headerHeight, width: screenRect.width, height: headerHeight)
    rounded(headerRect, 0, cardBg, stroke: borderGray)

    // Brand Logo & Title
    fillImage("splash_master.png", rect: NSRect(x: headerRect.minX + 40, y: headerRect.midY - 28, width: 56, height: 56), radius: 14)
    text("Club PhotoHub", rect: NSRect(x: headerRect.minX + 112, y: headerRect.midY - 4, width: 350, height: 36), size: 28, color: navy, weight: .bold, serif: true)
    text("Your Club · Private Gallery", rect: NSRect(x: headerRect.minX + 112, y: headerRect.midY - 26, width: 350, height: 22), size: 16, color: teal, weight: .semibold)

    // Navigation Tabs
    let tabs = ["Gallery", "Upload", "Profile", "Admin"]
    let tabWidth: CGFloat = 160
    let startX = headerRect.maxX - CGFloat(tabs.count) * tabWidth - 60
    for (i, tab) in tabs.enumerated() {
        let tx = startX + CGFloat(i) * tabWidth
        let isSelected = tab == activeTab
        text(tab, rect: NSRect(x: tx, y: headerRect.midY - 14, width: tabWidth, height: 32), size: 20, color: isSelected ? navy : grayText, weight: isSelected ? .bold : .semibold, alignment: .center)
        if isSelected {
            gold.setFill()
            NSBezierPath(roundedRect: NSRect(x: tx + 30, y: headerRect.minY + 4, width: tabWidth - 60, height: 4), xRadius: 2, yRadius: 2).fill()
        }
    }
}

// 1. Photo Gallery View
try renderIPadScreenshot(
    name: "ClubPhotoHub-iPad-13-gallery.png",
    tag: "Private Club Gallery",
    headline: "Every community moment in one secure hub.",
    subtitle: "High-resolution photo feed curated exclusively for verified club members."
) { screen in
    renderAppHeader(in: screen, activeTab: "Gallery")
    
    let contentY = screen.maxY - 120
    let categoryHeight: CGFloat = 80
    
    // Category Pills
    let categories = ["All Photos", "Events", "Golf", "Tennis", "Dining"]
    var cx = screen.minX + 50
    for (i, cat) in categories.enumerated() {
        let isSel = i == 0
        let pWidth: CGFloat = CGFloat(cat.count * 16 + 48)
        rounded(NSRect(x: cx, y: contentY - 60, width: pWidth, height: 48), 24, isSel ? navy : cardBg, stroke: isSel ? navy : borderGray)
        text(cat, rect: NSRect(x: cx, y: contentY - 47, width: pWidth, height: 26), size: 18, color: isSel ? .white : navy, weight: .bold, alignment: .center)
        cx += pWidth + 16
    }
    
    // Photo Grid (2 columns x 2 rows)
    let gridTop = contentY - 100
    let colW = (screen.width - 130) / 2
    let rowH: CGFloat = 850
    
    let items = [
        ("public/demo/lakeside-social.jpg", "Alex Morgan", "Golden hour on the terrace with friends.", "Events", "28"),
        ("public/demo/golf-morning.jpg", "Jordan Lee", "First group out on championship morning.", "Golf", "19"),
        ("public/demo/tennis-social.jpg", "Taylor Chen", "Weekend tournament highlights and big smiles.", "Tennis", "34"),
        ("public/demo/garden-dinner.jpg", "Club Management", "Annual garden dinner gathering.", "Dining", "46")
    ]
    
    for (index, item) in items.enumerated() {
        let col = CGFloat(index % 2)
        let row = CGFloat(index / 2)
        let cardRect = NSRect(x: screen.minX + 50 + col * (colW + 30), y: gridTop - (row + 1) * (rowH + 30), width: colW, height: rowH)
        
        rounded(cardRect, 28, cardBg, stroke: borderGray)
        
        // Image
        let imgHeight: CGFloat = 580
        fillImage(item.0, rect: NSRect(x: cardRect.minX, y: cardRect.maxY - imgHeight, width: colW, height: imgHeight), radius: 28)
        
        // Card Content
        let infoY = cardRect.maxY - imgHeight - 20
        text(item.1, rect: NSRect(x: cardRect.minX + 30, y: infoY - 30, width: 300, height: 30), size: 22, color: navy, weight: .bold)
        
        // Category Badge
        rounded(NSRect(x: cardRect.maxX - 140, y: infoY - 32, width: 110, height: 36), 18, cream, stroke: gold)
        text(item.3.uppercased(), rect: NSRect(x: cardRect.maxX - 140, y: infoY - 26, width: 110, height: 22), size: 13, color: gold, weight: .bold, alignment: .center)
        
        text(item.2, rect: NSRect(x: cardRect.minX + 30, y: infoY - 95, width: colW - 60, height: 50), size: 18, color: navy, weight: .medium)
        
        // Like Bar
        text("❤️ \(item.4) likes", rect: NSRect(x: cardRect.minX + 30, y: cardRect.minY + 30, width: 200, height: 30), size: 18, color: navy, weight: .semibold)
        text("Download HD ⇩", rect: NSRect(x: cardRect.maxX - 210, y: cardRect.minY + 30, width: 180, height: 30), size: 18, color: teal, weight: .bold, alignment: .right)
    }
}

// 2. Lightbox / Detail View
try renderIPadScreenshot(
    name: "ClubPhotoHub-iPad-13-detail.png",
    tag: "Interactive Lightbox",
    headline: "Full-resolution photo details & member likes.",
    subtitle: "Members engage with photos, leave hearts, and save event memories."
) { screen in
    renderAppHeader(in: screen, activeTab: "Gallery")
    
    // Backdrop blur effect
    rounded(NSRect(x: screen.minX, y: screen.minY, width: screen.width, height: screen.height - 120), 0, NSColor(calibratedWhite: 0, alpha: 0.6))
    
    // Lightbox Card
    let modal = NSRect(x: screen.minX + 120, y: screen.minY + 120, width: screen.width - 240, height: screen.height - 360)
    rounded(modal, 36, cardBg)
    
    // Split View: Image Left (60%), Details Right (40%)
    let imgW = modal.width * 0.62
    fillImage("public/demo/lakeside-social.jpg", rect: NSRect(x: modal.minX, y: modal.minY, width: imgW, height: modal.height), radius: 36)
    
    let detailX = modal.minX + imgW + 40
    let detailW = modal.width - imgW - 80
    
    text("EVENTS", rect: NSRect(x: detailX, y: modal.maxY - 80, width: 140, height: 36), size: 14, color: gold, weight: .bold)
    text("Golden hour on the terrace with friends.", rect: NSRect(x: detailX, y: modal.maxY - 200, width: detailW, height: 110), size: 36, color: navy, weight: .bold, serif: true)
    
    text("Uploaded by Alex Morgan", rect: NSRect(x: detailX, y: modal.maxY - 250, width: detailW, height: 30), size: 20, color: navy, weight: .bold)
    text("Oakville Photography Club · Member #1001", rect: NSRect(x: detailX, y: modal.maxY - 285, width: detailW, height: 26), size: 16, color: grayText)
    
    // Heart Stat
    rounded(NSRect(x: detailX, y: modal.maxY - 390, width: detailW, height: 74), 20, cream, stroke: borderGray)
    text("❤️ Liked by 28 members", rect: NSRect(x: detailX + 24, y: modal.maxY - 367, width: detailW - 48, height: 30), size: 20, color: navy, weight: .bold)
    
    text("This is what summer at the club feels like. Sunset over the lake, great conversations, and wonderful company.", rect: NSRect(x: detailX, y: modal.maxY - 550, width: detailW, height: 120), size: 18, color: navy, weight: .regular)
    
    // Action Button
    rounded(NSRect(x: detailX, y: modal.minY + 60, width: detailW, height: 68), 20, navy)
    text("Download Original Photo", rect: NSRect(x: detailX, y: modal.minY + 80, width: detailW, height: 30), size: 20, color: .white, weight: .bold, alignment: .center)
}

// 3. Upload View
try renderIPadScreenshot(
    name: "ClubPhotoHub-iPad-13-upload.png",
    tag: "Member Contributions",
    headline: "Seamless photo uploads with event tagging.",
    subtitle: "Fast drag-and-drop or camera uploads with automated privacy controls."
) { screen in
    renderAppHeader(in: screen, activeTab: "Upload")
    
    let container = NSRect(x: screen.minX + 160, y: screen.minY + 140, width: screen.width - 320, height: screen.height - 400)
    rounded(container, 32, cardBg, stroke: borderGray)
    
    text("Share a Club Moment", rect: NSRect(x: container.minX + 60, y: container.maxY - 100, width: container.width - 120, height: 50), size: 42, color: navy, weight: .bold, serif: true)
    text("Select high-resolution photos from your device to share with fellow club members.", rect: NSRect(x: container.minX + 60, y: container.maxY - 150, width: container.width - 120, height: 36), size: 20, color: grayText)
    
    // Upload Box
    let dropBox = NSRect(x: container.minX + 60, y: container.maxY - 650, width: container.width - 120, height: 460)
    rounded(dropBox, 24, cream, stroke: gold, width: 2)
    
    fillImage("public/demo/golf-morning.jpg", rect: NSRect(x: dropBox.minX + 40, y: dropBox.minY + 40, width: 340, height: 380), radius: 18)
    
    let formX = dropBox.minX + 420
    let formW = dropBox.width - 460
    
    text("EVENT CATEGORY", rect: NSRect(x: formX, y: dropBox.maxY - 70, width: formW, height: 24), size: 14, color: grayText, weight: .bold)
    rounded(NSRect(x: formX, y: dropBox.maxY - 130, width: formW, height: 50), 14, .white, stroke: borderGray)
    text("Golf Championship", rect: NSRect(x: formX + 20, y: dropBox.maxY - 117, width: formW - 40, height: 26), size: 18, color: navy, weight: .semibold)
    
    text("CAPTION", rect: NSRect(x: formX, y: dropBox.maxY - 185, width: formW, height: 24), size: 14, color: grayText, weight: .bold)
    rounded(NSRect(x: formX, y: dropBox.maxY - 340, width: formW, height: 140), 14, .white, stroke: borderGray)
    text("First group out and a beautiful start to championship weekend on the 18th green.", rect: NSRect(x: formX + 20, y: dropBox.maxY - 320, width: formW - 40, height: 100), size: 17, color: navy)
    
    // Submit Button
    rounded(NSRect(x: container.minX + 60, y: container.minY + 80, width: container.width - 120, height: 72), 20, navy)
    text("Publish to Club Feed", rect: NSRect(x: container.minX + 60, y: container.minY + 102, width: container.width - 120, height: 32), size: 22, color: .white, weight: .bold, alignment: .center)
}

// 4. Member Profile View
try renderIPadScreenshot(
    name: "ClubPhotoHub-iPad-13-profile.png",
    tag: "Member Account",
    headline: "Verified roster identity & personal archives.",
    subtitle: "Each member manages their account security and personal contributions."
) { screen in
    renderAppHeader(in: screen, activeTab: "Profile")
    
    let container = NSRect(x: screen.minX + 160, y: screen.minY + 140, width: screen.width - 320, height: screen.height - 400)
    rounded(container, 32, cardBg, stroke: borderGray)
    
    // Header Lockup
    fillImage("splash_master.png", rect: NSRect(x: container.minX + 60, y: container.maxY - 160, width: 100, height: 100), radius: 24)
    text("Alex Morgan", rect: NSRect(x: container.minX + 180, y: container.maxY - 110, width: 600, height: 44), size: 36, color: navy, weight: .bold, serif: true)
    text("Member #1001 · Your Club · Verified Account", rect: NSRect(x: container.minX + 180, y: container.maxY - 148, width: 600, height: 28), size: 18, color: teal, weight: .semibold)
    
    // Stats Bar
    let statBox = NSRect(x: container.minX + 60, y: container.maxY - 320, width: container.width - 120, height: 120)
    rounded(statBox, 24, cream, stroke: borderGray)
    
    let colW = statBox.width / 3
    text("PHOTOS SHARED", rect: NSRect(x: statBox.minX, y: statBox.maxY - 40, width: colW, height: 20), size: 14, color: grayText, weight: .bold, alignment: .center)
    text("14", rect: NSRect(x: statBox.minX, y: statBox.minY + 25, width: colW, height: 40), size: 36, color: navy, weight: .bold, alignment: .center)
    
    text("TOTAL HEARTS", rect: NSRect(x: statBox.minX + colW, y: statBox.maxY - 40, width: colW, height: 20), size: 14, color: grayText, weight: .bold, alignment: .center)
    text("128", rect: NSRect(x: statBox.minX + colW, y: statBox.minY + 25, width: colW, height: 40), size: 36, color: navy, weight: .bold, alignment: .center)
    
    text("MEMBER SINCE", rect: NSRect(x: statBox.minX + colW * 2, y: statBox.maxY - 40, width: colW, height: 20), size: 14, color: grayText, weight: .bold, alignment: .center)
    text("June 2026", rect: NSRect(x: statBox.minX + colW * 2, y: statBox.minY + 25, width: colW, height: 40), size: 28, color: navy, weight: .bold, alignment: .center)
    
    // My Uploads Section
    text("My Uploaded Photos", rect: NSRect(x: container.minX + 60, y: container.maxY - 390, width: 400, height: 36), size: 24, color: navy, weight: .bold)
    
    let thumbW = (container.width - 160) / 3
    let thumbH: CGFloat = 340
    let photos = ["public/demo/lakeside-social.jpg", "public/demo/golf-morning.jpg", "public/demo/tennis-social.jpg"]
    
    for (i, p) in photos.enumerated() {
        let px = container.minX + 60 + CGFloat(i) * (thumbW + 20)
        let pr = NSRect(x: px, y: container.minY + 80, width: thumbW, height: thumbH)
        fillImage(p, rect: pr, radius: 20)
    }
}

// 5. Admin Portal View
try renderIPadScreenshot(
    name: "ClubPhotoHub-iPad-13-admin.png",
    tag: "Admin & Roster Portal",
    headline: "Complete organization control & roster safety.",
    subtitle: "Manage member rosters, track storage plans, and moderate content."
) { screen in
    renderAppHeader(in: screen, activeTab: "Admin")
    
    let container = NSRect(x: screen.minX + 120, y: screen.minY + 100, width: screen.width - 240, height: screen.height - 320)
    rounded(container, 32, cardBg, stroke: borderGray)
    
    text("Club Administration Portal", rect: NSRect(x: container.minX + 60, y: container.maxY - 90, width: 600, height: 46), size: 38, color: navy, weight: .bold, serif: true)
    text("Your Club · Private Workspace Management", rect: NSRect(x: container.minX + 60, y: container.maxY - 130, width: 600, height: 26), size: 18, color: teal, weight: .semibold)
    
    // Add Member Button
    rounded(NSRect(x: container.maxX - 260, y: container.maxY - 110, width: 200, height: 50), 16, navy)
    text("+ Add Member", rect: NSRect(x: container.maxX - 260, y: container.maxY - 97, width: 200, height: 26), size: 17, color: .white, weight: .bold, alignment: .center)
    
    // Member Roster Table
    let tableTop = container.maxY - 180
    let tableHeader = NSRect(x: container.minX + 60, y: tableTop - 50, width: container.width - 120, height: 50)
    rounded(tableHeader, 12, cream)
    
    text("MEMBER #", rect: NSRect(x: tableHeader.minX + 24, y: tableHeader.minY + 14, width: 140, height: 20), size: 14, color: grayText, weight: .bold)
    text("NAME", rect: NSRect(x: tableHeader.minX + 200, y: tableHeader.minY + 14, width: 200, height: 20), size: 14, color: grayText, weight: .bold)
    text("EMAIL", rect: NSRect(x: tableHeader.minX + 460, y: tableHeader.minY + 14, width: 260, height: 20), size: 14, color: grayText, weight: .bold)
    text("ROLE", rect: NSRect(x: tableHeader.minX + 780, y: tableHeader.minY + 14, width: 140, height: 20), size: 14, color: grayText, weight: .bold)
    text("STATUS", rect: NSRect(x: tableHeader.maxX - 160, y: tableHeader.minY + 14, width: 130, height: 20), size: 14, color: grayText, weight: .bold, alignment: .right)
    
    let roster = [
        ("1001", "Alex Morgan", "member@example.com", "Owner", "Active"),
        ("1002", "Jordan Lee", "jordan@example.com", "Admin", "Active"),
        ("1003", "Taylor Chen", "taylor@example.com", "Member", "Active"),
        ("1004", "Emily Thompson", "emily@example.com", "Member", "Active"),
        ("1005", "David Wilson", "david@example.com", "Member", "Active")
    ]
    
    var rowY = tableHeader.minY - 70
    for m in roster {
        let rowRect = NSRect(x: container.minX + 60, y: rowY, width: container.width - 120, height: 60)
        rounded(rowRect, 10, .white, stroke: borderGray)
        
        text(m.0, rect: NSRect(x: rowRect.minX + 24, y: rowRect.minY + 18, width: 140, height: 24), size: 18, color: navy, weight: .bold)
        text(m.1, rect: NSRect(x: rowRect.minX + 200, y: rowRect.minY + 18, width: 200, height: 24), size: 18, color: navy, weight: .semibold)
        text(m.2, rect: NSRect(x: rowRect.minX + 460, y: rowRect.minY + 18, width: 260, height: 24), size: 16, color: grayText)
        text(m.3, rect: NSRect(x: rowRect.minX + 780, y: rowRect.minY + 18, width: 140, height: 24), size: 16, color: teal, weight: .bold)
        
        rounded(NSRect(x: rowRect.maxX - 150, y: rowRect.minY + 12, width: 120, height: 36), 18, NSColor(calibratedRed: 227/255, green: 244/255, blue: 240/255, alpha: 1))
        text(m.4, rect: NSRect(x: rowRect.maxX - 150, y: rowRect.minY + 20, width: 120, height: 20), size: 14, color: teal, weight: .bold, alignment: .center)
        
        rowY -= 75
    }
}

print("iPad 13-inch screenshot generation completed successfully.")
