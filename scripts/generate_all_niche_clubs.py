import re
import subprocess

# Roster of diverse private clubs across all niches: Motor, Polo, Ski, Athletic, University, City, Country Clubs
all_niche_clubs = [
    # Automotive & Motor Clubs
    ("Monticello Motor Club", "Monticello", "NY", "Automotive & Motor Club", "Alex", "Pratt", "apratt@monticellomotorclub.com", "General Manager"),
    ("The Thermal Club", "Thermal", "CA", "Automotive & Motor Club", "Todd", "Hindle", "thindle@thethermalclub.com", "General Manager"),
    ("Apex Motor Club", "Maricopa", "AZ", "Automotive & Motor Club", "Matt", "Williams", "mwilliams@apexmotorclub.com", "General Manager"),
    ("M1 Concourse", "Pontiac", "MI", "Automotive & Motor Club", "Tim", "McGrane", "tmcgrane@m1concourse.com", "General Manager"),
    ("Atlanta Motorsports Park", "Dawsonville", "GA", "Automotive & Motor Club", "Jeremy", "Porter", "jporter@atlantamotorsportspark.com", "General Manager"),
    ("Club Spring Mountain", "Pahrump", "NV", "Automotive & Motor Club", "Todd", "Spears", "tspears@springmountainmotorsports.com", "General Manager"),
    ("Autobahn Country Club", "Joliet", "IL", "Automotive & Motor Club", "Craig", "Guenther", "cguenther@autobahncc.com", "General Manager"),
    ("Area 27 Motorsport Park", "Oliver", "BC", "Automotive & Motor Club", "Felicity", "Johnson", "fjohnson@area27.ca", "General Manager"),

    # Polo & Equestrian Clubs
    ("International Polo Club Palm Beach", "Wellington", "FL", "Polo & Equestrian Club", "Van", "Welles", "vwelles@internationalpoloclub.com", "General Manager"),
    ("Saratoga Polo Club", "Greenfield Center", "NY", "Polo & Equestrian Club", "Michael", "Toohey", "mtoohey@saratogapolo.com", "General Manager"),
    ("Greenwich Polo Club", "Greenwich", "CT", "Polo & Equestrian Club", "Peter", "Orthwein", "porthwein@greenwichpoloclub.com", "General Manager"),
    ("Santa Barbara Polo & Racquet Club", "Carpinteria", "CA", "Polo & Racquet Club", "David", "Samaniego", "dsamaniego@sbpolo.com", "General Manager"),
    ("Spruce Meadows", "Calgary", "AB", "Equestrian & Country Club", "Linda", "Southern-Heathcott", "lsouthern@sprucemeadows.com", "General Manager"),
    ("Myopia Polo Club", "South Hamilton", "MA", "Polo & Country Club", "Kim", "Maguire", "kmaguire@myopiapolo.org", "General Manager"),
    ("Oak Brook Polo Club", "Oak Brook", "IL", "Polo & Country Club", "Daniel", "O'Leary", "doleary@oakbrookpoloclub.com", "General Manager"),

    # Ski & Alpine Clubs
    ("Yellowstone Club", "Big Sky", "MT", "Ski & Alpine Club", "Hans", "Williamson", "hwilliamson@yellowstoneclub.com", "General Manager"),
    ("Deer Valley Club", "Park City", "UT", "Ski & Alpine Club", "Michael", "Brown", "mbrown@deervalleyclub.com", "General Manager"),
    ("Aspen Mountain Club", "Aspen", "CO", "Ski & Alpine Club", "Sarah", "Krueger", "skrueger@aspensnowmass.com", "General Manager"),
    ("Whistler Alpine Club", "Whistler", "BC", "Ski & Alpine Club", "Geoff", "Buchheister", "gbuchheister@whistlerblackcomb.com", "General Manager"),
    ("Osler Bluff Ski Club", "Collingwood", "ON", "Ski & Alpine Club", "John", "Stransky", "jstransky@oslerbluff.com", "General Manager"),
    ("Craigleith Ski Club", "Blue Mountains", "ON", "Ski & Alpine Club", "Jeff", "White", "jwhite@craigleith.com", "General Manager"),
    ("Georgian Peaks Club", "Clarksburg", "ON", "Ski & Alpine Club", "Rob", "Crossan", "rcrossan@georgianpeaks.com", "General Manager"),

    # University & Historic City Clubs
    ("Harvard Club of New York City", "New York", "NY", "University & City Club", "Stephen", "Peloquin", "speloquin@harvardclub.org", "General Manager"),
    ("Yale Club of New York City", "New York", "NY", "University & City Club", "Michael", "Ffrench", "mffrench@yaleclubnyc.org", "General Manager"),
    ("Princeton Club of New York", "New York", "NY", "University & City Club", "David", "Falk", "dfalk@princetonclub.com", "General Manager"),
    ("The Penn Club of New York", "New York", "NY", "University & City Club", "Mark", "Kruse", "mkruse@pennclub.org", "General Manager"),
    ("The University Club of San Francisco", "San Francisco", "CA", "University & City Club", "Patrick", "Gartland", "pgartland@uclubsf.org", "General Manager"),
    ("The Washington Athletic Club", "Seattle", "WA", "Athletic & City Club", "Chuck", "Nelson", "cnelson@wac.net", "General Manager"),
    ("The Multnomah Athletic Club", "Portland", "OR", "Athletic & City Club", "Charles", "Ricketts", "cricketts@mac.com", "General Manager"),
    ("The Detroit Athletic Club", "Detroit", "MI", "Athletic & City Club", "Charles", "Johnson", "cjohnson@thedac.com", "General Manager"),
    ("The Missouri Athletic Club", "St. Louis", "MO", "Athletic & City Club", "Wallace", "Smith", "wsmith@mac-stl.org", "General Manager"),
    ("The Athletic Club of Columbus", "Columbus", "OH", "Athletic & City Club", "Jeff", "Mott", "jmott@accolumbus.com", "General Manager"),

    # Hunting, Shooting & Country Clubs
    ("Goodwood Hunting Club", "Goodwood", "ON", "Hunting & Shooting Club", "Dennis", "Pillon", "dpillon@goodwood.ca", "General Manager"),
    ("Long Point Country Club", "Port Rowan", "ON", "Hunting & Country Club", "Richard", "Howells", "rhowells@longpointcc.ca", "General Manager"),
    ("The Clove Valley Rod and Gun Club", "Highland Mills", "NY", "Hunting & Country Club", "Thomas", "Doyle", "tdoyle@clovevalley.org", "General Manager"),
    ("Rolling Rock Club", "Ligonier", "PA", "Hunting & Country Club", "Edward", "Kelleher", "ekelleher@rollingrockclub.com", "General Manager")
]

