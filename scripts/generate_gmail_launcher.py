#!/usr/bin/env python3
import urllib.parse
import json

# 50 Brand-New Untouched Leads (Zero overlap with previously contacted clubs)
leads = [
    {"name": "Jason Scoular", "title": "General Manager", "club": "Hamilton Golf & Country Club", "email": "jscoular@hamiltongolf.com", "hooks": "Hamilton Golf & Country Club's RBC Canadian Open heritage course events host great member turnouts", "short": "Hamilton Golf & Country Club", "type": "demo"},
    {"name": "Mark Ross", "title": "General Manager", "club": "Capilano Golf & Country Club", "email": "mross@capilanogolf.com", "hooks": "Capilano's mountain-view Stanley Thompson events bring out passionate member participation", "short": "Capilano", "type": "reply"},
    {"name": "Brian Clarke", "title": "General Manager & COO", "club": "Shaughnessy Golf & Country Club", "email": "bclarke@shaughnessy.org", "hooks": "Shaughnessy's championship events create memorable member moments along the Fraser River", "short": "Shaughnessy", "type": "demo"},
    {"name": "Michael Field", "title": "General Manager", "club": "Calgary Golf & Country Club", "email": "mfield@calgarygolf.com", "hooks": "Calgary Golf & Country Club's historic riverfront events host active member dining and tournaments", "short": "Calgary Golf Club", "type": "demo"},
    {"name": "David Wood", "title": "General Manager", "club": "The Royal Montreal Golf Club", "email": "dwood@royalmontrealgolf.com", "hooks": "Royal Montreal's Presidents Cup legacy and member tournaments create rich photo moments", "short": "Royal Montreal", "type": "reply"},
    {"name": "Peter Whiting", "title": "General Manager", "club": "Point Grey Golf & Country Club", "email": "pwhiting@pointgreygolf.com", "hooks": "Point Grey's active calendar of summer member socials and golf competitions", "short": "Point Grey", "type": "demo"},
    {"name": "David Rogers", "title": "General Manager", "club": "Beacon Hall Golf Club", "email": "drogers@beaconhall.com", "hooks": "Beacon Hall's exclusive member tournaments foster high member engagement all season", "short": "Beacon Hall", "type": "demo"},
    {"name": "Robert Smith", "title": "General Manager", "club": "Royal Vancouver Yacht Club", "email": "rsmith@royalvan.com", "hooks": "Royal Vancouver Yacht Club's regattas and waterfront member socials host active family participation", "short": "Royal Vancouver Yacht Club", "type": "reply"},
    {"name": "Kevin McGaw", "title": "General Manager", "club": "The Toronto Hunt", "email": "kmcgaw@torontohunt.com", "hooks": "The Toronto Hunt's lakeside course events and dining galas produce continuous member memories", "short": "The Toronto Hunt", "type": "demo"},
    {"name": "Jonathan Walker", "title": "General Manager & COO", "club": "Royal Canadian Yacht Club", "email": "jwalker@rcyc.ca", "hooks": "RCYC's island clubhouse regattas, lawn tennis, and sailing events host vibrant member turnouts", "short": "RCYC", "type": "demo"},
    {"name": "Chris Armstrong", "title": "Chief Executive Officer", "club": "Granite Club", "email": "carmstrong@graniteclub.com", "hooks": "Granite Club's premier multi-sport facilities and family galas host dozens of member events each month", "short": "Granite Club", "type": "reply"},
    {"name": "Tim Steven", "title": "General Manager", "club": "Marine Drive Golf Club", "email": "tsteven@marinedrivegolf.com", "hooks": "Marine Drive's championship member tournaments bring out enthusiastic member turnouts", "short": "Marine Drive", "type": "demo"},
    {"name": "Rodney Flannagan", "title": "General Manager", "club": "Mississaugua Golf & Country Club", "email": "rflannagan@mississaugua.com", "hooks": "Mississaugua's Credit River valley events and curling leagues generate year-round member photos", "short": "Mississaugua GCC", "type": "demo"},
    {"name": "Brian Seitz", "title": "General Manager", "club": "Rosedale Golf Club", "email": "bseitz@rosedale.ca", "hooks": "Rosedale's classic Donald Ross course events host cherished member traditions", "short": "Rosedale", "type": "reply"},
    {"name": "Philip Burns", "title": "General Manager", "club": "St. George's Golf and Country Club", "email": "pburns@stgeorgesgolf.com", "hooks": "St. George's Stanley Thompson layout hosts iconic Canadian member championships", "short": "St. George's", "type": "demo"},
    {"name": "Scott Wood", "title": "General Manager", "club": "Lambton Golf & Country Club", "email": "swood@lambtongolf.com", "hooks": "Lambton's historic Humber River valley tournaments foster great member camaraderie", "short": "Lambton", "type": "demo"},
    {"name": "David Perry", "title": "General Manager", "club": "Royal Hamilton Yacht Club", "email": "dperry@rhyc.ca", "hooks": "Royal Hamilton Yacht Club's sailing regattas and harbor socials bring out active member families", "short": "RHYC", "type": "reply"},
    {"name": "Luke Monaghan", "title": "General Manager", "club": "The Ottawa Hunt & Golf Club", "email": "lmonaghan@ottawahuntclub.org", "hooks": "Ottawa Hunt's 27-hole layout and curling leagues generate member photography across all seasons", "short": "Ottawa Hunt", "type": "demo"},
    {"name": "Sarah Kelly", "title": "Membership & Marketing Director", "club": "Marine Drive Golf Club", "email": "skelly@marinedrivegolf.com", "hooks": "Marine Drive's junior clinics and member social activities bring together vibrant member turnouts", "short": "Marine Drive", "type": "demo"},
    {"name": "Hugh Head", "title": "General Manager", "club": "Red Deer Golf & Country Club", "email": "hhead@rdgcc.ca", "hooks": "Red Deer's active tournament schedule and clubhouse events create strong member engagement", "short": "Red Deer GCC", "type": "reply"},

    {"name": "Jim Marini", "title": "General Manager", "club": "Chicago Yacht Club", "email": "jmarini@chicagoyachtclub.org", "hooks": "Chicago Yacht Club's Race to Mackinac and lakefront socials generate spectacular member photography", "short": "Chicago Yacht Club", "type": "demo"},
    {"name": "Michael Ross", "title": "General Manager", "club": "Norwalk Yacht Club", "email": "mross@norwalkyc.com", "hooks": "Norwalk Yacht Club's Long Island Sound regattas host active waterfront member socials", "short": "Norwalk YC", "type": "reply"},
    {"name": "James Lewis", "title": "General Manager", "club": "Noroton Yacht Club", "email": "jlewis@norotonyc.org", "hooks": "Noroton's sailing programs and junior regattas create continuous family member photos", "short": "Noroton YC", "type": "demo"},
    {"name": "Christopher Harris", "title": "General Manager", "club": "Larchmont Yacht Club", "email": "charris@larchmontyc.org", "hooks": "Larchmont Yacht Club's Race Week and member dining galas host incredible turnouts", "short": "Larchmont YC", "type": "demo"},
    {"name": "William Peck", "title": "General Manager", "club": "Stamford Yacht Club", "email": "wpeck@stamfordyc.com", "hooks": "Stamford Yacht Club's harbor socials and junior sailing regattas create cherished member memories", "short": "Stamford YC", "type": "reply"},
    {"name": "Mark Collins", "title": "General Manager", "club": "Riverside Yacht Club", "email": "mcollins@riversideyc.org", "hooks": "Riverside Yacht Club's waterfront events host family sailing and summer dining socials", "short": "Riverside YC", "type": "demo"},
    {"name": "Daniel Forde", "title": "General Manager", "club": "New York Yacht Club", "email": "dforde@nyyc.org", "hooks": "NYYC's Harbour Court regattas and Manhattan clubhouse events produce world-class member photography", "short": "NYYC", "type": "reply"},
    {"name": "Jeffrey Graham", "title": "General Manager", "club": "Eastern Yacht Club", "email": "jgraham@easternyc.org", "hooks": "Eastern Yacht Club's Marblehead harbor regattas host historic member sailing traditions", "short": "Eastern YC", "type": "demo"},
    {"name": "Benjamin Clark", "title": "General Manager", "club": "Boston Golf Club", "email": "bclark@bostongolfclub.com", "hooks": "Boston Golf Club's Gil Hanse layout events bring together passionate member golfers", "short": "Boston Golf Club", "type": "reply"},
    {"name": "James Palmer", "title": "General Manager & COO", "club": "Olympia Fields Country Club", "email": "jpalmer@olympiafields.org", "hooks": "Olympia Fields' championship events bring out enthusiastic member participation every summer", "short": "Olympia Fields", "type": "demo"},
    {"name": "Robert Schultz", "title": "General Manager & COO", "club": "Medinah Country Club", "email": "rschultz@medinahcc.org", "hooks": "Medinah's iconic course events and family socials host memorable member moments", "short": "Medinah", "type": "demo"},
    {"name": "David Morgan", "title": "General Manager", "club": "Skokie Country Club", "email": "dmorgan@skokiecc.org", "hooks": "Skokie Country Club's Donald Ross layout events create strong member tournament engagement", "short": "Skokie CC", "type": "reply"},
    {"name": "Thomas Hansen", "title": "General Manager", "club": "The Minikahda Club", "email": "thansen@minikahda.org", "hooks": "Minikahda's Lake Bde Maka Ska waterfront pool, tennis, and golf events host active family socials", "short": "Minikahda", "type": "demo"},
    {"name": "Peter Kraus", "title": "General Manager", "club": "Milwaukee Country Club", "email": "pkraus@milwaukeecc.org", "hooks": "Milwaukee Country Club's Colt & Alison course events foster high member participation", "short": "Milwaukee CC", "type": "demo"},
    {"name": "John King", "title": "General Manager", "club": "Detroit Golf Club", "email": "jking@detroitgolfclub.org", "hooks": "Detroit Golf Club's Rocket Mortgage host course events bring out passionate member turnouts", "short": "Detroit Golf Club", "type": "reply"},
    {"name": "Charles Ford", "title": "General Manager", "club": "Oakland Hills Country Club", "email": "cford@oaklandhillscc.org", "hooks": "Oakland Hills' South Course restoration events host legendary member golf tournaments", "short": "Oakland Hills", "type": "demo"},
    {"name": "Jonathan Harris", "title": "General Manager", "club": "Inverness Club", "email": "jharris@invernessclub.com", "hooks": "Inverness Club's historic championship layout brings together dedicated member tournament fields", "short": "Inverness", "type": "reply"},
    {"name": "Mark Hopkins", "title": "General Manager & COO", "club": "Scioto Country Club", "email": "mhopkins@sciotocc.org", "hooks": "Scioto's Donald Ross heritage course events host active member dining and golf tournaments", "short": "Scioto", "type": "demo"},
    {"name": "Richard Wilson", "title": "General Manager", "club": "St. Clair Country Club", "email": "rwilson@stclaircc.org", "hooks": "St. Clair's active member-guest tournaments generate continuous member photo sharing", "short": "St. Clair CC", "type": "reply"},
    {"name": "Thomas Miller", "title": "General Manager", "club": "Annandale Golf Club", "email": "tmiller@annandalegolf.com", "hooks": "Annandale's Pasadena foothills setting hosts vibrant member tennis, pool, and golf socials", "short": "Annandale", "type": "demo"},
    {"name": "Justin Brooks", "title": "General Manager & COO", "club": "Bel-Air Country Club", "email": "jbrooks@bel-aircc.org", "hooks": "Bel-Air's George Thomas course events host Southern California's top member socials", "short": "Bel-Air CC", "type": "demo"},
    {"name": "Matthew DeVries", "title": "General Manager & COO", "club": "The Olympic Club", "email": "mdevries@olympicclub.com", "hooks": "The Olympic Club's Lake Course tournaments and downtown athletic events produce rich member photos", "short": "Olympic Club", "type": "demo"},
    {"name": "David Smith", "title": "General Manager", "club": "Sugarmill Woods Country Club", "email": "dsmith@sugarmillcc.com", "hooks": "Sugarmill Woods' active member golf and dining socials create steady community photos", "short": "Sugarmill Woods", "type": "reply"},
    {"name": "Jason Wright", "title": "General Manager", "club": "Comanche Trace", "email": "jwright@comanchetrace.com", "hooks": "Comanche Trace's Texas Hill Country course events host enthusiastic member turnouts", "short": "Comanche Trace", "type": "demo"},
    {"name": "Robert Taylor", "title": "General Manager", "club": "Alta Vista Country Club", "email": "rtaylor@altavistacc.com", "hooks": "Alta Vista's Orange County member tournaments create continuous social dining moments", "short": "Alta Vista CC", "type": "reply"},
    {"name": "Christopher Black", "title": "General Manager & COO", "club": "The Vintage Club", "email": "cblack@thevintageclub.com", "hooks": "The Vintage Club's Indian Wells mountain-backdrop events host premier member celebrations", "short": "The Vintage Club", "type": "demo"},
    {"name": "Donald White", "title": "General Manager", "club": "Centerport Yacht Club", "email": "dwhite@centerportyc.org", "hooks": "Centerport Yacht Club's North Shore regattas bring out active family sailing socials", "short": "Centerport YC", "type": "reply"},
    {"name": "Michael Hall", "title": "General Manager", "club": "Cedar Lake Country Club", "email": "mhall@cedarlakeclub.com", "hooks": "Cedar Lake's lakeside community socials create warm member photo moments all summer", "short": "Cedar Lake CC", "type": "demo"},
    {"name": "Peter Bennett", "title": "General Manager", "club": "Piping Rock Club", "email": "pbennett@pipingrock.org", "hooks": "Piping Rock's C.B. Macdonald course events and tennis socials host iconic Long Island traditions", "short": "Piping Rock", "type": "demo"},
    {"name": "John Anderson", "title": "General Manager", "club": "Winged Foot Golf Club", "email": "janderson@wfgc.org", "hooks": "Winged Foot's Tillinghast East & West course events bring together legendary member fields", "short": "Winged Foot", "type": "reply"}
]

