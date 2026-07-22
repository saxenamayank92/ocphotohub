import AppKit
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let output = root.appendingPathComponent("artifacts/video/product-tour-frames")
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)

let navy = NSColor(calibratedRed: 13/255, green: 23/255, blue: 40/255, alpha: 1)
let navy2 = NSColor(calibratedRed: 23/255, green: 34/255, blue: 56/255, alpha: 1)
let gold = NSColor(calibratedRed: 200/255, green: 167/255, blue: 107/255, alpha: 1)
let cream = NSColor(calibratedRed: 247/255, green: 245/255, blue: 240/255, alpha: 1)
let teal = NSColor(calibratedRed: 40/255, green: 92/255, blue: 89/255, alpha: 1)
let gray = NSColor(calibratedRed: 105/255, green: 120/255, blue: 116/255, alpha: 1)
let pale = NSColor(calibratedRed: 238/255, green: 241/255, blue: 238/255, alpha: 1)

func font(_ name: String, _ size: CGFloat, _ weight: NSFont.Weight = .regular) -> NSFont {
    NSFont(name: name, size: size) ?? NSFont.systemFont(ofSize: size, weight: weight)
}

func text(_ value: String, _ rect: NSRect, _ size: CGFloat, _ color: NSColor, _ weight: NSFont.Weight = .regular, _ alignment: NSTextAlignment = .left, serif: Bool = false) {
    let paragraph = NSMutableParagraphStyle(); paragraph.alignment = alignment; paragraph.lineSpacing = size * 0.06
    value.draw(with: rect, options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: [
        .font: serif ? font("Cormorant Garamond", size, weight) : font("Inter", size, weight),
        .foregroundColor: color,
        .paragraphStyle: paragraph
    ])
}

func rounded(_ rect: NSRect, _ radius: CGFloat, _ color: NSColor, stroke: NSColor? = nil, width: CGFloat = 1) {
    let path = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
    color.setFill(); path.fill()
    if let stroke { stroke.setStroke(); path.lineWidth = width; path.stroke() }
}

func line(_ from: NSPoint, _ to: NSPoint, color: NSColor, width: CGFloat = 1) {
    let path = NSBezierPath(); path.move(to: from); path.line(to: to); path.lineWidth = width; color.setStroke(); path.stroke()
}

func fillImage(_ path: String, _ rect: NSRect) {
    guard let image = NSImage(contentsOfFile: root.appendingPathComponent(path).path) else { return }
    let source = NSRect(origin: .zero, size: image.size)
    let scale = max(rect.width / source.width, rect.height / source.height)
    let target = NSSize(width: source.width * scale, height: source.height * scale)
    image.draw(in: NSRect(x: rect.midX-target.width/2, y: rect.midY-target.height/2, width: target.width, height: target.height), from: source, operation: .sourceOver, fraction: 1)
}

func save(_ image: NSImage, _ name: String) throws {
    guard let tiff = image.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiff), let data = bitmap.representation(using: .png, properties: [:]) else { throw NSError(domain: "render", code: 1) }
    try data.write(to: output.appendingPathComponent(name))
}

func field(_ label: String, _ value: String, _ rect: NSRect, selected: Bool = false) {
    text(label.uppercased(), NSRect(x: rect.minX, y: rect.maxY + 7, width: rect.width, height: 18), 10, gray, .bold)
    rounded(rect, 9, .white, stroke: selected ? teal : NSColor(calibratedWhite: 0.84, alpha: 1), width: selected ? 2 : 1)
    text(value, NSRect(x: rect.minX + 14, y: rect.minY + 12, width: rect.width - 28, height: rect.height - 18), 14, value.isEmpty ? NSColor(calibratedWhite: 0.62, alpha: 1) : navy2, .medium)
}

