#!/usr/bin/env python3
import urllib.parse
import json

leads = [
    {"name": "Patrick Holleran", "title": "General Manager & COO", "club": "The National Golf Club of Canada", "email": "pholleran@nationalgolfclub.com", "hooks": "The National runs a pretty active calendar of championship member tournaments", "short": "The National", "type": "demo"},
    {"name": "Joseph Nasso", "title": "General Manager & COO", "club": "The Thornhill Club", "email": "jnasso@thethornhillclub.ca", "hooks": "Thornhill hosts an active calendar of member socials and golf/curling tournaments", "short": "The Thornhill Club", "type": "reply"},
    {"name": "Dave Allen", "title": "General Manager & COO", "club": "Islington Golf Club", "email": "dallen@islingtongolfclub.com", "hooks": "Islington's Stanley Thompson course events bring out great member turnouts during summer socials", "short": "Islington", "type": "demo"},
    {"name": "Kimberly Suddaby", "title": "Membership & Marketing Director", "club": "Bayview Golf & Country Club", "email": "ksuddaby@bayviewclub.com", "hooks": "Bayview's multi-sport calendar spanning golf, tennis and curling generates continuous member photos", "short": "Bayview", "type": "demo"},
    {"name": "Jason Wyatt", "title": "General Manager", "club": "Credit Valley Golf & Country Club", "email": "jwyatt@creditvalleybf.com", "hooks": "Credit Valley's river-valley clubhouse events host large member turnouts every summer", "short": "Credit Valley", "type": "reply"},
    {"name": "Ian Leggatt", "title": "General Manager", "club": "Meadowbrook Golf Club", "email": "ileggatt@meadowbrookgolf.net", "hooks": "Meadowbrook's active member tournaments create a steady stream of event photography across the season", "short": "Meadowbrook", "type": "demo"},
    {"name": "Markus Giesler", "title": "General Manager & COO", "club": "Donalda Club", "email": "mgiesler@donaldaclub.ca", "hooks": "Donalda's extensive family events and tennis socials host great member moments throughout the summer", "short": "Donalda", "type": "demo"},
    {"name": "Robb Walker", "title": "General Manager", "club": "Devil's Pulpit Golf Association", "email": "rwalker@pulpitridge.com", "hooks": "the Pulpit & Ridge dual-course member events bring together passionate golfers for memorable weekend tournaments", "short": "Devil's Pulpit", "type": "reply"},
    {"name": "Scott Kolb", "title": "General Manager", "club": "Victoria Golf Club", "email": "skolb@victoriagolfclub.ca", "hooks": "Victoria Golf Club's coastal links events host some of BC's most historic member competitions", "short": "Victoria Golf Club", "type": "demo"},
    {"name": "Greg Richardson", "title": "General Manager", "club": "The Glencoe Club", "email": "grichardson@glencoe.org", "hooks": "Glencoe's premier multi-sport facilities host dozens of member tournaments and social galas each month", "short": "The Glencoe Club", "type": "demo"},
    {"name": "Richard Creighton", "title": "General Manager", "club": "Vancouver Golf Club", "email": "rcreighton@vancouvergolfclub.com", "hooks": "Vancouver Golf Club hosts an active calendar of member socials and golf competitions", "short": "Vancouver Golf Club", "type": "reply"},
    {"name": "Jeff Calderwood", "title": "General Manager", "club": "The Royal Ottawa Golf Club", "email": "jcalderwood@rogc.com", "hooks": "Royal Ottawa's historic member competitions generate great photography across golf and curling seasons", "short": "Royal Ottawa", "type": "demo"},
    {"name": "Wade Hudyma", "title": "General Manager", "club": "Royal Mayfair Golf Club", "email": "whudyma@mayfair.ca", "hooks": "Royal Mayfair's river valley events bring out strong member turnouts for summer tournaments", "short": "Royal Mayfair", "type": "demo"},
    {"name": "Cameron Chapman", "title": "General Manager", "club": "St. Charles Country Club", "email": "cchapman@stcharlescountryclub.ca", "hooks": "St. Charles' 27-hole championship events create fantastic member photo opportunities all season long", "short": "St. Charles", "type": "reply"},
    {"name": "Gordie Smith", "title": "General Manager", "club": "Ashburn Golf Club", "email": "gsmith@ashburngolfclub.com", "hooks": "Ashburn's dual-course member tournaments bring together Maritime club golfers for annual celebrations", "short": "Ashburn Golf Club", "type": "demo"},
    {"name": "General Manager", "title": "General Manager", "club": "Wascana Country Club", "email": "info@wascanacountryclub.com", "hooks": "Wascana's wetland-course member events feature active social dining and summer tournaments", "short": "Wascana", "type": "reply"},
    {"name": "Trevor Fackrell", "title": "General Manager", "club": "Burlington Golf & Country Club", "email": "tfackrell@bgcc.ca", "hooks": "Burlington's bayfront clubhouse socials and curling tournaments produce continuous member moments", "short": "Burlington GCC", "type": "demo"},
    {"name": "Jeff Germond", "title": "General Manager", "club": "The Weston Golf & Country Club", "email": "jgermond@westongolfclub.com", "hooks": "Weston's Arnold Palmer heritage course events bring out passionate member turnouts every weekend", "short": "Weston Golf Club", "type": "demo"},
    {"name": "Aidan Blunt", "title": "General Manager", "club": "Beach Grove Golf & Country Club", "email": "ablunt@beachgrove.net", "hooks": "Beach Grove's waterfront pool, tennis, and golf socials host continuous family activities during summer", "short": "Beach Grove", "type": "reply"},
    {"name": "Jonathyn Quigley", "title": "General Manager", "club": "Cataraqui Golf & Country Club", "email": "jquigley@cataraqui.com", "hooks": "Cataraqui's Stanley Thompson layout and active curling program generate member photos year-round", "short": "Cataraqui", "type": "demo"},
    {"name": "Steven Friend", "title": "General Manager & COO", "club": "Canoe Brook Country Club", "email": "sfriend@canoebrook.org", "hooks": "Canoe Brook's 36-hole member tournaments host extensive social dining and tennis programs", "short": "Canoe Brook", "type": "demo"},
    {"name": "Kevin Vitale", "title": "General Manager", "club": "Baltusrol Golf Club", "email": "kvitale@baltusrol.org", "hooks": "Baltusrol's championship tradition brings out incredible member turnout for major club competitions", "short": "Baltusrol", "type": "demo"},
    {"name": "Thomas Bove", "title": "General Manager", "club": "Plainfield Country Club", "email": "tbove@plainfieldcc.com", "hooks": "Plainfield's Donald Ross course events host active member-guest weekends every season", "short": "Plainfield", "type": "reply"},
    {"name": "Dan Brierley", "title": "General Manager", "club": "Somerset Hills Country Club", "email": "dbrierley@somersethillscc.org", "hooks": "Somerset Hills' Tillinghast course events create memorable moments across tennis and golf tournaments", "short": "Somerset Hills", "type": "demo"},
    {"name": "Mark Peterson", "title": "General Manager", "club": "Pine Valley Golf Club", "email": "mpeterson@pinevalley.org", "hooks": "Pine Valley's historic member competitions produce cherished golf photography for members", "short": "Pine Valley", "type": "demo"},
    {"name": "Paul Levy", "title": "General Manager & COO", "club": "Merion Golf Club", "email": "plevy@meriongolfclub.com", "hooks": "Merion's famous wicker-basket course events host iconic member tournaments throughout the summer", "short": "Merion", "type": "demo"},
    {"name": "John Dorman", "title": "General Manager", "club": "Aronimink Golf Club", "email": "jdorman@aronimink.org", "hooks": "Aronimink's Donald Ross layout hosts extensive member social galas and summer competitions", "short": "Aronimink", "type": "reply"},
    {"name": "Tim Muessle", "title": "General Manager & COO", "club": "Philadelphia Cricket Club", "email": "tmuessle@philacricket.com", "hooks": "Philadelphia Cricket's multi-facility cricket, tennis, and golf events generate continuous member photos", "short": "Philly Cricket", "type": "demo"},
    {"name": "Tom Wallace", "title": "General Manager", "club": "Oakmont Country Club", "email": "twallace@oakmontcc.org", "hooks": "Oakmont's historic championship events bring together members for legendary club tournaments", "short": "Oakmont", "type": "demo"},
    {"name": "Bernard Lackner", "title": "Chief Executive Officer & GM", "club": "Fisher Island Club", "email": "blackner@fisherislandclub.com", "hooks": "Fisher Island's beach club and tennis socials create vibrant member moments across the island community", "short": "Fisher Island", "type": "demo"},
    {"name": "Kristen LaCount", "title": "General Manager & COO", "club": "The Country Club", "email": "klacount@tcbrookline.org", "hooks": "The Country Club's historic curling, tennis, and golf programs bring together generations of member families", "short": "The Country Club", "type": "demo"},
    {"name": "Peter Tunley", "title": "General Manager", "club": "Myopia Hunt Club", "email": "ptunley@myopiahuntclub.org", "hooks": "Myopia's polo, equestrian, and golf events host unique member traditions throughout the New England summer", "short": "Myopia Hunt Club", "type": "reply"},
    {"name": "Stephen Chiambretti", "title": "General Manager", "club": "Essex County Club", "email": "schiambretti@essexcc.org", "hooks": "Essex County Club's seaside Donald Ross events create active member turnouts for tennis and golf", "short": "Essex County Club", "type": "demo"},
    {"name": "Edward Hazzouri", "title": "General Manager", "club": "Wannamoisett Country Club", "email": "ehazzouri@wannamoisett.com", "hooks": "Wannamoisett's Northeast Amateur and member tournaments create high engagement across the summer", "short": "Wannamoisett", "type": "demo"},
    {"name": "Robert Miller", "title": "General Manager", "club": "Quaker Ridge Golf Club", "email": "rmiller@quakerridge.org", "hooks": "Quaker Ridge's A.W. Tillinghast layout events bring out enthusiastic member tournament turnouts", "short": "Quaker Ridge", "type": "reply"},
    {"name": "Marco Sforza", "title": "General Manager", "club": "Sleepy Hollow Country Club", "email": "msforza@sleepyhollowcc.org", "hooks": "Sleepy Hollow's Hudson Valley estate clubhouse hosts spectacular member weddings and golf galas", "short": "Sleepy Hollow", "type": "demo"},
    {"name": "Ken Bakst", "title": "General Manager", "club": "Friar's Head Golf Club", "email": "kbakst@friarshead.org", "hooks": "Friar's Head coastal bluff events offer members unparalleled private golf experiences", "short": "Friar's Head", "type": "demo"},
    {"name": "General Manager", "title": "General Manager", "club": "Whitemarsh Valley Country Club", "email": "gm@whitemarshvalleycc.com", "hooks": "Whitemarsh Valley's classic course events foster strong member camaraderie during summer tournaments", "short": "Whitemarsh Valley", "type": "reply"},
    {"name": "Jim Morrison", "title": "General Manager", "club": "The Riviera Country Club", "email": "jmorrison@therivieracountryclub.com", "hooks": "Riviera's iconic clubhouse events and tennis socials host Southern California's premier club gatherings", "short": "Riviera CC", "type": "demo"},
    {"name": "Paul Astbury", "title": "General Manager & COO", "club": "Los Angeles Country Club", "email": "pastbury@thelacc.org", "hooks": "LACC's North & South course events bring out incredible member turnouts for seasonal competitions", "short": "LACC", "type": "demo"},
    {"name": "Todd Keefer", "title": "General Manager", "club": "Wilshire Country Club", "email": "tkeefer@wilshirecountryclub.com", "hooks": "Wilshire's Hancock Park course events create continuous member photo moments all year", "short": "Wilshire CC", "type": "reply"},
    {"name": "David Pfaeffle", "title": "General Manager", "club": "San Francisco Golf Club", "email": "dpfaeffle@sfgolfclub.org", "hooks": "SFGC's historic Tillinghast course events maintain revered member traditions", "short": "SFGC", "type": "demo"},
    {"name": "Michael Rood", "title": "General Manager", "club": "California Golf Club of San Francisco", "email": "mrood@calclub.org", "hooks": "Cal Club's restored MacRay/Norfolk layout events host passionate member golf competitions", "short": "Cal Club", "type": "demo"},
    {"name": "David Robinson", "title": "General Manager", "club": "Meadow Club", "email": "drobinson@meadowclub.org", "hooks": "Meadow Club's Alister MacKenzie heritage course events create rich member photo memories", "short": "Meadow Club", "type": "demo"},
    {"name": "J.J. West", "title": "General Manager", "club": "Monterey Peninsula Country Club", "email": "jjwest@mpcc.org", "hooks": "MPCC's Dunes and Shore course events host coastal member celebrations throughout the year", "short": "MPCC", "type": "demo"},
    {"name": "Rob Oosterhuis", "title": "General Manager", "club": "Sherwood Country Club", "email": "roosterhuis@sherwoodcc.com", "hooks": "Sherwood's Jack Nicklaus signature course events host active member tennis, pool, and golf socials", "short": "Sherwood CC", "type": "reply"},
    {"name": "Craig Higgins", "title": "General Manager", "club": "Seattle Golf Club", "email": "chiggins@seattlegolfclub.com", "hooks": "Seattle Golf Club's Pacific Northwest forest setting hosts memorable member tournaments all summer", "short": "Seattle Golf Club", "type": "demo"},
    {"name": "General Manager", "title": "General Manager", "club": "Broadmoor Golf Club", "email": "info@broadmoorgolfclub.com", "hooks": "Broadmoor's active community galas and member tournaments generate continuous photo sharing", "short": "Broadmoor GC", "type": "demo"},
    {"name": "John Clagett", "title": "General Manager", "club": "Dallas National Golf Club", "email": "jclagett@dallasnationalgolf.com", "hooks": "Dallas National's bluff-top course events bring out Texas's top member golf competitions", "short": "Dallas National", "type": "demo"},
    {"name": "General Manager", "title": "General Manager", "club": "Seminole Golf Club", "email": "info@seminolegolfclub.org", "hooks": "Seminole's oceanfront Donald Ross layout events host iconic member-guest weekends every winter", "short": "Seminole Golf Club", "type": "reply"}
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
        "club": lead['club'],
        "email": lead['email'],
        "subject": subject,
        "url": url
    })

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>50 Gmail One-Click Compose Launcher</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7f9fa; color: #1f2937; padding: 30px; margin: 0; }}
    .container {{ max-width: 900px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 30px; }}
    h1 {{ font-size: 24px; color: #0f1828; margin-top: 0; }}
    p {{ color: #4b5563; font-size: 14px; line-height: 1.5; }}
    .grid {{ display: grid; gap: 12px; margin-top: 20px; }}
    .card {{ display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa; }}
    .card:hover {{ background: #f3f4f6; border-color: #d1d5db; }}
    .meta {{ display: flex; flex-direction: column; gap: 2px; }}
    .meta strong {{ font-size: 15px; color: #111827; }}
    .meta span {{ font-size: 13px; color: #6b7280; }}
    .meta small {{ font-size: 12px; color: #059669; font-weight: 600; }}
    .btn {{ background: #0f1828; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }}
    .btn:hover {{ background: #1f2937; }}
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 50 Gmail One-Click Outreach Launcher</h1>
    <p>Click <strong>"Compose in Gmail"</strong> next to any lead below. It will open Chrome directly to your Gmail compose window with the <strong>To</strong> address, <strong>Subject</strong>, and <strong>Rewritten Copy</strong> pre-filled!</p>
    <div class="grid">
      {"".join([f'''
      <div class="card">
        <div class="meta">
          <strong>#{item["id"]} {item["name"]} — {item["club"]}</strong>
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

print("Successfully created public/open_gmail_drafts.html!")