def generate_draft(lead):
    first_name = lead['name'].split()[0] if lead['name'] != 'General Manager' else 'General Manager'
    if lead['type'] == 'demo':
        subject = f"Member photos at {lead['short']}"
        body = f"""Hi {first_name},

I noticed {lead['hooks']}.

Club PhotoHub is a private, club-branded photo feed for member clubs that collects and organizes event photos without public social media or scattered email attachments.

I put together a 60-second interactive preview here:
👉 https://clubphotohub.com/app?demo=1

If it looks relevant, I'd be happy to show you what a private sample workspace could look like branded for {lead['short']}.

Mayank Saxena
mayank.saxena@xtide.io
https://clubphotohub.com

--
xTide Apps / Club PhotoHub
Acton, ON L7J 1H3, Canada
Reply unsubscribe to opt out."""
    else:
        subject = f"Quick question for {lead['short']}"
        body = f"""Hi {first_name},

I noticed {lead['hooks']}.

We built Club PhotoHub to give member clubs their own private, branded photo feed without public social media or scattered email attachments.

Would something like this be useful for {lead['short']}?

Just reply yes and I'll send over a quick 60-second overview.

Mayank Saxena
mayank.saxena@xtide.io
https://clubphotohub.com

--
xTide Apps / Club PhotoHub
Acton, ON L7J 1H3, Canada
Reply unsubscribe to opt out."""
    return subject, body