func browserShell(_ url: String, title: String, step: String) -> NSRect {
    NSGradient(colors: [navy, teal])?.draw(in: NSRect(x: 0, y: 0, width: 1920, height: 1080), angle: 12)
    text(step.uppercased(), NSRect(x: 105, y: 1015, width: 360, height: 24), 13, gold, .bold)
    text(title, NSRect(x: 104, y: 955, width: 1550, height: 55), 38, .white, .bold)
    let window = NSRect(x: 95, y: 70, width: 1730, height: 855)
    NSGraphicsContext.current?.saveGraphicsState()
    let shadow = NSShadow(); shadow.shadowColor = NSColor(calibratedWhite: 0, alpha: 0.35); shadow.shadowBlurRadius = 28; shadow.shadowOffset = NSSize(width: 0, height: -12); shadow.set()
    rounded(window, 22, .white)
    NSGraphicsContext.current?.restoreGraphicsState()
    let chrome = NSRect(x: window.minX, y: window.maxY - 68, width: window.width, height: 68)
    rounded(chrome, 22, NSColor(calibratedWhite: 0.965, alpha: 1))
    NSColor(calibratedWhite: 0.965, alpha: 1).setFill(); NSBezierPath(rect: NSRect(x: chrome.minX, y: chrome.minY, width: chrome.width, height: 25)).fill()
    for (index, color) in [NSColor.systemRed, NSColor.systemYellow, NSColor.systemGreen].enumerated() { color.setFill(); NSBezierPath(ovalIn: NSRect(x: 122 + CGFloat(index*25), y: 881, width: 13, height: 13)).fill() }
    rounded(NSRect(x: 500, y: 870, width: 820, height: 34), 17, .white, stroke: NSColor(calibratedWhite: 0.88, alpha: 1))
    text("🔒  \(url)", NSRect(x: 523, y: 877, width: 770, height: 20), 12, NSColor(calibratedWhite: 0.42, alpha: 1), .medium)
    return NSRect(x: 95, y: 70, width: 1730, height: 787)
}

func appHeader(_ content: NSRect, active: String, admin: Bool = false) {
    NSColor.white.setFill(); NSBezierPath(rect: NSRect(x: content.minX, y: content.maxY - 92, width: content.width, height: 92)).fill()
    text("CLUB PHOTOHUB", NSRect(x: content.minX + 42, y: content.maxY - 49, width: 300, height: 28), 17, navy, .bold)
    text("YOUR CLUB · PRIVATE GALLERY", NSRect(x: content.minX + 42, y: content.maxY - 72, width: 330, height: 20), 10, teal, .bold)
    let tabs = admin ? ["Admin Portal", "View Gallery"] : ["Member Gallery", "Upload Photo"]
    for (index, item) in tabs.enumerated() {
        let x = content.minX + 620 + CGFloat(index) * 230
        text(item, NSRect(x: x, y: content.maxY - 58, width: 200, height: 27), 14, item == active ? navy : gray, item == active ? .bold : .medium, .center)
        if item == active { gold.setFill(); NSBezierPath(rect: NSRect(x: x + 25, y: content.maxY - 79, width: 150, height: 3)).fill() }
    }
    rounded(NSRect(x: content.maxX - 205, y: content.maxY - 65, width: 160, height: 38), 19, pale, stroke: NSColor(calibratedWhite: 0.84, alpha: 1))
    text(admin ? "Club Owner" : "Alex Morgan", NSRect(x: content.maxX - 195, y: content.maxY - 54, width: 140, height: 20), 12, navy, .semibold, .center)
    line(NSPoint(x: content.minX, y: content.maxY - 92), NSPoint(x: content.maxX, y: content.maxY - 92), color: NSColor(calibratedWhite: 0.88, alpha: 1))
}

func cursor(_ point: NSPoint) {
    NSGraphicsContext.current?.saveGraphicsState()
    let shadow = NSShadow(); shadow.shadowColor = NSColor(calibratedWhite: 0, alpha: 0.34); shadow.shadowBlurRadius = 7; shadow.shadowOffset = NSSize(width: 2, height: -3); shadow.set()
    let p = NSBezierPath(); p.move(to: point); p.line(to: NSPoint(x: point.x + 12, y: point.y - 38)); p.line(to: NSPoint(x: point.x + 21, y: point.y - 24)); p.line(to: NSPoint(x: point.x + 37, y: point.y - 42)); p.line(to: NSPoint(x: point.x + 45, y: point.y - 34)); p.line(to: NSPoint(x: point.x + 29, y: point.y - 17)); p.line(to: NSPoint(x: point.x + 43, y: point.y - 12)); p.close(); NSColor.white.setFill(); p.fill(); navy.setStroke(); p.lineWidth = 2; p.stroke()
    NSGraphicsContext.current?.restoreGraphicsState()
    gold.withAlphaComponent(0.28).setFill(); NSBezierPath(ovalIn: NSRect(x: point.x - 17, y: point.y - 17, width: 34, height: 34)).fill()
}

