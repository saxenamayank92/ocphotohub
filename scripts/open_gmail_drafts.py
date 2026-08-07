#!/usr/bin/env python3
import urllib.parse
import sys

drafts = [
    {
        "to": "pholleran@nationalgolfclub.com",
        "subject": "Member photos at The National",
        "body": """Hi Patrick,

I noticed The National runs a pretty active calendar of championship member tournaments.

Club PhotoHub is a private, club-branded photo feed for member clubs that collects and organizes event photos without public social media or scattered email attachments.

I put together a 60-second interactive preview here:
👉 https://clubphotohub.com/app?demo=1

If it looks relevant, I'd be happy to show you what a private sample workspace could look like branded for The National.

Mayank Saxena
mayank.saxena@xtide.io
https://clubphotohub.com

--
xTide Apps / Club PhotoHub
Acton, ON L7J 1H3, Canada
Reply unsubscribe to opt out."""
    },
    {
        "to": "jnasso@thethornhillclub.ca",
        "subject": "Quick question for The Thornhill Club",
        "body": """Hi Joseph,

I noticed Thornhill hosts an active calendar of member socials and golf/curling tournaments.

We built Club PhotoHub to give member clubs their own private, branded photo feed without public social media or scattered email attachments.

Would something like this be useful for The Thornhill Club?

Just reply yes and I'll send over a quick 60-second overview.

Mayank Saxena
mayank.saxena@xtide.io
https://clubphotohub.com

--
xTide Apps / Club PhotoHub
Acton, ON L7J 1H3, Canada
Reply unsubscribe to opt out."""
    },
    {
        "to": "dallen@islingtongolfclub.com",
        "subject": "Member photos at Islington",
        "body": """Hi Dave,

I noticed Islington's Stanley Thompson course events bring out great member turnouts during summer socials.

Club PhotoHub is a private, club-branded photo feed for member clubs that collects and organizes event photos without public social media or scattered email attachments.

I put together a 60-second interactive preview here:
👉 https://clubphotohub.com/app?demo=1

If it looks relevant, I'd be happy to show you what a private sample workspace could look like branded for Islington Golf Club.

Mayank Saxena
mayank.saxena@xtide.io
https://clubphotohub.com

--
xTide Apps / Club PhotoHub
Acton, ON L7J 1H3, Canada
Reply unsubscribe to opt out."""
    },
    {
        "to": "ksuddaby@bayviewclub.com",
        "subject": "Member photos at Bayview",
        "body": """Hi Kimberly,

I noticed Bayview's multi-sport calendar spanning golf, tennis and curling generates continuous member photos.

Club PhotoHub is a private, club-branded photo feed for member clubs that collects and organizes event photos without public social media or scattered email attachments.

I put together a 60-second interactive preview here:
👉 https://clubphotohub.com/app?demo=1

If it looks relevant, I'd be happy to show you what a private sample workspace could look like branded for Bayview.

Mayank Saxena
mayank.saxena@xtide.io
https://clubphotohub.com

--
xTide Apps / Club PhotoHub
Acton, ON L7J 1H3, Canada
Reply unsubscribe to opt out."""
    },
    {
        "to": "jwyatt@creditvalleybf.com",
        "subject": "Quick question for Credit Valley",
        "body": """Hi Jason,

I noticed Credit Valley's river-valley clubhouse events host large member turnouts every summer.

We built Club PhotoHub to give member clubs their own private, branded photo feed without public social media or scattered email attachments.

Would something like this be useful for Credit Valley?

Just reply yes and I'll send over a quick 60-second overview.

Mayank Saxena
mayank.saxena@xtide.io
https://clubphotohub.com

--
xTide Apps / Club PhotoHub
Acton, ON L7J 1H3, Canada
Reply unsubscribe to opt out."""
    }
]

def make_gmail_url(to, subject, body):
    params = {
        'view': 'cm',
        'fs': '1',
        'tf': '1',
        'to': to,
        'su': subject,
        'body': body
    }
    return f"https://mail.google.com/mail/u/0/?{urllib.parse.urlencode(params)}"

if __name__ == '__main__':
    print("=== Gmail Direct Compose Links ===")
    for i, d in enumerate(drafts, 1):
        url = make_gmail_url(d['to'], d['subject'], d['body'])
        print(f"\n[{i}] {d['to']} ({d['subject']})")
        print(f"URL: {url}")