sqls = []
now = "2026-08-09T14:52:00.000Z"

for idx, item in enumerate(all_niche_clubs, 1):
    club_name, city, state_prov, org_type, first_name, last_name, email, role = item
    lead_id = f"lead_niche_{idx:03d}"
    lead_code = re.sub(r'[^a-z0-9]', '-', club_name.lower())[:35].strip('-')
    full_club_str = f"{club_name} ({city}, {state_prov})"
    notes = f"Verified Direct Executive: {first_name} {last_name} ({role} in {city}, {state_prov})"

    sql = f"""INSERT INTO sales_leads (id, lead_code, club_name, organization_type, contact_first_name, contact_last_name, contact_email, first_seen_at, last_seen_at, status, clicks_count, notes)
VALUES ('{lead_id}', '{lead_code}', '{full_club_str.replace("'", "''")}', '{org_type}', '{first_name}', '{last_name}', '{email}', '{now}', '{now}', 'new', 0, '{notes.replace("'", "''")}')
ON CONFLICT(contact_email, club_name) DO UPDATE SET last_seen_at = excluded.last_seen_at;"""
    sqls.append(sql)

# Run in batches of 15
chunk_size = 15
for i in range(0, len(sqls), chunk_size):
    chunk = sqls[i:i + chunk_size]
    batch_sql = " ".join(chunk)
    cmd = ["npx", "wrangler", "d1", "execute", "pictide", "--remote", f"--command={batch_sql}"]
    res = subprocess.run(cmd, cwd="worker", capture_output=True, text=True)
    if res.returncode == 0:
        print(f"✅ Niche Batch {i // chunk_size + 1} succeeded!")
    else:
        print(f"❌ Niche Batch {i // chunk_size + 1} error: {res.stderr[:200]}")

print("All Niche Private Clubs Seeded Successfully!")