func callout(_ number: String, _ label: String, _ rect: NSRect) {
    rounded(rect, 19, navy.withAlphaComponent(0.93))
    gold.setFill(); NSBezierPath(ovalIn: NSRect(x: rect.minX + 14, y: rect.midY - 13, width: 26, height: 26)).fill()
    text(number, NSRect(x: rect.minX + 14, y: rect.midY - 7, width: 26, height: 17), 11, navy, .bold, .center)
    text(label, NSRect(x: rect.minX + 50, y: rect.midY - 9, width: rect.width - 62, height: 22), 13, .white, .semibold)
}

func render(_ name: String, step: String, title: String, url: String, draw: (NSRect) -> Void) throws {
    let image = NSImage(size: NSSize(width: 1920, height: 1080)); image.lockFocus()
    let content = browserShell(url, title: title, step: step); draw(content)
    image.unlockFocus(); try save(image, name)
}

try render("01-workspace.png", step: "1 · Private pilot onboarding", title: "Launch a branded workspace in minutes", url: "clubphotohub.xtide.io/app?onboard=club") { c in
    cream.setFill(); NSBezierPath(rect: c).fill()
    let card = NSRect(x: 400, y: 115, width: 1120, height: 690); rounded(card, 22, .white, stroke: NSColor(calibratedWhite: 0.86, alpha: 1))
    text("Create your organization workspace", NSRect(x: 455, y: 725, width: 800, height: 50), 36, navy, .semibold, serif: true)
    text("A private PhotoHub owned by your organization.", NSRect(x: 458, y: 690, width: 650, height: 30), 15, gray, .medium)
    for index in 0..<3 { let x = 570 + CGFloat(index)*250; let active = index == 0; (active ? gold : NSColor(calibratedWhite: 0.83, alpha: 1)).setFill(); NSBezierPath(ovalIn: NSRect(x: x, y: 650, width: 32, height: 32)).fill(); text("\(index+1)", NSRect(x: x, y: 659, width: 32, height: 18), 11, active ? navy : gray, .bold, .center) }
    field("Private pilot access code", "••••••••", NSRect(x: 955, y: 575, width: 505, height: 44))
    text("Club details", NSRect(x: 458, y: 530, width: 250, height: 24), 16, navy, .bold)
    field("Organization name", "Your Club", NSRect(x: 458, y: 455, width: 470, height: 50), selected: true)
    field("Organization type", "Private Club  ▾", NSRect(x: 955, y: 455, width: 505, height: 50))
    text("Primary administrator", NSRect(x: 458, y: 405, width: 300, height: 24), 16, navy, .bold)
    field("First name", "Jamie", NSRect(x: 458, y: 330, width: 310, height: 50))
    field("Last name", "Taylor", NSRect(x: 792, y: 330, width: 310, height: 50))
    field("Work email", "jamie@yourclub.com", NSRect(x: 1126, y: 330, width: 334, height: 50))
    rounded(NSRect(x: 620, y: 220, width: 680, height: 56), 11, teal); text("Verify administrator email", NSRect(x: 620, y: 236, width: 680, height: 26), 16, .white, .bold, .center)
    text("30-day free trial · No credit card", NSRect(x: 620, y: 180, width: 680, height: 24), 12, gray, .semibold, .center)
    callout("1", "Invite-only pilot access", NSRect(x: 1280, y: 700, width: 260, height: 52)); cursor(NSPoint(x: 1280, y: 249))
}