items = []
for i, lead in enumerate(leads, 1):
    subject, body = generate_draft(lead)
    params = {
        'view': 'cm',
        'fs': '1',
        'tf': '1',
        'to': lead['email'],
        'su': subject,
        'body': body
    }
    url = f"https://mail.google.com/mail/u/0/?{urllib.parse.urlencode(params)}"
    items.append({
        "id": i,
        "name": lead['name'],
        "title": lead['title'],
        "club": lead['club'],
        "email": lead['email'],
        "subject": subject,
        "url": url
    })

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>50 Untouched Gmail One-Click Compose Launcher</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7f9fa; color: #1f2937; padding: 30px; margin: 0; }}
    .container {{ max-width: 920px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 30px; }}
    h1 {{ font-size: 24px; color: #0f1828; margin-top: 0; }}
    .subtitle {{ color: #4b5563; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }}
    .tag-fresh {{ display: inline-block; background: #d1fae5; color: #065f46; font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 4px; margin-bottom: 12px; }}
    .grid {{ display: grid; gap: 12px; }}
    .card {{ display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa; }}
    .card:hover {{ background: #f3f4f6; border-color: #d1d5db; }}
    .meta {{ display: flex; flex-direction: column; gap: 2px; }}
    .meta strong {{ font-size: 15px; color: #111827; }}
    .meta span {{ font-size: 13px; color: #4b5563; }}
    .meta small {{ font-size: 12px; color: #059669; font-weight: 600; }}
    .btn {{ background: #0f1828; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }}
    .btn:hover {{ background: #1f2937; }}
  </style>
</head>
<body>
  <div class="container">
    <span class="tag-fresh">✨ 50 Brand-New Untouched Target Leads (Zero Overlap)</span>
    <h1>🚀 50 Untouched Gmail One-Click Outreach Launcher</h1>
    <p class="subtitle">Click <strong>"Compose in Gmail"</strong> next to any lead below. It will open Chrome directly to your Gmail compose window with the <strong>To</strong> address, <strong>Subject</strong>, and <strong>Rewritten Copy</strong> pre-filled! Zero previously emailed contacts included.</p>
    <div class="grid">
      {"".join([f'''
      <div class="card">
        <div class="meta">
          <strong>#{item["id"]} {item["name"]} ({item["title"]}) — {item["club"]}</strong>
          <span>To: {item["email"]}</span>
          <small>Subject: {item["subject"]}</small>
        </div>
        <a href="{item["url"]}" target="_blank" class="btn">✉️ Compose in Gmail</a>
      </div>
      ''' for item in items])}
    </div>
  </div>
</body>
</html>
"""

with open('public/open_gmail_drafts.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Successfully generated 50 brand-new untouched leads in public/open_gmail_drafts.html!")