try render("02-member-check.png", step: "2 · Protected member access", title: "Turn the club directory into your membership gate", url: "clubphotohub.xtide.io/app") { c in
    cream.setFill(); NSBezierPath(rect: c).fill()
    let card = NSRect(x: 605, y: 145, width: 710, height: 620); rounded(card, 24, .white, stroke: NSColor(calibratedWhite: 0.85, alpha: 1))
    text("Welcome to Club PhotoHub", NSRect(x: 670, y: 690, width: 580, height: 45), 34, navy, .semibold, .center, serif: true)
    text("First, find and verify your membership.", NSRect(x: 690, y: 650, width: 540, height: 26), 14, gray, .medium, .center)
    field("Organization", "Your Club  ▾", NSRect(x: 690, y: 560, width: 540, height: 54))
    field("Last name", "Morgan", NSRect(x: 690, y: 465, width: 255, height: 54), selected: true)
    field("Member number", "DEMO-1001", NSRect(x: 975, y: 465, width: 255, height: 54))
    rounded(NSRect(x: 690, y: 365, width: 540, height: 58), 11, navy2); text("Continue securely", NSRect(x: 690, y: 381, width: 540, height: 27), 16, .white, .bold, .center)
    rounded(NSRect(x: 690, y: 285, width: 540, height: 52), 11, pale)
    text("Next: confirm the roster email and create a password", NSRect(x: 715, y: 301, width: 490, height: 22), 12, teal, .semibold, .center)
    callout("2", "Name + number + roster email", NSRect(x: 1190, y: 580, width: 310, height: 52)); cursor(NSPoint(x: 1060, y: 493))
}

try render("03-gallery.png", step: "3 · Familiar member experience", title: "A private photo feed members already know how to use", url: "clubphotohub.xtide.io/app?demo=1") { c in
    cream.setFill(); NSBezierPath(rect: c).fill(); appHeader(c, active: "Member Gallery")
    let top = c.maxY - 118
    for (index, label) in ["All", "General", "Tennis", "Golf", "Dining", "Events"].enumerated() { let w: CGFloat = index == 0 ? 58 : 92; let x = c.minX + 52 + CGFloat(index)*110; rounded(NSRect(x: x, y: top - 45, width: w, height: 33), 17, index == 0 ? navy2 : .white, stroke: index == 0 ? nil : NSColor(calibratedWhite: 0.84, alpha: 1)); text(label, NSRect(x: x, y: top - 36, width: w, height: 18), 11, index == 0 ? .white : gray, .semibold, .center) }
    let card = NSRect(x: 510, y: 92, width: 900, height: 610); rounded(card, 15, .white, stroke: NSColor(calibratedWhite: 0.86, alpha: 1))
    navy.setFill(); NSBezierPath(ovalIn: NSRect(x: 545, y: 635, width: 44, height: 44)).fill(); text("AM", NSRect(x: 545, y: 648, width: 44, height: 18), 10, .white, .bold, .center)
    text("Alex Morgan", NSRect(x: 607, y: 649, width: 250, height: 22), 14, navy, .bold); text("Today · Events", NSRect(x: 607, y: 628, width: 250, height: 19), 10, gray, .medium)
    fillImage("public/demo/lakeside-social.jpg", NSRect(x: 510, y: 180, width: 900, height: 430))
    text("♡  28       ⇩", NSRect(x: 545, y: 132, width: 260, height: 32), 22, navy, .semibold)
    text("Alex Morgan  Golden hour on the terrace with friends.", NSRect(x: 545, y: 103, width: 720, height: 25), 12, navy, .medium)
    callout("3", "Like · zoom · download", NSRect(x: 1260, y: 120, width: 265, height: 52)); cursor(NSPoint(x: 726, y: 154))
}

try render("04-upload.png", step: "4 · Mobile-first uploads", title: "Select, caption and publish multiple photos together", url: "clubphotohub.xtide.io/app/upload") { c in
    cream.setFill(); NSBezierPath(rect: c).fill(); appHeader(c, active: "Upload Photo")
    let panel = NSRect(x: 245, y: 120, width: 1430, height: 600); rounded(panel, 20, .white, stroke: NSColor(calibratedWhite: 0.86, alpha: 1))
    text("Share Your Club Moments", NSRect(x: 310, y: 650, width: 560, height: 45), 34, navy, .semibold, serif: true)
    let drop = NSRect(x: 310, y: 245, width: 520, height: 350); rounded(drop, 18, cream, stroke: gray, width: 2)
    gold.setFill(); NSBezierPath(ovalIn: NSRect(x: 505, y: 470, width: 120, height: 120)).fill(); text("↑", NSRect(x: 505, y: 493, width: 120, height: 70), 50, .white, .bold, .center)
    text("Choose photos", NSRect(x: 385, y: 410, width: 370, height: 34), 22, navy, .bold, .center); text("Camera roll · HEIC ready · Bulk upload", NSRect(x: 355, y: 370, width: 430, height: 24), 12, gray, .medium, .center)
    let queue = NSRect(x: 875, y: 245, width: 730, height: 350); rounded(queue, 14, pale)
    fillImage("public/demo/tennis-social.jpg", NSRect(x: 905, y: 350, width: 250, height: 210))
    rounded(NSRect(x: 1185, y: 495, width: 370, height: 52), 9, .white, stroke: NSColor(calibratedWhite: 0.82, alpha: 1)); text("Tennis  ▾", NSRect(x: 1200, y: 511, width: 340, height: 22), 13, navy, .semibold)
    rounded(NSRect(x: 1185, y: 415, width: 370, height: 64), 9, .white, stroke: NSColor(calibratedWhite: 0.82, alpha: 1)); text("A close match and a lot of laughs!", NSRect(x: 1200, y: 431, width: 340, height: 30), 12, navy, .medium)
    rounded(NSRect(x: 1185, y: 340, width: 370, height: 52), 10, gold); text("Upload all photos", NSRect(x: 1185, y: 355, width: 370, height: 23), 14, navy, .bold, .center)
    callout("4", "Preview every caption", NSRect(x: 1315, y: 585, width: 240, height: 52)); cursor(NSPoint(x: 1370, y: 448))
}

try render("05-admin.png", step: "5 · Organization controls", title: "Manage the roster and moderate content from one place", url: "clubphotohub.xtide.io/app/admin") { c in
    pale.setFill(); NSBezierPath(rect: c).fill(); appHeader(c, active: "Admin Portal", admin: true)
    text("Club overview", NSRect(x: 160, y: 685, width: 350, height: 42), 30, navy, .bold, serif: true)
    let stats = [("248", "Members"), ("1,426", "Photos"), ("18.4 GB", "Storage used")]
    for (index, stat) in stats.enumerated() { let x = 160 + CGFloat(index)*330; rounded(NSRect(x: x, y: 570, width: 290, height: 92), 13, .white, stroke: NSColor(calibratedWhite: 0.84, alpha: 1)); text(stat.0, NSRect(x: x+20, y: 610, width: 250, height: 30), 24, navy, .bold); text(stat.1, NSRect(x: x+20, y: 586, width: 250, height: 20), 11, gray, .semibold) }
    rounded(NSRect(x: 160, y: 150, width: 1310, height: 375), 16, .white, stroke: NSColor(calibratedWhite: 0.84, alpha: 1))
    text("Member directory", NSRect(x: 195, y: 475, width: 350, height: 30), 19, navy, .bold)
    rounded(NSRect(x: 1230, y: 460, width: 200, height: 42), 9, teal); text("+ Add member", NSRect(x: 1230, y: 472, width: 200, height: 20), 12, .white, .bold, .center)
    let headers = ["MEMBER", "NUMBER", "ROSTER EMAIL", "STATUS"]
    let xs: [CGFloat] = [195, 545, 750, 1160]
    for (i, h) in headers.enumerated() { text(h, NSRect(x: xs[i], y: 420, width: 290, height: 20), 10, gray, .bold) }
    let rows = [("Alex Morgan", "DEMO-1001", "member@example.com", "Active"), ("Jordan Lee", "DEMO-1002", "jordan@example.com", "Active"), ("Taylor Chen", "DEMO-1003", "taylor@example.com", "Invited")]
    for (row, data) in rows.enumerated() { let y = 365 - CGFloat(row)*78; line(NSPoint(x: 195, y: y-12), NSPoint(x: 1435, y: y-12), color: NSColor(calibratedWhite: 0.9, alpha: 1)); text(data.0, NSRect(x: xs[0], y: y, width: 310, height: 24), 13, navy, .semibold); text(data.1, NSRect(x: xs[1], y: y, width: 180, height: 24), 12, gray, .medium); text(data.2, NSRect(x: xs[2], y: y, width: 360, height: 24), 12, gray, .medium); rounded(NSRect(x: xs[3], y: y-1, width: 92, height: 26), 13, data.3 == "Active" ? teal.withAlphaComponent(0.12) : gold.withAlphaComponent(0.22)); text(data.3, NSRect(x: xs[3], y: y+6, width: 92, height: 15), 10, data.3 == "Active" ? teal : NSColor(calibratedRed: 0.55, green: 0.4, blue: 0.15, alpha: 1), .bold, .center) }
    callout("5", "Club-owned member access", NSRect(x: 1375, y: 550, width: 300, height: 52)); cursor(NSPoint(x: 1360, y: 486))
}

try render("06-privacy.png", step: "6 · Privacy controls", title: "Members control their account and uploaded content", url: "clubphotohub.xtide.io/app/account") { c in
    cream.setFill(); NSBezierPath(rect: c).fill(); appHeader(c, active: "Member Gallery")
    text("Account & privacy", NSRect(x: 430, y: 680, width: 500, height: 45), 34, navy, .bold, serif: true)
    rounded(NSRect(x: 430, y: 555, width: 1060, height: 95), 15, .white, stroke: NSColor(calibratedWhite: 0.85, alpha: 1)); navy.setFill(); NSBezierPath(ovalIn: NSRect(x: 460, y: 578, width: 50, height: 50)).fill(); text("AM", NSRect(x: 460, y: 594, width: 50, height: 18), 11, .white, .bold, .center); text("Alex Morgan", NSRect(x: 530, y: 606, width: 300, height: 22), 15, navy, .bold); text("Member DEMO-1001 · Your Club", NSRect(x: 530, y: 580, width: 430, height: 21), 11, gray, .medium)
    rounded(NSRect(x: 430, y: 425, width: 1060, height: 100), 15, teal.withAlphaComponent(0.08), stroke: teal.withAlphaComponent(0.25)); text("Protected account", NSRect(x: 470, y: 482, width: 300, height: 24), 15, teal, .bold); text("Private sessions, email verification and organization-scoped access.", NSRect(x: 470, y: 451, width: 760, height: 22), 12, gray, .medium)
    rounded(NSRect(x: 430, y: 255, width: 1060, height: 135), 15, NSColor(calibratedRed: 1, green: 0.98, blue: 0.98, alpha: 1), stroke: NSColor(calibratedRed: 0.9, green: 0.75, blue: 0.75, alpha: 1)); text("Delete my account", NSRect(x: 470, y: 335, width: 350, height: 24), 15, navy, .bold); text("Remove your account, likes and every photo you uploaded.", NSRect(x: 470, y: 303, width: 650, height: 22), 12, gray, .medium); rounded(NSRect(x: 1200, y: 295, width: 230, height: 44), 9, .white, stroke: NSColor.systemRed); text("Delete account", NSRect(x: 1200, y: 308, width: 230, height: 20), 12, NSColor.systemRed, .bold, .center)
    callout("6", "Built-in privacy choices", NSRect(x: 1185, y: 390, width: 275, height: 52)); cursor(NSPoint(x: 1320, y: 320))
}

let finalImage = NSImage(size: NSSize(width: 1920, height: 1080)); finalImage.lockFocus()
NSGradient(colors: [navy, teal])?.draw(in: NSRect(x: 0, y: 0, width: 1920, height: 1080), angle: 18)
text("CLUB PHOTOHUB", NSRect(x: 140, y: 910, width: 700, height: 40), 22, gold, .bold)
text("A private photo home\nfor every community.", NSRect(x: 135, y: 555, width: 1000, height: 300), 92, .white, .semibold, serif: true)
text("Private pilot now accepting organizations", NSRect(x: 145, y: 475, width: 850, height: 40), 26, NSColor(calibratedWhite: 1, alpha: 0.78), .medium)
rounded(NSRect(x: 145, y: 340, width: 440, height: 70), 13, gold); text("Request pilot access", NSRect(x: 145, y: 361, width: 440, height: 30), 18, navy, .bold, .center)
text("$60 CAD monthly · $600 annually · 25 GB included", NSRect(x: 145, y: 280, width: 840, height: 30), 18, NSColor(calibratedWhite: 1, alpha: 0.62), .medium)
rounded(NSRect(x: 1160, y: 190, width: 570, height: 700), 30, .white)
fillImage("public/demo/product-feed.png", NSRect(x: 1190, y: 220, width: 510, height: 640))
text("clubphotohub.xtide.io · Operated by xTide Apps", NSRect(x: 145, y: 80, width: 900, height: 30), 15, NSColor(calibratedWhite: 1, alpha: 0.48), .medium)
finalImage.unlockFocus(); try save(finalImage, "07-cta.png")
